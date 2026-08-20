# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY src/Domain/PrakashMart.Domain.csproj             src/Domain/
COPY src/Application/PrakashMart.Application.csproj   src/Application/
COPY src/Infrastructure/PrakashMart.Infrastructure.csproj src/Infrastructure/
COPY src/API/PrakashMart.API.csproj                   src/API/
RUN dotnet restore src/API/PrakashMart.API.csproj

COPY src/ src/
RUN dotnet publish src/API/PrakashMart.API.csproj \
    -c Release -o /app/publish --no-restore

# Stage 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "PrakashMart.API.dll"]
