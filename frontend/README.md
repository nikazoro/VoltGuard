# 🔋 VoltGuard Frontend

Modern, full-featured React frontend for the VoltGuard EV charging network platform built with Vite, React Query, and Tailwind CSS.

## 🚀 Features

### For Drivers
- **Interactive Map Explorer**: Split-screen view with station list and Leaflet map
- **Real-time Availability**: Live station status with auto-refresh
- **Smart Booking**: Date/time picker with conflict detection (409 handling)
- **Booking Management**: View, track, and cancel reservations

### For Station Owners
- **Revenue Dashboard**: Analytics with Recharts visualization
- **Live Digital Twin**: Real-time telemetry monitoring via WebSocket
- **Station Management**: Update pricing, view performance metrics
- **Critical Alerts**: Flashing red borders on critical status

### For Admins
- **System-Wide Control**: Enable/disable stations
- **Live Alert Feed**: WebSocket-powered critical alerts stream
- **Network Overview**: Real-time stats and health monitoring

## 📦 Tech Stack

- **Core**: React 18 + Vite
- **State Management**: TanStack Query (React Query) v5
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS + ShadCN UI components
- **Maps**: React Leaflet + OpenStreetMap
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **WebSocket**: Native WebSocket with auto-reconnect
- **HTTP**: Axios with interceptors

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## ⚙️ Environment Variables

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # ShadCN components (Button, Dialog, etc.)
│   └── shared/             # Navbar, AuthGuard, LoadingSpinner
├── context/
│   └── AuthContext.jsx     # Global auth state
├── hooks/
│   ├── useAxios.js         # HTTP request hook
│   └── useSocket.js        # WebSocket hooks
├── pages/
│   ├── auth/               # Login, Register
│   ├── driver/             # MapExplorer, MyBookings
│   ├── owner/              # Dashboard, StationMonitor, Stations
│   └── admin/              # AdminConsole
├── services/
│   └── api.js              # Centralized API calls
└── lib/
    └── utils.js            # Utility functions
```

## 🔑 Key Features Implemented

### Authentication
- ✅ JWT token management with localStorage
- ✅ Automatic token refresh on 401 errors
- ✅ Role-based routing (driver/owner/admin)
- ✅ Session hydration on app load

### Driver Portal
- ✅ Split-screen layout (350px list + flex map)
- ✅ Custom Leaflet markers (green/red/blue)
- ✅ Synchronized hover effects between list and map
- ✅ 409 Conflict handling for double bookings
- ✅ Date/time validation with minimum/maximum duration

### Owner Dashboard
- ✅ Revenue analytics with line charts
- ✅ WebSocket integration for live telemetry
- ✅ Historical + live data merge (last 100 points)
- ✅ Red flashing border on critical alerts
- ✅ Multi-metric visualization (voltage, current, temperature)

### Admin Console
- ✅ System-wide station management
- ✅ Enable/disable station controls
- ✅ Live alert feed via WebSocket
- ✅ Scrolling alert list (last 50 alerts)
- ✅ Confirmation dialogs for critical actions

## 🎨 Design Patterns

### API Integration
All API calls centralized in `services/api.js`:
- Automatic JWT injection via interceptors
- 401 error handling with token refresh
- Consistent error response format

### WebSocket Management
Custom hooks in `hooks/useSocket.js`:
- Auto-reconnection with exponential backoff
- Configurable reconnect attempts
- Specialized hooks: `useOwnerTelemetry`, `useAdminAlerts`

### Form Validation
Zod schemas for all forms:
- Type-safe validation
- Custom error messages
- Integration with React Hook Form

## 🌐 API Endpoints Used

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Session hydration
- `POST /auth/refresh` - Token refresh

### Driver
- `GET /driver/stations/map` - Map view data
- `GET /stations/:id` - Station details
- `GET /stations/:id/availability` - Real-time availability
- `POST /bookings` - Create booking
- `GET /bookings/my` - User bookings
- `PATCH /bookings/:id/cancel` - Cancel booking

### Owner
- `GET /owner/stations` - Owner's stations
- `GET /owner/revenue` - Revenue data
- `GET /owner/revenue/breakdown` - Time-series revenue
- `GET /telemetry/station/:id` - Historical telemetry
- `PATCH /stations/:id/pricing` - Update pricing

### Admin
- `GET /admin/stations` - All stations
- `PATCH /admin/stations/:id/status` - Update station status
- `GET /admin/faults/critical` - Critical faults

### WebSocket
- `WS /ws/owner/telemetry` - Live telemetry stream
- `WS /ws/admin/alerts` - Critical alerts stream

## 🎯 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Output will be in the `dist/` folder, ready for deployment to any static hosting service.

## 📝 Demo Credentials

```
Driver:
Email: driver.rahul@gmail.com
Password: driver123

Station Owner:
Email: owner.delhi@VoltGuard.com
Password: owner123

Admin:
Email: admin@VoltGuard.com
Password: admin123
```

## 🧪 Testing Notes

- All forms include validation with helpful error messages
- Toast notifications for user feedback
- Loading states for async operations
- Empty states for zero-data scenarios
- Responsive design (mobile-friendly)

## 🔒 Security Features

- JWT tokens stored in localStorage
- Automatic token refresh before expiration
- Protected routes with role-based access control
- CSRF protection via token-based auth
- Secure WebSocket connections (WSS in production)

## 📊 Performance Optimizations

- React Query caching (5-minute stale time)
- Optimistic UI updates
- Lazy loading for routes (future enhancement)
- Debounced search inputs (future enhancement)
- Virtual scrolling for large lists (future enhancement)

## 🤝 Contributing

This is a capstone project. For educational purposes only.

## 📄 License

MIT License - Educational Project
