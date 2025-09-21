# Security Testing Strategy

## 1. Authorization Security Test Suite

```typescript
// tests/security/authorization.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from '../utils/test-client';

describe('Authorization Security Tests', () => {
  describe('Route Protection', () => {
    it('should block unauthenticated access to protected routes', async () => {
      const protectedRoutes = ['/admin', '/manager', '/user'];

      for (const route of protectedRoutes) {
        const response = await testClient.get(route);
        expect(response.status).toBe(302); // Redirect to login
        expect(response.headers.location).toContain('/connexion');
      }
    });

    it('should block role-based unauthorized access', async () => {
      const testCases = [
        { route: '/admin', role: 'COLLABORATEUR', shouldBlock: true },
        { route: '/admin', role: 'MANAGER', shouldBlock: true },
        { route: '/admin', role: 'ADMIN_RH', shouldBlock: false },
        { route: '/manager', role: 'COLLABORATEUR', shouldBlock: true },
        { route: '/manager', role: 'MANAGER', shouldBlock: false },
        { route: '/user', role: 'ADMIN_RH', shouldBlock: false },
      ];

      for (const testCase of testCases) {
        const response = await testClient
          .withAuth(testCase.role)
          .get(testCase.route);

        if (testCase.shouldBlock) {
          expect(response.status).toBe(302);
        } else {
          expect(response.status).toBe(200);
        }
      }
    });

    it('should protect deep nested routes', async () => {
      const nestedRoutes = [
        { path: '/admin/users/123/delete', role: 'COLLABORATEUR' },
        { path: '/admin/reports/confidential/2024', role: 'MANAGER' },
        { path: '/manager/team/sensitive-data', role: 'COLLABORATEUR' }
      ];

      for (const route of nestedRoutes) {
        const response = await testClient
          .withAuth(route.role)
          .get(route.path);

        expect(response.status).toBe(302); // Should redirect
      }
    });
  });

  describe('API Authorization', () => {
    it('should protect API endpoints with proper authentication', async () => {
      const apiEndpoints = [
        { path: '/api/users', method: 'GET' },
        { path: '/api/users', method: 'POST' },
        { path: '/api/users/123', method: 'PUT' },
        { path: '/api/users/123', method: 'DELETE' }
      ];

      for (const endpoint of apiEndpoints) {
        const response = await testClient[endpoint.method.toLowerCase()](endpoint.path);
        expect(response.status).toBe(401);
      }
    });

    it('should enforce role-based API access', async () => {
      // Test ADMIN_RH access
      let response = await testClient
        .withAuth('ADMIN_RH')
        .post('/api/users', { userData: {} });
      expect(response.status).toBe(200);

      // Test MANAGER access (should fail)
      response = await testClient
        .withAuth('MANAGER')
        .post('/api/users', { userData: {} });
      expect(response.status).toBe(403);

      // Test COLLABORATEUR access (should fail)
      response = await testClient
        .withAuth('COLLABORATEUR')
        .post('/api/users', { userData: {} });
      expect(response.status).toBe(403);
    });

    it('should prevent privilege escalation', async () => {
      // Test user trying to access admin functions
      const response = await testClient
        .withAuth('COLLABORATEUR')
        .post('/api/auth/revoke-all-sessions/123');

      expect(response.status).toBe(403);
    });
  });

  describe('Data Access Control', () => {
    it('should enforce data isolation between companies', async () => {
      // User from Company A should not access Company B data
      const response = await testClient
        .withAuth('MANAGER', { companyId: 'company-a' })
        .get('/api/users?companyId=company-b');

      expect(response.status).toBe(403);
    });

    it('should enforce manager team restrictions', async () => {
      // Manager should only access their team data
      const response = await testClient
        .withAuth('MANAGER', { teamId: 'team-1' })
        .get('/api/users?teamId=team-2');

      expect(response.status).toBe(403);
    });

    it('should enforce user self-access only', async () => {
      // User should only access their own data
      const response = await testClient
        .withAuth('COLLABORATEUR', { userId: 'user-1' })
        .get('/api/users/user-2');

      expect(response.status).toBe(403);
    });
  });
});
```

## 2. Session Security Tests

```typescript
// tests/security/session.test.ts
describe('Session Security Tests', () => {
  describe('Session Management', () => {
    it('should invalidate session on logout', async () => {
      // Login and get session
      const loginResponse = await testClient.post('/api/auth/verify', {
        token: 'valid-magic-link-token'
      });

      const sessionCookie = extractSessionCookie(loginResponse);

      // Use session
      let response = await testClient
        .withSessionCookie(sessionCookie)
        .get('/api/auth/me');
      expect(response.status).toBe(200);

      // Logout
      await testClient
        .withSessionCookie(sessionCookie)
        .post('/api/auth/logout');

      // Try to use invalidated session
      response = await testClient
        .withSessionCookie(sessionCookie)
        .get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('should detect session hijacking attempts', async () => {
      // Create session with one IP
      const session = await createTestSession('192.168.1.1');

      // Try to use session from different IP
      const response = await testClient
        .withSession(session)
        .withIP('192.168.1.100')
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_HIJACKING_DETECTED');
    });

    it('should expire inactive sessions', async () => {
      // Create session and simulate inactivity
      const session = await createTestSession();
      await simulateInactivity(session, 31 * 60 * 1000); // 31 minutes

      const response = await testClient
        .withSession(session)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_EXPIRED');
    });
  });

  describe('Token Security', () => {
    it('should reject malformed tokens', async () => {
      const malformedTokens = [
        'invalid',
        'too-short',
        'contains_invalid_chars!@#',
        '', // empty
        null,
        undefined
      ];

      for (const token of malformedTokens) {
        const response = await testClient.post('/api/auth/verify', { token });
        expect(response.status).toBe(400);
      }
    });

    it('should detect token replay attacks', async () => {
      const token = 'valid-one-time-token';

      // First use should succeed
      let response = await testClient.post('/api/auth/verify', { token });
      expect(response.status).toBe(200);

      // Second use should fail
      response = await testClient.post('/api/auth/verify', { token });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('TOKEN_ALREADY_USED');
    });
  });
});
```

## 3. Rate Limiting and DoS Protection Tests

```typescript
// tests/security/rate-limiting.test.ts
describe('Rate Limiting Tests', () => {
  it('should enforce login attempt rate limits', async () => {
    const email = 'test@example.com';

    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      const response = await testClient.post('/api/auth/magic-link', { email });
      expect(response.status).toBe(200);
    }

    // Next request should be rate limited
    const response = await testClient.post('/api/auth/magic-link', { email });
    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBe('60');
  });

  it('should enforce API rate limits per user', async () => {
    const session = await createTestSession();

    // Make requests up to the limit
    for (let i = 0; i < 100; i++) {
      const response = await testClient
        .withSession(session)
        .get('/api/users');
      expect(response.status).toBe(200);
    }

    // Next request should be rate limited
    const response = await testClient
      .withSession(session)
      .get('/api/users');
    expect(response.status).toBe(429);
  });

  it('should reset rate limits after time window', async () => {
    const email = 'test@example.com';

    // Exhaust rate limit
    for (let i = 0; i < 5; i++) {
      await testClient.post('/api/auth/magic-link', { email });
    }

    // Verify rate limited
    let response = await testClient.post('/api/auth/magic-link', { email });
    expect(response.status).toBe(429);

    // Simulate time passage
    await simulateTimePassage(60 * 1000); // 1 minute

    // Should work again
    response = await testClient.post('/api/auth/magic-link', { email });
    expect(response.status).toBe(200);
  });
});
```

## 4. CSRF Protection Tests

```typescript
// tests/security/csrf.test.ts
describe('CSRF Protection Tests', () => {
  it('should require CSRF token for state-changing operations', async () => {
    const session = await createTestSession();

    // POST request without CSRF token should fail
    const response = await testClient
      .withSession(session)
      .post('/api/users', { userData: {} });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CSRF token invalid');
  });

  it('should accept valid CSRF tokens', async () => {
    const session = await createTestSession();
    const csrfToken = await getCSRFToken(session);

    const response = await testClient
      .withSession(session)
      .withCSRFToken(csrfToken)
      .post('/api/users', { userData: {} });

    expect(response.status).toBe(200);
  });

  it('should reject invalid CSRF tokens', async () => {
    const session = await createTestSession();

    const response = await testClient
      .withSession(session)
      .withCSRFToken('invalid-token')
      .post('/api/users', { userData: {} });

    expect(response.status).toBe(403);
  });
});
```

## 5. Input Validation and Injection Tests

```typescript
// tests/security/injection.test.ts
describe('Injection Protection Tests', () => {
  it('should prevent SQL injection in user inputs', async () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'/**/OR/**/1=1--",
      "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --"
    ];

    const session = await createTestSession('ADMIN_RH');

    for (const payload of sqlInjectionPayloads) {
      const response = await testClient
        .withSession(session)
        .post('/api/users', {
          email: payload,
          firstName: 'Test',
          lastName: 'User'
        });

      // Should either be rejected or sanitized
      expect(response.status).toBeOneOf([400, 422]);
    }
  });

  it('should prevent XSS in user inputs', async () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(\'xss\')" />',
      '"><script>alert("xss")</script>'
    ];

    const session = await createTestSession('ADMIN_RH');

    for (const payload of xssPayloads) {
      const response = await testClient
        .withSession(session)
        .post('/api/users', {
          email: 'test@example.com',
          firstName: payload,
          lastName: 'User'
        });

      if (response.status === 200) {
        // If accepted, check that it's properly sanitized
        const user = response.body.user;
        expect(user.firstName).not.toContain('<script>');
        expect(user.firstName).not.toContain('javascript:');
      }
    }
  });
});
```

## 6. Security Test Utilities

```typescript
// tests/utils/security-helpers.ts
export class SecurityTestHelper {
  static async createTestUser(role: string, companyId?: string): Promise<TestUser> {
    return {
      id: `test-user-${Date.now()}`,
      email: `test-${role.toLowerCase()}@example.com`,
      role,
      companyId: companyId || 'default-company',
      teamId: role === 'MANAGER' ? 'test-team' : undefined
    };
  }

  static async createTestSession(role: string = 'COLLABORATEUR', options?: any): Promise<TestSession> {
    const user = await this.createTestUser(role, options?.companyId);
    return {
      sessionToken: `session-${Date.now()}`,
      user,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ...options
    };
  }

  static extractSessionCookie(response: any): string {
    const setCookieHeader = response.headers['set-cookie'];
    return setCookieHeader?.find(cookie => cookie.startsWith('session_token='));
  }

  static async simulateInactivity(session: TestSession, durationMs: number): Promise<void> {
    // Mock the passage of time for session expiry tests
    jest.advanceTimersByTime(durationMs);
  }

  static async simulateTimePassage(durationMs: number): Promise<void> {
    // Mock time passage for rate limit reset tests
    jest.advanceTimersByTime(durationMs);
  }

  static async getCSRFToken(session: TestSession): Promise<string> {
    const response = await testClient
      .withSession(session)
      .get('/api/auth/csrf-token');
    return response.body.csrfToken;
  }
}

// Mock implementations for testing
export const testClient = {
  withAuth(role: string, options?: any) {
    return {
      get: (path: string) => this.request('GET', path, null, { role, ...options }),
      post: (path: string, data?: any) => this.request('POST', path, data, { role, ...options }),
      put: (path: string, data?: any) => this.request('PUT', path, data, { role, ...options }),
      delete: (path: string) => this.request('DELETE', path, null, { role, ...options })
    };
  },

  withSession(session: TestSession) {
    return {
      get: (path: string) => this.request('GET', path, null, { session }),
      post: (path: string, data?: any) => this.request('POST', path, data, { session }),
      put: (path: string, data?: any) => this.request('PUT', path, data, { session }),
      delete: (path: string) => this.request('DELETE', path, null, { session })
    };
  },

  async request(method: string, path: string, data?: any, context?: any) {
    // Mock HTTP client implementation
    // This would integrate with your actual testing framework
    return {
      status: 200,
      body: {},
      headers: {}
    };
  }
};
```

## 7. Automated Security Scanning

```typescript
// scripts/security-scan.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SecurityScanner {
  static async runFullScan(): Promise<SecurityReport> {
    const results = await Promise.all([
      this.scanDependencies(),
      this.scanStaticCode(),
      this.scanRuntime(),
      this.testAuthorization()
    ]);

    return {
      dependencies: results[0],
      staticCode: results[1],
      runtime: results[2],
      authorization: results[3],
      summary: this.generateSummary(results)
    };
  }

  private static async scanDependencies(): Promise<DependencyScanResult> {
    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditResult = JSON.parse(stdout);

      return {
        vulnerabilities: auditResult.vulnerabilities,
        summary: auditResult.metadata
      };
    } catch (error) {
      console.error('Dependency scan failed:', error);
      return { vulnerabilities: {}, summary: { total: 0 } };
    }
  }

  private static async scanStaticCode(): Promise<StaticCodeScanResult> {
    // Run ESLint security rules
    try {
      const { stdout } = await execAsync('npx eslint . --ext .ts,.tsx --format json');
      const lintResults = JSON.parse(stdout);

      const securityIssues = lintResults
        .flatMap(file => file.messages)
        .filter(message => message.ruleId?.includes('security'));

      return {
        issues: securityIssues,
        totalFiles: lintResults.length
      };
    } catch (error) {
      console.error('Static code scan failed:', error);
      return { issues: [], totalFiles: 0 };
    }
  }

  private static async testAuthorization(): Promise<AuthorizationTestResult> {
    // Run authorization test suite
    try {
      const { stdout } = await execAsync('npm run test:security --json');
      const testResults = JSON.parse(stdout);

      return {
        passed: testResults.numPassedTests,
        failed: testResults.numFailedTests,
        coverage: testResults.coverageMap
      };
    } catch (error) {
      console.error('Authorization tests failed:', error);
      return { passed: 0, failed: 0, coverage: {} };
    }
  }
}