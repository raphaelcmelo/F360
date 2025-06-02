export interface PlannedItem {
  nome: string;
  valorPlanejado: number;
}

export interface BudgetCategory {
  tipo: 'renda' | 'despesa' | 'conta' | 'poupanca';
  lancamentosPlanejados: PlannedItem[];
}

export interface Budget {
  _id: string;
  grupoId: string;
  dataInicio: string;
  dataFim: string;
  categorias: BudgetCategory[];
  createdAt?: string;
  updatedAt?: string;
}