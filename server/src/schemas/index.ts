import { z } from 'zod';

export const CreateGroupSchema = z.object({
  nome: z.string().min(3, 'O nome do grupo deve ter pelo menos 3 caracteres.').max(100, 'O nome do grupo não pode exceder 100 caracteres.'),
});

export const InviteMemberSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.'),
});

export const UpdateGroupDisplayNameSchema = z.object({
  newDisplayName: z.string().min(3, 'O nome de exibição deve ter pelo menos 3 caracteres.').max(100, 'O nome de exibição não pode exceder 100 caracteres.'),
});
