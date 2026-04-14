import { Link } from "react-router";

export default function AdminLinks() {
  return (
    <Link to="/admin" className="hover:text-primary-100 transition-colors">
      Dashboard
    </Link>
  );
}
