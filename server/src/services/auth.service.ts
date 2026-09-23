import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Role, User } from '@prisma/client';
import { prisma } from '../config/prisma';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../utils/validation';

export interface SanitizedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  bio: string | null;
  avatarUrl: string | null;
  walletBalance: number;
  createdAt: Date;
}

export interface AuthResult {
  user: SanitizedUser;
  token: string;
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private static googleClient = new OAuth2Client(AuthService.GOOGLE_CLIENT_ID);


  // In-memory token store for secure password reset verification flow
  private static resetTokens = new Map<string, { email: string; expires: number }>();

  private static sanitizeUser(user: User, walletBalance: number = 0): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      walletBalance: Number(walletBalance),
      createdAt: user.createdAt,
    };
  }

  public static generateToken(payload: { id: string; email: string; role: Role; name: string }): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  public static verifyToken(token: string): { id: string; email: string; role: Role; name: string } {
    return jwt.verify(token, this.JWT_SECRET) as {
      id: string;
      email: string;
      role: Role;
      name: string;
    };
  }

  public static async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, this.SALT_ROUNDS);

    // Atomic transaction: create User AND initialize Wallet with 0.0 balance
    const { user, wallet } = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: input.role,
          bio: input.bio || null,
          avatarUrl: input.avatarUrl || null,
        },
      });

      const newWallet = await tx.wallet.create({
        data: {
          userId: newUser.id,
          balance: 0.0,
        },
      });

      return { user: newUser, wallet: newWallet };
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.sanitizeUser(user, Number(wallet.balance)),
      token,
    };
  }

  public static async googleAuth(idToken: string): Promise<AuthResult> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email || !payload.name) {
        throw new AppError('Invalid Google token payload', 400);
      }

      const { email, name, sub: googleId, picture: avatarUrl } = payload;

      let user = await prisma.user.findUnique({
        where: { email },
        include: { wallet: true },
      });

      let walletBalance = 0;

      if (user) {
        const updateData: any = { isVerified: true };
        if (!user.googleId) updateData.googleId = googleId;
        if (!user.avatarUrl && avatarUrl) updateData.avatarUrl = avatarUrl;

        if (Object.keys(updateData).length > 1 || updateData.isVerified) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
            include: { wallet: true },
          });
        }

        walletBalance = user.wallet ? Number(user.wallet.balance) : 0;
      } else {
        const result = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              name,
              googleId,
              avatarUrl,
              isVerified: true,
              role: 'BUYER',
            },
          });

          const newWallet = await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return { user: newUser, wallet: newWallet };
        });

        user = { ...result.user, wallet: result.wallet } as User & { wallet: any };
        walletBalance = 0;
      }

      const token = this.generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });

      return {
        user: this.sanitizeUser(user, walletBalance),
        token,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Google authentication failed', 401);
    }
  }

  public static async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { wallet: true },
    });

    // Sanitized generic error message to prevent account enumeration
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.passwordHash) {
      throw new AppError('Please sign in using Google. This account was authenticated through OAuth.', 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // Ensure wallet exists even for legacy or test users
    let walletBalance = 0;
    if (user.wallet) {
      walletBalance = Number(user.wallet.balance);
    } else {
      const createdWallet = await prisma.wallet.create({
        data: { userId: user.id, balance: 0.0 },
      });
      walletBalance = Number(createdWallet.balance);
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: this.sanitizeUser(user, walletBalance),
      token,
    };
  }

  public static async getMe(userId: string): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let walletBalance = 0;
    if (user.wallet) {
      walletBalance = Number(user.wallet.balance);
    } else {
      const newWallet = await prisma.wallet.create({
        data: { userId: user.id, balance: 0.0 },
      });
      walletBalance = Number(newWallet.balance);
    }

    return this.sanitizeUser(user, walletBalance);
  }

  public static async updateProfile(userId: string, input: UpdateProfileInput): Promise<SanitizedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let passwordHash = user.passwordHash;
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new AppError('Current password is required to set a new password', 400);
      }
      if (!user.passwordHash) {
        throw new AppError('Cannot update password for an account created via Google', 400);
      }
      const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Current password is incorrect', 400);
      }
      passwordHash = await bcrypt.hash(input.newPassword, this.SALT_ROUNDS);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.bio !== undefined && { bio: input.bio }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        passwordHash,
      },
      include: { wallet: true },
    });

    return this.sanitizeUser(updatedUser, Number(updatedUser.wallet?.balance ?? 0));
  }

  public static async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; resetToken?: string }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Generate secure random reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour expiration

    if (user) {
      this.resetTokens.set(token, { email: user.email, expires });
    }

    // Always return success message to prevent user enumeration
    return {
      message: 'If an account with that email exists, password reset instructions have been generated.',
      ...(process.env.NODE_ENV !== 'production' || !process.env.SMTP_HOST ? { resetToken: token } : {}),
    };
  }

  public static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const record = this.resetTokens.get(input.token);

    if (!record || record.expires < Date.now()) {
      if (record) this.resetTokens.delete(input.token);
      throw new AppError('Invalid or expired password reset token.', 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: record.email },
    });

    if (!user) {
      this.resetTokens.delete(input.token);
      throw new AppError('User not found.', 404);
    }

    const passwordHash = await bcrypt.hash(input.newPassword, this.SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    this.resetTokens.delete(input.token);

    return { message: 'Password has been successfully reset. You may now sign in with your new password.' };
  }
}
