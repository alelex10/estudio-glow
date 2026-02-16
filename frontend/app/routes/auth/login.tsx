import { useState } from "react";
import {
  Form,
  Link,
  redirect,
  useSubmit,
  type ActionFunctionArgs,
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
import type { Route } from "./+types/login";
import { API_BASE_URL, API_ENDPOINTS } from "~/common/config/api-end-points";
import { authService } from "~/common/services/authService";
import type { LoginResponse } from "~/common/types/response";
import { contextProvider, userContext } from "~/common/context/context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login | Glow Studio" },
    {
      name: "description",
      content: "Inicia sesión en el panel de administración de Glow Studio",
    },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  
  if (!cookieHeader) {
    return { authenticated: false };
  }

  const isAuthenticated = await authService.isAuthenticated();
  
  if (isAuthenticated) {
    return redirect("/admin");
  }
  
  return { authenticated: false };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const response = await authService.login({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  // const setCookie = response.headers.get("Set-Cookie");
  const data: LoginResponse = await response.json();
  const context = contextProvider.set(userContext, data.user);

  if (!response.ok) {
    return { error: data.message || "Error al iniciar sesión" };
  }

  return redirect("/admin", response);
}

export default function AdminLogin({ actionData }: Route.ComponentProps) {
  const [isLoading, setIsLoading] = useState(false);
  let submit = useSubmit(); 

  const { error } = actionData || {};

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
        <Form
          className="space-y-5"
          method="post"
          onSubmit={(e) => handleSubmit}
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
