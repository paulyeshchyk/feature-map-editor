import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderPreview() {
  if (!state.draft) return;
  const c = state.draft.config;
  const cat = state.catalog;
  const dims = Object.keys(state.draft.dimensions || {});
  const rows = dims.includes(c.rowDimension)
    ? Object.keys(state.draft.dimensions[c.rowDimension].items || {}) : [];
  const cols = dims.includes(c.columnDimension)
    ? Object.keys(state.draft.dimensions[c.columnDimension].items || {}) : [];

  const sum = $('#preview-summary');
  if (sum) sum.innerHTML = `
    <p><strong>Сетка:</strong> ${escapeHtml(c.rowDimension)} × ${escapeHtml(c.columnDimension)} (${rows.length}×${cols.length})</p>
    <p><strong>Strips:</strong> ${(c.stripDimensions ?? []).map(escapeHtml).join(', ') || '—'}</p>
    <p><strong>Заголовок:</strong> ${escapeHtml(c.title)}</p>
    <p><strong>catalog:</strong> ${cat ? Object.keys(cat.modules || {}).length + ' модулей' : 'не загружен'}</p>`;

  const wl = $('#preview-warnings');
  if (wl) wl.innerHTML = (state.warnings || []).map(w => `<li>${escapeHtml(w)}</li>`).join('');
}