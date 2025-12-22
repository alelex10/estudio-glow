import { useCallback, useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigate,
  useSubmit,
  type ActionFunctionArgs,
  type DataStrategyResult,
  type LoaderFunctionArgs,
} from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { FormError } from "~/common/components/Form/FormError";
import { loginSchema, type LoginFormData } from "~/common/schemas/auth";
import type { Route } from "../auth/+types/login";
import { userContext, userContextProvider } from "~/common/context/context";
import { API_BASE_URL, API_ENDPOINTS } from "~/common/config/api";

export async function clientAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

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

  const responseAction = redirect("/admin");

  return responseAction;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = userContextProvider.get(userContext);
  if (user) return redirect("/admin");
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  let submit = useSubmit();

  //   let cb = useCallback(async (data: LoginFormData) => {
  //     submit(data, {
  //       action: "/admin/login-action",
  //       method: "post",
  //       navigate: false,
  //     });
  //   }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl" />
      </div>

      {/* Card de login */}
      <div
        className={clsx(
          "relative w-full max-w-md",
          "bg-white/10 backdrop-blur-xl rounded-2xl",
          "border border-white/20 shadow-2xl",
          "p-8"
        )}
      >
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
              <Logo variant="icon" className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Estudio Glow</h1>
          <p className="text-gray-400 mt-2">Panel de Administración</p>
        </div>

        {/* Formulario */}
        <Form className="space-y-5" method="post">
          {/* Email */}
          <FormInput
            label="Email"
            type="email"
            placeholder="admin@estudioglow.com"
            register={register}
            name="email"
            errors={errors}
          />

          {/* Password */}
          <FormInput
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            register={register}
            name="password"
            errors={errors}
          />

          {/* Error */}
          <FormError message={errors.root?.message} />

          {/* Submit */}
          <FormButton isLoading={isLoading} loadingText="Ingresando...">
            Ingresar
          </FormButton>
        </Form>

        {/* Link a tienda */}
        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/" className="hover:text-primary-400 transition-colors">
            ← Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
