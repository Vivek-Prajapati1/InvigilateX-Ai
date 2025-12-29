# 🚀 Render Deployment Guide

## Backend Deployment on Render

### Step 1: Push Code to GitHub
Make sure your code is pushed to a GitHub repository.

### Step 2: Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the backend folder or root directory

### Step 3: Configure Build Settings
- **Name**: `invigilatex-ai-backend` (or your choice)
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)
- **Root Directory**: `backend` (if backend is in a subfolder)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` or `node server.js`

### Step 4: Add Environment Variables
In Render dashboard, add these environment variables:

```
NODE_ENV=production
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_jwt_secret_key
FRONTEND_URL=https://invigilate-x-ai.vercel.app
```

**Important Notes:**
- Get `MONGO_URI` from MongoDB Atlas (make sure to whitelist `0.0.0.0/0` for Render IPs)
- Generate a strong `JWT_SECRET` (use: `openssl rand -base64 32`)
- Set `FRONTEND_URL` to your Vercel frontend URL

### Step 5: Deploy
Click "Create Web Service" and wait for deployment to complete.

### Step 6: Get Backend URL
After deployment, copy your backend URL (e.g., `https://invigilatex-ai.onrender.com`)

---

## Frontend Configuration

### Update Frontend `.env` file:
```env
VITE_BACKEND_API_URL=https://your-backend-url.onrender.com
```

### Redeploy Frontend on Vercel
```bash
cd frontend
git add .
git commit -m "Update backend URL"
git push
```

Vercel will auto-deploy the changes.

---

## Troubleshooting

### CORS Issues
If you see CORS errors:
1. Make sure frontend URL is added to backend CORS allowedOrigins
2. Check Render logs for CORS blocked messages
3. Verify credentials: true is set in both frontend and backend

### Database Connection Issues
- Check MongoDB Atlas IP whitelist (should include `0.0.0.0/0`)
- Verify MONGO_URI is correct in Render environment variables
- Check Render logs for connection errors

### 500/404 Errors
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set correctly
- Make sure npm packages are installed properly

---

## Testing Deployment

### Test Backend Health:
```bash
curl https://your-backend-url.onrender.com
# Should return: "API Server is Running"
```

### Test API Endpoint:
```bash
curl https://your-backend-url.onrender.com/api/users
```

### Check Logs:
- Go to Render Dashboard → Your Service → Logs
- Monitor for errors or connection issues

---

## Important Backend CORS Settings

Your backend `server.js` now allows these origins:
- `http://localhost:5173` (local frontend dev)
- `http://localhost:5174` (alternative local port)
- `https://invigilate-x-ai.vercel.app` (Vercel production)
- `https://invigilatex-ai.onrender.com` (Render backend)
- Environment variable: `FRONTEND_URL`

---

## Free Tier Limitations (Render)

⚠️ **Render Free Tier Spins Down After Inactivity**
- Your service will spin down after 15 minutes of inactivity
- First request after spin-down takes ~30-50 seconds to wake up
- Subsequent requests are fast

**Solution for Spin-Down:**
- Upgrade to paid tier ($7/month)
- Use cron job to ping server every 10 minutes
- Accept the delay on first request

---

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Database Access → Add User (save username/password)
4. Network Access → Add IP → `0.0.0.0/0` (allow from anywhere)
5. Connect → Connect Your Application → Copy connection string
6. Replace `<password>` with your password
7. Add to Render environment variables as `MONGO_URI`

---

## Quick Commands

### View Render Logs:
```bash
# From Render Dashboard
Dashboard → Your Service → Logs
```

### Restart Render Service:
```bash
# From Render Dashboard
Dashboard → Your Service → Manual Deploy → Deploy latest commit
```

### Check Backend Status:
```bash
curl https://your-backend-url.onrender.com
```

---

## Contact & Support

If you face any issues:
1. Check Render logs first
2. Verify all environment variables
3. Test API endpoints using Postman/curl
4. Check MongoDB Atlas connection

Good luck with your deployment! 🎉
