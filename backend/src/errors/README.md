# Sistema de Manejo de Errores - Documentación

## Descripción General

Este proyecto implementa un sistema profesional de manejo de errores basado en las mejores prácticas de Express.js, con clases de errores tipados, middleware especializado y manejo centralizado.

## Estructura de Errores

### Clases de Errores Disponibles

Todas las clases de error se encuentran en `src/errors/`:

- **`AppError`** - Clase base para todos los errores de aplicación
- **`ValidationError`** - Errores de validación (400)
- **`AuthenticationError`** - Errores de autenticación (401)
- **`AuthorizationError`** - Errores de autorización/permisos (403)
- **`NotFoundError`** - Recursos no encontrados (404)
- **`ConflictError`** - Conflictos como duplicados (409)
- **`DatabaseError`** - Errores de base de datos (500)

### Uso Básico

```typescript
import { NotFoundError, ConflictError } from "../errors";

// Lanzar error cuando no se encuentra un recurso
if (!product) {
  throw new NotFoundError("Producto no encontrado");
}

// Lanzar error cuando hay conflicto
if (existingUser.length > 0) {
  throw new ConflictError(`El usuario con email ${email} ya existe`);
}
```

## AsyncHandler

El `asyncHandler` es una utilidad que envuelve funciones async y captura errores automáticamente.

### Sin asyncHandler (antes)

```typescript
export async function getProduct(req: Request, res: Response) {
  try {
    const product = await db.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch product" });
  }
}
```

### Con asyncHandler (después)

```typescript
import { asyncHandler } from "../middleware/async-handler";
import { NotFoundError } from "../errors";

export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await db.getProduct(req.params.id);

  if (!product) {
    throw new NotFoundError("Producto no encontrado");
  }

  res.json(product);
});
```

**Ventajas:**

- ✅ No más bloques `try-catch` repetitivos
- ✅ Código más limpio y legible
- ✅ Errores capturados automáticamente
- ✅ Respuestas de error consistentes

## Middleware de Manejo de Errores

El sistema usa tres middleware en cadena (definidos en `src/middleware/error-handler.ts`):

1. **`logErrors`** - Registra todos los errores en consola
2. **`clientErrorHandler`** - Formatea errores como JSON
3. **`errorHandler`** - Catch-all para errores no manejados

### Flujo de Errores

```
Controller lanza error
    ↓
asyncHandler captura
    ↓
next(error)
    ↓
logErrors → logs en consola
    ↓
clientErrorHandler → respuesta JSON
    ↓
errorHandler → fallback genérico
```

## Respuestas de Error

Todas las respuestas de error siguen este formato:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Producto no encontrado",
    "stack": "Error: Producto no encontrado\\n    at ..." // solo en desarrollo
  }
}
```

### Códigos de Error

| Código                  | Clase                 | HTTP Status |
| ----------------------- | --------------------- | ----------- |
| `VALIDATION_ERROR`      | `ValidationError`     | 400         |
| `AUTHENTICATION_ERROR`  | `AuthenticationError` | 401         |
| `AUTHORIZATION_ERROR`   | `AuthorizationError`  | 403         |
| `NOT_FOUND`             | `NotFoundError`       | 404         |
| `CONFLICT_ERROR`        | `ConflictError`       | 409         |
| `DATABASE_ERROR`        | `DatabaseError`       | 500         |
| `INTERNAL_SERVER_ERROR` | Error genérico        | 500         |

## Entornos: Desarrollo vs Producción

El sistema se comporta diferente según la variable `NODE_ENV`:

### Desarrollo (`NODE_ENV !== "production"`)

- ✅ Stack traces completos en respuestas
- ✅ Logs detallados en consola
- ✅ Mensajes de error descriptivos

### Producción (`NODE_ENV === "production"`)

- ❌ No se exponen stack traces
- ✅ Mensajes genéricos para errores 500
- ✅ Logs mínimos

## Ejemplos por Tipo de Error

### Error de Validación

```typescript
if (!req.file) {
  throw new ValidationError("Imagen requerida");
}
```

### Error de Autenticación

```typescript
if (!token) {
  throw new AuthenticationError("Token de autenticación faltante");
}
```

### Error de Autorización

```typescript
if (!user || user.role !== "admin") {
  throw new AuthorizationError("Se requieren privilegios de administrador");
}
```

### Error Not Found

```typescript
if (result.length === 0) {
  throw new NotFoundError("Producto no encontrado");
}
```

### Error de Conflicto

```typescript
if (exists.length > 0) {
  throw new ConflictError("El producto ya existe");
}
```

### Error de Base de Datos

```typescript
try {
  await db.complexOperation();
} catch (err) {
  throw new DatabaseError("Error al procesar operación", err);
}
```

## Integración en index.ts

Los middleware de error **DEBEN** ir al final, después de todas las rutas:

```typescript
// Rutas
app.use("/products", productRouter);
app.use("/categories", categoryRouter);
app.use("/auth", authRouter);

// Error handling (AL FINAL)
app.use(logErrors);
app.use(clientErrorHandler);
app.use(errorHandler);
```

## Mejores Prácticas

1. **Siempre usa `asyncHandler`** para funciones async
2. **Lanza errores tipados** en lugar de `res.status().json()`
3. **Sé descriptivo** en los mensajes de error
4. **No captures errores** a menos que necesites transformarlos
5. **Confía en el sistema** - deja que los middleware manejen todo

## Migración de Código Existente

### Antes

```typescript
export async function myController(req: Request, res: Response) {
  try {
    const data = await someOperation();
    if (!data) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
```

### Después

```typescript
export const myController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await someOperation();

    if (!data) {
      throw new NotFoundError("Recurso no encontrado");
    }

    res.json(data);
  }
);
```

## Troubleshooting

### Los errores no se capturan

- ✅ Verifica que uses `asyncHandler`
- ✅ Asegúrate de que los middleware de error estén al final en `index.ts`

### Stack traces no aparecen en desarrollo

- ✅ Verifica que `NODE_ENV` no esté en "production"

### Los errores de Zod no se formatean

- ✅ El sistema automáticamente maneja `ZodError` en `clientErrorHandler`
