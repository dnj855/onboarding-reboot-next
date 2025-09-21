# Critical Security Fixes Implementation

## 1. Enhanced Middleware with Deep Route Protection

```typescript
// frontend/middleware.ts - Enhanced version
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Deep route protection configuration
const ROUTE_PERMISSIONS = {
  // Exact route matches
  exact: {
    '/admin': ['ADMIN_RH'],
    '/manager': ['MANAGER'],
    '/user': ['COLLABORATEUR'],
    '/profile': ['ADMIN_RH', 'MANAGER', 'COLLABORATEUR'],
    '/settings': ['ADMIN_RH', 'MANAGER', 'COLLABORATEUR']
  },

  // Pattern-based matches with granular permissions
  patterns: [
    {
      pattern: /^\/admin\/users(\/.*)?$/,
      roles: ['ADMIN_RH'],
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    },
    {
      pattern: /^\/admin\/reports\/confidential(\/.*)?$/,
      roles: ['ADMIN_RH']
    },
    {
      pattern: /^\/manager\/team(\/.*)?$/,
      roles: ['MANAGER']
    },
    {
      pattern: /^\/manager\/reports(\/.*)?$/,
      roles: ['MANAGER']
    },
    {
      pattern: /^\/user\/profile(\/.*)?$/,
      roles: ['COLLABORATEUR']
    }
  ]
} as const;

// Enhanced route access checker
function hasAccessToRoute(pathname: string, userRole?: string, method: string = 'GET'): boolean {
  if (!pathname || !userRole) return false;

  // Check public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Check exact matches
  const exactMatch = ROUTE_PERMISSIONS.exact[pathname as keyof typeof ROUTE_PERMISSIONS.exact];
  if (exactMatch) {
    return exactMatch.includes(userRole as any);
  }

  // Check pattern matches
  for (const rule of ROUTE_PERMISSIONS.patterns) {
    if (rule.pattern.test(pathname)) {
      const hasRole = rule.roles.includes(userRole as any);
      const hasMethod = !rule.methods || rule.methods.includes(method);
      return hasRole && hasMethod;
    }
  }

  return false;
}

// Enhanced middleware with security improvements
export async function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl;

  // Security headers for all responses
  const response = NextResponse.next();
  addSecurityHeaders(response);

  // Skip technical routes
  if (shouldSkipRoute(pathname)) {
    return response;
  }

  // Rate limiting check
  const clientIP = getClientIP(request);
  if (!checkRateLimit(clientIP, pathname)) {
    return new NextResponse('Rate limit exceeded', {
      status: 429,
      headers: { 'Retry-After': '60' }
    });
  }

  // Validate session
  const session = await validateUserSession(request);

  // Route access validation
  const hasAccess = hasAccessToRoute(pathname, session?.user?.role, method);

  if (!hasAccess) {
    // Audit failed access attempt
    auditSecurityEvent({
      type: 'access_denied',
      ip: clientIP,
      pathname,
      method,
      userRole: session?.user?.role,
      timestamp: new Date()
    });

    if (!session) {
      return redirectToLogin(request, pathname);
    } else {
      return redirectToAuthorized(request, session.user.role);
    }
  }

  // Add session context to headers (secure way)
  if (session) {
    response.headers.set('X-User-Context', encodeUserContext(session.user));
  }

  return response;
}

// Security headers implementation
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // CSRF protection
  response.headers.set('X-CSRF-Protection', 'enabled');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
}

// Rate limiting implementation
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string, pathname: string): boolean {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = pathname.startsWith('/api/auth') ? 5 : 100;

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > current.resetTime) {
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }

  rateLimitStore.set(key, current);
  return current.count <= maxRequests;
}

// Secure user context encoding (avoid exposing sensitive data)
function encodeUserContext(user: any): string {
  const safeContext = {
    hasAdminAccess: user.role === 'ADMIN_RH',
    hasManagerAccess: ['ADMIN_RH', 'MANAGER'].includes(user.role),
    canModifyUsers: user.role === 'ADMIN_RH'
  };

  return Buffer.from(JSON.stringify(safeContext)).toString('base64');
}
```

## 2. API Route Protection System

```typescript
// app/api/middleware.ts - New API protection middleware
import { NextRequest, NextResponse } from 'next/server';

export interface APIRouteConfig {
  path: string;
  methods: string[];
  roles: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  requireCSRF?: boolean;
}

const API_PERMISSIONS: APIRouteConfig[] = [
  {
    path: '/api/auth/magic-link',
    methods: ['POST'],
    roles: [], // Public
    rateLimit: { windowMs: 60000, maxRequests: 3 }
  },
  {
    path: '/api/auth/verify',
    methods: ['POST'],
    roles: [], // Public
    rateLimit: { windowMs: 60000, maxRequests: 5 }
  },
  {
    path: '/api/users',
    methods: ['GET'],
    roles: ['ADMIN_RH', 'MANAGER'],
    requireCSRF: true
  },
  {
    path: '/api/users',
    methods: ['POST', 'PUT', 'DELETE'],
    roles: ['ADMIN_RH'],
    requireCSRF: true,
    rateLimit: { windowMs: 60000, maxRequests: 10 }
  },
  {
    path: '/api/users/[id]',
    methods: ['GET'],
    roles: ['ADMIN_RH', 'MANAGER', 'COLLABORATEUR'], // Context-dependent
    requireCSRF: true
  },
  {
    path: '/api/admin/*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    roles: ['ADMIN_RH'],
    requireCSRF: true
  }
];

export async function apiAuthMiddleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl;

  // Find matching configuration
  const config = findAPIConfig(pathname, method);
  if (!config) {
    return new NextResponse('Route not found', { status: 404 });
  }

  // Rate limiting
  if (config.rateLimit) {
    const clientIP = getClientIP(request);
    if (!checkAPIRateLimit(clientIP, pathname, config.rateLimit)) {
      return new NextResponse('Rate limit exceeded', { status: 429 });
    }
  }

  // CSRF protection for state-changing operations
  if (config.requireCSRF && ['POST', 'PUT', 'DELETE'].includes(method)) {
    const csrfValid = await validateCSRFToken(request);
    if (!csrfValid) {
      return new NextResponse('CSRF token invalid', { status: 403 });
    }
  }

  // Authentication check
  if (config.roles.length > 0) {
    const session = await validateAPISession(request);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Authorization check
    if (!config.roles.includes(session.user.role)) {
      auditSecurityEvent({
        type: 'access_denied',
        userId: session.user.id,
        resource: pathname,
        action: method,
        requiredRoles: config.roles,
        userRole: session.user.role
      });

      return new NextResponse('Forbidden', { status: 403 });
    }

    // Context-aware authorization for user-specific resources
    if (pathname.includes('/users/') && session.user.role === 'COLLABORATEUR') {
      const isOwnResource = await validateResourceOwnership(pathname, session.user.id);
      if (!isOwnResource) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  return NextResponse.next();
}
```

## 3. Enhanced Authentication Store with Security

```typescript
// lib/auth/secure-store.ts - Enhanced version with security improvements
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Security-enhanced auth store
export const useSecureAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ... existing state ...

      // Enhanced login with security logging
      validateMagicLink: async (token: string) => {
        set({ isLoading: true });

        try {
          // Client-side token validation
          if (!isValidTokenFormat(token)) {
            throw new AuthApiError('INVALID_TOKEN_FORMAT', 'Format de token invalide');
          }

          const response = await authApi.verifyMagicLink(token);

          // Security audit
          auditSecurityEvent({
            type: 'auth_success',
            userId: response.user.id,
            method: 'magic_link',
            timestamp: new Date()
          });

          set({
            isAuthenticated: true,
            isLoading: false,
            user: response.user,
            accessToken: response.accessToken,
            lastActivity: Date.now()
          });

          // Clear any security flags
          clearSecurityFlags();

        } catch (error) {
          set({ isLoading: false });

          // Security audit for failed attempts
          auditSecurityEvent({
            type: 'auth_failure',
            method: 'magic_link',
            error: error.message,
            timestamp: new Date()
          });

          if (error instanceof AuthApiError) {
            throw error;
          }

          throw new AuthApiError('VALIDATION_FAILED', 'Erreur lors de la validation');
        }
      },

      // Enhanced logout with session cleanup
      logout: async () => {
        const currentUser = get().user;

        try {
          await authApi.logout();

          // Security audit
          if (currentUser) {
            auditSecurityEvent({
              type: 'logout',
              userId: currentUser.id,
              timestamp: new Date()
            });
          }

        } catch (error) {
          console.warn('Erreur lors de la déconnexion:', error);
        } finally {
          // Complete state cleanup
          set({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            accessToken: null,
            lastActivity: null
          });

          // Clear all security-related local storage
          clearSecurityState();
        }
      },

      // Session activity tracking
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      // Security state checks
      checkSecurityState: () => {
        const state = get();

        // Check for inactive session
        if (state.lastActivity && Date.now() - state.lastActivity > 30 * 60 * 1000) {
          // Auto-logout after 30 minutes of inactivity
          state.logout();
          return false;
        }

        return true;
      }
    }),

    {
      name: 'secure-auth-store',
      storage: createJSONStorage(() => localStorage),

      // Enhanced partialize - exclude sensitive data
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          role: state.user.role,
          // Don't persist sensitive user data
        } : null,
        lastActivity: state.lastActivity
        // Never persist access tokens
      }),

      // Security-aware rehydration
      onRehydrateStorage: () => {
        return async (state) => {
          if (state?.isAuthenticated && state?.user) {
            // Verify session is still valid
            try {
              await state.refreshAuth();

              // Check for security state
              if (!state.checkSecurityState()) {
                return;
              }

            } catch {
              // Clear invalid session
              state?.clearAuth();
              clearSecurityState();
            }
          }
        };
      }
    }
  )
);

// Security helper functions
function isValidTokenFormat(token: string): boolean {
  // Implement token format validation
  return token && token.length >= 32 && /^[a-zA-Z0-9-_]+$/.test(token);
}

function clearSecurityFlags(): void {
  // Clear any security-related flags or warnings
  localStorage.removeItem('security_warnings');
  localStorage.removeItem('failed_attempts');
}

function clearSecurityState(): void {
  // Clear all security-related local storage
  const securityKeys = ['security_warnings', 'failed_attempts', 'csrf_tokens'];
  securityKeys.forEach(key => localStorage.removeItem(key));
}
```

## 4. Component-Level Security Enforcement

```typescript
// components/auth/RequirePermission.tsx
import { useAuth } from '@/lib/auth/store';
import { ReactNode } from 'react';

interface RequirePermissionProps {
  roles?: string[];
  permissions?: string[];
  resource?: string;
  resourceId?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  roles,
  permissions,
  resource,
  resourceId,
  fallback = <AccessDenied />,
  children
}: RequirePermissionProps) {
  const { user } = useAuth();

  if (!user) {
    return <AuthRequired />;
  }

  // Role-based check
  if (roles && !roles.includes(user.role)) {
    // Audit unauthorized access attempt
    auditSecurityEvent({
      type: 'component_access_denied',
      userId: user.id,
      requiredRoles: roles,
      userRole: user.role,
      component: 'RequirePermission'
    });

    return <>{fallback}</>;
  }

  // Permission-based check
  if (permissions && !hasUserPermissions(user, permissions)) {
    return <>{fallback}</>;
  }

  // Resource ownership check
  if (resource && resourceId && !canAccessResource(user, resource, resourceId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Secure button component with permission checks
export function SecureButton({
  action,
  resource,
  resourceId,
  requiredRoles,
  children,
  ...props
}: {
  action: 'read' | 'write' | 'delete';
  resource?: string;
  resourceId?: string;
  requiredRoles?: string[];
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {

  const { user } = useAuth();
  const canPerformAction = checkActionPermission(user, action, resource, resourceId);

  if (!canPerformAction) {
    return null; // Don't render unauthorized actions
  }

  return <button {...props}>{children}</button>;
}
```