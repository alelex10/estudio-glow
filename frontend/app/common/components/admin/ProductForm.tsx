import { useState, useEffect } from "react";
import clsx from "clsx";
import type { CreateProductData, UpdateProductData, Product } from "../../types";
import { LoadingSpinner } from "./LoadingSpinner";

interface ProductFormProps {
    initialData?: Product;
    onSubmit: (data: CreateProductData | UpdateProductData, image?: File) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode: "create" | "edit";
}

export function ProductForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    mode,
}: ProductFormProps) {
    const [formData, setFormData] = useState<CreateProductData>({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "",
    });
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || "",
                price: initialData.price,
                stock: initialData.stock,
                category: initialData.category,
            });
            if (initialData.imageUrl) {
                setImagePreview(initialData.imageUrl);
            }
        }
    }, [initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es requerido";
        }
        if (formData.price <= 0) {
            newErrors.price = "El precio debe ser mayor a 0";
        }
        if (formData.stock < 0) {
            newErrors.stock = "El stock no puede ser negativo";
        }
        if (!formData.category.trim()) {
            newErrors.category = "La categoría es requerida";
        }
        if (mode === "create" && !image) {
            newErrors.image = "La imagen es requerida";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        await onSubmit(formData, image || undefined);
    };

    const inputClassName = (hasError: boolean) =>
        clsx(
            "w-full px-4 py-2.5 rounded-lg border transition-colors",
            "focus:outline-none focus:ring-2",
            hasError
                ? "border-red-300 focus:ring-red-400 focus:border-transparent"
                : "border-gray-200 focus:ring-primary-400 focus:border-transparent"
        );

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del producto *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClassName(!!errors.name)}
                    placeholder="Ej: Crema hidratante"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={clsx(inputClassName(false), "resize-none")}
                    rows={3}
                    placeholder="Describe el producto..."
                />
            </div>

            {/* Precio y Stock */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio *
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            className={clsx(inputClassName(!!errors.price), "pl-7")}
                        />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className={inputClassName(!!errors.stock)}
                    />
                    {errors.stock && <p className="mt-1 text-sm text-red-500">{errors.stock}</p>}
                </div>
            </div>

            {/* Categoría */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                </label>
                <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={inputClassName(!!errors.category)}
                    placeholder="Ej: Cuidado facial"
                />
                {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
            </div>

            {/* Imagen */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen {mode === "create" ? "*" : "(dejar vacío para mantener actual)"}
                </label>
                <div className="flex items-start gap-4">
                    {/* Preview */}
                    <div
                        className={clsx(
                            "w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden",
                            errors.image ? "border-red-300" : "border-gray-200"
                        )}
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <svg
                                className="w-10 h-10 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        )}
                    </div>

                    {/* Input */}
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="product-image"
                        />
                        <label
                            htmlFor="product-image"
                            className={clsx(
                                "inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors",
                                "border border-gray-200 text-gray-700",
                                "hover:bg-gray-50"
                            )}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Subir imagen
                        </label>
                        {image && (
                            <p className="mt-2 text-sm text-gray-500">{image.name}</p>
                        )}
                    </div>
                </div>
                {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className={clsx(
                        "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50",
                        "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700",
                        "flex items-center justify-center gap-2"
                    )}
                >
                    {isLoading && <LoadingSpinner size="sm" />}
                    {mode === "create" ? "Crear producto" : "Guardar cambios"}
                </button>
            </div>
        </form>
    );
}
