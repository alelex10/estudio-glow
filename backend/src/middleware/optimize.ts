import sharp from "sharp";
import type { Request, Response, NextFunction } from "express";

/**
 * Redimensiona la imagen a un máximo de 1200px de ancho antes de subirla.
 *
 * POR QUÉ: mobile-first — no necesitamos imágenes de 4000px en el servidor.
 * Cloudinary después aplica f_auto (formato óptimo según browser) y
 * q_auto (calidad automática) al servir la imagen al frontend.
 *
 * NO convertimos a WebP acá porque Cloudinary lo hace mejor: puede servir
 * AVIF, WebP o JPEG según el browser que haga el request.
 */
export async function optimizeImage(req: Request, res: Response, next: NextFunction) {
  if (!req.file) return next();

  try {
    req.file.buffer = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .toBuffer();

    next();
  } catch (err) {
    next(err);
  }
}
