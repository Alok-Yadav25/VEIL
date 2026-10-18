# VEIL — Free Cloud Deployment Guide

This guide details the best 100% free hosting options to deploy the entire **VEIL** platform (React frontend, Spring Boot 3 Java 21 backend, and embedded SQLite).

---

## Architecture Overview

VEIL is pre-configured with two deployment modes:
1. **Unified Monolith (Recommended):** The multi-stage [`Dockerfile`](file:///Users/alokyadav/Desktop/image_detail/Dockerfile) builds the React frontend and embeds it directly into Spring Boot's static resources. **A single free container serves both the web UI and REST API on one domain with zero CORS setup.**
2. **Split Deployment:** Deploy the frontend static SPA to **Vercel / Cloudflare Pages** (global edge CDN, instant load) and the backend to **Render / Koyeb**.

---

## Option 1: Render.com (Recommended — Simplest 1-Click Setup)

Render offers a generous **Free Web Service** tier (512 MB RAM, free SSL, custom domain, automated GitHub CI/CD).

### Steps to Deploy:
1. Push your project to a GitHub or GitLab repository.
2. Sign up / log in to [render.com](https://render.com).
3. Click **New +** $\to$ **Blueprint** (or **Web Service**):
   - **Using the included [`render.yaml`](file:///Users/alokyadav/Desktop/image_detail/render.yaml):** Select your repository. Render will automatically read `render.yaml` and configure the Docker build.
   - **Manual Web Service Setup:**
     - **Runtime:** `Docker`
     - **Dockerfile Path:** `./Dockerfile`
     - **Instance Type:** `Free`
     - **Health Check Path:** `/api/v1/health`
4. Click **Create Web Service**.
5. Once built (approx. 2–3 minutes), your app will be live at `https://veil-steganography.onrender.com`.

> [!NOTE]
> On Render's free tier, containers spin down after 15 minutes of inactivity. When a new request arrives, it takes ~30–50 seconds to wake up (cold start). Once awake, it runs with full performance.

---

## Option 2: Hugging Face Spaces (Best for Zero Cold Starts & 16GB RAM)

Hugging Face provides **free Docker Spaces** with **16 GB RAM and 2 vCPUs** that **never sleep** and are 100% free forever.

### Steps to Deploy:
1. Create a free account at [huggingface.co](https://huggingface.co).
2. Go to **Spaces** $\to$ click **Create new Space**.
3. Choose:
   - **Space SDK:** `Docker` $\to$ `Blank`
   - **Space hardware:** `CPU Basic · 2 vCPU · 16 GB RAM · Free`
4. Clone the space repository or push your existing repo:
   ```bash
   git remote add hf https://huggingface.co/spaces/<your-username>/<your-space-name>
   git push hf main
   ```
5. Hugging Face will automatically execute the [`Dockerfile`](file:///Users/alokyadav/Desktop/image_detail/Dockerfile), launch the container, and serve your app at `https://<your-username>-<your-space-name>.hf.space`.

---

## Option 3: Koyeb (Always-On Free Eco Tier)

Koyeb offers a **Free Eco Tier** (512 MB RAM, 0.1 vCPU, 2GB SSD) in Frankfurt (EU) or Washington (US) with **zero sleep/spin-down**.

### Steps to Deploy:
1. Sign up at [koyeb.com](https://www.koyeb.com).
2. Click **Create App** $\to$ **GitHub**.
3. Select your VEIL repository.
4. Set:
   - **Builder:** `Dockerfile`
   - **Port:** `8080`
   - **Health check:** `/api/v1/health` (HTTP)
5. Click **Deploy**. Koyeb will build the image and give you a global HTTPS domain (`https://veil-<your-org>.koyeb.app`).

---

## Option 4: Split Architecture (Vercel + Render / Koyeb)

If you prefer having the frontend on Vercel's global edge network:

### 1. Deploy Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com) $\to$ **Add New Project**.
2. Select your repository and configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Environment Variable:**
     - `VITE_API_BASE_URL` = `https://<your-backend-service>.onrender.com/api/v1`
3. Click **Deploy**. Vercel will host the frontend with client-side SPA route rewrites pre-configured in [`vercel.json`](file:///Users/alokyadav/Desktop/image_detail/frontend/vercel.json).

### 2. Deploy Backend on Render / Koyeb:
1. Set the root directory to `backend` or use the Dockerfile.
2. In the backend environment variables, ensure `CORS_ALLOWED_ORIGINS` includes your Vercel URL (e.g. `https://veil.vercel.app` or `*`).

---

## Free Hosting Comparison Table

| Platform | Frontend & Backend Together? | Free RAM | Free Storage | Sleep / Inactive Spin-down? | Setup Complexity |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Render.com** *(Recommended)* | Yes (Unified Docker) | 512 MB | Ephemeral | Yes (after 15m) | **★☆☆ (1-Click via `render.yaml`)** |
| **Hugging Face Spaces** | Yes (Unified Docker) | **16 GB** | Ephemeral | **No (Always On)** | **★★☆ (Git Push)** |
| **Koyeb** | Yes (Unified Docker) | 512 MB | Ephemeral | **No (Always On)** | **★★☆ (GitHub connect)** |
| **Vercel + Render** | Split (Vercel UI + Render API) | Edge (Vercel) + 512MB | Edge / Ephemeral | Frontend: No / Backend: Yes | **★★★ (2 services)** |
| **Fly.io** | Yes (Unified Docker) | 256 MB | **3GB Persistent SSD** | Yes (auto-stop/start) | **★★★ (CLI tool `flyctl`)** |

---

## Local Verification Commands

To test the production container build locally before pushing to cloud:
```bash
# Build the unified container
docker build -t veil:latest .

# Run the unified container
docker run -p 8080:8080 veil:latest

# Open in browser:
# http://localhost:8080 (serves both React UI and REST API)
```
