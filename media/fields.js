import { t } from './i18n.js';
import { expandedFields, state } from './state.js';
import { $, escapeHtml } from './utils.js';
import { askUser, confirmAsync, post } from './vscode-api.js';

export function renderFields() {
  const host = $('#fields-list');
  if (!host) return;
  host.innerHTML = '';
  if (!state.draft) return;

  const entries = Object.entries(state.draft.fields || {});
  const dimNames = Object.keys(state.draft.dimensions || {});

  if (entries.length === 0) {
    host.innerHTML = '<p class="muted">Нет полей. Нажмите «+ Добавить поле».</p>';
    return;
  }

  for (const [fieldKey, def] of entries) {
    const isOpen = expandedFields.has(fieldKey);
    const dim = def.dimension || '';

    const dimOptions = dimNames.map(d =>
      `<option value="${escapeHtml(d)}" ${d === dim ? 'selected' : ''}>${escapeHtml(d)}</option>`
    ).join('');
    const emptyDimOpt = `<option value="" ${!dim ? 'selected' : ''}>(не связана)</option>`;

    let pathHtml = '';
    if (def.source === 'path' || def.source === 'frontmatter-or-path') {
      const path = def.path || {};
      const isRules = Array.isArray(path.rules);

      pathHtml = `
        <div class="path-config" style="margin-top: 12px; padding: 12px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; background: rgba(255,255,255,0.02);">
          <div style="margin-bottom: 12px; display: flex; gap: 16px;">
            <label style="margin:0;"><input type="radio" name="path-type-${escapeHtml(fieldKey)}" value="regex" ${!isRules ? 'checked' : ''}> Regex + Template</label>
            <label style="margin:0;"><input type="radio" name="path-type-${escapeHtml(fieldKey)}" value="rules" ${isRules ? 'checked' : ''}> Rules (словарь)</label>
          </div>
          <div class="path-regex" style="display: ${isRules ? 'none' : 'flex'}; flex-direction: column; gap: 8px;">
            <label class="dim-field-row" style="margin:0;">
              <span style="width: 100px;" title="${t('hints.pathRegex')}">Regex:</span> 
              <input data-path="regex" value="${escapeHtml(path.regex || '')}" placeholder="Раздел(\\d+)" title="${t('hints.pathRegex')}">
            </label>
            <label class="dim-field-row" style="margin:0;">
              <span style="width: 100px;" title="${t('hints.pathTemplate')}">Template:</span> 
              <input data-path="template" value="${escapeHtml(path.template || '')}" placeholder="s$1" title="${t('hints.pathTemplate')}">
            </label>
          </div>
          <div class="path-rules" style="display: ${isRules ? 'block' : 'none'};">
            <table class="items-table" style="width: 100%;">
              <thead><tr>
                <th class="col-actions"></th>
                <th title="${t('hints.pathRuleRegex')}">Regex</th>
                <th title="${t('hints.pathRuleSlug')}">Slug</th>
                <th class="col-grow"></th>
              </tr></thead>
              <tbody>
                ${(path.rules || []).map((r, i) => `
                  <tr data-rule-idx="${i}">
                    <td class="col-actions">
                      <button class="small danger" data-act="del-rule" data-idx="${i}" title="Удалить правило">🗑</button>
                    </td>
                    <td><input data-rule="regex" value="${escapeHtml(r.regex || '')}" placeholder="АРМ\\s*Менеджера" title="${t('hints.pathRuleRegex')}"></td>
                    <td><input data-rule="slug" value="${escapeHtml(r.slug || '')}" placeholder="manager" title="${t('hints.pathRuleSlug')}"></td>
                    <td class="col-grow"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <button class="small" data-act="add-rule" style="margin-top: 8px;">+ правило</button>
          </div>
        </div>
      `;
    }

    const card = document.createElement('div');
    card.className = 'dim-card' + (isOpen ? ' is-open' : '');
    card.dataset.field = fieldKey;

    card.innerHTML = `
      <div class="dim-header" role="button" tabindex="0" aria-expanded="${isOpen}">
        <span class="dim-chevron">▶</span>
        <span class="dim-name">${escapeHtml(fieldKey)}</span>
        <div class="dim-header-actions">
          <button class="small ghost" data-act="rename-field" title="Переименовать поле">✏️</button>
          <button class="small danger" data-act="del-field" title="Удалить поле">🗑</button>
        </div>
      </div>
      <div class="dim-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin-bottom: 12px;">
          <label class="dim-field-row" style="margin:0;" title="${t('hints.fieldDim')}">
            <span style="width: 120px;">Dimension:</span>
            <select data-f="dimension">${emptyDimOpt}${dimOptions}</select>
          </label>
          <label class="dim-field-row" style="margin:0;" title="${t('hints.fieldDimField')}">
            <span style="width: 120px;">dimField:</span>
            <input data-f="dimField" value="${escapeHtml(def.dimField || '')}" placeholder="sections">
          </label>
          <label class="dim-field-row" style="margin:0;" title="${t('hints.fieldFrontmatter')}">
            <span style="width: 120px;">frontmatterKey:</span>
            <input data-f="frontmatterKey" value="${escapeHtml(def.frontmatterKey || '')}" placeholder="(совпадает)">
          </label>
          <label class="dim-field-row" style="margin:0;" title="${t('hints.fieldKind')}">
            <span style="width: 120px;">Kind:</span>
            <select data-f="kind">
              <option value="multi" ${def.kind === 'multi' ? 'selected' : ''}>multi</option>
              <option value="scalar" ${(!def.kind || def.kind === 'scalar') ? 'selected' : ''}>scalar</option>
            </select>
          </label>
          <label class="dim-field-row" style="margin:0;" title="${t('hints.fieldSource')}">
            <span style="width: 120px;">Source:</span>
            <select data-f="source">
              <option value="frontmatter" ${(!def.source || def.source === 'frontmatter') ? 'selected' : ''}>frontmatter</option>
              <option value="path" ${def.source === 'path' ? 'selected' : ''}>path</option>
              <option value="frontmatter-or-path" ${def.source === 'frontmatter-or-path' ? 'selected' : ''}>frontmatter-or-path</option>
            </select>
          </label>
          <label class="dim-field-row" style="margin:0;" title="${t('hints.fieldFormat')}">
            <span style="width: 120px;">Format:</span>
            <select data-f="format">
              <option value="" ${!def.format ? 'selected' : ''}>auto</option>
              <option value="plain" ${def.format === 'plain' ? 'selected' : ''}>plain</option>
              <option value="backtick" ${def.format === 'backtick' ? 'selected' : ''}>backtick</option>
              <option value="double" ${def.format === 'double' ? 'selected' : ''}>double</option>
            </select>
          </label>
        </div>
        ${pathHtml}
      </div>
    `;
    host.appendChild(card);
  }
}

export function attachFieldsHandlers() {
  const host = $('#fields-list');
  if (!host) return;

  host.addEventListener('click', async (e) => {
    const header = e.target.closest('.dim-header');
    if (header && !e.target.closest('button')) {
      const card = header.closest('.dim-card');
      const fieldKey = card.dataset.field;
      const open = expandedFields.has(fieldKey);
      if (open) expandedFields.delete(fieldKey); else expandedFields.add(fieldKey);
      card.classList.toggle('is-open', !open);
      header.setAttribute('aria-expanded', String(!open));
      return;
    }

    const t = e.target.closest('button');
    if (!t) return;
    const act = t.dataset.act;
    const card = t.closest('.dim-card');
    const fieldKey = card?.dataset.field;

    if (act === 'del-field') {
      const ok = await confirmAsync(`Удалить поле "${fieldKey}"?`);
      if (ok) {
        delete state.draft.fields[fieldKey];
        expandedFields.delete(fieldKey);
        renderFields();
      }
    } else if (act === 'rename-field') {
      const newName = await askUser(`Новое имя для поля "${fieldKey}":`, fieldKey);
      if (!newName) return;
      const name = newName.trim();
      if (!name || name === fieldKey) return;
      if (state.draft.fields[name]) {
        post({ type: 'error', message: `Поле "${name}" уже существует` });
        return;
      }
      const ordered = {};
      for (const [k, v] of Object.entries(state.draft.fields)) {
        ordered[k === fieldKey ? name : k] = v;
      }
      state.draft.fields = ordered;
      if (expandedFields.has(fieldKey)) {
        expandedFields.delete(fieldKey);
        expandedFields.add(name);
      }
      renderFields();
    } else if (act === 'add-rule') {
      const def = state.draft.fields[fieldKey];
      if (!def.path) def.path = {};
      if (!def.path.rules) def.path.rules = [];
      def.path.rules.push({ regex: '', slug: '' });
      renderFields();
    } else if (act === 'del-rule') {
      const idx = parseInt(t.dataset.idx, 10);
      const def = state.draft.fields[fieldKey];
      if (def.path && def.path.rules) {
        def.path.rules.splice(idx, 1);
        renderFields();
      }
    }
  });

  host.addEventListener('change', (e) => {
    const card = e.target.closest('.dim-card');
    if (!card) return;
    const fieldKey = card.dataset.field;
    const def = state.draft.fields[fieldKey];
    if (!def) return;

    // Радио-кнопки выбора типа экстрактора пути
    if (e.target.name && e.target.name.startsWith('path-type-')) {
      const type = e.target.value;
      if (!def.path) def.path = {};
      if (type === 'regex') {
        delete def.path.rules;
        if (!def.path.regex) def.path.regex = '';
        if (!def.path.template) def.path.template = '';
      } else {
        delete def.path.regex;
        delete def.path.template;
        if (!def.path.rules) def.path.rules = [];
      }
      renderFields();
      return;
    }

    if (e.target.dataset.path) {
      if (!def.path) def.path = {};
      def.path[e.target.dataset.path] = e.target.value;
      return;
    }

    if (e.target.dataset.rule) {
      const tr = e.target.closest('tr');
      const idx = parseInt(tr.dataset.ruleIdx, 10);
      if (def.path && def.path.rules && def.path.rules[idx]) {
        def.path.rules[idx][e.target.dataset.rule] = e.target.value;
      }
      return;
    }

    // Основные поля
    if (e.target.dataset.f) {
      const f = e.target.dataset.f;
      const val = e.target.value.trim();

      if (f === 'kind') {
        def.kind = val;
      } else if (f === 'source') {
        def.source = val;
        renderFields(); // Перерисовать, чтобы показать/скрыть блок path
      } else if (f === 'format') {
        if (val) def.format = val; else delete def.format;
      } else if (f === 'dimension') {
        if (val) def.dimension = val; else delete def.dimension;
        renderFields(); // Перерисовать бейджи
      } else {
        if (val) def[f] = val; else delete def[f];
      }
    }
  });

  host.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.dim-header');
    if (header) { e.preventDefault(); header.click(); }
  });
}