# ============================================================
# STAGE 1 - BUILD
# ============================================================

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src


# ------------------------------------------------------------
# Copy project files first
# This improves Docker build caching
# ------------------------------------------------------------

COPY src/Domain/PrakashMart.Domain.csproj \
     src/Domain/

COPY src/Application/PrakashMart.Application.csproj \
     src/Application/

COPY src/Infrastructure/PrakashMart.Infrastructure.csproj \
     src/Infrastructure/

COPY src/API/PrakashMart.API.csproj \
     src/API/


# ------------------------------------------------------------
# Restore NuGet packages
# ------------------------------------------------------------

RUN dotnet restore src/API/PrakashMart.API.csproj


# ------------------------------------------------------------
# Copy source code
# ------------------------------------------------------------

COPY src/ src/


# ------------------------------------------------------------
# Publish
# ------------------------------------------------------------

RUN dotnet publish src/API/PrakashMart.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


# ============================================================
# STAGE 2 - RUNTIME
# ============================================================

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app


# Copy published application
COPY --from=build /app/publish .


# ASP.NET listens on 8080 inside container
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080


ENTRYPOINT ["dotnet", "PrakashMart.API.dll"]
