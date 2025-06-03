import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { jwtDecode } from 'jwt-decode';
import { authApi } from '../services/api'; // Import authApi
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Check if user is authenticated on initial load
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!token || isTokenExpired(token)) {
      if (!refreshToken || isTokenExpired(refreshToken)) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // In a real implementation, this would call the backend to refresh token
        // For now, the interceptor handles refresh, so we just try to get profile
        const userData = await authApi.getProfile();
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    } else {
      try {
        const userData = await authApi.getProfile();
        setUser(userData);
      } catch (error) {
        setUser(null);
      }
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { user: userData, token, refreshToken } = await authApi.login(email, password);
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Set user data
      setUser(userData);
      
      // Show success notification
      notifications.show({
        title: 'Login realizado com sucesso',
        message: `Bem-vindo(a) ${userData.name}!`,
        color: 'green',
      });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      notifications.show({
        title: 'Erro ao fazer login',
        message: error.response?.data?.error || 'Verifique suas credenciais e tente novamente.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      await authApi.register(name, email, password);
      
      // Show success notification
      notifications.show({
        title: 'Cadastro realizado com sucesso',
        message: 'Você já pode fazer login com suas credenciais.',
        color: 'green',
      });
      
      // Navigate to login
      navigate('/login');
    } catch (error: any) {
      notifications.show({
        title: 'Erro ao cadastrar',
        message: error.response?.data?.error || 'Ocorreu um erro ao criar sua conta.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
    notifications.show({
      title: 'Logout realizado',
      message: 'Você saiu da sua conta com sucesso.',
      color: 'blue',
    });
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      await authApi.forgotPassword(email);
      
      // Show success notification
      notifications.show({
        title: 'E-mail enviado',
        message: 'Verifique sua caixa de entrada para redefinir sua senha.',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Erro ao enviar e-mail',
        message: error.response?.data?.error || 'Não foi possível enviar o e-mail de recuperação.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    try {
      setIsLoading(true);
      
      await authApi.resetPassword(token, password);
      
      // Show success notification
      notifications.show({
        title: 'Senha redefinida',
        message: 'Sua senha foi alterada com sucesso. Você já pode fazer login.',
        color: 'green',
      });
      
      // Navigate to login
      navigate('/login');
    } catch (error: any) {
      notifications.show({
        title: 'Erro ao redefinir senha',
        message: error.response?.data?.error || 'Não foi possível redefinir sua senha.',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
