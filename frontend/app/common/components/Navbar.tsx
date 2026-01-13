import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "./Button";
import Drawer from "./Drawer";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Productos" },
  // { href: "/test", label: "Test" },
  // { href: "/test-2", label: "Test 2" },
  // { href: "/test-3", label: "Test 3" },
];

interface NavbarProps {
  isBackgroundVisible?: boolean;
}

export default function Navbar({ isBackgroundVisible = true }: NavbarProps) {
  const page = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isHome = page.pathname === "/";

  return (
    <header>
      <nav
        className={clsx(
          `fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-20 text-primary-100 transition-all duration-300`,
          isHome && isBackgroundVisible
            ? "bg-transparent"
            : "bg-opacity-100 bg-linear-to-r from-primary-800/50 via-primary-200/50 to-primary-800/50 backdrop-blur-sm"
        )}
      >
        <div className="hidden md:block"></div>
        <div
          className={clsx(
            "hidden md:flex items-center gap-8 text-md font-medium"
          )}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={clsx(
                "text-primary-900 hover:text-primary-700",
                isHome &&
                  isBackgroundVisible &&
                  "hover:text-primary-100 text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="md:hidden flex items-center">
          <button
            className="text-white hover:text-primary-100 transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon size={30} />
          </button>
        </div>
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <ul className="flex flex-col space-y-4 mt-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={clsx(
                    "text-xl font-gabarito text-white hover:text-primary-100 transition-colors block py-2",
                    "border-b border-primary-900 hover:border-primary-100"
                  )}
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Drawer>
        <div className="flex items-center gap-6 text-white">
          <Link to={"admin/login"}>
            <Button className="bg-primary-100">Login</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
