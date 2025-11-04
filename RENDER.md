# Deploying to Render.com

This guide will help you deploy the Imposter Game to Render.com.

## Prerequisites

- A GitHub account
- Your code pushed to a GitHub repository
- A Render.com account (free tier works!)

## Quick Deploy (Using render.yaml)

1. **Push your code to GitHub** (if you haven't already)
   ```bash
   git add .
   git commit -m "Add Render.com deployment config"
   git push
   ```

2. **Go to [Render.com Dashboard](https://dashboard.render.com)**

3. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

4. **Configure the Service** (if not using render.yaml)
   - **Name**: `imposter-game` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && npm run build:prod`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Free (or choose a paid plan)

5. **Environment Variables** (already set in render.yaml, but you can override)
   - `NODE_ENV=production`
   - `PORT=4000` (Render will set this automatically, but good to have)

6. **Click "Create Web Service"**

7. **Wait for deployment** - Render will:
   - Install all dependencies
   - Build the client (creates `client/dist/`)
   - Start the server
   - The server will serve both the static client files and handle Socket.IO connections

8. **Access your app** - Once deployed, you'll get a URL like:
   - `https://imposter-game.onrender.com`

## How It Works

- **Single Service**: The Express server serves both:
  - Static files from `client/dist/` (your React app)
  - Socket.IO WebSocket connections
  - API endpoints (if you add any)

- **Automatic HTTPS**: Render provides SSL certificates automatically

- **Auto-Deploy**: Every push to your main branch will trigger a new deployment

## Troubleshooting

### Build fails
- Check the build logs in Render dashboard
- Make sure all dependencies are in `package.json`
- Verify Node.js version (Render uses Node 18+ by default)

### App loads but Socket.IO doesn't work
- Check browser console for connection errors
- Verify the client is connecting to the same origin (no port needed in production)
- Check Render logs for server errors

### Static files not loading
- Ensure `client/dist/` exists after build
- Check that `npm run build:prod` completes successfully
- Verify the server is configured to serve static files (already done in `server/index.js`)

### Service sleeps (Free tier)
- Render's free tier services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to a paid plan to avoid sleep

## Custom Domain

1. In your Render service settings, go to "Custom Domains"
2. Add your domain
3. Update DNS records as instructed by Render
4. SSL certificate is automatically provisioned

## Environment Variables

You can add additional environment variables in the Render dashboard:
- `VITE_SERVER_URL` - If you need to override the server URL (usually not needed)

## Updating Your App

Just push to GitHub! Render will automatically:
1. Detect the push
2. Build the new version
3. Deploy it (with zero downtime on paid plans)

---

**Need help?** Check Render's documentation: https://render.com/docs
