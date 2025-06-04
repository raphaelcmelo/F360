export interface PlannedBudgetItem {
  _id: string;
  budgetId: string;
  groupId: string;
  categoryType: 'renda' | 'despesa' | 'conta' | 'poupanca';
  nome: string;
  valorPlanejado: number;
  criadoPor?: string; // Optional, as it might be populated or not needed on client
  createdAt?: string;
  updatedAt?: string;
}

export interface Budget {
  _id: string;
  grupoId: string;
  dataInicio: string;
  dataFim: string;
  criadoPor?: string; // Optional, as it might be populated or not needed on client
  createdAt?: string;
  updatedAt?: string;
}
