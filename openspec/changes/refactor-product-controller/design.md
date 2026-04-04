# Design: Refactor Product Controller

## Technical Approach

Utility-first refactor: extraer helpers reutilizables sin cambiar la arquitectura. Mantiene compatibilidad 100% mientras reduce duplicación.

## Architecture Decisions

| Decision | Option Chosen | Alternatives | Rationale |
|----------|--------------|--------------|-----------|
| Helper location | `backend/src/utils/crud-helpers.ts` | Class-based repository | Simplicity, no OOP overhead |
| Error handling | asyncHandler everywhere | Manual try-catch | Consistency with category.ts |
| Validation | Middleware pattern | Controller validation | Separation of concerns |
| Pagination | Extract to helper | Keep inline | Reusable para otros controllers |

## Data Flow

```
Request → validateParams/validateBody → asyncHandler → 
    checkExists (helper) → buildPaginatedQuery (helper) → 
    successResponse (helper) → Response
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/utils/crud-helpers.ts` | Create | checkExists, buildPaginatedQuery, successResponse |
| `backend/src/controller/product.ts` | Modify | Refactor 442→~250 líneas, unificar patterns |
| `backend/src/controller/category.ts` | Modify | Aplicar helpers si aplica |
| `backend/src/middleware/params-id.ts` | Create | Validador reutilizable de ID |

## Interfaces

```typescript
// crud-helpers.ts
export async function checkExists<T extends Table>(
  table: T,
  id: string,
  errorMessage: string
): Promise<TableRow<T>>

export function buildPaginatedQuery<T>(
  baseQuery: any,
  params: PaginationParams,
  filters: FilterOptions
): { query: any; countQuery: any }

export function successResponse<T>(
  data: T,
  message?: string
): ResponseSchema<T>
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Helpers | Jest mocks de db queries |
| Integration | Endpoints | Supertest con DB real |
| E2E | CRUD flows | Playwright o similar |

## Migration

No migration required. Puro refactor sin cambio de lógica.

## Open Questions

- [ ] ¿Aplicar helpers también en auth.ts? (No es CRUD puro)
