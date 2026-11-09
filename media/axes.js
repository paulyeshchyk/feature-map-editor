import { renderDimensions } from './dimensions.js';
import { state } from './state.js';
import { $ } from './utils.js';

export function renderAxes() {
  if (!state.draft) return;
  const dimNames = Object.keys(state.draft.dimensions || {});
  const cfg = state.draft.config;
  const rowSel = $('#sel-row'), colSel = $('#sel-col');
  if (!rowSel || !colSel) return;

  const fill = (sel, val) => {
    sel.innerHTML = '';
    for (const d of dimNames) {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      if (d === val) opt.selected = true;
      sel.appendChild(opt);
    }
  };
  fill(rowSel, cfg.rowDimension);
  fill(colSel, cfg.columnDimension);

  rowSel.onchange = () => { cfg.rowDimension = rowSel.value; renderAxes(); renderDimensions(); };
  colSel.onchange = () => { cfg.columnDimension = colSel.value; renderAxes(); renderDimensions(); };

  const host = $('#strips-list');
  if (!host) return;
  host.innerHTML = '';
  for (const d of dimNames) {
    if (d === cfg.rowDimension || d === cfg.columnDimension) continue;
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = (cfg.stripDimensions ?? []).includes(d);
    cb.onchange = () => {
      const set = new Set(cfg.stripDimensions ?? []);
      cb.checked ? set.add(d) : set.delete(d);
      cfg.stripDimensions = Array.from(set);
      renderDimensions();
    };
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + d));
    host.appendChild(label);
  }
}