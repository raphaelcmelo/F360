export interface Transaction {
  _id: string;
  grupoId: string;
  criadoPor: string; // User ID
  criadoPorNome: string; // User Name
  data: string;
  categoria: "renda" | "despesa" | "conta" | "poupanca";
  tipo: string;
  valor: number;
  createdAt: string;
  updatedAt?: string;
}
