export interface ActivityLog {
  _id: string;
  grupoId: string;
  criadoPor: string; // User ID
  criadoPorNome: string; // User Name
  actionType: string;
  description: string;
  details?: Record<string, any>;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
