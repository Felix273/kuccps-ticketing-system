import React, { useEffect, useState } from 'react';
import { accessControlService } from '../../services/accessControlService';

const ACTION_LABELS = {
  'user.roles_replaced': 'Changed a user\'s role',
  'role.created': 'Created a role',
  'role.permissions_updated': 'Changed role permissions',
  'role.deleted': 'Deleted a role'
};

function describe(log) {
  const details = log.details || {};
  if (log.action === 'user.roles_replaced') {
    return `${log.targetUserEmail || 'user'}: ${(details.previousRoles || []).join(', ') || 'none'} → ${(details.roles || []).join(', ') || 'none'}`;
  }
  if (log.action === 'role.permissions_updated') {
    const before = new Set(details.previousPermissions || []);
    const after = new Set(details.permissions || []);
    const added = [...after].filter(key => !before.has(key));
    const removed = [...before].filter(key => !after.has(key));
    const changes = [
      ...(added.length ? [`+${added.join(', +')}`] : []),
      ...(removed.length ? [`−${removed.join(', −')}`] : [])
    ];
    return changes.length ? `${log.roleName}: ${changes.join('; ')}` : log.roleName;
  }
  return log.roleName || '';
}

// Read-only history of role and permission changes (who, what, when).
const AccessAuditLog = () => {
  const [state, setState] = useState({ logs: null, error: null });

  useEffect(() => {
    accessControlService.getAuditLog()
      .then(response => setState({ logs: response.logs || [], error: null }))
      .catch(error => setState({ logs: [], error: error.message }));
  }, []);

  if (!state.logs) return <p className="text-sm text-zinc-500">Loading audit log...</p>;
  if (state.error) return <p className="text-sm text-rose-700">{state.error}</p>;

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2 font-semibold">When</th>
            <th className="px-4 py-2 font-semibold">Who</th>
            <th className="px-4 py-2 font-semibold">Action</th>
            <th className="px-4 py-2 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {state.logs.map(log => (
            <tr key={log.id}>
              <td className="whitespace-nowrap px-4 py-2 text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2 text-zinc-800">{log.actorEmail}</td>
              <td className="px-4 py-2 text-zinc-800">{ACTION_LABELS[log.action] || log.action}</td>
              <td className="px-4 py-2 font-mono text-xs text-zinc-600">{describe(log)}</td>
            </tr>
          ))}
          {!state.logs.length && (
            <tr><td colSpan="4" className="px-4 py-6 text-center text-zinc-500">No role or permission changes recorded yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AccessAuditLog;
