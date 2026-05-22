#!/bin/bash
# dump-config.sh - Выгрузка конфигурации из базы 1С в XML файлы

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MODE="auto"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --full|-f) MODE="full"; shift ;;
        --sync|-s) MODE="sync"; shift ;;
        --help|-h)
            echo "Использование: $(basename "$0") [--full|--sync]"
            echo "  --full  Полная выгрузка конфигурации"
            echo "  --sync  Только инкрементальная выгрузка (требует ConfigDumpInfo.xml)"
            echo "  По умолчанию: авто-режим"
            exit 0 ;;
        *)
            echo "Неизвестный аргумент: $1"
            exit 1 ;;
    esac
done

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

CONFIG_DUMP_INFO="$SRC_DIR/ConfigDumpInfo.xml"

echo "=== Выгрузка конфигурации ==="
echo "База: $DB_DISPLAY"
echo "Каталог: $SRC_DIR"
echo ""

mkdir -p "$SRC_DIR"

if [ "$MODE" = "full" ]; then
    USE_SYNC=0
elif [ "$MODE" = "sync" ]; then
    USE_SYNC=1
elif [ -f "$CONFIG_DUMP_INFO" ]; then
    USE_SYNC=1
else
    USE_SYNC=0
fi

if [ "$USE_SYNC" -eq 1 ]; then
    echo "[INFO] Режим выгрузки: инкрементальный (--sync)"
else
    echo "[INFO] Режим выгрузки: полный"
    if [ "$MODE" = "auto" ] && [ ! -f "$CONFIG_DUMP_INFO" ]; then
        echo "[INFO] Файл ConfigDumpInfo.xml не найден, выполняется первая полная выгрузка."
    fi
fi
echo ""

EXPORT_ARGS=(
  infobase config export
  "${DB_CONNECT_ARGS[@]}"
  "${IB_AUTH_ARGS[@]}"
  --threads="$THREADS"
)

if [ "$USE_SYNC" -eq 1 ]; then
    EXPORT_ARGS+=(--sync)
fi

EXPORT_ARGS+=("$SRC_DIR")

"$IBCMD" "${EXPORT_ARGS[@]}"

echo ""
echo "=== Выгрузка завершена ==="
