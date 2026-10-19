FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src

COPY backend/UXFriends.API/*.csproj backend/UXFriends.API/
COPY backend/UXFriends.Application/*.csproj backend/UXFriends.Application/
COPY backend/UXFriends.Domain/*.csproj backend/UXFriends.Domain/
COPY backend/UXFriends.Infrastructure/*.csproj backend/UXFriends.Infrastructure/
RUN dotnet restore backend/UXFriends.API/UXFriends.API.csproj

COPY backend/ backend/
COPY --from=frontend-build /src/frontend/dist backend/UXFriends.API/wwwroot/
RUN dotnet publish backend/UXFriends.API/UXFriends.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://0.0.0.0:7860
ENV AI_PROVIDER=heuristic
ENV AI__CoachServiceUrl=http://127.0.0.1:8001

COPY --from=backend-build /app/publish ./
COPY backend/uxfriends_ai_service/requirements.txt ./ai-service/requirements.txt
RUN python3 -m venv ./ai-service/.venv \
    && ./ai-service/.venv/bin/pip install --no-cache-dir -r ./ai-service/requirements.txt

COPY backend/uxfriends_ai_service/main.py ./ai-service/main.py

EXPOSE 7860
ENTRYPOINT ["sh", "-c", "cd /app/ai-service && ./.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8001 & cd /app && dotnet UXFriends.API.dll --urls http://0.0.0.0:${PORT:-7860}"]
