# Proposal: Refactor Product Controller

## Intent
Eliminar duplicación de código e inconsistencias en `backend/src/controller/product.ts` (442 líneas). Unificar patrones con `category.ts` para mejorar mantenibilidad y reducir errores.

## Scope

### In Scope
- Extraer funciones helper reutilizables (checkExists, buildQuery)
- Unificar uso de asyncHandler (eliminar try-catch manuales)
- Estandarizar validación con middleware (validateParams/validateBody)
- Crear utilidad de respuesta estandarizada
- Refactorizar paginación a helper reutilizable

### Out of Scope
- Cambiar lógica de negocio
- Modificar endpoints o contratos de API
- Agregar nuevas features
- Refactorizar otros controllers (solo se usará como referencia)

## Approach
**C) Utility Functions + D) Consistency (híbrido)**

Crear helpers específicos en `backend/src/utils/crud-helpers.ts` para patrones repetidos, manteniendo la estructura actual sin introducir abstracciones complejas (clases base o repositorios).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/controller/product.ts` | Modified | Refactorizar 442 líneas a ~250 líneas |
| `backend/src/utils/crud-helpers.ts` | New | Funciones checkExists, buildPaginatedQuery |
| `backend/src/controller/category.ts` | Modified | Aplicar mismos helpers si aplica |
| `backend/src/middleware/validation.ts` | Modified | Posible validador de ID reutilizable |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking change en API | Low | Mantener mismos contratos, solo refactor interna |
| Regresión en búsqueda/filtros | Medium | Tests de integración antes del cambio |
| Imagen upload en update | Low | Mantener lógica existente, solo extraer helpers |

## Rollback Plan
Git revert del commit de refactor. Los cambios son puros refactor sin lógica nueva.

## Dependencies
- Tests existentes (si hay) para validar comportamiento

## Success Criteria
- [ ] Product.ts reducido a < 250 líneas
- [ ] Todos los métodos usan asyncHandler consistentemente
- [ ] Validación unificada via middleware
- [ ] Sin try-catch manuales en controller
- [ ] Tests pasan (si existen)
