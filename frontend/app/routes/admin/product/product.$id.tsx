import { useState } from "react";
import { useNavigate, useFetcher } from "react-router";
import { productService } from "~/common/services/productService";
import { ProductForm } from "~/common/components/admin/ProductForm";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import { getToken } from "~/common/services/auth.server";
import type {
  Product,
  ProductResponse,
  UpdateProductData,
} from "~/common/types/product-types";
import type { Route } from "./+types/product.$id";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Admin | Editar Producto" },
    { name: "description", content: "Editar producto en Glow Studio" },
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const token = await getToken(request);
  
  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  try {
    const product = await productService.getProduct(params.id);
    return { product };
  } catch (error) {
    throw new Response("Product not found", { status: 404 });
  }
}

export async function action({ params, request }: Route.ActionArgs) {
  const token = await getToken(request);
  
  if (!token) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const data: UpdateProductData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    categoryId: formData.get("categoryId") as string,
  };

  const image = formData.get("image") as File | null;

  try {
    await productService.updateProduct(params.id, data, image || undefined, token);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Error al actualizar producto" 
    };
  }
}

export default function AdminProductEdit({ loaderData, actionData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleSubmit = async (data: UpdateProductData, image?: File) => {
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        formData.append(key, val.toString());
      }
    });

    if (image) {
      formData.append("image", image);
    }

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  // Redirigir si la actualización fue exitosa
  if (fetcher.data?.success) {
    navigate("/admin/products");
  }

  if (!loaderData?.product?.data) {
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
          initialData={loaderData.product.data}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/products")}
          isLoading={fetcher.state !== "idle"}
        />
        
        {(actionData?.error || fetcher.data?.error) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              {actionData?.error || fetcher.data?.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
