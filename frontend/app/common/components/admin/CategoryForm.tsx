import { useState, useEffect } from "react";
import clsx from "clsx";
import type {
    CreateCategoryData,
    UpdateCategoryData,
    Category,
} from "../../types/category-types";
import { LoadingSpinner } from "./LoadingSpinner";

interface CategoryFormProps {
    initialData?: Category;
    onSubmit: (data: CreateCategoryData | UpdateCategoryData) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    mode: "create" | "edit";
}

export function CategoryForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    mode,
}: CategoryFormProps) {
    const [formData, setFormData] = useState<CreateCategoryData>({
        name: "",
        description: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || "",
            });
        }
    }, [initialData]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "El nombre es requerido";
        } else if (formData.name.length > 100) {
            newErrors.name = "El nombre no puede exceder 100 caracteres";
        }

        if (formData.description && formData.description.length > 500) {
            newErrors.description = "La descripción no puede exceder 500 caracteres";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        await onSubmit(formData);
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
                    Nombre de la categoría *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClassName(!!errors.name)}
                    placeholder="Ej: Electrónica"
                    maxLength={100}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                <p className="mt-1 text-xs text-gray-500">
                    {formData.name.length}/100 caracteres
                </p>
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                    className={clsx(inputClassName(!!errors.description), "resize-none")}
                    rows={4}
                    placeholder="Describe la categoría..."
                    maxLength={500}
                />
                {errors.description && (
                    <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    {formData.description?.length || 0}/500 caracteres
                </p>
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
                    {mode === "create" ? "Crear categoría" : "Guardar cambios"}
                </button>
            </div>
        </form>
    );
}
