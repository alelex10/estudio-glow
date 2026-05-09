#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────
# restore.sh — Restaurar backup vía pg_restore en Docker
# Uso: bash scripts/restore.sh <archivo.dump>
# ──────────────────────────────────────────────────

if [ $# -lt 1 ]; then
  echo "❌ Uso: bash scripts/restore.sh <archivo.dump>"
  echo ""
  echo "   Backups disponibles:"
  ls -1 "$(dirname "$0")/../backups/" 2>/dev/null || echo "   (no hay backups)"
  exit 1
fi

BACKUP_FILE="$(cd "$(dirname "$0")/.." && pwd)/$1"

# Si la ruta es absoluta, la usamos directo
if [[ "$1" = /* ]]; then
  BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Archivo no encontrado: $BACKUP_FILE"
  exit 1
fi

# Leer DATABASE_URL del .env
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/^DATABASE_URL=//; s/^"//; s/"$//')
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL no está definida"
  exit 1
fi

DIRECT_URL="${DATABASE_URL/:6543/:5432}"

BACKUP_DIR="$(dirname "$BACKUP_FILE")"
BACKUP_NAME="$(basename "$BACKUP_FILE")"

echo "⚠️  VAS A RESTAURAR: $BACKUP_NAME"
echo "   Base de destino: conexión directa"
echo ""
read -p "¿Estás seguro? (escribí 'si'): " CONFIRM

if [ "$CONFIRM" != "si" ]; then
  echo "❌ Cancelado"
  exit 1
fi

echo ""
echo "♻️  Restaurando vía Docker (postgres:17)..."
echo "   Nota: solo restaura schemas public + drizzle (tuyos)."
echo "   Los schemas auth/storage/realtime de Supabase se ignoran."
echo ""

# Solo restaurar nuestros schemas (el backup ya los filtra en backup.sh)
SCHEMAS="--schema=public --schema=drizzle"

docker run --rm \
  -v "$BACKUP_DIR":/backups \
  postgres:17 \
  pg_restore \
    --dbname="$DIRECT_URL" \
    $SCHEMAS \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --verbose \
    "/backups/$BACKUP_NAME"

echo ""
echo "✅ Restauración completada"
