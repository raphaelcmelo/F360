import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z
    .string()
    .min(3, "O nome deve ter pelo menos 3 caracteres.")
    .max(50, "O nome não pode exceder 50 caracteres."),
  email: z.string().email("Formato de e-mail inválido."),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(100, "A senha não pode exceder 100 caracteres."),
});

export const LoginSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
      .max(100, "A nova senha não pode exceder 100 caracteres."),
    confirmPassword: z
      .string()
      .min(8, "A confirmação da senha deve ter pelo menos 8 caracteres.")
      .max(100, "A confirmação da senha não pode exceder 100 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export const CreateGroupSchema = z.object({
  nome: z
    .string()
    .min(3, "O nome do grupo deve ter pelo menos 3 caracteres.")
    .max(100, "O nome do grupo não pode exceder 100 caracteres."),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Formato de e-mail inválido."),
});

export const UpdateGroupDisplayNameSchema = z.object({
  newDisplayName: z
    .string()
    .min(3, "O nome de exibição deve ter pelo menos 3 caracteres.")
    .max(100, "O nome de exibição não pode exceder 100 caracteres."),
});

export const CreateBudgetSchema = z.object({
  grupoId: z.string().min(1, "O ID do grupo é obrigatório."),
  dataInicio: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Formato de data de início inválido.",
  }),
  dataFim: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Formato de data de fim inválido.",
  }),
}).refine((data) => new Date(data.dataFim) >= new Date(data.dataInicio), {
  message: "A data de fim não pode ser anterior à data de início.",
  path: ["dataFim"],
});

export const CreatePlannedBudgetItemSchema = z.object({
  budgetId: z.string().min(1, "O ID do orçamento é obrigatório."),
  groupId: z.string().min(1, "O ID do grupo é obrigatório."),
  categoryType: z.enum(['renda', 'despesa', 'conta', 'poupanca'], {
    errorMap: () => ({ message: "Tipo de categoria inválido." }),
  }),
  nome: z
    .string()
    .min(1, "O nome do item planejado deve ter pelo menos 1 caractere.")
    .max(200, "O nome do item planejado não pode exceder 200 caracteres."),
  valorPlanejado: z
    .number()
    .min(0, "O valor planejado não pode ser negativo."),
});

export const UpdatePlannedBudgetItemSchema = z.object({
  categoryType: z.enum(['renda', 'despesa', 'conta', 'poupanca'], {
    errorMap: () => ({ message: "Tipo de categoria inválido." }),
  }).optional(),
  nome: z
    .string()
    .min(1, "O nome do item planejado deve ter pelo menos 1 caractere.")
    .max(200, "O nome do item planejado não pode exceder 200 caracteres.")
    .optional(),
  valorPlanejado: z
    .number()
    .min(0, "O valor planejado não pode ser negativo.")
    .optional(),
});

export const CreateTransactionSchema = z.object({
  grupoId: z.string().min(1, "O ID do grupo é obrigatório."),
  data: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Formato de data inválido.",
  }),
  categoria: z.enum(['renda', 'despesa', 'conta', 'poupanca'], {
    errorMap: () => ({ message: "Tipo de categoria inválido." }),
  }),
  tipo: z
    .string()
    .min(1, "O tipo de lançamento é obrigatório.")
    .max(200, "O tipo de lançamento não pode exceder 200 caracteres."),
  valor: z
    .number()
    .min(0.01, "O valor deve ser maior que zero."),
});

export const UpdateTransactionSchema = z.object({
  data: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Formato de data inválido.",
  }).optional(),
  categoria: z.enum(['renda', 'despesa', 'conta', 'poupanca'], {
    errorMap: () => ({ message: "Tipo de categoria inválido." }),
  }).optional(),
  tipo: z
    .string()
    .min(1, "O tipo de lançamento é obrigatório.")
    .max(200, "O tipo de lançamento não pode exceder 200 caracteres.")
    .optional(),
  valor: z
    .number()
    .min(0.01, "O valor deve ser maior que zero.")
    .optional(),
});
