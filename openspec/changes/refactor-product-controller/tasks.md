# Task Breakdown: Refactor Product Controller

## Phase 1: Foundation

### Task 1.1: Crear utilidades CRUD
**File**: `backend/src/utils/crud-helpers.ts`  
**Effort**: Low  
**Dependencies**: Ninguna  

```typescript
// Funciones a implementar:
- checkExists<T>(table, id, errorMessage) → Promise<T>
- buildPaginatedQuery(table, pagination, filters) → { query, countQuery }
- successResponse<T>(data, message?) → ResponseSchema<T>
- buildConditions(filters) → SQL conditions array
```

**Verification**: Unit tests simples con mocks de drizzle

---

### Task 1.2: Crear middleware reutilizable para ID
**File**: `backend/src/middleware/params-id.ts`  
**Effort**: Low  
**Dependencies**: Ninguna  

Mover/extraer validación de ID a middleware reutilizable para uso consistente.

**Verification**: Tests de middleware

---

## Phase 2: Product Controller Refactor

### Task 2.1: Refactorizar endpoints de lectura
**File**: `backend/src/controller/product.ts`  
**Lines**: 25-182  
**Effort**: Medium  
**Dependencies**: Task 1.1, 1.2  

Refactorizar:
- `listProductsPaginated` (líneas 25-132)
- `getProduct` (líneas 134-168)
- `getNewProducts` (líneas 170-183)

**Changes**:
- Usar `checkExists()` en getProduct
- Usar `buildPaginatedQuery()` en listProductsPaginated
- Usar `successResponse()` para respuestas
- Eliminar try-catch manuales

**Verification**: Tests de integración pasan

---

### Task 2.2: Refactorizar endpoints de escritura
**File**: `backend/src/controller/product.ts`  
**Lines**: 185-266  
**Effort**: Medium  
**Dependencies**: Task 1.1, 1.2  

Refactorizar:
- `createProduct` (líneas 186-223)
- `updateProduct` (líneas 226-266)

**Changes**:
- Usar `validateParams(ParamsIdSchema)` middleware
- Usar `checkCategoryExists()` helper
- Mantener lógica de ImageUploadService (no cambiar)
- Usar `successResponse()` para respuestas

**Verification**: Upload de imagen sigue funcionando

---

### Task 2.3: Refactorizar delete y search
**File**: `backend/src/controller/product.ts`  
**Lines**: 268-320  
**Effort**: Low  
**Dependencies**: Task 1.1  

Refactorizar:
- `deleteProduct` (líneas 269-282)
- `searchProducts` (líneas 285-320)

**Changes**:
- Usar `validateParams` para delete
- Eliminar try-catch manual en search
- Usar `successResponse()`

---

## Phase 3: Consistency (Category Controller)

### Task 3.1: Aplicar helpers en category.ts
**File**: `backend/src/controller/category.ts`  
**Effort**: Low  
**Dependencies**: Task 1.1  

Aplicar `checkExists()` y `successResponse()` si reduce duplicación.

**Verification**: Category endpoints funcionan igual

---

## Phase 4: Validation

### Task 4.1: Ejecutar tests
**Command**: `npm test` (backend)  
**Effort**: Low  
**Dependencies**: Todas las tasks anteriores  

**Success Criteria**:
- [ ] Todos los tests pasan
- [ ] No hay breaking changes en API

---

### Task 4.2: Verificar líneas de código
**Command**: `wc -l backend/src/controller/product.ts`  
**Success Criteria**:
- [ ] File < 250 líneas (desde 442)

---

## Summary

| Phase | Tasks | Total Effort |
|-------|-------|--------------|
| 1. Foundation | 2 | Low |
| 2. Product Refactor | 3 | Medium |
| 3. Consistency | 1 | Low |
| 4. Validation | 2 | Low |
| **Total** | **8 tasks** | **Medium** |

## Rollback per Task

Cada task es independiente - si falla, revertir solo ese task. Git commit entre cada phase recomendado.
