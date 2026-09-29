import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { AuthService } from '../../src/services/auth.service';
import { registerSchema, loginSchema, googleAuthSchema } from '../../src/utils/validation';

describe('AuthService & Validation Unit Tests', () => {
  describe('Password Hashing (bcrypt)', () => {
    it('generates secure hash and verifies matching plaintext password', async () => {
      const password = 'TestSecretPassword123!';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true);

      const isMatch = await bcrypt.compare(password, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare('WrongPassword456!', hash);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('JWT Token Handling', () => {
    it('generates a valid token and successfully verifies token payload', () => {
      const payload = {
        id: 'usr-12345-abcde',
        email: 'test@nakshi.test',
        role: 'BUYER' as const,
        name: 'Test Buyer',
      };

      const token = AuthService.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = AuthService.verifyToken(token);
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.name).toBe(payload.name);
    });

    it('rejects an invalid or tampered JWT token', () => {
      expect(() => {
        AuthService.verifyToken('invalid.tampered.token');
      }).toThrow();
    });
  });

  describe('Zod Validation Schemas', () => {
    it('accepts valid registration input', () => {
      const validData = {
        email: 'artisan@nakshi.test',
        password: 'ValidPassword123!',
        name: 'Jamdani Master',
        role: 'ARTIST' as const,
        bio: 'Crafting fine textiles',
      };

      const parsed = registerSchema.parse(validData);
      expect(parsed.email).toBe('artisan@nakshi.test');
      expect(parsed.role).toBe('ARTIST');
    });

    it('rejects invalid email formats', () => {
      const result = registerSchema.safeParse({
        email: 'invalid-email-address',
        password: 'ValidPassword123!',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('email');
      }
    });

    it('rejects passwords shorter than 8 characters or lacking required character classes', () => {
      // Too short
      const shortResult = registerSchema.safeParse({
        email: 'short@nakshi.test',
        password: 'Pass1',
        name: 'Short Pass',
      });
      expect(shortResult.success).toBe(false);

      // Only numbers
      const noLetters = registerSchema.safeParse({
        email: 'numbers@nakshi.test',
        password: '1234567890',
        name: 'Only Numbers',
      });
      expect(noLetters.success).toBe(false);

      // Only letters
      const noNumbers = registerSchema.safeParse({
        email: 'letters@nakshi.test',
        password: 'OnlyLettersPassword',
        name: 'Only Letters',
      });
      expect(noNumbers.success).toBe(false);
    });

    it('validates login input correctly', () => {
      const valid = loginSchema.safeParse({
        email: 'buyer@nakshi.test',
        password: 'Password123!',
      });
      expect(valid.success).toBe(true);

      const invalid = loginSchema.safeParse({
        email: 'invalid-email',
        password: '',
      });
      expect(invalid.success).toBe(false);
    });

    it('validates googleAuthSchema correctly', () => {
      const valid = googleAuthSchema.safeParse({
        idToken: 'valid.google.id.token.signature',
      });
      expect(valid.success).toBe(true);

      const validWithRole = googleAuthSchema.safeParse({
        idToken: 'valid.google.id.token.signature',
        role: 'ARTIST',
      });
      expect(validWithRole.success).toBe(true);

      const invalidRole = googleAuthSchema.safeParse({
        idToken: 'valid.google.id.token.signature',
        role: 'ADMIN',
      });
      expect(invalidRole.success).toBe(false);

      const missingToken = googleAuthSchema.safeParse({});
      expect(missingToken.success).toBe(false);

      const emptyToken = googleAuthSchema.safeParse({ idToken: '' });
      expect(emptyToken.success).toBe(false);
    });
  });
});
