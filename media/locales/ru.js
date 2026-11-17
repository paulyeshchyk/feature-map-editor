export default {
  tabs: {
    dimensions: 'Размерности',
    fields: 'Поля',
    axes: 'Оси и роли',
    filters: 'Фильтры',
    preview: 'Предпросмотр',
    validation: 'Валидация',
    settings: 'Настройки'
  },
  hints: {
    // General
    dimTitle: 'Человекочитаемое название размерности (для UI)',
    dimMap: 'Имя поля в модуле, где хранится массив значений этой размерности',
    // Items
    itemSlug: 'Уникальный идентификатор (ключ), используемый в YAML и коде',
    itemTitle: 'Отображаемое название (например, для таблицы или фильтра)',
    itemDir: 'Относительный путь к папке с index.md этой размерности (для ссылок)',
    deleteItem: 'Удалить это значение',
    // Columns
    colLabel: 'Заголовок колонки в сгенерированной таблице',
    colField: 'Поле модуля, которое нужно вывести в этой колонке',
    // Fields
    fieldDim: 'К какой размерности привязано это поле',
    fieldDimField: 'Имя поля в объекте модуля (например, sections, capabilities)',
    fieldFrontmatter: 'Ключ в frontmatter (если отличается от имени поля)',
    fieldKind: 'Тип значения: multi (массив) или scalar (строка)',
    fieldSource: 'Откуда брать данные: frontmatter, path (из пути) или оба',
    fieldFormat: 'Как форматировать значение (backtick = код, plain = текст)',
    pathRegex: 'Регулярное выражение для извлечения из пути',
    pathTemplate: 'Шаблон подстановки (например, s$1)',
    pathRuleRegex: 'Regex для поиска в пути',
    pathRuleSlug: 'Slug, который будет присвоен при совпадении',
    tabGeneral: 'Название и привязка к полю модуля (dimToFieldMap) — используются в Feature Map и table.',
    tabColumns: 'Колонки задают таблицу modules.md внутри папки измерения. Поле должно быть из fields.yaml (dimField) или сервисным: id, ident, designation, pureTitle, dir.',
    tabItems: 'Конкретные значения измерения. slug — ключ в YAML и коде; dir — путь к index.md для ссылок.',
    pickDir: 'Выбрать существующую папку раздела (относительно docsRoot)',
    createDir: 'Создать папку и index.md с frontmatter (title, sectionType: Page)',
    rowDimension: 'Основное измерение, чьи элементы станут строками матрицы Feature Map',
    columnDimension: 'Основное измерение, чьи элементы станут колонками матрицы Feature Map',
    stripDimensions: 'Дополнительные измерения для фильтрации данных (отображаются в виде полос-чипсов над сеткой)',

    // Filters
    emptyInclude: 'Включать ли элементы без значения данного измерения в общий индекс',
    emptyLabelText: 'Текст метки для отображения пустых/неразмеченных элементов',

    // Settings
    settingTitle: 'Заголовок отчета или документа Feature Map',
    settingSectionType: 'Тип секции (sectionType) для frontmatter генерируемых страниц',
    settingChipLabelField: 'Поле модуля для отображения текста на чипе/карточке',
    settingEmptyCellSymbol: 'Символ для отображения пустой ячейки в матрице',
    settingCounterPlaceholder: 'Текст счетчика до инициализации клиентской части',
    settingResetButtonText: 'Текст кнопки сброса фильтров в интерфейсе',
    settingModuleHrefAnchor: 'Якорь (anchor) в ссылке на страницу модуля',
    settingOutputPathTemplate: 'Шаблон выходного пути для генерации файла Feature Map',
  },
  mainTabs: {
    dimensions: 'Измерения проекта: семейства, слои, роли и т.п. Здесь задаются элементы и их роли (Row / Column / Strip).',
    fields: 'Манифест полей frontmatter → измерений. Определяет, откуда collect-catalog читает значения.',
    axes: 'Какие измерения становятся строками/колонками Feature Map, а какие — полосами фильтров.',
    filters: 'Включать ли «пустые» значения (__empty__) в index и как их подписывать.',
    preview: 'Схематичный предпросмотр сетки и фильтров.',
    validation: 'Результаты проверки конфигурации перед сохранением.',
    settings: 'Заголовок, sectionType, chipLabelField и прочие параметры генератора.',
  }
};