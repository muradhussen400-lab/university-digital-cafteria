import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthState } from '../types';
import { apiClient } from '../services/api/apiClient';

interface AuthContextType extends AuthState {
  login: (token: string, userData: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setState({
            isAuthenticated: true,
            user: {
              id: response.data.id,
              name: response.data.username,
              role: response.data.role.toLowerCase(),
              studentId: response.data.student_id,
            },
            isLoading: false,
            error: null,
          });
        } catch (e) {
          sessionStorage.removeItem('auth_token');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    sessionStorage.setItem('auth_token', token);
    setState({
      isAuthenticated: true,
      user: userData,
      isLoading: false,
      error: null,
    });
  };

  const logout = () => {
    sessionStorage.removeItem('auth_token');
    setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });
  };

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
