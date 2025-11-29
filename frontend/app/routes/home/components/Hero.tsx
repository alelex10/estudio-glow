import clsx from "clsx"
import { Logo } from "../../../common/components/Logo";

export default function Hero() {
    return (
        <div className={clsx("relative w-full h-screen overflow-hidden flex items-center justify-center",
            "bg-[url(/img/home/bg-hero.webp)] bg-cover bg-center bg-no-repeat",
            "bg-primary-900 px-[15%]"
        )}>
            <div className="absolute inset-0 opacity-70 bg-primary-900"></div>

            <div className={clsx("z-10 flex flex-col flex-wrap align-center justify-center gap-5",
                "md:flex md:flex-row     md:flex-nowrap")}>
                <Logo />
                <h2 className="text-white text-3xl md:text-5xl font-light tracking-wide self-center align-center text-center">
                    LA BELLEZA SE TRATA DE MEJORAR LO QUE YA TIENES. <br />¡PERMITETE BRILLAR!
                </h2>
            </div>
        </div>
    );
}
