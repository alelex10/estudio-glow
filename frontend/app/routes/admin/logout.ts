import { redirect } from "react-router";
import { contextProvider, userContext } from "~/common/context/context";
import { API_BASE_URL, API_ENDPOINTS } from "~/common/config/api-end-points";

export async function action({ request }: { request: Request }) {
  try {
    // Llamar al endpoint de logout del backend para limpiar las cookies
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
      method: "POST",
      headers: {
        "Cookie": request.headers.get("Cookie") || "",
      },
      credentials: "include",
    });

    // Limpiar el contexto del usuario
    contextProvider.set(userContext, null);

    // Redirigir al login
    return redirect("/admin/login");
  } catch (error) {
    contextProvider.set(userContext, null);
    return redirect("/admin/login");
  }
}
