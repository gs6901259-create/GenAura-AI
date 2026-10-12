# GenAura AI — Production Build & Deployment Guide

> **Verified Status**: The production build has been verified locally on the environment with **exit code 0** and **zero TypeScript errors**. Build logs and artifact specifications are documented below.

---

## 1. Production Build Verification Report

- **Build Command**: `npm run build` (`tsc -b && vite build`)
- **Node Version**: `v24.20.0`
- **Compiler**: TypeScript 6 (`tsc -b`)
- **Bundler**: Vite 8 (`vite v8.3.4`)
- **Modules Transformed**: 1,922 modules
- **Build Duration**: 3.32s
- **Exit Code**: `0`

### Generated Artifacts (`dist/`):

| File | Size | Gzip Size | Description |
| :--- | :--- | :--- | :--- |
| `dist/index.html` | 1.02 kB | 0.57 kB | Minified production HTML entry point |
| `dist/assets/index-TdUjzuvy.css` | 64.35 kB | 10.34 kB | Compiled Tailwind CSS styles & utilities |
| `dist/assets/index-Ck1nNVyJ.js` | 351.69 kB | 97.52 kB | Optimized application bundle |

---

## 2. Prerequisites

- **Node.js**: >= 18.0.0 (v20+ or v24+ recommended)
- **Package Manager**: npm (v10+ or v11+)

---

## 3. Local Verification & Preview

To run the verified production build locally:

```bash
# Install dependencies
npm install

# Run the verified production build
npm run build

# Start the local production preview server
npm run preview
```

The preview server will be accessible at `http://localhost:4173/`.

To run in development mode with HMR:
```bash
npm run dev
```

---

## 4. Cloud Deployment Instructions

### A. Vercel Deployment

1. Install Vercel CLI or import the Git repository into the [Vercel Dashboard](https://vercel.com).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Single-Page Application (SPA) Routing:
   Add a `vercel.json` if needed:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
4. Deploy:
   ```bash
   vercel --prod
   ```

### B. Netlify Deployment

1. Create a `_redirects` file in the `public/` directory:
   ```text
   /*    /index.html   200
   ```
2. Configure Netlify build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

### C. Cloudflare Pages

1. Connect the GitHub repository in Cloudflare Pages.
2. Build configurations:
   - **Framework**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`

### D. Docker Container Deployment

Create a `Dockerfile` for Nginx production hosting:

```dockerfile
# Build Stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Serving Stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Sample `nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Build and run container:
```bash
docker build -t genaura-ai-collaboration .
docker run -p 8080:80 genaura-ai-collaboration
```
Navigate to `http://localhost:8080`.
