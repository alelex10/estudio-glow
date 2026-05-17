import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { csrfProtect } from "./csrf";
import { CsrfError } from "../errors";

function makeReq(overrides: Partial<Request> = {}): Request {
  const headers: Record<string, string> = {};
  return {
    method: "POST",
    path: "/auth/login",
    header: (name: string) => headers[name.toLowerCase()],
    ...overrides,
    // Mutable header bag for tests that set it:
    headers,
  } as unknown as Request;
}

function makeReqWithHeader(name: string, value: string, base: Partial<Request> = {}): Request {
  const req = makeReq(base);
  // Override header() to return the configured value for this single name.
  (req as unknown as { header: (n: string) => string | undefined }).header = (n: string) =>
    n.toLowerCase() === name.toLowerCase() ? value : undefined;
  return req;
}

describe("csrfProtect middleware", () => {
  it("allows safe methods without the X-Requested-With header", () => {
    const next: NextFunction = vi.fn();
    csrfProtect(makeReq({ method: "GET" }), {} as Response, next);
    expect(next).toHaveBeenCalledWith();   // called with no error
  });

  it("bypasses webhook routes (HMAC validates them)", () => {
    const next: NextFunction = vi.fn();
    csrfProtect(makeReq({ method: "POST", path: "/api/webhooks/mercadopago" }), {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects POST without the X-Requested-With header", () => {
    const next: NextFunction = vi.fn();
    csrfProtect(makeReq({ method: "POST" }), {} as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(err).toBeInstanceOf(CsrfError);
  });

  it("allows POST when the X-Requested-With header is present", () => {
    const next: NextFunction = vi.fn();
    const req = makeReqWithHeader("x-requested-with", "XMLHttpRequest", { method: "POST" });
    csrfProtect(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
  });
});
