import { Form, Link, redirect, useFetcher } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { FormError } from "~/common/components/Form/FormError";
import { registerSchema, type RegisterFormData } from "~/common/schemas/auth";
import { GoogleLoginButton } from "~/common/components/button/GoogleLoginButton";
import { useState } from "react";
import type { Route } from "./+types/register";
import { getUserRole, isAuthenticated, createAuthSession } from "~/common/services/auth.server";
import { serverGoogleRegister } from "~/common/services/authApi.server";
import { ROUTES } from "~/common/constants/routes";
import { ApiError } from "~/common/config/api-client";

export function meta() {
  return [
    { title: "Crear Cuenta | Glow Studio" },
    {
      name: "description",
      content:
        "Creá tu cuenta en Glow Studio para guardar tus productos favoritos",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const isAuth = await isAuthenticated(request);

  if (isAuth) {
    const userRole = (await getUserRole(request)) as "admin" | "customer";
    return {
      admin: redirect(ROUTES.admin.BASE),
      customer: redirect(ROUTES.HOME),
    }[userRole];
  }
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const idToken = formData.get("idToken") as string;

  if (!idToken) {
    return { error: "Token de Google no proporcionado" };
  }

  try {
    const { token, user } = await serverGoogleRegister(idToken);
    return createAuthSession(request, token, user, user.role === "admin" ? ROUTES.admin.BASE : ROUTES.HOME);
  } catch (err) {
    if (err instanceof ApiError) {
      const msg =
        err.code === "EMAIL_ALREADY_EXISTS"
          ? "Ya existe una cuenta con ese email. Iniciá sesión en su lugar."
          : err.code === "GOOGLE_ID_MISMATCH"
            ? "Esta cuenta de Google no coincide con el email registrado."
            : "Error al registrarse con Google";
      return { error: msg };
    }
    return { error: "Error al registrarse con Google" };
  }
}

export default function Register() {
  const fetcher = useFetcher<{ error?: string; code?: string }>();
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const isSubmitting = fetcher.state === "submitting";
  const isGoogleAccountExists = fetcher.data?.code === "GOOGLE_ACCOUNT_EXISTS";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleGoogleSuccess = (idToken: string) => {
    setGoogleError(null);
    setIsGoogleSubmitting(true);
    const formData = new FormData();
    formData.append("idToken", idToken);
    // S-3 fix: route to the dedicated action that handles all backend response variants,
    // including 202 link_email_sent (C3b), 401 GOOGLE_EMAIL_UNVERIFIED, and 409 GOOGLE_ID_MISMATCH.
    fetcher.submit(formData, { method: "post", action: ROUTES.actions.AUTH_GOOGLE_LOGIN });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl" />
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
          <h1 className="text-2xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Unite a Glow Studio y guardá tus favoritos
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
            onSuccess={handleGoogleSuccess}
            onError={(err) => setGoogleError(err)}
            text="Registrarse con Google"
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
          method="post"
          onSubmit={handleSubmit((data) => {
            fetcher.submit(data as Record<string, string>, { method: "post", action: ROUTES.actions.AUTH_REGISTER });
          })}
          action={ROUTES.actions.AUTH_REGISTER}
        >
          <FormInput
            label="Nombre"
            type="text"
            placeholder="Tu nombre"
            register={register}
            name="name"
            errors={errors}
          />

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
            placeholder="Mínimo 6 caracteres"
            register={register}
            name="password"
            errors={errors}
          />

          <FormInput
            label="Confirmar contraseña"
            type="password"
            placeholder="Repetí tu contraseña"
            register={register}
            name="confirmPassword"
            errors={errors}
          />

          <FormError message={fetcher.data?.error || googleError || undefined} />

          {/* GOOGLE_ACCOUNT_EXISTS: show login with Google CTA */}
          {isGoogleAccountExists && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-2">
              <p className="text-sm text-blue-700 text-center">
                ¿Ya tenés una cuenta de Google con este email?
              </p>
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={(err) => setGoogleError(err)}
                text="Iniciar sesión con Google"
              />
            </div>
          )}

          <FormButton loadingText="Creando cuenta..." isLoading={isSubmitting}>Crear cuenta</FormButton>
        </Form>

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-500">
            ¿Ya tenés cuenta?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Iniciá sesión
            </Link>
          </p>
          <p className="text-sm text-gray-400">
            <Link to={ROUTES.HOME} className="hover:text-primary-500 transition-colors">
              ← Volver a la tienda
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
