# backend

## Setup

```bash
bun install
bun run dev
```

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `bun run dev` | Dev con watch |
| `bun run start` | Producción |
| `bun run generate` | Drizzle Kit: genera migración |
| `bun run migrate` | Ejecuta migraciones |
| `bun run seed` | Pobla DB con datos iniciales |
| `bun run backup` | Backup de la base de datos vía Docker |
| `bun run restore` | Restaurar un backup |

## Documentación

- [Backup & Restore](docs/database-backup.md) — cómo respaldar y restaurar la base de datos
