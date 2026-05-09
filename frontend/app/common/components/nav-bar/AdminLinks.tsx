import { Link } from "react-router";
import { ROUTES } from "~/common/constants/routes";

export default function AdminLinks() {
  return (
    <Link to={ROUTES.admin.BASE} className="hover:text-primary-100 transition-colors">
      Dashboard
    </Link>
  );
}
