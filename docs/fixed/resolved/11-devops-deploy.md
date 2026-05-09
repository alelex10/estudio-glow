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
