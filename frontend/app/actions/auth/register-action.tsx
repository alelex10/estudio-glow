import type { ActionFunctionArgs } from "react-router";
import { createAuthSession } from "~/common/services/auth.server";
import { serverRegister } from "~/common/services/authApi.server";
import { ADMIN } from "~/common/constants/rute-client";
import { parseFormData } from "~/common/actions/form-helpers";
import { handleActionError } from "~/common/actions/error-helpers";

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

    // Redirigir según el rol del usuario (todos los nuevos registros son customers por defecto)
    const redirectPath = {
      admin: ADMIN.BASE_ROUTE,
      customer: "/",
    }[response.user.role];

    return createAuthSession(request, response.token, response.user, redirectPath);
  } catch (error) {
    return handleActionError(error);
  }
}
