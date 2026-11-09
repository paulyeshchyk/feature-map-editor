import { expandedDims, state } from './state.js';
import { $, escapeHtml } from './utils.js';
import { askUser, confirmAsync, post } from './vscode-api.js';

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
    const items = def.items || {};
    const count = Object.keys(items).length;
    const isOpen = expandedDims.has(dimName);
    const fieldVal = cfg.dimToFieldMap[dimName] ?? '';

    const roles = [];
    if (cfg.rowDimension === dimName)
      roles.push('<span class="dim-badge role-row" title="Row dimension">row</span>');
    if (cfg.columnDimension === dimName)
      roles.push('<span class="dim-badge role-col" title="Column dimension">col</span>');
    if ((cfg.stripDimensions ?? []).includes(dimName))
      roles.push('<span class="dim-badge role-strip" title="Strip dimension">strip</span>');

    const countBadge = count === 0
      ? '<span class="dim-badge empty" title="Нет значений">empty</span>'
      : `<span class="dim-badge" title="${count} значений">${count}</span>`;

    const fieldBadge = fieldVal
      ? `<span class="dim-badge field" title="dimToFieldMap → ${escapeHtml(fieldVal)}">→ ${escapeHtml(fieldVal)}</span>`
      : '<span class="dim-badge empty" title="dimToFieldMap не задан">no field</span>';

    const itemsMarkup = count === 0
      ? '<p class="muted">Нет значений.</p>'
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

    const card = document.createElement('div');
    card.className = 'dim-card' + (isOpen ? ' is-open' : '');
    card.dataset.dim = dimName;
    card.innerHTML = `
      <div class="dim-header" role="button" tabindex="0" aria-expanded="${isOpen}">
        <span class="dim-chevron">▶</span>
        <span class="dim-name">${escapeHtml(dimName)}</span>
        ${countBadge}
        ${roles.join('')}
        ${fieldBadge}
      </div>
      <div class="dim-body">
        <div class="dim-field-row">
          <label for="field-${escapeHtml(dimName)}">dimToFieldMap:</label>
          <input id="field-${escapeHtml(dimName)}"
                 data-cfg-map="${escapeHtml(dimName)}"
                 value="${escapeHtml(fieldVal)}"
                 placeholder="(не задан)">
        </div>
        ${itemsMarkup}
        <div class="dim-actions">
          <button class="small" data-act="add-item">+ значение</button>
          <button class="small danger" data-act="del-dim">🗑 удалить размерность</button>
        </div>
      </div>`;
    host.appendChild(card);
  }
}

export function attachDimensionsHandlers() {
  const host = $('#dims-list');
  if (!host) return;

  host.addEventListener('click', async (e) => {
    const header = e.target.closest('.dim-header');
    if (header && !e.target.closest('button')) {
      const card = header.closest('.dim-card');
      const dim = card.dataset.dim;
      const open = expandedDims.has(dim);
      if (open) expandedDims.delete(dim); else expandedDims.add(dim);
      card.classList.toggle('is-open', !open);
      header.setAttribute('aria-expanded', String(!open));
      return;
    }

    const t = e.target.closest('button');
    if (!t) return;
    const act = t.dataset.act;
    const card = t.closest('.dim-card');
    const dim = card?.dataset.dim;

    if (act === 'add-item') await onAddItem(dim);
    else if (act === 'del-dim') await onDeleteDim(dim);
    else if (act === 'del-item') onDeleteItem(dim, t.closest('tr')?.dataset.slug);
  });

  host.addEventListener('change', (e) => {
    if (e.target.dataset.cfgMap !== undefined) {
      onFieldMapChange(e.target.dataset.cfgMap, e.target.value);
      return;
    }
    const inp = e.target.closest('input[data-field]');
    if (!inp) return;
    const card = inp.closest('.dim-card');
    const tr = inp.closest('tr');
    onItemFieldChange(card?.dataset.dim, tr?.dataset.slug, inp.dataset.field, inp.value);
  });

  host.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const header = e.target.closest('.dim-header');
    if (header) { e.preventDefault(); header.click(); }
  });
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
  if (cfg.rowDimension === dim) cfg.rowDimension = '';
  if (cfg.columnDimension === dim) cfg.columnDimension = '';
  if (Array.isArray(cfg.stripDimensions)) cfg.stripDimensions = cfg.stripDimensions.filter(x => x !== dim);
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