import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderPreview() {
  const container = $('#preview-schema-container');
  const warningsHost = $('#preview-warnings');
  if (!container || !warningsHost) return;

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
      const slugs = Object.keys(items).slice(0, 5); // Берем первые 5 для примера
      const hasMore = Object.keys(items).length > 5;

      const chips = slugs.map(s =>
        `<span class="schema-chip">${escapeHtml(items[s].title || s)}</span>`
      ).join('');

      const more = hasMore ? `<span class="schema-chip">…</span>` : '';
      const empty = slugs.length === 0 ? `<span class="schema-chip empty">(пусто)</span>` : '';

      return `
        <div class="schema-strip">
          <span class="schema-strip-label">${escapeHtml(dimName)}:</span>
          ${chips}${more}${empty}
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

    // Заголовки колонок
    let thead = `<tr><th class="corner"></th>`;
    colItems.forEach(c => {
      thead += `<th>${escapeHtml(dims[colDim].items[c]?.title || c)}</th>`;
    });
    if (Object.keys(dims[colDim].items || {}).length > 3) thead += `<th>…</th>`;
    thead += `</tr>`;

    // Тело таблицы
    let tbody = '';
    rowItems.forEach(r => {
      tbody += `<tr><th>${escapeHtml(dims[rowDim].items[r]?.title || r)}</th>`;
      colItems.forEach((c, i) => {
        // Имитируем наличие модулей (например, в первой ячейке)
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

  // --- 3. Легенда (Все размерности) ---
  const legendBadges = dimNames.map(d => {
    let roleClass = 'role-none';
    let roleText = 'unused';
    if (d === rowDim) { roleClass = 'role-row'; roleText = 'row'; }
    else if (d === colDim) { roleClass = 'role-col'; roleText = 'col'; }
    else if (strips.includes(d)) { roleClass = 'role-strip'; roleText = 'strip'; }

    return `<span class="legend-badge ${roleClass}">${escapeHtml(d)} (${roleText})</span>`;
  }).join('');

  // --- Сборка ---
  container.innerHTML = `
    <div class="schema-wrapper">
      <div class="schema-title">
        ${escapeHtml(cfg.title || 'Feature Map')} 
        <span style="font-size: 11px; font-weight: normal; opacity: 0.6;">(${escapeHtml(cfg.sectionType || 'Page')})</span>
      </div>
      
      <!-- Фильтры -->
      <div style="margin-bottom: 16px;">
        ${stripsHtml}
      </div>

      <!-- Сетка -->
      ${gridHtml}

      <!-- Легенда -->
      <div class="schema-legend">
        ${legendBadges}
      </div>
    </div>
  `;

  // --- 4. Предупреждения (Warnings) ---
  const warnings = state.warnings || [];
  if (warnings.length === 0) {
    warningsHost.innerHTML = `<li class="muted">Ошибок не обнаружено.</li>`;
  } else {
    warningsHost.innerHTML = warnings.map(w => {
      // Простая эвристика: если начинается с ⚠ или содержит слово "fallback" — это warning, иначе error
      const isWarn = w.includes('fallback') || w.includes('не задано') || w.includes('warning');
      return `<li class="${isWarn ? 'warning' : 'error'}">${escapeHtml(w)}</li>`;
    }).join('');
  }
}