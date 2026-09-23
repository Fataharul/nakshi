import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../utils/validation';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await AuthService.register(validatedData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async google(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = googleAuthSchema.parse(req.body);
      const result = await AuthService.googleAuth(validatedData.idToken);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getMe(userId);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const validatedData = updateProfileSchema.parse(req.body);
      const user = await AuthService.updateProfile(userId, validatedData);
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.forgotPassword(validatedData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(validatedData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async adminTest(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      message: 'Admin access granted',
      user: req.user,
    });
  }
}
