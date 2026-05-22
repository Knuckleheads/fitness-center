#!/bin/bash
# find-object.sh - Поиск объекта конфигурации по имени и открытие в VS Code
#
# Использование:
#   ./scripts/find-object.sh ИмяОбъекта
#   ./scripts/find-object.sh ОбщийМодуль        # ищет Module.bsl
#   ./scripts/find-object.sh ФормаДокумента      # ищет Form.xml + Module.bsl
#   ./scripts/find-object.sh "ИмяМодуля" --bsl   # только .bsl файлы

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$PROJECT_DIR/src"

QUERY="${1:-}"
FILTER="${2:-}"

if [ -z "$QUERY" ]; then
    echo "Использование: find-object.sh <ИмяОбъекта> [--bsl|--xml]"
    echo ""
    echo "Примеры:"
    echo "  ./scripts/find-object.sh Клиенты"
    echo "  ./scripts/find-object.sh ОбщийМодуль --bsl"
    exit 1
fi

echo "=== Поиск объекта: $QUERY ==="
echo ""

if [ "$FILTER" = "--bsl" ]; then
    RESULTS=$(find "$SRC_DIR" -iname "*.bsl" -path "*$QUERY*" 2>/dev/null)
elif [ "$FILTER" = "--xml" ]; then
    RESULTS=$(find "$SRC_DIR" -iname "*.xml" -path "*$QUERY*" 2>/dev/null)
else
    RESULTS=$(find "$SRC_DIR" \( -iname "*.bsl" -o -iname "*.xml" \) -path "*$QUERY*" 2>/dev/null | grep -v "ConfigDumpInfo")
fi

if [ -z "$RESULTS" ]; then
    echo "Ничего не найдено для: $QUERY"
    echo ""
    echo "Попробуйте поиск по части имени:"
    find "$SRC_DIR" -maxdepth 3 -type d -iname "*$QUERY*" 2>/dev/null | head -10
    exit 0
fi

COUNT=$(echo "$RESULTS" | wc -l)
echo "Найдено файлов: $COUNT"
echo ""
echo "$RESULTS" | nl -ba

echo ""

if [ "$COUNT" -eq 1 ]; then
    FILE="$RESULTS"
    echo "Открываю: $FILE"
    code "$FILE" 2>/dev/null || echo "VS Code не запущен. Путь: $FILE"
    exit 0
fi

echo "Введите номер файла для открытия (Enter — пропустить):"
read -r CHOICE
if [ -n "$CHOICE" ] && [ "$CHOICE" -gt 0 ] 2>/dev/null; then
    FILE=$(echo "$RESULTS" | sed -n "${CHOICE}p")
    if [ -n "$FILE" ]; then
        echo "Открываю: $FILE"
        code "$FILE" 2>/dev/null || echo "VS Code не запущен. Путь: $FILE"
    fi
fi
