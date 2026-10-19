# UXFriends

UXFriends is a gamified UX/UI learning platform built around structured learning paths, quizzes, projects, progress tracking, leaderboard competition, and an AI coaching layer.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript |
| Backend API | ASP.NET Core 8 |
| Database | SQLite by default, SQL Server optional |
| AI Coach Service | FastAPI |
| Authentication | ASP.NET Identity + JWT + optional Google/GitHub OAuth |

## Main Features

- Structured learning flow: sections -> units -> lessons
- Lesson quizzes, unit quizzes, and section final exams
- Capstone projects and portfolio publishing
- XP, streaks, badges, daily goals, challenges, and weekly leagues
- AI coach, revision plans, and mistake-based review insights
- Email verification and password reset by SMTP

## Repository Structure

```text
UXFriends/
├── backend/
│   ├── UXFriends.API/
│   ├── UXFriends.Application/
│   ├── UXFriends.Domain/
│   ├── UXFriends.Infrastructure/
│   └── uxfriends_ai_service/
├── frontend/
└── uxfriends-project.sln
```

## Prerequisites

Install these before running the project:

- Node.js `20.19+` or `22.12+`
- npm
- .NET SDK `8.0`
- Python `3.11+` or `3.12`

Optional for local AI model mode:

- [Ollama](https://ollama.com/)

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/youssef-hendawey/UXFriends.git
cd UXFriends
```

### 2. Run the backend API

```bash
cd backend/UXFriends.API
dotnet restore
dotnet run
```

Backend URLs:

- API base: `http://localhost:5176`
- Swagger: `http://localhost:5176/swagger`

### 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

### 4. Run the AI coach service

Open a new terminal:

```bash
cd backend/uxfriends_ai_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### Heuristic-only mode

This mode does not require Ollama.

```bash
cd backend/uxfriends_ai_service
source .venv/bin/activate
export AI_PROVIDER="heuristic"
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

#### Local model mode with Ollama

Start Ollama in a separate terminal:

```bash
ollama serve
```

Pull a lightweight local model once:

```bash
ollama pull deepseek-r1:1.5b
```

Then start the AI service:

```bash
cd backend/uxfriends_ai_service
source .venv/bin/activate
export AI_PROVIDER="local"
export LOCAL_AI_BASE_URL="http://127.0.0.1:11434/v1"
export LOCAL_AI_MODEL="deepseek-r1:1.5b"
export LOCAL_AI_API_KEY="ollama"
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

AI service URL:

- `http://localhost:8001`

Health check:

```bash
curl http://127.0.0.1:8001/health
```

### Hosted Gemini mode

Production can call Gemini directly from the ASP.NET API, so the FastAPI/Ollama
service does not need to run on the web server. Configure these environment
variables and keep the API key out of source control:

```bash
AI__Gemini__ApiKey="your-gemini-api-key"
AI__Gemini__BaseUrl="https://generativelanguage.googleapis.com/v1beta/openai"
AI__Gemini__Model="gemini-3.5-flash"
AI__RequestTimeoutSeconds="30"
```

Authenticated users can verify the active provider at
`GET /api/ai/coach/status`. If Gemini or the local service is temporarily
unavailable, the API returns a contextual built-in coach response instead of
failing the chat request.

## Database

The project runs on SQLite by default.

Default local database file:

- `backend/UXFriends.API/uxfriends.db`

On Azure App Service, the API automatically moves the default SQLite file to the
persistent `%HOME%\data\uxfriends.db` location. Keep the production database out
of `site\wwwroot`, because ZIP deployments replace application files there. You
can also set this explicitly with:

```text
ConnectionStrings__SqliteConnection=Data Source=D:\home\data\uxfriends.db
```

Configure regular database backups before accepting production user data.

Current default provider in `backend/UXFriends.API/appsettings.json`:

- `"DatabaseProvider": "Sqlite"`

### Reset local database

If you want a clean local database:

```bash
cd backend/UXFriends.API
dotnet ef database drop --force
dotnet run
```

Or stop the API and delete:

- `backend/UXFriends.API/uxfriends.db`

Then run the API again.

### SQL Server support

SQL Server is already wired in configuration, but SQLite is the current default. If you switch providers later, update:

- `ConnectionStrings:DefaultConnection`
- `DatabaseProvider`

## Local Configuration

Do not keep real secrets in source control.

Create local-only configuration in:

- `backend/UXFriends.API/appsettings.Development.json`
- Start from `backend/UXFriends.API/appsettings.Development.example.json`

Typical local settings include:

- JWT key
- SMTP credentials
- Google OAuth client id/secret
- GitHub OAuth client id/secret
- frontend base URL
- backend public base URL

You can also supply them through environment variables.

The tracked `appsettings.json` now contains placeholders only. Keep real local
secrets in `appsettings.Development.json`, which is ignored by the repo.

## OAuth Setup

### Google callback URL

```text
http://localhost:5176/api/auth/external/google/callback
```

### GitHub callback URL

```text
http://localhost:5176/api/auth/external/github/callback
```

### Config keys

Google:

- `ExternalAuth:Google:ClientId`
- `ExternalAuth:Google:ClientSecret`

GitHub:

- `ExternalAuth:GitHub:ClientId`
- `ExternalAuth:GitHub:ClientSecret`

Environment variable form:

- `ExternalAuth__Google__ClientId`
- `ExternalAuth__Google__ClientSecret`
- `ExternalAuth__GitHub__ClientId`
- `ExternalAuth__GitHub__ClientSecret`

### Stable local callback host

To avoid Google/GitHub callback mismatches when switching between `localhost`
and `127.0.0.1`, keep this configured locally:

- `Backend:BaseUrl`

Default local value:

```text
http://localhost:5176
```

## SMTP / Email

SMTP is used for:

- password reset codes
- email verification links

Relevant settings:

- `Email:Mode`
- `Email:SmtpHost`
- `Email:SmtpPort`
- `Email:Username`
- `Email:Password`
- `Email:FromEmail`
- `Email:FromName`

For local development without sending real emails, you can switch:

```json
"Email": {
  "Mode": "Development"
}
```

That stores generated emails in:

- `backend/UXFriends.API/dev-emails/`

## Useful Commands

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run lint
```

### Backend

```bash
cd backend/UXFriends.API
dotnet restore
dotnet run
dotnet build
```

### Entity Framework

```bash
dotnet ef migrations list --project backend/UXFriends.Infrastructure --startup-project backend/UXFriends.API
```

### AI service

```bash
cd backend/uxfriends_ai_service
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

## Notes

- The frontend dev server is heavier than the production build. If you measure speed, compare production output as well, not only `npm run dev`.
- The AI coach can use hosted Gemini, the local FastAPI/Ollama service, or its built-in fallback.
- The app currently uses browser storage for JWT session persistence.
- SQLite is fine for local/dev, but a production deployment will usually want SQL Server or another managed database.

## License

This project is currently intended for educational and portfolio use unless a different license is added later.
