import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FeatureMapConfig } from './feature-map.types.ts';

/**
 * Конфиг feature-map по умолчанию (поведение 1:1 с оригиналом).
 *
 * ⚠️ Step 4: этот объект станет основой override'а через `--config`.
 * Любое поле с `@configurable` (см. types) может быть переопределено.
 *
 * При изменении значений — прогони `57.1.*` (генератор) и `57.2.*` (инжектор).
 * Изменение `outputPathTemplate` / `moduleHrefAnchor` ломает существующие
 * ссылки в сгенерированных `feature-map.md`.
 */
export const DEFAULT_FEATURE_MAP_CONFIG: FeatureMapConfig = {
    outputPathTemplate: '{lang}/Модули/FM/feature-map.md',
    moduleHrefAnchor: 'naznachenie',
    moduleHrefTemplate: '/{docsRootRel}/{dir}/index.html#{anchor}',
    stripDimensions: ['actor', 'capability'],
    stripLabels: {
        actor: 'Actor',
        capability: 'Capability',
    },
    rowDimension: 'family',
    columnDimension: 'layer',
    dimToFieldMap: {
        actor: 'actors',
        capability: 'capabilities',
        layer: 'layers',
        family: 'families',
    },
    title: 'Feature Map',
    sectionType: 'Page',
    counterPlaceholder: 'Показано: —',
    resetButtonText: 'Сбросить все',
    emptyCellSymbol: '·',
    chipLabelField: 'ident',
};


/**
 * Загружает конфиг feature-map из JSON-файла, накатывая его поверх
 * `DEFAULT_FEATURE_MAP_CONFIG`.
 *
 * Семантика merge — **shallow на верхнем уровне**: любой ключ из JSON
 * заменяет значение из дефолта целиком. Например, чтобы переопределить
 * `stripLabels`, нужно задать **весь** объект нужных подписей; частичный
 * merge не делается (см. 57.4#N).
 *
 * Неизвестные ключи в JSON не падают — пишется `console.warn`. Это
 * forward-compat: старая версия может принимать конфиг от новой.
 *
 * @param configPath — абсолютный или относительный (от `cwd`) путь к JSON.
 *                     `null` / `undefined` / `''` → дефолт без чтения файла.
 */
export function loadFeatureMapConfig(
    configPath: string | null | undefined,
): FeatureMapConfig {
    if (!configPath) return { ...DEFAULT_FEATURE_MAP_CONFIG };

    const resolved = path.resolve(configPath);
    const raw = JSON.parse(fs.readFileSync(resolved, 'utf8')) as Record<string, unknown>;

    const knownKeys = new Set(Object.keys(DEFAULT_FEATURE_MAP_CONFIG));
    for (const k of Object.keys(raw)) {
        if (!knownKeys.has(k)) {
            console.warn(`[feature-map] unknown config key "${k}" — ignored`);
        }
    }

    // Отбрасываем неизвестные ключи — чтобы они случайно не попали в результат
    const knownRaw: Record<string, unknown> = {};
    for (const k of knownKeys) {
        if (k in raw) knownRaw[k] = raw[k];
    }

    return { ...DEFAULT_FEATURE_MAP_CONFIG, ...knownRaw } as FeatureMapConfig;
}