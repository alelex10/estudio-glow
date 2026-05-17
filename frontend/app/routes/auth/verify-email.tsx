/**
 * /auth/verify-email
 *
 * Result page after email verification.
 * The user's email link points to the BACKEND GET /auth/verify-email?token=...
 * which performs the actual verification and 302-redirects here with:
 *   - ?status=ok        → success
 *   - ?status=error&code=TOKEN_INVALID  → expired/used/invalid token
 *
 * This page is a pure "presentational" view of the outcome — no backend fetch
 * from the loader (avoids double-consumption from SSR loader retries).
 *
 * Spec refs: F1.8, F1.9, N1.2, N1.3, frontend observable behavior table
 * Design refs: Section 6 (verify-email.tsx), Flow A, Key UX decision §6
 */

import { Link, useSearchParams } from "react-router";
import { Logo } from "~/common/components/Logo";
import { ROUTES } from "~/common/constants/routes";
import type { Route } from "./+types/verify-email";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Verificación de Email | Glow Studio" },
    {
      name: "description",
      content: "Resultado de la verificación de tu email en Glow Studio.",
    },
  ];
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "ok";

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl border border-primary-200/50 shadow-xl shadow-primary-200/20 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
            <Logo variant="icon" className="w-10 h-10" />
          </div>
        </div>

        {isSuccess ? (
          <>
            {/* Success state */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Email verificado!
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Tu cuenta está lista. Iniciá sesión para comenzar.
            </p>

            <Link
              to={ROUTES.LOGIN}
              className="inline-block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-colors duration-200"
            >
              Iniciar sesión
            </Link>
          </>
        ) : (
          <>
            {/* Error / expired / used token state */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Link inválido o expirado
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              El link de verificación expiró o ya fue utilizado. Podés solicitar uno nuevo.
            </p>

            <div className="space-y-3">
              <Link
                to={ROUTES.LOGIN}
                className="inline-block w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition-colors duration-200"
              >
                Iniciar sesión
              </Link>
              <p className="text-xs text-gray-400">
                Al iniciar sesión podrás solicitar el reenvío del email de verificación.
              </p>
            </div>
          </>
        )}

        <div className="mt-4">
          <Link
            to={ROUTES.HOME}
            className="text-sm text-gray-400 hover:text-primary-500 transition-colors"
          >
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
