# Deployment Guide

This document covers the supported local and Docker-based setup paths for PrakashMart.

## What You Need

### Local development

- .NET 8 SDK
- Node.js 20+
- SQL Server 2019+ or SQL Server Express

### Docker setup

- Docker Desktop

## Configuration Files

### Committed templates

- `.env.example`
- `backend/src/API/appsettings.json`
- `backend/src/API/appsettings.Production.json`
- `backend/src/API/appsettings.Development.example.json`

### Local-only files

- `.env`
- `backend/src/API/appsettings.Development.json`

Do not commit the local-only files above.

## Option A: Local Development

### 1. Backend

Create your local development settings file:

```bash
copy backend\src\API\appsettings.Development.example.json backend\src\API\appsettings.Development.json
```

Then restore and run:

```bash
cd backend
dotnet restore PrakashMart.sln
dotnet run --project src/API/PrakashMart.API.csproj
```

Backend URL:

- `http://localhost:5001`

Swagger:

- `http://localhost:5001/swagger`

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

## Option B: Docker

### 1. Create the environment file

```bash
copy .env.example .env
```

Set at least:

```env
DB_PASSWORD=YourStrong@Password2026
JWT_KEY=your-secret-key-must-be-at-least-32-characters
```

### 2. Build and start

```bash
docker compose up --build
```

### 3. Access the stack

- Frontend: `http://localhost`
- Backend API: `http://localhost:8080/api/`
- Swagger: `http://localhost:8080/swagger`

## Database Behavior

On backend startup the application:

1. connects to SQL Server
2. applies pending EF Core migrations
3. runs the idempotent seed process

Database details are documented in [DATABASE.md](/E:/AI_FlipKart/docs/DATABASE.md:1).

## Test Commands

### Backend

```bash
cd backend
dotnet test tests/Application.Tests/Application.Tests.csproj
```

### Frontend

```bash
cd frontend
npm test
```

## Troubleshooting

### Backend restore uses the wrong package source

The repo includes a root `NuGet.config` that clears machine-specific package sources and uses `nuget.org`. If restore still fails, check for machine or environment-level NuGet overrides.

### JWT key missing on startup

Set `Jwt:Key` in `backend/src/API/appsettings.Development.json` for local development, or `JWT_KEY` in `.env` for Docker.

### Frontend still shows stale branding or UI

Restart the frontend dev server and hard-refresh the browser.
