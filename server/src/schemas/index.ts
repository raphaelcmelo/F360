import { z } from "zod";

// Auth Schemas
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const LoginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "A nova senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

// Group Schemas
export const CreateGroupSchema = z.object({
  nome: z.string().min(1, "O nome do grupo é obrigatório"),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Formato de e-mail inválido"),
});

export const UpdateGroupDisplayNameSchema = z.object({
  newDisplayName: z.string().min(1, "O nome de exibição é obrigatório"),
});

// New Schema for accepting group invitations
export const AcceptGroupInvitationSchema = z.object({
  groupId: z.string().min(1, "ID do grupo é obrigatório"),
  token: z.string().min(1, "Token é obrigatório"),
});

// Budget Schemas
export const CreateBudgetSchema = z.object({
  grupoId: z.string().min(1, "ID do grupo é obrigatório"),
  dataInicio: z.string().datetime("Data de início inválida"), // Assuming ISO string format
  dataFim: z.string().datetime("Data de fim inválida"), // Assuming ISO string format
});

// Planned BudgetItem Schemas
export const CreatePlannedBudgetItemSchema = z.object({
  budgetId: z.string().min(1, "ID do orçamento é obrigatório"),
  groupId: z.string().min(1, "ID do grupo é obrigatório"),
  categoryType: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Tipo de categoria é obrigatório",
  }),
  nome: z
    .string()
    .min(1, "Nome do item é obrigatório")
    .max(200, "Nome muito longo"),
  valorPlanejado: z.number().min(0, "Valor planejado deve ser não negativo"),
});

export const UpdatePlannedBudgetItemSchema = z.object({
  categoryType: z
    .enum(["renda", "despesa", "conta", "poupanca"], {
      required_error: "Tipo de categoria é obrigatório",
    })
    .optional(),
  nome: z
    .string()
    .min(1, "Nome do item é obrigatório")
    .max(200, "Nome muito longo")
    .optional(),
  valorPlanejado: z
    .number()
    .min(0, "Valor planejado deve ser não negativo")
    .optional(),
});

// Transaction Schemas
export const CreateTransactionSchema = z.object({
  grupoId: z.string().min(1, "ID do grupo é obrigatório"),
  data: z.string().datetime("Data inválida. Use formato ISO 8601."),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"], {
    required_error: "Categoria é obrigatória",
  }),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  valor: z.number().min(0.01, "O valor deve ser maior que zero"),
});

export const UpdateTransactionSchema = z.object({
  data: z.string().datetime("Data inválida. Use formato ISO 8601.").optional(),
  categoria: z.enum(["renda", "despesa", "conta", "poupanca"]).optional(),
  tipo: z.string().min(1, "Tipo é obrigatório").optional(),
  valor: z.number().min(0.01, "O valor deve ser maior que zero").optional(),
});
