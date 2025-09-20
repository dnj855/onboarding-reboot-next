import {
  generateMagicLinkSchema,
  verifyMagicLinkSchema,
} from "@/schemas/auth.schema";
import { AuthService } from "@/services/auth.service";
import { ApiResponse } from "@/types";
import { NextFunction, Request, Response } from "express";

// =============================================================================
// CONTROLLER D'AUTHENTIFICATION
// =============================================================================

export class AuthController {
  // ===========================================================================
  // GÉNÉRATION DE MAGIC LINK
  // ===========================================================================

  // POST /api/auth/magic-link - Générer un lien magique
  static async generateMagicLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Validation des données d'entrée
      const validatedData = generateMagicLinkSchema.parse(req.body);

      // Génération du magic link
      const result = await AuthService.generateMagicLink(validatedData.email);

      // TODO: Ici, dans un vrai système, on enverrait l'email
      // Pour le MVP, on retourne le token pour les tests
      const response: ApiResponse = {
        data: {
          message: "Lien magique généré avec succès",
          // En production, ces infos ne seraient PAS retournées
          debug: {
            token: result.token,
            expiresAt: result.expiresAt,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  // ===========================================================================
  // VALIDATION DE MAGIC LINK ET CRÉATION DE SESSION
  // ===========================================================================

  // POST /api/auth/verify - Valider un magic link et créer une session
  static async verifyMagicLink(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Validation des données d'entrée
      const validatedData = verifyMagicLinkSchema.parse(req.body);

      // Validation du magic link et création de session
      const result = await AuthService.validateMagicLinkAndCreateSession(
        validatedData.token
      );

      // Configuration du cookie de session
      const cookieOptions = {
        httpOnly: true, // Empêche l'accès JavaScript côté client
        secure: process.env.NODE_ENV === "production", // HTTPS uniquement en prod
        sameSite: "lax" as const, // Protection CSRF
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours en millisecondes
        path: "/", // Cookie disponible sur tout le site
      };

      // Définir le cookie de session
      res.cookie("session_token", result.sessionToken, cookieOptions);

      // Réponse avec informations utilisateur
      const response: ApiResponse = {
        data: {
          message: "Authentification réussie",
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            company: result.user.company,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  // ===========================================================================
  // INFORMATION UTILISATEUR COURANT
  // ===========================================================================

  // GET /api/auth/me - Récupérer les informations de l'utilisateur connecté
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      // L'utilisateur sera injecté par le middleware d'authentification
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          error: {
            code: "NOT_AUTHENTICATED",
            message: "Non authentifié",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      const response: ApiResponse = {
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            company: user.company,
            teamId: user.teamId,
          },
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  // ===========================================================================
  // DÉCONNEXION
  // ===========================================================================

  // POST /api/auth/logout - Déconnecter l'utilisateur
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Récupérer le token de session depuis le cookie
      const sessionToken = req.cookies?.session_token;

      if (sessionToken) {
        // Révoquer la session en base
        await AuthService.revokeSession(sessionToken);
      }

      // Supprimer le cookie
      res.clearCookie("session_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      const response: ApiResponse = {
        data: {
          message: "Déconnexion réussie",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }

  // ===========================================================================
  // RÉVOCATION DE TOUTES LES SESSIONS (ADMIN)
  // ===========================================================================

  // POST /api/auth/revoke-all-sessions/:userId - Révoquer toutes les sessions d'un utilisateur
  static async revokeAllUserSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = req.params;
      const currentUser = (req as any).user;

      // Vérifier les permissions (seuls les Admin RH peuvent faire ça)
      if (!currentUser || currentUser.role !== "ADMIN_RH") {
        return res.status(403).json({
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Permissions insuffisantes",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Révoquer toutes les sessions
      await AuthService.revokeAllUserSessions(userId);

      const response: ApiResponse = {
        data: {
          message: "Toutes les sessions de l'utilisateur ont été révoquées",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  }
}
