import { renderAxes } from './axes.js';
import { attachDimensionsHandlers, renderDimensions } from './dimensions.js';
import { renderFilters } from './filters.js';
import { renderPreview } from './preview.js';
import { renderSettings } from './settings.js';
import { applyInit, isLoaded, markSaved } from './state.js';
import { attachToolbarHandlers } from './toolbar.js';
import { $$, setStatus } from './utils.js';
import { post } from './vscode-api.js';
import { renderFields, attachFieldsHandlers } from './fields.js';


function renderAll() {
  renderFields();
  renderDimensions();
  renderAxes();
  renderFilters();
  renderSettings();
  renderPreview();
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
      setStatus(`Ошибка: ${msg.issues.length} проблем(ы)`, 'error');
      console.error('[fm-editor] validation issues:', msg.issues);
      // Показать в Preview → Warnings
      const wl = document.querySelector('#preview-warnings');
      if (wl) {
        wl.innerHTML = msg.issues.map(i =>
          `<li style="color:var(--vscode-errorForeground)">
            [${i.code}] ${escapeHtml(i.message)}
          </li>`).join('');
      }
      return;
    }
    if (msg.type === 'generated') { setStatus(msg.message, msg.ok ? 'ok' : 'error'); return; }
    if (msg.type === 'error') { setStatus(msg.message, 'error'); return; }
  });
}

// Реакция на изменения размерностей — из любого модуля
window.addEventListener('fm:dims-changed', () => {
  renderFields();renderAxes(); renderFilters(); renderSettings(); renderPreview();
});

function bootstrap() {
  initTabs(); initMessageBridge();
  attachFieldsHandlers()
  attachDimensionsHandlers(); attachToolbarHandlers();
  if (!isLoaded()) setStatus('Ожидание инициализации…');
  post({ type: 'ready' });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();