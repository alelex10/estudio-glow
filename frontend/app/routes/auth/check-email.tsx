/**
 * /auth/check-email
 *
 * Static "check your inbox" page shown after a successful LOCAL register.
 * Reads the ?email query param for display purposes.
 * Provides a resend CTA that calls POST /auth/resend-verification.
 *
 * Spec refs: F1.3, F1.11, frontend observable behavior table
 * Design refs: Section 6 (check-email.tsx)
 */

import { Link, useSearchParams, useFetcher } from "react-router";
import { Logo } from "~/common/components/Logo";
import { ROUTES } from "~/common/constants/routes";
import type { Route } from "./+types/check-email";
import { z } from "zod";

const emailSchema = z.string().email();

function isSafeEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Revisá tu bandeja | Glow Studio" },
    {
      name: "description",
      content: "Te enviamos un email de verificación. Revisá tu bandeja de entrada.",
    },
  ];
}

export default function CheckEmail() {
  const [searchParams] = useSearchParams();
  const rawEmail = searchParams.get("email") ?? "";
  const email = isSafeEmail(rawEmail) ? rawEmail : "";

  const fetcher = useFetcher<{ message: string }>();
  const isResending = fetcher.state !== "idle";

  const handleResend = () => {
    fetcher.submit(
      { email },
      { method: "post", action: ROUTES.actions.AUTH_RESEND_VERIFICATION },
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl border border-primary-200/50 shadow-xl shadow-primary-200/20 p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-linear-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
              <Logo variant="icon" className="w-10 h-10" />
            </div>
          </div>

          {/* Inbox icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.039a2.25 2.25 0 0 1 2.134 0l7.5 4.039a2.25 2.25 0 0 1 1.183 1.98V19.5Z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">Revisá tu bandeja</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Te enviamos un email de verificación
            {email && (
              <>
                {" "}a{" "}
                <span className="font-medium text-gray-700 break-all">{email}</span>
              </>
            )}
            .
          </p>
          <p className="text-gray-400 mt-2 text-xs">
            Si no lo encontrás, revisá la carpeta de spam.
          </p>
        </div>

        {/* Resend CTA */}
        <div className="space-y-3">
          {fetcher.data && (
            <p className="text-sm text-center text-primary-600 font-medium">
              {fetcher.data.message}
            </p>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || !email}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors duration-200"
          >
            {isResending ? "Reenviando..." : "Reenviar email de verificación"}
          </button>

          <div className="text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
