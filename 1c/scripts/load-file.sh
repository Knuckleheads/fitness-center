#!/bin/bash
# load-file.sh - Загрузка одного файла в конфигурацию 1С (частичный импорт)
#
# Использование:
#   ./scripts/load-file.sh src/CommonModules/ИмяМодуля/Ext/Module.bsl
#
# VS Code Task передаёт путь текущего файла: ${workspaceFolder}/scripts/load-file.sh ${file}

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

FILE_ARG="${1:-}"

if [ -z "$FILE_ARG" ]; then
    echo "Использование: load-file.sh <путь/к/файлу>"
    echo "Пример: load-file.sh src/CommonModules/ИмяМодуля/Ext/Module.bsl"
    exit 1
fi

# Привести к абсолютному пути
if [[ "$FILE_ARG" != /* && "$FILE_ARG" != ?:* ]]; then
    FILE_ABS="$PROJECT_DIR/$FILE_ARG"
else
    FILE_ABS="$FILE_ARG"
fi

# Нормализовать разделители (Windows -> Unix)
FILE_ABS="${FILE_ABS//\\//}"

if [ ! -f "$FILE_ABS" ]; then
    echo "Ошибка: файл не найден: $FILE_ABS"
    echo "Пример: src/CommonModules/ИмяМодуля/Ext/Module.bsl"
    exit 1
fi

SRC_DIR_NORM="${SRC_DIR//\\//}"

case "$FILE_ABS" in
    "$SRC_DIR_NORM"/*) ;;
    *)
        echo "Ошибка: файл должен находиться внутри каталога src."
        echo "Передан файл: $FILE_ABS"
        exit 1 ;;
esac

case "$FILE_ABS" in
    *.bsl) ;;
    *)
        echo "Ошибка: поддерживаются только файлы модулей 1С с расширением .bsl."
        echo "Передан файл: $FILE_ABS"
        exit 1 ;;
esac

FILE_REL="${FILE_ABS#$SRC_DIR_NORM/}"

echo "=== Загрузка файла в 1С ==="
echo "База: $DB_DISPLAY"
echo "Файл: $FILE_REL"
echo ""

"$IBCMD" infobase config import files \
  "${DB_CONNECT_ARGS[@]}" \
  "${IB_AUTH_ARGS[@]}" \
  --base-dir="$SRC_DIR" \
  --partial \
  "$FILE_REL"

echo ""
echo "Применение конфигурации..."

"$IBCMD" infobase config apply \
  "${DB_CONNECT_ARGS[@]}" \
  "${IB_AUTH_ARGS[@]}" \
  --force \
  --dynamic=auto \
  --session-terminate=force

echo ""
echo "=== Готово ==="
echo "Изменения применены. Можно открывать конфигуратор или клиент."
