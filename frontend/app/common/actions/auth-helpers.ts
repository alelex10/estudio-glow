import { redirect } from "react-router";
import { getToken } from "../services/auth.server";

/**
 * Wrapper que extrae y valida el token de autenticación.
 * Si no hay token, redirige a /login.
 * 
 * @param request - Request de React Router
 * @returns Token JWT válido
 * @throws Redirect a /login si no hay token
 */
export async function requireAuth(request: Request): Promise<string> {
  const token = await getToken(request);
  
  if (!token) {
    throw redirect("/login");
  }
  
  return token;
}

/**
 * Verifica si el request tiene un token válido sin redirigir.
 * 
 * @param request - Request de React Router
 * @returns Token si existe, null en caso contrario
 */
export async function getOptionalAuth(request: Request): Promise<string | null> {
  return await getToken(request);
}
