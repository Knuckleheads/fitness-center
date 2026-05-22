#!/bin/bash
# load-all.sh - Полная загрузка конфигурации из XML в 1С

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

echo "=== Полная загрузка конфигурации ==="
echo "База: $DB_DISPLAY"
echo "Источник: $SRC_DIR"
echo ""
echo "ВНИМАНИЕ: Это заменит ВСЮ конфигурацию в базе!"
echo "После применения может потребоваться реструктуризация базы данных."
echo ""

read -p "Продолжить? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Отменено"
    exit 0
fi

echo ""
echo "Загрузка конфигурации..."

"$IBCMD" infobase config import \
  "${DB_CONNECT_ARGS[@]}" \
  "${IB_AUTH_ARGS[@]}" \
  "$SRC_DIR"

echo ""
echo "=== Загрузка завершена ==="
echo ""

read -p "Применить изменения автоматически? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Применение изменений..."
    "$IBCMD" infobase config apply \
      "${DB_CONNECT_ARGS[@]}" \
      -u "$IB_USER" \
      -P "$IB_PASSWORD" \
      --force \
      --dynamic=auto \
      --session-terminate=force
    echo "Готово!"
else
    echo "Откройте конфигуратор и выполните:"
    echo "  Конфигурация -> Обновить конфигурацию базы данных (F7)"
fi
