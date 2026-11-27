function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escape user text for an HTML email body and keep its line breaks.
function textToHtml(value) {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, '<br>');
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function safeColor(value, fallback) {
  return HEX_COLOR.test(String(value || '')) ? value : fallback;
}

module.exports = { escapeHtml, textToHtml, safeColor, HEX_COLOR };
