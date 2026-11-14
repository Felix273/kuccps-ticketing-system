import fs from 'node:fs/promises';

const pages = [
  'intro',
  'getting-started/installation', 'getting-started/configuration', 'getting-started/development-setup',
  'architecture/overview', 'architecture/backend', 'architecture/frontend', 'architecture/database', 'architecture/google-addon', 'architecture/email-service',
  'backend/overview', 'backend/server-setup', 'backend/middleware', 'backend/controllers', 'backend/routes', 'backend/services', 'backend/security', 'backend/scheduler',
  'frontend/overview', 'frontend/structure', 'frontend/components', 'frontend/services', 'frontend/hooks', 'frontend/routing', 'frontend/styling',
  'database/overview', 'database/schema', 'database/migrations', 'database/seed-data', 'database/prisma-usage',
  'api/overview', 'api/authentication', 'api/tickets', 'api/users', 'api/departments', 'api/settings', 'api/knowledge-base', 'api/status-issues', 'api/operations', 'api/notifications', 'api/forms', 'api/views',
  'google-addon/overview', 'google-addon/setup', 'google-addon/deployment', 'google-addon/api-integration',
  'deployment/overview', 'deployment/backend', 'deployment/frontend', 'deployment/database', 'deployment/reverse-proxy', 'deployment/production-checklist',
  'operations/maintenance', 'operations/backup', 'operations/monitoring',
  'troubleshooting/common-issues', 'troubleshooting/cors', 'troubleshooting/database', 'troubleshooting/email', 'troubleshooting/authentication', 'troubleshooting/deployment',
];

export default async function run(page) {
  const outputDir = '/home/felix/kuccps-ticketing/docs-site/pdf-pages';
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ media: 'screen' });
  const exported = [];

  for (const [index, path] of pages.entries()) {
    await page.goto(`http://127.0.0.1:4173/docs/${path}`, { waitUntil: 'networkidle' });
    await page.locator('main').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const filename = `${String(index + 1).padStart(2, '0')}-${path.replaceAll('/', '-')}.pdf`;
    await page.pdf({
      path: `${outputDir}/${filename}`,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '12mm', right: '12mm', bottom: '14mm', left: '12mm' },
      displayHeaderFooter: false,
    });
    exported.push({ path, title: await page.title() });
  }

  return { count: exported.length, first: exported[0], last: exported.at(-1), outputDir };
}
