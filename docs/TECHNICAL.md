---
pdf_options:
  format: A4
  margin:
    top: 22mm
    right: 20mm
    bottom: 22mm
    left: 20mm
  displayHeaderFooter: true
  headerTemplate: "<span></span>"
  footerTemplate: "<div style='font-size:10px;text-align:center;width:100%;color:#888;font-family:Arial,sans-serif;padding:0 40px'>AI-Powered PrakashMart &nbsp;·&nbsp; Technical Design Document &nbsp;·&nbsp; Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>"
stylesheet: pdf-style.css
---

<div class="cover">
  <div class="cover-banner">
    <h1>Technical Design Document</h1>
    <h2>AI-Powered PrakashMart</h2>
    <p class="tagline">Academic Project &nbsp;·&nbsp; Full-Stack E-Commerce Platform &nbsp;·&nbsp; May 2026</p>
  </div>
  <div class="cover-meta">
    <table>
      <tbody>
        <tr><th>Document</th><td>Technical Design Document (TDD)</td></tr>
        <tr><th>Version</th><td>1.0</td></tr>
        <tr><th>Date</th><td>May 2026</td></tr>
        <tr><th>Author</th><td>Vipul Donga</td></tr>
        <tr><th>Email</th><td>dongavipul@gmail.com</td></tr>
        <tr><th>Status</th><td>Final</td></tr>
      </tbody>
    </table>
  </div>
</div>

---

## Table of Contents

1. System Architecture
2. Technology Stack
3. Backend Design
4. Database Design
5. API Design
6. Frontend Architecture
7. Security Design
8. Deployment Architecture
9. CI/CD Pipeline
10. Testing Strategy

---

## 1. System Architecture

### 1.1 Overview

The AI-Powered PrakashMart follows a layered, decoupled architecture. The backend uses the **Clean Architecture** pattern (also known as Onion Architecture), ensuring that business logic is independent of frameworks, databases, and UI. The frontend is a Single Page Application (SPA) built with React.

### 1.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   React 18 + Vite + TypeScript + Tailwind CSS + Zustand    │  │
│  │              Served by Nginx (Docker container)             │  │
│  └─────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────│─────────────────────────────────────┘
                             │ REST/JSON over HTTP
                             │ Nginx proxies /api/* to backend
┌────────────────────────────▼─────────────────────────────────────┐
│                       APPLICATION TIER                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │               .NET 8 Web API (Docker container)            │  │
│  │  ┌──────────┐  ┌─────────────┐  ┌──────────────────────┐  │  │
│  │  │  API     │  │ Application │  │    Domain            │  │  │
│  │  │ Controllers│ │ Services/DTOs│  │ Entities/Interfaces  │  │  │
│  │  └──────────┘  └─────────────┘  └──────────────────────┘  │  │
│  │                ┌─────────────────────────────────────────┐  │  │
│  │                │          Infrastructure                 │  │  │
│  │                │   Repositories / EF Core / JWT / Hash  │  │  │
│  │                └─────────────────────────────────────────┘  │  │
│  └─────────────────────────┬──────────────────────────────────┘  │
└────────────────────────────│─────────────────────────────────────┘
                             │ Entity Framework Core
┌────────────────────────────▼─────────────────────────────────────┐
│                         DATA TIER                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         SQL Server 2022 Express (Docker container)         │  │
│  │              Data persisted in Docker named volume          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Clean Architecture Layers

```
┌───────────────────────────────────────────┐
│                  API Layer                │  ← Controllers, Middleware, Program.cs
│     (depends on Application only)        │
├───────────────────────────────────────────┤
│            Application Layer             │  ← Services, DTOs, Interfaces
│     (depends on Domain only)             │
├───────────────────────────────────────────┤
│             Infrastructure Layer         │  ← Repositories, EF Core, JWT, Hasher
│     (implements Domain interfaces)       │
├───────────────────────────────────────────┤
│               Domain Layer               │  ← Entities, Domain Interfaces
│       (no external dependencies)         │
└───────────────────────────────────────────┘
         ↑ Dependency direction: inward only
```

**Key principle:** The Domain layer has zero dependencies on frameworks. Business rules live in Entity methods and Application services. Infrastructure implements the interfaces defined in Domain — the domain never knows about Entity Framework or SQL Server.

---

## 2. Technology Stack

### 2.1 Backend

| Component            | Technology           | Version | Purpose |
|----------------------|----------------------|---------|---------|
| Runtime              | .NET                 | 8.0     | Application runtime |
| Web Framework        | ASP.NET Core Web API | 8.0     | REST API endpoints |
| ORM                  | Entity Framework Core| 8.0     | Database access and migrations |
| Database             | Microsoft SQL Server | 2022    | Relational data storage |
| Authentication       | JWT Bearer           | 8.0     | Stateless auth tokens |
| Password Hashing     | BCrypt.Net-Next      | 4.0     | Secure password storage |
| PDF Generation       | iText7               | 9.6     | Branded order invoice PDFs |
| Email                | Resend (HttpClient)  | REST    | Transactional emails (order, password reset) |
| API Documentation    | Swashbuckle (Swagger)| 6.7     | Interactive API explorer |
| Unit Testing         | xUnit                | 2.9     | Test framework |
| Mocking              | Moq                  | 4.20    | Mock dependencies in tests |
| Assertions           | FluentAssertions     | 6.12    | Expressive test assertions |

### 2.2 Frontend

| Component         | Technology           | Version | Purpose |
|-------------------|----------------------|---------|---------|
| UI Framework      | React                | 18.3    | Component-based UI |
| Build Tool        | Vite                 | 5.3     | Fast development server and bundler |
| Language          | TypeScript           | 5.5     | Type-safe JavaScript (strict mode) |
| Styling           | Tailwind CSS         | 3.4     | Utility-first CSS framework |
| State Management  | Zustand              | 4.5     | Lightweight client state |
| HTTP Client       | Axios                | 1.7     | REST API calls with interceptors |
| Routing           | React Router DOM     | 6.26    | Client-side navigation |
| Forms             | React Hook Form      | 7.52    | Form state and validation |
| Validation        | Zod                  | 3.23    | Schema-based validation |
| Charts            | Recharts             | 3.8     | Seller analytics charts |
| Unit Testing      | Vitest               | 3.2     | Fast Vite-native test runner |
| Test Utilities    | Testing Library      | 16.3    | React component testing helpers |

### 2.3 DevOps

| Component         | Technology       | Purpose |
|-------------------|-----------------|---------|
| Containerisation  | Docker           | Application packaging |
| Orchestration     | Docker Compose   | Multi-container management |
| Web Server        | Nginx (Alpine)   | Static file serving + API proxy |
| CI/CD             | GitHub Actions   | Automated test and build pipeline |
| Version Control   | Git / GitHub     | Source code management |

---

## 3. Backend Design

### 3.1 Project Structure

```
backend/
├── src/
│   ├── Domain/                      ← Core business entities and interfaces
│   │   ├── Entities/                ← User, Product, Order, Cart, Coupon, etc.
│   │   └── Interfaces/              ← IRepository<T>, IUserRepository, etc.
│   │
│   ├── Application/                 ← Business logic and orchestration
│   │   ├── Services/                ← AuthService, OrderService, CartService, etc.
│   │   ├── DTOs/                    ← Request/Response data contracts
│   │   ├── Interfaces/              ← IAuthService, IOrderService, etc.
│   │   └── Common/Exceptions/       ← AppException, NotFoundException, etc.
│   │
│   ├── Infrastructure/              ← External concerns
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs      ← EF Core DbContext
│   │   │   ├── Migrations/          ← EF Core migration files
│   │   │   ├── DbSeeder.cs          ← Idempotent seed data
│   │   │   └── Repositories/        ← Concrete repository implementations
│   │   └── Services/                ← JwtService, PasswordHasher
│   │
│   └── API/                         ← Entry point
│       ├── Controllers/             ← HTTP endpoints
│       ├── Middleware/              ← GlobalException, SecurityHeaders
│       ├── Program.cs               ← DI, pipeline configuration
│       └── appsettings.json         ← Non-secret configuration
│
└── tests/
    └── Application.Tests/           ← xUnit unit tests
```

### 3.2 Repository Pattern

All database access is abstracted behind interfaces. The `BaseRepository<T>` provides standard CRUD operations. Specialised repositories extend it with entity-specific queries.

```
IRepository<T>              (Domain layer — interface)
    ↑ implemented by
BaseRepository<T>           (Infrastructure layer — EF Core)
    ↑ extended by
IProductRepository          (Domain layer — interface)
    ↑ implemented by
ProductRepository           (Infrastructure layer)
```

### 3.3 Unit of Work

The `IUnitOfWork` interface wraps `SaveChangesAsync()` to ensure multiple repository operations within a single request are committed atomically. Services depend on `IUnitOfWork`, not on EF Core directly.

### 3.4 Exception Handling

A custom exception hierarchy maps business errors to HTTP status codes:

| Exception Class       | HTTP Status | Example Usage |
|-----------------------|-------------|--------------|
| AppException          | 400         | Insufficient stock, duplicate email |
| NotFoundException     | 404         | Product not found, order not found |
| UnauthorizedException | 401         | Invalid credentials, deactivated account |
| ForbiddenException    | 403         | User accessing another user's order |

The `GlobalExceptionMiddleware` catches all exceptions and returns a consistent JSON error response.

---

## 4. Database Design

### 4.1 Entity Relationship Diagram

```
┌──────────┐       ┌───────────┐       ┌─────────────┐
│  Users   │       │  Products │       │  Categories │
│──────────│       │───────────│       │─────────────│
│ Id (PK)  │       │ Id (PK)   │──────▶│ Id (PK)     │
│ Name     │       │ Name      │       │ Name        │
│ Email    │       │ Price     │       │ Icon        │
│ Password │       │ Stock     │       │ Slug        │
│ Role     │       │ Brand     │       └─────────────┘
│ IsActive │       │ CategoryId│
└────┬─────┘       │ SellerId  │──────────────────────┐
     │             │ IsActive  │                      │
     │             └─────┬─────┘                      │
     │                   │                            │
     │         ┌─────────┴────────┐           ┌──────▼──────┐
     │         │                  │           │    Users    │
     │   ┌─────▼──────┐   ┌───────▼──────┐   │  (Sellers)  │
     │   │  Variants  │   │   Reviews    │   └─────────────┘
     │   │────────────│   │──────────────│
     │   │ Id (PK)    │   │ Id (PK)      │
     │   │ ProductId  │   │ ProductId    │
     │   │ Size       │   │ UserId       │
     │   │ Color      │   │ Rating       │
     │   │ Stock      │   │ Comment      │
     │   │ PriceOver. │   │ CreatedAt    │
     │   │ IsActive   │   └──────────────┘
     │   └────────────┘
     │
     │   ┌──────────┐       ┌───────────┐
     ├──▶│  Orders  │       │OrderItems │
     │   │──────────│       │───────────│
     │   │ Id (PK)  │──────▶│ Id (PK)   │
     │   │ UserId   │       │ OrderId   │
     │   │ Status   │       │ ProductId │
     │   │ Total    │       │ VariantId │
     │   │ Discount │       │ Qty       │
     │   │ Coupon   │       │ UnitPrice │
     │   └──────────┘       └───────────┘
     │
     │   ┌──────────────┐   ┌──────────┐
     ├──▶│ UserAddresses│   │ Coupons  │
     │   │──────────────│   │──────────│
     │   │ Id (PK)      │   │ Id (PK)  │
     │   │ UserId       │   │ Code     │
     │   │ Label        │   │ Discount%│
     │   │ Street       │   │ MaxUses  │
     │   │ City/State   │   │ UsedCount│
     │   │ PostalCode   │   │ ExpiresAt│
     │   │ IsDefault    │   └──────────┘
     │   └──────────────┘
     │
     │   ┌──────────┐       ┌──────────┐
     └──▶│   Cart   │       │ Banners  │
         │──────────│       │──────────│
         │ Id (PK)  │       │ Id (PK)  │
         │ UserId   │       │ Title    │
         └────┬─────┘       │ Gradient │
              │             │ IsActive │
         ┌────▼──────┐      │SortOrder │
         │ CartItems │      └──────────┘
         │───────────│
         │ Id (PK)   │
         │ CartId    │
         │ ProductId │
         │ VariantId │
         │ Quantity  │
         └───────────┘
```

### 4.2 Key Table Descriptions

| Table           | Description |
|-----------------|-------------|
| Users           | All platform users. Role column (Customer/Seller/Admin) determines permissions. |
| Products        | Product catalogue. Linked to Category and a Seller (User). IsActive flag; also filtered by Seller.IsActive in all public queries. |
| ProductVariants | Size/color/stock variants of a product. PriceOverride is nullable. |
| Orders          | Customer orders. Stores final amounts, coupon used, and shipping address fields. |
| OrderItems      | Line items within an order. Stores the price at time of purchase. |
| Cart            | One cart per user. Managed server-side but reflected in client Zustand store. |
| CartItems       | Items in a cart. Variant-aware with optional VariantId. |
| Coupons         | Discount codes. MaxUses = 0 means unlimited. |
| UserAddresses   | Multiple addresses per user. One IsDefault per user enforced in service layer. |
| Reviews         | Customer reviews for products. Rating is integer 1–5. |
| Categories      | Product categories with icon and URL slug. |
| Brands          | Normalised brand names in a separate table (43 seeded). |
| Banners         | Hero banner slides managed by Admin. Ordered by SortOrder. |
| Wallets         | One wallet per Customer. Holds current balance. |
| WalletTransactions | Audit log of every credit/debit. Linked to an Order where applicable. |

### 4.3 Migration Strategy

Database schema is managed entirely through Entity Framework Core migrations. The application calls `db.Database.Migrate()` on every startup, meaning:
- Migrations apply automatically when the container starts.
- No manual database setup is required.
- New features add new migration files rather than modifying existing ones.

---

## 5. API Design

### 5.1 REST Conventions

| Convention | Implementation |
|-----------|---------------|
| Base URL | `/api/` |
| Versioning | Implicit (v1 only) |
| Authentication | `Authorization: Bearer <jwt>` header |
| Success format | JSON object or array |
| Error format | `{ "message": "error description" }` |
| HTTP Methods | GET (read), POST (create), PUT (full update), PATCH (partial), DELETE |

### 5.2 Endpoint Groups

#### Authentication — `/api/auth`
| Method | Endpoint          | Auth    | Description |
|--------|------------------|---------|-------------|
| POST   | /register         | None    | Create new account |
| POST   | /login            | None    | Login, receive JWT |
| PUT    | /profile          | Any     | Update display name |
| PUT    | /change-password  | Any     | Change password (verifies current) |
| POST   | /forgot-password  | None    | Send password reset email |
| POST   | /reset-password   | None    | Reset password using token from email |

#### Products — `/api/products`
| Method | Endpoint                       | Auth   | Description |
|--------|-------------------------------|--------|-------------|
| GET    | /                              | None   | List with filters (category, brand, price, rating, size, color, sort) |
| GET    | /{id}                          | None   | Product detail |
| GET    | /variant-options               | None   | Available sizes and colors |
| POST   | /                              | Seller | Create product |
| PUT    | /{id}                          | Seller | Update product |
| DELETE | /{id}                          | Seller | Delete product |

#### Orders — `/api/orders`
| Method | Endpoint         | Auth     | Description |
|--------|-----------------|----------|-------------|
| POST   | /               | Customer | Place order |
| GET    | /               | Customer | Own order history |
| GET    | /{id}           | Customer | Order detail |
| GET    | /{id}/invoice   | Customer/Admin | Download PDF invoice |
| POST   | /{id}/cancel    | Customer | Cancel a Pending or Processing order |
| PATCH  | /{id}/status    | Admin    | Update order status |
| GET    | /all            | Admin    | All orders across customers |

#### Cart — `/api/cart`
| Method | Endpoint           | Auth     | Description |
|--------|--------------------|----------|-------------|
| GET    | /                  | Customer | Get cart with items |
| POST   | /items             | Customer | Add item |
| PUT    | /items/{productId} | Customer | Update quantity |
| DELETE | /items/{productId} | Customer | Remove item |

#### Other Endpoint Groups
| Group            | Base Path           | Public Reads | Write Auth |
|------------------|---------------------|-------------|------------|
| Categories       | /api/categories     | Yes         | Admin only |
| Brands           | /api/brands         | Yes         | Admin only |
| Coupons          | /api/coupons        | Validate    | Admin only |
| Reviews          | /api/reviews        | Yes         | Customer   |
| Addresses        | /api/addresses      | No          | Owner only |
| Product Variants | /api/products/{id}/variants | Yes | Seller (own) |
| Banners          | /api/banners        | Active only | Admin only |
| Wallet           | /api/wallet         | No          | Customer only (balance + transactions) |
| Admin            | /api/admin          | No          | Admin only (users, sellers, products, stats) |
| Seller           | /api/seller         | No          | Seller only|

### 5.3 Request / Response Example

**POST /api/auth/login**

Request:
```
{
  "email": "customer@example.com",
  "password": "Pass@123"
}
```

Response (200 OK):
```
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "name": "Vipul Donga",
  "email": "customer@example.com",
  "role": "Customer"
}
```

Error Response (401 Unauthorized):
```
{
  "message": "Invalid email or password."
}
```

---

## 6. Frontend Architecture

### 6.1 Folder Structure

```
frontend/src/
├── app/
│   └── router.tsx              ← All routes with lazy loading
├── features/                   ← Feature-based modules
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   ├── pages/LoginPage.tsx
│   │   ├── pages/RegisterPage.tsx
│   │   ├── pages/ForgotPasswordPage.tsx
│   │   ├── pages/ResetPasswordPage.tsx
│   │   ├── store/useAuthStore.ts
│   │   └── types/auth.types.ts
│   ├── product/
│   ├── cart/
│   ├── order/
│   ├── seller/
│   ├── admin/
│   └── ...
└── shared/
    ├── api/client.ts           ← Axios instance with JWT interceptor
    ├── components/             ← Reusable UI components
    └── hooks/                  ← Custom React hooks
```

### 6.2 State Management

| State Type | Solution | Rationale |
|-----------|---------|-----------|
| Server state (products, orders) | Component-local with Axios | Simple, no extra library needed |
| Authentication | Zustand + persist | Survives page refresh |
| Cart | Zustand + persist | Offline-capable, no auth needed |
| Wishlist | Zustand + persist | Survives page refresh |

### 6.3 Authentication Flow

```
User submits login form
        ↓
POST /api/auth/login
        ↓
Response: { token, name, email, role }
        ↓
Stored in Zustand (localStorage via persist)
        ↓
Axios interceptor attaches:
  Authorization: Bearer <token>
to every subsequent request
        ↓
On 401 response → clear store → redirect to /login
```

### 6.4 Route Protection

Routes are protected by role at the router level. Attempting to access a protected route redirects to login if unauthenticated, or to home if the user's role is not permitted.

---

## 7. Security Design

### 7.1 Authentication

JWT tokens are signed with a minimum 32-character secret key configured via environment variable. The key is never committed to source control. The application throws an `InvalidOperationException` at startup if the key is missing or empty.

Tokens carry three claims: `sub` (user ID), `email`, and `role`. The role claim drives all `[Authorize(Roles="...")]` enforcement on controllers.

**Password Reset Flow:** A `POST /auth/forgot-password` request generates a cryptographically secure 64-character hex token (`RandomNumberGenerator.GetBytes(32)`), stores it on the User entity with a 1-hour expiry, and fires a reset email via Resend. The `POST /auth/reset-password` endpoint validates the token and expiry before hashing the new password and clearing the token. SMTP credentials are kept in the gitignored `appsettings.Development.json` and are never committed to source control.

### 7.2 Security Headers

Every HTTP response includes the following headers via `SecurityHeadersMiddleware`:

| Header | Value | Protection Against |
|--------|-------|-------------------|
| X-Content-Type-Options | nosniff | MIME sniffing |
| X-Frame-Options | DENY | Clickjacking |
| X-XSS-Protection | 1; mode=block | Reflected XSS (legacy browsers) |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer leakage |
| Permissions-Policy | camera=(), microphone=() | Feature abuse |

### 7.3 Rate Limiting

Implemented using .NET 8's built-in `AddRateLimiter` with fixed window limiters:

| Policy | Limit | Window | Applied To |
|--------|-------|--------|-----------|
| Global | 200 requests | 60 seconds per IP | All endpoints |
| auth | 10 requests | 60 seconds per IP | /login, /register |

Exceeding the limit returns HTTP 429 with a JSON error body.

### 7.4 Data Validation

- **Frontend**: Zod schemas validate all form inputs before submission. React Hook Form integrates with Zod for per-field error display.
- **Backend**: Data annotations on DTOs validate inputs at the API boundary. Service layer enforces additional business rules (stock availability, coupon validity).

---

## 8. Deployment Architecture

### 8.1 Docker Compose Services

```
┌─────────────────────────────────────────────────────────────┐
│                    docker-compose.yml                        │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │   frontend       │   │    backend       │               │
│  │   (Nginx:alpine) │   │  (aspnet:8.0)    │               │
│  │   Port: 80       │   │   Port: 8080     │               │
│  │                  │   │                  │               │
│  │ /api/* ────────────────────────────────▶│               │
│  │ SPA routing      │   │ Migrations on    │               │
│  │ Static assets    │   │ startup          │               │
│  └──────────────────┘   └────────┬─────────┘               │
│                                  │                          │
│                         ┌────────▼─────────┐               │
│                         │       db         │               │
│                         │  (mssql:2022)    │               │
│                         │   Port: 1433     │               │
│                         │   Volume: sqldata│               │
│                         └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Dockerfile Summary

**Backend** (`backend/Dockerfile`): Multi-stage build.
- Stage 1 (build): `mcr.microsoft.com/dotnet/sdk:8.0` — restores NuGet packages and publishes Release build.
- Stage 2 (runtime): `mcr.microsoft.com/dotnet/aspnet:8.0` — copies published output only. Final image is ~220MB vs ~900MB if SDK was included.

**Frontend** (`frontend/Dockerfile`): Multi-stage build.
- Stage 1 (build): `node:20-alpine` — installs npm packages and runs `vite build`.
- Stage 2 (runtime): `nginx:alpine` — serves the static `dist/` folder. Final image is ~45MB.

### 8.3 Environment Variables

| Variable | Required By | Description |
|---------|------------|-------------|
| DB_PASSWORD | db, backend | SQL Server SA password |
| JWT_KEY | backend | JWT signing key (min 32 chars) |
| ASPNETCORE_ENVIRONMENT | backend | Set to `Production` in Docker |
| ConnectionStrings__DefaultConnection | backend | Full SQL Server connection string |

---

## 9. CI/CD Pipeline

### 9.1 GitHub Actions Workflow

File: `.github/workflows/ci.yml`
Trigger: Push to `development` or `main`; Pull Request to `main`

```
┌─────────────────────────────────────────────┐
│               GitHub Actions CI              │
│                                             │
│  On push to: development, main              │
│  On PR to:   main                           │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Job 1: Test                         │  │
│  │  ─────────────────────────────────   │  │
│  │  1. Setup .NET 8                     │  │
│  │  2. Restore backend packages         │  │
│  │  3. Build backend (Release)          │  │
│  │  4. Run 22 xUnit tests               │  │
│  │  5. Setup Node 20                    │  │
│  │  6. npm ci                           │  │
│  │  7. Run 9 Vitest tests               │  │
│  └────────────────────┬─────────────────┘  │
│                       │ (only if all pass)  │
│  ┌────────────────────▼─────────────────┐  │
│  │  Job 2: Build Docker Images          │  │
│  │  ─────────────────────────────────   │  │
│  │  1. Set up Docker Buildx             │  │
│  │  2. Build prakashmart-backend image     │  │
│  │  3. Build prakashmart-frontend image    │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

Docker layer caching (`type=gha`) is used to speed up repeated builds by reusing unchanged layers from previous runs.

---

## 10. Testing Strategy

### 10.1 Backend Unit Tests (xUnit)

29 tests across 5 service classes. Each test class uses constructor injection of mocked dependencies via Moq.

| Test Class            | Tests | What is Verified |
|-----------------------|-------|-----------------|
| AuthServiceTests      | 6     | Registration, login, password validation, deactivated account |
| CouponServiceTests    | 5     | Coupon validation, expiry, case-insensitivity, usage limits, discount calculation |
| CartServiceTests      | 5     | Product/variant not found, insufficient stock, cart operations |
| OrderServiceTests     | 6     | Empty order, insufficient stock, coupon application, access control |
| ProductServiceTests   | 7     | GetById not found, inactive seller → 404, active seller, filtered listing, suggestions |

### 10.2 Frontend Unit Tests (Vitest)

9 tests for `useCartStore` covering all store mutations:

| Test | Scenario |
|------|---------|
| Add new item | Item appears in cart with quantity 1 |
| Increment | Same product increments quantity, not adds a new line |
| Variants | Same product with different variants = separate lines |
| Remove | Item is removed by productId |
| Total calculation | Correct sum across multiple items and quantities |
| Price override | Variant's overridden price is used in total |
| Clear cart | All items removed |
| Quantity to zero | Item is removed when quantity set to 0 |
| Item count | Sum of all quantities across items |

### 10.3 Test Coverage Summary

| Layer | Tests | Framework | Positive | Negative |
|-------|-------|-----------|---------|---------|
| Backend services | 29 | xUnit + Moq + FluentAssertions | 9 | 20 |
| Frontend store | 9 | Vitest | 7 | 2 |
| **Total** | **38** | | **16** | **22** |
