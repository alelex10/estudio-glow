import { Link } from "react-router";
import clsx from "clsx";

export default function Footer({className}: {className?: string}) {
    
    return (
        <footer className={clsx("w-full bg-linear-to-bl from-primary-500 via-primary-200 to-primary-500", className)}>
            <div className="relative">
                <div className="bg-[url(/img/common/footer-img.webp)] bg-cover bg-center bg-no-repeat h-[200px]"></div>

                <div className="w-full absolute -bottom-10">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white rounded-lg shadow-lg py-6 px-8 text-center">
                            <p className="text-black text-base md:text-lg font-medium tracking-wide">
                                FOLLOW OUR INSTAGRAM PAGE : 
                                <a
                                    href="https://instagram.com/glow_trends"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-700 hover:text-primary-900 transition-colors font-semibold"
                                >
                                    @GLOW_TRENDS
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            <nav className="w-full py-8 border-t border-primary-400 text-primary-900 mt-10">
                <div className="max-w-6xl mx-auto px-4">
                    <ul className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm md:text-base font-medium">
                        <li>
                            <Link
                                to="/men"
                                className="hover:text-primary-600 transition-colors"
                            >
                                Hombres
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/women"
                                className="hover:text-primary-600 transition-colors"
                            >
                                Mujeres
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/kids"
                                className="hover:text-primary-600 transition-colors"
                            >
                                Niños
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/collection"
                                className="hover:text-primary-600 transition-colors"
                            >
                                Colección
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/trends"
                                className="hover:text-primary-600 transition-colors"
                            >
                                Tendencias
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="w-full py-6 border-t border-primary-400 text-primary-900">
                <div className="max-w-6xl mx-auto px-4">
                    <p className="text-center text-sm md:text-base">
                        Copyright Glow Studio All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    );
}
