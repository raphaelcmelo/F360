import axios from "axios";
import { Group, User } from "../types/user"; // Import updated Group and User types
import { Group as GroupType } from "../types/group"; // Import GroupType from group.ts

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
    const response = await api.get("/auth/profile");
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
    const response = await api.put(`/groups/${groupId}/display-name`, { newDisplayName });
    return response.data;
  },
  deleteGroup: async (groupId: string) => { // Add deleteGroup function
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  }
};

// For demonstration purposes, let's keep mock data for other parts if needed
// In a real app, these would make actual API calls
export const mockApi = {
  // Groups APIs (these will be replaced by real groupApi calls)
  // Removed mockApi.groups as it's no longer needed for Groups.tsx
  // Keeping other mock APIs for now if they are used elsewhere
  // Budgets APIs
  budgets: {
    getByGroup: async (groupId: string) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Get current month for mock data
      const currentDate = new Date();
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      // Mock response
      return {
        _id: "budget1",
        grupoId: groupId,
        dataInicio: startDate.toISOString(),
        dataFim: endDate.toISOString(),
        categorias: [
          {
            tipo: "renda",
            lancamentosPlanejados: [
              { nome: "Salário", valorPlanejado: 5000 },
              { nome: "Freelance", valorPlanejado: 1200 },
            ],
          },
          {
            tipo: "despesa",
            lancamentosPlanejados: [
              { nome: "Aluguel", valorPlanejado: 1500 },
              { nome: "Supermercado", valorPlanejado: 800 },
              { nome: "Transporte", valorPlanejado: 400 },
            ],
          },
          {
            tipo: "conta",
            lancamentosPlanejados: [
              { nome: "Energia", valorPlanejado: 150 },
              { nome: "Internet", valorPlanejado: 120 },
              { nome: "Água", valorPlanejado: 80 },
            ],
          },
          {
            tipo: "poupanca",
            lancamentosPlanejados: [
              { nome: "Reserva de emergência", valorPlanejado: 500 },
              { nome: "Férias", valorPlanejado: 300 },
            ],
          },
        ],
      };
    },
  },

  // Transactions APIs
  transactions: {
    getByGroup: async (groupId: string, startDate: string, endDate: string) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock user mapping for 'criadoPor'
      const userMap: { [key: string]: string } = {
        "123": "Demo User",
        "456": "João Silva",
        "789": "Maria Souza",
      };

      // Mock response with random dates within the month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const mockTransactions = [
        {
          _id: "trans1",
          grupoId: groupId,
          criadoPor: "123",
          criadoPorNome: userMap["123"],
          data: new Date(currentYear, currentMonth, 5).toISOString(),
          categoria: "renda",
          tipo: "Salário",
          valor: 5000,
          createdAt: new Date(currentYear, currentMonth, 5).toISOString(),
        },
        {
          _id: "trans2",
          grupoId: groupId,
          criadoPor: "123",
          criadoPorNome: userMap["123"],
          data: new Date(currentYear, currentMonth, 10).toISOString(),
          categoria: "despesa",
          tipo: "Aluguel",
          valor: 1500,
          createdAt: new Date(currentYear, currentMonth, 10).toISOString(),
        },
        {
          _id: "trans3",
          grupoId: groupId,
          criadoPor: "456",
          criadoPorNome: userMap["456"],
          data: new Date(currentYear, currentMonth, 12).toISOString(),
          categoria: "despesa",
          tipo: "Supermercado",
          valor: 350,
          createdAt: new Date(currentYear, currentMonth, 12).toISOString(),
        },
        {
          _id: "trans4",
          grupoId: groupId,
          criadoPor: "123",
          criadoPorNome: userMap["123"],
          data: new Date(currentYear, currentMonth, 15).toISOString(),
          categoria: "despesa",
          tipo: "Supermercado",
          valor: 280,
          createdAt: new Date(currentYear, currentMonth, 15).toISOString(),
        },
        {
          _id: "trans5",
          grupoId: groupId,
          criadoPor: "123",
          criadoPorNome: userMap["123"],
          data: new Date(currentYear, currentMonth, 18).toISOString(),
          categoria: "conta",
          tipo: "Energia",
          valor: 140,
          createdAt: new Date(currentYear, currentMonth, 18).toISOString(),
        },
        {
          _id: "trans6",
          grupoId: groupId,
          criadoPor: "123",
          criadoPorNome: userMap["123"],
          data: new Date(currentYear, currentMonth, 18).toISOString(),
          categoria: "conta",
          tipo: "Internet",
          valor: 120,
          createdAt: new Date(currentYear, currentMonth, 18).toISOString(),
        },
        {
          _id: "trans7",
          grupoId: groupId,
          criadoPor: "456",
          criadoPorNome: userMap["456"],
          data: new Date(currentYear, currentMonth, 20).toISOString(),
          categoria: "renda",
          tipo: "Freelance",
          valor: 1200,
          createdAt: new Date(currentYear, currentMonth, 20).toISOString(),
        },
        {
          _id: "trans8",
          grupoId: groupId,
          criadoPor: "123",
          criadoPorNome: userMap["123"],
          data: new Date(currentYear, currentMonth, 25).toISOString(),
          categoria: "poupanca",
          tipo: "Reserva de emergência",
          valor: 500,
          createdAt: new Date(currentYear, currentMonth, 25).toISOString(),
        },
      ];

      return mockTransactions;
    },
  },
};
