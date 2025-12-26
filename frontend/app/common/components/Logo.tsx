import clsx from "clsx"

interface LogoProps {
    className?: string;
    variant?: "full" | "icon";
}

export const Logo = ({ className, variant = "full" }: LogoProps) => {
    // Versión solo icono para espacios pequeños
    if (variant === "icon") {
        return (
            <div className={clsx("rounded-full overflow-hidden", className)}>
                <img src="/img/logo/logo-1.avif" alt="Estudio Glow" className="w-full h-full object-contain" />
            </div>
        );
    }

    return (
        <div className="flex flex-col justify-center">
            <div className="relative flex justify-center">
                <div className="relative rounded-full border-primary-500 p-2 shadow-2xl shadow-black/50">

                    <div className="rounded-full overflow-hidden w-60 sm:w-72">
                        <div className="w-fit m-auto">
                            <img src="/img/logo/logo-1.avif" alt="logo" />
                        </div>
                    </div>
                    <div className="absolute -inset-4 rounded-full border border-primary-500 pointer-events-none"></div>
                    <div className="absolute -inset-8 rounded-full border border-primary-500/10 pointer-events-none"></div>
                </div>

            </div>
            <h1 className={clsx("bg-clip-text font-gabarito text-9xl font-bold text-transparent text-center mt-6",
                "bg-linear-to-bl from-primary-500 from-30% via-primary-200 via-50% to-primary-500 to-70% ")}>
                GLOW
            </h1>
        </div>
    )
}
