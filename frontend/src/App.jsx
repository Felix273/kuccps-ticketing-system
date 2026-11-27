import { Toaster, toast } from 'react-hot-toast';
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
import { useIdleLogout } from './hooks/useIdleLogout';

function App() {
  // The session is an httpOnly cookie; the cached profile only drives the initial UI and is
  // confirmed with the server below.
  const initialUser = authService.getCurrentUser();
  const [showHomePage, setShowHomePage] = useState(!initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser));
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardTicketFilter, setDashboardTicketFilter] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Confirm the cookie session once on load (it may have expired or been revoked).
  useEffect(() => {
    if (!initialUser) return;
    authService.validateSession().then(result => {
      if (result.success) {
        setCurrentUser(user => ({ ...user, ...result.user }));
      } else {
        localStorage.removeItem('user');
        setCurrentUser(null);
        setIsAuthenticated(false);
        setShowHomePage(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = () => setRefreshKey(key => key + 1);
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

  // The API client raises this when the server rejects the session (expired or revoked).
  useEffect(() => {
    const onExpired = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setShowHomePage(false);
      toast('Your session has ended. Please sign in again.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

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

  useIdleLogout(isAuthenticated, () => {
    handleLogout();
    toast('You have been signed out due to 5 minutes of inactivity.');
  });

  if (showHomePage && !isAuthenticated) {
    return (
      <>
        <HomePage onGetStarted={() => setShowHomePage(false)} />
        <Toaster position="top-right" toastOptions={{ className: "font-mono text-xs border border-zinc-200 bg-white text-zinc-900 shadow-lg rounded-lg p-3", duration: 3500 }} />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setShowHomePage(true)}
        />
        <Toaster position="top-right" toastOptions={{ className: "font-mono text-xs border border-zinc-200 bg-white text-zinc-900 shadow-lg rounded-lg p-3", duration: 3500 }} />
      </>
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
          onRefresh={refreshData}
          isLoading={false}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              refreshKey={refreshKey}
              onViewTickets={filter => {
                setDashboardTicketFilter(filter);
                setActiveTab('tickets');
              }}
            />
          )}
          {activeTab === 'tickets' && (
            <TicketsView
              refreshKey={refreshKey}
              dashboardFilter={dashboardTicketFilter}
              onClearDashboardFilter={() => setDashboardTicketFilter(null)}
            />
          )}
          {activeTab === 'departments' && (
            <DepartmentsView refreshKey={refreshKey} />
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
      <Toaster position="top-right" toastOptions={{ className: "font-mono text-xs border border-zinc-200 bg-white text-zinc-900 shadow-lg rounded-lg p-3", duration: 3500 }} />
      </div>
    </div>
  );
}

export default App;
