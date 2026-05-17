/**
 * Google login action — T3-07
 *
 * Handles POST from the Google login button (idToken in form body).
 * Response contract:
 *  - 200/201 with {token, user} → create session, redirect to dashboard
 *  - 202 with {status:"link_email_sent", email} → redirect to /auth/check-email?context=link
 *  - 401 GOOGLE_EMAIL_UNVERIFIED → return {error, code}
 *  - 409 GOOGLE_ID_MISMATCH → return {error, code}
 *  - Other errors → return {error}
 *
 * Spec refs: C3b (link_email_sent), F3.5 (GOOGLE_EMAIL_UNVERIFIED), F3.6 (GOOGLE_ID_MISMATCH)
 * Design refs: Section 6 (google-login-action.tsx)
 */

import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { createAuthSession } from "~/common/services/auth.server";
import { serverGoogleLoginFull } from "~/common/services/authApi.server";
import { ApiError } from "~/common/config/api-client";
import { ROUTES } from "~/common/constants/routes";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const idToken = formData.get("idToken") as string | null;

  if (!idToken) {
    return { error: "Token de Google no proporcionado", code: "MISSING_TOKEN" };
  }

  try {
    const response = await serverGoogleLoginFull(idToken);

    // C3b: Backend returned 202 — account link email was sent, no JWT issued
    if ("status" in response) {
      const params = new URLSearchParams({
        email: response.email,
        context: "link",
      });
      return redirect(`${ROUTES.AUTH.CHECK_EMAIL}?${params.toString()}`);
    }

    // Normal success (200 returning user / 201 new user) — create session
    const redirectPath =
      response.user.role === "admin" ? ROUTES.admin.BASE : ROUTES.HOME;
    return createAuthSession(request, response.token, response.user, redirectPath);
  } catch (err) {
    if (err instanceof ApiError) {
      // Pass the backend error code through for conditional rendering in the UI
      return {
        error: err.message || "Error al iniciar sesión con Google",
        code: err.code,
      };
    }
    // Rethrow redirects (from createAuthSession)
    if (err instanceof Response) throw err;

    const message = err instanceof Error ? err.message : "Error desconocido";
    return { error: message, code: "UNKNOWN" };
  }
}
