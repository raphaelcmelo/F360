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
    password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
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
