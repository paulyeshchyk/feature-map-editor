import en from './locales/en.js';
import ru from './locales/ru.js';

const locales = { ru, en };
let currentLang = 'ru';

export function setLanguage(lang) {
  if (lang && lang.startsWith('en')) currentLang = 'en';
  else if (lang && lang.startsWith('ru')) currentLang = 'ru';
  else currentLang = 'ru'; // fallback
}

export function t(path) {
  const keys = path.split('.');
  let obj = locales[currentLang];
  for (const k of keys) {
    if (obj && obj[k] !== undefined) {
      obj = obj[k];
    } else {
      // Если перевода нет, ищем в русском
      let fallback = locales['ru'];
      for (const fk of keys) {
        if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
        else return path; // Крайний случай
      }
      return fallback;
    }
  }
  return obj;
}