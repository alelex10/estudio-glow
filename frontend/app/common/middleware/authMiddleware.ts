import { redirect } from "react-router";

export async function authMiddleware(
  { request }: { request: Request }
  // next: () => Promise<Response>
) {
  const hasToken = request.headers.get("Cookie");

  if (!hasToken) return redirect("/admin/login");
}
