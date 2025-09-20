// =============================================================================
// TYPES D'AUTHENTIFICATION FRONTEND
// =============================================================================

export interface User {
  id: string;
  email: string;
  role: 'ADMIN_RH' | 'MANAGER' | 'COLLABORATEUR';
  firstName?: string;
  lastName?: string;
  managerName?: string;
  startDate?: string;
}

export interface AuthState {
  // État de connexion
  isAuthenticated: boolean;
  isLoading: boolean;

  // Données utilisateur (non-sensibles)
  user: User | null;

  // Token d'accès (courte durée)
  accessToken: string | null;
}

export interface AuthActions {
  // Actions principales
  validateMagicLink: (token: string) => Promise<void>;
  requestMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;

  // Actions internes
  refreshAuth: () => Promise<void>;
  setAuthData: (accessToken: string, user: User) => void;
  clearAuth: () => void;

  // Utilitaires
  getAuthHeaders: () => Record<string, string>;
}

export interface AuthStore extends AuthState, AuthActions {}

// Types pour les réponses API (conformes au contrat backend)
export interface MagicLinkResponse {
  success: true;
}

export interface VerifyResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
  user: User;
}

export interface LogoutResponse {
  success: true;
}

// Types d'erreur API
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Configuration API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const API_ENDPOINTS = {
  MAGIC_LINK: '/api/auth/magic-link',
  VERIFY: '/api/auth/verify',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
} as const;