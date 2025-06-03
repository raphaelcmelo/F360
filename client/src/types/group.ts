export interface GroupMember {
  _id: string;
  nome: string;
  email: string;
}

export interface GroupInvite {
  email: string;
  token: string;
  status: 'pendente' | 'aceito' | 'expirado';
  criadoEm: string;
}

export interface Group {
  _id: string;
  nome: string;
  membros: string[] | GroupMember[];
  convites?: GroupInvite[];
  criadoPor: string;
  orcamentos: string[];
  createdAt: string;
  updatedAt?: string;
}
