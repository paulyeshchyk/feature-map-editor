import { clone } from './utils.js';

export const state = {
  draft: null, catalog: null, paths: null, warnings: [], baseline: null,
};

export const expandedDims = new Set();
export const expandedFields = new Set();
export const dimTabs = new Map();

export function applyInit(msg) {
  if (!msg?.state?.draft) return;
  state.draft = msg.state.draft;
  state.catalog = msg.state.catalog;
  state.paths = msg.state.paths;
  state.warnings = msg.state.warnings || [];
  state.baseline = clone(msg.state.draft);
}

export function markSaved() { state.baseline = clone(state.draft); }
export function resetToBaseline() { if (!state.baseline) return false; state.draft = clone(state.baseline); return true; }
export function isLoaded() { return state.draft !== null; }