const jwt = require('jsonwebtoken');

const TOKEN_ISSUER = 'kuccps-ticketing';
const TOKEN_AUDIENCE = 'kuccps-csat';
const CSAT_SATISFIED_MIN_RATING = 4;

function calculateSatisfactionRate(totalResponses, satisfiedCount) {
  if (!totalResponses || totalResponses === 0) return null;
  return Math.round((satisfiedCount / totalResponses) * 100);
}

function getPublicAppUrl() {
  const configuredUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const appUrl = new URL(configuredUrl.split(',')[0].trim());
    appUrl.search = '';
    appUrl.hash = '';
    return appUrl.toString().replace(/\/$/, '');
  } catch {
    return 'http://localhost:5173';
  }
}

function signCsatToken(ticket, rating) {
  const secret = process.env.JWT_SECRET || 'kuccps-fallback-secret-2026';
  if (!ticket.id || !ticket.requesterEmail) {
    throw new Error('Ticket ID and requester email are required to generate CSAT links');
  }

  return jwt.sign({
    purpose: 'csat',
    ticketId: ticket.id,
    requesterEmail: ticket.requesterEmail,
    rating
  }, secret, {
    expiresIn: '30d',
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
}

function verifyCsatToken(token) {
  const secret = process.env.JWT_SECRET || 'kuccps-fallback-secret-2026';
  const payload = jwt.verify(token, secret, {
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
  if (
    payload.purpose !== 'csat' ||
    typeof payload.ticketId !== 'string' ||
    typeof payload.requesterEmail !== 'string' ||
    !Number.isInteger(payload.rating) ||
    payload.rating < 1 ||
    payload.rating > 5
  ) {
    throw new Error('Invalid CSAT token');
  }
  return payload;
}

function createCsatLinks(ticket) {
  const appUrl = getPublicAppUrl();
  return [5, 4, 3, 2, 1].map(rating => {
    const token = signCsatToken(ticket, rating);
    return { 
      rating, 
      url: `${appUrl}/?csatToken=${encodeURIComponent(token)}` 
    };
  });
}

// ── BULLETPROOF EMAIL CLIENT TABLE BUTTONS ────────────────────
function renderCsatLinks(ticket, primaryColor) {
  const buttonConfigs = [
    { rating: 5, label: '5 Stars - Extremely Contented', color: '#00875a' },
    { rating: 4, label: '4 Stars - Contented',            color: '#00a3bf' },
    { rating: 3, label: '3 Stars - Satisfied (Good)',     color: '#0052cc' },
    { rating: 2, label: '2 Stars - Discontented',         color: '#ff8b00' },
    { rating: 1, label: '1 Star - Very Discontented',     color: '#de350b' }
  ];

  const links = new Map(createCsatLinks(ticket).map(l => [l.rating, l.url]));

  const buttonsHtml = buttonConfigs.map(({ rating, label, color }) => {
    const url = links.get(rating);
    const starString = '&#9733;'.repeat(rating);

    return `
      <!-- Rating ${rating} Button Row -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px !important; border-collapse: separate !important;">
        <tr>
          <td align="left" bgcolor="${color}" style="background-color: ${color} !important; border-radius: 6px !important; padding: 12px 14px !important;">
            <a href="${url}" target="_blank" style="display: block !important; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; font-size: 13px !important; font-weight: bold !important; color: #ffffff !important; text-decoration: none !important; line-height: 1.3 !important;">
              <span style="color: #ffd700 !important; font-size: 14px !important; letter-spacing: 2px !important;">${starString}</span>
              &nbsp;&nbsp;<span style="color: #ffffff !important;">${label}</span>
            </a>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
    <!-- 1-Click CSAT Rating Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 !important; border: 1px solid #e4e4e7 !important; border-radius: 8px !important; background-color: #ffffff !important; border-collapse: separate !important;">
      <tr>
        <td style="padding: 20px !important; text-align: center !important;">
          <h3 style="margin: 0 0 6px 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; color: #18181b !important; font-size: 16px !important; font-weight: bold !important;">
            How satisfied were you with our support?
          </h3>
          <p style="margin: 0 0 16px 0 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif !important; color: #71717a !important; font-size: 12.5px !important;">
            Your feedback helps us improve ICT services. No login required.
          </p>

          ${buttonsHtml}

          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 14px !important;">
            <tr>
              <td height="3" bgcolor="${primaryColor || '#990024'}" style="background-color: ${primaryColor || '#990024'} !important; border-radius: 2px !important; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function removeLegacyCsatSection(html) {
  return html.replace(
    /<!--\s*1-Click CSAT (?:\w+\s+)?(?:Rating|Section|Container)\s*-->[\s\S]*?(?=\s*\{\{csatLinks\}\}|$)/i,
    ''
  );
}

function ensureWorkingCsatLinks(html, ticket, primaryColor) {
  // Replace existing token or append rendered buttons
  if (html.includes('{{csatLinks}}')) {
    return html.replace('{{csatLinks}}', renderCsatLinks(ticket, primaryColor));
  }
  return `${html}\n${renderCsatLinks(ticket, primaryColor)}`;
}

module.exports = {
  CSAT_SATISFIED_MIN_RATING,
  calculateSatisfactionRate,
  createCsatLinks,
  ensureWorkingCsatLinks,
  removeLegacyCsatSection,
  renderCsatLinks,
  verifyCsatToken
};
