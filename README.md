# 🔋 VoltGuard

### AI-Powered B2B2C EV Charging Ecosystem

**VoltGuard** is a production-grade marketplace for Electric Vehicle (EV) infrastructure. It bridges the gap between EV Drivers and Station Owners using a **Digital Twin architecture**, **AI-driven anomaly detection**, and **Optimistic Concurrency Control**.

This repository is a **monorepo** containing both the API server and the Client application.

---

## 📂 Repository Structure

The project is divided into two distinct applications:

| Directory | Service | Description | Documentation |
| --- | --- | --- | --- |
| **`/backend`** | **API Server** | FastAPI, AI Models (Scikit-Learn), IoT Simulator, MySQL DB. | [📄 **View Backend Guide](./backend/README.md)** |
| **`/frontend`** | **Client UI** | React, Vite, Tailwind, Leaflet Maps, WebSockets. | [📄 **View Frontend Guide](./frontend/README.md)** |

---

## 🚀 Getting Started

To run the full VoltGuard stack, you will need to set up both the backend and frontend services. Please follow the setup guides in the order below.

### Step 1: Backend Setup

Initialize the database, train the AI model, and start the API server.
👉 **[Go to Backend Installation Guide](./backend/README.md)**

* **Goal:** Ensure the server is running at `http://localhost:8000`
* **Verify:** Check the API Docs at `http://localhost:8000/docs`

### Step 2: Frontend Setup

Install dependencies and launch the React user interface.
👉 **[Go to Frontend Installation Guide](./frontend/README.md)**

* **Goal:** Ensure the UI is running at `http://localhost:5173`
* **Verify:** You should see the login screen.

---

## 🏗️ System Architecture

The system operates on a client-server model with real-time bidirectional communication.

1. **Frontend (Driver/Owner/Admin)** sends REST requests to **FastAPI**.
2. **FastAPI** interacts with **MySQL** for transactional data (Bookings, Stations).
3. **IoT Simulator** (Background Task) pushes telemetry to the DB and **Isolation Forest** model.
4. **WebSockets** broadcast live updates (Anomalies, Revenue) back to the Frontend.

---

## 🔑 Demo Credentials

Once both services are running, you can log in using these pre-configured accounts:

| Role | Portal Features | Email | Password |
| --- | --- | --- | --- |
| **Driver** | Map Booking, History | `driver.rahul@gmail.com` | `driver123` |
| **Owner** | Revenue, Live Telemetry | `owner.delhi@ecocharge.com` | `owner123` |
| **Admin** | System Alerts, Controls | `admin@ecocharge.com` | `admin123` |

---

## 🧪 Quick Test: The "Digital Twin"

To verify the system's core feature:

1. **Login as Owner** (`owner.delhi@ecocharge.com`).
2. Go to the **"My Stations"** dashboard.
3. Observe the **Live Telemetry** graphs.
* *Note: The backend simulates data every 5 seconds. If the graphs move, the WebSocket is connected.*



---

## 📄 License

MIT License - Educational Capstone Project