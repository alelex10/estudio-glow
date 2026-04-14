import { useState, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";
import { productService } from "~/common/services/productService";
import { ProductForm } from "~/common/components/admin/ProductForm";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import { requireAuth } from "~/common/actions/auth-helpers";
import { parseFormData, getFileFromFormData } from "~/common/actions/form-helpers";
import { handleActionError } from "~/common/actions/error-helpers";
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
  const token = await requireAuth(request);

  try {
    const product = await productService.getProduct(params.id);
    return { product };
  } catch (error) {
    throw new Response("Product not found", { status: 404 });
  }
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

interface ActionSuccess {
  success: true;
}

interface ActionError {
  success: false;
  error: string;
}

type ActionData = ActionSuccess | ActionError;

function isActionError(data: ActionData): data is ActionError {
  return data.success === false;
}

export async function action({ params, request }: Route.ActionArgs): Promise<ActionData> {
  try {
    const token = await requireAuth(request);
    const formData = await request.formData();

    const data = parseFormData<ProductFormData>(formData, {
      name: (v) => String(v),
      description: (v) => String(v),
      price: (v) => Number(String(v)),
      stock: (v) => Number(String(v)),
      categoryId: (v) => String(v),
    });

    const image = getFileFromFormData(formData, "image");

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
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      navigate("/admin/products");
    }
  }, [fetcher.state, fetcher.data?.success, navigate]);

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
        
        {((actionData && isActionError(actionData)) || (fetcher.data && isActionError(fetcher.data))) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              {(actionData && isActionError(actionData) ? actionData.error : null) || 
               (fetcher.data && isActionError(fetcher.data) ? fetcher.data.error : null)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
