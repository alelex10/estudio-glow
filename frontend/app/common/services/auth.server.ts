import { redirect } from "react-router";
import { getSession, commitSession, destroySession } from "./session-storage";
import type { User } from "../types/user-types";

/**
 * Extrae el token JWT de la sesión cookie del request.
 * Retorna null si no hay token.
 */
export async function getToken(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("token") || null;
}

/**
 * Valida que el usuario esté autenticado.
 * Si no hay token, redirige a /auth/login.
 * Retorna el token JWT limpio.
 */
export async function requireAuth(request: Request): Promise<string> {
  const token = await getToken(request);

  if (!token) {
    throw redirect("/login");
  }

  return token;
}

export async function isAuthenticated(request: Request): Promise<boolean> {
  const token = await getToken(request);
  return !!token;
}

export async function getUserRole(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("role") || null;
}

export async function getUser(request: Request): Promise<User | null> {
  const session = await getSession(request.headers.get("Cookie"));
  return session.get("user") || null;
}

/**
 * Crea la sesión con token y user, retorna headers Set-Cookie.
 */
export async function createAuthSession(
  request: Request,
  token: string,
  user: User,
  redirectPath: string = "/admin"
) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("token", token);
  session.set("user", user);
  session.set("role", user.role);

  return redirect(redirectPath, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

/**
 * Destruye la sesión y redirige a login.
 */
export async function destroyAuthSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
