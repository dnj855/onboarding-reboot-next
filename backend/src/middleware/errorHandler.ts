import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';

// Types d'erreurs standardisées
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

// Middleware de gestion centralisée des erreurs
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🔥 Erreur capturée:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  // Erreur de validation Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      details: error.issues.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Erreurs Prisma
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return res.status(409).json({
          code: 'DUPLICATE_ENTRY',
          message: 'Cette entrée existe déjà',
          details: {
            field: error.meta?.target
          }
        });

      case 'P2025': // Record not found
        return res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Ressource introuvable'
        });

      case 'P2003': // Foreign key constraint violation
        return res.status(400).json({
          code: 'REFERENCE_ERROR',
          message: 'Référence invalide'
        });

      default:
        return res.status(500).json({
          code: 'DATABASE_ERROR',
          message: 'Erreur de base de données'
        });
    }
  }

  // Erreur API personnalisée
  if (error.statusCode && error.code) {
    return res.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details
    });
  }

  // Erreur générique
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'Une erreur interne est survenue'
      : error.message
  });
};

// Utilitaire pour créer des erreurs API
export const createApiError = (
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): ApiError => ({
  code,
  message,
  statusCode,
  details
});