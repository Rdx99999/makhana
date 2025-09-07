
import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      fetchUserInfo(storedSessionId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserInfo = async (sessionId: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem("sessionId");
        setSessionId(null);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      localStorage.removeItem("sessionId");
      setSessionId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User, newSessionId: string) => {
    setUser(userData);
    setSessionId(newSessionId);
    localStorage.setItem("sessionId", newSessionId);
  };

  const logout = async () => {
    try {
      if (sessionId) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setSessionId(null);
      localStorage.removeItem("sessionId");
    }
  };

  return {
    user,
    sessionId,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
