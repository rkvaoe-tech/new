#!/bin/bash

# Скрипт развертывания Admin Panel для CI/CD
# Использование: ./deploy.sh [путь_к_архиву]

set -e

ADMIN_DIR="/root/admin"
BACKUP_DIR="/root/admin-backup-$(date +%Y%m%d_%H%M%S)"
DEPLOY_USER="github-actions"

echo "🚀 Начинаем развертывание Admin Panel..."
echo "📅 Время: $(date)"
echo "👤 Пользователь: $(whoami)"

# Создаем бэкап текущей версии
if [ -d "$ADMIN_DIR/.next" ]; then
    echo "📦 Создаем бэкап текущей версии..."
    cp -r "$ADMIN_DIR/.next" "$BACKUP_DIR.next" 2>/dev/null || true
    echo "✅ Бэкап создан: $BACKUP_DIR.next"
fi

# Останавливаем PM2
echo "🛑 Останавливаем PM2..."
pm2 stop admin-panel || true

# Если передан архив, распаковываем его
if [ "$1" ]; then
    echo "📥 Распаковываем новую сборку: $1"
    cd "$ADMIN_DIR"
    
    # Удаляем старую сборку
    rm -rf .next 2>/dev/null || true
    
    # Распаковываем новую
    tar -xzf "$1"
    
    # Проверяем что сборка корректная
    if [ ! -f ".next/BUILD_ID" ]; then
        echo "❌ Ошибка: Некорректная сборка (нет BUILD_ID)"
        exit 1
    fi
    
    echo "✅ Сборка распакована, BUILD_ID: $(cat .next/BUILD_ID)"
fi

# Устанавливаем только production зависимости
echo "📦 Устанавливаем production зависимости..."
cd "$ADMIN_DIR"
npm ci --only=production --silent

# Проверяем middleware
if [ -f "src/middleware.ts" ]; then
    echo "🔧 Middleware найден и будет использован"
elif [ -f "src/middleware.ts.backup" ]; then
    echo "🔧 Восстанавливаем middleware из бэкапа..."
    mv src/middleware.ts.backup src/middleware.ts
fi

# Запускаем через PM2
echo "🚀 Запускаем через PM2..."
pm2 start ecosystem.config.js

# Ждем запуска приложения
echo "⏳ Ждем запуска приложения..."
sleep 5

# Проверяем статус
echo "📊 Статус приложения:"
pm2 list

# Проверяем доступность
echo "🔍 Проверяем доступность приложения..."
if curl -f -s http://localhost:3000 >/dev/null; then
    echo "✅ Приложение отвечает на localhost:3000"
else
    echo "⚠️  Предупреждение: Приложение не отвечает на localhost:3000"
    pm2 logs admin-panel --lines 10
fi

echo "✅ Развертывание завершено!"
echo "🌐 Приложение доступно на:"
echo "   - https://jliga.live"
echo "   - http://localhost:3000"
echo "📊 Статистика памяти:"
pm2 monit --no-colors | grep admin-panel | head -1 || echo "PM2 мониторинг недоступен"
