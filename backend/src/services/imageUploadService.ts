import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import cloudinaryConfig from "../cloudfile";
import { CLOUDINARY } from "../constants/const";

cloudinary.config(cloudinaryConfig);

export interface ImageUploadResult {
  secure_url: string;
  public_id: string;
}

export class ImageUploadService {
  /**
   * Sube una imagen a Cloudinary desde un buffer
   * @param buffer - Buffer de la imagen
   * @param folder - Carpeta donde se guardará la imagen
   * @param publicId - ID público para la imagen (opcional)
   * @returns Promise<ImageUploadResult>
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string,
    publicId?: string
  ): Promise<ImageUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder,
        resource_type: "image",
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          } else {
            reject(new Error("Upload failed: No result returned"));
          }
        })
        .end(buffer);
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId - ID público de la imagen a eliminar
   * @returns Promise<boolean>
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error) {
      console.error("Error deleting image:", error);
      return false;
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param imageUrl - URL de la imagen
   * @returns string | null
   */
  static extractPublicId(imageUrl: string) {
    try {
      const urlParts = imageUrl.split("/");
      const fileName = urlParts.pop()!;
      if (!fileName) return null;

      const publicId = fileName.split(".")[0];
      const folder = urlParts.slice(-2).join("/"); // Obtiene las últimas dos partes de la URL (generalmente la carpeta)

      return folder ? `${folder}/${publicId}` : publicId;
    } catch (error) {
      console.error("Error extracting public_id:", error);
      return null;
    }
  }

  /**
   * Sube una imagen de producto
   * @param buffer - Buffer de la imagen
   * @param productId - ID del producto
   * @returns Promise<ImageUploadResult>
   */
  static async uploadProductImage(
    buffer: Buffer,
    productId: string
  ): Promise<ImageUploadResult> {
    return this.uploadImage(buffer, CLOUDINARY.FOLDER.PRODUCTS, productId);
  }

  /**
   * Elimina una imagen de producto
   * @param imageUrl - URL de la imagen a eliminar
   * @returns Promise<boolean>
   */
  static async deleteProductImage(imageUrl: string): Promise<boolean> {
    const publicId = this.extractPublicId(imageUrl);
    if (!publicId) {
      console.warn("No se pudo extraer el public_id de la URL:", imageUrl);
      return false;
    }

    return this.deleteImage(publicId);
  }

  /**
   * Actualiza una imagen de producto (elimina la anterior y sube la nueva)
   * @param newBuffer - Buffer de la nueva imagen
   * @param productId - ID del producto
   * @param oldImageUrl - URL de la imagen antigua (opcional)
   * @returns Promise<ImageUploadResult>
   */
  static async updateProductImage(
    newBuffer: Buffer,
    productId: string,
    oldImageUrl?: string
  ): Promise<ImageUploadResult> {
    // Eliminar imagen anterior si existe
    if (oldImageUrl) {
      await this.deleteProductImage(oldImageUrl);
    }

    // Subir nueva imagen
    return this.uploadProductImage(newBuffer, productId);
  }
}
