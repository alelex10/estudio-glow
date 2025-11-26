import { User } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./Button";

export default function Navbar() {
    return (
        <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 text-[#D4AF37]">
            {/* Logo */}
            <div className="flex items-center gap-2">
            
                <span className="text-2xl font-serif tracking-widest font-bold text-[#D4AF37]">GLOW</span>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-8 text-md font-medium text-white">
                <Link to="/" className="hover:text-primary-100 transition-colors">Home</Link>
                <Link to="/" className="hover:text-primary-100 transition-colors">Productos</Link>
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
