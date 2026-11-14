# GoBus - Intercity Bus Booking Management System

[![Node.js](https://img.shields.io/badge/Node.js-20+-68a063?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169e1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.x-2d3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React-19.x-61dafb?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38b2ac?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0.3-85ea2d?style=flat&logo=swagger&logoColor=black)](http://localhost:5000/api-docs)
[![Tests Passing](https://img.shields.io/badge/Tests-144%20Passing%20(121%20BE%20%2B%2023%20FE)-brightgreen?style=flat)](https://github.com/amanrj03/Bus-Booking)

A production-grade, enterprise-scale **Bus Booking Management System** engineered as a high-performance intercity coach reservation, fleet management, and real-time inventory operations platform.

GoBus models a modern intercity coach reservation platform connecting major Indian transit corridors (e.g., *Delhi ↔ Jaipur*, *Mumbai ↔ Pune*, *Bangalore ↔ Chennai*, *Delhi ↔ Manali*). The platform incorporates ACID-compliant concurrency locks, temporary seat reservation holds, dynamic pricing, tiered cancellation math, printable QR e-tickets, real-time passenger manifests, and executive analytics dashboards.

---

## Table of Contents

1. [Architectural Highlights](#1-architectural-highlights)
2. [Technology Stack](#2-technology-stack)
3. [Zero-Cloud Local Setup Guide](#3-zero-cloud-local-setup-guide)
4. [Documented Demo Accounts & Credentials](#4-documented-demo-accounts--credentials)
5. [Interactive Swagger / OpenAPI Documentation](#5-interactive-swagger--openapi-documentation)
6. [Concurrency Engine & Zero Double-Booking Guarantee](#6-concurrency-engine--zero-double-booking-guarantee)
7. [Tiered Cancellation & Instant Restock Rules](#7-tiered-cancellation--instant-restock-rules)
8. [Reporting, Analytics & Audit Logging](#8-reporting-analytics--audit-logging)
9. [Automated Test Suite & Benchmarks](#9-automated-test-suite--benchmarks)
10. [3–5 Minute Video Walkthrough Script](#10-35-minute-video-walkthrough-script)
11. [Engineering Capabilities & Architecture Matrix](#11-engineering-capabilities--architecture-matrix)
12. [Project Documentation Links](#12-project-documentation-links)

---

## 1. Architectural Highlights

- **Zero Double-Booking Guarantee:** Prevents race conditions during traffic surges using PostgreSQL pessimistic row-level locks (`SELECT ... FOR UPDATE`) executed within atomic Prisma transactions (`prisma.$transaction`).
- **10-Minute Temporary Hold Expiration:** When a passenger initiates checkout, contested seats transition to `LOCKED` with a 10-minute hold deadline (`lockedUntil = NOW() + 600s`). An automated lazy-sweep algorithm seamlessly restores uncontested seats back to `AVAILABLE` if abandoned.
- **Deterministic Tiered Cancellation Engine:** Enforces dynamic refund calculations ($100\%$ refund for $>24\text{h}$, $50\%$ refund for $12\text{--}24\text{h}$, and $0\%$ refund for $<12\text{h}$) while atomically returning cancelled seats to the live inventory without data loss.
- **Enterprise Observability:** Conductor-ready passenger manifests with instant printing, fleet occupancy rate analytics ($\frac{N_{\text{booked}}}{N_{\text{total}}} \times 100$), multi-axis Recharts financial dashboards, and an append-only audit trail logging all state mutations.
- **Zero Paid / Zero Cloud Dependencies:** Runs $100\%$ locally with standard Node.js and PostgreSQL.

```mermaid
flowchart TB
    subgraph Client["Frontend Client (React 19 + Tailwind CSS)"]
        UI_Search["Corridor Search & Filters"]
        UI_SeatMap["Interactive 2-Deck Seat Selection Drawer"]
        UI_Checkout["5-Step Checkout with 10:00 Hold Countdown"]
        UI_Ticket["Confirmation & Printable E-Ticket with QR"]
        UI_Admin["Admin Analytics Dashboard & Manifest Viewer"]
    end

    subgraph API["Backend API Gateway (Express.js 5 + Node.js 20)"]
        MW_Auth["JWT Authentication & RBAC Middleware"]
        MW_Doc["Swagger / OpenAPI 3.0.3 Engine (/api-docs)"]
        CTRL_Trip["Trip & Seat Inventory Controllers"]
        CTRL_Booking["Transactional Booking & Payment Controllers"]
        CTRL_Report["Manifest & Revenue Report Controllers"]
    end

    subgraph DB["Relational Database (PostgreSQL 16+ via Prisma ORM)"]
        LOCK["SELECT ... FOR UPDATE (Row-Level Locking)"]
        TABLES["15 Normalized Entities (Trips, Seats, Bookings, Payments, AuditLogs)"]
    end

    Client <-->|RESTful JSON API / Axios| API
    API --> MW_Auth
    API --> MW_Doc
    API --> CTRL_Trip
    API --> CTRL_Booking
    API --> CTRL_Report
    CTRL_Booking <--> LOCK
    LOCK <--> TABLES
```

---

## 2. Technology Stack

| Layer | Technologies | Rationale & Capabilities |
|---|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, React Router DOM 7 | Ultra-fast client-rendered SPA, responsive design system matching intercity coach platform aesthetics. |
| **Icons & UI** | `@heroicons/react` (Exclusively) | Consistent iconography across seat layouts, navigation, and badges. |
| **Data Viz** | Recharts 3.x | Area charts for 30-day booking revenue trends, bar charts for monthly totals, and occupancy distributions. |
| **Backend** | Node.js 20+, Express.js 5, CORS, Dotenv | High-performance asynchronous REST API architecture. |
| **Data & ORM** | PostgreSQL 16+, Prisma ORM 7.x | Strict relational schemas, automated migrations, batch queries, and pessimistic locking. |
| **Security** | JWT (`jsonwebtoken`), `bcryptjs`, `zod` | Stateless token authentication, 10-round salted password hashes, strict input payload validation. |
| **Documentation**| OpenAPI 3.0.3, Swagger UI (`swagger-ui-express`) | Interactive self-documenting REST API accessible at `/api-docs`. |
| **Testing** | Node.js Test Runner (`node --test`), Vitest 5, Supertest 7 | 144 automated tests spanning unit, integration, RBAC, and high-concurrency race suites. |

---

## 3. Zero-Cloud Local Setup Guide

Follow these steps to run GoBus locally in less than 3 minutes.

### 3.1 Prerequisites
- **Node.js:** v20.x or higher installed ([Download Node.js](https://nodejs.org/))
- **PostgreSQL:** v16.x or higher running locally on port `5432` ([Download PostgreSQL](https://www.postgresql.org/))
- **Git:** Installed and configured

---

### 3.2 Step 1: Clone Repository
```bash
git clone https://github.com/amanrj03/Bus-Booking.git
cd Bus-Booking
```

---

### 3.3 Step 2: Configure Environment Variables
Create a `.env` file in the `backend/` directory (or copy from `.env.example`):
```bash
cp .env.example backend/.env
```

Ensure `backend/.env` reflects your local PostgreSQL credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:your_password_here@localhost:5432/bus_booking_db?schema=public"
JWT_SECRET="gobus_super_secret_jwt_key_at_least_32_characters"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

---

### 3.4 Step 3: Database Setup & Large-Scale Seeding
Create the local database and run the Prisma migrations and seed script:
```bash
# In PostgreSQL CLI or pgAdmin:
createdb -U postgres bus_booking_db

# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Apply database schema migrations
npx prisma migrate dev --name init

# Seed the database with realistic Indian bus fleet data
npm run seed
```
> **Seeding Output:** Automatically populates ~15,000 relational records including 10 operators (Zingbus, IntrCity, Orange Travels), 45 buses, 1,700 seats, 35 routes, 250 trips, 650 bookings, and 450 audit logs.

---

### 3.5 Step 4: Start Backend API Server
```bash
# Inside backend/ directory:
npm run dev
```
- API Server runs at: `http://localhost:5000`
- Interactive Swagger UI: `http://localhost:5000/api-docs`
- Health check endpoint: `http://localhost:5000/api/v1/health`

---

### 3.6 Step 5: Start Frontend Client
Open a new terminal window:
```bash
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```
- Frontend application opens at: `http://localhost:5173`

---

## 4. Documented Demo Accounts & Credentials

The database is pre-seeded with authenticated accounts for all three RBAC roles (`ADMIN`, `OPERATOR`, `PASSENGER`). All accounts share the password: `Password123!`.

| Role | Email | Password | Pre-Seeded Context & Capabilities |
|---|---|---|---|
| **Admin** | `admin@busbooking.local` | `Password123!` | Global administrative access: View Recharts financial charts, manage all routes, inspect global audit logs. |
| **Super Admin** | `superadmin@busbooking.local` | `Password123!` | System oversight, role reassignments, and system-wide monitoring. |
| **Operator** | `zingbus@busbooking.local` | `Password123!` | Manages Zingbus Express fleet (12 luxury buses), scheduled trips, and real-time conductor passenger manifests. |
| **Operator** | `intrcity@busbooking.local` | `Password123!` | Manages IntrCity SmartBus fleet, occupancy analytics, and route dispatching. |
| **Passenger** | `passenger@busbooking.local` | `Password123!` | Pre-seeded with 3 active confirmed bookings (Delhi ↔ Manali, Mumbai ↔ Pune) for testing instant e-ticket QR generation. |
| **Passenger** | `rahul.sharma@example.com` | `Password123!` | Pre-seeded with 1 cancelled booking and processed refund audit history for testing cancellation records. |

---

## 5. Interactive Swagger / OpenAPI Documentation

GoBus provides complete OpenAPI 3.0.3 documentation integrated directly into Express.

- **Swagger UI Interactive Console:** `http://localhost:5000/api-docs`
- **Raw OpenAPI Spec JSON:** `http://localhost:5000/api-docs.json`

```mermaid
flowchart LR
    SWAG["Swagger UI (/api-docs)"] --> AUTH["Auth Endpoints (/auth/login, /register, /me)"]
    SWAG --> BUS["Fleet Endpoints (/buses, /routes, /stops)"]
    SWAG --> TRIP["Trip & Seat Endpoints (/trips/search, /lock-seats)"]
    SWAG --> BOOK["Booking & Payment Endpoints (/bookings, /cancellations)"]
    SWAG --> REP["Manifest & Analytics Endpoints (/reports/manifest, /occupancy, /revenue)"]
    SWAG --> AUDIT["Security Audit Logs (/audit-logs)"]
```

### Core API Endpoints Reference

| HTTP Method | Route | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Registers a new passenger account with bcrypt password hashing. |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials and returns a signed JWT. |
| `GET` | `/api/v1/auth/me` | Bearer Token | Retrieves authenticated user profile and assigned role. |
| `GET` | `/api/v1/trips/search` | Public | Searches scheduled trips by city pair, date, bus type, and price range. |
| `GET` | `/api/v1/trips/:id/seats` | Public | Returns real-time 2-deck seat layout with live `AVAILABLE`, `LOCKED`, or `BOOKED` statuses. |
| `POST` | `/api/v1/trips/:id/lock-seats` | Public / Auth | Acquires a 10-minute temporary row-lock on requested seats. |
| `POST` | `/api/v1/bookings` | Bearer Token | Atomically converts locked seats to `BOOKED` with simulated payment. |
| `GET` | `/api/v1/bookings/my-bookings` | Passenger | Retrieves authenticated passenger's active and past booking history. |
| `GET` | `/api/v1/bookings/:pnr` | Public / Auth | Retrieves ticket and passenger details by unique 8-character PNR. |
| `POST` | `/api/v1/cancellations` | Passenger / Admin | Cancels booking, calculates tiered refund, and re-releases seats. |
| `GET` | `/api/v1/reports/manifest/:tripId`| Operator / Admin | Generates conductor passenger manifest table with boarding status. |
| `GET` | `/api/v1/reports/occupancy` | Operator / Admin | Computes seat occupancy percentages across fleet and trips. |
| `GET` | `/api/v1/reports/revenue` | Operator / Admin | Aggregates daily/monthly gross and net revenue metrics. |
| `GET` | `/api/v1/audit-logs` | Admin | Retrieves paginated system audit trail with entity snapshots. |

---

## 6. Concurrency Engine & Zero Double-Booking Guarantee

The core engineering highlight of GoBus is its **zero double-booking guarantee**, enforced via PostgreSQL pessimistic locking:

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Passenger Alice
    actor Bob as Passenger Bob
    participant Engine as Concurrency Engine
    participant DB as PostgreSQL (TripSeat)

    Alice->>Engine: Lock Seat 1A (Trip DL-01)
    Bob->>Engine: Lock Seat 1A (Trip DL-01)

    Note over Engine,DB: Both requests initiate Prisma Transaction
    Engine->>DB: BEGIN TRANSACTION (Alice)
    Engine->>DB: SELECT * FROM "TripSeat" WHERE id = 'ts-1' FOR UPDATE;
    Note over DB: Alice acquires EXCLUSIVE ROW LOCK

    Engine->>DB: BEGIN TRANSACTION (Bob)
    Engine->>DB: SELECT * FROM "TripSeat" WHERE id = 'ts-1' FOR UPDATE;
    Note over DB: Bob BLOCKS waiting for Alice's transaction

    Note over Engine: Seat 1A is AVAILABLE
    Engine->>DB: UPDATE "TripSeat" SET status = 'LOCKED', lockedUntil = NOW() + 10m
    Engine->>DB: COMMIT TRANSACTION (Alice)
    Note over DB: Lock released. Alice receives HTTP 200

    Note over DB: Bob's SELECT FOR UPDATE resumes
    Note over Engine: Evaluates Seat 1A: status == 'LOCKED' AND lockedUntil > NOW()
    Engine->>DB: ROLLBACK TRANSACTION (Bob)
    Engine-->>Bob: HTTP 409 Conflict ("Seat 1A is currently locked")
```

- **Race Condition Immunity:** Even if 100 concurrent requests contest the exact same seat within the same millisecond, PostgreSQL serializes the lock acquisitions. Exactly 1 request succeeds; the other 99 receive deterministic `409 Conflict` responses.
- **Automated Verification:** Verified by `backend/src/tests/concurrency.race.test.js`.

---

## 7. Tiered Cancellation & Instant Restock Rules

When a passenger cancels a booking, GoBus dynamically calculates refund deductions based on the hours remaining until departure:

$$\Delta t = T_{\text{departure}} - T_{\text{now}}$$

```mermaid
flowchart TD
    REQ["Passenger Requests Cancellation"] --> CALC{"Calculate Δt = Departure - Current Time"}
    CALC -->|Δt ≥ 24 Hours| TIER1["Tier 1: 100% Refund, 0% Fee\n(Full customer refund)"]
    CALC -->|12 ≤ Δt < 24 Hours| TIER2["Tier 2: 50% Refund, 50% Fee\n(Partial deduction)"]
    CALC -->|Δt < 12 Hours| TIER3["Tier 3: 0% Refund, 100% Fee\n(Non-refundable departure window)"]
    
    TIER1 --> ATOMIC["Execute Atomic Prisma Transaction"]
    TIER2 --> ATOMIC
    TIER3 --> ATOMIC

    ATOMIC --> S1["1. Booking.status = 'CANCELLED'"]
    ATOMIC --> S2["2. Payment.paymentStatus = 'REFUNDED'"]
    ATOMIC --> S3["3. TripSeat.status = 'AVAILABLE' (Instantly re-bookable)"]
    ATOMIC --> S4["4. Create immutable Cancellation audit record"]
```

1. **Instant Restock:** Released seats transition to `AVAILABLE`, resetting `lockedUntil = NULL` and `currentBookingId = NULL`. Another passenger can book the seat immediately.
2. **Audit Preservation:** All historical records (`Booking`, `BookingPassenger`, `BookingSeat`, `Payment`, `Cancellation`) remain fully preserved for accounting and manifest auditing.

---

## 8. Reporting, Analytics & Audit Logging

### 8.1 Real-Time Passenger Manifest
- Generates a verified boarding list for bus captains and conductors.
- Displays passenger full name, age, gender, assigned seat code, boarding station, emergency contact number, and PNR.
- Built-in printable stylesheet optimizes layout for A4 print and PDF export.

### 8.2 Seat Occupancy Rate

$$\text{Occupancy Rate (\%)} = \left( \frac{N_{\text{booked seats}}}{N_{\text{total capacity}}} \right) \times 100$$

- Calculated dynamically across scheduled departures, individual routes, and fleet operators.

### 8.3 Recharts Executive Dashboard
- **Daily Revenue Trend:** Interactive SVG AreaChart displaying 30-day booking revenues.
- **Monthly Revenue:** BarChart comparing gross sales and net margins after cancellations.
- **Occupancy Breakdown:** Color-coded KPI cards and pie charts reflecting fleet utilization.

### 8.4 Append-Only Audit Logging
- Every sensitive mutation (user login, seat lock, reservation confirmation, cancellation, fleet edit) generates an immutable `AuditLog` row capturing actor `userId`, `action`, target `entity`, `entityId`, timestamp, client `ipAddress`, and full JSON state diff.

---

## 9. Automated Test Suite & Benchmarks

The GoBus platform is protected by a 144-test automated test suite across backend and frontend stacks:

```bash
# Run all Backend Tests (121 tests, 46 suites)
cd backend
npm test

# Run Concurrency Race-Condition Test specifically
node --test src/tests/concurrency.race.test.js

# Run Frontend Tests (23 tests, 5 suites)
cd frontend
npm test

# Run Frontend Production Build Check
npm run build
```

### Test Suite Summary

| Scope | Test File | Tests | Key Scenarios Covered |
|---|---|---|---|
| **Backend** | `concurrency.race.test.js` | Stress | Simultaneous parallel requests for identical seat; verifies zero double-booking and proper 409 responses. |
| **Backend** | `cancellation.test.js`, `cancellation.lifecycle.test.js` | 14 | Tiered refund percentages ($100\%, 50\%, 0\%$), seat re-stocking to `AVAILABLE`. |
| **Backend** | `booking.test.js`, `booking.service.test.js` | 22 | PNR generation, payment simulation, 10-minute hold expiration sweep. |
| **Backend** | `auth.test.js`, `audit.test.js` | 14 | JWT issuance, password hashing, role-based route guard enforcement (401/403). |
| **Backend** | `report.test.js`, `swagger.test.js` | 18 | Passenger manifest generation, occupancy formula, OpenAPI schema validity. |
| **Frontend** | `seatLayout.test.jsx` | 7 | Interactive 2-deck seat selection, steering wheel indicator, price calculation. |
| **Frontend** | `ticketConfirmation.test.jsx` | 6 | E-ticket rendering, dynamic QR code generation, browser print trigger. |
| **Frontend** | `myBookings.test.jsx` | 4 | Passenger booking history list, cancellation modal flow. |
| **Frontend** | `adminDashboard.test.jsx` | 3 | KPI cards, Recharts chart rendering, operator filtering. |
| **Frontend** | `manifestAudit.test.jsx` | 3 | Conductor manifest table, passenger list formatting, audit log viewer. |

---

## 10. 3–5 Minute Video Walkthrough Script

Use this structured script when recording the evaluation video walkthrough:

| Time | Segment | Screen / View | Narration & Action Guide |
|---|---|---|---|
| **0:00 – 0:45** | **Architecture & Tech Stack** | Codebase & Swagger UI (`/api-docs`) | *"Welcome to GoBus, an enterprise-grade intercity bus booking platform. Here is our architecture: Node.js, Express, PostgreSQL 16 with Prisma ORM, and React 19 with Tailwind CSS. Over 15,000 realistic records are seeded, and all endpoints are documented in Swagger OpenAPI 3.0."* |
| **0:45 – 1:45** | **Passenger Search & Checkout** | Home Page (`/`) ➔ Search Results (`/search`) ➔ Checkout (`/checkout`) | *"Let's book a coach from Delhi to Jaipur on Nov 15. The search results show live availability, amenities, and departure times. Opening the seat drawer shows our 2-deck layout with steering wheel cabin orientation. Selecting seat 4A locks it instantly with our 10-minute hold countdown timer. We complete the 5-step checkout with simulated UPI payment and land on our confirmed e-ticket with dynamic QR code and unique PNR."* |
| **1:45 – 2:45** | **Concurrency & Zero Double-Booking** | Terminal (`npm test src/tests/concurrency.race.test.js`) | *"Now let's demonstrate our concurrency engine. When multiple passengers try to lock or book the exact same seat simultaneously, PostgreSQL row-level locks serialize the operations. Running our automated concurrency test suite proves that exactly 1 request acquires the seat while all parallel requests receive a clean 409 Conflict. Zero overselling is mathematically guaranteed."* |
| **2:45 – 3:45** | **Tiered Cancellation & Seat Restock** | Passenger Portal (`/my-bookings`) | *"Under 'My Bookings', passengers can view upcoming and past journeys. Initiating a cancellation triggers our tiered refund calculation engine: cancelling 36 hours prior grants a full 100% refund. Submitting the cancellation marks the booking as CANCELLED, records a refund audit entry, and immediately releases the seat back to AVAILABLE for other passengers to book."* |
| **3:45 – 4:45** | **Admin Dashboard & Passenger Manifest** | Admin Portal (`/admin/dashboard` & `/admin/manifest`) | *"Logging in as an Admin or Operator opens the executive dashboard powered by Recharts, showing 30-day revenue trends, occupancy percentages, and fleet health. Conductor manifests provide a printable passenger roster with boarding stops, age, gender, and contact info. Every sensitive operation is tracked in our append-only audit log."* |
| **4:45 – 5:00** | **Conclusion & Quality Assurance** | Terminal (Test suites passing) | *"All 121 backend tests and 23 frontend tests pass with zero warnings, validating complete system reliability and performance. Thank you!"* |

---

## 11. Engineering Capabilities & Architecture Matrix

| Capability Domain | Architecture Requirement | GoBus Implementation | Source References |
|---|---|---|---|
| **System Architecture** | Clean separation of concerns, decoupled frontend/backend | Modular Node.js/Express REST API and Vite + React 19 SPA monorepo. | `backend/src/`, `frontend/src/` |
| **Relational Database** | Normalized schema, foreign keys, cascade rules, indexing | 15 Prisma models with composite unique keys, OnDelete constraints, and hot-path indexes. | [ER_DIAGRAM.md](file:///D:/Bus%20Booking/docs/ER_DIAGRAM.md), `backend/prisma/schema.prisma` |
| **Concurrency Control** | Double-booking prevention during concurrent checkout | PostgreSQL `SELECT ... FOR UPDATE` row locks inside atomic Prisma transactions. | `backend/src/services/trip.service.js`, `backend/src/services/booking.service.js` |
| **Seat Hold Lifecycle** | Temporary hold expiration mechanism | 10-minute hold timer with timestamp deadline (`lockedUntil`) and lazy-sweep re-release. | `backend/src/services/booking.service.js`, `frontend/src/pages/CheckoutPage.jsx` |
| **Cancellation Rules** | Tiered refund calculation and seat re-availability | 3-tiered cancellation policy ($100\%, 50\%, 0\%$) with atomic seat status reset to `AVAILABLE`. | `backend/src/services/cancellation.service.js`, `frontend/src/components/booking/CancellationModal.jsx` |
| **Reporting & Manifests**| Conductor passenger manifests, occupancy %, revenue | Dedicated report service generating passenger rosters, occupancy formulas, and Recharts charts. | `backend/src/services/report.service.js`, `frontend/src/pages/AdminDashboardPage.jsx` |
| **Security & RBAC** | Stateless JWT authentication, role authorization, audit logs | JWT middleware with `ADMIN`, `OPERATOR`, `PASSENGER` role guards and append-only audit trail. | `backend/src/middleware/auth.middleware.js`, `backend/src/services/audit.service.js` |
| **API Documentation** | Complete API specification for all endpoints | OpenAPI 3.0.3 specification accessible via Swagger UI at `/api-docs`. | `backend/src/docs/swagger.js`, `backend/src/docs/openapi.json` |
| **Automated Testing** | Unit, integration, and concurrency race tests | 144 automated tests (121 backend, 23 frontend) passing with zero failures. | `backend/src/tests/`, `frontend/src/tests/` |

---

## 12. Project Documentation Links

- **Database ER Diagram & Data Dictionary:** [docs/ER_DIAGRAM.md](file:///D:/Bus%20Booking/docs/ER_DIAGRAM.md)
- **Technical Architecture & Concurrency Specification:** [docs/TECHNICAL_REPORT.md](file:///D:/Bus%20Booking/docs/TECHNICAL_REPORT.md)
- **UI Research & Design System Specification:** [docs/UI_DESIGN_SYSTEM.md](file:///D:/Bus%20Booking/docs/UI_DESIGN_SYSTEM.md)
- **OpenAPI 3.0 Specification:** [backend/src/docs/openapi.json](file:///D:/Bus%20Booking/backend/src/docs/openapi.json)

---

**GoBus Technologies — Safe, Reliable & Connected Intercity Transit**
