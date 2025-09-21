# Enhanced Authorization System Implementation

## 1. Deep Route Protection Configuration

```typescript
// Enhanced route configuration with nested protection
const ROUTE_PERMISSIONS = {
  // Admin routes with deep protection
  '/admin': {
    roles: ['ADMIN_RH'],
    children: {
      '/admin/users': {
        GET: ['ADMIN_RH'],
        POST: ['ADMIN_RH'],
        PUT: ['ADMIN_RH'],
        DELETE: ['ADMIN_RH']
      },
      '/admin/users/[id]': {
        GET: ['ADMIN_RH'],
        PUT: ['ADMIN_RH'],
        DELETE: ['ADMIN_RH']
      },
      '/admin/companies': {
        GET: ['ADMIN_RH'],
        POST: ['ADMIN_RH'],
        PUT: ['ADMIN_RH']
      },
      '/admin/reports': {
        GET: ['ADMIN_RH'],
        patterns: {
          '/admin/reports/confidential/*': ['ADMIN_RH'],
          '/admin/reports/public/*': ['ADMIN_RH', 'MANAGER']
        }
      }
    }
  },

  // Manager routes with deep protection
  '/manager': {
    roles: ['MANAGER'],
    children: {
      '/manager/team': {
        GET: ['MANAGER'],
        PUT: ['MANAGER']
      },
      '/manager/reports': {
        GET: ['MANAGER'],
        patterns: {
          '/manager/reports/[teamId]/*': ['MANAGER'] // Context-aware
        }
      }
    }
  },

  // User routes
  '/user': {
    roles: ['COLLABORATEUR'],
    children: {
      '/user/profile': {
        GET: ['COLLABORATEUR'],
        PUT: ['COLLABORATEUR']
      }
    }
  }
} as const;
```

## 2. Context-Aware Authorization

```typescript
// Authorization context for fine-grained permissions
interface AuthorizationContext {
  user: User;
  resource?: {
    type: 'user' | 'team' | 'company' | 'report';
    id: string;
    ownerId?: string;
    teamId?: string;
    companyId?: string;
  };
  action: 'read' | 'write' | 'delete' | 'admin';
  conditions?: Record<string, any>;
}

// Permission checker with business logic
class PermissionChecker {
  static canAccess(context: AuthorizationContext): boolean {
    const { user, resource, action } = context;

    // Role-based checks
    if (user.role === 'ADMIN_RH') {
      return this.checkAdminPermissions(context);
    }

    if (user.role === 'MANAGER') {
      return this.checkManagerPermissions(context);
    }

    if (user.role === 'COLLABORATEUR') {
      return this.checkUserPermissions(context);
    }

    return false;
  }

  private static checkManagerPermissions(context: AuthorizationContext): boolean {
    const { user, resource, action } = context;

    // Managers can only access their team's resources
    if (resource?.teamId && resource.teamId !== user.teamId) {
      return false;
    }

    // Managers cannot delete users
    if (resource?.type === 'user' && action === 'delete') {
      return false;
    }

    return true;
  }

  private static checkUserPermissions(context: AuthorizationContext): boolean {
    const { user, resource, action } = context;

    // Users can only access their own resources
    if (resource?.ownerId && resource.ownerId !== user.id) {
      return false;
    }

    // Users cannot perform admin actions
    if (action === 'admin') {
      return false;
    }

    return true;
  }
}
```

## 3. API Route Protection Middleware

```typescript
// Enhanced API middleware with systematic protection
export function createAPIAuthMiddleware(
  permissions: RoutePermissions
) {
  return async (req: NextRequest) => {
    const { pathname, method } = req.nextUrl;

    // Skip public API routes
    if (isPublicAPIRoute(pathname)) {
      return NextResponse.next();
    }

    // Extract and validate session
    const session = await validateSession(req);
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Check route permissions
    const hasPermission = checkAPIPermission(
      pathname,
      method,
      session.user.role,
      permissions
    );

    if (!hasPermission) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }

    // Add security headers
    const response = NextResponse.next();
    addSecurityHeaders(response);

    return response;
  };
}
```

## 4. Component-Level Authorization

```typescript
// Authorization HOC for React components
interface RequirePermissionProps {
  role?: UserRole[];
  permissions?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({
  role,
  permissions,
  fallback = <AccessDenied />,
  children
}: RequirePermissionProps) {
  const { user } = useAuth();

  if (!user) {
    return <AuthRequired />;
  }

  // Role-based check
  if (role && !role.includes(user.role)) {
    return fallback;
  }

  // Permission-based check
  if (permissions && !hasPermissions(user, permissions)) {
    return fallback;
  }

  return <>{children}</>;
}

// Hook for conditional rendering
export function usePermissions() {
  const { user } = useAuth();

  return {
    canRead: (resource: string) => checkPermission(user, 'read', resource),
    canWrite: (resource: string) => checkPermission(user, 'write', resource),
    canDelete: (resource: string) => checkPermission(user, 'delete', resource),
    hasRole: (role: UserRole) => user?.role === role,
    isAdmin: () => user?.role === 'ADMIN_RH',
    isManager: () => user?.role === 'MANAGER',
    isUser: () => user?.role === 'COLLABORATEUR'
  };
}
```

## 5. Security Enhancement Features

### CSRF Protection
```typescript
// CSRF token management
class CSRFService {
  static generateToken(): string {
    return crypto.randomUUID();
  }

  static validateToken(token: string, sessionToken: string): boolean {
    // Implement token validation logic
    return this.getStoredToken(sessionToken) === token;
  }
}

// CSRF middleware
export const csrfProtection = (req: NextRequest) => {
  if (req.method !== 'GET') {
    const csrfToken = req.headers.get('x-csrf-token');
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!csrfToken || !CSRFService.validateToken(csrfToken, sessionToken)) {
      return new NextResponse('CSRF token invalid', { status: 403 });
    }
  }

  return NextResponse.next();
};
```

### Rate Limiting
```typescript
// Rate limiting implementation
class RateLimiter {
  private static attempts = new Map<string, number[]>();

  static checkLimit(identifier: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts
    const validAttempts = attempts.filter(time => now - time < windowMs);

    if (validAttempts.length >= maxAttempts) {
      return false;
    }

    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);
    return true;
  }
}
```

### Audit Logging
```typescript
// Security audit logging
interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'access_denied' | 'privilege_escalation';
  userId?: string;
  ip: string;
  userAgent: string;
  resource: string;
  timestamp: Date;
  details?: Record<string, any>;
}

class SecurityAudit {
  static log(event: SecurityEvent) {
    // Log to secure audit system
    console.log('[SECURITY]', JSON.stringify(event));

    // Alert on suspicious activity
    if (this.isSuspicious(event)) {
      this.alertSecurityTeam(event);
    }
  }

  private static isSuspicious(event: SecurityEvent): boolean {
    // Implement suspicious activity detection
    return event.type === 'privilege_escalation' ||
           this.hasMultipleFailures(event.ip);
  }
}
```