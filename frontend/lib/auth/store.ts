// =============================================================================
// STORE ZUSTAND D'AUTHENTIFICATION
// =============================================================================

// React hooks removed - not used in this file
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { authApi, AuthApiError } from './api';
import type { AuthStore, User } from './types';

// =============================================================================
// STORE D'AUTHENTIFICATION
// =============================================================================

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // =======================================================================
      // ÉTAT INITIAL
      // =======================================================================
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,

      // =======================================================================
      // ACTIONS PRINCIPALES
      // =======================================================================

      /**
       * Validation d'un magic link
       */
      validateMagicLink: async (token: string) => {
        set({ isLoading: true });

        try {
          const response = await authApi.verifyMagicLink(token);

          // Stocker les données d'authentification
          set({
            isAuthenticated: true,
            isLoading: false,
            user: response.user,
            accessToken: response.accessToken,
          });
        } catch (error) {
          set({ isLoading: false });

          if (error instanceof AuthApiError) {
            throw error;
          }

          throw new AuthApiError(
            'VALIDATION_FAILED',
            'Erreur lors de la validation du lien'
          );
        }
      },

      /**
       * Demande d'un magic link
       */
      requestMagicLink: async (email: string) => {
        set({ isLoading: true });

        try {
          await authApi.requestMagicLink(email);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });

          if (error instanceof AuthApiError) {
            throw error;
          }

          throw new AuthApiError(
            'REQUEST_FAILED',
            'Erreur lors de la demande de lien'
          );
        }
      },

      /**
       * Déconnexion
       */
      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          // On continue même si l'API échoue (nettoyage local)
          console.warn('Erreur lors de la déconnexion:', error);
        } finally {
          // Nettoyer l'état local dans tous les cas
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            accessToken: null,
          });
        }
      },

      // =======================================================================
      // ACTIONS INTERNES
      // =======================================================================

      /**
       * Rafraîchissement de l'authentification
       */
      refreshAuth: async () => {
        // On ne vérifie plus l'accessToken ici car il n'est pas persisté
        // L'appel API se base uniquement sur le cookie HttpOnly refreshToken

        try {
          const response = await authApi.refreshToken();

          set({
            isAuthenticated: true, // Mise à jour explicite de l'état
            user: response.user,
            accessToken: response.accessToken,
          });
        } catch (error) {
          // Si le refresh échoue, on déconnecte l'utilisateur
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
          });

          // On propage l'erreur pour que le AuthProvider puisse la gérer
          if (error instanceof AuthApiError) {
            throw error;
          }

          throw new AuthApiError(
            'REFRESH_FAILED',
            'Erreur lors du rafraîchissement'
          );
        }
      },

      /**
       * Définir les données d'authentification
       */
      setAuthData: (accessToken: string, user: User) => {
        set({
          isAuthenticated: true,
          user,
          accessToken,
        });
      },

      /**
       * Nettoyer l'authentification
       */
      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
        });
      },

      // =======================================================================
      // UTILITAIRES
      // =======================================================================

      /**
       * Récupérer les headers d'authentification
       */
      getAuthHeaders: () => {
        const { accessToken } = get();

        if (!accessToken) {
          return {};
        }

        return {
          Authorization: `Bearer ${accessToken}`,
        } as Record<string, string>;
      },
    }),

    // ==========================================================================
    // CONFIGURATION PERSISTENCE
    // ==========================================================================
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,

      // On ne persiste que les données non-sensibles
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        // IMPORTANT: On ne persiste PAS l'accessToken (sécurité)
        // Il sera rafraîchi via le refresh token cookie au démarrage
      }),

      // Hydratation : rafraîchir l'auth au démarrage si l'utilisateur était connecté
      onRehydrateStorage: () => {
        return async (state) => {
          if (state?.isAuthenticated && state?.user) {
            try {
              // Tenter de rafraîchir l'access token via le refresh cookie
              await state.refreshAuth();
            } catch {
              // Si échec, nettoyer l'état
              state?.clearAuth();
            }
          }
        };
      },
    }
  )
);

// =============================================================================
// HYDRATATION AUTOMATIQUE
// =============================================================================
// L'hydratation est maintenant gérée par AuthProvider dans /components/providers/auth-provider.tsx

// =============================================================================
// HOOKS UTILITAIRES
// =============================================================================

/**
 * Hook pour l'état d'authentification
 */
export const useAuth = () => {
  return useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      user: state.user,
    }))
  );
};

/**
 * Hook pour les actions d'authentification
 */
export const useAuthActions = () => {
  const validateMagicLink = useAuthStore((state) => state.validateMagicLink);
  const requestMagicLink = useAuthStore((state) => state.requestMagicLink);
  const logout = useAuthStore((state) => state.logout);
  const refreshAuth = useAuthStore((state) => state.refreshAuth);

  return {
    validateMagicLink,
    requestMagicLink,
    logout,
    refreshAuth,
  };
};

/**
 * Hook pour les utilitaires d'authentification
 */
export const useAuthUtils = () => {
  const getAuthHeaders = useAuthStore((state) => state.getAuthHeaders);

  return {
    getAuthHeaders,
  };
};