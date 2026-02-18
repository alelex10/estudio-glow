import { Form, Link, redirect, type LoaderFunctionArgs } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { FormError } from "~/common/components/Form/FormError";
import { loginSchema, type LoginFormData } from "~/common/schemas/auth";
import type { Route } from "./+types/login";
import { getToken, authFetch } from "~/common/services/auth.server";
import { API_ENDPOINTS } from "~/common/config/api-end-points";
import type { MessageResponse } from "~/common/types/response";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Login | Glow Studio" },
    {
      name: "description",
      content: "Inicia sesión en el panel de administración de Glow Studio",
    },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const token = await getToken(request);

  if (!token) {
    return { authenticated: false };
  }

  try {
    const data = await authFetch<MessageResponse>(
      request,
      API_ENDPOINTS.AUTH.VERIFY,
      { method: "GET" },
    );

    if (data) {
      return redirect("/admin");
    }
  } catch {
  }

  return { authenticated: false };
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
  const { error } = (actionData as unknown as { error?: string }) || {};

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
          "p-8",
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
        <Form
          className="space-y-5"
          method="post"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            handleSubmit((data) => {
              form.action = "/auth/login-action";
              form.submit();
            })();
          }}
        >
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
          <FormError message={error} />

          {/* Submit */}
          <FormButton loadingText="Ingresando...">Ingresar</FormButton>
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
