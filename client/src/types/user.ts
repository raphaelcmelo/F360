export interface GroupMember {
  _id: string;
  name: string;
  email: string;
}

export interface GroupInvite {
  email: string;
  token: string;
  status: 'pendente' | 'aceito' | 'expirado';
  criadoEm: string;
}

// This type represents the group object as returned by the API for a specific user
// It includes the user's custom displayName for the group
export interface Group {
  _id: string;
  nome: string; // The actual name of the group
  displayName: string; // The user's custom display name for this group
  membros: string[] | GroupMember[];
  convites?: GroupInvite[];
  criadoPor: string;
  orcamentos: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  grupos: { groupId: string; displayName: string }[]; // Updated to match backend
  preferredStartDayOfMonth?: number; // New field for user preference
  createdAt: string;
  updatedAt: string;
}
