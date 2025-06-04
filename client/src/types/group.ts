export interface Group {
  _id: string;
  nome: string;
  membros: string[]; // Array of user IDs
  criadoPor: string; // User ID of the creator
  createdAt: string;
  updatedAt: string;
}
