import type { ActionFunctionArgs } from "react-router";
import { createAuthSession } from "~/common/services/auth.server";
import { serverLogin } from "~/common/services/auth-api.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const response = await serverLogin(email, password);

  return createAuthSession(request, response.token, response.user);
}
