const { themes } = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
const themeConfig = {
  navbar: {
    title: 'KUCCPS Ticketing System',
    logo: {
      alt: 'KUCCPS Logo',
      src: 'img/logo.svg',
    },
    items: [
      {
        type: 'docSidebar',
        sidebarId: 'docsSidebar',
        position: 'left',
        label: 'Documentation',
      },
      {
        href: 'https://github.com/Felix273/kuccps-ticketing-system',
        label: 'GitHub',
        position: 'right',
      },
    ],
  },
  footer: {
    style: 'dark',
    links: [
      {
        title: 'Docs',
        items: [
          {
            label: 'Getting Started',
            to: '/docs/intro',
          },
          {
            label: 'Architecture',
            to: '/docs/architecture/overview',
          },
          {
            label: 'API Reference',
            to: '/docs/api/overview',
          },
        ],
      },
      {
        title: 'Community',
        items: [
          {
            label: 'GitHub',
            href: 'https://github.com/Felix273/kuccps-ticketing-system',
          },
        ],
      },
      {
        title: 'More',
        items: [
          {
            label: 'Deployment Guide',
            to: '/docs/deployment/overview',
          },
          {
            label: 'Troubleshooting',
            to: '/docs/troubleshooting/common-issues',
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} KUCCPS. Built with Docusaurus.`,
  },
  prism: {
    theme: lightCodeTheme,
    darkTheme: darkCodeTheme,
    additionalLanguages: ['bash', 'javascript', 'jsx', 'typescript', 'python', 'sql', 'json'],
  },
};

/** @type {import('@docusaurus/preset-classic').Options} */
const presets = [
  [
    'classic',
    /** @type {import('@docusaurus/preset-classic').Options} */
    ({
      docs: {
        sidebarPath: require.resolve('./sidebars.js'),
        editUrl: 'https://github.com/Felix273/kuccps-ticketing-system/tree/main/',
      },
      blog: false,
      theme: {
        customCss: require.resolve('./src/css/custom.css'),
      },
    }),
  ],
];

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'KUCCPS Ticketing System',
  tagline: 'Full-stack IT support ticketing platform for KUCCPS',
  favicon: 'img/favicon.ico',
  url: 'https://kuccps-ticketing-docs.example.com',
  baseUrl: '/',
  organizationName: 'Felix273',
  projectName: 'kuccps-ticketing-system',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets,
  themeConfig,
  markdown: {
    mermaid: true,
  },
  plugins: [],
};

module.exports = config;
