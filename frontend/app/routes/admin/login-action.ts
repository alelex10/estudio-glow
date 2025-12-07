import { authService } from "~/common/services/authService";
import {
  userContextProvider,
  userContext,
  tokenContextProvider,
  tokenContext,
} from "~/common/context";
import { redirect, type ActionFunctionArgs } from "react-router";
import { API_BASE_URL, API_ENDPOINTS } from "~/common/config/api";

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  // const email = formData.get("email") as string;
  // const password = formData.get("password") as string;

  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Importante para cookies
    body: JSON.stringify(formData),
  });
  tokenContextProvider.set(tokenContext, response.headers.get("set-cookie"));

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al iniciar sesión");
  }

  const res = await response.json();
  console.log(res);

  userContextProvider.set(userContext, res.user);
  context.set(tokenContext, response.headers.get("set-cookie"));
  // console.log(contextProvider.get(userContext))

  // return redirect("/admin");
}
