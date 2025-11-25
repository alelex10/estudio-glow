import clsx from "clsx"
import { Button } from "./Button"


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
                <Button variant="gold">{buttonText}</Button>
            </div>
        </div>
    )
}
