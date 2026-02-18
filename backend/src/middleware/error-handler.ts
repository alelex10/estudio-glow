import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";
import { ZodError } from "zod";

/**
 * Interface para la respuesta de error estandarizada
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Middleware para logging de errores
 *
 * Registra todos los errores en la consola con información detallada.
 * En desarrollo, incluye el stack trace completo.
 */
export function logErrors(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === "production";

  console.error("❌ Error capturado:");
  console.error({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    errorName: err.name,
    errorMessage: err.message,
    ...(err instanceof AppError && { errorCode: err.code }),
    ...(err instanceof AppError && { statusCode: err.statusCode }),
  });

  if (!isProduction && err.stack) {
    console.error("Stack trace:");
    console.error(err.stack);
  }

  // Pasar al siguiente middleware de error
  next(err);
}

/**
 * Middleware para manejar errores en clientes API/XHR
 *
 * Formatea errores como JSON con estructura consistente.
 * Maneja casos especiales como errores de Zod.
 */
export function clientErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Si ya se enviaron headers, delegar al error handler por defecto
  if (res.headersSent) {
    next(err);
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Manejo de errores de AppError
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Manejo de errores de validación de Zod
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Error de validación",
        details: err.issues.map((e: any) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
    };

    res.status(400).json(response);
    return;
  }

  // Pasar errores no manejados al siguiente middleware
  next(err);
}

/**
 * Middleware catch-all para manejo de errores
 *
 * Este es el último middleware en la cadena de manejo de errores.
 * Maneja cualquier error que no haya sido procesado por los middleware anteriores.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Si ya se enviaron headers, delegar al error handler por defecto de Express
  if (res.headersSent) {
    next(err);
    return;
  }

  const isProduction = process.env.NODE_ENV === "production";

  // Error genérico del servidor
  const response: ErrorResponse = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction
        ? "Ocurrió un error en el servidor"
        : err.message || "Error interno del servidor",
    },
  };

  res.status(500).json(response);
}
