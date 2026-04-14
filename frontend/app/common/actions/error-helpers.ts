/**
 * Formateador unificado de errores para actions.
 * Convierte cualquier error en el formato estándar { success: false, errors: string[] }.
 * 
 * @param error - Error a formatear (Error, string, unknown)
 * @returns Objeto de error estandarizado
 */
export function handleActionError(error: unknown): { success: false; errors: string[] } {
  const message = error instanceof Error ? error.message : "Error desconocido";
  return { success: false, errors: [message] };
}

/**
 * Crea una respuesta de éxito estándar.
 * 
 * @returns Objeto de éxito estandarizado
 */
export function actionSuccess(): { success: true } {
  return { success: true };
}

/**
 * Crea una respuesta de error con múltiples mensajes.
 * 
 * @param messages - Array de mensajes de error
 * @returns Objeto de error estandarizado
 */
export function actionErrors(messages: string[]): { success: false; errors: string[] } {
  return { success: false, errors: messages };
}
