const jwt = require('jsonwebtoken');

const TOKEN_ISSUER = 'kuccps-ticketing';
const TOKEN_AUDIENCE = 'kuccps-csat';

function getPublicAppUrl() {
  const configuredUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGINS;
  const appUrl = new URL((configuredUrl || 'http://localhost:5173').split(',')[0].trim());
  if (!['http:', 'https:'].includes(appUrl.protocol)) {
    throw new Error('PUBLIC_APP_URL must use HTTP or HTTPS');
  }
  const isLocalUrl = ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(appUrl.hostname);
  if (isLocalUrl && (process.env.NODE_ENV === 'production' || !process.env.PUBLIC_APP_URL)) {
    throw new Error('Set PUBLIC_APP_URL to a publicly reachable frontend URL before sending CSAT links');
  }
  appUrl.search = '';
  appUrl.hash = '';
  return appUrl.toString();
}

function signCsatToken(ticket, rating) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required to generate CSAT links');
  }
  if (!ticket.id || !ticket.requesterEmail) {
    throw new Error('Ticket ID and requester email are required to generate CSAT links');
  }

  return jwt.sign({
    purpose: 'csat',
    ticketId: ticket.id,
    requesterEmail: ticket.requesterEmail,
    rating
  }, process.env.JWT_SECRET, {
    expiresIn: '30d',
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
}

function verifyCsatToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET, {
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
    const url = new URL(appUrl);
    url.searchParams.set('csatToken', token);
    return { rating, url: url.toString() };
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
    5: '#00a86b',
    4: '#00c789',
    3: '#4263eb',
    2: '#f59e0b',
    1: '#f0002e'
  };

  return `
    <div style="margin:24px 0;padding:20px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;text-align:center;font-family:Arial,sans-serif">
      <h3 style="margin:0 0 8px;color:#111827;font-size:16px">How satisfied were you with our support?</h3>
      <p style="margin:0 0 16px;color:#6b7280;font-size:13px">Your feedback helps us improve ICT services. No login required.</p>
      ${createCsatLinks(ticket).map(({ rating, url }) => `
        <a href="${url}" style="display:block;margin:6px 0;padding:10px 12px;border-radius:7px;background:${colors[rating]};color:#fff;text-align:left;text-decoration:none;font-size:13px;font-weight:bold">
          <span style="color:#ffdf3d">${'★'.repeat(rating)}</span> ${labels[rating]}
        </a>
      `).join('')}
      <div style="height:3px;margin-top:12px;background:${primaryColor};border-radius:3px"></div>
    </div>
  `;
}

module.exports = {
  createCsatLinks,
  renderCsatLinks,
  verifyCsatToken
};
