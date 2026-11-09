// acquireVsCodeApi() можно вызвать ровно один раз на Webview — прячем в модуль.
const api = (typeof acquireVsCodeApi === 'function')
  ? acquireVsCodeApi()
  : { postMessage: () => { }, getState: () => undefined, setState: () => { } };

export function post(message) { api.postMessage(message); }

// ── request/response мост ──────────────────────────────────
const pending = new Map();
let counter = 0;
function requestId() {
  counter += 1;
  return 'req-' + counter + '-' + Math.random().toString(36).slice(2, 8);
}

export function askUser(message, defaultValue = '') {
  const id = requestId();
  console.log('[fm-editor] → prompt', id, message);
  return new Promise((resolve) => {
    pending.set(id, { resolve });
    post({ type: 'prompt', id, message, defaultValue });
  });
}

export function confirmAsync(message) {
  const id = requestId();
  console.log('[fm-editor] → confirm', id, message);
  return new Promise((resolve) => {
    pending.set(id, { resolve });
    post({ type: 'confirm', id, message });
  });
}

window.addEventListener('message', (e) => {
  const m = e.data;
  if (!m || !m.type) return;
  if (m.type === 'promptResult' && pending.has(m.id)) {
    console.log('[fm-editor] ← promptResult', m.id, m.value);
    const { resolve } = pending.get(m.id);
    pending.delete(m.id);
    resolve(m.value ?? null);
  }
  if (m.type === 'confirmResult' && pending.has(m.id)) {
    console.log('[fm-editor] ← confirmResult', m.id, m.confirmed);
    const { resolve } = pending.get(m.id);
    pending.delete(m.id);
    resolve(Boolean(m.confirmed));
  }
});