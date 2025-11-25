import clsx from "clsx"
import { Logo } from "./Logo";

export default function Hero() {
    return (
        <div className={clsx("relative w-full min-h-screen overflow-hidden flex items-center justify-center",
            "bg-[url(/img/bg-hero.jpg)] bg-cover bg-center bg-no-repeat",
            "bg-primary-900"

        )}>
            <div className="absolute inset-0 opacity-70 bg-primary-900"></div>

            <div className="z-10 flex align-center justify-center gap-10">

                {/* Left Side: Circular Image */}

                <Logo />
                {/* Decorative outer rings */}


                {/* Right Side: Content */}
                <div className="text-white space-y-6 text-center lg:text-left">
                    <h2 className="text-3xl md:text-5xl font-light tracking-wide text-[#E5E5E5]">
                        LA BELLEZA SE TRATA DE MEJORAR LO QUE YA TIENES. ¡PERMITETE BRILLAR!
                    </h2>
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
