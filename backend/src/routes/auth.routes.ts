import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticateToken, requireRole } from '@/middleware/auth.middleware';

const router: Router = Router();

// =============================================================================
// ROUTES D'AUTHENTIFICATION
// =============================================================================

// POST /api/auth/magic-link - Générer un lien magique
router.post('/magic-link', AuthController.generateMagicLink);

// POST /api/auth/verify - Valider un magic link et créer une session
router.post('/verify', AuthController.verifyMagicLink);

// GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// POST /api/auth/logout - Déconnecter l'utilisateur
router.post('/logout', AuthController.logout);

// POST /api/auth/revoke-all-sessions/:userId - Révoquer toutes les sessions d'un utilisateur (Admin RH uniquement)
router.post(
  '/revoke-all-sessions/:userId',
  authenticateToken,
  requireRole(['ADMIN_RH']),
  AuthController.revokeAllUserSessions
);

export default router;