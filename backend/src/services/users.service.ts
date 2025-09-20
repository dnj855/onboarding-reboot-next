import { User, Role } from '@prisma/client';
import {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
  UserWithCompany,
  UserSession,
  PaginatedResponse
} from '@/types';
import { createApiError } from '@/middleware/errorHandler';
import { prisma } from '@/lib/prisma';

// =============================================================================
// SERVICE UTILISATEURS
// =============================================================================

export class UsersService {

  // Créer un nouvel utilisateur
  static async createUser(data: CreateUserInput): Promise<User> {
    try {
      // Vérifier que l'entreprise existe
      const company = await prisma.company.findUnique({
        where: { id: data.companyId }
      });

      if (!company) {
        throw createApiError(
          'COMPANY_NOT_FOUND',
          'Entreprise introuvable',
          404
        );
      }

      // Validation métier : un Manager doit avoir un teamId
      if (data.role === Role.MANAGER && !data.teamId) {
        throw createApiError(
          'TEAM_ID_REQUIRED',
          'Un Manager doit être associé à une équipe',
          400
        );
      }

      // Validation métier : un Admin RH ne devrait pas avoir de teamId
      if (data.role === Role.ADMIN_RH && data.teamId) {
        throw createApiError(
          'TEAM_ID_NOT_ALLOWED',
          'Un Admin RH ne peut pas être associé à une équipe spécifique',
          400
        );
      }

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: data.email,
          role: data.role,
          companyId: data.companyId,
          teamId: data.teamId
        }
      });

      return user;

    } catch (error: any) {
      // Si c'est déjà une ApiError, la relancer
      if (error.statusCode) {
        throw error;
      }
      // Sinon, erreur générique
      throw createApiError(
        'USER_CREATION_FAILED',
        'Erreur lors de la création de l\'utilisateur',
        500,
        { originalError: error?.message }
      );
    }
  }

  // Récupérer un utilisateur par ID avec vérification des permissions
  static async getUserById(
    userId: string,
    requestingUser: UserSession
  ): Promise<UserWithCompany | null> {
    try {
      // Construction du filtre avec isolation par entreprise
      const where: any = { id: userId };

      // Isolation par entreprise obligatoire
      where.companyId = requestingUser.companyId;

      // Restrictions supplémentaires selon le rôle
      if (requestingUser.role === 'MANAGER') {
        // Manager: seulement les utilisateurs de son équipe
        where.teamId = requestingUser.teamId;
      } else if (requestingUser.role === 'COLLABORATEUR') {
        // Collaborateur: seulement ses propres données
        where.id = requestingUser.id;
      }
      // Admin RH: accès à tous les utilisateurs de l'entreprise

      const user = await prisma.user.findUnique({
        where,
        include: {
          company: true
        }
      });

      return user;

    } catch (error: any) {
      throw createApiError(
        'USER_FETCH_FAILED',
        'Erreur lors de la récupération de l\'utilisateur',
        500,
        { originalError: error?.message }
      );
    }
  }

  // Récupérer un utilisateur par email avec vérification des permissions
  static async getUserByEmail(
    email: string,
    requestingUser: UserSession
  ): Promise<UserWithCompany | null> {
    try {
      // Construction du filtre avec isolation par entreprise
      const where: any = { email };

      // Isolation par entreprise obligatoire
      where.companyId = requestingUser.companyId;

      // Restrictions supplémentaires selon le rôle
      if (requestingUser.role === 'MANAGER') {
        // Manager: seulement les utilisateurs de son équipe
        where.teamId = requestingUser.teamId;
      } else if (requestingUser.role === 'COLLABORATEUR') {
        // Collaborateur: seulement ses propres données
        where.id = requestingUser.id;
      }
      // Admin RH: accès à tous les utilisateurs de l'entreprise

      const user = await prisma.user.findUnique({
        where,
        include: {
          company: true
        }
      });

      return user;

    } catch (error: any) {
      throw createApiError(
        'USER_FETCH_FAILED',
        'Erreur lors de la récupération de l\'utilisateur',
        500,
        { originalError: error?.message }
      );
    }
  }

  // Lister les utilisateurs avec pagination et filtres
  static async listUsers(
    query: ListUsersQuery,
    requestingUser?: UserSession
  ): Promise<PaginatedResponse<UserWithCompany>> {
    try {
      const { page, limit, role, companyId, search } = query;
      const skip = (page - 1) * limit;

      // Construction des filtres
      const where: any = {};

      // Filtre par entreprise (obligatoire pour isolation)
      if (companyId) {
        where.companyId = companyId;
      } else if (requestingUser) {
        // Si pas de companyId spécifié, utiliser celui de l'utilisateur requérant
        where.companyId = requestingUser.companyId;
      }

      // Isolation par équipe pour les Managers
      if (requestingUser?.role === Role.MANAGER) {
        where.teamId = requestingUser.teamId;
      }

      // Filtre par rôle
      if (role) {
        where.role = role;
      }

      // Filtre de recherche par email
      if (search) {
        where.email = {
          contains: search,
          mode: 'insensitive'
        };
      }

      // Exécution des requêtes en parallèle
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            company: true
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.user.count({ where })
      ]);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error: any) {
      throw createApiError(
        'USERS_LIST_FAILED',
        'Erreur lors de la récupération de la liste des utilisateurs',
        500,
        { originalError: error?.message }
      );
    }
  }

  // Mettre à jour un utilisateur avec vérification des permissions
  static async updateUser(
    userId: string,
    data: UpdateUserInput,
    requestingUser: UserSession
  ): Promise<User> {
    try {
      // Construction du filtre avec isolation par entreprise et permissions
      const where: any = { id: userId };

      // Isolation par entreprise obligatoire
      where.companyId = requestingUser.companyId;

      // Restrictions supplémentaires selon le rôle
      if (requestingUser.role === 'MANAGER') {
        // Manager: seulement les utilisateurs de son équipe
        where.teamId = requestingUser.teamId;
      } else if (requestingUser.role === 'COLLABORATEUR') {
        // Collaborateur: seulement ses propres données
        where.id = requestingUser.id;
      }
      // Admin RH: accès à tous les utilisateurs de l'entreprise

      // Vérifier que l'utilisateur existe avec les bonnes permissions
      const existingUser = await prisma.user.findUnique({
        where
      });

      if (!existingUser) {
        throw createApiError(
          'USER_NOT_FOUND',
          'Utilisateur introuvable ou accès non autorisé',
          404
        );
      }

      // Validation métier pour les rôles et teamId
      const newRole = data.role || existingUser.role;
      const newTeamId = data.teamId !== undefined ? data.teamId : existingUser.teamId;

      if (newRole === Role.MANAGER && !newTeamId) {
        throw createApiError(
          'TEAM_ID_REQUIRED',
          'Un Manager doit être associé à une équipe',
          400
        );
      }

      if (newRole === Role.ADMIN_RH && newTeamId) {
        throw createApiError(
          'TEAM_ID_NOT_ALLOWED',
          'Un Admin RH ne peut pas être associé à une équipe spécifique',
          400
        );
      }

      // Mise à jour avec les mêmes restrictions de permissions
      const updatedUser = await prisma.user.update({
        where,
        data: {
          ...data,
          // Forcer teamId à null pour Admin RH
          teamId: newRole === Role.ADMIN_RH ? null : newTeamId
        }
      });

      return updatedUser;

    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      throw createApiError(
        'USER_UPDATE_FAILED',
        'Erreur lors de la mise à jour de l\'utilisateur',
        500,
        { originalError: error?.message }
      );
    }
  }

  // Supprimer un utilisateur avec vérification des permissions
  static async deleteUser(
    userId: string,
    requestingUser: UserSession
  ): Promise<void> {
    try {
      // Construction du filtre avec isolation par entreprise et permissions
      const where: any = { id: userId };

      // Isolation par entreprise obligatoire
      where.companyId = requestingUser.companyId;

      // Restrictions supplémentaires selon le rôle
      if (requestingUser.role === 'MANAGER') {
        // Manager: seulement les utilisateurs de son équipe
        where.teamId = requestingUser.teamId;
      } else if (requestingUser.role === 'COLLABORATEUR') {
        // Collaborateur: ne peut pas supprimer d'utilisateurs
        throw createApiError(
          'UNAUTHORIZED',
          'Un collaborateur ne peut pas supprimer d\'utilisateurs',
          403
        );
      }
      // Admin RH: accès à tous les utilisateurs de l'entreprise

      // Vérifier que l'utilisateur existe avec les bonnes permissions
      const existingUser = await prisma.user.findUnique({
        where
      });

      if (!existingUser) {
        throw createApiError(
          'USER_NOT_FOUND',
          'Utilisateur introuvable ou accès non autorisé',
          404
        );
      }

      // Suppression avec les mêmes restrictions de permissions
      await prisma.user.delete({
        where
      });

    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      throw createApiError(
        'USER_DELETE_FAILED',
        'Erreur lors de la suppression de l\'utilisateur',
        500,
        { originalError: error?.message }
      );
    }
  }
}