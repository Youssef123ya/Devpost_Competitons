# UXFriends Free Deployment

This project can run as one Docker app. The no-payment deployment path is
Hugging Face Spaces on the free CPU Basic hardware.

Render is not the best fit for a no-payment deployment because it can ask for a
payment method even when selecting a free plan.

## 1. Push The Project To GitHub

Create a GitHub repository and push this folder.

```powershell
git init
git add .
git commit -m "Prepare UXFriends for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Deploy For Free On Hugging Face Spaces

Hugging Face Spaces supports Docker apps. The repository `README.md` already
contains the required Space metadata:

```yaml
sdk: docker
app_port: 7860
```

Steps:

1. Open [https://huggingface.co/spaces](https://huggingface.co/spaces).
2. Click **New Space**.
3. Choose:
   - Space name: `UXFriends-main`
   - SDK: `Docker`
   - Hardware: `CPU Basic` / free
   - Visibility: Public
4. Create the Space.
5. Upload/push the GitHub repo contents to the Space repo.

The app will run from the root `Dockerfile`. The container starts:

- ASP.NET Core + built React frontend on port `7860`
- FastAPI AI coach internally on `127.0.0.1:8001`

No external database is configured in this free demo setup. SQLite is stored in
the container filesystem, which is not persistent long-term.

## Optional: Render Blueprint

This repository also includes `render.yaml`, so Render can create both services
from one Blueprint. Use this only if Render does not ask you for payment
verification.

Render Blueprint URL:

```text
https://render.com/deploy?repo=https://github.com/Mhanedrgb/UXFriends-main
```

Render should detect `render.yaml` and create `uxfriends-main` and
`uxfriends-ai`.

Both services are configured for the free plan, but Render can still ask for a
payment method.

## Manual Render Setup

If you do not use the Blueprint button, create the services manually.

### AI Coach

Create another Render **Web Service** from the same GitHub repo.

- Root directory: `backend/uxfriends_ai_service`
- Runtime: Docker
- Dockerfile path: `backend/uxfriends_ai_service/Dockerfile`
- Plan: Free

Environment variables:

```text
AI_PROVIDER=heuristic
```

### Main App

Create another Render **Web Service** from the same GitHub repo.

- Root directory: leave blank
- Runtime: Docker
- Dockerfile path: `Dockerfile`
- Plan: Free

Environment variables:

```text
ASPNETCORE_ENVIRONMENT=Production
DatabaseProvider=Sqlite
Jwt__Key=replace-with-a-long-random-secret-at-least-32-chars
Jwt__Issuer=UXFriendsAPI
Jwt__Audience=UXFriendsClient
Email__Mode=Development
AI__CoachServiceUrl=https://your-ai-service.onrender.com
```

The app automatically uses Render's `RENDER_EXTERNAL_URL` for production links
and CORS.

## Notes

- Free Render services sleep when idle, so the first request after a break can be slow.
- This free setup uses SQLite inside the web service container. It is fine for a demo, but saved users/progress can reset after redeploys or restarts.
- For real long-term users, switch the backend to a persistent database before sharing widely.
