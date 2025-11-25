import { Link } from "react-router";

export default function Navbar() {
    return (
        <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6 text-[#D4AF37]">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4AF37]">
                    {/* Placeholder for logo image if needed, or just use the text */}
                    <img src="https://placehold.co/40x40/D4AF37/white?text=G" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-2xl font-serif tracking-widest font-bold text-[#D4AF37]">GLOW</span>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#E5E5E5]">
                <Link to="/" className="hover:text-[#D4AF37] transition-colors">Home</Link>
                <div className="relative group">
                    <button className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors">
                        Productos
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Icons */}
            <div className="flex items-center gap-6 text-[#E5E5E5]">
                <button className="hover:text-[#D4AF37] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                </button>
                <button className="hover:text-[#D4AF37] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                </button>
                <button className="hover:text-[#D4AF37] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </button>
                <button className="md:hidden hover:text-[#D4AF37] transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12h18" />
                        <path d="M3 6h18" />
                        <path d="M3 18h18" />
                    </svg>
                </button>
            </div>
        </nav>
    );
}
