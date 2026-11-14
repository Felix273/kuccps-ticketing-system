import { access, mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

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

const outputDir = '/home/felix/kuccps-ticketing/docs-site/pdf-pages';
const outputFile = '/home/felix/kuccps-ticketing/docs-site/KUCCPS-Ticketing-Documentation.pdf';
const buildDir = '/home/felix/kuccps-ticketing/docs-site/build';
const port = 4173;
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const mimeTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};
const server = createServer((request, response) => {
  const requestedPath = decodeURIComponent(request.url.split('?')[0]);
  const relativePath = requestedPath === '/' || requestedPath.endsWith('/')
    ? `${requestedPath}index.html`.replace('//', '/')
    : requestedPath;
  const filePath = normalize(join(buildDir, relativePath));
  if (!filePath.startsWith(buildDir)) {
    response.writeHead(404);
    response.end();
    return;
  }
  createReadStream(filePath)
    .on('open', () => response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' }))
    .on('error', () => {
      response.writeHead(404);
      response.end();
    })
    .pipe(response);
});
await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

try {
  for (const [index, path] of pages.entries()) {
  const output = `${outputDir}/${String(index + 1).padStart(2, '0')}-${path.replaceAll('/', '-')}.pdf`;
  const source = `/home/felix/kuccps-ticketing/docs-site/build/docs/${path}/index.html`;
  await access(source);
  await new Promise((resolve, reject) => {
    const process = spawn('/opt/google/chrome/google-chrome', [
      '--headless', '--no-sandbox', '--disable-gpu', '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw', '--virtual-time-budget=3000',
      `--print-to-pdf=${output}`, `http://127.0.0.1:${port}/docs/${path}/`,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    let error = '';
    process.stderr.on('data', (chunk) => { error += chunk; });
    process.on('error', reject);
    process.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${path}: ${error}`)));
  });
  process.stdout.write(`Exported ${index + 1}/${pages.length}: ${path}\n`);
  }

  await new Promise((resolve, reject) => {
  const process = spawn('pdfunite', [
    ...pages.map((path, index) => `${outputDir}/${String(index + 1).padStart(2, '0')}-${path.replaceAll('/', '-')}.pdf`),
    outputFile,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let error = '';
  process.stderr.on('data', (chunk) => { error += chunk; });
  process.on('error', reject);
  process.on('close', (code) => code === 0 ? resolve() : reject(new Error(`PDF merge failed: ${error}`)));
});

  process.stdout.write(`Created ${outputFile} from ${pages.length} routes\n`);
} finally {
  await new Promise((resolve) => server.close(resolve));
}
