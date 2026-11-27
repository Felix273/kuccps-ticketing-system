// UI permission checks. They only decide what to show; the API enforces every permission.
// The current user's permissions come from GET /access-control/me (see App.jsx).

export function can(user, ...permissions) {
  const granted = user?.permissions || [];
  return permissions.some(permission => granted.includes(permission));
}

export const SETTINGS_PERMISSIONS = [
  'settings.organization',
  'settings.email',
  'settings.service-desk',
  'settings.directory',
  'access.manage',
  'audit.view'
];

// Screens and the permissions that make them visible (the first allowed one opens by default).
export const SCREENS = [
  { id: 'dashboard', permissions: ['reports.view'] },
  { id: 'tickets', permissions: ['tickets.view'] },
  { id: 'departments', permissions: ['users.view'] },
  { id: 'users', permissions: ['users.view'] },
  { id: 'knowledgebase', permissions: ['tickets.view', 'knowledge.contribute', 'knowledge.publish'] },
  { id: 'admin', permissions: SETTINGS_PERMISSIONS }
];
