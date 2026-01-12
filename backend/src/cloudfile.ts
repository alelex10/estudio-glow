import { v2 as cloudinary } from "cloudinary";
import type { ConfigOptions } from "cloudinary";

// Validar que las variables de entorno existan
const requiredEnvVars = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Lanzar error si falta alguna variable requerida
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `Variable de entorno requerida faltante: CLOUDINARY_${key.toUpperCase()}`
    );
  }
});

const cloudinaryConfig: ConfigOptions = cloudinary.config({
  cloud_name: requiredEnvVars.cloud_name,
  api_key: requiredEnvVars.api_key,
  api_secret: requiredEnvVars.api_secret,
});

export default cloudinaryConfig;
