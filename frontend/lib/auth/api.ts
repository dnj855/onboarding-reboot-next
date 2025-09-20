// =============================================================================
// CLIENT API D'AUTHENTIFICATION AVEC AUTO-REFRESH
// =============================================================================

import {
  API_BASE_URL,
  API_ENDPOINTS,
  MagicLinkResponse,
  VerifyResponse,
  RefreshResponse,
  LogoutResponse,
} from './types';

// =============================================================================
// GESTION D'ERREURS
// =============================================================================

export class AuthApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

// =============================================================================
// CLIENT API AVEC AUTO-REFRESH
// =============================================================================

class AuthApiClient {
  private refreshPromise: Promise<string> | null = null;

  /**
   * Requête HTTP basique avec gestion d'erreurs
   */
  private async fetchWithError(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        credentials: 'include', // Important pour les cookies HttpOnly
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Erreur inconnue'
        }));

        throw new AuthApiError(
          errorData.code || 'HTTP_ERROR',
          errorData.message || `Erreur HTTP ${response.status}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof AuthApiError) {
        throw error;
      }

      throw new AuthApiError(
        'NETWORK_ERROR',
        'Erreur de connexion au serveur'
      );
    }
  }

  /**
   * Rafraîchit l'access token (évite les appels multiples simultanés)
   */
  private async refreshAccessToken(): Promise<string> {
    // Si un refresh est déjà en cours, on attend le même
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Effectue le refresh token réel
   */
  private async performRefresh(): Promise<string> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
      { method: 'POST' }
    );

    const data: RefreshResponse = await response.json();
    return data.accessToken;
  }

  /**
   * Requête avec auto-refresh si token expiré
   */
  async fetchWithAuth(
    url: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<Response> {
    // Première tentative avec le token actuel
    try {
      const headers: Record<string, string> = {};

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await this.fetchWithError(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      return response;
    } catch (error) {
      // Si le token est expiré, on tente un refresh
      if (error instanceof AuthApiError && error.code === 'ACCESS_TOKEN_EXPIRED') {
        try {
          const newToken = await this.refreshAccessToken();

          // Retry avec le nouveau token
          return this.fetchWithError(url, {
            ...options,
            headers: {
              Authorization: `Bearer ${newToken}`,
              ...options.headers,
            },
          });
        } catch (refreshError) {
          // Si le refresh échoue, on propage l'erreur
          throw refreshError;
        }
      }

      // Pour toute autre erreur, on propage
      throw error;
    }
  }

  // ==========================================================================
  // MÉTHODES D'API PUBLIQUES
  // ==========================================================================

  /**
   * Demande de génération d'un magic link
   */
  async requestMagicLink(email: string): Promise<MagicLinkResponse> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}${API_ENDPOINTS.MAGIC_LINK}`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );

    return response.json();
  }

  /**
   * Validation d'un magic link
   */
  async verifyMagicLink(token: string): Promise<VerifyResponse> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}${API_ENDPOINTS.VERIFY}`,
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      }
    );

    return response.json();
  }

  /**
   * Rafraîchissement manuel du token
   */
  async refreshToken(): Promise<RefreshResponse> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}${API_ENDPOINTS.REFRESH}`,
      { method: 'POST' }
    );

    return response.json();
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<LogoutResponse> {
    const response = await this.fetchWithError(
      `${API_BASE_URL}${API_ENDPOINTS.LOGOUT}`,
      { method: 'POST' }
    );

    return response.json();
  }

  /**
   * Récupération du profil utilisateur (avec auto-refresh)
   */
  async getCurrentUser(accessToken: string): Promise<{ user: unknown }> {
    const response = await this.fetchWithAuth(
      `${API_BASE_URL}${API_ENDPOINTS.ME}`,
      { method: 'GET' },
      accessToken
    );

    return response.json();
  }
}

// Instance singleton
export const authApi = new AuthApiClient();