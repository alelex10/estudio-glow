# Issues resueltos de DevOps & Deploy

> Espejo de [`11-devops-deploy.md`](../improvements/11-devops-deploy.md) — issues resueltos.

---

### ✅ [CRÍTICO] Docker eliminado del proyecto

**Issue original**: Issue #5 — Dockerfile de backend corría `bun run dev` (watch mode en producción), docker-compose exponía `.env` vía bind-mount, corría como root, sin HEALTHCHECK.

**Solución**: Eliminados todos los archivos Docker del proyecto:
- 🗑️ `backend/Dockerfile`
- 🗑️ `backend/docker-compose.yml`
- 🗑️ `frontend/Dockerfile.bun`
- 🗑️ `frontend/.dockerignore`
- ✏️ `frontend/README.md` (removida sección "Docker Deployment")

---

### ✅ [ALTO] `.env.example` creado para backend y frontend

**Issue original**: Issue #1 (original) — no existía ningún `.env.example` en el proyecto. Las variables necesarias estaban dispersas entre código, schema Zod y `.env` real.

**Solución**: Creados dos archivos con todas las variables documentadas, agrupadas por categoría, con ejemplos y comentarios:

| Archivo | Variables incluidas |
|---|---|
| `backend/.env.example` | NODE_ENV, DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, CLOUDINARY_* (3), MP_ACCESS_TOKEN, WEBHOOK_URL, FRONTEND_URL, FRONTEND_URL_PREVIEW, SEED_DEFAULT_PASSWORD |
| `frontend/.env.example` | VITE_API_BASE_URL, API_BASE_URL, VITE_GOOGLE_CLIENT_ID, SESSION_SECRET |

**Archivos**: `backend/.env.example` (NUEVO), `frontend/.env.example` (NUEVO).
