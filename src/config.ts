import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEFAULT_FEATURE_MAP_CONFIG } from './imports/docs-registry/emit-feature-map/feature-map.constants'; // копия констант
import type {
  CatalogSnapshot,
  DimensionDef,
  EditorDraft, EditorState,
  FeatureMapConfig,
  FieldsManifest,
  LayoutConfig,
} from './protocol';

export interface ResolvedPaths {
  projectRoot: string;
  docsDir: string;
  registryDir: string;
  generatedDir: string;
  configPath: string;
  layoutPath: string;
  fieldsPath: string;
  dimensionsPath: string;
  catalogPath: string;
}

/** Автопоиск корня: ищем docs/_registry от workspaceFolder вверх. */
export function discoverProjectRoot(workspaceRoot: string): string | null {
  let cur = workspaceRoot;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(cur, 'docs', '_registry'))) return cur;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

export function resolvePaths(projectRoot: string, lang: string): ResolvedPaths {
  const docsDir = path.join(projectRoot, 'docs');
  const registryDir = path.join(docsDir, '_registry');
  const generatedDir = path.join(docsDir, '_generated');
  // dimensions: <lang>.yaml -> dimensions.yaml
  const langYaml = path.join(registryDir, `${lang}.yaml`);
  const sharedYaml = path.join(registryDir, 'dimensions.yaml');
  return {
    projectRoot, docsDir, registryDir, generatedDir,
    configPath: path.join(registryDir, 'feature-map.config.json'),
    layoutPath: path.join(registryDir, 'layout.json'),
    fieldsPath: path.join(registryDir, 'fields.yaml'),
    dimensionsPath: fs.existsSync(langYaml) ? langYaml : sharedYaml,
    catalogPath: path.join(generatedDir, `catalog.${lang}.json`),
  };
}

// ---- layout -----------------------------------------------------------

const DEFAULT_LAYOUT: LayoutConfig = {
  modulesFolder: 'Модули', modulePrefix: 'Модуль',
  moduleIndexFile: 'index.md', moduleSectionTypes: null,
  outFolder: 'Реестр', skipDirs: [],
  strictDimensions: true, includeEmpty: false, emptyLabel: 'Без значения',
};

function readLayout(file: string): { value: LayoutConfig; unknown: Record<string, unknown>; warnings: string[] } {
  const warnings: string[] = [];
  if (!fs.existsSync(file)) return { value: { ...DEFAULT_LAYOUT }, unknown: {}, warnings: ['layout.json не найден — используется дефолт'] };
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return { value: { ...DEFAULT_LAYOUT }, unknown: {}, warnings: [`layout.json: невалидный JSON (${(e as Error).message})`] }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { value: { ...DEFAULT_LAYOUT }, unknown: {}, warnings: ['layout.json: ожидался объект'] };
  }
  const src = raw as Record<string, unknown>;
  const known = new Set(Object.keys(DEFAULT_LAYOUT));
  const unknown: Record<string, unknown> = {};
  for (const k of Object.keys(src)) {
    if (!known.has(k)) { unknown[k] = src[k]; warnings.push(`layout.json: unknown key "${k}"`); }
  }
  const out: LayoutConfig = { ...DEFAULT_LAYOUT };
  const pick = <K extends keyof LayoutConfig>(k: K) => (k in src ? (src[k] as LayoutConfig[K]) : undefined);
  const mf = pick('modulesFolder'); if (mf !== undefined) out.modulesFolder = mf === null ? null : String(mf);
  const mp = pick('modulePrefix'); if (mp !== undefined) out.modulePrefix = mp === null ? null : String(mp);
  if ('moduleIndexFile' in src) out.moduleIndexFile = String(src.moduleIndexFile);
  if ('moduleSectionTypes' in src) out.moduleSectionTypes = Array.isArray(src.moduleSectionTypes) ? src.moduleSectionTypes.map(String) : null;
  if ('outFolder' in src) out.outFolder = String(src.outFolder);
  if ('skipDirs' in src) out.skipDirs = Array.isArray(src.skipDirs) ? src.skipDirs.map(String) : [];
  if ('strictDimensions' in src) out.strictDimensions = src.strictDimensions !== false;
  if ('includeEmpty' in src) out.includeEmpty = Array.isArray(src.includeEmpty) ? src.includeEmpty.map(String) : src.includeEmpty === true;
  if ('emptyLabel' in src) out.emptyLabel = src.emptyLabel as LayoutConfig['emptyLabel'];
  return { value: out, unknown, warnings };
}

// ---- feature-map.config.json -----------------------------------------

function readConfig(file: string): { value: FeatureMapConfig; unknown: Record<string, unknown>; warnings: string[] } {
  const warnings: string[] = [];
  if (!fs.existsSync(file)) return { value: { ...DEFAULT_FEATURE_MAP_CONFIG }, unknown: {}, warnings: ['feature-map.config.json не найден — используется дефолт'] };
  let raw: unknown;
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { return { value: { ...DEFAULT_FEATURE_MAP_CONFIG }, unknown: {}, warnings: [`feature-map.config.json: невалидный JSON (${(e as Error).message})`] }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { value: { ...DEFAULT_FEATURE_MAP_CONFIG }, unknown: {}, warnings: ['feature-map.config.json: ожидался объект'] };
  }
  const src = raw as Record<string, unknown>;
  const known = new Set(Object.keys(DEFAULT_FEATURE_MAP_CONFIG));
  const unknown: Record<string, unknown> = {};
  for (const k of Object.keys(src)) if (!known.has(k)) { unknown[k] = src[k]; warnings.push(`config: unknown key "${k}"`); }
  const knownRaw: Record<string, unknown> = {};
  for (const k of known) if (k in src) knownRaw[k] = src[k];
  return { value: { ...DEFAULT_FEATURE_MAP_CONFIG, ...knownRaw } as FeatureMapConfig, unknown, warnings };
}

// ---- fields.yaml / dimensions.yaml ----------------------------------

function readFields(file: string): { value: FieldsManifest; warnings: string[] } {
  if (!fs.existsSync(file)) return { value: {}, warnings: ['fields.yaml не найден'] };
  try {
    const raw = yaml.load(fs.readFileSync(file, 'utf8')) as any;
    if (!raw || typeof raw !== 'object' || !raw.fields) return { value: {}, warnings: ['fields.yaml: ожидался { fields: {...} }'] };
    return { value: raw.fields as FieldsManifest, warnings: [] };
  } catch (e) {
    return { value: {}, warnings: [`fields.yaml: ${(e as Error).message}`] };
  }
}

function readDimensions(file: string): { value: Record<string, DimensionDef>; warnings: string[] } {
  if (!fs.existsSync(file)) return { value: {}, warnings: ['dimensions.yaml не найден'] };
  try {
    const raw = yaml.load(fs.readFileSync(file, 'utf8')) as any;
    if (!raw || typeof raw !== 'object' || !raw.dimensions) return { value: {}, warnings: ['dimensions.yaml: ожидался { dimensions: {...} }'] };
    return { value: raw.dimensions as Record<string, DimensionDef>, warnings: [] };
  } catch (e) {
    return { value: {}, warnings: [`dimensions.yaml: ${(e as Error).message}`] };
  }
}

function readCatalog(file: string): { value: CatalogSnapshot | null; warnings: string[] } {
  if (!fs.existsSync(file)) return { value: null, warnings: ['catalog.json не найден — preview/counts недоступны'] };
  try { return { value: JSON.parse(fs.readFileSync(file, 'utf8')), warnings: [] }; }
  catch (e) { return { value: null, warnings: [`catalog.json: ${(e as Error).message}`] }; }
}

// ---- public ---------------------------------------------------------

export function loadAll(paths: ResolvedPaths): EditorState {
  const layout  = readLayout(paths.layoutPath);
  const config  = readConfig(paths.configPath);
  const fields  = readFields(paths.fieldsPath);
  const dims    = readDimensions(paths.dimensionsPath);
  const catalog = readCatalog(paths.catalogPath);
  const warnings = [...layout.warnings, ...config.warnings, ...fields.warnings, ...dims.warnings, ...catalog.warnings];
  return {
    draft: { config: config.value, layout: layout.value, fields: fields.value, dimensions: dims.value },
    unknownConfigKeys: config.unknown,
    unknownLayoutKeys: layout.unknown,
    catalog: catalog.value,
    paths, warnings,
  };
}

export interface SaveResult { written: string[]; }

export function saveAll(paths: ResolvedPaths, draft: EditorDraft, unknown: { config: Record<string, unknown>; layout: Record<string, unknown> }): SaveResult {
  const written: string[] = [];
  // config: known + unknown (сохраняем forward-compat)
  fs.writeFileSync(paths.configPath, JSON.stringify({ ...draft.config, ...unknown.config }, null, 2) + '\n', 'utf8'); written.push(paths.configPath);
  // layout
  fs.writeFileSync(paths.layoutPath, JSON.stringify({ ...draft.layout, ...unknown.layout }, null, 2) + '\n', 'utf8'); written.push(paths.layoutPath);
  // fields (YAML - теряем комментарии, это ожидаемо)
  fs.writeFileSync(paths.fieldsPath, yaml.dump({ fields: draft.fields }, { lineWidth: 120, noRefs: true }), 'utf8'); written.push(paths.fieldsPath);
  // dimensions
  fs.writeFileSync(paths.dimensionsPath, yaml.dump({ dimensions: draft.dimensions }, { lineWidth: 120, noRefs: true }), 'utf8'); written.push(paths.dimensionsPath);
  return { written };
}