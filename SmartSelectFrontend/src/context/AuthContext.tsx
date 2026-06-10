import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { authApi } from '../auth/authApi';
import { AuthResponse } from '../types/AuthResponse';
import { User } from '../types/User';


// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('smartbuy_token');
    const savedUser  = localStorage.getItem('smartbuy_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Optionally verify token is still valid against server
        authApi.getMe().catch(() => {
          // Token expired — clear session
          clearSession();
        });
      } catch {
        clearSession();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((data: AuthResponse) => {
    localStorage.setItem('smartbuy_token', data.token);
    localStorage.setItem('smartbuy_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, []);

  const clearSession = () => {
    localStorage.removeItem('smartbuy_token');
    localStorage.removeItem('smartbuy_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};