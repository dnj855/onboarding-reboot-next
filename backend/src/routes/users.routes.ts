import { Router } from 'express';
import { UsersController } from '@/controllers/users.controller';
import {
  authenticateToken,
  requireRole,
  requireCompanyAccess
} from '@/middleware/auth.middleware';

const router: Router = Router();

// =============================================================================
// ROUTES UTILISATEURS - SÉCURISÉES
// =============================================================================

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);
router.use(requireCompanyAccess);

// GET /api/users - Lister les utilisateurs (Admin RH + Manager)
router.get('/',
  requireRole(['ADMIN_RH', 'MANAGER']),
  UsersController.listUsers
);

// POST /api/users - Créer un nouvel utilisateur (Admin RH uniquement)
router.post('/',
  requireRole(['ADMIN_RH']),
  UsersController.createUser
);

// GET /api/users/email/:email - Récupérer un utilisateur par email (Admin RH + Manager)
router.get('/email/:email',
  requireRole(['ADMIN_RH', 'MANAGER']),
  UsersController.getUserByEmail
);

// GET /api/users/:userId - Récupérer un utilisateur par ID (Tous avec restrictions)
router.get('/:userId', UsersController.getUserById);

// PUT /api/users/:userId - Mettre à jour un utilisateur (Admin RH + Manager avec restrictions)
router.put('/:userId',
  requireRole(['ADMIN_RH', 'MANAGER']),
  UsersController.updateUser
);

// DELETE /api/users/:userId - Supprimer un utilisateur (Admin RH uniquement)
router.delete('/:userId',
  requireRole(['ADMIN_RH']),
  UsersController.deleteUser
);

export default router;