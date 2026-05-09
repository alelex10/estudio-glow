# Database Backup & Restore

Estrategia de backup para la base de datos PostgreSQL en Supabase.

## Herramientas utilizadas

| Herramienta | Rol |
|---|---|
| **Docker** | Ejecuta `postgres:17` sin instalar PostgreSQL en tu máquina |
| **pg_dump** | Herramienta oficial de PostgreSQL para exportar la base de datos |
| **pg_restore** | Herramienta oficial de PostgreSQL para restaurar un backup custom |
| **Bash** | Orquesta los comandos, lee el `.env`, maneja archivos |

Ninguna de estas herramientas se instala en tu sistema. Docker baja la imagen `postgres:17` que ya incluye `pg_dump` y `pg_restore`. 

## Requisito

Solo necesitás **Docker**. El script usa `postgres:17` automáticamente, no importa qué versión de pg_dump tengas instalada en tu máquina.

## Comandos

```bash
# Backup custom (comprimido, restorable, recomendado)
bun run backup

# Backup en SQL plano (legible, pesado)
bun run backup:plain

# Restaurar un backup custom
bun run restore backups/backup_20260509_XXXXXX.dump
```

Los archivos se guardan en `backups/` con timestamp.

## Formato custom vs plain

| Formato | Extensión | Compresión | Restorable | Legible |
|---|---|---|---|---|
| `custom` (default) | `.dump` | ✅ gzip nivel 9 | ✅ `pg_restore` | ❌ binario |
| `plain` | `.sql` | ❌ | ✅ `psql` | ✅ texto |

Usá **custom** para backups de rutina. Usá **plain** si querés inspeccionar o commitear el dump.

## Cómo funciona

1. Lee `DATABASE_URL` del `.env`
2. Reemplaza el puerto pooler (`:6543`) por el puerto directo (`:5432`) — pg_dump necesita conexión directa
3. Corre `pg_dump` dentro de un contenedor Docker con `postgres:17`
4. Filtra solo los schemas `public` y `drizzle` (excluye `auth`, `storage`, `realtime`, `vault` de Supabase)
5. Guarda el archivo en `backups/`

## Restaurar

El restore **pisa SOLO tus tablas** (public + drizzle). Los schemas de Supabase no se tocan.

Te va a pedir confirmación antes de ejecutar:

```bash
bun run restore backups/backup_20260509_144938.dump
```

Usa `--clean --if-exists` para dropear objetos existentes antes de recrearlos.

## Buenas prácticas

- Hacé un backup **antes de cualquier migración o limpieza masiva**
- No commitear backups grandes al repo (`.dump` > 1MB)
- Si necesitás compartir un backup, comprimilo con `gzip` aparte
- Para un backup completo de toda la DB (incluyendo auth/storage), usá el Dashboard de Supabase

## Troubleshooting

| Problema | Causa | Solución |
|---|---|---|
| `server version mismatch` | pg_dump local no coincide con Supabase | El script ya lo resuelve usando Docker |
| `no route to host` | Puerto pooler (`:6543`) en vez de directo | El script ya lo resuelve automáticamente |
| `FATAL: password authentication failed` | .env desactualizado | Verificar DATABASE_URL en Supabase Dashboard |
| `must be owner of table` en auth/storage | Son schemas de Supabase, no los tuyos | Ignorar — es normal, el restore solo afecta `public.*` |
