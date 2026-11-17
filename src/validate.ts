import type { ColumnOption, EditorDraft, ValidationIssue } from './protocol';

const SLUG_RE = /^[a-zA-Z0-9_][a-zA-Z0-9_\-/]*$/;

export function validateDraft(
  d: EditorDraft,
  columnCatalog: ColumnOption[] = [],
): ValidationIssue[] {

  const out: ValidationIssue[] = [];
  const cfg = d.config;
  const dims = d.dimensions || {};
  const dimNames = Object.keys(dims);

  // Если размерностей вообще нет — дальнейшие проверки не имеют смысла
  if (dimNames.length === 0) {
    return [{
      level: 'error', code: 'NO_DIMS',
      message: 'В проекте нет ни одной размерности. Добавьте хотя бы одну на вкладке «Dimensions».'
    }];
  }

  // ── 1. Проверка осей (Row/Column) ──
  if (!cfg.rowDimension) {
    out.push({
      level: 'error', code: 'ROW_MISSING',
      message: 'Строка (Row dimension) не выбрана. Перейдите во вкладку «Axes & Roles» и выберите размерность.',
    });
  } else if (!dims[cfg.rowDimension]) {
    out.push({
      level: 'error', code: 'ROW_MISSING',
      message: `Размерность строки «${cfg.rowDimension}» была удалена. Выберите другую на вкладке «Axes & Roles».`,
    });
  }

  if (!cfg.columnDimension) {
    out.push({
      level: 'error', code: 'COL_MISSING',
      message: 'Колонка (Column dimension) не выбрана. Перейдите во вкладку «Axes & Roles» и выберите размерность.',
    });
  } else if (!dims[cfg.columnDimension]) {
    out.push({
      level: 'error', code: 'COL_MISSING',
      message: `Размерность колонки «${cfg.columnDimension}» была удалена. Выберите другую на вкладке «Axes & Roles».`,
    });
  }

  // Проверка dimToFieldMap для выбранных осей
  if (cfg.rowDimension && dims[cfg.rowDimension] && !cfg.dimToFieldMap[cfg.rowDimension]) {
    out.push({
      level: 'error', code: 'ROW_NO_FIELD',
      message: `Для строки «${cfg.rowDimension}» не задано поле (dimToFieldMap). Откройте Dimensions -> ${cfg.rowDimension} -> General.`,
    });
  }

  if (cfg.columnDimension && dims[cfg.columnDimension] && !cfg.dimToFieldMap[cfg.columnDimension]) {
    out.push({
      level: 'error', code: 'COL_NO_FIELD',
      message: `Для колонки «${cfg.columnDimension}» не задано поле (dimToFieldMap). Откройте Dimensions -> ${cfg.columnDimension} -> General.`,
    });
  }

  // ── 2. Проверка stripDimensions ──
  const strips = cfg.stripDimensions ?? [];
  if (strips.includes(cfg.rowDimension)) {
    out.push({ level: 'error', code: 'ROW_IN_STRIPS', message: `Размерность «${cfg.rowDimension}» не может быть одновременно строкой и strip-фильтром.` });
  }
  if (strips.includes(cfg.columnDimension)) {
    out.push({ level: 'error', code: 'COL_IN_STRIPS', message: `Размерность «${cfg.columnDimension}» не может быть одновременно колонкой и strip-фильтром.` });
  }

  for (const s of strips) {
    if (!dims[s]) {
      out.push({ level: 'error', code: 'STRIP_MISSING_DIM', message: `Strip-фильтр «${s}» ссылается на несуществующую размерность.` });
    } else if (!cfg.dimToFieldMap[s]) {
      out.push({ level: 'warning', code: 'STRIP_NO_FIELD', message: `Для Strip-фильтра «${s}» не задано поле (dimToFieldMap).` });
    }
  }

  // ── 3. Проверка "мусора" в dimToFieldMap ──
  for (const dim of Object.keys(cfg.dimToFieldMap)) {
    if (!dims[dim]) {
      out.push({
        level: 'error', code: 'DIM_MAP_MISSING',
        message: `В настройках маппинга осталось поле для «${dim}», но размерности нет. Нажмите «Сохранить», чтобы очистить конфиг.`,
      });
    }
  }

  // ── 4. Проверка Fields ──
  for (const [key, f] of Object.entries(d.fields || {})) {
    if (f.dimension && !dims[f.dimension]) {
      out.push({ level: 'error', code: 'FIELD_DIM_MISSING', message: `Поле «${key}» ссылается на удаленную размерность «${f.dimension}». Исправьте на вкладке Fields.` });
    }
  }

  // ── 5. Проверка columns ──
  const allowed = new Set(columnCatalog.map(c => c.field));
  const catalogReady = allowed.size > 0;

  for (const [dimName, dim] of Object.entries(dims)) {
    const cols = dim.columns;
    if (!cols) continue;
    const seen = new Set<string>();

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const path = `dimensions.${dimName}.columns[${i}]`;

      if (!col.field) {
        out.push({
          level: 'error', code: 'COLUMN_EMPTY_FIELD', path,
          message: `Колонка #${i + 1} в «${dimName}»: не задано поле (field).`,
        });
        continue;
      }

      if (catalogReady && !allowed.has(col.field)) {
        out.push({
          level: 'error', code: 'COLUMN_UNKNOWN_FIELD', path,
          message:
            `Колонка «${col.label || col.field}» в «${dimName}»: поле «${col.field}» ` +
            `не определено в fields.yaml. Доступно: ${[...allowed].join(', ')}.`,
        });
      }

      if (seen.has(col.field)) {
        out.push({
          level: 'warning', code: 'COLUMN_DUPLICATE', path,
          message: `Колонка с полем «${col.field}» повторяется в «${dimName}».`,
        });
      }
      seen.add(col.field);

      if (!col.label) {
        out.push({
          level: 'warning', code: 'COLUMN_EMPTY_LABEL', path,
          message: `Колонка «${col.field}» в «${dimName}»: пустой label — будет использован ключ поля.`,
        });
      }
    }
  }

  return out;
}