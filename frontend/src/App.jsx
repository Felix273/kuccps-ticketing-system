import React, { useState, useEffect } from 'react';
import { HomePage } from './components/auth/HomePage';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { DashboardView } from './components/dashboard/DashboardView';
import { TicketsView } from './components/tickets/TicketsView';
import { DepartmentsView } from './components/departments/DepartmentsView';
import { UsersView } from './components/users/UsersView';
import { KnowledgeBaseView } from './components/knowledgebase/KnowledgeBaseView';
import AdminPanel from './components/admin/AdminPanel';
import { authService } from './services/authService';
import { settingsService } from './services/settingsService';
import { useTickets } from './hooks/useTickets';
import { useStatistics } from './hooks/useStatistics';

function App() {
  const initialUser = authService.getCurrentUser();
  const initialToken = localStorage.getItem('token');
  const [showHomePage, setShowHomePage] = useState(!(initialUser && initialToken));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser && initialToken));
  const [currentUser, setCurrentUser] = useState(initialUser && initialToken ? initialUser : null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const { tickets, isLoading: ticketsLoading, error: ticketsError, fetchTickets } = useTickets(isAuthenticated);
  const { statistics, isLoading: statsLoading } = useStatistics(isAuthenticated);

  useEffect(() => {
    const applyBranding = async () => {
      try {
        const response = await settingsService.getPublicSettings();
        if (!response.success || !response.settings) return;
        const settings = response.settings;
        document.title = settings.organizationName || 'KUCCPS Ticketing';
        document.documentElement.style.setProperty('--brand-primary', settings.primaryColor || '#911414');
        document.documentElement.style.setProperty('--brand-secondary', settings.secondaryColor || '#d20001');
        document.body.classList.toggle('theme-dark', Boolean(settings.darkModeEnabled));
        document.body.classList.toggle('theme-high-contrast', settings.contrastMode === 'high');
        if (settings.faviconUrl) {
          let favicon = document.querySelector('link[rel="icon"]');
          if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
          }
          favicon.href = settings.faviconUrl;
        }
      } catch (error) {
        console.warn('Unable to apply public branding settings:', error.message);
      }
    };

    applyBranding();
  }, []);

  const handleLogin = async (username, password) => {
    try {
      const result = await authService.login(username, password);

      if (result.success) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, message: result.message || 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Unable to connect to server. Please try again.' };
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowHomePage(true);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated && showHomePage) {
    return <HomePage onGetStarted={() => setShowHomePage(false)} />;
  }

  if (!isAuthenticated && !showHomePage) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBack={() => setShowHomePage(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header currentUser={currentUser} onLogout={handleLogout} setActiveTab={setActiveTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            tickets={tickets}
            statistics={statistics}
            isLoading={statsLoading}
            error={ticketsError}
          />
        )}
        {activeTab === 'tickets' && (
          <TicketsView
            tickets={tickets}
            isLoading={ticketsLoading}
            error={ticketsError}
            onRefresh={fetchTickets}
          />
        )}
        {activeTab === 'departments' && (
          <DepartmentsView />
        )}
        {activeTab === 'users' && (
          <UsersView />
        )}
        {activeTab === 'knowledgebase' && (
          <KnowledgeBaseView />
        )}
        {activeTab === 'admin' && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}

export default App;
