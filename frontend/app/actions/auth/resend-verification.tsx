/**
 * Action: POST /actions/auth/resend-verification
 *
 * Calls backend POST /auth/resend-verification.
 * Backend always returns 200 with generic message (anti-enumeration, F1.11).
 * This action returns the message to the fetcher caller.
 *
 * Spec refs: F1.10, F1.11
 */
import type { ActionFunctionArgs } from "react-router";
import { resendVerification } from "~/common/services/authApi.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");

  if (!email) {
    return { message: "Por favor ingresá tu email." };
  }

  try {
    return await resendVerification(email);
  } catch {
    // Backend always returns 200 for this endpoint — only network/parse errors land here
    return { message: "Si tu email es correcto recibirás un link en breve." };
  }
}
