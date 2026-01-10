import type { Request, Response, NextFunction } from "express";
import type { z } from "zod";

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      return handleValidationError(error, res);
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
      return handleValidationError(error, res);
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
      return handleValidationError(error, res);
    }
  };
}

function handleValidationError(error: unknown, res: Response) {
  if (error instanceof Error && "issues" in error) {
    const validationErrors = (error as any).issues.map((issue: any) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return res.status(400).json({
      message: "Validation error",
      errors: validationErrors,
    });
  }
  return res.status(400).json({
    message: error instanceof Error ? error.message : String(error),
  });
}
