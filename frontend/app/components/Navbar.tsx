import { useState } from "react";
import { MenuIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./Button";
import Drawer from "./Drawer";

const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Productos" },
];

export default function Navbar() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    return (
        <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 text-primary-100">

            {/* Links */}
            <div className="hidden md:flex items-center gap-8 text-md font-medium text-white">
                {NAV_LINKS.map((link) => (
                    <Link key={link.href} to={link.href} className="hover:text-primary-100 transition-colors">
                        {link.label}
                    </Link>
                ))}
            </div>
            {/* menu hamburgeza */}
            <div className="md:hidden flex items-center">
                <button className="text-white" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
                    <MenuIcon size={30} />
                </button>
            </div>
            <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <ul className="flex flex-col space-y-4 mt-8">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <Link
                                to={link.href}
                                className="text-xl font-medium text-white hover:text-primary-100 transition-colors block py-2"
                                onClick={() => setDrawerOpen(false)}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </Drawer>
            {/* Icons */}
            <div className="flex items-center gap-6 text-white">
                <Button className="bg-primary-100">
                    Login
                </Button>
            </div>
        </nav>
    );
}
