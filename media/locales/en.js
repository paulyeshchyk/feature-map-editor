export default {
  tabs: {
    dimensions: 'Dimensions',
    fields: 'Fields',
    axes: 'Axes & Roles',
    filters: 'Filters',
    preview: 'Preview',
    validation: 'Validation',
    settings: 'Settings'
  },
  hints: {
    dimTitle: 'Human-readable dimension title (for UI)',
    dimMap: 'Field name in the module containing the dimension values array',
    itemSlug: 'Unique identifier (key) used in YAML and code',
    itemTitle: 'Display name (e.g., for table or filter)',
    itemDir: 'Relative path to the index.md folder (for links)',
    deleteItem: 'Delete this item',
    colLabel: 'Column header in the generated table',
    colField: 'Module field to display in this column',
    fieldDim: 'Which dimension this field is bound to',
    fieldDimField: 'Field name in the module object (e.g., sections)',
    fieldFrontmatter: 'Frontmatter key (if different from field name)',
    fieldKind: 'Value type: multi (array) or scalar (string)',
    fieldSource: 'Where to get data: frontmatter, path, or both',
    fieldFormat: 'How to format the value (backtick = code, plain = text)',
    pathRegex: 'Regular expression to extract from path',
    pathTemplate: 'Substitution template (e.g., s$1)',
    pathRuleRegex: 'Regex to search in path',
    pathRuleSlug: 'Slug assigned on match'
  }
};