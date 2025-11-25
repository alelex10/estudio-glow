export default function Hero() {
    return (
        <div className="relative w-full min-h-screen bg-[#4a3b2a] overflow-hidden flex items-center justify-center">
            {/* Background Overlay/Texture */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                {/* Simulating the shadow/leaf effect with a gradient or placeholder image if available. 
              For now, using a radial gradient to give depth. */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-black/40 via-transparent to-black/60"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full pt-20">

                {/* Left Side: Circular Image */}
                <div className="relative flex justify-center lg:justify-end">
                    <div className="relative w-80 h-80 md:w-[500px] md:h-[500px] rounded-full border-4 border-[#D4AF37] p-2 shadow-2xl shadow-black/50">
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2070&auto=format&fit=crop"
                                alt="Skincare Model"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Decorative outer rings */}
                        <div className="absolute -inset-4 rounded-full border border-[#D4AF37]/30 pointer-events-none"></div>
                        <div className="absolute -inset-8 rounded-full border border-[#D4AF37]/10 pointer-events-none"></div>
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="text-white space-y-6 text-center lg:text-left">
                    <h2 className="text-3xl md:text-5xl font-light tracking-wide text-[#E5E5E5]">
                        lorem input sdsadsad <br />
                        dsggd eegre h th trff
                    </h2>

                    {/* Large GLOW text at the bottom or background */}
                    <div className="absolute bottom-0 left-0 w-full text-center lg:text-left lg:static transform translate-y-1/4 lg:translate-y-0 opacity-20 lg:opacity-100 pointer-events-none lg:pointer-events-auto">
                        <h1 className="text-[150px] md:text-[250px] font-serif font-bold text-[#D4AF37] leading-none tracking-tighter mix-blend-overlay">
                            GLOW
                        </h1>
                    </div>
                </div>
            </div>

            {/* Product Bottles (Absolute positioned to match design roughly) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 lg:translate-x-20 lg:translate-y-0 z-0 opacity-40 lg:opacity-60 pointer-events-none">
                {/* Placeholder for bottles */}
                <div className="flex items-end gap-4">
                    <div className="w-20 h-60 bg-white/10 rounded-t-full backdrop-blur-sm border border-white/20"></div>
                    <div className="w-24 h-80 bg-white/10 rounded-t-full backdrop-blur-sm border border-white/20"></div>
                </div>
            </div>

        </div>
    );
}
