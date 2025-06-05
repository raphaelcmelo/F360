import { z } from "zod";

export const CreateTransactionSchema = z.object({
  grupoId: z.string(),
  data: z.string().datetime(), // Expect ISO string from frontend
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"]),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  valor: z.number().min(0.01, "O valor deve ser maior que zero"),
});

export const UpdateTransactionSchema = z.object({
  data: z.string().datetime().optional(),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"]).optional(),
  tipo: z.string().min(1, "Tipo é obrigatório").optional(),
  valor: z.number().min(0.01, "O valor deve ser maior que zero").optional(),
});

// Schema for creating a new group
export const CreateGroupSchema = z.object({
  nome: z.string().min(1, "O nome do grupo é obrigatório."),
});

// Schema for updating group display name
export const UpdateGroupDisplayNameSchema = z.object({
  newDisplayName: z.string().min(1, "O novo nome de exibição é obrigatório."),
});

// Schema for inviting a member to a group
export const InviteMemberSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
});

// Schema for creating a budget
export const CreateBudgetSchema = z.object({
  grupoId: z.string().min(1, "ID do grupo é obrigatório."),
  dataInicio: z.string().datetime("Data de início inválida."),
  dataFim: z.string().datetime("Data de fim inválida."),
});

// Schema for updating a budget (e.g., dates)
export const UpdateBudgetSchema = z.object({
  dataInicio: z.string().datetime("Data de início inválida.").optional(),
  dataFim: z.string().datetime("Data de fim inválida.").optional(),
});

// Schema for creating a planned budget item
export const CreatePlannedBudgetItemSchema = z.object({
  budgetId: z.string().min(1, "ID do orçamento é obrigatório."),
  groupId: z.string().min(1, "ID do grupo é obrigatório."),
  categoryType: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Tipo de categoria é obrigatório.",
  }),
  nome: z.string().min(1, "Nome do item é obrigatório."),
  valorPlanejado: z
    .number()
    .min(0.01, "Valor planejado deve ser maior que zero."),
});

// Schema for updating a planned budget item
export const UpdatePlannedBudgetItemSchema = z.object({
  categoryType: z
    .enum(["renda", "despesa", "conta", "poupanca"])
    .optional(),
  nome: z.string().min(1, "Nome do item é obrigatório.").optional(),
  valorPlanejado: z
    .number()
    .min(0.01, "Valor planejado deve ser maior que zero.")
    .optional(),
});
