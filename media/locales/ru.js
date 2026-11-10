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
    pathRuleSlug: 'Slug, который будет присвоен при совпадении'
  }
};