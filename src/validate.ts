import type { EditorDraft, ValidationIssue } from './protocol';

const SLUG_RE = /^[a-zA-Z0-9_][a-zA-Z0-9_\-/]*$/;

export function validateDraft(d: EditorDraft): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const cfg = d.config;

  // 1. row/column должны иметь dimToFieldMap
  const rowField = cfg.dimToFieldMap[cfg.rowDimension];
  if (!rowField) out.push({ level: 'error', code: 'ROW_NO_FIELD', message: `dimToFieldMap["${cfg.rowDimension}"] не задан` });
  const colField = cfg.dimToFieldMap[cfg.columnDimension];
  if (!colField) out.push({ level: 'error', code: 'COL_NO_FIELD', message: `dimToFieldMap["${cfg.columnDimension}"] не задан` });

  // 2. row/column нельзя одновременно в stripDimensions
  const strips = cfg.stripDimensions ?? [];
  if (strips.includes(cfg.rowDimension)) out.push({ level: 'error', code: 'ROW_IN_STRIPS', message: `row="${cfg.rowDimension}" присутствует в stripDimensions` });
  if (strips.includes(cfg.columnDimension)) out.push({ level: 'error', code: 'COL_IN_STRIPS', message: `column="${cfg.columnDimension}" присутствует в stripDimensions` });

  // 3. Каждая strip-размерность должна иметь dimToFieldMap
  for (const s of strips) {
    if (!cfg.dimToFieldMap[s]) out.push({ level: 'warning', code: 'STRIP_NO_FIELD', message: `strip="${s}" без dimToFieldMap — strip будет пустой` });
  }

  // 4. Уникальность slug внутри измерения + валидный slug
  for (const [dim, def] of Object.entries(d.dimensions)) {
    for (const slug of Object.keys(def.items ?? {})) {
      if (slug === '__empty__') continue;
      if (!SLUG_RE.test(slug)) out.push({ level: 'warning', code: 'BAD_SLUG', message: `${dim}.${slug}: slug не по паттерну` });
    }
  }

  // 5. fields → dimensions ссылается на существующее измерение
  for (const [key, f] of Object.entries(d.fields)) {
    if (f.dimension && !d.dimensions[f.dimension]) {
      out.push({ level: 'error', code: 'FIELD_DIM_MISSING', message: `field "${key}" → dimensions["${f.dimension}"] не существует` });
    }
  }

  // 6. dimToFieldMap ссылается на существующие измерения
  for (const dim of Object.keys(cfg.dimToFieldMap)) {
    if (!d.dimensions[dim] && dim !== cfg.rowDimension && dim !== cfg.columnDimension) {
      out.push({ level: 'warning', code: 'DIM_MAP_MISSING', message: `dimToFieldMap["${dim}"] не соответствует измерению` });
    }
  }

  return out;
}