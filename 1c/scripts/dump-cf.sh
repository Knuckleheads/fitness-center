#!/bin/bash
# dump-cf.sh - Выгрузка конфигурации в cf-файл для сравнения/объединения

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_DIR/config.env"
source "$PROJECT_DIR/secrets.env"

if [ "$DB_TYPE" = "File" ]; then
    DB_CONNECT_ARGS=(--db-path="$DB_PATH")
    DB_DISPLAY="$DB_PATH"
else
    DB_CONNECT_ARGS=(--dbms="$DB_TYPE" --db-server="$DB_SERVER" --db-name="$DB_NAME" --db-user="$DB_USER" --db-pwd="$DB_PASSWORD")
    DB_DISPLAY="$DB_SERVER/$DB_NAME"
fi

OUTPUT_FILE="${1:-config.cf}"
OUTPUT_PATH="$PROJECT_DIR/$OUTPUT_FILE"

echo "=== Выгрузка конфигурации в CF-файл ==="
echo "База: $DB_DISPLAY"
echo "Файл: $OUTPUT_PATH"
echo ""

"$IBCMD" infobase config save \
  "${DB_CONNECT_ARGS[@]}" \
  -u "$IB_USER" \
  -P "$IB_PASSWORD" \
  "$OUTPUT_PATH"

echo ""
echo "=== Выгрузка завершена ==="
echo "Файл: $OUTPUT_PATH"
