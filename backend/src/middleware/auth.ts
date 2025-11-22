// src/middleware/auth.ts
// JWT authentication and role-based authorization middleware

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    // Attach user info to request for downstream handlers
    (req as any).user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
}
