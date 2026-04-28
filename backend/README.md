# VoltGuard Backend

AI-Powered EV Station Management System

VoltGuard is a production-grade backend system for managing electric vehicle charging stations with **real-time telemetry**, **AI anomaly detection**, **distance-based discovery**, **secure bookings**, and **role-based access control**.

This section contains **only the backend** (FastAPI + MySQL).
The frontend consumes these APIs separately.

---

## 1. Tech Stack

### Core

* Python 3.10+
* FastAPI (async)
* Uvicorn

### Database

* MySQL 8.0
* SQLAlchemy 2.0 (async)
* aiomysql
* Alembic (migrations)

### Security

* JWT (python-jose)
* OAuth2PasswordBearer
* passlib (bcrypt)

### Background & AI

* APScheduler (IoT simulator)
* scikit-learn (IsolationForest)
* numpy
* joblib

### Optional

* WebSockets (real-time updates)
* Spatial indexing (MySQL GIS)

---

## 2. Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── dependencies/
│   │   │   ├── auth.py
│   │   │   └── roles.py
│   │   └── v1/
│   │       └── endpoints/
│   ├── core/
│   │   ├── config.py
│   │   └──  security.py
│   │
│   ├── db/
│   │   ├── session.py
│   │   ├── types.py
│   │   └── base.py
│   ├── models/
│   │   ├── models.py
│   │   └── notification.py
│   ├── schemas/
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── simulator.py
│   │   └── ai_singleton.py
│   └── main.py
├── alembic/
├── requirements.txt
└── README.md

```

---

## 3. Environment Setup

### 3.1 Create virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # Linux / macOS
.venv\Scripts\activate      # Windows

```

### 3.2 Install dependencies

```bash
pip install -r requirements.txt

```

---

## 4. Environment Variables

Create a `.env` file in `backend/`:

```env
# App
APP_NAME=VoltGuard
ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=VoltGuard
DB_USER=VoltGuard_user
DB_PASSWORD=VoltGuard_password

# JWT
JWT_SECRET_KEY=supersecretkey
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

```

---

## 5. Database Setup (CRITICAL SECTION)

⚠️ **Read this section carefully** — the system depends heavily on database features.

### 5.1 Install MySQL 8.0

Ensure MySQL **8.0+** is installed.

Verify:

```sql
SELECT VERSION();

```

---

### 5.2 Create Database and User

```sql
CREATE DATABASE VoltGuard CHARACTER SET utf8mb4;
CREATE USER 'VoltGuard_user'@'localhost' IDENTIFIED BY 'VoltGuard_password';
GRANT ALL PRIVILEGES ON VoltGuard.* TO 'VoltGuard_user'@'localhost';
FLUSH PRIVILEGES;

```

---

### 5.3 Alembic Migrations

Initialize tables using Alembic:

```bash
alembic upgrade head

```

This creates:

* users
* stations
* bookings
* station_telemetry
* notifications

---

## 6. Sample Data & Demo Credentials (IMPORTANT FOR TESTING)

This repository includes an **example SQL database export** containing **pre-seeded users, stations, bookings, telemetry, and notifications**.

You may import this SQL file directly for **instant testing and evaluation**.

### 6.1 Import Sample Data (Optional but Recommended)

```bash
mysql -u VoltGuard_user -p VoltGuard < sample_database.sql

```

---

### 6.2 Demo Login Credentials

The following users are available after importing the sample SQL data:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@ecocharge.com` | `admin123` |
| Owner (Delhi) | `owner.delhi@ecocharge.com` | `owner123` |
| Owner (BLR) | `owner.bangalore@ecocharge.com` | `owner123` |
| Driver (Rahul) | `driver.rahul@gmail.com` | `driver123` |
| Driver (Anita) | `driver.anita@gmail.com` | `driver123` |

🔐 **Notes**

* Passwords are stored as **bcrypt hashes**
* These credentials are **for demo / evaluation only**
* Do **not** use in production

---

## 7. AI Model Setup

### 7.1 Train initial anomaly model

Run once:

```bash
python -m app.services.ai_service

```

This generates:

```
models/anomaly_model.pkl

```

The model is loaded **once** at startup via a singleton.

---

## 8. Background Services

### IoT Digital Twin Simulator

* Runs every 5 seconds
* Generates voltage/current/temperature
* Injects faults with ~5% probability
* Writes to `station_telemetry`

Started automatically on app startup.

---

## 9. Running the Server

```bash
uvicorn app.main:app --reload

```

Server runs at:

```
http://localhost:8000

```

---

## 10. API Documentation

* Swagger UI:
`http://localhost:8000/docs`
* OpenAPI JSON:
`http://localhost:8000/openapi.json`
* Redoc (optional generation):

```bash
npx redoc-cli bundle http://localhost:8000/openapi.json -o api-docs.html

```

---

## 11. Authentication & Roles

### Roles

* `driver`
* `owner`
* `admin`

### Flow

* JWT authentication (`get_current_user`)
* Role enforcement via `require_role`
* Disabled users blocked globally

---

## 12. Core Features Implemented

* Secure authentication (JWT)
* Role-based authorization
* Station discovery with distance sorting
* Spatial index optimization
* Booking with optimistic locking (double-booking prevention)
* AI anomaly detection (IsolationForest)
* Real-time telemetry ingestion
* Revenue analytics (derived, not stored)
* Notifications system
* Admin moderation
* WebSocket-ready architecture

---

## 13. Important Design Decisions

* Distance computed in DB, not Python
* AI model loaded once (singleton)
* Revenue derived from bookings (no duplication)
* Async I/O everywhere
* Clean architecture separation
* No frontend logic in backend

---

## 14. Common Issues

### Stations map returns empty

* Check spatial column exists
* Ensure `location` is populated
* Verify SRID = 4326

### Login fails

* Ensure bcrypt hashes are valid
* Check JWT_SECRET_KEY consistency

### Revenue shows zero

* Only `completed` bookings count
* Verify booking status in DB

---

## 15. 🤝 Contributing

This is a capstone project. For educational purposes only.

## 16. 📄 License

MIT License - Educational Project