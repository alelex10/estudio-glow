import { useState } from "react";
import { useNavigate } from "react-router";
import { productService } from "~/common/services/productService";
import { ProductForm } from "~/common/components/admin/ProductForm";
import { toast } from "~/common/components/admin/Toast";
import type { CreateProductData, UpdateProductData } from "~/common/types/product-types";
import type { Route } from "./+types/product.new";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Admin  Nuevo Producto" },
    { name: "description", content: "Crear nuevo producto en Glow Studio" },
  ];
}

export default function AdminProductNew() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: CreateProductData | UpdateProductData, image?: File) => {
        if (!image) {
            toast("error", "La imagen es requerida");
            return;
        }

        setIsLoading(true);
        try {
            await productService.createProduct(data as CreateProductData, image);
            toast("success", "Producto creado correctamente");
            navigate("/admin/products");
        } catch (error) {
            toast("error", error instanceof Error ? error.message : "Error al crear producto");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <ProductForm
                    mode="create"
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/admin/products")}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
}
