# Database Guide

PrakashMart uses **SQL Server + Entity Framework Core migrations**. The schema is versioned in source control, and the application applies migrations automatically on backend startup.

## Source of Truth

- Migrations: `backend/src/Infrastructure/Persistence/Migrations/`
- DbContext: `backend/src/Infrastructure/Persistence/AppDbContext.cs`
- Seed logic: `backend/src/Infrastructure/Persistence/DbSeeder.cs`

## Local Setup

1. Make sure SQL Server is running locally, or start the Docker stack from the repo root.
2. Set a valid connection string in `backend/src/API/appsettings.json` or override it with environment variables.
3. Run the backend:

```bash
cd backend
dotnet run --project src/API/PrakashMart.API.csproj
```

On startup the API will:

1. connect to SQL Server
2. apply any pending EF Core migrations
3. run the idempotent seed process

## Creating a Migration

```bash
cd backend
dotnet ef migrations add <MigrationName> --project src/Infrastructure --startup-project src/API
```

## Applying Migrations Manually

```bash
cd backend
dotnet ef database update --project src/Infrastructure --startup-project src/API
```

## Seed Data

`DbSeeder.cs` creates development/sample data such as:

- categories
- brands
- products
- product variants
- banners
- coupons
- sample admin, seller, and customer accounts

The seed logic is **idempotent**, so re-running the backend will not duplicate existing records.
