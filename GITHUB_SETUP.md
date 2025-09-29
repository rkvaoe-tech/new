# 🚀 Настройка автоматического развертывания через GitHub Actions

## 📝 Шаг 1: Настройка GitHub Secrets

В вашем GitHub репозитории перейдите в **Settings → Secrets and variables → Actions** и добавьте:

### 🔑 Обязательные secrets:

1. **`HOST`** = `101.99.76.38`
2. **`USERNAME`** = `root`
3. **`SSH_KEY`** = (приватный SSH ключ, см. ниже)

### 🔐 SSH_KEY содержимое:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDbtsBislzy5uPYnyrx0H2ZqtFUFIRA15sXk7ddvI+hJQAAAJioj9CRqI/Q
kQAAAAtzc2gtZWQyNTUxOQAAACDbtsBislzy5uPYnyrx0H2ZqtFUFIRA15sXk7ddvI+hJQ
AAAECl1fDwQPTsVxRb0cEww8QBaelUZQvLztq/EV37l/o8Ktu2wGKyXPLm49ifKvHQfZmq
0VQUhEDXmxeTt128j6ElAAAAD3Jvb3RAZUNtbHN6aUhOQwECAwQFBg==
-----END OPENSSH PRIVATE KEY-----
```

## 🔄 Шаг 2: Как работает автодеплой

### Триггеры:
- **Push в ветку `main`** - автоматическое развертывание
- **Push в ветку `production`** - автоматическое развертывание  
- **Manual trigger** - ручной запуск через GitHub UI

### Процесс:
1. **GitHub Actions** получает код
2. **Устанавливает** Node.js 18 и зависимости
3. **Собирает** приложение (`npm run build`)
4. **Создает архив** с готовой сборкой
5. **Загружает** архив на сервер
6. **Запускает** скрипт развертывания
7. **Проверяет** статус приложения

## 🎯 Шаг 3: Тестирование

### Первый деплой:
```bash
git add .
git commit -m "feat: setup GitHub Actions deployment"
git push origin main
```

### Проверка статуса:
- Идите в **Actions** tab в GitHub репозитории
- Смотрите логи выполнения
- Проверяйте https://jliga.live

## 📊 Мониторинг

### На сервере:
```bash
pm2 status              # Статус приложения
pm2 logs admin-panel     # Логи приложения
pm2 monit               # Мониторинг в реальном времени
```

### В GitHub:
- **Actions tab** - история деплоев
- **Notifications** - уведомления об ошибках

## 🔧 Troubleshooting

### Если деплой упал:
1. Проверьте логи в GitHub Actions
2. Проверьте статус на сервере: `pm2 status`
3. Проверьте логи: `pm2 logs admin-panel`

### Откат к предыдущей версии:
```bash
cd /root
ls -la admin-backup-*    # Найти бэкап
cd /root/admin
rm -rf .next
cp -r /root/admin-backup-XXXXXX.next .next
pm2 restart admin-panel
```

## ✅ Преимущества нового процесса:

- 🚀 **Автоматический деплой** при push в main
- 🏗️ **Сборка в облаке** GitHub (не тратим память сервера)
- 📦 **Только production зависимости** на сервере
- 🔄 **Автоматические бэкапы** перед каждым деплоем
- 📊 **Проверка статуса** после развертывания
- 🔐 **Безопасность** через SSH ключи

## 🎉 Готово!

Теперь каждый push в `main` будет автоматически разворачивать новую версию на https://jliga.live
