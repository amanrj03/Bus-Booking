# Bus Booking Management System

A production-style, full-stack **Bus Booking Management System** engineered for the Full-Stack Web Development internship assessment at **Algions AI Labs Private Limited**.

---

## 1. Project Overview

The system models a high-throughput, modern bus ticketing platform serving major Indian intercity corridors (e.g. *Delhi ↔ Jaipur*, *Mumbai ↔ Pune*, *Bangalore ↔ Chennai*).

### Key Architectural Highlights
- **Decoupled Architecture:** Independent Vite + React frontend and Node.js + Express REST API backend.
- **Transactional Seat Concurrency:** PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) in atomic Prisma transactions with composite unique constraints to guarantee zero double bookings.
- **Dynamic Inventory & Cancellation History:** Released seats become instantly re-bookable while retaining complete immutable historical records for accounting and audit manifests.
- **Large-Scale Realistic Seed Dataset:** ~15,000 relational records spanning 10 operators, 45 buses, 35 routes, 250 trips, 650 bookings, and 450 audit logs.
- **Zero Paid Dependencies:** Runs 100% locally on Node.js and PostgreSQL 18.

---

## 2. Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, Heroicons (`@heroicons/react` exclusively), React Router DOM, Axios, Recharts.
- **Backend:** Node.js, Express.js, JWT (`jsonwebtoken`), `bcryptjs`, `zod` validation, Prisma ORM.
- **Database:** Local PostgreSQL 18.
- **Testing:** Supertest, Jest/Vitest.
- **Documentation:** Swagger/OpenAPI, Markdown ER Diagram, Technical Report.

---

## 3. Directory Layout

```text
bus-booking-management-system/
├── frontend/             # Vite + React Client Application
│   ├── src/
│   │   ├── components/   # Reusable UI & design system
│   │   ├── pages/        # Customer & Admin pages
│   │   ├── context/      # Auth & Global state
│   │   ├── services/     # Axios API service layer
│   │   └── ...
│   └── package.json
│
├── backend/              # Express.js REST API Server
│   ├── prisma/
│   │   ├── schema.prisma # PostgreSQL Data Models
│   │   ├── migrations/   # Repeatable migrations
│   │   └── seed.js       # Large-scale realistic Indian bus dataset
│   ├── src/
│   │   ├── config/       # Environment & DB clients
│   │   ├── controllers/  # API endpoint handlers
│   │   ├── services/     # Business logic & concurrency engine
│   │   ├── middleware/   # JWT, RBAC & Central Error handling
│   │   ├── validators/   # Zod request schemas
│   │   ├── routes/       # Express route definitions
│   │   └── ...
│   └── package.json
│
├── docs/                 # System Architecture & Documentation
│   ├── ER_DIAGRAM.md
│   ├── API_DOCUMENTATION.md
│   └── TECHNICAL_REPORT.md
│
├── UI_INSPIRATION/       # Visual reference & design inspiration
├── .env.example          # Environment variable template
├── .gitignore
└── README.md
```

---

## 4. Setup & Installation (Upcoming)

Detailed instructions for local database setup, Prisma migrations, and running the frontend and backend servers will be documented as each module is scaffolded.

