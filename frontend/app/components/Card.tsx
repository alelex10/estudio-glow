import clsx from "clsx"


interface ProductCardProps {
    imageSrc: string
    title: string
    price: string
    buttonText?: string
    className?: string
}

export function ProductCard({ imageSrc, title, price, buttonText = "Mas informacion", className }: ProductCardProps) {
    return (
        <div className={clsx(" bg-primary-100 p-4 pb-6 max-w-sm",
            "border-10 border-double border-primary-900",
            "mask-clip-stroke",
            "mask-invert"
        )}>
            {/* Product Image */}
            <div className="mb-6">
                <img src={imageSrc} alt={title} className="w-full h-auto object-cover" />
            </div>

            {/* Product Info */}
            <div className="px-2">
                <h2 className="text-2xl text-black tracking-wide mb-2">{title}</h2>
                <p className="text-lg text-black mb-6">${price}</p>

                {/* CTA Button */}
                <button
                    className={clsx(
                        "w-full py-3 px-6 rounded-full text-lg text-black font-medium",
                        "hover:cursor-pointer",
                        "bg-linear-to-bl",
                        "from-primary-900 via-primary-200 to-primary-900",
                        "hover:from-primary-800 hover:via-primary-100 hover:to-primary-800",
                        "transition-all duration-300",
                    )}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    )
}
