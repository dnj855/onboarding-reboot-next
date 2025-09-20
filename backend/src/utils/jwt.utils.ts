import jwt from 'jsonwebtoken';
import { ApiError } from '@/types';

// =============================================================================
// UTILITAIRES JWT POUR ACCESS TOKENS
// =============================================================================

export interface JwtPayload {
  userId: string;
  role: string;
  companyId: string;
  teamId?: string;
}

export class JwtUtils {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-super-secret-access-key';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes

  /**
   * Génère un access token JWT
   */
  static generateAccessToken(payload: JwtPayload): string {
    try {
      return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        issuer: 'onboarding-ai',
        audience: 'frontend-app'
      });
    } catch (error) {
      console.error('Erreur génération access token:', error);
      throw new ApiError(
        'ACCESS_TOKEN_GENERATION_FAILED',
        'Erreur lors de la génération du token d\'accès',
        500
      );
    }
  }

  /**
   * Vérifie et décode un access token JWT
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'onboarding-ai',
        audience: 'frontend-app'
      }) as JwtPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('ACCESS_TOKEN_EXPIRED', 'Token d\'accès expiré', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('INVALID_ACCESS_TOKEN', 'Token d\'accès invalide', 401);
      }

      console.error('Erreur vérification access token:', error);
      throw new ApiError(
        'ACCESS_TOKEN_VERIFICATION_FAILED',
        'Erreur lors de la vérification du token d\'accès',
        500
      );
    }
  }

  /**
   * Décode un token sans vérification (pour debug)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}