import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import type { Category } from "../../types/category-types";
import { 
    createCategorySchema, 
    updateCategorySchema,
    type CreateCategoryFormData,
    type UpdateCategoryFormData 
} from "../../schemas/categorySchema";
import { LoadingSpinner } from "./LoadingSpinner";
import { Form } from "react-router";

interface CategoryFormProps {
    initialData?: Category;
    mode: "create" | "edit";
    isSubmitting?: boolean;
    errors?: string[];
    onSubmit?: (data: CreateCategoryFormData | UpdateCategoryFormData) => void;
}

export function CategoryForm({
    initialData,
    mode,
    isSubmitting = false,
    errors = [],
    onSubmit,
}: CategoryFormProps) {
    // Determinar el esquema según el modo
    const schema = mode === "create" ? createCategorySchema : updateCategorySchema;
    
    const {
        register,
        handleSubmit,
        formState: { errors: formErrors, isDirty },
        watch,
        reset
    } = useForm<CreateCategoryFormData | UpdateCategoryFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || ""
        }
    });

    // Watch para obtener valores actuales del formulario
    const formValues = watch();

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                description: initialData.description || ""
            });
        }
    }, [initialData, reset]);

    const inputClassName = (hasError: boolean) =>
        clsx(
            "w-full px-4 py-2.5 rounded-lg border transition-colors",
            "focus:outline-none focus:ring-2",
            hasError
                ? "border-red-300 focus:ring-red-400 focus:border-transparent"
                : "border-gray-200 focus:ring-primary-400 focus:border-transparent"
        );

    return (
        <Form 
            method="post" 
            onSubmit={handleSubmit(onSubmit || (() => {}))}
            className="space-y-6"
        >
            {/* Nombre */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la categoría *
                </label>
                <input
                    type="text"
                    {...register("name")}
                    className={inputClassName(!!formErrors.name)}
                    placeholder="Ej: Electrónica"
                    maxLength={100}
                />
                {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.name.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    {formValues.name?.length || 0}/100 caracteres
                </p>
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                </label>
                <textarea
                    {...register("description")}
                    className={clsx(inputClassName(!!formErrors.description), "resize-none")}
                    rows={4}
                    placeholder="Describe la categoría..."
                    maxLength={500}
                />
                {formErrors.description && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.description.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    {formValues.description?.length || 0}/500 caracteres
                </p>
            </div>

            {/* Errores del servidor */}
            {errors && errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="text-sm text-red-600 space-y-1">
                        {errors.map((error, i) => (
                            <li key={i}>• {error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Botones */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !isDirty}
                    className={clsx(
                        "flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50",
                        "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700",
                        "flex items-center justify-center gap-2"
                    )}
                >
                    {isSubmitting && <LoadingSpinner size="sm" />}
                    {mode === "create" ? "Crear categoría" : "Guardar cambios"}
                </button>
            </div>
        </Form>
    );
}
