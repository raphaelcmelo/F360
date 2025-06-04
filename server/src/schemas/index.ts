import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const ResetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    passwordConfirm: z
      .string()
      .min(6, "Password confirmation must be at least 6 characters long"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

// New Schemas for Group Management
export const CreateGroupSchema = z.object({
  nome: z.string().min(3, "Group name must be at least 3 characters long").max(100, "Group name cannot exceed 100 characters"),
});

export const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address for invitation"),
});
