import { Form, Link, redirect, useSubmit, useFetcher } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { FormError } from "~/common/components/Form/FormError";
import { loginSchema, type LoginFormData } from "~/common/schemas/auth";
import { GoogleLoginButton } from "~/common/components/button/GoogleLoginButton";
import { useState, useEffect } from "react";
import type { Route } from "./+types/login";
import { getUserRole, isAuthenticated, createAuthSession } from "~/common/services/auth.server";
import { ROUTES } from "~/common/constants/routes";
import { serverLogin, serverGoogleLogin } from "~/common/services/authApi.server";
import { ApiError } from "~/common/config/api-client";
import { parseFormData } from "~/common/actions/form-helpers";
import { handleAuthActionError } from "~/common/actions/error-helpers";

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
      admin: redirect(ROUTES.admin.BASE),
      customer: redirect(ROUTES.HOME),
    }[userRole];
  }

  return null;
}

type ActionData =
  | { error: string; suggestion?: string; code?: string; email?: string }
  | { redirectTo: string };

export async function action({ request }: ActionFunctionArgs): Promise<ActionData> {
  const formData = await request.formData();
  const idToken = formData.get("idToken");

  if (idToken && typeof idToken === "string") {
    try {
      const response = await serverGoogleLogin(idToken);
      const redirectPath = { admin: ROUTES.admin.BASE, customer: ROUTES.HOME }[response.user.role];
      return createAuthSession(request, response.token, response.user, redirectPath);
    } catch (error) {
      const code = error instanceof Error && "code" in error ? (error as Error & { code: string }).code : "";
      switch (code) {
        case "NOT_REGISTERED":
          return { error: "Usuario no registrado con Google. Por favor, registrate primero.", suggestion: "register" };
        case "CONSENT_DENIED":
          return { error: "Consentimiento denegado. Por favor, intentá nuevamente." };
        case "UPSTREAM_UNAVAILABLE":
          return { error: "Servicio de Google temporalmente indisponible. Por favor, intentá más tarde." };
        default:
          return { error: "Error al iniciar sesión con Google. Por favor, intentá más tarde." };
      }
    }
  }

  try {
    const data = parseFormData<{ email: string; password: string }>(formData, {
      email: (v) => String(v),
      password: (v) => String(v),
    });
    const response = await serverLogin(data.email, data.password);
    const redirectPath = { admin: ROUTES.admin.BASE, customer: ROUTES.HOME }[response.user.role];
    return createAuthSession(request, response.token, response.user, redirectPath);
  } catch (error) {
    // F1.6: Backend returns 403 EMAIL_NOT_VERIFIED for unverified LOCAL users
    if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
      const email = formData.get("email") as string | null;
      return { error: "Necesitás verificar tu email antes de ingresar.", code: "EMAIL_NOT_VERIFIED", email: email ?? "" };
    }
    return handleAuthActionError(error);
  }
}

export default function CustomerLogin({ actionData }: Route.ComponentProps) {
  const typedData = actionData as ActionData | undefined;
  const error = typedData && "error" in typedData ? typedData.error : undefined;
  const suggestion = typedData && "error" in typedData ? typedData.suggestion : undefined;
  const errorCode = typedData && "error" in typedData ? typedData.code : undefined;
  const unverifiedEmail = (typedData && "error" in typedData ? typedData.email : undefined) ?? "";
  const isEmailNotVerified = errorCode === "EMAIL_NOT_VERIFIED";
  const isGoogleNoPassword = errorCode === "GOOGLE_NO_PASSWORD";

  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const submit = useSubmit();
  const resendFetcher = useFetcher<{ message: string }>();
  const isResending = resendFetcher.state !== "idle";

  useEffect(() => {
    if (actionData) setIsGoogleSubmitting(false);
  }, [actionData]);

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
              setIsGoogleSubmitting(true);
              const formData = new FormData();
              formData.append("idToken", idToken);
              // C3b fix: submit to the dedicated google-login-action which handles
              // 202 link_email_sent, 401 GOOGLE_EMAIL_UNVERIFIED, 409 GOOGLE_ID_MISMATCH.
              submit(formData, { method: "post", action: ROUTES.actions.AUTH_GOOGLE_LOGIN });
            }}
            onError={(_err) => {
              setIsGoogleSubmitting(false);
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

        {/* Formulario */}
        <Form
          className="space-y-4"
          onSubmit={handleSubmit((data) => {
            submit(data as Record<string, string>, { method: "post" });
          })}
          method="post"
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

          <FormError message={error} />

          {/* EMAIL_NOT_VERIFIED: show resend CTA (F1.6, design Flow B) */}
          {isEmailNotVerified && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-2">
              {resendFetcher.data ? (
                <p className="text-sm text-amber-700 text-center">{resendFetcher.data.message}</p>
              ) : (
                <>
                  <p className="text-xs text-amber-600 text-center">
                    ¿No recibiste el email?
                  </p>
                  <resendFetcher.Form method="post" action={ROUTES.actions.AUTH_RESEND_VERIFICATION}>
                    <input type="hidden" name="email" value={unverifiedEmail} />
                    <button
                      type="submit"
                      disabled={isResending}
                      className="w-full py-2 px-3 text-sm text-amber-700 border border-amber-300 hover:bg-amber-100 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {isResending ? "Reenviando..." : "Reenviar email de verificación"}
                    </button>
                  </resendFetcher.Form>
                </>
              )}
            </div>
          )}

          {/* GOOGLE_NO_PASSWORD: show Google login CTA + link to set password */}
          {isGoogleNoPassword && (
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 space-y-2">
              <p className="text-sm text-blue-700 text-center">
                Esta cuenta usa Google para iniciar sesión.
              </p>
              <GoogleLoginButton
                onSuccess={(idToken) => {
                  setIsGoogleSubmitting(true);
                  const formData = new FormData();
                  formData.append("idToken", idToken);
                  submit(formData, { method: "post", action: ROUTES.actions.AUTH_GOOGLE_LOGIN });
                }}
                onError={(_err) => {
                  setIsGoogleSubmitting(false);
                }}
                text="Iniciar sesión con Google"
              />
              <p className="text-xs text-blue-600 text-center">
                ¿Ya iniciaste sesión con Google?{" "}
                <Link
                  to="/set-password"
                  className="underline font-medium hover:text-blue-800 transition-colors"
                >
                  Establecer contraseña
                </Link>
              </p>
            </div>
          )}

          {suggestion === "register" && (
            <p className="text-sm text-center mt-2">
              <Link
                to={ROUTES.REGISTER}
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
              to={ROUTES.REGISTER}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Registrate
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
