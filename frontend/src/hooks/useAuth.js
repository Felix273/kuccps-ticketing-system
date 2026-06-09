import { useState } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const initialUser = authService.getCurrentUser();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser));
  const [isLoading] = useState(false);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    if (data.success) {
      setCurrentUser(data.user);
      setIsAuthenticated(true);
    }
    return data;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return { currentUser, user: currentUser, isAuthenticated, isLoading, login, logout };
};
