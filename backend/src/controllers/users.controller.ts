import { Request, Response, NextFunction } from 'express';
import { UsersService } from '@/services/users.service';
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
  userParamsSchema
} from '@/schemas/users.schema';
import { ApiResponse, CreateUserResponse, UserWithCompany, ApiError, AuthenticatedRequest } from '@/types';

// =============================================================================
// CONTROLLER UTILISATEURS
// =============================================================================

export class UsersController {

  // POST /api/users - Créer un utilisateur
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Validation des données d'entrée
      const validatedData = createUserSchema.parse(req.body);

      // Création via le service
      const user = await UsersService.createUser(validatedData);

      // Réponse formatée
      const response: ApiResponse<CreateUserResponse> = {
        data: {
          user,
          message: 'Utilisateur créé avec succès'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(201).json(response);

    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:userId - Récupérer un utilisateur
  static async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Validation des paramètres
      const { userId } = userParamsSchema.parse(req.params);

      // Vérification que l'utilisateur est authentifié (garanti par le middleware)
      if (!req.user) {
        throw new ApiError('AUTHENTICATION_REQUIRED', 'Authentification requise', 401);
      }

      // Récupération via le service avec vérification des permissions
      const user = await UsersService.getUserById(userId, req.user);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Utilisateur introuvable'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Réponse formatée
      const response: ApiResponse = {
        data: user,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }

  // GET /api/users - Lister les utilisateurs
  static async listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Validation des query parameters
      const validatedQuery = listUsersQuerySchema.parse(req.query);

      // Vérification que l'utilisateur est authentifié (garanti par le middleware)
      if (!req.user) {
        throw new ApiError('AUTHENTICATION_REQUIRED', 'Authentification requise', 401);
      }

      // Récupération via le service avec utilisateur authentifié
      const result = await UsersService.listUsers(validatedQuery, req.user);

      // Réponse formatée
      const response: ApiResponse<UserWithCompany[]> = {
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: result.pagination
        }
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:userId - Mettre à jour un utilisateur
  static async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Validation des paramètres et du body
      const { userId } = userParamsSchema.parse(req.params);
      const validatedData = updateUserSchema.parse(req.body);

      // Vérification que l'utilisateur est authentifié (garanti par le middleware)
      if (!req.user) {
        throw new ApiError('AUTHENTICATION_REQUIRED', 'Authentification requise', 401);
      }

      // Mise à jour via le service avec vérification des permissions
      const user = await UsersService.updateUser(userId, validatedData, req.user);

      // Réponse formatée
      const response: ApiResponse = {
        data: {
          user,
          message: 'Utilisateur mis à jour avec succès'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:userId - Supprimer un utilisateur
  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Validation des paramètres
      const { userId } = userParamsSchema.parse(req.params);

      // Vérification que l'utilisateur est authentifié (garanti par le middleware)
      if (!req.user) {
        throw new ApiError('AUTHENTICATION_REQUIRED', 'Authentification requise', 401);
      }

      // Suppression via le service avec vérification des permissions
      await UsersService.deleteUser(userId, req.user);

      // Réponse formatée
      const response: ApiResponse = {
        data: {
          message: 'Utilisateur supprimé avec succès'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/email/:email - Récupérer un utilisateur par email
  static async getUserByEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.params;

      // Validation basique de l'email
      if (!email || !email.includes('@')) {
        return res.status(400).json({
          error: {
            code: 'INVALID_EMAIL',
            message: 'Format d\'email invalide'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Vérification que l'utilisateur est authentifié (garanti par le middleware)
      if (!req.user) {
        throw new ApiError('AUTHENTICATION_REQUIRED', 'Authentification requise', 401);
      }

      // Récupération via le service avec vérification des permissions
      const user = await UsersService.getUserByEmail(email, req.user);

      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Utilisateur introuvable'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Réponse formatée
      const response: ApiResponse = {
        data: user,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.status(200).json(response);

    } catch (error) {
      next(error);
    }
  }
}