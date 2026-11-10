import { state } from './state.js';
import { $, escapeHtml } from './utils.js';

export function renderValidation() {
  const host = $('#validation-list');
  if (!host) return;

  const warnings = state.warnings || [];

  if (warnings.length === 0) {
    host.innerHTML = `<li style="border-left-color: var(--vscode-testing-iconPassed, #4caf50); background: rgba(76, 175, 80, 0.1);">
      ✅ Ошибок не обнаружено. Конфигурация выглядит корректной.
    </li>`;
    return;
  }

  host.innerHTML = warnings.map(w => {
    // Определяем тип: ошибка или предупреждение
    const isWarn = w.includes('fallback') || w.includes('не задано') || w.includes('warning') || w.includes('Внимание');
    return `<li class="${isWarn ? 'warning' : 'error'}">
      ${escapeHtml(w)}
    </li>`;
  }).join('');
}