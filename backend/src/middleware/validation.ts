import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";
import { ValidationError } from "../errors";

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      // Zod lanzará el error, que será capturado por el error handler
      next(error);
    }
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      Object.assign(req.query, validatedData);
      next();
    } catch (error) {
      // Zod lanzará el error, que será capturado por el error handler
      next(error);
    }
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      (req.params as any) = validatedData;
      next();
    } catch (error) {
      // Zod lanzará el error, que será capturado por el error handler
      next(error);
    }
  };
}
