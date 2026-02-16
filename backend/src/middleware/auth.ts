import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { AuthenticationError, AuthorizationError } from "../errors";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  id: string;
  email: string;
  role: string; 
  iat?: number;
  exp?: number;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  
  let token = req.cookies?.token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); 
    }
  }

  if (!token) {
    throw new AuthenticationError("Token de autenticación faltante");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = { id: payload.id, email: payload.email, role: payload.role };
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
