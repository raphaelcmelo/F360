import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { jwtDecode } from "jwt-decode";
import { authApi } from "../services/api"; // Import authApi
import { Group } from "../types/group"; // Import Group type

// Define a type for the structure of each group entry in the user's 'grupos' array from the backend
interface UserGroupEntry {
  groupId: Group; // This refers to the actual Group interface from types/group
  displayName: string;
  _id: string; // This is the _id of the embedded document, not the actual group ID
}

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
  activeGroup: string | null; // Add activeGroup to context type
  setActiveGroup: (groupId: string | null) => void; // Add setActiveGroup to context type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Update User interface to correctly type 'grupos' based on backend response
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  grupos: UserGroupEntry[]; // Changed to UserGroupEntry[]
  createdAt: string;
  updatedAt: string;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeGroup, setActiveGroupState] = useState<string | null>(null); // State for active group
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

  // Set active group
  const setActiveGroup = useCallback((groupId: string | null) => {
    setActiveGroupState(groupId);
  }, []);

  // Check if user is authenticated on initial load
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const storedRefreshToken = localStorage.getItem("refreshToken"); // Renamed for clarity

    if (!token || isTokenExpired(token)) { // If access token is missing or expired
      if (!storedRefreshToken || isTokenExpired(storedRefreshToken)) { // And refresh token is also missing or expired
        setUser(null);
        setActiveGroupState(null);
        localStorage.removeItem("token"); // Ensure cleared
        localStorage.removeItem("refreshToken"); // Ensure cleared
        setIsLoading(false);
        // No navigation here, navigation should be handled by protected route components
        return;
      }
      // If access token is bad, but refresh token might be good,
      // the interceptor in api.ts will handle the refresh when getProfile is called.
    }

    // If token exists (might be valid or will be refreshed by interceptor)
    try {
      // getProfile will trigger the interceptor if token is expired
      const userData = await authApi.getProfile();
      setUser(userData);
      if (userData.grupos && userData.grupos.length > 0) {
        setActiveGroupState(userData.grupos[0].groupId._id);
      } else {
        setActiveGroupState(null);
      }
    } catch (error) {
      // This catch handles failure of getProfile or failure of token refresh via interceptor
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setActiveGroupState(null);
      // No navigation here, let protected routes handle it
    } finally {
      setIsLoading(false);
    }
  }, [navigate, setActiveGroupState]); // Added dependencies based on usage

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // authApi.login now returns { user, accessToken, refreshToken }
      const { user: userData, accessToken, refreshToken } = await authApi.login(email, password);

      localStorage.setItem("token", accessToken); // Store accessToken as 'token'
      localStorage.setItem("refreshToken", refreshToken);

      setUser(userData);
      if (userData.grupos && userData.grupos.length > 0) {
        setActiveGroupState(userData.grupos[0].groupId._id);
      } else {
        setActiveGroupState(null);
      }

      notifications.show({
        title: "Login realizado com sucesso",
        message: `Bem-vindo(a) ${userData.name}!`,
        color: "green",
      });
      navigate("/dashboard");
    } catch (error: any) {
      notifications.show({
        title: "Erro ao fazer login",
        message:
          error.response?.data?.error ||
          error.message || // Include error.message for errors from api.ts
          "Verifique suas credenciais e tente novamente.",
        color: "red",
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
        title: "Cadastro realizado com sucesso",
        message: "Você já pode fazer login com suas credenciais.",
        color: "green",
      });

      // Navigate to login
      navigate("/login");
    } catch (error: any) {
      notifications.show({
        title: "Erro ao cadastrar",
        message:
          error.response?.data?.error || "Ocorreu um erro ao criar sua conta.",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true); // Set loading true at the beginning
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      // Attempt to logout from backend, sending the refresh token
      if (refreshToken) {
        await authApi.logout(refreshToken);
      } else {
        // If no refresh token, still proceed with client-side logout
        console.warn("No refresh token found in localStorage during logout.");
        // Optionally, call authApi.logout(null) if your api.ts handles it or if you want to notify backend of client-side only logout
        await authApi.logout(null);
      }

      notifications.show({
        title: "Logout realizado",
        message: "Você saiu da sua conta com sucesso.",
        color: "blue",
      });

    } catch (error: any) {
      console.error("Error during backend logout:", error);
      notifications.show({
        title: "Erro no logout do servidor",
        message:
          error.response?.data?.error ||
          error.message ||
          "Não foi possível invalidar a sessão no servidor, mas você será deslogado localmente.",
        color: "orange", // Use orange for warning as client logout will still proceed
      });
    } finally {
      // Always clear local storage and reset state
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setActiveGroupState(null);
      setIsLoading(false);
      navigate("/login"); // Ensure navigation to login after all operations
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);

      await authApi.forgotPassword(email);

      // Show success notification
      notifications.show({
        title: "E-mail enviado",
        message: "Verifique sua caixa de entrada para redefinir sua senha.",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Erro ao enviar e-mail",
        message:
          error.response?.data?.error ||
          "Não foi possível enviar o e-mail de recuperação.",
        color: "red",
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
        title: "Senha redefinida",
        message:
          "Sua senha foi alterada com sucesso. Você já pode fazer login.",
        color: "green",
      });

      // Navigate to login
      navigate("/login");
    } catch (error: any) {
      notifications.show({
        title: "Erro ao redefinir senha",
        message:
          error.response?.data?.error ||
          "Não foi possível redefinir sua senha.",
        color: "red",
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
        activeGroup, // Provide activeGroup
        setActiveGroup, // Provide setActiveGroup
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
