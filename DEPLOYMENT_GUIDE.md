# Render.com Deployment Guide

This document outlines the exact steps to transition this project from your local machine to the Render cloud platform.

## Step 1: Push Code to GitHub
Because Render automatically builds and deploys code directly from GitHub, you must first push this repository.
1. Install Git on your computer if you haven't already.
2. Open a terminal in the project folder and run:
   ```bash
   git add .
   git commit -m "Final project ready for deployment"
   git push origin main
   ```
*(Ensure `.env` files are NOT committed to GitHub. They are safely excluded via `.gitignore`.)*

## Step 2: Provision PostgreSQL Database on Render
1. Log into your Render dashboard.
2. Click **New +** and select **PostgreSQL**.
3. Name the database (e.g., `cafeteria-db`), select a region, and choose the Free tier.
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL**.

## Step 3: Deploy the FastAPI Backend
1. On the Render dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `cafeteria-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Expand **Environment Variables** and add:
   - `DATABASE_URL`: *(Paste the Internal Database URL from Step 2)*
   - `SECRET_KEY`: *(Generate a secure random string)*
   - `ACTIVATION_ENCRYPTION_KEY`: *(Provide your 32-byte Base64 key)*
   - `CORS_ORIGINS`: *(Leave blank for now, we will add the frontend URL here later)*
5. Click **Create Web Service**. Wait for it to deploy and copy the backend's `.onrender.com` URL.

## Step 4: Deploy the React Frontend
1. On the Render dashboard, click **New +** and select **Static Site**.
2. Connect the same GitHub repository.
3. Configure the service:
   - **Name**: `cafeteria-frontend`
   - **Root Directory**: `.` (leave empty or use root)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: *(Paste the backend URL from Step 3, e.g., `https://cafeteria-backend.onrender.com/api/v1`)*
5. Go to **Redirects/Rewrites** and add a rule for React Router:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Click **Create Static Site**.

## Step 5: Final Connection
1. Go back to your Backend Web Service on Render.
2. Update the `CORS_ORIGINS` environment variable to include your new Frontend URL (e.g., `https://cafeteria-frontend.onrender.com`).
3. Manually trigger a backend deploy to apply the new environment variable.

Your system is now live!
