import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from "../controller/product";

const router = Router();

// Solo admins
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Obtener lista de productos (solo administradores)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/products", listProducts);

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Obtener un producto específico por ID (solo administradores)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/products/:id", getProduct);

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Crear un nuevo producto (solo administradores)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto
 *               description:
 *                 type: string
 *                 description: Descripción detallada del producto
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Precio del producto
 *               stock:
 *                 type: integer
 *                 description: Cantidad disponible en stock
 *               category:
 *                 type: string
 *                 description: Categoría del producto
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Error en los datos de entrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/products", createProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Actualizar un producto existente (solo administradores)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del producto
 *               description:
 *                 type: string
 *                 description: Descripción detallada del producto
 *               price:
 *                 type: number
 *                 format: float
 *                 description: Precio del producto
 *               stock:
 *                 type: integer
 *                 description: Cantidad disponible en stock
 *               category:
 *                 type: string
 *                 description: Categoría del producto
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/products/:id", updateProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Eliminar un producto (solo administradores)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Producto eliminado exitosamente"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/products/:id", deleteProduct);

/**
 * @swagger
 * /admin/search:
 *   get:
 *     summary: Buscar productos (solo administradores)
 *     tags: [Admin Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *     responses:
 *       200:
 *         description: Resultados de búsqueda obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Se requiere rol de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/search", searchProducts);

export default router;
