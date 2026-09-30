import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../services/auth.service';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors: Record<string, string> = {};
    err.errors.forEach((issue) => {
      const field = issue.path.join('.') || 'root';
      formattedErrors[field] = issue.message;
    });

    res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors,
      message: err.errors[0]?.message || 'Invalid input data',
    });
    return;
  }

  // Handle known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Handle unexpected errors (never leak stack trace or internal database details)
  console.error('[Internal Server Error]', err);
  res.status(500).json({
    error: 'An internal server error occurred. Please try again later.',
  });
};
