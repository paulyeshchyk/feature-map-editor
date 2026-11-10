import * as yaml from 'js-yaml';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { discoverProjectRoot, loadAll, resolveProject, saveAll } from './config';
import type {
  EditorDraft, EditorState, ExtensionMessage, WebviewMessage
} from './protocol';
import { validateDraft } from './validate';

type PromptMsg = Extract<WebviewMessage, { type: 'prompt' }>;
type ConfirmMsg = Extract<WebviewMessage, { type: 'confirm' }>;


export class EditorPanel {
  static current: EditorPanel | undefined;
  static readonly viewType = 'featureMap.editor';

  private disposables: vscode.Disposable[] = [];

  static createOrShow(extensionUri: vscode.Uri): EditorPanel {
    const col = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
    if (EditorPanel.current) { EditorPanel.current.panel.reveal(col); return EditorPanel.current; }
    const panel = vscode.window.createWebviewPanel(
      EditorPanel.viewType, 'Feature Map Editor', col,
      {
        enableScripts: true, retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      },
    );
    EditorPanel.current = new EditorPanel(panel, extensionUri);
    return EditorPanel.current;
  }

  private state: EditorState | null = null;

  private constructor(private readonly panel: vscode.WebviewPanel, private readonly extensionUri: vscode.Uri) {
    this.panel.webview.html = this.renderHtml();
    this.panel.webview.onDidReceiveMessage(m => this.onMessage(m).catch(err =>
      this.post({ type: 'error', message: String(err?.message ?? err) })), null, this.disposables);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private async onMessage(msg: WebviewMessage): Promise<void> {
    switch (msg.type) {
      case 'ready': return this.refresh();
      case 'save': return this.save(msg.draft);
      case 'reset': return this.refresh();
      case 'generate': return this.generate();
      case 'openFile': return this.openFile(msg.file);
      case 'pickProjectRoot': return this.pickProjectRoot();
      case 'prompt': return this.handlePrompt(msg);   // msg: PromptMsg
      case 'confirm': return this.handleConfirm(msg);  // msg: ConfirmMsg
    }
  }

  private async handlePrompt(msg: PromptMsg): Promise<void> {
    const value = await vscode.window.showInputBox({
      prompt: msg.message,
      value: msg.defaultValue ?? '',
    });
    this.post({ type: 'promptResult', id: msg.id, value: value ?? null });
  }

  private async handleConfirm(msg: ConfirmMsg): Promise<void> {
    const choice = await vscode.window.showWarningMessage(
      msg.message,
      { modal: true },
      'Удалить',
      'Отмена',
    );
    this.post({ type: 'confirmResult', id: msg.id, confirmed: choice === 'Удалить' });
  }

  private async resolveRoot(): Promise<string | null> {
    const cfg = vscode.workspace.getConfiguration('featureMap');
    const explicit = (cfg.get<string>('docsProjectRoot') ?? '').trim();
    if (explicit) return explicit;
    const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!ws) return null;
    return discoverProjectRoot(ws);
  }

  private async refresh(): Promise<void> {
    const root = await this.resolveRoot();
    if (!root) {
      this.post({ type: 'error', message: 'Не найден корень проекта (нет .yfm или ./_registry). Задайте featureMap.docsProjectRoot.' });
      return;
    }

    const lang = vscode.workspace.getConfiguration('featureMap').get<string>('lang') || 'ru';
    const project = resolveProject(root, lang);

    // Вся логика сборки стейта теперь внутри loadAll
    this.state = loadAll(project);
    this.state.uiLang = vscode.env.language;

    this.post({ type: 'init', state: this.state });
  }

  private async save(draft: EditorDraft): Promise<void> {
    if (!this.state) return this.post({ type: 'error', message: 'Состояние не загружено' });
    
    const issues = validateDraft(draft);
    const errors = issues.filter(i => i.level === 'error');
    if (errors.length) return this.post({ type: 'saveError', issues });

    let writeYfm = false;

    if (!this.state.isNative) {
      const choice = await vscode.window.showWarningMessage(
        'Настройки проекта не найдены в .yfm. Дополнить .yfm новыми понятиями?',
        { modal: true },
        'Дополнить yfm',
        'Только файлы конфигурации'
      );
      
      if (choice === 'Дополнить yfm') {
        writeYfm = true;
      } else if (choice !== 'Только файлы конфигурации') {
        // Если пользователь нажал Esc или закрыл окно — сообщаем фронтенду
        this.post({ type: 'error', message: 'Сохранение отменено пользователем' });
        return; 
      }
    }

    try {
      saveAll(this.state.paths, draft, { 
        config: this.state.unknownConfigKeys, 
        layout: this.state.unknownLayoutKeys 
      });

      if (writeYfm) {
        this.updateYfm();
      }

      await this.refresh(); // Перечитываем с диска (отправит init)
      
      // Отправляем подтверждение
      this.post({ type: 'saved', ok: true, warnings: issues.filter(i => i.level === 'warning').map(i => i.message) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.post({ type: 'error', message: `Ошибка сохранения: ${msg}` });
    }
  }

  private updateYfm() {
    if (!this.state) return;
    const root = this.state.paths.projectRoot;
    const yfmNames = ['.yfm', 'yfm-config.yaml', 'yfm-config.yml'];
    let yfmPath = '';
    for (const name of yfmNames) {
      const p = path.join(root, name);
      if (fs.existsSync(p)) { yfmPath = p; break; }
    }
    if (!yfmPath) yfmPath = path.join(root, '.yfm'); // Создаем если нет

    let yfm: any = {};
    if (fs.existsSync(yfmPath)) {
      try { yfm = yaml.load(fs.readFileSync(yfmPath, 'utf8')) || {}; } catch (e) {}
    }

    // Формируем пути относительного корня проекта
    const rel = (p: string) => path.relative(root, p).replace(/\\/g, '/');
    const paths = this.state.paths;

    yfm.py_feature_map = {
      projectName: this.state.projectName,
      config: rel(paths.configPath),
      layout: rel(paths.layoutPath),
      fields: rel(paths.fieldsPath),
      dimensions: rel(paths.dimensionsPath),
      catalog: rel(paths.catalogPath),
    };

    fs.writeFileSync(yfmPath, yaml.dump(yfm, { lineWidth: 120, noRefs: true }), 'utf8');
  }

  private async openFile(file: 'config' | 'layout' | 'fields' | 'dimensions' | 'catalog'): Promise<void> {
    if (!this.state) return;
    const map = {
      config: this.state.paths.configPath, layout: this.state.paths.layoutPath,
      fields: this.state.paths.fieldsPath, dimensions: this.state.paths.dimensionsPath,
      catalog: this.state.paths.catalogPath,
    };
    const uri = vscode.Uri.file(map[file]);
    await vscode.window.showTextDocument(uri);
  }

  private async pickProjectRoot(): Promise<void> {
    const picked = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, openLabel: 'Выбрать корень проекта' });
    if (!picked?.length) return;
    await vscode.workspace.getConfiguration('featureMap')
      .update('docsProjectRoot', picked[0].fsPath, vscode.ConfigurationTarget.Workspace);
    await this.refresh();
  }

  private async generate(): Promise<void> {
    if (!this.state) return;
    const cliPath = path.join(this.state.paths.projectRoot,
      vscode.workspace.getConfiguration('featureMap').get<string>('cliPath') || 'plugins/diplodoc-helper-cli.js');
    const lang = vscode.workspace.getConfiguration('featureMap').get<string>('lang') || 'ru';
    try {
      const term = vscode.window.createTerminal('Feature Map Generate');
      term.show();
      term.sendText(`node "${cliPath}" emitFeatureMap --lang=${lang}`);
      this.post({ type: 'generated', ok: true, message: `Запущено: emitFeatureMap --lang=${lang}` });
    } catch (e) {
      this.post({ type: 'generated', ok: false, message: String((e as Error).message) });
    }
  }

  private post(msg: ExtensionMessage): void { void this.panel.webview.postMessage(msg); }

  private renderHtml(): string {
    const nonce = crypto.randomBytes(16).toString('base64');
    const media = (f: string) => this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', f)
    ).toString();

    const fs = require('node:fs') as typeof import('node:fs');
    let html = fs.readFileSync(
      path.join(this.extensionUri.fsPath, 'media', 'index.html'), 'utf8'
    );

    html = html.replace(/\{\{nonce\}\}/g, nonce)
      .replace(/\{\{cspSource\}\}/g, this.panel.webview.cspSource)   // ← ЭТА СТРОКА
      .replace(/\{\{style\}\}/g, media('style.css'))
      .replace(/\{\{script\}\}/g, media('main.js'));
    return html;
  }

  dispose(): void {
    EditorPanel.current = undefined;
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.panel.dispose();
  }

  public async triggerGenerate(): Promise<void> {
    if (!this.state) {
      vscode.window.showWarningMessage('Feature Map Editor ещё не загружен. Откройте панель и повторите.');
      return;
    }
    return this.generate();
  }
}