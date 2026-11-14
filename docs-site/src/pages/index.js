import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className="container">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <div className={styles.heroContent}>
              <div className={styles.logoContainer}>
                <svg viewBox="0 0 100 100" className={styles.logo} xmlns="http://www.w3.org/2000/svg">
                  <rect width="100" height="100" rx="20" fill="#911414"/>
                  <text x="50" y="68" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">K</text>
                </svg>
              </div>
              <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
              <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
              <div className={styles.buttons}>
                <Link className="button button--primary button--lg" to="/docs/intro">
                  Get Started
                </Link>
                <Link className="button button--outline button--lg" to="/docs/architecture/overview">
                  Explore Architecture
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Documentation`}
      description="Full-stack IT support ticketing platform for KUCCPS. Complete documentation covering architecture, API reference, deployment, and more.">
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <div className="col col--4">
                <div className="text--center padding-horiz--md">
                  <h3>Ticket Management</h3>
                  <p>Full lifecycle from creation to resolution with SLA tracking, escalation, attachments, and audit history.</p>
                </div>
              </div>
              <div className="col col--4">
                <div className="text--center padding-horiz--md">
                  <h3>Dashboard Analytics</h3>
                  <p>Real-time charts, SLA compliance monitoring, agent workload tracking, and CSAT reporting.</p>
                </div>
              </div>
              <div className="col col--4">
                <div className="text--center padding-horiz--md">
                  <h3>Google Workspace</h3>
                  <p>Create tickets directly from Gmail using a contextual add-on with seamless API integration.</p>
                </div>
              </div>
            </div>
            <div className="row" style={{ marginTop: '2rem' }}>
              <div className="col col--4">
                <div className="text--center padding-horiz--md">
                  <h3>Email Integration</h3>
                  <p>Automated SMTP notifications, optional IMAP monitoring, and professional email templates.</p>
                </div>
              </div>
              <div className="col col--4">
                <div className="text--center padding-horiz--md">
                  <h3>Knowledge Base</h3>
                  <p>Self-service articles with search, ratings, and an intelligent ticket-suggestion engine.</p>
                </div>
              </div>
              <div className="col col--4">
                <div className="text--center padding-horiz--md">
                  <h3>Active Directory</h3>
                  <p>Seamless LDAP/AD integration for user sync, authentication, and department management.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
