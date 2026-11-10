import { renderAxes } from './axes.js';
import { attachDimensionsHandlers, renderDimensions } from './dimensions.js';
import { attachFieldsHandlers, renderFields } from './fields.js';
import { renderFilters } from './filters.js';
import { setLanguage, t } from './i18n.js';
import { renderPreview } from './preview.js';
import { renderSettings } from './settings.js';
import { applyInit, isLoaded, markSaved } from './state.js';
import { attachToolbarHandlers } from './toolbar.js';
import { $$, setStatus } from './utils.js';
import { renderValidation } from './validation.js';
import { post } from './vscode-api.js';

function renderAll() {
  renderFields();
  renderDimensions();
  renderAxes();
  renderFilters();
  renderSettings();
  renderPreview();
  renderValidation();
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
      applyInit(msg);
      setLanguage(msg.state.uiLang);

      // Локализация вкладок
      document.querySelectorAll('.tabs button').forEach(btn => {
        const tabName = btn.dataset.tab;
        if (tabName && t(`tabs.${tabName}`) !== `tabs.${tabName}`) {
          btn.textContent = t(`tabs.${tabName}`);
          btn.title = t(`tabs.${tabName}`);
        }
      });

      const isFallback = !msg.state.isNative;
      setStatus(`Загружен: ${msg.state.projectName}`, isFallback ? 'error' : 'ok');
      renderAll();
      return;
    }

    if (msg.type === 'saved') {
      markSaved();
      setStatus('Сохранено', 'ok');
      return;
    }

    if (msg.type === 'saveError') {
      setStatus(`Ошибка: ${msg.issues.length} проблем(ы)`, 'error');
      console.error('[fm-editor] validation issues:', msg.issues);

      // Записываем ошибки прямо в state.warnings, чтобы validation.js их подхватил
      state.warnings = msg.issues.map(i => `[${i.code}] ${i.message}`);
      renderValidation();

      // Автоматически переключаемся на вкладку "Validation"
      const valTabBtn = document.querySelector('.tabs button[data-tab="validation"]');
      if (valTabBtn) valTabBtn.click();

      return;
    }

    if (msg.type === 'generated') { setStatus(msg.message, msg.ok ? 'ok' : 'error'); return; }
    if (msg.type === 'error') { setStatus(msg.message, 'error'); return; }
  });
}

// Реакция на изменения размерностей — из любого модуля
window.addEventListener('fm:dims-changed', () => {
  renderFields(); renderAxes(); renderFilters(); renderSettings(); renderPreview();
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