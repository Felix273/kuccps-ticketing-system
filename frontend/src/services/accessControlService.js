import { api } from './api';

export const accessControlService = {
  getMyAccess() {
    return api.get('/access-control/me');
  },

  getRoles() {
    return api.get('/access-control/roles');
  },

  createRole(role) {
    return api.post('/access-control/roles', role);
  },

  updateRole(id, permissions) {
    return api.put(`/access-control/roles/${id}`, { permissions });
  },

  deleteRole(id) {
    return api.delete(`/access-control/roles/${id}`);
  },

  getUsers() {
    return api.get('/access-control/users');
  },

  replaceUserRoles(userId, roleIds) {
    return api.put(`/access-control/users/${userId}/roles`, { roleIds });
  },

  getAuditLog() {
    return api.get('/access-control/audit');
  }
};
