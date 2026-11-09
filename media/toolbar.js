import { renderAxes } from './axes.js';
import { renderDimensions } from './dimensions.js';
import { renderFilters } from './filters.js';
import { renderPreview } from './preview.js';
import { renderSettings } from './settings.js';
import { expandedDims, resetToBaseline, state } from './state.js';
import { $, setStatus } from './utils.js';
import { askUser, post } from './vscode-api.js';

export function attachToolbarHandlers() {
  const save = $('#btn-save');
  if (save) save.onclick = () => {
    if (!state.draft) return;
    setStatus('Сохранение…');
    post({ type: 'save', draft: state.draft });
  };

  const reset = $('#btn-reset');
  if (reset) reset.onclick = () => {
    if (!resetToBaseline()) return;
    setStatus('Откатено к baseline');
    renderDimensions(); renderAxes(); renderFilters(); renderSettings(); renderPreview();
  };

  const gen = $('#btn-generate');
  if (gen) gen.onclick = () => post({ type: 'generate' });

  const root = $('#btn-open-root');
  if (root) root.onclick = () => post({ type: 'pickProjectRoot' });

  const addDim = $('#btn-add-dim');
  if (addDim) addDim.onclick = async () => {
    if (!state.draft) return;
    const name = await askUser('Имя размерности (slug):');
    if (!name) return;
    if (state.draft.dimensions[name]) {
      post({ type: 'error', message: `Размерность "${name}" уже существует` });
      return;
    }
    state.draft.dimensions[name] = { items: {} };
    expandedDims.add(name);
    renderDimensions(); renderAxes(); renderFilters(); renderSettings();
  };
}