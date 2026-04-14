import { useState, useEffect } from "react";
import { useLocation, useLoaderData } from "react-router";
import clsx from "clsx";
import NavLinks from "./NavLinks";
import MobileMenuButton from "./MobileMenuButton";
import UserActions from "./UserActions";
import MobileDrawer from "./MobileDrawer";
import type { LayoutLoaderData } from "../../../routes/layout";

const HIDDEN_LINKS = [{ href: "/product/" }];

export default function Navbar() {
  const page = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const loaderData = useLoaderData<LayoutLoaderData>();
  const user = loaderData?.user ?? null;

  const isHome = page.pathname === "/";
  const hiddenLinks = HIDDEN_LINKS.some((link) => page.pathname.includes(link.href));

  useEffect(() => {
    const handleScroll = () => {
      setIsHeroVisible(window.scrollY === 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header>
      <nav
        className={clsx(
          `fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 h-20 text-primary-100 transition-all duration-300`,
          isHome && isHeroVisible
            ? "bg-transparent"
            : "bg-opacity-100 bg-linear-to-r from-primary-800/50 via-primary-200/50 to-primary-800/50 backdrop-blur-sm",
          hiddenLinks && "hidden",
        )}
      >
        <div className="hidden md:block"></div>
        <NavLinks isHome={isHome} />
        <MobileMenuButton onClick={() => setDrawerOpen(true)} />
        <MobileDrawer 
          isOpen={drawerOpen} 
          onClose={() => setDrawerOpen(false)}
          user={user}
        />
        <UserActions user={user} />
      </nav>
    </header>
  );
}
