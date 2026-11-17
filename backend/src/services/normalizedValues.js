function parseDelimitedValues(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  const unique = new Map();
  values.flatMap(item => String(item || '').split(','))
    .map(item => item.trim())
    .filter(Boolean)
    .forEach(item => {
      const key = item.toLowerCase();
      if (!unique.has(key)) unique.set(key, item);
    });
  return [...unique.values()];
}

module.exports = { parseDelimitedValues };
