/**
 * Parser de FormData con type coercion.
 * Convierte valores de FormData a tipos específicos usando transformers.
 * 
 * @param formData - FormData del request
 * @param schema - Objeto con transformers para cada campo
 * @returns Objeto tipado con los valores transformados
 * 
 * @example
 * const data = parseFormData(formData, {
 *   name: (v) => String(v),
 *   price: (v) => parseFloat(String(v)),
 *   stock: (v) => parseInt(String(v)),
 *   description: (v) => v || undefined
 * });
 */
export function parseFormData<T>(
  formData: FormData,
  schema: Record<string, (value: FormDataEntryValue | null) => any>
): T {
  const result: Record<string, any> = {};
  
  for (const [key, transformer] of Object.entries(schema)) {
    const value = formData.get(key);
    result[key] = transformer ? transformer(value) : value;
  }
  
  return result as T;
}

/**
 * Extrae un campo File de FormData.
 * Útil para uploads de archivos.
 * 
 * @param formData - FormData del request
 * @param fieldName - Nombre del campo de archivo
 * @returns File si existe y tiene contenido, null en caso contrario
 */
export function getFileFromFormData(formData: FormData, fieldName: string): File | null {
  const file = formData.get(fieldName) as File | null;
  
  if (!file || file.size === 0) {
    return null;
  }
  
  return file;
}
