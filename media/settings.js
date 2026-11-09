import { renderPreview } from './preview.js';
import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderSettings() {
  if (!state.draft) return;
  const c = state.draft.config;
  const host = $('#settings-form');
  if (!host) return;
  const fields = [
    ['title', 'Заголовок'], ['sectionType', 'sectionType'],
    ['chipLabelField', 'chipLabelField'], ['emptyCellSymbol', 'emptyCellSymbol'],
    ['counterPlaceholder', 'counterPlaceholder'], ['resetButtonText', 'resetButtonText'],
    ['moduleHrefAnchor', 'moduleHrefAnchor'], ['outputPathTemplate', 'outputPathTemplate'],
  ];
  host.innerHTML = fields.map(([k, l]) => `
    <label>${escapeHtml(l)} <input data-cfg="${k}" value="${escapeHtml(String(c[k] ?? ''))}"></label>`).join('');
  for (const inp of host.querySelectorAll('input')) {
    inp.onchange = (e) => {
      c[e.target.dataset.cfg] = e.target.value;
      renderPreview();
    };
  }
}