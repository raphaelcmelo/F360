export interface User {
  _id: string;
  name: string;
  email: string;
  grupos: { _id: string; nome: string }[]; // Updated to include group name for display
}

export interface Group {
  _id: string;
  nome: string;
  membros: { _id: string; name: string; email: string }[];
  criadoPor: string;
  orcamentos: string[];
  createdAt: string;
  updatedAt: string;
}
