import type { ActionFunctionArgs } from "react-router";
import { createAuthSession } from "~/common/services/auth.server";
import { serverLogin } from "~/common/services/authApi.server";
import { ADMIN } from "~/common/constants/rute-client";
import { parseFormData } from "~/common/actions/form-helpers";
import { handleActionError } from "~/common/actions/error-helpers";

interface LoginFormData {
  email: string;
  password: string;
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    
    const data = parseFormData<LoginFormData>(formData, {
      email: (v) => String(v),
      password: (v) => String(v),
    });

    const response = await serverLogin(data.email, data.password);

    // Redirigir según el rol del usuario
    const redirectPath = {
      admin: ADMIN.BASE_ROUTE,
      customer: "/",
    }[response.user.role];

    return createAuthSession(
      request,
      response.token,
      response.user,
      redirectPath,
    );
  } catch (error) {
    return handleActionError(error);
  }
}
