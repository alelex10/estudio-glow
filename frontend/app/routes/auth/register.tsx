import { Form, Link, useActionData, redirect } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Logo } from "~/common/components/Logo";
import { FormInput } from "~/common/components/Form/FormInput";
import { FormButton } from "~/common/components/Form/FormButton";
import { registerSchema, type RegisterFormData } from "~/common/schemas/auth";
import { GoogleLoginButton } from "~/common/components/GoogleLoginButton";
import { useState } from "react";
import type { Route } from "./+types/register";
import { getUserRole, isAuthenticated } from "~/common/services/auth.server";
import { ADMIN } from "~/common/constants/rute-client";

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
      admin: redirect(ADMIN.BASE_ROUTE),
      customer: redirect("/"),
    }[userRole];
  }
}

export default function Register() {
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const handleGoogleSuccess = async (idToken: string) => {
    setGoogleError(null);
    setIsGoogleSubmitting(true);
    try {
      // TODO: Implementar login con Google
      // await loginWithGoogle(idToken);
    } catch (err: any) {
      setGoogleError(err.message || "Error al registrarse con Google");
    } finally {
      setIsGoogleSubmitting(false);
    }
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
          onSubmit={handleSubmit((_, e) => {
            e?.target.submit();
          })}
          action="/actions/auth/register-action"
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

          {/* <FormError message={serverError || googleError || undefined} /> */}

          <FormButton loadingText="Creando cuenta...">Crear cuenta</FormButton>
        </Form>

        {/* Links */}
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-gray-500">
            ¿Ya tenés cuenta?{" "}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Iniciá sesión
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
