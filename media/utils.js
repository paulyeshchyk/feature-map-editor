export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export function setStatus(text, kind) {
  const el = $('#status');
  if (!el) return;
  el.textContent = text;
  el.style.color = kind === 'error' ? 'var(--vscode-errorForeground)'
    : kind === 'ok' ? 'var(--vscode-testing-iconPassed, #4caf50)'
      : '';
}