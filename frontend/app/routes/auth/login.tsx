import { Form, Link, redirect, useSubmit } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { FormError } from "~/common/components/Form/FormError";
import { loginSchema, type LoginFormData } from "~/common/schemas/auth";
import { GoogleLoginButton } from "~/common/components/GoogleLoginButton";
import { useState } from "react";
import type { Route } from "./+types/login";
import { getUserRole, isAuthenticated, createAuthSession } from "~/common/services/auth.server";
import { ADMIN } from "~/common/constants/rute-client";
import { API_BASE_URL } from "~/common/config/api-end-points";

export function meta() {
  return [
    { title: "Iniciar Sesión | Glow Studio" },
    {
      name: "description",
      content: "Iniciá sesión en Glow Studio para acceder a tus favoritos",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const isAuth = await isAuthenticated(request);

  if (isAuth) {
    const userRole = (await getUserRole(request)) as "admin" | "customer";
    return {
      admin: redirect(ADMIN.BASE_ROUTE),
      customer: redirect("/"),
    }[userRole];
  }

  return null;
}

async function serverGoogleLogin(idToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error en login con Google" }));
    throw new Error(error.message || "Error al iniciar sesión con Google");
  }

  return response.json();
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const idToken = formData.get("idToken") as string;

  if (!idToken) {
    return { error: "Token de Google no proporcionado" };
  }

  try {
    const { token, user } = await serverGoogleLogin(idToken);
    return createAuthSession(request, token, user, user.role === "admin" ? ADMIN.BASE_ROUTE : "/");
  } catch (err: any) {
    const errorMessage = err.message || "Error al iniciar sesión con Google";
    
    if (errorMessage.includes("no registrado") || errorMessage.includes("401")) {
      return { 
        error: "Usuario no registrado con Google. Por favor, registrate primero.",
        suggestion: "register"
      };
    }
    
    return { error: errorMessage };
  }
}

export default function CustomerLogin({ actionData }: Route.ComponentProps) {
  const serverError =
    (actionData as { error?: string; suggestion?: string } | undefined)?.error ?? undefined;
  const suggestion = (actionData as { suggestion?: string } | undefined)?.suggestion;
  const [googleError, setGoogleError] = useState<string | undefined>(undefined);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const submit = useSubmit();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-100/30 rounded-full blur-3xl" />
      </div>

      <div
        className={clsx(
          "relative w-full max-w-md",
          "bg-white/70 backdrop-blur-xl rounded-3xl",
          "border border-primary-200/50 shadow-xl shadow-primary-200/20",
          "p-8",
        )}
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
              <Logo variant="icon" className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenida de vuelta
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Iniciá sesión para ver tus favoritos
          </p>
        </div>

        {/* Google Login */}
        <div
          className={clsx(
            "mb-6",
            isGoogleSubmitting && "opacity-50 pointer-events-none",
          )}
        >
          <GoogleLoginButton
            onSuccess={(idToken) => {
              setGoogleError(undefined);
              setIsGoogleSubmitting(true);
              const formData = new FormData();
              formData.append("idToken", idToken);
              submit(formData, { method: "post" });
            }}
            onError={(err) => {
              setIsGoogleSubmitting(false);
              setGoogleError(err);
            }}
          />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/70 text-gray-400">
              o con tu email
            </span>
          </div>
        </div>

        {/* Formulario - Server-side submission */}
        <Form
          className="space-y-4"
          onSubmit={handleSubmit((_, e) => {
            e?.target.submit();
          })}
          method="post"
          action="/actions/auth/login-action"
        >
          <FormInput
            label="Email"
            type="email"
            placeholder="tu@email.com"
            register={register}
            name="email"
            errors={errors}
          />

          <FormInput
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            register={register}
            name="password"
            errors={errors}
          />

          <FormError message={serverError || googleError} />
          {suggestion === "register" && (
            <p className="text-sm text-center mt-2">
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Ir a registro →
              </Link>
            </p>
          )}

          <FormButton loadingText="Ingresando...">Iniciar Sesión</FormButton>
        </Form>

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-500">
            ¿No tenés cuenta?{" "}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Registrate
            </Link>
          </p>
          <p className="text-sm text-gray-400">
            <Link to="/" className="hover:text-primary-500 transition-colors">
              ← Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
