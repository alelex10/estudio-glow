// src/middleware/auth.ts
// JWT authentication and role-based authorization middleware

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticationError, AuthorizationError } from "../errors";

dotenv.config();

// Expect JWT secret in environment variable
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Types for decoded token payload
interface JwtPayload {
  userId: string;
  role: string; // e.g., "admin" or "user"
  iat?: number;
  exp?: number;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  
  // Primero intentar obtener token de las cookies
  let token = req.cookies?.token;
  
  // Si no hay token en cookies, intentar obtener del header Authorization
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remover 'Bearer ' del inicio
    }
  }

  if (!token) {
    throw new AuthenticationError("Token de autenticación faltante");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // Attach user info to request for downstream handlers
    (req as any).user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    throw new AuthenticationError("Token inválido o expirado");
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;

  if (!user || user.role !== "admin") {
    throw new AuthorizationError("Se requieren privilegios de administrador");
  }

  next();
}

export function requireCustomer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  if (!user || user.role !== "customer") {
    throw new AuthorizationError("Se requieren privilegios de cliente");
  }

  next();
}
