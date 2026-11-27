import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Lock, Plus, Trash2, Users } from 'lucide-react';
import { accessControlService } from '../../services/accessControlService';

/**
 * Roles & Access.
 *  - Team members: each person has one role (Administrator, ICT Manager, ICT Officer, Viewer,
 *    Requester or a custom role).
 *  - Roles: what each role can do, grouped by area. Administrator (everything) and Requester
 *    (no access) are fixed; the others can be adjusted, and custom roles can be added.
 */
const AccessControlSettings = ({ currentUser }) => {
  const [data, setData] = useState({ roles: [], users: [], permissions: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [savingRole, setSavingRole] = useState(null);
  const [savingUser, setSavingUser] = useState(null);
  const [userFilter, setUserFilter] = useState('');
  const [newRole, setNewRole] = useState(null);

  const load = useCallback(async () => {
    try {
      const [roleResponse, userResponse] = await Promise.all([
        accessControlService.getRoles(),
        accessControlService.getUsers()
      ]);
      setData({
        roles: roleResponse.roles || [],
        permissions: roleResponse.permissions || [],
        groups: roleResponse.groups || [],
        users: userResponse.users || []
      });
      setDrafts({});
    } catch (error) {
      toast.error(error.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const permissionByKey = useMemo(() => new Map(data.permissions.map(permission => [permission.key, permission])), [data.permissions]);
  const assignableRoles = data.roles;

  const changeUserRole = async (user, roleId) => {
    setSavingUser(user.id);
    try {
      const result = await accessControlService.replaceUserRoles(user.id, [roleId]);
      if (!result.success) throw new Error(result.message);
      const label = data.roles.find(role => role.id === roleId)?.label;
      toast.success(`${user.name} is now ${label}`);
      await load();
    } catch (error) {
      toast.error(error.message || 'Failed to change role');
    } finally {
      setSavingUser(null);
    }
  };

  const togglePermission = (role, key) => {
    setDrafts(previous => {
      const current = new Set(previous[role.id] || role.permissions);
      if (current.has(key)) current.delete(key);
      else current.add(key);
      return { ...previous, [role.id]: [...current] };
    });
  };

  const saveRole = async role => {
    setSavingRole(role.id);
    try {
      const result = await accessControlService.updateRole(role.id, drafts[role.id]);
      if (!result.success) throw new Error(result.message);
      toast.success(`${role.label} permissions saved`);
      await load();
    } catch (error) {
      toast.error(error.message || 'Failed to save role');
    } finally {
      setSavingRole(null);
    }
  };

  const deleteRole = async role => {
    if (!window.confirm(`Delete the role "${role.label}"?`)) return;
    try {
      const result = await accessControlService.deleteRole(role.id);
      if (!result.success) throw new Error(result.message);
      toast.success('Role deleted');
      await load();
    } catch (error) {
      toast.error(error.message || 'Failed to delete role');
    }
  };

  const createRole = async event => {
    event.preventDefault();
    try {
      const result = await accessControlService.createRole({
        name: newRole.name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: newRole.description.trim(),
        permissions: newRole.permissions
      });
      if (!result.success) throw new Error(result.message);
      toast.success('Role created');
      setNewRole(null);
      await load();
    } catch (error) {
      toast.error(error.message || 'Failed to create role');
    }
  };

  if (loading) return <p className="text-sm text-zinc-500">Loading roles...</p>;

  const filteredUsers = data.users.filter(user =>
    !userFilter || `${user.name} ${user.email} ${user.username}`.toLowerCase().includes(userFilter.toLowerCase())
  );

  const permissionMatrix = (selected, onToggle, disabled) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {data.groups.map(group => (
        <fieldset key={group.group} className="rounded-lg border border-zinc-200 p-3">
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{group.group}</legend>
          {group.keys.map(key => {
            const permission = permissionByKey.get(key);
            if (!permission) return null;
            const reserved = key === 'access.manage';
            return (
              <label key={key} className={`flex items-start gap-2 py-1 text-sm ${disabled || reserved ? 'text-zinc-500' : 'text-zinc-800'}`}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected.has(key)}
                  disabled={disabled || reserved}
                  onChange={() => onToggle(key)}
                />
                <span>
                  {permission.label}
                  <span className="block text-[11px] text-zinc-500">{permission.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <section aria-labelledby="team-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="team-heading" className="flex items-center gap-2 text-base font-semibold text-zinc-900">
              <Users className="h-4 w-4 text-[#990024]" aria-hidden="true" /> Team members
            </h2>
            <p className="text-xs text-zinc-500">Give each person one role. You cannot change your own role.</p>
          </div>
          <input
            type="search"
            value={userFilter}
            onChange={event => setUserFilter(event.target.value)}
            placeholder="Search people"
            aria-label="Search people"
            className="w-56 rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Person</th>
                <th className="px-4 py-2 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.map(user => {
                const currentRole = user.roles[0];
                const isSelf = user.id === currentUser?.id;
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-2">
                      <span className="block font-medium text-zinc-900">{user.name}</span>
                      <span className="block text-xs text-zinc-500">{user.email}</span>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        aria-label={`Role for ${user.name}`}
                        value={currentRole?.id || ''}
                        disabled={isSelf || savingUser === user.id}
                        onChange={event => changeUserRole(user, event.target.value)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-sm disabled:bg-zinc-50"
                      >
                        {!currentRole && <option value="">No role</option>}
                        {assignableRoles.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}
                      </select>
                      {user.roles.length > 1 && (
                        <span className="ml-2 text-[11px] text-amber-700">also: {user.roles.slice(1).map(role => role.label).join(', ')}</span>
                      )}
                      {isSelf && <span className="ml-2 text-[11px] text-zinc-400">(you)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="roles-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="roles-heading" className="text-base font-semibold text-zinc-900">Roles</h2>
            <p className="text-xs text-zinc-500">What each role can do. Administrator and Requester are fixed.</p>
          </div>
          {!newRole && (
            <button type="button" onClick={() => setNewRole({ name: '', description: '', permissions: ['tickets.view'] })}
              className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
              <Plus className="h-4 w-4" /> Custom role
            </button>
          )}
        </div>

        {newRole && (
          <form onSubmit={createRole} className="mb-4 space-y-3 rounded-lg border border-[#990024]/30 bg-rose-50/30 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-zinc-800">
                Role name
                <input required value={newRole.name} onChange={event => setNewRole(previous => ({ ...previous, name: event.target.value }))}
                  placeholder="e.g. Network Team" className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
              </label>
              <label className="text-sm font-medium text-zinc-800">
                Description
                <input value={newRole.description} onChange={event => setNewRole(previous => ({ ...previous, description: event.target.value }))}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm" />
              </label>
            </div>
            {permissionMatrix(new Set(newRole.permissions), key => setNewRole(previous => ({
              ...previous,
              permissions: previous.permissions.includes(key) ? previous.permissions.filter(item => item !== key) : [...previous.permissions, key]
            })), false)}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNewRole(null)} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" className="rounded-md bg-[#990024] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#80001e]">Create role</button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {data.roles.map(role => {
            const selected = new Set(drafts[role.id] || role.permissions);
            const dirty = Boolean(drafts[role.id]);
            return (
              <article key={role.id} className="rounded-lg border border-zinc-200 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
                      {role.label}
                      {role.locked && <Lock className="h-3.5 w-3.5 text-zinc-400" aria-label="Fixed role" />}
                      {!role.isSystem && <span className="rounded bg-zinc-100 px-1.5 text-[10px] font-semibold uppercase text-zinc-600">custom</span>}
                    </h3>
                    <p className="text-xs text-zinc-500">{role.description}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">{role.userCount} {role.userCount === 1 ? 'person' : 'people'}</p>
                  </div>
                  <div className="flex gap-2">
                    {!role.isSystem && (
                      <button type="button" onClick={() => deleteRole(role)} className="flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    )}
                    {dirty && (
                      <>
                        <button type="button" onClick={() => setDrafts(previous => { const next = { ...previous }; delete next[role.id]; return next; })}
                          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs">Discard</button>
                        <button type="button" disabled={savingRole === role.id} onClick={() => saveRole(role)}
                          className="rounded-md bg-[#990024] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">
                          {savingRole === role.id ? 'Saving...' : 'Save changes'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {role.name === 'user'
                  ? <p className="text-xs text-zinc-500">Requesters raise tickets by email or the Gmail add-on and cannot sign in.</p>
                  : permissionMatrix(selected, key => togglePermission(role, key), role.locked)}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AccessControlSettings;
