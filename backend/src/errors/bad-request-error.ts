import { AppError } from "./app-error";

/**
 * Error para solicitudes incorrectas
 * HTTP Status: 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Solicitud incorrecta") {
    super(message, 400, "BAD_REQUEST");
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
