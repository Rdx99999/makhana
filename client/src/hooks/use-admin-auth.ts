
import { useState, useEffect } from 'react';

interface AdminAuth {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  username?: string;
}

export function useAdminAuth(): AdminAuth {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string>();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const sessionToken = localStorage.getItem('admin_session_token');
    const expiresAt = localStorage.getItem('admin_session_expires');
    
    if (!sessionToken || !expiresAt) {
      setIsLoading(false);
      return;
    }

    // Check if session is expired
    if (Date.now() > parseInt(expiresAt)) {
      logout();
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUsername(data.username);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Admin auth check error:', error);
      logout();
    }
    
    setIsLoading(false);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const credentials = btoa(`${username}:${password}`);
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('admin_session_token', data.sessionToken);
        localStorage.setItem('admin_session_expires', data.expiresAt.toString());
        setIsAuthenticated(true);
        setUsername(username);
        return true;
      } else {
        const error = await response.json();
        console.error('Login failed:', error.message);
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      return false;
    }
  };

  const logout = async () => {
    const sessionToken = localStorage.getItem('admin_session_token');
    
    if (sessionToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_session_expires');
    setIsAuthenticated(false);
    setUsername(undefined);
  };

  return {
    isAuthenticated,
    login,
    logout,
    isLoading,
    username,
  };
}

// Function to get admin auth header for API calls
export function getAdminAuthHeader(): { Authorization: string } | {} {
  const sessionToken = localStorage.getItem('admin_session_token');
  const expiresAt = localStorage.getItem('admin_session_expires');

  if (sessionToken && expiresAt && Date.now() < parseInt(expiresAt)) {
    return { Authorization: `Bearer ${sessionToken}` };
  }

  // Clear expired session
  localStorage.removeItem('admin_session_token');
  localStorage.removeItem('admin_session_expires');
  return {};
}
