import { Resend } from 'resend';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static resendClient: Resend | null = null;

  private static getClient(): Resend | null {
    if (!this.resendClient && process.env.RESEND_API_KEY) {
      this.resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return this.resendClient;
  }

  /**
   * Generates a beautifully formatted responsive HTML email adhering to Nakshi's DESIGN.md tokens
   */
  public static generatePasswordResetHtml(resetLink: string, resetToken: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Nakshi Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fbf9f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1b1c19; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fbf9f4; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e4e2dd; overflow: hidden; box-shadow: 0 4px 20px rgba(27, 28, 25, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #86452a; padding: 32px 36px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 0.02em;">
                Nakshi
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #fff1ec; opacity: 0.9;">
                Heritage Craft Marketplace & Auctions
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h2 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 20px; font-weight: 600; color: #1b1c19;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #53433d;">
                We received a request to reset the password associated with your Nakshi account. You can complete the reset using the secure link below or by copying your verification token.
              </p>

              <!-- One-Click Primary Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center" style="border-radius: 4px; background-color: #86452a;">
                    <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 13px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.08em;">
                      Reset Your Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Token Display Box -->
              <div style="background-color: #f5f3ee; border: 1px solid #e4e2dd; border-radius: 6px; padding: 16px; margin: 24px 0;">
                <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #86452a; margin-bottom: 8px;">
                  Verification Token (Alternative)
                </span>
                <code style="display: block; font-family: 'Courier New', Courier, monospace; font-size: 13px; word-break: break-all; color: #1b1c19; background-color: #ffffff; border: 1px solid #d9c2ba; padding: 10px; border-radius: 4px;">
                  ${resetToken}
                </code>
                <span style="display: block; font-size: 11px; color: #53433d; margin-top: 8px;">
                  If using the 3-step verification modal, paste this token directly into Step 2.
                </span>
              </div>

              <!-- Security Information -->
              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #86736c; border-top: 1px solid #f0eee9; padding-top: 16px;">
                <strong>Security Notice:</strong> This reset token and link expire in <strong>1 hour</strong>. If you did not initiate this request, no action is needed and your account remains secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0eee9; padding: 20px 36px; text-align: center; border-top: 1px solid #e4e2dd;">
              <p style="margin: 0; font-size: 11px; color: #86736c;">
                &copy; ${new Date().getFullYear()} Nakshi. Handcrafted Heritage & Living Art.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Dispatches a password reset email via Resend
   */
  public static async sendPasswordResetEmail(to: string, resetToken: string): Promise<SendEmailResult> {
    const client = this.getClient();
    const fromAddress = process.env.EMAIL_FROM || 'Nakshi Gallery <onboarding@resend.dev>';
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientBaseUrl}/login?resetToken=${encodeURIComponent(resetToken)}`;

    // If no client configured or running in test mode without explicit override, return mock result
    if (!client) {
      console.warn('[EmailService] RESEND_API_KEY is not configured. Email delivery simulated.');
      return { success: true, messageId: 'simulated_no_api_key' };
    }

    try {
      const htmlContent = this.generatePasswordResetHtml(resetLink, resetToken);

      const response = await client.emails.send({
        from: fromAddress,
        to: [to],
        subject: 'Reset Your Nakshi Account Password',
        html: htmlContent,
      });

      if (response.error) {
        console.error('[EmailService] Resend returned an error:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      console.log(`[EmailService] Password reset email sent successfully to ${to}. Message ID: ${response.data?.id}`);
      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      console.error('[EmailService] Failed to send password reset email via Resend:', error);
      return {
        success: false,
        error: error.message || 'Unknown email transmission error',
      };
    }
  }
}
