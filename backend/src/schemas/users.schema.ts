import { z } from 'zod';
import { Role } from '@prisma/client';

// =============================================================================
// SCHÉMAS DE VALIDATION UTILISATEURS
// =============================================================================

// Validation pour la création d'un utilisateur
export const createUserSchema = z.object({
  email: z
    .string()
    .email('Format d\'email invalide')
    .min(5, 'L\'email doit contenir au moins 5 caractères')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères'),

  role: z.nativeEnum(Role, {
    message: 'Le rôle doit être ADMIN_RH, MANAGER ou COLLABORATEUR'
  }),

  companyId: z
    .string()
    .cuid('ID entreprise invalide'),

  teamId: z
    .string()
    .cuid('ID équipe invalide')
    .optional()
});

// Validation pour la mise à jour d'un utilisateur
export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Format d\'email invalide')
    .min(5, 'L\'email doit contenir au moins 5 caractères')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères')
    .optional(),

  role: z.nativeEnum(Role, {
    message: 'Le rôle doit être ADMIN_RH, MANAGER ou COLLABORATEUR'
  }).optional(),

  teamId: z
    .string()
    .cuid('ID équipe invalide')
    .optional()
    .nullable()
});

// Validation pour les paramètres de liste (pagination)
export const listUsersQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Le numéro de page doit être un entier')
    .transform(Number)
    .refine(val => val > 0, 'Le numéro de page doit être supérieur à 0')
    .default(() => 1),

  limit: z
    .string()
    .regex(/^\d+$/, 'La limite doit être un entier')
    .transform(Number)
    .refine(val => val > 0 && val <= 100, 'La limite doit être entre 1 et 100')
    .default(() => 10),

  role: z.nativeEnum(Role).optional(),

  companyId: z
    .string()
    .cuid('ID entreprise invalide')
    .optional(),

  search: z
    .string()
    .min(2, 'La recherche doit contenir au moins 2 caractères')
    .max(50, 'La recherche ne peut pas dépasser 50 caractères')
    .optional()
});

// Validation pour les paramètres d'URL (ex: /:userId)
export const userParamsSchema = z.object({
  userId: z
    .string()
    .cuid('ID utilisateur invalide')
});

// =============================================================================
// TYPES INFÉRÉS DES SCHÉMAS
// =============================================================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UserParams = z.infer<typeof userParamsSchema>;

// =============================================================================
// SCHÉMAS DE VALIDATION SPÉCIALISÉS
// =============================================================================

// Validation pour création utilisateur par Admin RH
export const createUserByAdminSchema = createUserSchema.extend({
  // Un Admin RH peut créer tous types d'utilisateurs
  role: z.nativeEnum(Role)
});

// Validation pour création utilisateur par Manager (restreinte)
export const createUserByManagerSchema = createUserSchema.extend({
  // Un Manager ne peut créer que des COLLABORATEUR
  role: z.literal(Role.COLLABORATEUR),
  // Et seulement dans sa propre équipe (sera validé côté service)
  teamId: z.string().cuid('ID équipe requis pour les Managers')
});

export type CreateUserByAdminInput = z.infer<typeof createUserByAdminSchema>;
export type CreateUserByManagerInput = z.infer<typeof createUserByManagerSchema>;