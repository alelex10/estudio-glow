import type { Request, Response, NextFunction } from "express";
import { CsrfError } from "../errors";

/**
 * Custom-header CSRF protection.
 *
 * Requires `X-Requested-With: XMLHttpRequest` on state-changing methods
 * (POST, PUT, PATCH, DELETE). Browsers cannot set custom headers via
 * simple cross-origin form submissions or `<img>` requests, so this
 * is sufficient against CSRF for an SPA whose own client sets the header.
 *
 * Bypassed for:
 * - Safe methods (GET, HEAD, OPTIONS)
 * - Webhook endpoints (`/api/webhooks/*`) — they are authenticated by HMAC.
 */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_HEADER = "x-requested-with";
const CSRF_VALUE = "XMLHttpRequest";

export function csrfProtect(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (req.path.startsWith("/api/webhooks/")) {
    return next();
  }

  const headerValue = req.header(CSRF_HEADER);
  if (headerValue !== CSRF_VALUE) {
    return next(
      new CsrfError(
        "CSRF check failed: missing or invalid X-Requested-With header"
      )
    );
  }

  next();
}
