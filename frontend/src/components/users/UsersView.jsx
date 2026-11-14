import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Table as TableIcon, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight,
  X,
  Globe
} from 'lucide-react';
import { UserCard } from './UserCard';
import { useUsers } from '../../hooks/useUsers';
import { authService } from '../../services/authService';

export const UsersView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [syncingAd, setSyncingAd] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const { users = [], isLoading, refetch, syncFromAd } = useUsers();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole]);

  const stats = useMemo(() => {
    const total = users.length;
    const staff = users.filter(u => u.role === 'staff').length;
    const admin = users.filter(u => u.role === 'admin').length;
    const adSynced = users.filter(u => u.ldapSync).length;
    return { total, staff, admin, adSynced };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery.trim() ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.username?.toLowerCase().includes(q) ||
        user.department?.name?.toLowerCase().includes(q);
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const handleSyncAd = async () => {
    if (!isAdmin || !syncFromAd) return;
    setSyncingAd(true);
    const result = await syncFromAd();
    setSyncingAd(false);
    if (result.success) {
      alert(`Synced ${result.count} user(s) from Active Directory`);
    } else {
      alert(result.message || 'Failed to sync users from Active Directory');
    }
  };

  const getRoleBadge = (role) => {
    const config = {
      admin: 'bg-red-50 text-[#990024] border-red-200 font-bold',
      staff: 'bg-blue-50 text-blue-700 border-blue-200 font-semibold',
      user: 'bg-zinc-50 text-zinc-600 border-zinc-200 font-medium'
    };
    return config[role] || config.user;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin text-[#990024]" />
          <span>LOADING_STAFF_DIRECTORY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-sans">
      {/* 1. KPI Strip */}
      <div className="border border-zinc-200 bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">Total Accounts</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.total}</p>
          </div>
          <UsersIcon className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">IT Support Staff</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.staff}</p>
          </div>
          <UserCheck className="w-4 h-4 text-blue-600" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">Administrators</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.admin}</p>
          </div>
          <ShieldCheck className="w-4 h-4 text-[#990024]" />
        </div>

        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 font-semibold">AD Synced</p>
            <p className="font-mono text-2xl font-bold text-zinc-900 tabular-nums mt-0.5">{stats.adSynced}</p>
          </div>
          <Globe className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      {/* 2. Toolbar & Table Container */}
      <div className="border border-zinc-200 bg-white overflow-hidden flex flex-col">
        <div className="p-4 border-b border-zinc-200 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                  Personnel & Staff Directory
                </h2>
                <span className="font-mono text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  AD Managed
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Authoritative personnel roster pulled directly from Active Directory
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <div className="flex items-center border border-zinc-200 rounded p-0.5 bg-zinc-50">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-400'}`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-400'}`}
                  title="Card View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={refetch}
                className="p-1.5 text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {isAdmin && syncFromAd && (
                <button
                  onClick={handleSyncAd}
                  disabled={syncingAd}
                  className="px-3 py-1.5 text-xs font-mono font-semibold text-zinc-700 bg-white border border-zinc-200 rounded hover:bg-zinc-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncingAd ? 'animate-spin text-[#990024]' : ''}`} />
                  <span>{syncingAd ? 'Syncing...' : 'Sync AD Now'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
            <div className="sm:col-span-8 relative flex items-center">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search staff by name, email, username, directorate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1 text-xs font-sans bg-zinc-50 border border-zinc-200 rounded text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#990024] focus:bg-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 text-zinc-400 hover:text-zinc-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-2.5 py-1 text-xs font-mono bg-zinc-50 border border-zinc-200 rounded text-zinc-700 focus:outline-none focus:border-[#990024] cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="staff">IT Support Staff</option>
                <option value="user">Regular Staff</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Table / Card View */}
        <div className="flex-1">
          {totalItems > 0 ? (
            viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-mono text-[10.5px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-semibold">User</th>
                      <th className="py-2.5 px-4 font-semibold">Email</th>
                      <th className="py-2.5 px-4 font-semibold">Directorate</th>
                      <th className="py-2.5 px-4 font-semibold">Role</th>
                      <th className="py-2.5 px-4 font-semibold">Source</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Workload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {paginatedUsers.map((user) => {
                      const initials = user.name
                        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                        : 'U';
                      const deptName = user.department?.name || (typeof user.department === 'string' ? user.department : null);

                      return (
                        <tr key={user.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-200 text-[#990024] flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                                {initials}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 leading-tight">
                                  {user.name || 'Unnamed User'}
                                </p>
                                <p className="text-[10px] text-zinc-400 font-mono">
                                  @{user.username || 'user'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 px-4 text-zinc-600 whitespace-nowrap font-mono text-[11px]">
                            {user.email || '—'}
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            {deptName ? (
                              <span className="font-semibold text-zinc-700 font-mono text-[11px]">
                                {deptName}
                              </span>
                            ) : (
                              <span className="text-zinc-400 italic text-[11px] font-mono">Unassigned</span>
                            )}
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] uppercase border font-mono ${getRoleBadge(user.role)}`}>
                              {user.role || 'user'}
                            </span>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap font-mono">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                              <Globe className="w-2.5 h-2.5" /> AD_SYNCED
                            </span>
                          </td>

                          <td className="py-2.5 px-4 whitespace-nowrap text-right font-mono text-zinc-600 font-medium tabular-nums">
                            {user._count?.assignedTickets != null ? (
                              <span>{user._count.assignedTickets} claimed</span>
                            ) : (
                              <span className="text-zinc-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedUsers.map(user => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )
          ) : (
            <div className="py-16 text-center font-mono text-xs text-zinc-400">
              NO_STAFF_MEMBERS_FOUND
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div className="px-4 py-2.5 border-t border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-zinc-500">
              Showing <b>{startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)}</b> of <b>{totalItems}</b>
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="p-1 border border-zinc-200 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-zinc-700 font-bold">
                {currentPage} / {totalPages || 1}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1 border border-zinc-200 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
