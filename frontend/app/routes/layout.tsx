import { Outlet } from "react-router";
import Navbar from "~/common/components/Navbar";
import { isRouteErrorResponse } from "react-router";
import type { Route } from "../+types/root";

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <p>Error: `${error.status}: ${error.statusText}`</p>
        <p>{error.data}</p>
      </>
    );
  }

  return (
    <p>Error: {error instanceof Error ? error.message : "Unknown Error"}</p>
  );
}


export default function Layout() {
    return (
        <div className="bg-primary-100" >
            <Navbar />
            <Outlet />
        </div>
    );
}