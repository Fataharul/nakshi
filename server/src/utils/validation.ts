import { z } from 'zod';

// Public registration only permits BUYER, ARTIST, and ORGANIZER.
// ADMIN accounts cannot be created via public self-registration.
export const registerSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  role: z.enum(['BUYER', 'ARTIST', 'ORGANIZER']).default('BUYER'),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'New password must contain at least one letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
});

export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'New password must contain at least one letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID Token is required'),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

