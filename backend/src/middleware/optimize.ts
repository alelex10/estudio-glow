import sharp from "sharp";
import type { Request, Response, NextFunction } from "express";

export async function optimizeImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return next();

    // Convertir a WebP y redimensionar si querés
    const processed = await sharp(req.file.buffer)
      .resize({ width: 1500 }) // opcional — elimina si no querés redimensionar
      .webp({ quality: 80 })   // calidad recomendada
      .toBuffer();

    // sobrescribimos buffer, tipo y nombre
    req.file.buffer = processed;
    req.file.mimetype = "image/webp";
    req.file.originalname = req.file.originalname.replace(/\.(jpg|jpeg|png)$/i, ".webp");

    next();
  } catch (err) {
    console.error("Error al optimizar imagen:", err);
    res.status(500).json({ message: "Error al optimizar imagen" });
  }
}
