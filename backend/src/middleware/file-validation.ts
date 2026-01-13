import type { Request, Response, NextFunction } from "express";
import type { FileFilterCallback } from "multer";
import multer from "multer";
import { ValidationError } from "../errors";

export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Validar que el archivo sea una imagen
  if (!file.mimetype.startsWith("image/")) {
    return cb(new ValidationError("Solo se permiten archivos de imagen"));
  }

  // Validar tipos de imagen específicos (opcional)
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new ValidationError(
        "Tipo de imagen no permitido. Se permite: JPEG, PNG, WebP, GIF"
      )
    );
  }

  cb(null, true);
};

export const validateImageFile = (maxSizeMB: number = 5) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
      files: 1, // Solo un archivo por solicitud
    },
    fileFilter: imageFileFilter,
  });
};
