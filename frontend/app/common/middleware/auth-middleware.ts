import type { User } from "../types";
import { userContext } from "../context/user-context";

export async function authMiddleware({ context, request }: { context: any, request: Request }) {
  // Intentar obtener el usuario desde las cookies primero
  const cookieHeader = request.headers.get("Cookie");

    console.log("middleware called", cookieHeader);

  let user: User | null = null;

  if (cookieHeader) {
    // Buscar cookie de usuario
    const userCookie = cookieHeader
      .split(";")
      .find((cookie: string) => cookie.trim().startsWith("admin_user="));
    
    if (userCookie) {
      try {
        const userStr = decodeURIComponent(userCookie.split("=")[1]);
        user = JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user cookie:", error);
      }
    }
  }

  // Establecer el contexto con el usuario encontrado o null
  context.set(userContext, user);
}
