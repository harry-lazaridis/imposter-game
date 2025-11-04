// PM2 ecosystem configuration
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'imposter-server',
    script: './server/index.js',
    cwd: '/var/www/imposter-game',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      HOST: '0.0.0.0'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false
  }]
};

