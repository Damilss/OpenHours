# OpenHours — Deployment Guide

This document covers how to deploy the full OpenHours stack:
- **Frontend** (Next.js) → Vercel
- **Backend** (FastAPI) → Railway
- **Database** → Supabase

---

## Prerequisites

- GitHub repo with monorepo structure (`frontend/`, `backend/`, `supabase/`)
- [Vercel account](https://vercel.com)
- [Railway account](https://railway.app)
- [Supabase account](https://supabase.com)
- OpenAI API key

---

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Database → Extensions** and enable `vector`
3. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`
4. Go to **Settings → API Keys** and copy:
   - **Publishable key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Secret key** → `SUPABASE_SERVICE_ROLE_KEY`
5. Your project URL follows the pattern:
   ```
   https://<project-id>.supabase.co
   ```

---

## 2. Backend Deployment (Railway)

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **Deploy from GitHub repo** → select your repo
3. Go to **Settings → Source** and set:
   - **Root Directory:** `/backend`
4. Go to **Settings → Deploy** and set:
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Go to **Settings → Networking** and click **Generate Domain** to get a public URL
6. Go to **Variables** and add:

```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key
FRONTEND_URL=https://www.openhours.me
```

7. Railway will auto-deploy on every push to your connected branch
8. Verify deployment by visiting:
   ```
   https://<your-service>.up.railway.app/health
   ```
   You should see: `{"status": "ok"}`

---

## 3. Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Vercel will auto-detect Next.js — no build config needed
4. Go to **Settings → Environment Variables** and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
FASTAPI_URL=https://<your-service>.up.railway.app
```

5. Hit **Deploy** — Vercel will build and deploy automatically
6. (Optional) Add a custom domain under **Settings → Domains**

---

## 4. Verify Full Stack

Once both are deployed, verify the following:

| Check | URL | Expected |
|---|---|---|
| Backend health | `https://<railway-url>/health` | `{"status": "ok"}` |
| Frontend loads | `https://www.openhours.me` | Landing page renders |
| Auth works | Sign up / log in | Redirects to dashboard |
| Upload works | Professor uploads a PDF | Returns chunk count |
| Ask works | Student asks a question | AI responds |

---

## 5. Redeployment

Both platforms redeploy automatically on every push to the connected branch.

**Manual redeploy:**
- **Vercel** → Go to project → Deployments → Redeploy
- **Railway** → Go to service → Deployments → Redeploy

---

## 6. Environment Variables Reference

### Frontend (Vercel)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key (safe for browser) |
| `FASTAPI_URL` | Railway backend public URL |

### Backend (Railway)

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for embeddings + chat |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (bypasses RLS) |
| `FRONTEND_URL` | Frontend URL for CORS allowlist |

---

## 7. Common Issues

**Railway build fails**
- Make sure Root Directory is set to `/backend`
- Check that `requirements.txt` exists in `backend/`
- Check build logs for missing dependencies

**CORS errors in browser**
- Make sure `FRONTEND_URL` in Railway matches your exact Vercel/custom domain
- Include `https://` in the URL

**Backend env vars missing**
- Railway will throw a `RuntimeError` on startup if `OPENAI_API_KEY`, `SUPABASE_URL`, or `SUPABASE_SERVICE_ROLE_KEY` are missing
- Check Railway logs under **Deployments → View Logs**

**Supabase pgvector errors**
- Make sure the `vector` extension is enabled in Supabase
- Make sure `supabase/schema.sql` was run in full

---

*OpenHours — openhours.me*
