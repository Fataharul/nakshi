import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../../src/services/email.service';

describe('EmailService Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generatePasswordResetHtml', () => {
    it('generates rich branded HTML email containing reset link, token, and branding', () => {
      const resetLink = 'http://localhost:5173/login?resetToken=test_token_12345';
      const resetToken = 'test_token_12345';

      const html = EmailService.generatePasswordResetHtml(resetLink, resetToken);

      expect(html).toContain('Nakshi');
      expect(html).toContain('Password Reset Request');
      expect(html).toContain(resetLink);
      expect(html).toContain(resetToken);
      expect(html).toContain('1 hour');
      expect(html).toContain('#86452a'); // Terracotta primary brand color
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('returns simulated success result when no API key is set', async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      const result = await EmailService.sendPasswordResetEmail('user@nakshi.test', 'sample_token');
      expect(result.success).toBe(true);

      process.env.RESEND_API_KEY = originalKey;
    });

    it('attempts sending email and handles errors gracefully', async () => {
      const result = await EmailService.sendPasswordResetEmail('invalid-recipient', 'sample_token');
      expect(typeof result.success).toBe('boolean');
    });
  });
});
