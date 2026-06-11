# 🚀 SmartSelect Deployment Guide

This guide provides step-by-step instructions for deploying the **SmartSelect** application to production. 

```mermaid
graph TD
    A[Vercel Frontend] -->|API Requests /api| B[Render Backend]
    B -->|Database Queries| C[PostgreSQL Database]
    B -->|AI Analysis| D[Groq API]
    B -->|Product Fetching| E[RapidAPI Amazon]
```

---

## 📂 System Architecture Overview

- **Frontend**: React (Vite + TypeScript + Tailwind CSS) deployed on **Vercel**.
- **Backend**: Spring Boot (Java 21 + Maven) built as a **Docker container** and deployed on **Render**.
- **Database**: **PostgreSQL** hosted natively on Render (or using external providers like Supabase, Neon, or Aiven).

---

## 1. 🗄️ Database Setup (PostgreSQL)

You can deploy PostgreSQL natively on **Render** (highly recommended for simple setup) or use external serverless PostgreSQL databases.

### Recommended Providers:
- **[Render PostgreSQL](https://render.com/docs/databases)** (Built-in, simple network connection, free/paid tiers).
- **[Neon](https://neon.tech/)** (Generous serverless PostgreSQL free tier).
- **[Supabase](https://supabase.com/)** (PostgreSQL database with clean dashboard).
- **[Aiven.io](https://aiven.io/)** (Managed PostgreSQL cloud database).

### Configuration Steps (Render Native):
1. Sign in to Render and click **New +** -> **PostgreSQL**.
2. Set a name (e.g., `smartselect-db`) and choose your plan.
3. Click **Create Database**.
4. Once created, copy the **Internal Database URL** (if deploying the backend on Render) or the **External Database URL** (for local testing).
5. Convert this connection URL to Spring JDBC format by changing `postgresql://` to `jdbc:postgresql://`. For example:
   * Native connection URL: `postgresql://user:pass@host/db`
   * Spring JDBC URL: `jdbc:postgresql://user:pass@host/db`
6. Keep these credentials ready for the backend deployment.

---

## 2. ☕ Backend Deployment on Render

Render will build and run the backend using the Dockerfile located in the `SmartSelectBackend/` directory.

### Step-by-Step Instructions:

1. Sign in to **[Render](https://render.com/)**.
2. Click **New +** and select **Web Service**.
3. Connect your Git repository (GitHub or GitLab).
4. Configure the following fields:
   - **Name**: `smartselect-backend` (or your preferred name)
   - **Root Directory**: `SmartSelectBackend` *(Crucial: This tells Render where to find the backend files and the Dockerfile)*
   - **Runtime**: `Docker` *(Render will automatically detect the Dockerfile and build the image)*
   - **Branch**: `main` (or your deployment branch)
   - **Instance Type**: Select **Free** (or your preferred paid plan)
5. Click **Advanced** to expand environmental settings. Add the following **Environment Variables**:

| Variable Name | Value / Example | Description |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<HOST>:<PORT>/<DATABASE>` | JDBC connection URL for PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | `<YOUR_DATABASE_USERNAME>` | Database username |
| `SPRING_DATASOURCE_PASSWORD` | `<YOUR_DATABASE_PASSWORD>` | Database password |
| `JWT_SECRET` | `A-Long-Random-Base64-String-At-Least-256-Bits-Long=` | Secret key used to sign JWTs |
| `GROQ_API_KEY` | `gsk_...` | Your Groq API key for AI suggestions |
| `RAPIDAPI_KEY` | `...` | Your RapidAPI Amazon Data Scraper key |
| `CORS_ORIGINS` | `https://smartselect.vercel.app` *(or your actual Vercel URL)* | Allowed CORS origins (separate multiple with commas) |

> [!NOTE]
> Render automatically sets the `PORT` environment variable and injects it into the container. The backend is already configured to read this via `server.port=${PORT:8080}`, so you do **not** need to manually define the `PORT` variable.

6. Under the **Advanced** section, find **Health Check Path** and set it to `/health` (or `/api/health`). This allows Render to monitor the container's status and perform zero-downtime deployments.
7. Click **Deploy Web Service**.
8. Once deployed, note down the backend service URL (e.g., `https://smartselect-backend.onrender.com`).

---

## 3. 🎨 Frontend Deployment on Vercel

Vite + React fits perfectly on Vercel. Vercel will automatically compile the TypeScript and build the static assets.

### Step-by-Step Instructions:

1. Sign in to **[Vercel](https://vercel.com/)**.
2. Click **Add New** -> **Project**.
3. Import your Git repository.
4. On the **Configure Project** screen:
   - **Root Directory**: Click *Edit* and select **`SmartSelectFrontend`**
   - **Framework Preset**: `Vite` (automatically detected)
   - **Build and Output Settings**:
     - *Build Command*: `npm run build` (or leave default)
     - *Output Directory*: `dist` (or leave default)
5. Under **Environment Variables**, add the following key:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://smartselect-backend.onrender.com/api` | **Must point to your Render backend URL, appended with `/api`** |

> [!IMPORTANT]
> Ensure that the URL does **not** have a trailing slash. For example, `https://smartselect-backend.onrender.com/api` is correct, whereas `https://smartselect-backend.onrender.com/api/` might cause double slashes in your endpoints.

6. Click **Deploy**.
7. Vercel will build the frontend and provide you with a production URL (e.g., `https://smartselect.vercel.app`).

---

## 🔄 4. Connect and Complete the Loop

After deploying both components, you must link them via CORS settings:

1. Copy your live Vercel URL (e.g., `https://smart-select.vercel.app`).
2. Go to your **Render Backend Dashboard** -> **Environment**.
3. Update the `CORS_ORIGINS` environment variable to include your Vercel URL:
   ```env
   CORS_ORIGINS=https://smart-select.vercel.app
   ```
4. Save the changes. Render will automatically redeploy the backend with the new configuration.

---

## 🛠️ Troubleshooting & Common Issues

### 1. Mixed Content / HTTPS Errors
- **Symptom**: The frontend loads but API requests fail or console shows "Mixed Content" warnings.
- **Fix**: Ensure your `VITE_API_URL` environment variable on Vercel starts with `https://` and not `http://`. Render serves everything over HTTPS by default.

### 2. CORS Preflight Failures
- **Symptom**: Requests block with "CORS error" in console.
- **Fix**: Check that the `CORS_ORIGINS` environment variable on Render matches your frontend Vercel URL exactly (no trailing slash, matching protocol `https://`).

### 3. Database Connection Timeouts (Docker Build Stage)
- **Symptom**: Backend build fails to boot or test stage fails.
- **Fix**: The Dockerfile builds the code using `mvn package -DskipTests`, which skips unit tests. This ensures the Maven build does not attempt to connect to the database during the build phase (since the database connection is only available at runtime).

### 4. Client-Side Routing (404 on Page Refresh)
- **Symptom**: Refreshing a page (like `/login` or `/history`) on Vercel displays a Vercel 404 page.
- **Fix**: The project already includes a [vercel.json](file:///c:/Users/mayan/DevloperCompleteFolder/Projects/SmartSelect/SmartSelectFrontend/vercel.json) file that rewrites all paths back to `index.html`. Make sure this file is committed in your root repository inside the `SmartSelectFrontend` directory.
