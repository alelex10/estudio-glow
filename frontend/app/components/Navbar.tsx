import { MenuIcon, User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./Button";

export default function Navbar() {
    return (
        <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 text-primary-100">

            {/* Links */}
            <div className="hidden md:flex items-center gap-8 text-md font-medium text-white">
                <Link to="/" className="hover:text-primary-100 transition-colors">Home</Link>
                <Link to="/" className="hover:text-primary-100 transition-colors">Productos</Link>
            </div>
            {/* menu hamburgeza */}
            <div className="md:hidden flex items-center">
                <button className="text-white ">
                    <MenuIcon size={30} />
                </button>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-6 text-white">
                <Button  className="bg-primary-100">
                    Login
                </Button>
            </div>
        </nav>
    );
}
