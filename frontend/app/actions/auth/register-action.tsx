import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { createAuthSession } from "~/common/services/auth.server";
import { serverRegister } from "~/common/services/authApi.server";
import { ROUTES } from "~/common/constants/routes";
import { parseFormData } from "~/common/actions/form-helpers";
import { handleAuthActionError } from "~/common/actions/error-helpers";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();

    const data = parseFormData<RegisterFormData>(formData, {
      name: (v) => String(v),
      email: (v) => String(v),
      password: (v) => String(v),
    });

    const response = await serverRegister(data.name, data.email, data.password);

    // F1.3: Backend returns pending_verification when email gate is active — NO session set (F1.1)
    if ("status" in response) {
      const params = new URLSearchParams({ email: response.email });
      return redirect(`${ROUTES.AUTH.CHECK_EMAIL}?${params.toString()}`);
    }

    // Legacy/Google path: response has token + user — create session as before
    const redirectPath = {
      admin: ROUTES.admin.BASE,
      customer: ROUTES.HOME,
    }[response.user.role];

    return createAuthSession(request, response.token, response.user, redirectPath);
  } catch (error) {
    return handleAuthActionError(error);
  }
}
