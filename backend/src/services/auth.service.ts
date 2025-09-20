import { createHash, randomBytes } from 'crypto';
import { ApiError, UserSession } from '@/types';
import { prisma } from '@/lib/prisma';
import { JwtUtils } from '@/utils/jwt.utils';

// =============================================================================
// SERVICE D'AUTHENTIFICATION
// =============================================================================

export class AuthService {

  // ===========================================================================
  // GÉNÉRATION ET VALIDATION DES MAGIC LINKS
  // ===========================================================================

  /**
   * Génère un lien magique pour un utilisateur
   */
  static async generateMagicLink(email: string): Promise<{
    magicLinkId: string;
    token: string;
    expiresAt: Date
  }> {
    try {
      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true }
      });

      if (!user) {
        throw new ApiError('USER_NOT_FOUND', 'Utilisateur introuvable', 404);
      }

      // Générer token sécurisé (256 bits d'entropie)
      const token = randomBytes(32).toString('hex'); // 64 caractères
      const tokenHash = createHash('sha256').update(token).digest('hex');

      // Expiration : 24 heures
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Invalider les anciens magic links de cet utilisateur
      await prisma.magicLink.deleteMany({
        where: {
          userId: user.id,
          usedAt: null // Seulement les non-utilisés
        }
      });

      // Créer le nouveau magic link
      const magicLink = await prisma.magicLink.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt
        }
      });

      return {
        magicLinkId: magicLink.id,
        token, // Token en clair pour l'envoi par email
        expiresAt
      };

    } catch (error: any) {
      if (error instanceof ApiError) throw error;

      console.error('Erreur génération magic link:', error);
      throw new ApiError(
        'MAGIC_LINK_GENERATION_FAILED',
        'Erreur lors de la génération du lien magique',
        500
      );
    }
  }

  /**
   * Valide un magic link et crée une session avec access/refresh tokens
   */
  static async validateMagicLinkAndCreateSession(token: string): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  }> {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');

      // Rechercher le magic link
      const magicLink = await prisma.magicLink.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: { company: true }
          }
        }
      });

      if (!magicLink) {
        throw new ApiError('INVALID_TOKEN', 'Lien magique invalide', 401);
      }

      // Vérifier l'expiration
      if (magicLink.expiresAt < new Date()) {
        throw new ApiError('EXPIRED_TOKEN', 'Lien magique expiré', 401);
      }

      // Vérifier qu'il n'a pas déjà été utilisé
      if (magicLink.usedAt) {
        throw new ApiError('TOKEN_ALREADY_USED', 'Lien magique déjà utilisé', 401);
      }

      // Marquer le magic link comme utilisé
      await prisma.magicLink.update({
        where: { id: magicLink.id },
        data: { usedAt: new Date() }
      });

      // Générer refresh token (stocké en DB, longue durée)
      const refreshToken = randomBytes(32).toString('hex');
      const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

      // Expiration refresh token : 30 jours
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Créer la session refresh
      await prisma.authSession.create({
        data: {
          userId: magicLink.user.id,
          tokenHash: refreshTokenHash,
          expiresAt: refreshExpiresAt
        }
      });

      // Générer access token JWT (courte durée, pas en DB)
      const accessToken = JwtUtils.generateAccessToken({
        userId: magicLink.user.id,
        role: magicLink.user.role,
        companyId: magicLink.user.companyId,
        teamId: magicLink.user.teamId || undefined
      });

      return {
        user: {
          id: magicLink.user.id,
          email: magicLink.user.email,
          role: magicLink.user.role
        },
        accessToken, // JWT pour les requêtes API
        refreshToken, // Token pour cookie HttpOnly
        refreshExpiresAt
      };

    } catch (error: any) {
      if (error instanceof ApiError) throw error;

      console.error('Erreur validation magic link:', error);
      throw new ApiError(
        'MAGIC_LINK_VALIDATION_FAILED',
        'Erreur lors de la validation du lien magique',
        500
      );
    }
  }

  // ===========================================================================
  // GESTION DES SESSIONS
  // ===========================================================================

  /**
   * Valide un token de session et retourne l'utilisateur
   */
  static async validateSession(sessionToken: string): Promise<UserSession> {
    try {
      const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

      // Rechercher la session
      const session = await prisma.authSession.findUnique({
        where: { tokenHash },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new ApiError('INVALID_SESSION', 'Session invalide', 401);
      }

      // Vérifier l'expiration
      if (session.expiresAt < new Date()) {
        // Supprimer la session expirée
        await prisma.authSession.delete({
          where: { id: session.id }
        });
        throw new ApiError('EXPIRED_SESSION', 'Session expirée', 401);
      }

      // Retourner une session minimale sécurisée
      return {
        id: session.user.id,
        role: session.user.role,
        companyId: session.user.companyId,
        teamId: session.user.teamId
      };

    } catch (error: any) {
      if (error instanceof ApiError) throw error;

      console.error('Erreur validation session:', error);
      throw new ApiError(
        'SESSION_VALIDATION_FAILED',
        'Erreur lors de la validation de la session',
        500
      );
    }
  }

  /**
   * Révoque une session (logout)
   */
  static async revokeSession(sessionToken: string): Promise<void> {
    try {
      const tokenHash = createHash('sha256').update(sessionToken).digest('hex');

      // Supprimer la session
      await prisma.authSession.deleteMany({
        where: { tokenHash }
      });

    } catch (error: any) {
      console.error('Erreur révocation session:', error);
      throw new ApiError(
        'SESSION_REVOCATION_FAILED',
        'Erreur lors de la révocation de la session',
        500
      );
    }
  }

  /**
   * Révoque toutes les sessions d'un utilisateur
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await prisma.authSession.deleteMany({
        where: { userId }
      });
    } catch (error: any) {
      console.error('Erreur révocation toutes sessions:', error);
      throw new ApiError(
        'ALL_SESSIONS_REVOCATION_FAILED',
        'Erreur lors de la révocation des sessions',
        500
      );
    }
  }

  // ===========================================================================
  // RAFRAÎCHISSEMENT DE SESSION
  // ===========================================================================

  /**
   * Rafraîchit un access token en utilisant le refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    user: any;
    accessToken: string;
  }> {
    try {
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      // Rechercher la session refresh
      const session = await prisma.authSession.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: { company: true }
          }
        }
      });

      if (!session) {
        throw new ApiError('INVALID_REFRESH_TOKEN', 'Token de rafraîchissement invalide', 401);
      }

      // Vérifier l'expiration
      if (session.expiresAt < new Date()) {
        // Supprimer la session expirée
        await prisma.authSession.delete({
          where: { id: session.id }
        });
        throw new ApiError('EXPIRED_REFRESH_TOKEN', 'Token de rafraîchissement expiré', 401);
      }

      // Générer un nouveau access token
      const accessToken = JwtUtils.generateAccessToken({
        userId: session.user.id,
        role: session.user.role,
        companyId: session.user.companyId,
        teamId: session.user.teamId || undefined
      });

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role
        },
        accessToken
      };

    } catch (error: any) {
      if (error instanceof ApiError) throw error;

      console.error('Erreur rafraîchissement access token:', error);
      throw new ApiError(
        'TOKEN_REFRESH_FAILED',
        'Erreur lors du rafraîchissement du token',
        500
      );
    }
  }

  // ===========================================================================
  // NETTOYAGE AUTOMATIQUE
  // ===========================================================================

  /**
   * Nettoie les tokens expirés (à appeler périodiquement)
   */
  static async cleanupExpiredTokens(): Promise<{
    deletedMagicLinks: number;
    deletedSessions: number
  }> {
    try {
      const now = new Date();

      // Supprimer les magic links expirés
      const deletedMagicLinks = await prisma.magicLink.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { usedAt: { not: null } } // Nettoyer aussi les utilisés
          ]
        }
      });

      // Supprimer les sessions expirées
      const deletedSessions = await prisma.authSession.deleteMany({
        where: { expiresAt: { lt: now } }
      });

      return {
        deletedMagicLinks: deletedMagicLinks.count,
        deletedSessions: deletedSessions.count
      };

    } catch (error: any) {
      console.error('Erreur nettoyage tokens:', error);
      throw new ApiError(
        'CLEANUP_FAILED',
        'Erreur lors du nettoyage des tokens',
        500
      );
    }
  }
}