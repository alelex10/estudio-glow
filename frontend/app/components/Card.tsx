import clsx from "clsx"
import { Button } from "./Button"


interface ProductCardProps {
    imageSrc: string
    title: string
    price: number
    buttonText?: string
}

export function ProductCard({ imageSrc, title, price, buttonText = "Mas informacion" }: ProductCardProps) {
    return (
        <div className={clsx(" bg-primary-100 p-4 pb-6 h-full w-70",
            "border-5 border-primary-500",
            "outline-3 outline- outline-offset-3",
        )}>
            <div className="">
                <img src={imageSrc} alt={title} className="w-full h-auto object-cover" />
            </div>

            <div className="px-2 text-left">
                <h2 className="text-2xl text-black tracking-wide mb-2">{title}</h2>
                <p className="text-lg text-black mb-6">${price}</p>

                <Button variant="gold">{buttonText}</Button>
            </div>
        </div>
    )
}
