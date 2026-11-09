import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderFilters() {
  if (!state.draft) return;
  const tbody = $('#empty-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const layout = state.draft.layout;
  const includeAll = layout.includeEmpty === true;
  const perDim = Array.isArray(layout.includeEmpty) ? layout.includeEmpty : null;
  const labels = (typeof layout.emptyLabel === 'object' && layout.emptyLabel) || {};

  for (const d of Object.keys(state.draft.dimensions || {})) {
    const enabled = includeAll || (perDim && perDim.includes(d));
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${escapeHtml(d)}</code></td>
      <td><input type="checkbox" ${enabled ? 'checked' : ''}></td>
      <td><input value="${escapeHtml(labels[d] ?? '')}" placeholder="Без значения"></td>`;

    tr.querySelector('input[type=checkbox]').onchange = (e) => {
      const cur = state.draft.layout.includeEmpty;
      const current = cur === true
        ? Object.keys(state.draft.dimensions)
        : Array.isArray(cur) ? cur : [];
      const set = new Set(current);
      if (e.target.checked) set.add(d); else set.delete(d);
      state.draft.layout.includeEmpty = Array.from(set);
    };

    tr.querySelector('input:not([type])').onchange = (e) => {
      const lay = state.draft.layout;
      if (typeof lay.emptyLabel !== 'object') lay.emptyLabel = {};
      lay.emptyLabel[d] = e.target.value;
    };

    tbody.appendChild(tr);
  }
}