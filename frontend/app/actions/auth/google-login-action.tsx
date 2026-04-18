import type { ActionFunctionArgs } from "react-router";
import { createAuthSession } from "~/common/services/auth.server";
import { serverGoogleLogin } from "~/common/services/authApi.server";
import { ADMIN } from "~/common/constants/rute-client";
import type { GoogleLoginActionData } from "~/common/types/response";
import { API_BASE_URL } from "~/common/config/api-end-points";

/**
 * Validate environment configuration
 * Fails fast if config is misaligned
 */
function validateEnv(): boolean {
  const env = process.env.NODE_ENV || "development";
  const apiBaseUrl = API_BASE_URL;

  // Check for localhost in production
  if (env === "production") {
    if (apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1")) {
      console.error(
        JSON.stringify({
          route: "/actions/auth/google-login-action",
          environment: env,
          errorCode: "CONFIG_MISMATCH",
          message: "API_BASE_URL points to localhost in production",
          apiBaseUrl,
        }),
      );
      return false;
    }
  }

  // Check required env vars (VITE_ prefix is available at runtime in server context)
  const requiredVars = ["VITE_GOOGLE_CLIENT_ID"];
  const missing = requiredVars.filter((v) => !import.meta.env[v]);

  if (missing.length > 0) {
    console.error(
      JSON.stringify({
        route: "/actions/auth/google-login-action",
        environment: env,
        errorCode: "MISSING_ENV_VARS",
        missing,
      }),
    );
    return false;
  }

  return true;
}

/**
 * Generate a debug ID for correlation and logging
 */
function generateDebugId(): string {
  return `GGL-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Map backend error to typed action response
 */
function mapBackendError(
  error: Error & { code?: string; statusCode?: number },
  debugId: string,
  env: string,
): GoogleLoginActionData {
  const code = error.code || "UNKNOWN";
  const statusCode = error.statusCode;

  // Structured logging (no secrets/tokens)
  console.error(
    JSON.stringify({
      route: "/actions/auth/google-login-action",
      environment: env,
      errorCode: code,
      debugId,
      statusCode,
      message: error.message,
    }),
  );

  // Map to UI-safe messages
  switch (code) {
    case "NOT_REGISTERED":
      return {
        error:
          "Usuario no registrado con Google. Por favor, registrate primero.",
        suggestion: "register",
        debugId,
      };
    case "CONSENT_DENIED":
      return {
        error: "Consentimiento denegado. Por favor, intentá nuevamente.",
        debugId,
      };
    case "UPSTREAM_UNAVAILABLE":
      return {
        error:
          "Servicio de Google temporalmente indisponible. Por favor, intentá más tarde.",
        debugId,
      };
    default:
      return {
        error:
          "Error al iniciar sesión con Google. Por favor, intentá más tarde.",
        debugId,
      };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const debugId = generateDebugId();
  const env = process.env.NODE_ENV || "development";

  // Validate environment config
  if (!validateEnv()) {
    return {
      error:
        "Configuración del servidor incorrecta. Contactá al administrador.",
      debugId,
    };
  }

  // Validate required fields
  const formData = await request.formData();
  const idToken = formData.get("idToken");

  if (!idToken || typeof idToken !== "string") {
    console.error(
      JSON.stringify({
        route: "/actions/auth/google-login-action",
        environment: env,
        errorCode: "MISSING_TOKEN",
        debugId,
      }),
    );
    return {
      error: "Token de Google no proporcionado",
      debugId,
    };
  }

  try {
    // Call backend
    const response = await serverGoogleLogin(idToken);

    // Structured success logging
    console.log(
      JSON.stringify({
        route: "/actions/auth/google-login-action",
        environment: env,
        event: "SUCCESS",
        userId: response.user.id,
        debugId,
      }),
    );

    // Create session and redirect by role
    const redirectPath = {
      admin: ADMIN.BASE_ROUTE,
      customer: "/",
    }[response.user.role];

    return createAuthSession(
      request,
      response.token,
      response.user,
      redirectPath,
    );
  } catch (error) {
    // Map error to typed response
    return mapBackendError(
      error as Error & { code?: string; statusCode?: number },
      debugId,
      env,
    );
  }
}
