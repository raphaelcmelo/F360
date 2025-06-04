export interface PlannedBudgetItem {
  _id: string;
  budgetId: string;
  groupId: string;
  categoryType: "renda" | "despesa" | "conta" | "poupanca";
  nome: string;
  valorPlanejado: number;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  tipo: "renda" | "despesa" | "conta" | "poupanca";
  lancamentosPlanejados: PlannedBudgetItem[];
}

export interface Budget {
  _id: string;
  grupoId: string;
  dataInicio: string;
  dataFim: string;
  criadoPor: string;
  createdAt: string;
  updatedAt: string;
  // New fields for aggregated planned totals
  totalRendaPlanejado?: number;
  totalDespesaPlanejado?: number;
  totalContaPlanejado?: number;
  totalPoupancaPlanejado?: number;
  // CRITICAL: Add the categories array
  categorias: BudgetCategory[];
}
