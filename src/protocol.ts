import type { FeatureMapConfig } from './imports/docs-registry/emit-feature-map/feature-map.types.js';
export type { FeatureMapConfig } from './imports/docs-registry/emit-feature-map/feature-map.types.js';

export interface DimensionColumn {
  label: string;
  field: string;
}

export interface DimensionItem {
  title: string;
  dir?: string;
}

export interface DimensionDef {
  title?: string;
  columns?: DimensionColumn[];
  items: Record<string, DimensionItem>;
}

export interface FieldsManifest {
  [key: string]: FieldDef;
}

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
  /** Канонический список колонок, доступных для выбора в UI. */
  columnCatalog: ColumnOption[];
  /** Текст-подсказка для вкладки «Dimensions → Columns». */
  columnHint: string;
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
  | { type: 'save'; draft: EditorDraft }
  | { type: 'reset' }
  | { type: 'generate' }
  | { type: 'openFile'; file: 'config' | 'layout' | 'fields' | 'dimensions' | 'catalog' }
  | { type: 'pickProjectRoot' }
  | { type: 'prompt'; id: string; message: string; defaultValue?: string }
  | { type: 'confirm'; id: string; message: string }
  | { type: 'createDirPage'; id: string; message: string; dir: string; slug: string; title: string }
  | { type: 'pickDir'; currentValue: string; message: string; id: string }
  ;


export type ExtensionMessage =
  | { type: 'init'; state: EditorState }
  | { type: 'stateRefreshed'; state: EditorState }
  | { type: 'saved'; ok: true; warnings: string[] }
  | { type: 'saveError'; issues: ValidationIssue[] }
  | { type: 'generated'; ok: boolean; message: string }
  | { type: 'error'; message: string }
  | { type: 'promptResult'; id: string; value: string | null }
  | { type: 'confirmResult'; id: string; confirmed: boolean }
  | { type: 'pickDirResult'; id: string; value: string | null }
  | { type: 'createDirPageResult'; id: string; value?: string | null; ok: boolean; error?: string | null };

export interface ColumnOption {
  /** Имя поля в `CatalogModule` (`id`, `ident`, `families`, …). */
  field: string;
  /** Человекочитаемый заголовок по умолчанию. */
  label: string;
  /** `service` — id/ident/designation/pureTitle/dir; `field` — из `_fields.yaml`. */
  source: 'service' | 'field';
  /** Подсказка для UI (напр. «Измерение: family»). */
  description?: string;
}

export const COLUMNS_HINT =
  'Колонки задают таблицу `modules.md` внутри папки измерения: ' +
  'какие поля модуля и под какими заголовками показывать. ' +
  'Поле должно быть определено в `_registry/fields.yaml` (как `dimField`) ' +
  'или быть сервисным: `id`, `ident`, `designation`, `pureTitle`, `dir`.';