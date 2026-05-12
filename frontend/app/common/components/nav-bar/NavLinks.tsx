import { Link, useLocation } from "react-router";
import clsx from "clsx";
import { NAV_LINKS, ROUTES } from "~/common/constants/routes";

interface NavLinksProps {
  isHome: boolean;
}

function isActiveLink(href: string, pathname: string): boolean {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname.startsWith(href);
}

export default function NavLinks({ isHome }: NavLinksProps) {
  const { pathname } = useLocation();

  return (
    <div className="hidden md:flex items-center gap-1 text-md font-medium">
      {NAV_LINKS.map((link) => {
        const active = isActiveLink(link.href, pathname);
        return (
          <Link
            key={link.href}
            to={link.href}
            className={clsx(
              "px-4 py-2 rounded-lg transition-all duration-200",
              active
                ? isHome
                  ? "bg-white/15 text-white"
                  : "bg-primary-200/40 text-primary-900 font-semibold"
                : isHome
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-primary-900 hover:text-primary-700 hover:bg-primary-200/20",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
