import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderPreview() {
  const container = $('#preview-schema-container');
  if (!container) return;

  if (!state.draft) {
    container.innerHTML = '<p class="muted">Ожидание загрузки данных…</p>';
    return;
  }

  const cfg = state.draft.config;
  const dims = state.draft.dimensions || {};
  const dimNames = Object.keys(dims);

  // --- 1. Отрисовка Strips (Фильтров) ---
  const strips = cfg.stripDimensions || [];
  let stripsHtml = '';

  if (strips.length === 0) {
    stripsHtml = `<div class="schema-strip"><span class="muted" style="font-size:12px;">Нет активных фильтров</span></div>`;
  } else {
    stripsHtml = strips.map(dimName => {
      const def = dims[dimName];
      const items = def?.items || {};
      const slugs = Object.keys(items).slice(0, 5);
      const hasMore = Object.keys(items).length > 5;

      const chips = slugs.map(s =>
        `<span class="dim-badge">${escapeHtml(items[s].title || s)}</span>`
      ).join('');

      const more = hasMore ? `<span class="dim-badge">…</span>` : '';
      const empty = slugs.length === 0 ? `<span class="dim-badge empty">(пусто)</span>` : '';

      return `
        <div class="schema-strip">
          <span class="schema-strip-label">${escapeHtml(dimName)}:</span>
          <div style="display:flex; gap:4px; flex-wrap:wrap;">${chips}${more}${empty}</div>
        </div>`;
    }).join('');
  }

  // --- 2. Отрисовка Grid (Сетки) ---
  const rowDim = cfg.rowDimension;
  const colDim = cfg.columnDimension;

  let gridHtml = '';
  if (!rowDim || !colDim || !dims[rowDim] || !dims[colDim]) {
    gridHtml = `<div class="schema-strip"><span class="muted">Оси (Row/Column) не настроены</span></div>`;
  } else {
    const rowItems = Object.keys(dims[rowDim].items || {}).slice(0, 3);
    const colItems = Object.keys(dims[colDim].items || {}).slice(0, 3);

    let thead = `<tr><th class="corner"></th>`;
    colItems.forEach(c => {
      thead += `<th>${escapeHtml(dims[colDim].items[c]?.title || c)}</th>`;
    });
    if (Object.keys(dims[colDim].items || {}).length > 3) thead += `<th>…</th>`;
    thead += `</tr>`;

    let tbody = '';
    rowItems.forEach(r => {
      tbody += `<tr><th>${escapeHtml(dims[rowDim].items[r]?.title || r)}</th>`;
      colItems.forEach((c, i) => {
        const hasData = r === rowItems[0] && c === colItems[0];
        tbody += `<td><div class="schema-cell ${hasData ? 'has-data' : ''}">${hasData ? '● ●' : '·'}</div></td>`;
      });
      if (Object.keys(dims[colDim].items || {}).length > 3) tbody += `<td class="schema-cell">·</td>`;
      tbody += `</tr>`;
    });

    gridHtml = `
      <div class="schema-title">Сетка: ${escapeHtml(rowDim)} × ${escapeHtml(colDim)}</div>
      <div class="schema-table-container">
        <table class="schema-table">
          <thead>${thead}</thead>
          <tbody>${tbody}</tbody>
        </table>
      </div>
    `;
  }

  // --- 3. Легенда ---
  const legendBadges = dimNames.map(d => {
    let roleClass = 'role-none';
    let roleText = 'unused';
    if (d === rowDim) { roleClass = 'role-row'; roleText = 'row'; }
    else if (d === colDim) { roleClass = 'role-col'; roleText = 'col'; }
    else if (strips.includes(d)) { roleClass = 'role-strip'; roleText = 'strip'; }

    return `<span class="dim-badge ${roleClass}">${escapeHtml(d)} (${roleText})</span>`;
  }).join('');

  // --- Сборка ---
  container.innerHTML = `
    <div class="dim-card is-open" style="margin-top: 8px;">
      <div class="dim-header" style="cursor: default;">
        <span class="dim-name" style="font-size: 14px;">${escapeHtml(cfg.title || 'Feature Map')}</span>
        <span class="muted" style="font-size: 11px; margin-left: 8px;">(${escapeHtml(cfg.sectionType || 'Page')})</span>
      </div>
      <div class="dim-body">
        <div style="margin-bottom: 16px;">
          ${stripsHtml}
        </div>
        ${gridHtml}
        <div class="schema-legend" style="margin-top: 16px;">
          ${legendBadges}
        </div>
      </div>
    </div>
  `;
}