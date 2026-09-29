import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { OAuth2Client } from 'google-auth-library';
import { app } from '../../src/server';
import { prisma } from '../../src/config/prisma';

describe('Auth & RBAC Acceptance Tests', () => {
  let serverInstance: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Start test server on dynamic open port
    await new Promise<void>((resolve) => {
      serverInstance = app.listen(0, () => {
        const address = serverInstance.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => {
        serverInstance.close(() => resolve());
      });
    }
  });

  const uniqueId = Date.now();
  const testBuyer = {
    email: `buyer_${uniqueId}@nakshi.test`,
    password: 'Password123!',
    name: 'Acceptance Buyer',
    role: 'BUYER',
  };

  describe('POST /api/auth/register', () => {
    it('successfully registers a user, hashes password, initializes wallet at 0.0 balance, and returns JWT', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBuyer),
      });

      expect(res.status).toBe(201);
      const data = (await res.json()) as any;

      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testBuyer.email);
      expect(data.user.name).toBe(testBuyer.name);
      expect(data.user.role).toBe('BUYER');
      expect(data.user.walletBalance).toBe(0);
      expect(data.user.passwordHash).toBeUndefined(); // Security: never expose hash

      // Verify wallet persisted in database
      const dbWallet = await prisma.wallet.findUnique({
        where: { userId: data.user.id },
      });
      expect(dbWallet).toBeDefined();
      expect(Number(dbWallet?.balance)).toBe(0);
    });

    it('rejects duplicate registration with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBuyer),
      });

      expect(res.status).toBe(409);
      const data = (await res.json()) as any;
      expect(data.error).toBe('An account with this email already exists');
    });

    it('rejects invalid inputs with 400 Bad Request and validation details', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email',
          password: 'short',
          name: '',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
    });

    it('rejects public self-registration with ADMIN role (privilege escalation prevention)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `attacker_${Date.now()}@nakshi.test`,
          password: 'Password123!',
          name: 'Attacker Admin',
          role: 'ADMIN',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Validation failed');
      expect(data.details.role).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('successfully logs in with valid credentials and returns token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testBuyer.email,
          password: testBuyer.password,
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe(testBuyer.email);
      expect(data.user.walletBalance).toBe(0);
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('rejects invalid password with generic 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testBuyer.email,
          password: 'WrongPassword999!',
        }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Invalid email or password');
    });

    it('rejects non-existent email with generic 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent_user_999@nakshi.test',
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/google', () => {
    const mockGoogleSub = `google_oauth_sub_${Date.now()}`;
    const mockGoogleEmail = `google_user_${Date.now()}@nakshi.test`;

    beforeAll(() => {
      vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockImplementation(async (options: any) => {
        if (options.idToken === 'valid-google-id-token') {
          return {
            getPayload: () => ({
              email: mockGoogleEmail,
              name: 'Google Test Artisan',
              sub: mockGoogleSub,
              picture: 'https://lh3.googleusercontent.com/a/test-avatar',
            }),
          } as any;
        }
        if (options.idToken === 'valid-google-id-token-artist') {
          return {
            getPayload: () => ({
              email: `artist_${mockGoogleEmail}`,
              name: 'Google Artist New',
              sub: `sub_artist_${mockGoogleSub}`,
              picture: 'https://lh3.googleusercontent.com/a/artist-avatar',
            }),
          } as any;
        }
        throw new Error('Google token invalid');
      });
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('rejects missing or empty idToken with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Validation failed');
    });

    it('rejects invalid or forged idToken with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'forged_fake_token' }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Google authentication failed');
    });

    it('successfully registers and authenticates new user via Google, initializing wallet at 0 balance', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-google-id-token' }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(mockGoogleEmail);
      expect(data.user.name).toBe('Google Test Artisan');
      expect(data.user.role).toBe('BUYER');
      expect(data.user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/test-avatar');
      expect(data.user.walletBalance).toBe(0);

      // Verify DB record
      const dbUser = await prisma.user.findUnique({
        where: { email: mockGoogleEmail },
        include: { wallet: true },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser?.googleId).toBe(mockGoogleSub);
      expect(dbUser?.passwordHash).toBeNull();
      expect(dbUser?.isVerified).toBe(true);
      expect(dbUser?.wallet?.balance).toBeDefined();
    });

    it('subsequent Google sign-in returns authenticated user and existing wallet', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'valid-google-id-token' }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe(mockGoogleEmail);
    });

    it('rejects standard password login for Google OAuth-created account with clear guidance', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: mockGoogleEmail,
          password: 'AnyPassword123!',
        }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Please sign in using Google');
    });

    it('successfully registers new user with specific role (e.g. ARTIST) via Google OAuth', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: 'valid-google-id-token-artist',
          role: 'ARTIST',
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user.role).toBe('ARTIST');
      expect(data.user.email).toBe(`artist_${mockGoogleEmail}`);
    });

    it('rejects forbidden role (ADMIN) during Google registration with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken: 'valid-google-id-token',
          role: 'ADMIN',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('Protected Endpoints & RBAC Guards', () => {
    let buyerToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // Login as test buyer
      const buyerLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testBuyer.email,
          password: testBuyer.password,
        }),
      });
      const buyerData = (await buyerLogin.json()) as any;
      buyerToken = buyerData.token;

      // Login as admin seeded user
      const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@nakshi.test',
          password: 'Password123!',
        }),
      });
      const adminData = (await adminLogin.json()) as any;
      adminToken = adminData.token;
    });

    it('GET /api/auth/me returns user profile when authenticated', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user.email).toBe(testBuyer.email);
      expect(data.user.walletBalance).toBe(0);
    });

    it('GET /api/auth/me rejects request without authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`);
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/admin-test rejects BUYER role with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/auth/admin-test`, {
        headers: { Authorization: `Bearer ${buyerToken}` },
      });

      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Forbidden');
    });

    it('GET /api/auth/admin-test grants access to ADMIN role with 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/auth/admin-test`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toBe('Admin access granted');
      expect(data.user.role).toBe('ADMIN');
    });
  });

  describe('Password Reset Verification Flow', () => {
    let resetToken: string;

    it('POST /api/auth/forgot-password generates a secure reset token for registered email', async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testBuyer.email }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toBeDefined();
      expect(data.resetToken).toBeDefined();
      resetToken = data.resetToken;
    });

    it('POST /api/auth/reset-password resets the password with valid token', async () => {
      const newPassword = 'BrandNewPassword123!';
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.message).toContain('successfully reset');

      // Verify user can log in with new password
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testBuyer.email,
          password: newPassword,
        }),
      });
      expect(loginRes.status).toBe(200);
    });

    it('POST /api/auth/reset-password rejects used or invalid token with 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid_or_already_used_token',
          newPassword: 'Password123!',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      expect(data.error).toContain('Invalid or expired');
    });
  });
});
