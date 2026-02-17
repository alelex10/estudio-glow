import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { API_BASE_URL } from "~/common/config/api-end-points";
import { contextProvider, userContext, tokenContext } from "~/common/context/context";
import { authService } from "~/common/services/authService";
import type { LoginResponse } from "~/common/types/response";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    const response = await authService.login({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });


    if (!response.ok) {
      const error = await response.json();
      return { error: error.message || "Error al iniciar sesión" };
    }

    const data: LoginResponse = await response.json();
    
    contextProvider.set(userContext, data.user);
    

    return redirect("/admin", { headers: response.headers });
  } catch (error) {
    return { error: "Error de conexión con el servidor" };
  }
}
