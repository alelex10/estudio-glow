import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Toma una URL de Cloudinary y le agrega transformaciones de optimización.
 *
 * f_auto  → Cloudinary elige el mejor formato (WebP, AVIF, JPEG) según el browser
 * q_auto  → Cloudinary elige la calidad óptima (balance peso/calidad visual)
 * w_{n}   → Ancho responsive (opcional, para servir imágenes del tamaño justo)
 *
 * @example
 *   getCloudinaryUrl("https://res.cloudinary.com/demo/image/upload/v1/product.jpg")
 *   // → "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/product.jpg"
 *
 *   getCloudinaryUrl(url, 400)
 *   // → "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400/v1/product.jpg"
 */
export function getCloudinaryUrl(url: string, width?: number): string {
  if (!url.includes("cloudinary")) return url;

  // Insertar transformaciones después de "/image/upload/"
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const base = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);

  const transformations = ["f_auto", "q_auto"];
  if (width) transformations.push(`w_${width}`);

  return `${base}${transformations.join(",")}/${rest}`;
}
