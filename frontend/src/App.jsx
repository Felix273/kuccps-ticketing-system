import React, { useState, useEffect } from 'react';
import { HomePage } from './components/auth/HomePage';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TicketsView } from './components/tickets/TicketsView';
import { DepartmentsView } from './components/departments/DepartmentsView';
import { UsersView } from './components/users/UsersView';
import { KnowledgeBaseView } from './components/knowledgebase/KnowledgeBaseView';
import AdminPanel from './components/admin/AdminPanel';
import { authService } from './services/authService';
import { settingsService } from './services/settingsService';
import { accessControlService } from './services/accessControlService';
import { useTickets } from './hooks/useTickets';
import { useStatistics } from './hooks/useStatistics';

function App() {
  const initialUser = authService.getCurrentUser();
  const initialToken = localStorage.getItem('token');
  const [showHomePage, setShowHomePage] = useState(!(initialUser && initialToken));
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser && initialToken));
  const [currentUser, setCurrentUser] = useState(initialUser && initialToken ? initialUser : null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { tickets, isLoading: ticketsLoading, error: ticketsError, fetchTickets } = useTickets(isAuthenticated);
  const { statistics, isLoading: statsLoading } = useStatistics(isAuthenticated);
  useEffect(() => {
    let active = true;
    if (!isAuthenticated) return () => { active = false; };
    accessControlService.getMyAccess()
      .then(access => {
        if (active) {
          setCurrentUser(user => user ? {
            ...user,
            permissions: access.permissions || [],
            isAdmin: Boolean(access.isAdmin)
          } : user);
        }
      })
      .catch(error => {
        console.error('Unable to load current access permissions:', error);
        if (active) {
          setCurrentUser(user => user ? { ...user, permissions: [], isAdmin: false } : user);
        }
      });
    return () => { active = false; };
  }, [isAuthenticated, currentUser?.id]);


  useEffect(() => {
    let active = true;
    if (!isAuthenticated) return () => { active = false; };
    accessControlService.getMyAccess()
      .then(access => {
        if (active) {
          setCurrentUser(user => user ? {
            ...user,
            permissions: access.permissions || [],
            isAdmin: Boolean(access.isAdmin)
          } : user);
        }
      })
      .catch(error => {
        console.error('Unable to load current access permissions:', error);
        if (active) {
          setCurrentUser(user => user ? { ...user, permissions: [], isAdmin: false } : user);
        }
      });
    return () => { active = false; };
  }, [isAuthenticated, currentUser?.id]);

  useEffect(() => {
    const applyBranding = async () => {
      try {
        const response = await settingsService.getPublicSettings();
        if (!response.success || !response.settings) return;
        const settings = response.settings;
        document.title = settings.organizationName || 'KUCCPS IT Ticketing';
        document.documentElement.style.setProperty('--brand-primary', settings.primaryColor || '#990024');
        document.documentElement.style.setProperty('--brand-secondary', settings.secondaryColor || '#7a001d');
      } catch (err) {
        console.warn('Branding load skipped:', err.message);
      }
    };
    applyBranding();
  }, []);

  const handleLogin = async (username, password) => {
    const result = await authService.login(username, password);
    if (result.success) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setShowHomePage(false);
    }
    return result;
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowHomePage(true);
  };

  if (showHomePage && !isAuthenticated) {
    return <HomePage onGetStarted={() => setShowHomePage(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBack={() => setShowHomePage(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      {/* 1. Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* 2. Main Content Container (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopBar
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onRefresh={fetchTickets}
          isLoading={ticketsLoading}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
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
            <AdminPanel currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
