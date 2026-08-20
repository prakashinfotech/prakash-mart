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
  footerTemplate: "<div style='font-size:10px;text-align:center;width:100%;color:#888;font-family:Arial,sans-serif;padding:0 40px'>AI-Powered PrakashMart &nbsp;·&nbsp; Software Requirements Specification &nbsp;·&nbsp; Page <span class='pageNumber'></span> of <span class='totalPages'></span></div>"
stylesheet: pdf-style.css
---

<div class="cover">
  <div class="cover-banner">
    <h1>Software Requirements Specification</h1>
    <h2>AI-Powered PrakashMart</h2>
    <p class="tagline">Academic Project &nbsp;·&nbsp; Full-Stack E-Commerce Platform &nbsp;·&nbsp; May 2026</p>
  </div>
  <div class="cover-meta">
    <table>
      <tbody>
        <tr><th>Document</th><td>Software Requirements Specification (SRS)</td></tr>
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

1. Introduction
2. Overall Description
3. User Classes and Characteristics
4. Functional Requirements
5. Non-Functional Requirements
6. Use Case Descriptions
7. System Constraints
8. Acceptance Criteria

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) describes the functional and non-functional requirements for the AI-Powered PrakashMart — a full-stack e-commerce web application developed as part of an academic project. The document serves as a reference for developers, evaluators, and stakeholders to understand what the system does and how it is expected to behave.

### 1.2 Scope

The AI-Powered PrakashMart is a multi-role e-commerce platform that replicates core PrakashMart functionality including product browsing, cart management, order placement, seller product management, and administrative control. The system is built using React (frontend) and .NET 8 Web API (backend) with SQL Server as the database.

The application supports three user roles:
- **Customer** — browses products, places orders, writes reviews
- **Seller** — manages product listings, monitors sales analytics
- **Admin** — oversees all users, products, orders, categories, and banners

### 1.3 Definitions and Acronyms

| Term      | Definition |
|-----------|-----------|
| SRS       | Software Requirements Specification |
| API       | Application Programming Interface |
| JWT       | JSON Web Token — used for stateless authentication |
| DTO       | Data Transfer Object — data contract between layers |
| UoW       | Unit of Work — manages database transaction boundaries |
| SKU       | Stock Keeping Unit — a product or variant identifier |
| CORS      | Cross-Origin Resource Sharing |
| HSTS      | HTTP Strict Transport Security |

### 1.4 References

- React 18 Documentation — https://react.dev
- .NET 8 Web API Documentation — https://learn.microsoft.com/en-us/aspnet/core
- Entity Framework Core 8 — https://learn.microsoft.com/en-us/ef/core
- PrakashMart.com — original platform used as design reference

---

## 2. Overall Description

### 2.1 Product Overview

The AI-Powered PrakashMart is a web-based e-commerce application accessible via any modern browser. It was developed with the assistance of Claude AI (Anthropic) to accelerate development across all phases — from architecture design to feature implementation, security hardening, testing, and containerization.

The system provides a complete shopping experience: users can register, browse a catalogue of products with detailed filters, add items to a cart, apply discount coupons, place orders with address management, and track order status through a timeline. Sellers can list and manage products including size and color variants. Administrators can manage the entire platform from a dedicated dashboard.

### 2.2 Product Context

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (User)                        │
│                React + Vite + TypeScript + Tailwind          │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP / REST (JSON)
                             │ via Nginx proxy (/api/)
┌────────────────────────────▼────────────────────────────────┐
│                   .NET 8 Web API (Backend)                   │
│          Clean Architecture: API / Application /             │
│          Domain / Infrastructure                             │
└────────────────────────────┬────────────────────────────────┘
                             │ Entity Framework Core
┌────────────────────────────▼────────────────────────────────┐
│              SQL Server 2022 (Database)                      │
│        Tables: Users, Products, Orders, Reviews,             │
│        Coupons, Variants, Banners, Addresses, etc.           │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Product Functions Summary

| Module                | Key Functions |
|-----------------------|--------------|
| Authentication        | Register, Login, JWT token, forgot/reset/change password, role-based access |
| Product Browsing      | Search, filter by price/brand/rating/size/color, sort, paginate |
| Product Detail        | Images, variants, reviews with rating distribution |
| Cart                  | Add/remove items, quantity control, variant-aware pricing |
| Wishlist              | Save/remove products, persisted across sessions |
| Checkout              | Address management, coupon discount, wallet deduction, dummy card, order summary |
| Orders                | Place order, view history, track status timeline, cancel order, download PDF invoice |
| Wallet                | Rs50 welcome bonus; credited on non-COD cancellation; use balance at checkout; transaction history |
| Reviews               | Submit ratings and comments, view aggregated ratings |
| Seller Portal         | Product CRUD, variant management, revenue analytics |
| Admin Dashboard       | User/seller management, order management, category/brand/coupon/banner CRUD |
| Dynamic Banners       | Admin-managed hero banners displayed on the home page |
| PDF Invoice           | iText7-generated branded invoice downloadable per order |
| Email Notifications   | Order confirmation, status update, and password reset emails via Resend |

### 2.4 Operating Environment

- **Frontend**: Any modern browser (Chrome, Firefox, Safari, Edge)
- **Backend**: .NET 8 runtime — Windows, Linux (Docker)
- **Database**: Microsoft SQL Server 2022 (Express edition for development)
- **Containerization**: Docker Desktop 29.x / Docker Compose
- **CI/CD**: GitHub Actions

---

## 3. User Classes and Characteristics

### 3.1 Customer

Customers are end users who browse the platform and purchase products. They require no technical knowledge. A customer must register and log in to access cart, checkout, order history, wishlist, and review submission features. Product browsing is available without authentication.

**Permissions:**
- Browse and search products (unauthenticated)
- Add to cart and wishlist (authenticated)
- Place orders and manage addresses (authenticated)
- Submit product reviews (authenticated)
- View own order history and tracking

### 3.2 Seller

Sellers are business owners or individuals who list products on the platform. They log in with a Seller account and access a dedicated dashboard. Sellers cannot place orders.

**Permissions:**
- Create, update, and delete own products
- Manage product variants (size, color, stock, price override)
- View sales analytics (revenue chart, top products)
- Cannot access Admin dashboard or place orders

### 3.3 Admin

Administrators manage the entire platform. They have the highest privilege level and access to a comprehensive management dashboard.

**Permissions:**
- View and toggle-active any user account
- Create seller accounts and toggle seller active/inactive status
- View and update status of all orders; download any order's PDF invoice
- Create, update, delete categories and brands
- Create, update, delete, and toggle coupon codes
- Create, update, delete, and toggle dynamic banners
- View all product listings

---

## 4. Functional Requirements

### 4.1 Authentication and Authorization

| ID     | Requirement |
|--------|------------|
| FR-01  | The system shall allow new users to register with a name, email, password, and confirm-password. |
| FR-02  | The system shall validate that the email is unique before creating a new account. |
| FR-03  | The system shall hash passwords before storing them in the database. |
| FR-04  | The system shall issue a JWT token upon successful login or registration. |
| FR-05  | The JWT token shall expire after 7 days. |
| FR-06  | The system shall reject login attempts for deactivated accounts. |
| FR-07  | The system shall enforce role-based access control on all protected endpoints. |
| FR-08  | The system shall automatically clear the session and redirect to login on 401 responses, except on auth endpoints where errors are shown inline. |
| FR-09  | The system shall allow users to request a password reset email containing a secure one-time token. |
| FR-10  | Password reset tokens shall expire after 1 hour and be invalidated after use. |
| FR-11  | Authenticated users shall be able to change their password by verifying their current password. |

### 4.2 Product Browsing and Search

| ID     | Requirement |
|--------|------------|
| FR-09  | The system shall display a paginated list of all active products. |
| FR-10  | The system shall support filtering by category, brand, price range, minimum rating, size, and color. |
| FR-11  | The system shall support sorting by relevance, price (ascending/descending), rating, and newest. |
| FR-12  | The system shall support keyword search across product names and descriptions. |
| FR-13  | The system shall display available size and color filter options dynamically from active product variants. |
| FR-14  | The system shall display a hero banner section on the home page with admin-configured banners. |
| FR-15  | The home page shall display products with ≥30% discount in a "Deals of the Day" section. |
| FR-16  | The home page shall display a "Best Sellers" section with top-rated products. |

### 4.3 Product Detail

| ID     | Requirement |
|--------|------------|
| FR-17  | The product detail page shall display product name, description, price, discount, rating, and stock. |
| FR-18  | The system shall display available product variants (size and/or color) with color swatch indicators. |
| FR-19  | Selecting a variant shall update the displayed price and stock if a price override is set. |
| FR-20  | The system shall display all customer reviews for a product with a rating summary and star distribution bars. |
| FR-21  | The system shall allow users to sort reviews by newest, highest rating, or lowest rating. |

### 4.4 Shopping Cart

| ID     | Requirement |
|--------|------------|
| FR-22  | The system shall allow authenticated customers to add products to a cart. |
| FR-23  | Adding a variant shall create a separate cart line from the same product without a variant. |
| FR-24  | The system shall allow customers to increase or decrease item quantity in the cart. |
| FR-25  | Reducing quantity to zero shall remove the item from the cart. |
| FR-26  | The cart shall persist across browser sessions using local storage. |
| FR-27  | The cart page shall display a "You May Also Like" section with products from the same category. |
| FR-28  | Admin and Seller roles shall not be able to access the cart or place orders. |

### 4.5 Wishlist

| ID     | Requirement |
|--------|------------|
| FR-29  | The system shall allow authenticated users to add or remove products from a wishlist. |
| FR-30  | The wishlist shall persist across sessions. |
| FR-31  | The heart icon on product cards shall reflect the current wishlist state of the product. |

### 4.6 Checkout and Orders

| ID     | Requirement |
|--------|------------|
| FR-32  | The system shall allow customers to place orders with a selected shipping address. |
| FR-33  | The system shall allow customers to save multiple addresses (Home, Work, Other) with one default. |
| FR-34  | The system shall support automatic location detection to pre-fill address fields. |
| FR-35  | The system shall allow a coupon code to be applied at checkout for a percentage discount. |
| FR-36  | The system shall validate coupon expiry, usage limit, and minimum order amount at checkout. |
| FR-37  | Placing an order shall deduct stock from the corresponding product or variant. |
| FR-38  | The system shall reject order placement if requested quantity exceeds available stock. |
| FR-39  | Customers shall be able to view a chronological order history. |
| FR-40  | Each order shall display a step-by-step tracking timeline (Placed → Confirmed → Shipped → Delivered). |
| FR-41  | Customers shall be able to download a branded PDF invoice for any of their orders. |
| FR-42  | The system shall send an order confirmation email to the customer after a successful order placement. |
| FR-43  | The system shall send a status update email when an admin changes an order's status. |
| FR-44W | Customers shall be able to cancel orders that are in Pending or Processing status. |
| FR-45W | The system shall credit the wallet when a non-COD order is cancelled (full total amount). |
| FR-46W | The system shall send a cancellation email notifying the customer of any wallet credit. |

### 4.6.1 Wallet

| ID     | Requirement |
|--------|------------|
| FR-47W | Each new customer account shall receive a Rs50 welcome bonus in their wallet upon registration. |
| FR-48W | Customers shall be able to view their wallet balance and full transaction history (Credit/Debit). |
| FR-49W | Customers shall be able to apply wallet balance as full or partial payment at checkout. |
| FR-50W | Wallet debit at checkout and order creation shall be atomic (single database transaction). |
| FR-51W | For COD orders, only the wallet portion used is refunded on cancellation (not the COD amount). |
| FR-52W | The wallet balance shall be visible in the navigation bar for authenticated customers. |

### 4.7 Reviews

| ID     | Requirement |
|--------|------------|
| FR-41  | Authenticated customers shall be able to submit a star rating (1–5) and comment for any product. |
| FR-42  | Product reviews shall be visible to all users including unauthenticated visitors. |
| FR-43  | The product detail page shall display an average rating, total review count, and rating distribution. |

### 4.8 Seller Portal

| ID     | Requirement |
|--------|------------|
| FR-44  | Sellers shall be able to create new product listings with name, description, price, category, brand, image, and stock. |
| FR-45  | Sellers shall be able to edit and delete only their own products. |
| FR-46  | Sellers shall be able to add product variants with size, color, additional stock, and optional price override. |
| FR-47  | Sellers shall be able to toggle a variant's active status. |
| FR-48  | The seller analytics page shall display a 6-month revenue bar chart and top-selling products. |

### 4.9 Admin Dashboard

| ID     | Requirement |
|--------|------------|
| FR-49  | Admins shall be able to view all registered users and toggle their active status. |
| FR-50  | Admins shall be able to create new seller accounts (name, email, temporary password). |
| FR-51  | Admins shall be able to toggle individual seller accounts between active and inactive. |
| FR-51a | When a seller is deactivated, all their products shall be hidden from the product listing, product detail page, and search suggestions immediately. |
| FR-52  | Admins shall be able to view all orders across all customers and update order status. |
| FR-53  | Admins shall be able to download a PDF invoice for any order. |
| FR-54  | Admins shall be able to create, update, and delete product categories. |
| FR-55  | Admins shall be able to create, update, and delete brands. |
| FR-56  | Admins shall be able to create coupon codes with discount percentage, max usage, and expiry date. |
| FR-57  | Admins shall be able to create, edit, toggle, and delete hero banners displayed on the home page. |

### 4.10 Coupons

| ID     | Requirement |
|--------|------------|
| FR-55  | A coupon shall have a code, discount percentage, maximum usage count, and expiry date. |
| FR-56  | The system shall validate coupons case-insensitively. |
| FR-57  | The system shall reject expired coupons. |
| FR-58  | The system shall reject coupons that have reached their maximum usage count. |
| FR-59  | The system shall apply the discount as a percentage of the order subtotal. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID      | Requirement |
|---------|------------|
| NFR-01  | API responses for product listing shall complete within 500ms under normal load. |
| NFR-02  | The frontend shall achieve a Lighthouse performance score of ≥ 80 in production build. |
| NFR-03  | Product images shall use optimised URLs with fallback placeholders on load failure. |

### 5.2 Security

| ID      | Requirement |
|---------|------------|
| NFR-04  | All passwords shall be hashed using BCrypt before storage. |
| NFR-05  | All protected API endpoints shall require a valid JWT bearer token. |
| NFR-06  | The system shall enforce HTTPS and HSTS headers in non-development environments. |
| NFR-07  | The system shall respond with security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy. |
| NFR-08  | Authentication endpoints (login, register) shall be rate-limited to 10 requests per minute per IP. |
| NFR-09  | All other API endpoints shall be rate-limited to 200 requests per minute per IP. |
| NFR-10  | JWT signing keys shall never be committed to source control. |
| NFR-11  | CORS shall only allow origins defined in configuration, not wildcards. |

### 5.3 Reliability and Availability

| ID      | Requirement |
|---------|------------|
| NFR-12  | The application shall apply database migrations automatically on startup. |
| NFR-13  | The backend container shall restart automatically on failure. |
| NFR-14  | SQL Server data shall be persisted in a Docker named volume to survive container restarts. |

### 5.4 Scalability

| ID      | Requirement |
|---------|------------|
| NFR-15  | The application shall be containerised with Docker to enable horizontal scaling. |
| NFR-16  | The backend shall be stateless (JWT-based auth) to allow multiple instances. |

### 5.5 Usability

| ID      | Requirement |
|---------|------------|
| NFR-17  | The application shall be responsive and usable on desktop and tablet screen sizes. |
| NFR-18  | The UI shall provide clear loading indicators and error messages. |
| NFR-19  | Forms shall display inline validation errors before submission. |

### 5.6 Maintainability

| ID      | Requirement |
|---------|------------|
| NFR-20  | The backend shall follow Clean Architecture with clear separation between Domain, Application, Infrastructure, and API layers. |
| NFR-21  | The frontend shall use TypeScript in strict mode with no `any` types. |
| NFR-22  | All database schema changes shall be managed through EF Core migrations. |
| NFR-23  | The CI/CD pipeline shall run all unit tests before building Docker images. |

---

## 6. Use Case Descriptions

### UC-01: Customer Places an Order

**Actor:** Customer
**Preconditions:** Customer is logged in, cart has at least one item.

**Main Flow:**
1. Customer navigates to the cart page and clicks "Proceed to Checkout."
2. System displays saved addresses; customer selects one or enters a new address.
3. Customer optionally enters a coupon code and clicks "Apply."
4. System validates the coupon and displays the discount amount.
5. Customer selects a payment method and clicks "Place Order."
6. System validates stock availability for each item.
7. System deducts stock, creates the order, and marks the coupon as redeemed.
8. System clears the cart and redirects to the order confirmation page.

**Alternate Flow — Insufficient Stock:**
- At step 6, if any item's requested quantity exceeds stock, the system returns an error and the order is not placed.

**Alternate Flow — Invalid Coupon:**
- At step 4, if the coupon is expired or exhausted, the system displays an error message and does not apply a discount.

---

### UC-02: Seller Adds a Product Variant

**Actor:** Seller
**Preconditions:** Seller is logged in, at least one product exists.

**Main Flow:**
1. Seller navigates to the Seller Dashboard and selects a product.
2. Seller clicks the "Manage Variants" icon.
3. System displays a modal with existing variants.
4. Seller fills in size, color, stock, and optional price override, then clicks "Add Variant."
5. System saves the variant and displays it in the list.

---

### UC-03: Admin Deactivates a User

**Actor:** Admin
**Preconditions:** Admin is logged in.

**Main Flow:**
1. Admin navigates to the Admin Dashboard and selects the "Users" tab.
2. System displays a list of all registered users with their current status.
3. Admin clicks the toggle button next to a user.
4. System sets the user's IsActive flag to false.
5. The deactivated user cannot log in until reactivated.

---

## 7. System Constraints

| Constraint | Description |
|-----------|-------------|
| Browser Support | Modern browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) |
| Database | Microsoft SQL Server 2022 or SQL Server Express |
| Runtime | .NET 8 SDK required for development; Docker for production |
| Authentication | JWT only — no OAuth or social login in current version |
| Payment | Payment is simulated — no real payment gateway integration |
| Image Storage | Product images are external URLs (Unsplash CDN) — no file upload in current version |

---

## 8. Acceptance Criteria

| Feature | Acceptance Criteria |
|---------|-------------------|
| Registration | New user can register; duplicate email returns a 409 error |
| Login | Valid credentials return a JWT; invalid credentials return error shown inline on form |
| Forgot Password | Reset email is sent; token expires after 1 hour; one-time use only |
| Change Password | Current password must match; new password is saved and old sessions remain valid |
| Product Filter | Filtering by size/color returns only products with matching active variants |
| Cart Variants | Same product with different variants creates separate cart lines |
| Coupon | SAVE20 applies 20% discount; expired coupon returns an error |
| Order Stock | Order with quantity > stock returns 400 "Insufficient stock" |
| Order Invoice | PDF downloads with correct order items, totals, and discount |
| Seller Creation | Admin can create a seller account; duplicate email returns a 409 error |
| Seller Toggle | Admin can deactivate/reactivate a seller; deactivated seller cannot log in |
| Role Guard | Seller/Admin cannot access cart or checkout; Seller link hidden from Admin navbar |
| Rate Limit | More than 10 login attempts per minute from one IP returns 429 |
| Docker | `docker compose up` starts all three services and the app is accessible at http://localhost |
| CI | Push to development triggers GitHub Actions; all 31 tests must pass before Docker build |
