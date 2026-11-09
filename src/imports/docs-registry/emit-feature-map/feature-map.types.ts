/**
 * Типы для feature-map.
 *
 * Отделены от реализации, чтобы:
 *   - `index.ts` / `feature-map.injector.ts` ссылались через `import type`;
 *   - `feature-map.constants.ts` типизировал `DEFAULT_FEATURE_MAP_CONFIG`;
 *   - тесты `57.1.*` / `57.2.*` импортировали через `import type`.
 *
 * ⚠️ Структура `CatalogSnapshot` соответствует output'у `collect-catalog`
 * (см. `src/plugins/docs-registry/collect-catalog/index.js`). Изменения
 * там = изменение типа здесь.
 */

export interface CatalogDimensionItem {

    /** Путь к папке-указателю от `docsRoot`. Опционален — если не задан,
     *  ссылка на страницу измерения не строится (только заголовок). */
    dir?: string;

    title: string;
}

export interface CatalogDimension {
    title?: string;
    columns?: Array<{ label: string; field: string }>;
    items: Record<string, CatalogDimensionItem>;
}

/**
 * Один модуль из `catalog.modules`.
 *
 * Служебные поля (`dir` / `path` / `id` / `ident` / `designation`) —
 * общие для любого проекта; измерение — это произвольный ключ с массивом
 * слагов (`[measurement]`).
 *
 * **Fallback-правила:**
 *   - `ident` отсутствует → `chipHtml` использует `dir` как label;
 *   - `id` отсутствует → сортировка `index[dim][slug]` использует `dir`
 *     вместо числового id (`String_Compare_Natural.compare`).
 *
 * `path` опционален — заполняется `collect-catalog`, `feature-map` его не читает.
 */
export interface CatalogModule {
    /** Относительный путь от `docsRoot`. Обязателен — используется в href. */
    dir: string;

    /** Путь к `index.md`. Заполняется `collect-catalog`. */
    path?: string;

    /** Ключ для natural-sort. Fallback — `dir`. */
    id?: string;

    /** Текст карточки. Fallback — `dir`. */
    ident?: string;

    /** «1.1. Создание заказа» — номер + pureTitle. Fallback для chip label. */
    pureTitle?: string;

    /** Tooltip карточки. Fallback — `''`. */
    designation?: string;

    /**
     * Все измерения — произвольные ключи. Значения — массивы слагов
     * (совпадают с `dimensions.<dim>.items.<slug>`).
     *
     * Не измерение = служебное поле (`dir` / `path` / `id` / `ident` / `designation`).
     */
    [measurement: string]: string | string[] | undefined;

    /**
     * Имя поля `CatalogModule`, из которого берётся текст карточки чипа.
     *
     * Приоритет:
     *   1. `mod[chipLabelField]` — если это непустая строка;
     *   2. `path.basename(mod.dir)` — **никогда** не полный `dir`
     *      (глубокие иерархии `Registry/МодульX` делают карточку нечитаемой).
     *
     * Типичные значения: `'ident'` (default), `'designation'`, `'id'`,
     * любой scalar-ключ из `_fields.yaml` (`kind !== 'multi'`).
     *
     * Если поле — массив (multi-измерение), используется `basename(dir)`.
     *
     * @configurable
     */
    chipLabelField: string;
}

/**
 * Снимок каталога — то, что читается из `catalog.<lang>.json`.
 */
export interface CatalogSnapshot {

    /** Абсолютный путь к папке с модулями. */
    docsRoot: string;
    modules: Record<string, CatalogModule>;
    dimensions: Record<string, CatalogDimension>;

    /** `dimName → { slug → [moduleDir, ...] }`. */
    index: Record<string, Record<string, string[]>>;

    /**
     * Путь к реестру (`dimensions.yaml` или `<lang>.yaml`), из которого
     * собраны `dimensions`. Заполняется `collect-catalog`.
     * Используется для сообщений об ошибках (как `printUnknownError`
     * в `build-page-legend`).
     */
    registryPath?: string;
}

/**
 * Конфиг по умолчанию для feature-map.
 *
 * ⚠️ Step 4: этот объект станет прототипом для override'а через
 * CLI `--config`. Поля с пометкой `@configurable` — целевые.
 */
export interface FeatureMapConfig {
    /**
     * Шаблон пути для `feature-map.md` относительно `DOCS_DIR`.
     * `{lang}` подставляется из `--lang`.
     * @configurable
     */
    outputPathTemplate: string;

    /**
     * Якорь на карточке модуля в сгенерированной ссылке.
     * @configurable
     */
    moduleHrefAnchor: string;

    /**
     * Шаблон href на карточку модуля.
     * Плейсхолдеры: `{docsRootRel}`, `{dir}`, `{anchor}`.
     * @configurable
     */
    moduleHrefTemplate: string;

    /**
     * Измерения, рендерящиеся как полосы фильтров над сеткой.
     * @configurable
     */
    stripDimensions: ReadonlyArray<string>;

    /**
     * Отображаемые подписи для strip-измерений.
     * @configurable
     */
    stripLabels: Readonly<Record<string, string>>;

    /** Измерение — строки сетки. @configurable */
    rowDimension: string;

    /** Измерение — колонки сетки. @configurable */
    columnDimension: string;

    /**
     * Соответствие «имя измерения в каталоге → имя поля в `CatalogModule`».
     *
     * Дефолт: `{ actor: 'actors', capability: 'capabilities', layer: 'layers', family: 'families' }`.
     * Alt-проект: `{ audience: 'audiences', topic: 'topics', stage: 'stages' }`.
     *
     * Используется для `countBy` и `cells` — без него нельзя построить
     * ячейки произвольного измерения.
     *
     * @configurable
     */
    dimToFieldMap: Readonly<Record<string, string>>;

    /** Заголовок в frontmatter и `<h1>`. @configurable */
    title: string;

    /** `sectionType` в frontmatter. @configurable */
    sectionType: string;

    /** Плейсхолдер счётчика до инициализации клиента. @configurable */
    counterPlaceholder: string;

    /** Текст кнопки сброса. @configurable */
    resetButtonText: string;

    /** Символ пустой ячейки. */
    emptyCellSymbol: string;

    /**
 * Имя поля `CatalogModule`, из которого берётся текст карточки чипа.
 *
 * Приоритет:
 *   1. `mod[chipLabelField]` — если это непустая строка;
 *   2. `path.basename(mod.dir)` — **никогда** не полный `dir`
 *      (глубокие иерархии `Registry/МодульX` делают карточку нечитаемой).
 *
 * Типичные значения: `'ident'` (default), `'designation'`, `'id'`,
 * любой scalar-ключ из `_fields.yaml` (`kind !== 'multi'`).
 *
 * Если поле — массив (multi-измерение), используется `basename(dir)`.
 *
 * @configurable
 */
    chipLabelField: string;
}