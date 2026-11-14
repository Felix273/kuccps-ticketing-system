/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      link: { type: 'doc', id: 'intro' },
      items: [
        'getting-started/installation',
        'getting-started/configuration',
        'getting-started/development-setup',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: { type: 'doc', id: 'architecture/overview' },
      items: [
        'architecture/backend',
        'architecture/frontend',
        'architecture/database',
        'architecture/google-addon',
        'architecture/email-service',
      ],
    },
    {
      type: 'category',
      label: 'Backend',
      link: { type: 'doc', id: 'backend/overview' },
      items: [
        'backend/server-setup',
        'backend/middleware',
        'backend/controllers',
        'backend/routes',
        'backend/services',
        'backend/security',
        'backend/scheduler',
      ],
    },
    {
      type: 'category',
      label: 'Frontend',
      link: { type: 'doc', id: 'frontend/overview' },
      items: [
        'frontend/structure',
        'frontend/components',
        'frontend/services',
        'frontend/hooks',
        'frontend/routing',
        'frontend/styling',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      link: { type: 'doc', id: 'database/overview' },
      items: [
        'database/schema',
        'database/migrations',
        'database/seed-data',
        'database/prisma-usage',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: { type: 'doc', id: 'api/overview' },
      items: [
        'api/authentication',
        'api/tickets',
        'api/users',
        'api/departments',
        'api/settings',
        'api/knowledge-base',
        'api/status-issues',
        'api/operations',
        'api/notifications',
        'api/forms',
        'api/views',
      ],
    },
    {
      type: 'category',
      label: 'Google Workspace Add-on',
      link: { type: 'doc', id: 'google-addon/overview' },
      items: [
        'google-addon/setup',
        'google-addon/deployment',
        'google-addon/api-integration',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      link: { type: 'doc', id: 'deployment/overview' },
      items: [
        'deployment/backend',
        'deployment/frontend',
        'deployment/database',
        'deployment/reverse-proxy',
        'deployment/production-checklist',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      items: [
        'operations/maintenance',
        'operations/backup',
        'operations/monitoring',
      ],
    },
    {
      type: 'category',
      label: 'Troubleshooting',
      link: { type: 'doc', id: 'troubleshooting/common-issues' },
      items: [
        'troubleshooting/cors',
        'troubleshooting/database',
        'troubleshooting/email',
        'troubleshooting/authentication',
        'troubleshooting/deployment',
      ],
    },
  ],
};

module.exports = sidebars;
