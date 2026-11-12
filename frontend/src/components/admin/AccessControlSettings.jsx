import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { accessControlService } from '../../services/accessControlService';

const AccessControlSettings = ({ currentUser }) => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [roleResponse, userResponse, auditResponse] = await Promise.all([
        accessControlService.getRoles(),
        accessControlService.getUsers(),
        accessControlService.getAuditLog()
      ]);
      setRoles(roleResponse.roles || []);
      setPermissions(roleResponse.permissions || []);
      setUsers(userResponse.users || []);
      setAuditLogs(auditResponse.logs || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load access-control data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveRolePermissions = async (role, selectedPermissions) => {
    try {
      await accessControlService.updateRole(role.id, selectedPermissions);
      toast.success(`Permissions updated for ${role.name}`);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update role permissions');
    }
  };

  const createRole = async (event) => {
    event.preventDefault();
    try {
      await accessControlService.createRole({
        name: newRoleName,
        description: newRoleDescription,
        permissions: []
      });
      setNewRoleName('');
      setNewRoleDescription('');
      toast.success('Role created with no permissions');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to create role');
    }
  };

  const saveUserRoles = async (user, roleIds) => {
    try {
      await accessControlService.replaceUserRoles(user.id, roleIds);
      toast.success(`Roles updated for ${user.name}`);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to update user roles');
    }
  };

  const deleteRole = async (role) => {
    if (!window.confirm(`Delete the ${role.name} role?`)) return;
    try {
      await accessControlService.deleteRole(role.id);
      toast.success(`Role ${role.name} deleted`);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Failed to delete role');
    }
  };

  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Loading access control...</p>;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Create role</h3>
        <p className="mb-4 text-sm text-slate-500">New roles start with no permissions. Grant only the access required.</p>
        <form onSubmit={createRole} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_2fr_auto]">
          <input
            required
            minLength={2}
            maxLength={40}
            pattern="[A-Za-z][A-Za-z0-9_-]*"
            value={newRoleName}
            onChange={event => setNewRoleName(event.target.value)}
            placeholder="Role name"
            className="settings-field"
          />
          <input
            value={newRoleDescription}
            onChange={event => setNewRoleDescription(event.target.value)}
            placeholder="Description (optional)"
            className="settings-field"
          />
          <button type="submit" className="rounded-lg bg-[#990024] px-4 py-2 text-sm font-semibold text-white hover:bg-[#80001e]">
            Create role
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Role permissions</h3>
        <div className="space-y-4">
          {roles.map(role => (
            <RolePermissionEditor
              key={`${role.id}-${role.permissions.join(',')}`}
              role={role}
              permissions={permissions}
              onSave={saveRolePermissions}
              onDelete={deleteRole}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg font-semibold text-slate-900">User role assignments</h3>
        <p className="mb-4 text-sm text-slate-500">You cannot change your own role assignment.</p>
        <div className="space-y-3">
          {users.map(user => (
            <UserRoleEditor
              key={`${user.id}-${user.roles.map(role => role.id).sort().join(',')}`}
              user={user}
              roles={roles}
              isSelf={user.id === currentUser?.id}
              onSave={saveUserRoles}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent access-control audit</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target / Role</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map(log => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{log.actorEmail}</td>
                  <td className="px-4 py-3">{log.action}</td>
                  <td className="px-4 py-3">{log.targetUserEmail || log.roleName || '—'}</td>
                </tr>
              ))}
              {!auditLogs.length && <tr><td className="px-4 py-5 text-slate-500" colSpan="4">No access-control changes recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const RolePermissionEditor = ({ role, permissions, onSave, onDelete }) => {
  const [selected, setSelected] = useState(role.permissions);
  const [saving, setSaving] = useState(false);

  const toggle = (key) => {
    setSelected(current => current.includes(key)
      ? current.filter(item => item !== key)
      : [...current, key]);
  };

  const save = async () => {
    setSaving(true);
    await onSave(role, selected);
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold capitalize text-slate-900">{role.name}</h4>
          <p className="text-xs text-slate-500">{role.description || 'No description'} · {role.userCount} users</p>
        </div>
        {role.name === 'admin'
          ? <span className="text-xs font-semibold text-rose-700">Protected full-access role</span>
          : <div className="flex items-center gap-2">
            {!role.isSystem && role.userCount === 0 && <button onClick={() => onDelete(role)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete role</button>}
            <button disabled={saving} onClick={save} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Save permissions</button>
          </div>}
      </div>
      {role.name === 'admin' ? (
        <p className="text-sm text-slate-500">Administrator permissions are fixed to prevent accidental lockout.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {permissions.filter(permission => permission.key !== 'access-control.manage').map(permission => (
            <label key={permission.key} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(permission.key)}
                onChange={() => toggle(permission.key)}
              />
              <span><span className="block font-semibold text-slate-800">{permission.key}</span><span className="text-slate-500">{permission.description}</span></span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const UserRoleEditor = ({ user, roles, isSelf, onSave }) => {
  const [selected, setSelected] = useState(user.roles.map(role => role.id));
  const [saving, setSaving] = useState(false);

  const toggle = (roleId) => {
    setSelected(current => current.includes(roleId)
      ? current.filter(id => id !== roleId)
      : [...current, roleId]);
  };

  const save = async () => {
    setSaving(true);
    await onSave(user, selected);
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-48">
        <p className="font-semibold text-slate-900">{user.name}</p>
        <p className="text-xs text-slate-500">{user.email} · Base role: {user.role}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {roles.map(role => (
          <label key={role.id} className="flex items-center gap-1.5 text-xs capitalize">
            <input disabled={isSelf} type="checkbox" checked={selected.includes(role.id)} onChange={() => toggle(role.id)} />
            {role.name}
          </label>
        ))}
      </div>
      <button disabled={saving || isSelf} onClick={save} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50">
        {isSelf ? 'Current user' : saving ? 'Saving...' : 'Save roles'}
      </button>
    </div>
  );
};

export default AccessControlSettings;
