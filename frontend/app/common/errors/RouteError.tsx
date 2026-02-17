import { isRouteErrorResponse } from "react-router";

interface RouteErrorProps {
  error: unknown;
}

export function RouteError({ error }: RouteErrorProps) {
  let message = "Error";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{message}</h1>
      <p className="text-gray-600 mb-4">{details}</p>
    </main>
  );
}
