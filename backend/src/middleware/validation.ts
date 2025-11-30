import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        const validationErrors = (error as any).issues.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));
        return res.status(400).json({
          message: 'Validation error',
          errors: validationErrors
        });
      }
      return res.status(400).json({
        message: 'Invalid request data'
      });
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        const validationErrors = (error as any).issues.map((issue: any) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));
        return res.status(400).json({
          message: 'Validation error',
          errors: validationErrors
        });
      }
      return res.status(400).json({
        message: 'Invalid query parameters'
      });
    }
  };
}
