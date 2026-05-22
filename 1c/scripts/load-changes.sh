#!/bin/bash
# load-changes.sh - Загрузка изменённых файлов в конфигурацию 1С (частичный импорт)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_DIR/config.env"
source "$PROJECT_DIR/secrets.env"

IB_AUTH_ARGS=()
if [ -n "$IB_USER" ]; then
    IB_AUTH_ARGS+=(-u "$IB_USER")
    [ -n "$IB_PASSWORD" ] && IB_AUTH_ARGS+=(-P "$IB_PASSWORD")
fi

if [ "$DB_TYPE" = "File" ]; then
    DB_CONNECT_ARGS=(--db-path="$DB_PATH")
    DB_DISPLAY="$DB_PATH"
else
    DB_CONNECT_ARGS=(--dbms="$DB_TYPE" --db-server="$DB_SERVER" --db-name="$DB_NAME" --db-user="$DB_USER" --db-pwd="$DB_PASSWORD")
    DB_DISPLAY="$DB_SERVER/$DB_NAME"
fi

cd "$PROJECT_DIR"

echo "=== Загрузка изменений в конфигурацию 1С ==="
echo "База: $DB_DISPLAY"
echo ""

CHANGED_FILES=$(git status --porcelain -- src/ | awk '{print $2}')

if [ -z "$CHANGED_FILES" ]; then
    echo "Нет изменённых файлов в src/"
    echo "Используйте load-all.sh для полной загрузки конфигурации"
    exit 0
fi

FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l)
echo "Изменено файлов: $FILE_COUNT"
echo ""
echo "Файлы для загрузки:"
echo "$CHANGED_FILES" | head -10
if [ "$FILE_COUNT" -gt 10 ]; then
    echo "... и ещё $((FILE_COUNT - 10)) файлов"
fi
echo ""

read -p "Загрузить изменения? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено"
    exit 0
fi

echo ""
echo "Загрузка..."

FILES_REL=$(echo "$CHANGED_FILES" | sed "s|^src/||")

"$IBCMD" infobase config import files \
  "${DB_CONNECT_ARGS[@]}" \
  "${IB_AUTH_ARGS[@]}" \
  --base-dir="$SRC_DIR" \
  --partial \
  $FILES_REL

echo ""
echo "=== Загрузка завершена ==="
echo ""
echo "Не забудьте применить изменения в конфигураторе:"
echo "  Конфигурация -> Обновить конфигурацию базы данных (F7)"
