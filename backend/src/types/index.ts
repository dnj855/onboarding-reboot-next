import { User, Company, Role } from '@prisma/client';
import { Request } from 'express';

// =============================================================================
// TYPES DE BASE
// =============================================================================

export { User, Company, Role };

// =============================================================================
// TYPES API
// =============================================================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =============================================================================
// TYPES UTILISATEURS
// =============================================================================

export interface CreateUserData {
  email: string;
  role: Role;
  companyId: string;
  teamId?: string;
}

export interface UpdateUserData {
  email?: string;
  role?: Role;
  teamId?: string;
}

export interface UserWithCompany extends User {
  company: Company;
}

/**
 * Session utilisateur minimale pour l'authentification
 * Ne contient que les données essentielles pour la sécurité
 */
export interface UserSession {
  id: string;
  role: Role;
  companyId: string;
  teamId: string | null;
}

// =============================================================================
// TYPES REQUÊTES EXPRESS
// =============================================================================

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

// =============================================================================
// TYPES DE RÉPONSES SPÉCIFIQUES
// =============================================================================

export interface CreateUserResponse {
  user: User;
  message: string;
}

export interface UserListResponse extends PaginatedResponse<UserWithCompany> {}

// =============================================================================
// TYPES DE VALIDATION
// =============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorInterface {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(code: string, message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// =============================================================================
// RE-EXPORTS DES SCHÉMAS
// =============================================================================

export type {
  CreateUserInput,
  UpdateUserInput,
  ListUsersQuery,
  UserParams
} from '@/schemas/users.schema';