export interface Transaction {
  _id: string;
  grupoId: string;
  criadoPor: string;
  criadoPorNome: string;
  data: string;
  categoria: "renda" | "despesa" | "conta" | "poupanca";
  tipo: string;
  valor: number;
  description?: string;
  createdAt: string;
  updatedAt?: string;
}
