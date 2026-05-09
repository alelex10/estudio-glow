#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────
# backup.sh — Backup real vía pg_dump en Docker
# Uso: bash scripts/backup.sh [formato]
#   formato: custom (default) | plain | tar
# ──────────────────────────────────────────────────

BACKUP_DIR="$(cd "$(dirname "$0")/../backups" && pwd)"
FORMAT="${1:-custom}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Leer DATABASE_URL del .env
ENV_FILE="$(dirname "$0")/../.env"
if [ -f "$ENV_FILE" ]; then
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/^DATABASE_URL=//; s/^"//; s/"$//')
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL no está definida"
  echo "   Asegurate de tener un archivo .env en backend/"
  exit 1
fi

# pg_dump necesita conexión directa (:5432), no el pooler (:6543)
DIRECT_URL="${DATABASE_URL/:6543/:5432}"

case "$FORMAT" in
  custom)
    EXT="dump"
    FLAGS="--format=custom --compress=9"
    ;;
  plain)
    EXT="sql"
    FLAGS="--format=plain"
    ;;
  tar)
    EXT="tar"
    FLAGS="--format=tar"
    ;;
  *)
    echo "❌ Formato inválido: $FORMAT (opciones: custom, plain, tar)"
    exit 1
    ;;
esac

OUTPUT="$BACKUP_DIR/backup_${TIMESTAMP}.${EXT}"

echo "📦 Backup vía Docker (postgres:17)"
echo "   Formato: $FORMAT"
echo "   Puerto: 5432 (directo, no pooler)"
echo ""

# Solo nuestros schemas (excluye auth, storage, realtime, vault de Supabase)
SCHEMAS="--schema=public --schema=drizzle"

docker run --rm \
  -v "$BACKUP_DIR:/backups" \
  postgres:17 \
  pg_dump $FLAGS \
    --dbname="$DIRECT_URL" \
    $SCHEMAS \
    --file="/backups/$(basename "$OUTPUT")" \
    --no-owner \
    --no-acl \
    --verbose

echo ""
echo "✅ Backup completado:"
echo "   $OUTPUT"
echo "   Tamaño: $(du -h "$OUTPUT" | cut -f1)"
