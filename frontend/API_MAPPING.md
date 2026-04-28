# API Endpoint Mapping

This document maps the frontend API calls to the actual backend endpoints.

## Base URL Structure
- **Frontend Config**: `VITE_API_URL=http://localhost:8000/api`
- **Auto-added suffix**: `/v1`
- **Final Base**: `http://localhost:8000/api/v1`

## Authentication Endpoints

| Frontend Call | Actual Backend Endpoint | Method | Returns |
|--------------|-------------------------|--------|---------|
| `authAPI.register(data)` | `POST /api/v1/auth/register` | POST | `UserRead` (not token) |
| `authAPI.login(credentials)` | `POST /api/v1/auth/login` | POST | `{ access_token: string }` |
| `authAPI.me()` | `GET /api/v1/auth/me` | GET | User object with role |
| `authAPI.logout()` | `POST /api/v1/auth/logout` | POST | Success response |

### Auth Flow
1. **Register**: 
   - Call `/auth/register` → Get `UserRead`
   - Call `/auth/login` → Get `access_token`
   - Call `/auth/me` → Get user with role
   
2. **Login**:
   - Call `/auth/login` → Get `access_token`
   - Call `/auth/me` → Get user with role

## Station Endpoints

| Frontend Call | Backend Endpoint | Response Structure |
|--------------|------------------|-------------------|
| `stationAPI.getAll()` | `GET /api/v1/stations/` | Array of stations |
| `stationAPI.getById(id)` | `GET /api/v1/stations/{station_id}` | Station object |
| `stationAPI.getMapView(params)` | `GET /api/v1/driver/stations/map` | Map view array (see below) |
| `stationAPI.getAvailability(id)` | `GET /api/v1/stations/{station_id}/availability` | Availability object |

### Driver Map Request

**Endpoint:**
```
GET /api/v1/driver/stations/map?user_lat=28.6139&user_lng=77.2090&radius_km=20
```

**Query Parameters:**
- `user_lat` (required): User's latitude
- `user_lng` (required): User's longitude  
- `radius_km` (required): Search radius in kilometers

**Example Request:**
```javascript
stationAPI.getMapView({
  user_lat: 28.6139,
  user_lng: 77.2090,
  radius_km: 20
})
```

### Driver Map Response Structure
```json
[
  {
    "station_id": 100,
    "lat": 28.6315,
    "lng": 77.2167,
    "distance_km": 2.1,
    "availability": "AVAILABLE",
    "health": "CRITICAL",
    "price_per_hour": 99
  }
]
```

**Important Fields:**
- `station_id` (not `id`)
- `lat` / `lng` (not `latitude` / `longitude`)
- `distance_km` - Distance from user location to station
- `availability`: "AVAILABLE" or other status
- `health`: "OK", "CRITICAL", "WARNING"

**Sorted By:** Distance (closest stations first)

## Booking Endpoints

| Frontend Call | Backend Endpoint | Notes |
|--------------|------------------|-------|
| `bookingAPI.create(data)` | `POST /api/v1/bookings/` | Returns 201, requires start_time and end_time |
| `bookingAPI.getMy()` | `GET /api/v1/bookings/my` | Returns array |
| `bookingAPI.getById(id)` | `GET /api/v1/bookings/{booking_id}` | |
| `bookingAPI.cancel(id)` | `PATCH /api/v1/bookings/{booking_id}/cancel` | |

### Create Booking Request Format

**Frontend Input (from user):**
```javascript
{
  start_time: "2026-01-26T23:00",  // datetime-local input
  duration_hours: 2                 // number input
}
```

**Backend Request (calculated):**
```json
{
  "station_id": 101,
  "start_time": "2026-01-26T23:00:00.000Z",
  "end_time": "2026-01-27T01:00:00.000Z"
}
```

**Important:** 
- Frontend calculates `end_time` = `start_time` + `duration_hours`
- Handles date rollover (e.g., 11 PM + 2 hours = 1 AM next day)
- Sends both times as ISO 8601 strings

### Create Booking Response
```json
{
  "id": 1002,
  "user_id": 4,
  "station_id": 101,
  "start_time": "2026-01-25T11:15:35",
  "end_time": "2026-02-25T11:15:35",
  "status": "confirmed",
  "version": 1
}
```

### Booking Calculation Example

**Example 1: Same Day**
```
Input:  26 Jan 2026, 10:00 AM + 2 hours
Output: 
  start_time: 2026-01-26T10:00:00.000Z
  end_time:   2026-01-26T12:00:00.000Z
```

**Example 2: Next Day (Date Rollover)**
```
Input:  26 Jan 2026, 11:00 PM + 2 hours
Output:
  start_time: 2026-01-26T23:00:00.000Z
  end_time:   2026-01-27T01:00:00.000Z  ← Next day!
```

**Example 3: Half Hour Duration**
```
Input:  25 Jan 2026, 3:30 PM + 0.5 hours
Output:
  start_time: 2026-01-25T15:30:00.000Z
  end_time:   2026-01-25T16:00:00.000Z
```

## Owner Endpoints

| Frontend Call | Backend Endpoint | Request Body | Response Structure |
|--------------|------------------|--------------|-------------------|
| `ownerAPI.getStations()` | `GET /api/v1/owner/stations` | - | Array of stations |
| `ownerAPI.getStationById(id)` | `GET /api/v1/owner/stations/{station_id}` | - | Station object |
| `ownerAPI.updatePricing(id, price)` | `PATCH /api/v1/owner/stations/{station_id}/pricing` | `number` | Updated station |
| `ownerAPI.getRevenue()` | `GET /api/v1/owner/revenue` | - | Revenue object (see below) |
| `ownerAPI.getRevenueBreakdown()` | `GET /api/v1/owner/revenue/breakdown` | - | Breakdown array (see below) |

### Revenue Response Structure
```json
{
  "total": 440,
  "this_week": 440,
  "growth_percentage": null,
  "period": "All time",
  "completed_bookings": 1,
  "active_bookings": 0
}
```

**Note:** `growth_percentage` can be `null` if no previous data exists.

### Revenue Breakdown Response Structure
```json
[
  {
    "date": "2026-01-22",
    "revenue": 440
  }
]
```

### Important: Pricing Update
The backend expects just a number, not an object:
```javascript
// ✅ Correct
ownerAPI.updatePricing(stationId, 15.5)

// ❌ Wrong
ownerAPI.updatePricing(stationId, { price_per_hour: 15.5 })
```

## Telemetry & Analytics

| Frontend Call | Backend Endpoint |
|--------------|------------------|
| `telemetryAPI.getStationTelemetry(id)` | `GET /api/v1/telemetry/station/{station_id}` |
| `telemetryAPI.getAIAnalysis(id)` | `GET /api/v1/ai/station/{station_id}` |
| `analyticsAPI.getStationAnalytics(id)` | `GET /api/v1/analytics/station/{station_id}` |
| `analyticsAPI.getUsage()` | `GET /api/v1/analytics/usage` |
| `analyticsAPI.getRevenue()` | `GET /api/v1/analytics/revenue` |

## Admin Endpoints

| Frontend Call | Backend Endpoint | Request Body |
|--------------|------------------|--------------|
| `adminAPI.getAllStations()` | `GET /api/v1/admin/stations` | - |
| `adminAPI.updateStationStatus(id, data)` | `PATCH /api/v1/admin/stations/{station_id}/status` | `StationStatus` schema |
| `adminAPI.getCriticalFaults()` | `GET /api/v1/admin/faults/critical` | - |
| `adminAPI.disableUser(id)` | `PATCH /api/v1/admin/users/{user_id}/disable` | - |
| `adminAPI.enableUser(id)` | `PATCH /api/v1/admin/users/{user_id}/enable` | - |

## Profile Endpoints

| Frontend Call | Backend Endpoint |
|--------------|------------------|
| `profileAPI.get()` | `GET /api/v1/profile/` |
| `profileAPI.update(data)` | `PATCH /api/v1/profile/` |

## Notification Endpoints

| Frontend Call | Backend Endpoint | Returns |
|--------------|------------------|---------|
| `notificationAPI.getAll()` | `GET /api/v1/notifications` | Array of notifications |
| `notificationAPI.markAsRead(id)` | `PATCH /api/v1/notifications/{id}/read` | `{ notification_id, status }` |

### Notification Response Structure
```json
[
  {
    "id": 12,
    "title": "Critical Station Alert",
    "message": "High temperature detected.",
    "type": "fault",
    "is_read": false,
    "created_at": "2026-01-25T10:30:00Z",
    "read_at": null
  }
]
```

### Mark as Read Response
```json
{
  "notification_id": 12,
  "status": "read"
}
```

### Notification Types
- `fault` - Station/system faults
- `booking` - Booking updates
- `system` - System notifications
- Other types as defined by backend

## Status Endpoints

| Frontend Call | Backend Endpoint |
|--------------|------------------|
| `chargerAPI.getStatus(id)` | `GET /api/v1/chargers/{charger_id}/status` |

## System Endpoints

| Frontend Call | Backend Endpoint | Notes |
|--------------|------------------|-------|
| `systemAPI.health()` | `GET /health` | Root level, not `/api/v1` |

## WebSocket Endpoints

| Frontend Hook | Backend Endpoint | Notes |
|--------------|------------------|-------|
| `useOwnerTelemetry(stationId)` | `WS /ws/owner/telemetry` | Pass token as query param |
| `useAdminAlerts()` | `WS /ws/admin/alerts` | Pass token as query param |

### WebSocket Connection
```javascript
const wsUrl = `ws://localhost:8000/ws/owner/telemetry?token=${token}`;
```

## Error Response Format

Backend returns errors in this format:
```json
{
  "detail": "Error message here"
}
```

Frontend expects and handles:
- `error.response.data.detail`
- `error.response.data.message`
- `error.response.status`

## Key Differences from Original Spec

1. ✅ All endpoints prefixed with `/api/v1/`
2. ✅ Login returns only token, need to call `/auth/me`
3. ✅ Register returns `UserRead`, need to login separately
4. ✅ Trailing slashes on some endpoints (`/stations/`, `/bookings/`, `/profile/`)
5. ✅ Pricing update sends number directly, not object
6. ✅ Health check at root `/health`, not `/api/v1/health`
7. ✅ Error responses use `detail` field

## Testing Endpoints

Use these curl commands to test:

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test","role":"driver"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get user (with token)
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```