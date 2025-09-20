import { z } from 'zod';

// =============================================================================
// SCHÉMAS DE VALIDATION D'AUTHENTIFICATION
// =============================================================================

export const generateMagicLinkSchema = z.object({
  email: z
    .string({ message: 'Email requis' })
    .email('Format email invalide')
    .toLowerCase()
    .trim()
});

export const verifyMagicLinkSchema = z.object({
  token: z
    .string({ message: 'Token requis' })
    .min(64, 'Token invalide')
    .max(64, 'Token invalide')
    .regex(/^[a-f0-9]{64}$/, 'Format de token invalide')
});

export const sessionTokenSchema = z.object({
  sessionToken: z
    .string({ message: 'Token de session requis' })
    .min(64, 'Token de session invalide')
    .max(64, 'Token de session invalide')
    .regex(/^[a-f0-9]{64}$/, 'Format de token de session invalide')
});

// =============================================================================
// TYPES TYPESCRIPT DÉRIVÉS
// =============================================================================

export type GenerateMagicLinkInput = z.infer<typeof generateMagicLinkSchema>;
export type VerifyMagicLinkInput = z.infer<typeof verifyMagicLinkSchema>;
export type SessionTokenInput = z.infer<typeof sessionTokenSchema>;