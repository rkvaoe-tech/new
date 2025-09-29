# Инструкция по развертыванию Admin Panel

## Локальная сборка

1. Установить зависимости:
```bash
npm install
```

2. Собрать приложение:
```bash
npm run build
```

3. Создать архив с готовой сборкой:
```bash
tar -czf admin-build.tar.gz .next package.json package-lock.json public next.config.js
```

## Развертывание на сервере

1. Загрузить архив на сервер в `/root/admin/`

2. Распаковать:
```bash
cd /root/admin
tar -xzf admin-build.tar.gz
```

3. Установить только production зависимости:
```bash
npm ci --only=production
```

4. Запустить через PM2:
```bash
pm2 start ecosystem.config.js
```

## Переменные окружения

Убедитесь, что на сервере настроены файлы:
- `.env.local`
- `.env`

## Порты

- Production: 3000
- Nginx проксирует с 80/443 на 3000
