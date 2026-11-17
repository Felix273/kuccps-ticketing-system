const jwt = require('jsonwebtoken');

const TOKEN_ISSUER = 'kuccps-ticketing';
const TOKEN_AUDIENCE = 'kuccps-csat';
const CSAT_SATISFIED_MIN_RATING = 4;

function getPublicAppUrl() {
  const configuredUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  let appUrl;
  try {
    appUrl = new URL(configuredUrl.split(',')[0].trim());
  } catch {
    return 'http://localhost:5173';
  }
  if (
    process.env.NODE_ENV === 'production' &&
    ['localhost', '127.0.0.1', '::1'].includes(appUrl.hostname)
  ) {
    throw new Error('PUBLIC_APP_URL must be a publicly reachable frontend URL in production');
  }
  appUrl.search = '';
  appUrl.hash = '';
  return appUrl.toString().replace(/\/$/, '');
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

function renderCsatLinks(ticket, primaryColor) {
  const labels = {
    5: '5 Stars - Extremely Contented',
    4: '4 Stars - Contented',
    3: '3 Stars - Satisfied (Good)',
    2: '2 Stars - Discontented',
    1: '1 Star - Very Discontented'
  };
  const colors = {
    5: '#00875a',
    4: '#00a3bf',
    3: '#0052cc',
    2: '#ff8b00',
    1: '#de350b'
  };

  return `
    <div style="margin:24px 0;padding:20px;border:1px solid #e5e7eb;border-radius:8px;background:#ffffff;text-align:center;font-family:Arial,sans-serif">
      <h3 style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:bold">How satisfied were you with our support?</h3>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px">Your feedback helps us improve ICT services. No login required.</p>
      ${createCsatLinks(ticket).map(({ rating, url }) => `
        <a href="${url}" target="_blank" style="display:block;margin:6px 0;padding:12px 14px;border-radius:6px;background:${colors[rating]};color:#ffffff;text-align:left;text-decoration:none;font-size:13px;font-weight:bold">
          <span style="color:#ffdf3d">${'★'.repeat(rating)}</span> ${labels[rating]}
        </a>
      `).join('')}
      <div style="height:3px;margin-top:16px;background:${primaryColor || '#990024'};border-radius:3px"></div>
    </div>
  `;
}

function calculateSatisfactionRate(totalResponses, satisfiedCount) {
  if (!Number.isInteger(totalResponses) || !Number.isInteger(satisfiedCount)) {
    throw new TypeError('CSAT response counts must be integers');
  }
  if (satisfiedCount < 0 || satisfiedCount > totalResponses) {
    throw new RangeError('Satisfied responses must be between zero and total responses');
  }
  if (totalResponses === 0) return null;
  return Math.round((satisfiedCount / totalResponses) * 100);
}

function removeLegacyCsatSection(html) {
  return html.replace(
    /<!--\s*1-Click CSAT Rating Section\s*-->[\s\S]*?(?=\s*\{\{csatLinks\}\})/i,
    ''
  );
}

function ensureWorkingCsatLinks(html, ticket, primaryColor) {
  const signedUrls = new Map(createCsatLinks(ticket).map(link => [link.rating, link.url]));
  const withSignedAnchors = html.replace(
    /<a\b[^>]*href="[^"]*\/api\/operations\/csat\/rate\?[^"]*"[^>]*>[\s\S]*?<\/a>/gi,
    anchor => {
      const ratingMatch = anchor.match(/[?&]rating=([1-5])\b/i) || anchor.match(/\b([1-5])\s+Stars?\b/i);
      const inner = anchor.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>\s*$/i, '');
      if (!ratingMatch || !inner) return '';
      return `<a href="${signedUrls.get(Number(ratingMatch[1]))}">${inner}</a>`;
    }
  );
  if (withSignedAnchors.includes('{{csatLinks}}')) {
    return withSignedAnchors.replace('{{csatLinks}}', renderCsatLinks(ticket, primaryColor));
  }
  const hasSignedAnchors = /<a\b[^>]*href="[^"]*"[^>]*>[\s\S]*?<\/a>/i.test(withSignedAnchors) &&
    !/\/api\/operations\/csat\/rate/i.test(withSignedAnchors);
  if (hasSignedAnchors) return withSignedAnchors;
  return `${withSignedAnchors}\n${renderCsatLinks(ticket, primaryColor)}`;
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
