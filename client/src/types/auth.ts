export type Role = 'BUYER' | 'ARTIST' | 'ORGANIZER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  bio?: string | null;
  avatarUrl?: string | null;
  walletBalance: number;
  createdAt: string;
  hasGoogleLinked?: boolean;
  isVerified?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: Role;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  email: string;
  message: string;
}

