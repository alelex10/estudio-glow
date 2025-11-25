export const Logo = () => {
    return (
        <div className="flex flex-col justify-center">
            <div className="relative flex justify-center">
                <div className="relative rounded-full border-[#D4AF37] p-2 shadow-2xl shadow-black/50">

                    <div className="w-full h-fit rounded-full overflow-hidden ">
                        <div className="w-fit m-auto">
                            <img src="/img/logo/logo-1.png" alt="" />
                        </div>
                    </div>
                    <div className="absolute -inset-4 rounded-full border border-[#D4AF37]/30 pointer-events-none"></div>
                    <div className="absolute -inset-8 rounded-full border border-[#D4AF37]/10 pointer-events-none"></div>
                </div>

            </div>
            <h1 className="font-gabarito text-9xl font-bold text-primary-100 text-center mt-6">
                GLOW
            </h1>
        </div>
    )
}
