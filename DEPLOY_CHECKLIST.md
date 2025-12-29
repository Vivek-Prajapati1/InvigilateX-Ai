# 🚀 Render Deployment Checklist

## Recent Code Changes That Need to Be Deployed:

### 1. Backend CORS Configuration Updated
- Added Render backend URL to allowed origins
- Added dynamic FRONTEND_URL support
- File: `backend/server.js`

### 2. Coding Controller Fixed
- Now queries CodingQuestion collection properly
- Backward compatibility with exam embedded questions
- File: `backend/controllers/codingController.js`

### 3. Authentication Fixed
- Added `withCredentials: true` to coding question fetch
- File: `frontend/src/views/student/Coder.jsx`

---

## Step-by-Step Deployment Guide:

### ✅ Step 1: Commit All Changes
```bash
cd /Users/gulshan36/Desktop/InvigilateX-Ai
git add .
git commit -m "Fix: CORS configuration, coding controller, and authentication"
```

### ✅ Step 2: Push to GitHub
```bash
git push origin main
```

### ✅ Step 3: Configure Render Environment Variables
Go to Render Dashboard → Your Service → Environment

**Required Environment Variables:**
```
NODE_ENV=production
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://invigilate-x-ai.vercel.app
```

**Important:** Make sure `FRONTEND_URL` is set!

### ✅ Step 4: Trigger Render Deployment
- **Option A:** Automatic (if connected to GitHub)
  - Render will auto-deploy after you push
  - Wait 2-5 minutes for build

- **Option B:** Manual Deploy
  - Go to Render Dashboard
  - Click "Manual Deploy" → "Deploy latest commit"

### ✅ Step 5: Wait for Deployment
- Check Render logs for any errors
- Look for: `🚀 Server running on 0.0.0.0:5001`
- Look for: `MongoDB Connected:`

### ✅ Step 6: Test Backend API
```bash
# Test root endpoint
curl https://invigilatex-ai.onrender.com

# Test coding endpoint (needs authentication)
curl https://invigilatex-ai.onrender.com/api/coding/question/exam/YOUR_EXAM_ID
```

### ✅ Step 7: Deploy Frontend (Vercel)
If you made frontend changes:
```bash
cd frontend
git add .
git commit -m "Update: Frontend fixes"
git push origin main
```

Vercel will auto-deploy.

### ✅ Step 8: Clear Browser Cache
- Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
- Or clear browser cache completely

### ✅ Step 9: Test End-to-End
1. Login to your app
2. Navigate to coding exam page
3. Check browser console for errors
4. Verify coding questions load properly

---

## 🔍 Troubleshooting:

### Error: "CORS blocked"
**Solution:**
- Make sure `FRONTEND_URL` is set in Render environment variables
- Check Render logs for "CORS blocked origin: ..."
- Verify frontend URL matches exactly in CORS config

### Error: "No coding question found"
**Solution:**
- Check if coding questions exist in database
- Verify examId is correct
- Check Render logs for database query results

### Error: "401 Unauthorized"
**Solution:**
- Clear browser cookies
- Login again
- Check if JWT token is being sent with requests

### Render Service Not Waking Up
**Solution:**
- Render free tier spins down after 15 minutes
- First request takes 30-50 seconds to wake up
- Just wait and reload the page

---

## 📝 Current Status:

- ✅ Backend code fixed locally
- ✅ Frontend configured for Render URL
- ⏳ **NEEDS DEPLOYMENT:** Code changes not yet on Render
- ⏳ **NEEDS TESTING:** After deployment

---

## 🎯 Quick Deploy Command:

```bash
cd /Users/gulshan36/Desktop/InvigilateX-Ai
git add .
git commit -m "Fix: CORS, coding controller, and auth"
git push origin main
```

Then wait 2-5 minutes for Render to auto-deploy! 🚀
