import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Mail, AlertCircle, Clock, CheckCircle, Users, TrendingUp, Filter, Search, Plus, Edit, Trash2, Download, Bell, Settings, LogOut, ChevronDown, Calendar, Tag, User, FileText, Paperclip, Send, X, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const ISSUE_CATEGORIES = [
  'Hardware Issues',
  'Network & Connectivity Issues',
  'Software Issues',
  'Email & Communication Issues',
  'Access & Security Issues',
  'System Performance Issues',
  'Peripheral Devices',
  'General Requests'
];

const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const TICKET_STATUS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const DEPARTMENTS = [
  'Administration',
  'Finance',
  'Human Resources',
  'Placement Services',
  'ICT',
  'Legal',
  'Public Relations',
  'Quality Assurance'
];

const LoginPage = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.message || 'Login failed');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white transition-all shadow-md flex items-center gap-2"
        >
          ← Back to Home
        </button>
      )}

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#d20001] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#911414] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-[#ac0807] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/kuccps-logo.png" 
            alt="KUCCPS Logo" 
            className="h-20 w-auto mb-4 mx-auto"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#911414] to-[#d20001] bg-clip-text text-transparent mb-2">
            KUCCPS IT Support
          </h1>
          <p className="text-gray-600">Internal Ticketing System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-opacity-95">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm">Sign in to access the IT support dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#911414] border-gray-300 rounded focus:ring-[#911414]"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-[#911414] hover:text-[#d20001]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#911414] to-[#d20001] text-white font-semibold rounded-lg hover:from-[#ac0807] hover:to-[#911414] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#911414] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              This system uses LDAP/Active Directory authentication
            </p>
          </div>

          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-[#911414] mb-1">Demo Credentials:</p>
            <p className="text-xs text-[#911414]">Username: <code className="bg-red-100 px-1 rounded">admin</code> / Password: <code className="bg-red-100 px-1 rounded">admin</code></p>
            <p className="text-xs text-[#911414]">Username: <code className="bg-red-100 px-1 rounded">itstaff</code> / Password: <code className="bg-red-100 px-1 rounded">itstaff</code></p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact IT Support at{' '}
            <a href="mailto:itsupport@kuccps.ac.ke" className="text-[#911414] hover:text-[#d20001] font-medium">
              itsupport@kuccps.ac.ke
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

const HomePage = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/kuccps-logo.png" 
                alt="KUCCPS Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">KUCCPS ICT Support</h1>
                <p className="text-xs text-gray-600">Internal Ticketing System</p>
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="px-6 py-2 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md"
            >
              Staff Login
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-8">
            <img 
              src="/kuccps-logo.png" 
              alt="KUCCPS Logo" 
              className="h-32 w-auto"
              style={{ margin: '0 auto' }}
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to the KUCCPS ICT Support Center
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              To improve our service delivery and ensure that all ICT-related requests are handled efficiently, 
              KUCCPS ICT utilizes an internal support ticket system.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="flex items-start gap-4 p-6 bg-red-50 rounded-xl border border-red-100">
                <div className="w-12 h-12 bg-[#911414] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Tag className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Unique Ticket Number</h3>
                  <p className="text-sm text-gray-600">
                    Each request you submit will be assigned a unique ticket number for easy tracking of progress and responses online.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-red-50 rounded-xl border border-red-100">
                <div className="w-12 h-12 bg-[#d20001] rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Request History</h3>
                  <p className="text-sm text-gray-600">
                    You can view the full history of your past ICT support requests for reference.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#911414]" />
                How to Submit a Request
              </h3>
              <p className="text-gray-700 mb-4">
                To submit an ICT support request, simply send an email to:
              </p>
              <a 
                href="mailto:itsupport@kuccps.ac.ke" 
                className="inline-flex items-center gap-2 text-lg font-semibold text-[#911414] hover:text-[#d20001] transition-colors"
              >
                itsupport@kuccps.ac.ke
                <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-sm text-gray-600 mt-4">
                Our system will automatically create a ticket and you'll receive a confirmation with your unique ticket number.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#911414] to-[#d20001] text-white text-lg font-semibold rounded-xl hover:from-[#ac0807] hover:to-[#911414] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            IT Staff Login
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-600 mt-4">
            For KUCCPS ICT staff members only
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 Kenya Universities and Colleges Central Placement Service (KUCCPS)</p>
            <p className="mt-2">ICT Support Center - Internal Use Only</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App = () => {
  const [showHomePage, setShowHomePage] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [itStaff, setItStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tickets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/tickets/statistics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchITStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users?role=staff', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setItStaff(data.users);
      }
    } catch (error) {
      console.error('Error fetching IT staff:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
      fetchStatistics();
      fetchITStaff();
      fetchDepartments();
    }
  }, [isAuthenticated]);
  const analytics = useMemo(() => {
    const departmentStats = DEPARTMENTS.map(dept => ({
      name: dept.length > 15 ? dept.substring(0, 12) + '...' : dept,
      tickets: tickets.filter(t => t.department?.name === dept).length
    })).sort((a, b) => b.tickets - a.tickets);

    const categoryStats = ISSUE_CATEGORIES.map(cat => ({
      name: cat.replace(' Issues', '').replace(' & ', '/'),
      count: tickets.filter(t => t.category === cat).length
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    const statusStats = TICKET_STATUS.map(status => ({
      name: status,
      value: tickets.filter(t => t.status === status).length
    }));

    const priorityStats = PRIORITY_LEVELS.map(priority => ({
      name: priority,
      count: tickets.filter(t => t.priority === priority).length
    }));

    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTickets = tickets.filter(t => {
        const ticketDate = new Date(t.createdAt);
        return ticketDate.toDateString() === date.toDateString();
      });
      trendData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tickets: dayTickets.length,
        resolved: dayTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length
      });
    }

    const avgResponseTime = tickets.filter(t => t.responseTime).reduce((acc, t) => acc + t.responseTime, 0) / tickets.filter(t => t.responseTime).length || 0;
    const avgResolutionTime = tickets.filter(t => t.resolutionTime).reduce((acc, t) => acc + t.resolutionTime, 0) / tickets.filter(t => t.resolutionTime).length || 0;

    return {
      departmentStats,
      categoryStats,
      statusStats,
      priorityStats,
      trendData,
      avgResponseTime: avgResponseTime.toFixed(1),
      avgResolutionTime: avgResolutionTime.toFixed(1),
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'Open').length,
      inProgressTickets: tickets.filter(t => t.status === 'In Progress').length,
      resolvedTickets: tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
      criticalTickets: tickets.filter(t => t.priority === 'Critical' && t.status !== 'Closed').length
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus;
      const matchesDepartment = filterDepartment === 'All' || ticket.department?.name === filterDepartment;
      const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ticket.requesterEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesDepartment && matchesSearch;
    });
  }, [tickets, filterStatus, filterDepartment, searchQuery]);

  const COLORS = ['#911414', '#d20001', '#ac0807', '#f59e0b', '#10b981', '#3b82f6', '#14b8a6', '#f97316'];

  if (!isAuthenticated) {
    if (showHomePage) {
      return <HomePage onGetStarted={() => setShowHomePage(false)} />;
    }
    return <LoginPage onLogin={handleLogin} onBack={() => setShowHomePage(true)} />;
  }

  const handleDeleteDepartment = async (id, ticketCount) => {
  if (ticketCount > 0) {
    alert(`Cannot delete department with ${ticketCount} active tickets. Please reassign or close tickets first.`);
    return;
  }

  if (!confirm('Are you sure you want to delete this department?')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/departments/${String(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      alert('Department deleted successfully!');
      fetchDepartments();
    } else {
      alert(data.message || 'Failed to delete department');
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Failed to delete department');
  }
};

  const DepartmentModal = () => {
    if (!showDepartmentModal) return null;

    const [name, setName] = React.useState(editingDepartment?.name || '');
    const [code, setCode] = React.useState(editingDepartment?.code || '');
    const [isSaving, setIsSaving] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSave = async () => {
  if (!name.trim()) {
    setError('Department name is required');
    return;
  }

  setIsSaving(true);
  setError('');

  try {
    const token = localStorage.getItem('token');
    const url = editingDepartment 
      ? `http://localhost:5000/api/departments/${String(editingDepartment.id)}`
      : 'http://localhost:5000/api/departments';
    
    const response = await fetch(url, {
      method: editingDepartment ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, code })
    });

    const data = await response.json();

    if (data.success) {
      alert(editingDepartment ? 'Department updated successfully!' : 'Department created successfully!');
      setShowDepartmentModal(false);
      fetchDepartments();
    } else {
      setError(data.message || 'Failed to save department');
    }
  } catch (error) {
    console.error('Save error:', error);
    setError('Failed to save department');
  } finally {
    setIsSaving(false);
  }
};

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6 rounded-t-xl">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold">
                {editingDepartment ? 'Edit Department' : 'Add Department'}
              </h2>
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                placeholder="e.g., Administration"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Department Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                placeholder="e.g., ADMIN"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Department'}
              </button>
              <button
                onClick={() => setShowDepartmentModal(false)}
                disabled={isSaving}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor, subtitle, trend }) => (
    <div className={`${bgColor} rounded-xl shadow-lg p-6 transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <p className={`text-4xl font-bold ${color} mb-1`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">{trend}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TicketRow = ({ ticket }) => {
    const priorityConfig = {
      Low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      Medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      Critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
    };

    const statusConfig = {
      Open: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      'In Progress': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      Closed: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' }
    };

    return (
      <tr 
        className="border-b border-gray-100 hover:bg-red-50/30 cursor-pointer transition-colors duration-150" 
        onClick={() => setSelectedTicket(ticket)}
      >
        <td className="px-6 py-4">
          <span className="text-sm font-semibold text-[#911414]">{ticket.ticketNumber}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{ticket.subject}</span>
            <span className="text-xs text-gray-500 mt-1">{ticket.requesterEmail}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-700">{ticket.department?.name || 'N/A'}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-600">{ticket.category}</span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${priorityConfig[ticket.priority].bg} ${priorityConfig[ticket.priority].text} ${priorityConfig[ticket.priority].border}`}>
            {ticket.priority}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].text} ${statusConfig[ticket.status].border}`}>
            {ticket.status}
          </span>
        </td>
        <td className="px-6 py-4">
          <span className="text-sm text-gray-600">{new Date(ticket.createdAt).toLocaleDateString()}</span>
        </td>
      </tr>
    );
  };
  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Mail}
          title="Total Tickets"
          value={statistics?.totalTickets || 0}
          color="text-[#911414]"
          bgColor="bg-white"
          trend="+12% from last month"
        />
        <StatCard
          icon={AlertCircle}
          title="Open Tickets"
          value={statistics?.openTickets || 0}
          color="text-orange-600"
          bgColor="bg-white"
          subtitle={`${statistics?.criticalTickets || 0} critical`}
        />
        <StatCard
          icon={Clock}
          title="In Progress"
          value={statistics?.inProgressTickets || 0}
          color="text-purple-600"
          bgColor="bg-white"
          subtitle={`Avg: ${statistics?.avgResponseTime || 0}h response`}
        />
        <StatCard
          icon={CheckCircle}
          title="Resolved"
          value={statistics?.resolvedTickets || 0}
          color="text-emerald-600"
          bgColor="bg-white"
          trend="+8% this week"
        />
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Trends (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={analytics.trendData}>
            <defs>
              <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#911414" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#911414" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }} 
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Area type="monotone" dataKey="tickets" stroke="#911414" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" name="New Tickets" />
            <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tickets by Department</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics.departmentStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#6b7280" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="tickets" fill="#911414" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Status Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={analytics.statusStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Issue Categories</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" width={150} stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }} 
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">SLA Performance Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Average Response Time</span>
                <span className="text-sm font-bold text-[#911414]">{statistics?.avgResponseTime || 0} hours</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#911414] to-[#d20001] h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(((statistics?.avgResponseTime || 0) / 24) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 24 hours</p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Average Resolution Time</span>
                <span className="text-sm font-bold text-emerald-600">{statistics?.avgResolutionTime || 0} hours</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(((statistics?.avgResolutionTime || 0) / 72) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Target: 72 hours</p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Priority Distribution</h4>
              <div className="space-y-2">
                {analytics.priorityStats.map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        stat.name === 'Critical' ? 'bg-rose-500' :
                        stat.name === 'High' ? 'bg-orange-500' :
                        stat.name === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>
                      <span className="text-sm text-gray-700">{stat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  const TicketsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tickets by ID, subject, or email..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] text-sm font-medium"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            {TICKET_STATUS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] text-sm font-medium"
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <button className="px-6 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] flex items-center gap-2 font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredTickets.length}</span> of <span className="font-semibold text-gray-900">{tickets.length}</span> tickets
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-50 to-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTickets.map(ticket => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No tickets found matching your filters.</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );

  const UsersView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage staff users and department assignments</p>
          </div>
          <button className="px-6 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] flex items-center gap-2 font-medium transition-colors shadow-md hover:shadow-lg">
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-50 to-orange-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {itStaff.map(user => (
                <tr key={user.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.department}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-[#911414] border border-red-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 text-[#911414] hover:bg-red-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const DepartmentsView = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage organizational departments</p>
          </div>
          <button 
            onClick={() => {
              setEditingDepartment(null);
              setShowDepartmentModal(true);
            }}
            className="px-6 py-3 bg-[#911414] text-white rounded-lg hover:bg-[#ac0807] flex items-center gap-2 font-medium transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Department
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => (
            <div key={dept.id} className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{dept.name}</h3>
                  {dept.code && (
                    <span className="inline-block mt-1 px-2 py-1 bg-[#911414] text-white text-xs rounded">
                      {dept.code}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingDepartment(dept);
                      setShowDepartmentModal(true);
                    }}
                    className="p-2 text-[#911414] hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDepartment(dept.id, dept._count?.tickets || 0)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="w-4 h-4" />
                <span>{dept._count?.tickets || 0} tickets</span>
              </div>
            </div>
          ))}
        </div>

        {departments.length === 0 && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No departments found</p>
            <p className="text-gray-400 text-sm mt-2">Add your first department to get started</p>
          </div>
        )}
      </div>
    </div>
  );
  const TicketDetailModal = () => {
    if (!selectedTicket) return null;

    const [status, setStatus] = React.useState(selectedTicket.status);
    const [priority, setPriority] = React.useState(selectedTicket.priority);
    const [category, setCategory] = React.useState(selectedTicket.category);
    const [assignedTo, setAssignedTo] = React.useState(selectedTicket.assignedToId || '');
    const [internalNotes, setInternalNotes] = React.useState('');
    const [replyMessage, setReplyMessage] = React.useState('');
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [updateError, setUpdateError] = React.useState('');
    const [updateSuccess, setUpdateSuccess] = React.useState('');

    const handleUpdate = async (sendReply = false) => {
      setIsUpdating(true);
      setUpdateError('');
      setUpdateSuccess('');

      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:5000/api/tickets/${selectedTicket.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status,
            priority,
            category,
            assignedToId: assignedTo || null
          })
        });

        const data = await response.json();

        if (data.success) {
          if (internalNotes.trim()) {
            await fetch(`http://localhost:5000/api/tickets/${selectedTicket.id}/comments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                content: internalNotes,
                isInternal: true
              })
            });
          }

          if (sendReply && replyMessage.trim()) {
            await fetch(`http://localhost:5000/api/tickets/${selectedTicket.id}/comments`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                content: replyMessage,
                isInternal: false
              })
            });
          }

          setUpdateSuccess('Ticket updated successfully!');
          await fetchTickets();
          
          setTimeout(() => {
            setSelectedTicket(null);
          }, 1500);
        } else {
          setUpdateError(data.message || 'Failed to update ticket');
        }
      } catch (error) {
        console.error('Update error:', error);
        setUpdateError('Failed to update ticket. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-[#911414] to-[#d20001] text-white p-6 rounded-t-xl z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{selectedTicket.ticketNumber}</h2>
                <p className="text-red-100 mt-1">{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {updateSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-green-800">{updateSuccess}</p>
              </div>
            )}

            {updateError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{updateError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {TICKET_STATUS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Priority</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITY_LEVELS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Category</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {ISSUE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Assign To</label>
                <select 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {itStaff.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-100">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[#911414]" />
                Requester Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTicket.requesterEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTicket.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Created</p>
                  <p className="text-sm font-medium text-gray-900">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                Email Content
              </label>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">{selectedTicket.description}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Internal Notes</label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent resize-none"
                rows={3}
                placeholder="Add internal notes (not visible to requester)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              ></textarea>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-2">
                <Send className="w-4 h-4 text-gray-600" />
                Reply to Requester
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#911414] focus:border-transparent resize-none"
                rows={4}
                placeholder="Type your response to the requester..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
              ></textarea>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {!selectedTicket.assignedToId && (
                <button 
                  onClick={async () => {
                    setAssignedTo(currentUser?.id);
                    await handleUpdate(false);
                  }}
                  disabled={isUpdating}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Claim This Ticket
                </button>
              )}
              <button 
                onClick={() => handleUpdate(true)}
                disabled={isUpdating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#911414] to-[#d20001] text-white rounded-lg hover:from-[#ac0807] hover:to-[#911414] font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Send Reply & Update'}
              </button>
              <button 
                onClick={() => handleUpdate(false)}
                disabled={isUpdating}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Only
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                disabled={isUpdating}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/kuccps-logo.png" 
                alt="KUCCPS Logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#911414] to-[#d20001] bg-clip-text text-transparent">
                  KUCCPS IT Ticketing System
                </h1>
                <p className="text-sm text-gray-600">Internal IT Support Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-600">{currentUser?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-[#911414] to-[#d20001] rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {currentUser?.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'tickets'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users & Departments
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'departments'
                  ? 'border-[#911414] text-[#911414]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Departments
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'tickets' && <TicketsView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'departments' && <DepartmentsView />}
      </main>

      <TicketDetailModal />
      <DepartmentModal />
    </div>
  );
};

export default App;
