import { Link } from "react-router";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Productos" },
];

interface NavLinksProps {
  isHome: boolean;
}

export default function NavLinks({ isHome }: NavLinksProps) {
  return (
    <div className="hidden md:flex items-center gap-8 text-md font-medium">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          className={clsx(
            "text-primary-900 hover:text-primary-700",
            isHome && "hover:text-primary-100 text-white",
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
