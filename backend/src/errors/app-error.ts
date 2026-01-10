/**
 * Clase base para todos los errores de aplicación
 *
 * Esta clase extiende el Error nativo de JavaScript y añade propiedades
 * específicas para el manejo de errores HTTP en Express
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Mantiene el stack trace correcto en V8
    Error.captureStackTrace(this, this.constructor);

    // Asegura que instanceof funcione correctamente
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
