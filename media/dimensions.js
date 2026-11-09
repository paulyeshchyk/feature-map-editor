import { $, escapeHtml } from './utils.js';
import { askUser, confirmAsync, post } from './vscode-api.js';
import { state, expandedDims, dimTabs } from './state.js';


export function renderDimensions() {
  const host = $('#dims-list');
  if (!host) return;
  host.innerHTML = '';
  if (!state.draft) return;

  const cfg = state.draft.config;
  const entries = Object.entries(state.draft.dimensions || {});

  if (entries.length === 0) {
    host.innerHTML = '<p class="muted">Нет размерностей. Нажмите «+ Добавить размерность».</p>';
    return;
  }

  for (const [dimName, def] of entries) {
    const items  = def.items || {};
    const count  = Object.keys(items).length;
    const isOpen = expandedDims.has(dimName);
    const fieldVal = cfg.dimToFieldMap[dimName] ?? '';
    const cols = def.columns || [];
    const activeTab = dimTabs.get(dimName) || 'general';

    // --- Содержимое вкладки General ---
    const generalHtml = `
      <div class="dim-field-row" style="margin-bottom: 12px;">
        <label style="width: 100px; flex-shrink: 0;">Title:</label>
        <input data-f="title" value="${escapeHtml(def.title || '')}" placeholder="(опционально, для UI)">
      </div>
      <div class="dim-field-row" style="margin-bottom: 12px;">
        <label for="field-${escapeHtml(dimName)}" style="width: 100px; flex-shrink: 0;">dimToFieldMap:</label>
        <input id="field-${escapeHtml(dimName)}"
               data-cfg-map="${escapeHtml(dimName)}"
               value="${escapeHtml(fieldVal)}"
               placeholder="(не задан)">
      </div>
    `;

    // --- Содержимое вкладки Columns ---
    const colsMarkup = cols.length === 0
      ? '<p class="muted">Нет колонок. Добавьте колонки для отображения таблиц в render-modules.</p>'
      : `<table class="cols-table">
          <thead><tr><th class="col-actions"></th><th>label</th><th>field</th></tr></thead>
          <tbody>
            ${cols.map((c, i) => `
              <tr data-col-idx="${i}">
                <td class="col-actions">
                  <button class="small danger" data-act="del-col" data-idx="${i}" title="Удалить колонку">🗑</button>
                </td>
                <td><input data-col="label" value="${escapeHtml(c.label || '')}" placeholder="ID"></td>
                <td><input data-col="field" value="${escapeHtml(c.field || '')}" placeholder="id"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>`;
    
    const colsHtml = `
      ${colsMarkup}
      <div style="margin-top: 8px;">
        <button class="small" data-act="add-col">+ колонка</button>
      </div>
    `;

    // --- Содержимое вкладки Items ---
    const itemsMarkup = count === 0
      ? '<p class="muted">Нет значений. Нажмите «+ значение», чтобы добавить.</p>'
      : `<table class="items-table">
          <thead><tr>
            <th class="col-actions"></th>
            <th>slug</th>
            <th>title</th>
            <th>dir</th>
          </tr></thead>
          <tbody>
            ${Object.entries(items).map(([slug, item]) => `
              <tr data-slug="${escapeHtml(slug)}">
                <td class="col-actions">
                  <button class="small danger" data-act="del-item" title="Удалить значение">🗑</button>
                </td>
                <td><input data-field="__slug" value="${escapeHtml(slug)}"
                           spellcheck="false" autocomplete="off"></td>
                <td><input data-field="title" value="${escapeHtml(item.title ?? '')}"></td>
                <td><input data-field="dir" value="${escapeHtml(item.dir ?? '')}" placeholder="(опционально)"></td>
              </tr>`).join('')}
          </tbody>
        </table>`;

    const itemsHtml = `
      ${itemsMarkup}
      <div class="dim-actions" style="justify-content: flex-start; margin-top: 8px;">
        <button class="small" data-act="add-item">+ значение</button>
      </div>
    `;

    const card = document.createElement('div');
    card.className = 'dim-card' + (isOpen ? ' is-open' : '');
    card.dataset.dim = dimName;
    
    card.innerHTML = `
      <div class="dim-header" role="button" tabindex="0" aria-expanded="${isOpen}">
        <span class="dim-chevron">▶</span>
        <span class="dim-name">${escapeHtml(dimName)}</span>
        <div class="dim-header-actions">
          <button class="small ghost" data-act="rename-dim" title="Переименовать размерность">✏️</button>
          <button class="small danger" data-act="del-dim" title="Удалить размерность">🗑</button>
        </div>
      </div>
      <div class="dim-body">
        <div class="dim-subtabs">
          <button class="dim-subtab-btn ${activeTab === 'general' ? 'active' : ''}" data-subtab="general">General</button>
          <button class="dim-subtab-btn ${activeTab === 'columns' ? 'active' : ''}" data-subtab="columns">Columns</button>
          <button class="dim-subtab-btn ${activeTab === 'items' ? 'active' : ''}" data-subtab="items">Items (${count})</button>
        </div>
        <div class="dim-subtab-content ${activeTab === 'general' ? 'active' : ''}" data-subtab-content="general">
          ${generalHtml}
        </div>
        <div class="dim-subtab-content ${activeTab === 'columns' ? 'active' : ''}" data-subtab-content="columns">
          ${colsHtml}
        </div>
        <div class="dim-subtab-content ${activeTab === 'items' ? 'active' : ''}" data-subtab-content="items">
          ${itemsHtml}
        </div>
      </div>`;
    host.appendChild(card);
  }
}

export function attachDimensionsHandlers() {
  const host = $('#dims-list');
  if (!host) return;

  // Обработка кликов
  host.addEventListener('click', async (e) => {
    // 1. Переключение под-вкладок
    const subtabBtn = e.target.closest('.dim-subtab-btn');
    if (subtabBtn) {
      const card = subtabBtn.closest('.dim-card');
      const dim = card.dataset.dim;
      const tab = subtabBtn.dataset.subtab;
      
      dimTabs.set(dim, tab);
      
      // Меняем классы без полного ре-рендера
      card.querySelectorAll('.dim-subtab-btn').forEach(btn => btn.classList.toggle('active', btn === subtabBtn));
      card.querySelectorAll('.dim-subtab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.subtabContent === tab);
      });
      return;
    }

    // 2. Сворачивание/разворачивание
    const header = e.target.closest('.dim-header');
    if (header && !e.target.closest('button')) {
      const card = header.closest('.dim-card');
      const dim  = card.dataset.dim;
      const open = expandedDims.has(dim);
      if (open) expandedDims.delete(dim); else expandedDims.add(dim);
      card.classList.toggle('is-open', !open);
      header.setAttribute('aria-expanded', String(!open));
      return;
    }

    // 3. Кнопки действий
    const t = e.target.closest('button');
    if (!t) return;
    const act  = t.dataset.act;
    const card = t.closest('.dim-card');
    const dim  = card?.dataset.dim;

    if (act === 'add-item')      await onAddItem(dim);
    else if (act === 'del-dim')  await onDeleteDim(dim);
    else if (act === 'del-item') onDeleteItem(dim, t.closest('tr')?.dataset.slug);
    else if (act === 'rename-dim') await onRenameDim(dim);
    else if (act === 'add-col') {
      const def = state.draft.dimensions[dim];
      if (!def.columns) def.columns = [];
      def.columns.push({ label: '', field: '' });
      renderDimensions();
    }
    else if (act === 'del-col') {
      const idx = parseInt(t.dataset.idx, 10);
      const def = state.draft.dimensions[dim];
      if (def.columns && def.columns[idx]) {
        def.columns.splice(idx, 1);
        renderDimensions();
      }
    }
  });

  // Обработка изменений в инпутах (change)
  host.addEventListener('change', (e) => {
    const card = e.target.closest('.dim-card');
    if (!card) return;
    const dim = card.dataset.dim;
    const def = state.draft.dimensions[dim];
    if (!def) return;

    // Title
    if (e.target.dataset.f === 'title') {
      const val = e.target.value.trim();
      if (val) def.title = val; else delete def.title;
      return;
    }

    // dimToFieldMap
    if (e.target.dataset.cfgMap !== undefined) {
      onFieldMapChange(dim, e.target.value);
      return;
    }

    // Columns (label, field)
    if (e.target.dataset.col) {
      const tr = e.target.closest('tr');
      const idx = parseInt(tr.dataset.colIdx, 10);
      const colType = e.target.dataset.col;
      if (def.columns && def.columns[idx]) {
        def.columns[idx][colType] = e.target.value;
      }
      return;
    }

    // Items (slug, title, dir)
    const inp = e.target.closest('input[data-field]');
    if (!inp) return;
    const tr = inp.closest('tr');
    onItemFieldChange(dim, tr?.dataset.slug, inp.dataset.field, inp.value);
  });

  host.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.dim-header');
    if (header) { e.preventDefault(); header.click(); }
  });
}

async function onRenameDim(oldName) {
  const newName = await askUser(
    `Новое имя (slug) для размерности "${oldName}":`, oldName
  );
  if (!newName) return;
  const name = newName.trim();
  if (!name || name === oldName) return;

  if (state.draft.dimensions[name]) {
    post({ type: 'error', message: `Размерность "${name}" уже существует` });
    return;
  }

  const cfg  = state.draft.config;
  const dims = state.draft.dimensions;

  // 1. Переименовать ключ с сохранением порядка
  const ordered = {};
  for (const [k, v] of Object.entries(dims)) {
    ordered[k === oldName ? name : k] = v;
  }
  state.draft.dimensions = ordered;

  // 2. config.*
  if (cfg.rowDimension    === oldName) cfg.rowDimension    = name;
  if (cfg.columnDimension === oldName) cfg.columnDimension = name;
  if (Array.isArray(cfg.stripDimensions)) {
    cfg.stripDimensions = cfg.stripDimensions.map(x => x === oldName ? name : x);
  }
  if (cfg.dimToFieldMap[oldName] !== undefined) {
    cfg.dimToFieldMap[name] = cfg.dimToFieldMap[oldName];
    delete cfg.dimToFieldMap[oldName];
  }

  // 3. fields[].dimension
  if (state.draft.fields) {
    for (const f of Object.values(state.draft.fields)) {
      if (f && f.dimension === oldName) f.dimension = name;
    }
  }

  // 4. состояние раскрытия
  if (expandedDims.has(oldName)) {
    expandedDims.delete(oldName);
    expandedDims.add(name);
  }

  renderDimensions();
  window.dispatchEvent(new CustomEvent('fm:dims-changed'));
}

async function onAddItem(dim) {
  const slug = await askUser(`slug нового значения для "${dim}":`);
  if (!slug) return;
  const items = (state.draft.dimensions[dim].items ??= {});
  if (items[slug]) {
    post({ type: 'error', message: `Значение "${slug}" уже существует в "${dim}"` });
    return;
  }
  items[slug] = { title: slug };
  renderDimensions();
}

async function onDeleteDim(dim) {
  const ok = await confirmAsync(
    `Удалить размерность "${dim}" и все её значения? Оси, в которых она используется, будут очищены.`
  );
  if (!ok) return;

  const cfg = state.draft.config;
  if (cfg.rowDimension    === dim) cfg.rowDimension    = '';
  if (cfg.columnDimension === dim) cfg.columnDimension = '';
  if (Array.isArray(cfg.stripDimensions)) {
    cfg.stripDimensions = cfg.stripDimensions.filter(x => x !== dim);
  }
  delete cfg.dimToFieldMap[dim];
  delete state.draft.dimensions[dim];
  expandedDims.delete(dim);

  renderDimensions();
  window.dispatchEvent(new CustomEvent('fm:dims-changed'));
}

function onDeleteItem(dim, slug) {
  if (!slug) return;
  const items = state.draft.dimensions[dim]?.items;
  if (!items) return;
  delete items[slug];
  renderDimensions();
}

function onFieldMapChange(dim, value) {
  const v = value.trim();
  const map = state.draft.config.dimToFieldMap;
  if (v) map[dim] = v; else delete map[dim];
  renderDimensions();
}

function onItemFieldChange(dim, slug, field, value) {
  const items = state.draft.dimensions[dim]?.items;
  if (!items || !slug) return;

  if (field === '__slug') {
    const newSlug = value.trim();
    if (newSlug === slug) return;
    if (!newSlug) {
      post({ type: 'error', message: 'slug не может быть пустым' });
      renderDimensions(); return;
    }
    if (items[newSlug]) {
      post({ type: 'error', message: `slug "${newSlug}" уже существует в "${dim}"` });
      renderDimensions(); return;
    }
    // Переименование с сохранением порядка
    const ordered = {};
    for (const [k, v] of Object.entries(items)) ordered[k === slug ? newSlug : k] = v;
    state.draft.dimensions[dim].items = ordered;
    renderDimensions();
    return;
  }

  items[slug][field] = value;
}