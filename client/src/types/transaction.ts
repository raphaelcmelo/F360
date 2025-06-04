export interface Transaction {
  _id: string;
  grupoId: string;
  criadoPor: string;
  criadoPorNome: string;
  data: string; // ISO date string
  categoria: "renda" | "despesa" | "conta" | "poupanca";
  tipo: string;
  valor: number;
  createdAt: string;
  updatedAt?: string;
}
