import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { productService } from "~/common/services/productService";
import { ProductForm } from "~/common/components/admin/ProductForm";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import { toast } from "~/common/components/admin/Toast";
import type { Product, ProductResponse, UpdateProductData } from "~/common/types/product-types";
import type { Route } from "./+types/product.$id";

export function meta({ params }: Route.MetaArgs) {

    return [
        { title: "Admin | Editar Producto" },
        { name: "description", content: "Editar producto en Glow Studio" },
    ];
}

export default function AdminProductEdit() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadProduct = async () => {
            if (!id) return;

            try {
                const data = await productService.getProduct(id);
                if (!data.data) return;
                setProduct(data.data);
            } catch (error) {
                toast("error", "Error al cargar producto");
                navigate("/admin/products");
            } finally {
                setIsLoading(false);
            }
        };

        loadProduct();
    }, [id, navigate]);

    const handleSubmit = async (data: UpdateProductData, image?: File) => {
        if (!id) return;

        setIsSaving(true);
        try {
            await productService.updateProduct(id, data, image);
            toast("success", "Producto actualizado correctamente");
            navigate("/admin/products");
        } catch (error) {
            toast("error", error instanceof Error ? error.message : "Error al actualizar producto");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Producto no encontrado</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <ProductForm
                    mode="edit"
                    initialData={product}
                    onSubmit={handleSubmit}
                    onCancel={() => navigate("/admin/products")}
                    isLoading={isSaving}
                />
            </div>
        </div>
    );
}
