import { userContextProvider, userContext } from "~/common/context/context";
import { redirect, type ActionFunctionArgs } from "react-router";
import { API_BASE_URL, API_ENDPOINTS } from "~/common/config/api";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  let token = null;

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Importante para cookies
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al iniciar sesión");
  }

  const res = await response.json();

  userContextProvider.set(userContext, res.user);

  token = response.headers.get("set-cookie");
  if (!token) throw new Error("Error al iniciar sesión");

  const responseAction = redirect("/admin");
  responseAction.headers.set("set-cookie", token);

  return responseAction;
}
