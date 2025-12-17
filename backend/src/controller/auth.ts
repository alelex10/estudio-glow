import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "../models/user";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { validateBody } from "../middleware/validation";
import {
  RegisterSchema,
  LoginSchema,
  AuthResponseSchema,
} from "../schemas/auth";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// ----------------------- REGISTER -----------------------
export const register = [
  validateBody(RegisterSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, role } = req.body;

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser.length > 0) {
        res
          .status(400)
          .json({ message: "User with email: " + email + " already exists" });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await db.insert(users).values({
        name,
        email,
        password_hash: passwordHash,
        role: role || "customer",
      });

      const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "1h" });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
      });

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

// ----------------------- LOGIN -----------------------
export const login = [
  validateBody(LoginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (userResult.length === 0) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }

      const user = userResult[0];

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        res.status(400).json({ message: "Invalid credentials" });
        return;
      }

      const token = jwt.sign(
        { id: user?.id, email: user?.email, role: user?.role },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
      });

      const responseDto = AuthResponseSchema.safeParse({
        message: "Login successful",
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
        },
      });

      if (!responseDto.success) {
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      res.status(200).json(responseDto.data);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

// ----------------------- LOGOUT -----------------------
export async function logout(req: Request, res: Response) {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
}
