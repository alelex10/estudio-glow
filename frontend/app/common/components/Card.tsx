import clsx from "clsx"
import { Button } from "./Button"
import { Link } from "react-router"


interface ProductCardProps {
    imageSrc: string
    title: string
    price: number
    buttonText?: string
    productId?: number | string
}

export function ProductCard({ imageSrc, title, price, buttonText = "Ver más detalles", productId }: ProductCardProps) {
    const CardContent = () => (
        <div className={clsx("bg-white p-3 pb-4 max-w-[300px] mx-auto",
            "border-5 border-primary-400",
            "outline-2 outline-primary-400 outline-offset-2",
            "flex flex-col gap-3"
        )}>
            <div className="relative aspect-4/5 overflow-hidden bg-gray-50">
                <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                />
            </div>

            <div className="text-left flex flex-col gap-1">
                <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">{title}</h2>
                <p className="text-sm text-gray-600 mb-2">${price.toFixed(2)}</p>

                <Button variant="gold" className="w-full text-xs py-2 uppercase tracking-wider font-semibold shadow-none rounded-none">
                    {buttonText}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="p-2">
            {productId ? (
                <Link to={`/product/${productId}`}>
                    <CardContent />
                </Link>
            ) : (
                <CardContent />
            )}
        </div>
    )
}
