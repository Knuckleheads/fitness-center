#!/bin/bash
# open-designer.sh - Открытие конфигуратора 1С

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

source "$PROJECT_DIR/config.env"
source "$PROJECT_DIR/secrets.env"

if [ "$DB_TYPE" = "File" ]; then
    DB_ARG="/F"
    DB_VAL="$DB_PATH"
    DB_DISPLAY="$DB_PATH"
else
    DB_ARG="/S"
    DB_VAL="$SERVER_1C/$DB_NAME"
    DB_DISPLAY="$SERVER_1C/$DB_NAME"
fi

echo "Запуск конфигуратора 1С..."
echo "База: $DB_DISPLAY"

EXE="${PLATFORM_PATH}/1cv8.exe"

# Запуск GUI-процесса отвязан от терминала, чтобы VS Code Task не ждал завершения 1С
IB_PASS_ARGS=(/N "$IB_USER")
[ -n "$IB_PASSWORD" ] && IB_PASS_ARGS+=(/P "$IB_PASSWORD")
"$EXE" DESIGNER "$DB_ARG" "$DB_VAL" "${IB_PASS_ARGS[@]}" &>/dev/null &
disown $!

echo "Конфигуратор запущен"
