import axios from "axios";
import { Group, User } from "../types/user"; // Import updated Group and User types
import { Group as GroupType } from "../types/group"; // Import GroupType from group.ts
import { Budget, PlannedBudgetItem } from "../types/budget";
import { Transaction } from "../types/transaction"; // Import Transaction type
import { ActivityLog } from "../types/activityLog"; // Import ActivityLog type

// Create an axios instance
export const api = axios.create({
  // Set the baseURL to your backend API
  baseURL: "http://localhost:5000/api",
});

// Add a request interceptor to include the token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is due to an expired token (e.g., status 401)
    // And if the request hasn't been retried already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          localStorage.removeItem("token"); // Clear current access token
          // window.location.href = "/login"; // Handled by AuthContext or router
          return Promise.reject(new Error("No refresh token available")); // Reject to allow AuthContext to handle redirect
        }

        // Actual API call to refresh token
        const refreshResponse = await api.post("/auth/refresh-token", { token: refreshToken });

        if (refreshResponse.data && refreshResponse.data.success && refreshResponse.data.data.accessToken) {
          const newAccessToken = refreshResponse.data.data.accessToken;
          localStorage.setItem("token", newAccessToken); // Store new access token

          // Update Authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Retry the original request with the new token
          return api(originalRequest);
        } else {
          // If refresh call fails in an unexpected way (e.g. bad response structure)
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          // window.location.href = "/login"; // Handled by AuthContext or router
          return Promise.reject(new Error("Failed to refresh token"));
        }
      } catch (refreshError: any) {
        // If /auth/refresh-token itself returns an error (e.g., 401, 403)
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        // window.location.href = "/login"; // Handled by AuthContext or router
        // Propagate the error so that AuthContext can react (e.g. redirect to login)
        return Promise.reject(refreshError);
      }
    }

    // For other errors, just pass them on
    return Promise.reject(error);
  }
);

// Real API functions
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    // Assuming backend response is: { success: true, data: { user, accessToken, refreshToken }, message: "..." }
    if (response.data && response.data.success) {
      return response.data.data; // This will be { user, accessToken, refreshToken }
    } else {
      throw new Error(response.data.error || "Login failed");
    }
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data.data; // Assuming data contains user profile
  },

  forgotPassword: async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
    });
    return response.data;
  },

  logout: async (refreshToken: string | null) => { // refreshToken can be null if not found
    // Backend expects { refreshToken: "value" }
    // Only call if refreshToken is available, though backend logout can also be called without it
    // to signify client-side logout if server session management is not critical path for this call.
    // However, our plan is to invalidate the refresh token on the server.
    if (refreshToken) {
      const response = await api.post("/auth/logout", { refreshToken });
      return response.data;
    } else {
      // If no refresh token, perhaps just resolve indicating client-side cleanup
      // Or throw an error if server-side invalidation is critical here
      return Promise.resolve({ success: true, message: "Logged out client-side (no refresh token to invalidate)." });
    }
  },
};

// New API functions for Group management
export const groupApi = {
  createGroup: async (nome: string): Promise<GroupType> => {
    const response = await api.post("/groups", { nome });
    return response.data.data;
  },
  getUserGroups: async (): Promise<GroupType[]> => {
    const response = await api.get("/groups");
    return response.data.data;
  },
  inviteMember: async (groupId: string, email: string) => {
    const response = await api.post(`/groups/${groupId}/invite`, { email });
    return response.data;
  },
  updateGroupDisplayName: async (groupId: string, newDisplayName: string) => {
    const response = await api.put(`/groups/${groupId}/display-name`, {
      newDisplayName,
    });
    return response.data;
  },
  deleteGroup: async (groupId: string) => {
    // Add deleteGroup function
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },
  removeMember: async (groupId: string, memberId: string) => {
    const response = await api.delete(`/groups/${groupId}/members/${memberId}`);
    return response.data;
  },
};

export const budgetApi = {
  createBudget: async (
    grupoId: string,
    dataInicio: string,
    dataFim: string
  ): Promise<Budget> => {
    const response = await api.post("/budgets", {
      grupoId,
      dataInicio,
      dataFim,
    });
    return response.data.data;
  },
  getGroupBudgets: async (groupId: string): Promise<Budget[]> => {
    const response = await api.get(`/budgets/group/${groupId}`);
    return response.data.data;
  },
  getBudgetById: async (budgetId: string): Promise<Budget> => {
    const response = await api.get(`/budgets/${budgetId}`);
    return response.data.data;
  },
  deleteBudget: async (budgetId: string) => {
    const response = await api.delete(`/budgets/${budgetId}`);
    return response.data;
  },
};

export const plannedBudgetItemApi = {
  createPlannedBudgetItem: async (
    budgetId: string,
    groupId: string,
    categoryType: "renda" | "despesa" | "conta" | "poupanca",
    nome: string,
    valorPlanejado: number
  ): Promise<PlannedBudgetItem> => {
    const response = await api.post("/budget-items", {
      budgetId,
      groupId,
      categoryType,
      nome,
      valorPlanejado,
    });
    return response.data.data;
  },
  getPlannedBudgetItemsForBudget: async (
    budgetId: string
  ): Promise<PlannedBudgetItem[]> => {
    const response = await api.get(`/budget-items/budget/${budgetId}`);
    return response.data.data;
  },
  updatePlannedBudgetItem: async (
    itemId: string,
    updates: Partial<PlannedBudgetItem>
  ): Promise<PlannedBudgetItem> => {
    const response = await api.put(`/budget-items/${itemId}`, updates);
    return response.data.data;
  },
  deletePlannedBudgetItem: async (itemId: string) => {
    const response = await api.delete(`/budget-items/${itemId}`);
    return response.data;
  },
};

export const transactionApi = {
  createTransaction: async (
    grupoId: string,
    data: string,
    categoria: "renda" | "despesa" | "conta" | "poupanca",
    tipo: string,
    valor: number
  ): Promise<Transaction> => {
    const response = await api.post("/transactions", {
      grupoId,
      data,
      categoria,
      tipo,
      valor,
    });
    return response.data.data;
  },
  getTransactionsByGroup: async (
    groupId: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> => {
    const response = await api.get(
      `/transactions/group/${groupId}?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data.data;
  },
  getTransactionById: async (transactionId: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data.data;
  },
  updateTransaction: async (
    transactionId: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> => {
    const response = await api.put(`/transactions/${transactionId}`, updates);
    return response.data.data;
  },
  deleteTransaction: async (transactionId: string) => {
    const response = await api.delete(`/transactions/${transactionId}`);
    return response.data;
  },
};

export const activityLogApi = {
  getActivitiesByGroup: async (
    groupId: string,
    budgetId?: string
  ): Promise<ActivityLog[]> => {
    const params = new URLSearchParams();
    if (budgetId) {
      params.append("budgetId", budgetId);
    }
    const response = await api.get(
      `/activities/group/${groupId}?${params.toString()}`
    );
    return response.data.data;
  },
};
