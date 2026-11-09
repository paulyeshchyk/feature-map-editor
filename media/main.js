import { renderAxes } from './axes.js';
import { attachDimensionsHandlers, renderDimensions } from './dimensions.js';
import { renderFilters } from './filters.js';
import { renderPreview } from './preview.js';
import { renderSettings } from './settings.js';
import { applyInit, isLoaded, markSaved } from './state.js';
import { attachToolbarHandlers } from './toolbar.js';
import { $$, setStatus } from './utils.js';
import { post } from './vscode-api.js';

function renderAll() {
  renderDimensions(); renderAxes(); renderFilters(); renderSettings(); renderPreview();
}

function initTabs() {
  $$('.tabs button').forEach(btn => {
    btn.onclick = () => {
      $$('.tabs button').forEach(b => b.classList.toggle('active', b === btn));
      $$('[data-tab-content]').forEach(s => { s.hidden = s.dataset.tabContent !== btn.dataset.tab; });
    };
  });
}

function initMessageBridge() {
  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || !msg.type) return;
    if (msg.type === 'init' || msg.type === 'stateRefreshed') {
      applyInit(msg); setStatus('Загружено', 'ok'); renderAll();
      return;
    }
    if (msg.type === 'saved') { markSaved(); setStatus('Сохранено', 'ok'); return; }
    if (msg.type === 'saveError') {
      setStatus('Ошибка валидации', 'error');
      console.error('[fm-editor] validation issues:', msg.issues);
      post({ type: 'error', message: (msg.issues || []).map(i => `[${i.code}] ${i.message}`).join('\n') });
      return;
    }
    if (msg.type === 'generated') { setStatus(msg.message, msg.ok ? 'ok' : 'error'); return; }
    if (msg.type === 'error') { setStatus(msg.message, 'error'); return; }
  });
}

// Реакция на изменения размерностей — из любого модуля
window.addEventListener('fm:dims-changed', () => {
  renderAxes(); renderFilters(); renderSettings(); renderPreview();
});

function bootstrap() {
  initTabs(); initMessageBridge();
  attachDimensionsHandlers(); attachToolbarHandlers();
  if (!isLoaded()) setStatus('Ожидание инициализации…');
  post({ type: 'ready' });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();