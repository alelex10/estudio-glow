import { redirect } from "react-router";
import { getSession, commitSession, destroySession } from "./session-storage";
import { API_BASE_URL } from "../config/api-end-points";

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
    throw redirect("/auth/login");
  }

  return token;
}

/**
 * Crea la sesión con token y user, retorna headers Set-Cookie.
 */
export async function createAuthSession(
  request: Request,
  token: string,
  user: unknown
) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("token", token);
  session.set("user", user);

  return redirect("/admin", {
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

  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
