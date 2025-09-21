// =============================================================================
// MIDDLEWARE NEXT.JS - ROUTING PROTÉGÉ MULTI-PERSONA
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// =============================================================================
// CONFIGURATION DU ROUTING
// =============================================================================

// Routes protégées par rôle - chaque rôle accède uniquement à son espace
const PROTECTED_ROUTES = {
  COLLABORATEUR: ['/user'],
  MANAGER: ['/manager'],
  ADMIN_RH: ['/admin'],
  ALL: ['/profile', '/settings'], // Routes accessibles à tous les utilisateurs connectés
} as const;

// Routes publiques (accès libre)
const PUBLIC_ROUTES = [
  '/',
  '/connexion',
  '/auth/magic-link',
  '/health',
  '/_next',
  '/favicon.ico',
] as const;

// Pages de redirection par rôle
const ROLE_REDIRECTS = {
  COLLABORATEUR: '/user',
  MANAGER: '/manager',
  ADMIN_RH: '/admin',
} as const;

// =============================================================================
// UTILITAIRES D'AUTHENTIFICATION
// =============================================================================

/**
 * Valide le refresh token et récupère les infos utilisateur
 */
async function validateRefreshToken(refreshToken: string): Promise<{
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: 'ADMIN_RH' | 'MANAGER' | 'COLLABORATEUR';
  };
}> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `refreshToken=${refreshToken}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json();
    return {
      valid: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Erreur validation refresh token:', error);
    return { valid: false };
  }
}

/**
 * Vérifie si l'utilisateur a accès à une route
 */
function hasAccessToRoute(
  pathname: string,
  userRole?: string
): boolean {
  // Protection contre les valeurs invalides
  if (!pathname || typeof pathname !== 'string') {
    return false;
  }

  // Routes publiques - vérification exacte pour éviter les conflits
  if (PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'; // Correspondance exacte pour la racine
    }
    return pathname.startsWith(route);
  })) {
    return true;
  }

  // Pas d'utilisateur connecté
  if (!userRole || typeof userRole !== 'string') {
    return false;
  }

  // Routes accessibles à tous les utilisateurs connectés
  if (PROTECTED_ROUTES.ALL.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Vérifier l'accès exclusif par rôle
  for (const [role, routes] of Object.entries(PROTECTED_ROUTES)) {
    if (role === 'ALL') continue; // Déjà vérifié au-dessus

    // Si la route correspond à un rôle spécifique
    if (routes.some(route => pathname.startsWith(route))) {
      // L'utilisateur doit avoir exactement ce rôle
      return userRole === role;
    }
  }

  return false;
}

// =============================================================================
// MIDDLEWARE PRINCIPAL
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protection contre les pathname undefined ou invalides
  if (!pathname || typeof pathname !== 'string') {
    return NextResponse.next();
  }

  // Ignorer les routes techniques de Next.js
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Récupérer le refresh token depuis les cookies
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  let userRole: string | undefined;

  // Valider l'authentification si un token existe
  if (refreshToken) {
    const authResult = await validateRefreshToken(refreshToken);
    if (authResult.valid && authResult.user) {
      userRole = authResult.user.role;
    }
  }

  // ==========================================================================
  // LOGIQUE DE REDIRECTION
  // ==========================================================================

  // Route racine "/" : rediriger selon l'état d'authentification
  if (pathname === '/') {
    if (userRole && ROLE_REDIRECTS[userRole as keyof typeof ROLE_REDIRECTS]) {
      const redirectUrl = new URL(
        ROLE_REDIRECTS[userRole as keyof typeof ROLE_REDIRECTS],
        request.url
      );
      return NextResponse.redirect(redirectUrl);
    } else {
      // Utilisateur non connecté : rediriger vers la page de connexion
      const redirectUrl = new URL('/connexion', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Vérifier l'accès à la route
  const hasAccess = hasAccessToRoute(pathname, userRole);

  if (!hasAccess) {
    // Utilisateur non connecté tentant d'accéder à une route protégée
    if (!userRole) {
      const redirectUrl = new URL('/connexion', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Utilisateur connecté sans permission pour cette route
    const allowedRoute = ROLE_REDIRECTS[userRole as keyof typeof ROLE_REDIRECTS];
    if (allowedRoute) {
      const redirectUrl = new URL(allowedRoute, request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Fallback : rediriger vers la page de connexion
    const redirectUrl = new URL('/connexion', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // ==========================================================================
  // HEADERS DE SÉCURITÉ
  // ==========================================================================

  const response = NextResponse.next();

  // Ajouter des headers de sécurité
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Ajouter les informations utilisateur dans les headers (pour les composants)
  if (userRole) {
    response.headers.set('X-User-Role', userRole);
  }

  return response;
}

// =============================================================================
// CONFIGURATION DU MATCHER
// =============================================================================

export const config = {
  // Appliquer le middleware à toutes les routes sauf celles exclues
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};