# Deployment Guide

This guide covers deploying the Imposter Game to production servers.

## Table of Contents
1. [Build for Production](#build-for-production)
2. [Option A: VPS/Cloud Server (Ubuntu/Debian)](#option-a-vpscloud-server)
3. [Option B: Railway](#option-b-railway)
4. [Option C: Render](#option-c-render)
5. [Option D: Heroku](#option-d-heroku)
6. [Option E: DigitalOcean App Platform](#option-e-digitalocean-app-platform)
7. [Environment Variables](#environment-variables)
8. [SSL/HTTPS Setup](#sslhttps-setup)

---

## Build for Production

First, build the client for production:

```bash
cd client
npm run build
```

This creates a `client/dist/` folder with optimized production files.

---

## Option A: VPS/Cloud Server

Recommended for full control. Works with AWS EC2, DigitalOcean Droplets, Linode, etc.

### Step 1: Server Setup

**On your Ubuntu/Debian server:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx (for serving static files and reverse proxy)
sudo apt install -y nginx
```

### Step 2: Upload Code

**Option 2a: Using Git (recommended)**
```bash
# On server
cd /var/www
sudo git clone YOUR_REPO_URL imposter-game
cd imposter-game
sudo npm run install:all
cd client && npm run build
```

**Option 2b: Using SCP/SFTP**
```bash
# From your local machine
scp -r . user@your-server:/var/www/imposter-game

# Then on server
cd /var/www/imposter-game
npm run install:all
cd client && npm run build
```

### Step 3: Configure Environment

```bash
# On server, create .env file
cd /var/www/imposter-game/server
nano .env
```

Add:
```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
```

For client, create `client/.env.production`:
```env
VITE_SERVER_URL=https://yourdomain.com
```

### Step 4: Start with PM2

```bash
cd /var/www/imposter-game/server
pm2 start index.js --name imposter-server
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

### Step 5: Nginx Configuration

Create `/etc/nginx/sites-available/imposter-game`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Serve static files from built client
    root /var/www/imposter-game/client/dist;
    index index.html;

    # Client routes (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Socket.IO and API proxy
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/imposter-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Option B: Railway

Railway is great for quick deployments with minimal setup.

### Step 1: Prepare for Railway

Create `railway.json` in project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Step 2: Add Production Scripts

Update root `package.json`:
```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "start:prod": "cd server && npm install && npm start"
  }
}
```

### Step 3: Deploy

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=4000`
5. Railway will auto-deploy

**Note:** You'll need to configure the client to point to Railway's server URL, or deploy client separately to a static host.

---

## Option C: Render

Render supports both static sites and web services.

### Step 1: Deploy Server

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Environment:** Node
   - **Environment Variables:**
     - `NODE_ENV=production`
     - `PORT=4000`

### Step 2: Deploy Client

1. New → Static Site
2. Settings:
   - **Build Command:** `cd client && npm install && npm run build`
   - **Publish Directory:** `client/dist`
   - **Environment Variables:**
     - `VITE_SERVER_URL=https://your-server.onrender.com`

---

## Option D: Heroku

### Step 1: Install Heroku CLI

```bash
# Install Heroku CLI (see heroku.com for latest)
```

### Step 2: Create Procfile

Create `Procfile` in root:
```
web: cd server && npm start
```

### Step 3: Deploy

```bash
heroku login
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

For client, use Heroku's static buildpack or deploy separately.

---

## Option E: DigitalOcean App Platform

1. Go to DigitalOcean → App Platform
2. Create App → GitHub
3. Configure:
   - **Type:** Web Service
   - **Build Command:** `cd server && npm install`
   - **Run Command:** `cd server && npm start`
   - **Environment Variables:** Add production vars

Deploy client as separate static site or use DO Spaces with CDN.

---

## Environment Variables

### Server (.env)
```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
```

### Client (.env.production)
```env
VITE_SERVER_URL=https://your-server-domain.com
```

**Note:** Vite environment variables must be prefixed with `VITE_` and are embedded at build time.

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended - Free)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Using Cloudflare (Free)

1. Add your domain to Cloudflare
2. Update DNS nameservers
3. Enable SSL/TLS: Full (strict)
4. Cloudflare handles SSL automatically

---

## Useful Commands

### PM2 Management
```bash
pm2 list              # List processes
pm2 restart imposter-server
pm2 stop imposter-server
pm2 logs imposter-server
pm2 monit            # Monitor dashboard
```

### Nginx
```bash
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload config
sudo systemctl restart nginx     # Restart
```

### Updates
```bash
# Pull latest code
cd /var/www/imposter-game
git pull
cd client && npm run build
cd ../server
pm2 restart imposter-server
```

---

## Troubleshooting

### Server won't start
- Check logs: `pm2 logs imposter-server`
- Verify port isn't in use: `sudo lsof -i :4000`
- Check environment variables

### Static files not loading
- Verify `client/dist` exists and has files
- Check Nginx root path
- Check file permissions: `sudo chown -R www-data:www-data /var/www/imposter-game/client/dist`

### Socket.IO connection fails
- Verify proxy_pass in Nginx is correct
- Check WebSocket headers in Nginx config
- Ensure server is running: `pm2 list`

### SSL issues
- Verify certificates: `sudo certbot certificates`
- Check certificate expiration
- Test SSL: [SSL Labs](https://www.ssllabs.com/ssltest/)

---

## Production Checklist

- [ ] Build client: `cd client && npm run build`
- [ ] Set production environment variables
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up SSL/HTTPS
- [ ] Configure firewall (open ports 80, 443)
- [ ] Set up PM2 or similar process manager
- [ ] Configure automatic restarts
- [ ] Set up monitoring/logging
- [ ] Test on mobile devices
- [ ] Test socket connections
- [ ] Set up backups (if using database in future)

---

## Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

