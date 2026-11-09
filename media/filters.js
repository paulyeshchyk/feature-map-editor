import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderFilters() {
  if (!state.draft) return;
  const tbody = $('#empty-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const layout     = state.draft.layout;
  const includeAll = layout.includeEmpty === true;
  const perDim     = Array.isArray(layout.includeEmpty) ? layout.includeEmpty : null;
  const globalLabel = typeof layout.emptyLabel === 'string' ? layout.emptyLabel : '';
  const labels      = (typeof layout.emptyLabel === 'object' && layout.emptyLabel !== null)
                        ? layout.emptyLabel : {};

  for (const d of Object.keys(state.draft.dimensions || {})) {
    const enabled      = includeAll || (perDim && perDim.includes(d));
    const currentLabel = labels[d] !== undefined ? labels[d] : globalLabel;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${escapeHtml(d)}</code></td>
      <td><input type="checkbox" ${enabled ? 'checked' : ''}></td>
      <td><input data-filter-label="${escapeHtml(d)}"
                 value="${escapeHtml(currentLabel)}"
                 placeholder="Без значения"></td>`;

    tr.querySelector('input[type=checkbox]').onchange = (e) => {
      const cur = state.draft.layout.includeEmpty;
      const current = cur === true
        ? Object.keys(state.draft.dimensions)
        : Array.isArray(cur) ? cur : [];
      const set = new Set(current);
      if (e.target.checked) set.add(d); else set.delete(d);
      state.draft.layout.includeEmpty = Array.from(set);
    };

    tr.querySelector('input[data-filter-label]').onchange = (e) => {
      const lay = state.draft.layout;
      const dim = e.target.dataset.filterLabel;
      // Переносим глобальный label в объект (чтобы остальные dims не потеряли значение)
      if (typeof lay.emptyLabel !== 'object' || lay.emptyLabel === null) {
        const promoted = {};
        if (typeof lay.emptyLabel === 'string' && lay.emptyLabel) {
          for (const key of Object.keys(state.draft.dimensions)) {
            promoted[key] = lay.emptyLabel;
          }
        }
        lay.emptyLabel = promoted;
      }
      lay.emptyLabel[dim] = e.target.value;
    };

    tbody.appendChild(tr);
  }
}