import { clone } from './utils.js';

export const state = {
  draft: null, catalog: null, paths: null, warnings: [], baseline: null,
  projectName: '', isNative: false
};

export const expandedDims = new Set();
export const expandedFields = new Set();
export const dimTabs = new Map();

export function applyInit(msg) {
  if (!msg?.state?.draft) return;
  state.draft = msg.state.draft;

  // --- АВТО-ИСЦЕЛЕНИЕ КОНФИГА ---
  const dims = state.draft.dimensions || {};
  const cfg = state.draft.config;
  const dimNames = Object.keys(dims);

  // 1. Чистим оси, если размерность удалена или пуста
  if (cfg.rowDimension && !dims[cfg.rowDimension]) cfg.rowDimension = '';
  if (cfg.columnDimension && !dims[cfg.columnDimension]) cfg.columnDimension = '';

  // 2. Если пусто, но размерности есть — выбираем первую попавшуюся
  if (!cfg.rowDimension && dimNames.length > 0) {
    cfg.rowDimension = dimNames[0];
  }
  if (!cfg.columnDimension && dimNames.length > 0) {
    cfg.columnDimension = dimNames.length > 1 ? dimNames[1] : dimNames[0];
  }

  // 3. Чистим Strip-фильтры от удаленных размерностей
  if (Array.isArray(cfg.stripDimensions)) {
    cfg.stripDimensions = cfg.stripDimensions.filter(s => dims[s]);
  }

  // 4. Чистим dimToFieldMap от "мусора"
  if (cfg.dimToFieldMap) {
    for (const k of Object.keys(cfg.dimToFieldMap)) {
      if (!dims[k]) delete cfg.dimToFieldMap[k];
    }
  }
  // ------------------------------

  state.catalog = msg.state.catalog;
  state.paths = msg.state.paths;
  state.warnings = msg.state.warnings || [];
  // Baseline делаем ПОСЛЕ очистки, чтобы при нажатии Reset возвращаться к рабочему состоянию
  state.baseline = clone(state.draft);
  state.projectName = msg.state.projectName;
  state.isNative = msg.state.isNative;
}

export function markSaved() { state.baseline = clone(state.draft); }
export function resetToBaseline() { if (!state.baseline) return false; state.draft = clone(state.baseline); return true; }
export function isLoaded() { return state.draft !== null; }