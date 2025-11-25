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
        <div className={clsx("border-4 border-amber-500 bg-white p-4 pb-6 max-w-sm", className)}>
            {/* Product Image */}
            <div className="mb-6">
                <img src={imageSrc} alt={title} className="w-full h-auto object-cover" />
            </div>

            {/* Product Info */}
            <div className="px-2">
                <h2 className="text-2xl font-bold text-black tracking-wide mb-2">{title}</h2>
                <p className="text-lg text-black mb-6">{price}</p>

                {/* CTA Button */}
                <button
                    className={clsx(
                        "w-full py-3 px-6 rounded-full text-lg italic text-white font-medium",
                        "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400",
                        "hover:from-amber-700 hover:via-amber-600 hover:to-amber-500",
                        "transition-all duration-300",
                    )}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    )
}
