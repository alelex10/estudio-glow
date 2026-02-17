import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { API_BASE_URL } from "~/common/config/api-end-points";
import { contextProvider, userContext, tokenContext } from "~/common/context/context";
import type { LoginResponse } from "~/common/types/response";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    const setCookie = response.headers.get("Set-Cookie");

    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Error al iniciar sesión" };
    }

    if (!setCookie) {
      return { error: "No se recibió la sesión del servidor" };
    }

    const data: LoginResponse = await response.json();
    
    const tokenMatch = setCookie.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    contextProvider.set(userContext, data.user);
    if (token) {
      contextProvider.set(tokenContext, token);
    }

    return redirect("/admin", {
      headers: new Headers({
        "Set-Cookie": setCookie,
      }),
    });
  } catch (error) {
    return { error: "Error de conexión con el servidor" };
  }
}
