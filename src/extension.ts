import * as vscode from 'vscode';
import { EditorPanel } from './editorPanel';

export function activate(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('featureMap.openEditor', () =>
      EditorPanel.createOrShow(ctx.extensionUri)),

    vscode.commands.registerCommand('featureMap.generate', async () => {
      const panel = EditorPanel.createOrShow(ctx.extensionUri);
      // Дадим панели инициализироваться и запустим generate
      await panel.triggerGenerate();
    }),
  );
}

export function deactivate() { /* dispose через panel */ }