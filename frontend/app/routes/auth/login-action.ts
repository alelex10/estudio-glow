import type { ActionFunctionArgs } from "react-router";
import { authService } from "~/common/services/authService";
import { authFetch, createAuthSession } from "~/common/services/auth.server";
import type { LoginResponse } from "~/common/types/response";
import { apiClient } from "~/common/config/api-client";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const response = await apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: formData.get("email"),
      password: formData.get("password"),
    }),
  })

  return createAuthSession(request, response.token, response.user);
}
