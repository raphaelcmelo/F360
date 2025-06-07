import { z } from "zod";

// Auth Schemas
export const RegisterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const ResetPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

// Group Schemas
export const CreateGroupSchema = z.object({
  nome: z.string().min(1, "Nome do grupo é obrigatório"),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Email do membro inválido"),
});

export const UpdateGroupDisplayNameSchema = z.object({
  newDisplayName: z.string().min(1, "Nome de exibição é obrigatório"),
});

// New Schema for accepting group invitations
export const AcceptGroupInvitationSchema = z.object({
  groupId: z.string().min(1, "ID do grupo é obrigatório"),
  token: z.string().min(1, "Token é obrigatório"),
});

// Budget Schemas
export const CreateBudgetSchema = z.object({
  grupoId: z.string().min(1, "ID do grupo é obrigatório"),
  dataInicio: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Data de início inválida",
  }),
  dataFim: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Data de fim inválida",
  }),
});

// PlannedBudgetItem Schemas
export const CreatePlannedBudgetItemSchema = z.object({
  budgetId: z.string().min(1, "ID do orçamento é obrigatório"),
  groupId: z.string().min(1, "ID do grupo é obrigatório"),
  categoryType: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Tipo de categoria é obrigatório",
  }),
  nome: z.string().min(1, "Nome do item é obrigatório"),
  valorPlanejado: z.number().min(0, "Valor planejado deve ser não negativo"),
});

export const UpdatePlannedBudgetItemSchema = z.object({
  categoryType: z
    .enum(["renda", "despesa", "conta", "poupanca"])
    .optional(),
  nome: z.string().min(1, "Nome do item é obrigatório").optional(),
  valorPlanejado: z.number().min(0, "Valor planejado deve ser não negativo").optional(),
}).refine(
  (data) =>
    data.categoryType !== undefined ||
    data.nome !== undefined ||
    data.valorPlanejado !== undefined,
  {
    message: "Pelo menos um campo deve ser fornecido para atualização",
    path: ["categoryType", "nome", "valorPlanejado"],
  }
);

// Transaction Schemas
export const CreateTransactionSchema = z.object({
  grupoId: z.string().min(1, "ID do grupo é obrigatório"),
  data: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Data da transação inválida",
  }),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Categoria é obrigatória",
  }),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  description: z.string().optional(),
});

export const UpdateTransactionSchema = z.object({
  data: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Data da transação inválida",
  }).optional(),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"]).optional(),
  tipo: z.string().min(1, "Tipo é obrigatório").optional(),
  valor: z.number().min(0.01, "Valor deve ser maior que zero").optional(),
  description: z.string().optional(),
}).refine(
  (data) =>
    data.data !== undefined ||
    data.categoria !== undefined ||
    data.tipo !== undefined ||
    data.valor !== undefined ||
    data.description !== undefined,
  {
    message: "Pelo menos um campo deve ser fornecido para atualização",
    path: ["data", "categoria", "tipo", "valor", "description"],
  }
);

// New schema for updating user preferences
export const UpdateUserPreferencesSchema = z.object({
  preferredStartDayOfMonth: z.number().min(1).max(30).optional(),
});
