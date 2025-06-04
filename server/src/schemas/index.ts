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
