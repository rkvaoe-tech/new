module.exports = {
  apps: [{
    name: 'admin-panel',
    script: 'npm',
    args: 'start',
    cwd: '/root/admin',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: '0.0.0.0'
    },
    // Настройки для стабильности
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Логи
    log_file: '/root/admin/logs/combined.log',
    out_file: '/root/admin/logs/out.log',
    error_file: '/root/admin/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Мониторинг
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.next/cache'],
    
    // Автозапуск
    autorestart: true,
  }]
}