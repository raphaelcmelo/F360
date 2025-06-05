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

    // If the error is 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // In a real implementation, this would call your refresh token endpoint
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // If no refresh token, redirect to login
          localStorage.removeItem("token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // This would be a real API call in a production app
        // const response = await axios.post('/api/auth/refresh-token', { refreshToken });
        // const { token } = response.data;

        // Mock a successful token refresh
        const token = "new-mock-token"; // Replace with actual refresh token logic

        // Update stored token
        localStorage.setItem("token", token);

        // Update Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Real API functions
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data.data; // Assuming data contains user and token
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

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
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
  getActivitiesByGroup: async (groupId: string): Promise<ActivityLog[]> => {
    const response = await api.get(`/activities/group/${groupId}`);
    return response.data.data;
  },
};
