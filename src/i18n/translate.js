const normalize = (value) => value.replace(/\s+/g, ' ').trim();
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s*');

// Keep telemetry, identifiers, and source records intact. Translate at render time.
export function createTranslator(messages, language) {
  const exact = new Map();
  const templates = [];

  for (const line of messages.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('#')) continue;
    const [english, spanish] = line.split(' => ');
    if (!english || !spanish) continue;
    const target = language === 'es' ? spanish : english;
    for (const source of [english, spanish]) {
      if (/\{\d+\}/.test(source)) {
        const slots = [];
        let cursor = 0;
        let pattern = '^';
        for (const match of source.matchAll(/\{(\d+)\}/g)) {
          pattern += escapeRegExp(source.slice(cursor, match.index)) + '([\\s\\S]*?)';
          slots.push(Number(match[1]));
          cursor = match.index + match[0].length;
        }
        pattern += escapeRegExp(source.slice(cursor)) + '$';
        templates.push({ pattern: new RegExp(pattern), target, slots, specificity: source.replace(/\{\d+\}/g, '').length });
      } else {
        exact.set(normalize(source), target);
      }
    }
  }
  templates.sort((a, b) => b.specificity - a.specificity);

  function translate(value, depth = 0) {
    if (Array.isArray(value)) return value.map((item) => translate(item, depth));
    if (typeof value !== 'string' || !value.trim()) return value;
    const source = normalize(value);
    let translated = exact.get(source);
    if (translated === undefined && depth < 4) {
      for (const template of templates) {
        const match = template.pattern.exec(source);
        if (!match) continue;
        const params = {};
        template.slots.forEach((slot, i) => { params[slot] = translate(match[i + 1], depth + 1); });
        translated = template.target.replace(/\{(\d+)\}/g, (_, slot) => params[slot]);
        break;
      }
    }
    if (translated === undefined) return value;
    return value.match(/^\s*/)[0] + translated + value.match(/\s*$/)[0];
  }

  return translate;
}
