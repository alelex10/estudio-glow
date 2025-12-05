import { useState } from "react";
import { useParams } from "react-router";
import { Button } from "~/common/components/Button";
import Footer from "~/common/components/Footer";
import { ChevronDown, Star } from "lucide-react";
import clsx from "clsx";

// Mock data - en producción vendría de una API o base de datos
const PRODUCT_DATA: Record<string, any> = {
    "1": {
        id: 1,
        title: "Bella Skinhydra Masque",
        price: 40,
        rating: 4.8,
        description: "Enrich your skin with the essence of Rose and Chamomile. Gives a soothing effect and calms the skin. Has anti-ageing properties best used as a sleeping masque.",
        images: [
            "/img/product-test/product-1.webp",
        ],
        badges: ["Cruelty Free", "Vegan"],
        benefits: [
            "Hidratación profunda durante toda la noche",
            "Reduce líneas finas y arrugas",
            "Calma irritaciones y rojeces",
            "Aroma relajante de rosa y camomila",
            "Ingredientes 100% naturales"
        ]
    },
    "2": {
        id: 2,
        title: "Bronzeador Premium",
        price: 55,
        rating: 4.5,
        description: "Bronceado perfecto y natural con protección solar incluida. Formula enriquecida con extractos naturales.",
        images: [
            "/img/product-test/product-1.webp",
        ],
        badges: ["Cruelty Free", "SPF 30"],
        benefits: [
            "Protección UV avanzada",
            "Bronceado gradual y duradero",
            "Hidratación hasta 24 horas",
            "Sin manchas ni rayas",
            "Resistente al agua"
        ]
    }
};

export default function ProductDetail() {
    const { id } = useParams();
    const [showBenefits, setShowBenefits] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Obtener datos del producto o usar default
    const product = PRODUCT_DATA[id || "1"] || PRODUCT_DATA["1"];

    return (
        <>
            <main className="min-h-screen bg-white pt-20">
                {/* Mobile and Desktop Layout */}
                <div className="max-w-7xl mx-auto px-2 py-8">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-12">

                        {/* Image Gallery */}
                        <div className="mb-8 lg:mb-0">
                            <div className="space-y-4">
                                {product.images.map((image: string, index: number) => (
                                    <div
                                        key={index}
                                        className={clsx(
                                            "relative aspect-square overflow-hidden bg-white",
                                        )}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.title} - imagen ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="bg-linear-to-b from-primary-300/40 to-primary-400/40 p-6 lg:p-8 h-fit">
                            {/* Title */}
                            <h1 className="text-3xl lg:text-4xl font-playfair text-primary-900 mb-4">
                                {product.title}
                            </h1>

                            {/* Price and Rating */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-4xl lg:text-5xl font-bold text-blue-600">
                                    ${product.price}
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-lg">{product.rating}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-primary-900 mb-6 leading-relaxed">
                                {product.description}
                            </p>

                            {/* Badges */}
                            <div className="flex gap-3 mb-6 flex-wrap">
                                {product.badges.map((badge: string, index: number) => (
                                    <span
                                        key={index}
                                        className="px-4 py-1.5 bg-white text-primary-900 text-sm font-medium rounded-full border border-primary-400"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>

                            {/* Other Benefits Dropdown */}
                            <div className="mb-8">
                                <button
                                    onClick={() => setShowBenefits(!showBenefits)}
                                    className="flex items-center justify-between w-full text-blue-600 font-medium py-2"
                                >
                                    <span>Other benefits</span>
                                    <ChevronDown
                                        className={clsx(
                                            "w-5 h-5 transition-transform duration-300",
                                            showBenefits && "rotate-180"
                                        )}
                                    />
                                </button>

                                {showBenefits && (
                                    <ul className="mt-4 space-y-2 text-primary-900">
                                        {product.benefits.map((benefit: string, index: number) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <span className="text-primary-600 mt-1">•</span>
                                                <span>{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Buy Button */}
                            <Button
                                variant="gold"
                                size="lg"
                                rounded="medium"
                                className="w-full text-lg font-semibold uppercase tracking-wider shadow-lg"
                            >
                                Comprar
                            </Button>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
