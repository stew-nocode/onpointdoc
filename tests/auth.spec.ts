import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

describe('Auth Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Public paths', () => {
    it('should allow access to /auth/login', () => {
      const req = new NextRequest('http://localhost:3000/auth/login');
      const res = middleware(req);
      expect(res.headers.get('x-mw')).toBe('public');
      expect(res.status).toBe(200);
    });

    it('should allow access to /api routes', () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const res = middleware(req);
      expect(res.headers.get('x-mw')).toBe('public');
    });

    it('should allow access to static assets', () => {
      const req = new NextRequest('http://localhost:3000/_next/static/test.js');
      const res = middleware(req);
      expect(res.headers.get('x-mw')).toBe('public');
    });
  });

  describe('Protected paths', () => {
    it('should redirect to login when no auth cookie', () => {
      const req = new NextRequest('http://localhost:3000/gestion/tickets');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('x-mw')).toBe('redirect-login');
      const location = res.headers.get('location');
      expect(location).toContain('/auth/login');
      expect(location).toContain('next=');
    });

    it('should preserve query params in redirect', () => {
      const req = new NextRequest('http://localhost:3000/gestion/tickets?type=BUG');
      const res = middleware(req);
      const location = res.headers.get('location');
      expect(location).toContain('next=');
      // Les query params sont encodés dans le paramètre next
      expect(location).toContain(encodeURIComponent('type=BUG'));
    });

    it('should allow access with sb-access-token cookie', () => {
      const req = new NextRequest('http://localhost:3000/gestion/tickets', {
        headers: {
          cookie: 'sb-access-token=test-token'
        }
      });
      const res = middleware(req);
      expect(res.headers.get('x-mw')).toBe('auth-ok');
      expect(res.status).toBe(200);
    });

    it('should allow access with sb-refresh-token cookie', () => {
      const req = new NextRequest('http://localhost:3000/gestion/tickets', {
        headers: {
          cookie: 'sb-refresh-token=test-token'
        }
      });
      const res = middleware(req);
      expect(res.headers.get('x-mw')).toBe('auth-ok');
    });

    it('should allow access with project-specific auth token', () => {
      const req = new NextRequest('http://localhost:3000/gestion/tickets', {
        headers: {
          cookie: 'sb-project123-auth-token=test-token'
        }
      });
      const res = middleware(req);
      expect(res.headers.get('x-mw')).toBe('auth-ok');
    });
  });
});

describe('Auth Validation', () => {
  it('should validate email format', () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
    const invalidEmails = ['invalid', '@domain.com', 'user@', 'user@domain'];

    validEmails.forEach((email) => {
      expect(() => {
        // Simuler validation email basique
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('Invalid email');
        }
      }).not.toThrow();
    });

    invalidEmails.forEach((email) => {
      expect(() => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error('Invalid email');
        }
      }).toThrow();
    });
  });

  it('should require password minimum length', () => {
    const validPassword = 'password123';
    const invalidPassword = 'short';

    expect(validPassword.length).toBeGreaterThanOrEqual(6);
    expect(invalidPassword.length).toBeLessThan(6);
  });
});

