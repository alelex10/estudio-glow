import { LogOut } from "lucide-react";
import { Form } from "react-router";
import CustomerLinks from "./CustomerLinks";
import AdminLinks from "./AdminLinks";
import AuthButtons from "./AuthButtons";
import type { User } from "../../types/user-types";

interface UserActionsProps {
  user: User | null;
}

export default function UserActions({ user }: UserActionsProps) {
  if (!user) {
    return <AuthButtons />;
  }

  const isCustomer = user.role === "customer";
  const isAdmin = user.role === "admin";

  return (
    <div className="flex items-center gap-6 text-white">
      <span className="font-medium">{user.name}</span>
      {isCustomer && <CustomerLinks />}
      {isAdmin && <AdminLinks />}
      <Form className="flex" method="post" action="/actions/auth/logout">
        <button type="submit" className="hover:text-primary-100 transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </Form>
    </div>
  );
}
