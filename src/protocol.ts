import type { FeatureMapConfig } from './imports/docs-registry/emit-feature-map/feature-map.types.js';
export type { FeatureMapConfig } from './imports/docs-registry/emit-feature-map/feature-map.types.js';

export interface DimensionItem { title: string; dir?: string; }
export interface DimensionDef   { title?: string; items: Record<string, DimensionItem>; }

export interface FieldsManifest { [key: string]: FieldDef; }
export interface FieldDef {
  kind?: 'multi' | 'scalar';
  dimension?: string;
  dimField?: string;
  frontmatterKey?: string;
  source?: 'frontmatter' | 'path' | 'frontmatter-or-path';
  path?: { regex?: string; template?: string; rules?: { regex: string; slug: string }[] };
  [k: string]: unknown;
}

export interface LayoutConfig {
  modulesFolder: string | null;
  modulePrefix: string | null;
  moduleIndexFile: string;
  moduleSectionTypes: string[] | null;
  outFolder: string;
  skipDirs: string[];
  strictDimensions: boolean;
  includeEmpty: boolean | string[];
  emptyLabel: string | Record<string, string>;
}

/** Всё редактируемое состояние — то, что webview держит в памяти. */
export interface EditorDraft {
  config: FeatureMapConfig;
  layout: LayoutConfig;
  fields: FieldsManifest;
  dimensions: Record<string, DimensionDef>;
}

/** То, что extension присылает в init. */
export interface EditorState {
  draft: EditorDraft;
  /** «Чужие» ключи в config/layout — не показываем в UI, но и не теряем. */
  unknownConfigKeys: Record<string, unknown>;
  unknownLayoutKeys: Record<string, unknown>;
  catalog: CatalogSnapshot | null;
  projectName: string;
  isNative: boolean;
  uiLang: string;
  paths: {
    projectRoot: string;
    docsDir: string;
    registryDir: string;
    generatedDir: string;
    configPath: string;
    layoutPath: string;
    fieldsPath: string;
    dimensionsPath: string;
    catalogPath: string;
  };
  warnings: string[];
}

export interface CatalogSnapshot {
  docsRoot: string;
  modules: Record<string, Record<string, unknown>>;
  dimensions: Record<string, DimensionDef>;
  index: Record<string, Record<string, string[]>>;
}

export type ValidationIssue = {
  level: 'error' | 'warning';
  code: string;
  message: string;
  path?: string;
};

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'save';   draft: EditorDraft }
  | { type: 'reset' }
  | { type: 'generate' }
  | { type: 'openFile';       file: 'config' | 'layout' | 'fields' | 'dimensions' | 'catalog' }
  | { type: 'pickProjectRoot' }
  | { type: 'prompt';  id: string; message: string; defaultValue?: string }
  | { type: 'confirm'; id: string; message: string };

export type ExtensionMessage =
  | { type: 'init';           state: EditorState }
  | { type: 'stateRefreshed'; state: EditorState }
  | { type: 'saved';          ok: true; warnings: string[] }
  | { type: 'saveError';      issues: ValidationIssue[] }
  | { type: 'generated';      ok: boolean; message: string }
  | { type: 'error';          message: string }
  | { type: 'promptResult';   id: string; value: string | null }
  | { type: 'confirmResult';  id: string; confirmed: boolean };