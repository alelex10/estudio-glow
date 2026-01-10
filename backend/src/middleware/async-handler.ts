import type { Request, Response, NextFunction } from "express";

/**
 * Tipo para funciones de controlador async
 */
type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wrapper para funciones async que captura errores automáticamente
 *
 * Elimina la necesidad de bloques try-catch en cada controlador.
 * Cualquier error lanzado o promise rechazada será capturada y pasada
 * al middleware de manejo de errores vía next(err).
 *
 * @example
 * export const getProduct = asyncHandler(async (req, res) => {
 *   const product = await db.getProduct(req.params.id);
 *   if (!product) throw new NotFoundError('Producto no encontrado');
 *   res.json(product);
 * });
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
