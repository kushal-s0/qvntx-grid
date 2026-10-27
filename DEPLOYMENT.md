# Deploy qvntx-grid with Vercel and Render

This guide deploys the **React frontend to Vercel** and the **FastAPI backend to Render**, using the configuration already included in this repository.

```text
Browser → Vercel frontend → Render FastAPI → bundled Elexon snapshot
```

`vercel.json` builds a static Vite application. The current project therefore needs a separately deployed API; uploading the frontend alone will not provide wind data or analytics. No application rewrite is needed for the deployment described here.

## 1. Prepare the GitHub repository

Open a terminal **inside this project folder**, the directory containing `README.md`, `frontend/`, `backend/`, and `vercel.json`.

Confirm Git is scoped to this project:

```powershell
git rev-parse --show-toplevel
```

The result must be this project's directory. If Git reports that this is not a repository, or reports an ancestor such as your home directory, create a separate project repository here:

```powershell
git init -b main
```

Then run `git rev-parse --show-toplevel` again. Only proceed when the result is this project folder. A project-local repository is initialized during this setup if one was missing.

### What should be committed?

| Include in GitHub | Why |
| --- | --- |
| `backend/app/` and `backend/requirements.txt` | API, analytics, models, and Python dependencies |
| `backend/tests/` | Repeatable domain and API verification |
| `backend/data/elexon_jan2026_cache.json` | Required real-data snapshot, about 3.77 MB; the Dockerfile copies it into the API image |
| `frontend/src/` and `frontend/public/` | UI, theme initialization, font assets, and font license |
| `frontend/package.json` and `frontend/package-lock.json` | Reproducible frontend dependency installation |
| Frontend HTML, TypeScript/Vite config, Nginx config, and both Dockerfiles | Build and runtime configuration |
| `docker-compose.yml`, `vercel.json`, `render.yaml` | Deployment configuration |
| `.gitignore`, `.dockerignore`, `.env.example` | Repository rules and sanitized configuration example |
| `README.md`, `DEPLOYMENT.md`, `VERIFICATION.md`, and `docs/` | Setup, verification, and presentation documentation |

The `.gitignore` excludes local virtual environments, dependency installs, build output, environment files, logs, editor files, downloaded daily data chunks, hosting CLI state, `.preview/`, and `deliverables/` (including the recorded video and narration assets). It deliberately keeps the complete Elexon JSON snapshot. **Do not add a blanket rule that removes the required snapshot or `package-lock.json`.**

The recorded video remains on your machine. Upload it separately to YouTube or a file-sharing service and put its public URL in `README.md` when ready.

### First push

1. On GitHub, create an **empty** repository, for example `qvntx-grid`. Skip GitHub's generated README, license, and `.gitignore` for this first import.
2. Review and commit the project locally:

```powershell
git status --short
git add .
git diff --cached --stat
git commit -m "Initial energy procurement portal"
```

If Git asks for an author identity, configure it for this project and retry the commit. Use your GitHub name and verified or GitHub-provided no-reply email:

```powershell
git config user.name "YOUR_GITHUB_NAME"
git config user.email "YOUR_VERIFIED_OR_NOREPLY_EMAIL"
```

3. Replace `YOUR_USERNAME` and the repository name below with your actual GitHub values:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/qvntx-grid.git
git push -u origin main
```

If `origin` already exists, inspect it with `git remote -v` and use `git remote set-url origin https://github.com/YOUR_USERNAME/qvntx-grid.git` if it needs correcting. Authenticate through your Git credential manager or GitHub CLI when prompted.

Confirm the GitHub repository contains `backend/data/elexon_jan2026_cache.json`, `frontend/package-lock.json`, and `vercel.json`, but does not contain `.venv/`, `node_modules/`, `.preview/`, or `deliverables/`.

### If unwanted files were already tracked

`.gitignore` affects untracked files; it does not remove files already in Git's index. List tracked files that now match an ignore rule:

```powershell
git ls-files -ci --exclude-standard
```

For each listed file or folder you want to stop tracking, use its exact path. For example, **only if these paths are actually listed**:

```powershell
git rm -r --cached -- .venv
git rm -r --cached -- frontend/node_modules
git rm -r --cached -- .preview
git rm -r --cached -- deliverables
git rm --cached -- frontend/.env.local
```

`--cached` removes the path from Git's index while preserving the local files. Review `git status --short`, then commit the cleanup. This does not erase previously committed files from Git history.

## 2. Deploy the API to Render first

Use Render's **New → Web Service** flow and connect the GitHub repository. Deploy the API as a Docker service so it uses the included Python 3.11 image and bundled data snapshot.

| Render setting | Value |
| --- | --- |
| Service name | Any available name, e.g. `qvntx-grid-api` |
| Branch | `main` |
| Language / Runtime | Docker |
| Root Directory | Leave blank: repository root |
| Dockerfile Path | `backend/Dockerfile` |
| Docker Build Context | `.` — repository root |
| Docker Command | Leave blank: use the Dockerfile's `CMD` |
| Health Check Path | `/api/health` |

**Keep the build context at the repository root.** The Dockerfile contains paths such as `COPY backend/app ./app`, so setting the Render root directory to `backend` would break those paths.

Choose a Render service plan in your account and create the service. Render provides `PORT`; the Dockerfile starts Uvicorn on that port and binds to `0.0.0.0`. No Elexon API key, database, persistent disk, or ingestion command is required at startup.

While deploying the API, set this initial environment variable:

```text
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

You will replace or extend it with the actual Vercel origin in step 4. Directly opening the API health URL does not require the frontend origin to be configured yet.

After deployment succeeds, copy the **actual assigned Render origin**, for example:

```text
https://YOUR-ACTUAL-API.onrender.com
```

Check these URLs in your browser:

```text
https://YOUR-ACTUAL-API.onrender.com/api/health
https://YOUR-ACTUAL-API.onrender.com/docs
```

Health should return JSON containing `"status": "ok"`. Do not use the example hostname literally: use Render's assigned URL.

The repository also contains `render.yaml`, which describes the API and an optional Render static frontend. When following this Vercel guide, creating only the Docker API service manually avoids creating an extra frontend service.

## 3. Deploy the frontend to Vercel

1. In Vercel, choose **Add New → Project**, import the GitHub repository, and choose the GitHub account/team with repository access.
2. Use the **repository root** as Root Directory: leave it as `.` / the default. **Do not select `frontend`** for this guide, because the root `vercel.json` already prefixes its commands and output path with `frontend/`.
3. Select the Vite framework preset and Node.js **22.x** in the project's build settings. The included Vite version requires a supported modern Node version.
4. Verify these settings, which are supplied by `vercel.json`:

| Vercel setting | Value |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | Repository root (`.`) |
| Install Command | `npm ci --prefix frontend` |
| Build Command | `npm run build --prefix frontend` |
| Output Directory | `frontend/dist` |
| Node.js Version | `22.x` |

5. Before deploying, add this environment variable for **Production**. Add it for **Preview** too if you want preview deployments to use the same API:

| Name | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Your actual Render origin, e.g. `https://YOUR-ACTUAL-API.onrender.com` |

Use an HTTPS origin **without `/api` at the end**. The frontend adds `/api/desk`, `/api/export`, and their query parameters itself. Do not use `localhost`, `127.0.0.1`, or the Vercel frontend URL as this value.

6. Click **Deploy**. After a successful build, copy the actual Vercel production URL.

`VITE_API_BASE_URL` is a public frontend setting, not a secret. Vite embeds `VITE_*` values into the built browser bundle. API credentials or other secrets must never be placed in a `VITE_*` variable. Changing the API URL requires a **new frontend deployment**; changing it in the dashboard does not rewrite an existing bundle.

The Vite `/api` proxy in `frontend/vite.config.ts` is for local development/preview only. Vercel's static deployment uses the absolute API origin configured above.

## 4. Allow the Vercel origin in backend CORS

In the Render API service, open **Environment**, then set `CORS_ORIGINS` to the exact production origin from Vercel:

```text
CORS_ORIGINS=https://YOUR-ACTUAL-PROJECT.vercel.app
```

If you also need local development, use one comma-separated value, without spaces or trailing slashes:

```text
CORS_ORIGINS=https://YOUR-ACTUAL-PROJECT.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Save and redeploy/restart the Render API so its middleware loads the new value.

- Add a custom domain's HTTPS origin separately if you configure one.
- Preview deployments can have different origins. Add an exact preview origin to `CORS_ORIGINS` when it should access the API, then restart the backend. The current app does not interpret wildcard hostnames inside this list.
- Backend CORS is configured on **Render**. `VITE_API_BASE_URL` is configured on **Vercel**. Setting one does not configure the other.

## 5. Check the deployed app

Open the Vercel production URL and check:

1. Both the procurement desk and risk lab load real values.
2. Full-month January coverage shows 1,488 matched periods for the default gate policy.
3. Date filters, forecast horizon, demand, and confidence controls update the results.
4. CSV export downloads the selected settlement periods.
5. Light/dark mode and the animated hero work.

If data does not load, open browser developer tools → **Network**, reload, and inspect the request ending in `/api/desk`:

- Its host should be your Render API, not localhost or the Vercel frontend.
- A successful analysis returns HTTP 200 with JSON.

Then update the **Live Vercel URL** placeholder at the top of `README.md` with the real production URL.

## 6. Future updates

From the project repository:

```powershell
git add .
git diff --cached --stat
git commit -m "Describe the update"
git push
```

Connected Git deployments can rebuild from the updated branch. If you change Vercel environment variables, explicitly redeploy the frontend. If you change Render environment variables, restart/redeploy the API.

To refresh the source data, run `python -m app.data_service --refresh` from `backend` in your Python environment, verify the regenerated snapshot, and commit `backend/data/elexon_jan2026_cache.json`. Redeploy the API to load it. Refreshing data is an explicit preparation step, not an API startup dependency.

## Troubleshooting

| Symptom | Likely cause / action |
| --- | --- |
| UI works but data is unavailable | Confirm the Render health URL works, then check `VITE_API_BASE_URL` and CORS. |
| API request goes to the Vercel domain | `VITE_API_BASE_URL` was missing when the frontend was built. Set it for the correct environment and redeploy. |
| URL contains `/api/api/desk` | Remove the trailing `/api` from `VITE_API_BASE_URL`, then redeploy. |
| Browser reports a CORS error | Add the exact browser origin to Render's `CORS_ORIGINS`, then restart the API. |
| API returns 503 | Check Render logs and confirm the complete JSON snapshot was committed and copied into the image. |
| Render cannot find `backend/app` or requirements | Use repository root for Root Directory/build context and `backend/Dockerfile` for Dockerfile Path. |
| Vercel cannot find package files or build output | Keep Root Directory at repository root and use the commands/output path in step 3. |
| Old API origin remains after changing a setting | Rebuild/redeploy Vercel; the value is embedded at build time. |
| First request is slow | Check the API service status and plan behavior; a cold service or a new analytics policy can take longer than a warm request. |
| Files still appear despite `.gitignore` | Check `git ls-files -ci --exclude-standard`; already tracked files require targeted `git rm --cached`. |

## Official references

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vite environment variable behavior](https://vite.dev/guide/env-and-mode)
- [Docker on Render](https://render.com/docs/docker)
- [FastAPI on Render](https://render.com/docs/deploy-fastapi)
- [Git ignore rules and tracked files](https://git-scm.com/docs/gitignore)

This guide prepares deployment; account setup, hosting service selection, and the final deployments are performed in your own GitHub, Render, and Vercel accounts.
