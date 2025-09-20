import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/auth.service';
import { ApiError, AuthenticatedRequest } from '@/types';

// =============================================================================
// MIDDLEWARE D'AUTHENTIFICATION
// =============================================================================

// Interface pour étendre Request avec user
// Removed duplicate - using AuthenticatedRequest from @/types

/**
 * Middleware pour vérifier l'authentification
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Récupérer le token de session depuis le cookie
    const sessionToken = req.cookies?.session_token;

    if (!sessionToken) {
      throw new ApiError('NO_TOKEN', 'Token d\'authentification manquant', 401);
    }

    // Valider le token et récupérer l'utilisateur
    const user = await AuthService.validateSession(sessionToken);

    // Injecter l'utilisateur dans la requête
    req.user = user;

    next();

  } catch (error: any) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }

    console.error('Erreur middleware authentification:', error);
    return res.status(500).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Erreur d\'authentification'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Middleware pour vérifier les rôles requis
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Authentification requise'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Permissions insuffisantes'
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      next();

    } catch (error: any) {
      console.error('Erreur middleware rôles:', error);
      return res.status(500).json({
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Erreur d\'autorisation'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

/**
 * Middleware pour vérifier l'isolation par company
 */
export const requireCompanyAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentification requise'
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }

    // Pour les Admin RH, accès à toute leur entreprise
    // Pour les Managers, accès limité à leur équipe
    // Pour les Collaborateurs, accès limité à leurs propres données

    // Injecter les filtres de company dans req pour utilisation dans les services
    (req as any).companyFilter = {
      companyId: user.companyId,
      teamId: user.role === 'MANAGER' ? user.teamId : undefined,
      userId: user.role === 'COLLABORATEUR' ? user.id : undefined
    };

    next();

  } catch (error: any) {
    console.error('Erreur middleware company access:', error);
    return res.status(500).json({
      error: {
        code: 'COMPANY_ACCESS_ERROR',
        message: 'Erreur d\'accès entreprise'
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Middleware optionnel d'authentification (n'échoue pas si pas de token)
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionToken = req.cookies?.session_token;

    if (sessionToken) {
      try {
        const user = await AuthService.validateSession(sessionToken);
        req.user = user;
      } catch (error) {
        // Ignore silently - optional auth
      }
    }

    next();

  } catch (error: any) {
    console.error('Erreur middleware authentification optionnelle:', error);
    next(); // Continue même en cas d'erreur
  }
};