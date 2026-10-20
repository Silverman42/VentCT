# Vent Africa CT Service V2 — REST API Documentation

Comprehensive API Reference for **Vent Africa Campus Tour & Campaign Tracking Service (CTServiceBackendV2)**.

- **Base URL (Local)**: `http://localhost:8000/api` or `https://ctservicebackendv2.test/api`
- **Base URL (Staging)**: `https://staging-ctbackend.vent.africa/api`
- **Base URL (Production)**: `https://ctbackend.vent.africa/api`
- **API Version**: `v2.0`
- **Authentication**: Laravel Sanctum (`Authorization: Bearer <token>`)

---

## Table of Contents

1. [Standard Conventions & Response Envelopes](#1-standard-conventions--response-envelopes)
2. [Authentication & Account Recovery](#2-authentication--account-recovery)
3. [Public Event QR Self-Registration](#3-public-event-qr-self-registration)
4. [Campaigns Management](#4-campaigns-management)
5. [Promoters Management](#5-promoters-management)
6. [Audiences Management](#6-audiences-management)
7. [Attendances Management](#7-attendances-management)
8. [Events Management & QR Codes](#8-events-management--qr-codes)
9. [Deep Links Engine](#9-deep-links-engine)
10. [Dashboard Analytics & Digest](#10-dashboard-analytics--digest)
11. [RBAC: Roles, Permissions & User Delegation](#11-rbac-roles-permissions--user-delegation)
12. [User Invitations](#12-user-invitations)
13. [Forensic Activity Logs](#13-forensic-activity-logs)
14. [System Health, Diagnostics & Inbound Webhooks](#14-system-health-diagnostics--inbound-webhooks)

---

## 1. Standard Conventions & Response Envelopes

### Standard Headers
All requests interacting with JSON endpoints must send:
```http
Accept: application/json
Content-Type: application/json
```
Authenticated endpoints require:
```http
Authorization: Bearer <plainTextToken>
```

### Standard Success Response Envelope
All successful requests return HTTP `200 OK` (or `201 Created` for resource creation):
```json
{
  "status": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 1,
    "last_page": 1
  },
  "errors": null
}
```

### Standard Validation Failure (`422 Unprocessable Content`)
```json
{
  "status": false,
  "message": "The given data was invalid.",
  "data": null,
  "errors": {
    "email": [
      "The email field is required.",
      "The email has already been taken."
    ]
  }
}
```

### Standard Error Status Codes
| HTTP Code | Name | Description |
| :--- | :--- | :--- |
| `200` | OK | Request processed successfully. |
| `201` | Created | Resource successfully persisted. |
| `401` | Unauthorized | Missing, invalid, or expired Bearer token. |
| `403` | Forbidden | Insufficient Spatie RBAC permissions. |
| `404` | Not Found | Resource UUID or model not found. |
| `422` | Unprocessable Content | FormRequest payload validation failed. |
| `429` | Too Many Requests | Rate limit exceeded. |
| `500` | Server Error | Internal unhandled server error. |

---

## 2. Authentication & Account Recovery

### 2.1 Admin Login
Authenticates an administrator with credentials and issues a plaintext Sanctum Bearer token.
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Rate Limit**: `5 requests / minute`
- **Access**: Public

#### Request Body
```json
{
  "email": "admin@vent.africa",
  "password": "Password123!",
  "device_name": "Chrome macOS Admin Dashboard"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Login successful",
  "data": {
    "token": "1|raF9bQO1sJvUo6n3i4s7Wxyz890...",
    "user": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de912345",
      "name": "Super Admin",
      "email": "admin@vent.africa",
      "roles": ["Super Admin"],
      "permissions": ["*"]
    }
  },
  "errors": null
}
```

---

### 2.2 Get Authenticated User
Fetches the profile and assigned role/permission capabilities of the active session.
- **Method**: `GET`
- **Endpoint**: `/api/auth/user` (or `/api/user`)
- **Access**: Authenticated (`auth:sanctum`)

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de912345",
    "name": "Super Admin",
    "email": "admin@vent.africa",
    "roles": ["Super Admin"],
    "permissions": ["campaigns.view", "campaigns.create", "events.view"]
  },
  "errors": null
}
```

---

### 2.3 Logout
Revokes the current Sanctum token.
- **Method**: `POST`
- **Endpoint**: `/api/auth/logout`
- **Access**: Authenticated (`auth:sanctum`)

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Logged out successfully",
  "data": null,
  "errors": null
}
```

---

### 2.4 Forgot Password (Request OTP)
Sends a 6-digit numeric OTP to the user's verified email.
- **Method**: `POST`
- **Endpoint**: `/api/auth/forgot-password`
- **Rate Limit**: `5 requests / minute`
- **Access**: Public

#### Request Body
```json
{
  "email": "admin@vent.africa"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Password reset verification code sent to your email",
  "data": {
    "email": "admin@vent.africa",
    "expires_in_minutes": 15
  },
  "errors": null
}
```

---

### 2.5 Verify Password Reset OTP
Verifies the 6-digit OTP code received via email.
- **Method**: `POST`
- **Endpoint**: `/api/auth/forgot-password/verify-code`
- **Rate Limit**: `5 requests / minute`
- **Access**: Public

#### Request Body
```json
{
  "email": "admin@vent.africa",
  "code": "481920"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Verification code confirmed",
  "data": {
    "email": "admin@vent.africa",
    "reset_token": "prt_89e4726bf0a13d..."
  },
  "errors": null
}
```

---

### 2.6 Resend Password Reset OTP
Invalidates the previous OTP and issues a fresh one with atomic lock protection.
- **Method**: `POST`
- **Endpoint**: `/api/auth/forgot-password/resend`
- **Rate Limit**: `3 requests / minute`
- **Access**: Public

#### Request Body
```json
{
  "email": "admin@vent.africa"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "New verification code sent successfully",
  "data": {
    "email": "admin@vent.africa",
    "expires_in_minutes": 15
  },
  "errors": null
}
```

---

### 2.7 Reset Password
Sets a new password once the reset OTP or token has been validated.
- **Method**: `POST`
- **Endpoint**: `/api/auth/forgot-password/reset`
- **Rate Limit**: `5 requests / minute`
- **Access**: Public

#### Request Body
```json
{
  "email": "admin@vent.africa",
  "code": "481920",
  "password": "NewSecurePassword2026!",
  "password_confirmation": "NewSecurePassword2026!"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Password has been reset successfully. Please log in.",
  "data": null,
  "errors": null
}
```

---

### 2.8 Inspect User Invitation Token
Validates an invitation link token sent to an onboarded team member.
- **Method**: `GET`
- **Endpoint**: `/api/auth/invitations/{token}`
- **Access**: Public

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Invitation is valid",
  "data": {
    "email": "new.member@vent.africa",
    "role": "Campaign Manager",
    "expires_at": "2026-10-14T10:00:00.000000Z"
  },
  "errors": null
}
```

---

### 2.9 Accept User Invitation
Completes registration for an invited admin by setting their name and password.
- **Method**: `POST`
- **Endpoint**: `/api/auth/invitations/{token}/accept`
- **Access**: Public

#### Request Body
```json
{
  "name": "Alex Johnson",
  "password": "StrongPassword2026!",
  "password_confirmation": "StrongPassword2026!"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Invitation accepted successfully. Account activated.",
  "data": {
    "token": "2|abcdef123456789...",
    "user": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de999999",
      "name": "Alex Johnson",
      "email": "new.member@vent.africa",
      "roles": ["Campaign Manager"]
    }
  },
  "errors": null
}
```

---

## 3. Public Event QR Self-Registration

### 3.1 Public Event Details on QR Scan
Retrieves public-facing event metadata when an attendee scans the physical QR code at a venue.
- **Method**: `GET`
- **Endpoint**: `/api/public/events/{slug}`
- **Rate Limit**: `60 requests / minute`
- **Access**: Public (no token needed)

#### URL Parameters
- `slug` *(string, required)*: The unique event slug (e.g., `campus-ambassador-tour-unilag-x7k2q9`).

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Event details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
    "name": "Campus Ambassador Tour UNILAG",
    "slug": "campus-ambassador-tour-unilag-x7k2q9",
    "description": "Vent Africa university campus onboarding and crypto adoption tour.",
    "venue": "Main Auditorium, University of Lagos, Akoka",
    "event_date": "2026-10-15T10:00:00.000000Z",
    "status": "running",
    "status_label": "Running",
    "target": 500,
    "banner_url": "https://assets.vent.africa/banners/unilag-tour.png",
    "auto_check_in_on_scan": true
  },
  "errors": null
}
```

---

### 3.2 Public Attendee Self-Registration & Check-In
Allows an attendee to register their attendance on the public landing page.
- **Method**: `POST`
- **Endpoint**: `/api/public/events/{slug}/register`
- **Rate Limit**: `30 requests / minute`
- **Access**: Public

#### Request Body
```json
{
  "name": "Emeka Chukwu",
  "email": "emeka.chukwu@example.com",
  "phone": "+2348099887766",
  "referral_code": "CAMPUS01"
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Registration and attendance recorded successfully",
  "data": {
    "attendance_id": "9d8e5730-80ea-43f1-b9ea-c0b8de222222",
    "name": "Emeka Chukwu",
    "email": "emeka.chukwu@example.com",
    "phone": "+2348099887766",
    "status": "attended",
    "status_label": "Attended",
    "method": "qr_scan",
    "event": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
      "name": "Campus Ambassador Tour UNILAG",
      "slug": "campus-ambassador-tour-unilag-x7k2q9"
    }
  },
  "errors": null
}
```

---

## 4. Campaigns Management

### 4.1 List Campaigns
- **Method**: `GET`
- **Endpoint**: `/api/admin/campaigns`
- **Permission**: `campaigns.view`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `per_page` *(int, default: 15, max: 100)*
  - `search` *(string, optional)*: Matches `name` or `slug`.
  - `status` *(string, optional)*: `all`, `pending`, `running`, `closed`.

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Campaigns retrieved successfully",
  "data": {
    "summary": {
      "total_campaigns": 24,
      "running_count": 8,
      "pending_count": 12,
      "closed_count": 4
    },
    "campaigns": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "name": "Q4 Campus Tour 2026",
        "slug": "q4-campus-tour-2026",
        "description": "Nationwide university onboarding blitz.",
        "status": "running",
        "target": 5000,
        "start_date": "2026-10-01",
        "end_date": "2026-12-15",
        "banner_url": "https://assets.vent.africa/campaigns/q4.png",
        "promoters_count": 35,
        "audiences_count": 1420,
        "created_at": "2026-09-20T12:00:00.000000Z",
        "updated_at": "2026-10-01T00:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 24,
    "last_page": 2
  },
  "errors": null
}
```

---

### 4.2 Create Campaign
- **Method**: `POST`
- **Endpoint**: `/api/admin/campaigns`
- **Permission**: `campaigns.create`

#### Request Body
```json
{
  "name": "Q4 Campus Tour 2026",
  "description": "Nationwide university onboarding blitz.",
  "status": "pending",
  "target": 5000,
  "start_date": "2026-10-01",
  "end_date": "2026-12-15",
  "banner_url": "https://assets.vent.africa/campaigns/q4.png"
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Campaign created successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "name": "Q4 Campus Tour 2026",
    "slug": "q4-campus-tour-2026",
    "status": "pending",
    "target": 5000
  },
  "errors": null
}
```

---

### 4.3 Show Campaign Details
- **Method**: `GET`
- **Endpoint**: `/api/admin/campaigns/{campaign}`
- **Permission**: `campaigns.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Campaign details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "name": "Q4 Campus Tour 2026",
    "slug": "q4-campus-tour-2026",
    "description": "Nationwide university onboarding blitz.",
    "status": "running",
    "target": 5000,
    "metrics": {
      "total_promoters": 35,
      "total_audiences": 1420,
      "verified_audiences": 980,
      "transacted_audiences": 450,
      "total_events": 6
    }
  },
  "errors": null
}
```

---

### 4.4 Update Campaign
- **Method**: `PUT`
- **Endpoint**: `/api/admin/campaigns/{campaign}`
- **Permission**: `campaigns.update`

#### Request Body
```json
{
  "name": "Q4 Campus Tour 2026 - Extended",
  "status": "running",
  "target": 6000
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Campaign updated successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "name": "Q4 Campus Tour 2026 - Extended",
    "status": "running",
    "target": 6000
  },
  "errors": null
}
```

---

### 4.5 Delete Campaign
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/campaigns/{campaign}`
- **Permission**: `campaigns.delete`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Campaign deleted successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333"
  },
  "errors": null
}
```

---

### 4.6 Batch Delete Campaigns
- **Method**: `POST`
- **Endpoint**: `/api/admin/campaigns/batch-delete`
- **Permission**: `campaigns.delete`

#### Request Body
```json
{
  "campaign_ids": [
    "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "9d8e5730-80ea-43f1-b9ea-c0b8de444444"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "2 campaigns deleted successfully",
  "data": {
    "deleted_count": 2
  },
  "errors": null
}
```

---

### 4.7 Export Campaigns
- **Method**: `GET`
- **Endpoint**: `/api/admin/campaigns/export`
- **Permission**: `campaigns.export`
- **Query Parameters**:
  - `format` *(string, default: `xlsx`, options: `xlsx`, `csv`)*
  - `search` *(string, optional)*
  - `status` *(string, optional)*
- **Response**: Binary file download (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` or `text/csv`).

---

## 5. Promoters Management

### 5.1 List Promoters (With Dynamic Summary Metrics)
- **Method**: `GET`
- **Endpoint**: `/api/admin/promoters`
- **Permission**: `promoters.view`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `per_page` *(int, default: 15)*
  - `campaign_id` *(uuid, optional)*: Filter by assigned campaign.
  - `search` *(string, optional)*: Matches name, email, referral code, or phone.

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Promoters retrieved successfully",
  "data": {
    "summary": {
      "total_promoters": 25,
      "total_audience": 840,
      "verified_users": 620,
      "completed_trades": 310,
      "conversion_rate": 36.9
    },
    "promoters": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de555555",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "campaign_name": "Q4 Campus Tour 2026",
        "name": "Jane Doe",
        "email": "jane.doe@promoter.vent.africa",
        "phone": "+2348011223344",
        "referral_code": "JANE01",
        "app_referral_link": "https://vent.africa.app.link/JANE01",
        "web_referral_link": "https://dashboard.vent.africa/auth/sign-up?ref=JANE01",
        "avatar_url": "https://assets.vent.africa/avatars/jane.jpg",
        "created_at": "2026-10-02T08:00:00.000000Z",
        "updated_at": "2026-10-02T08:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 25
  },
  "errors": null
}
```

---

### 5.2 Onboard New Promoter
Automatically mints unique referral codes and deep link strings.
- **Method**: `POST`
- **Endpoint**: `/api/admin/promoters`
- **Permission**: `promoters.create`

#### Request Body
```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "name": "Samuel Okon",
  "email": "samuel.okon@vent.africa",
  "phone": "+2348033221100",
  "referral_code": "SAMUEL01",
  "avatar_url": "https://assets.vent.africa/avatars/samuel.jpg"
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Promoter created successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
    "name": "Samuel Okon",
    "email": "samuel.okon@vent.africa",
    "referral_code": "SAMUEL01",
    "app_referral_link": "https://vent.africa.app.link/SAMUEL01",
    "web_referral_link": "https://dashboard.vent.africa/auth/sign-up?ref=SAMUEL01"
  },
  "errors": null
}
```

---

### 5.3 Show Promoter Profile
- **Method**: `GET`
- **Endpoint**: `/api/admin/promoters/{promoter}`
- **Permission**: `promoters.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Promoter profile retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
    "name": "Samuel Okon",
    "email": "samuel.okon@vent.africa",
    "phone": "+2348033221100",
    "referral_code": "SAMUEL01",
    "metrics": {
      "total_audience": 85,
      "verified_audience": 64,
      "transacted_audience": 32,
      "conversion_rate": 37.65
    }
  },
  "errors": null
}
```

---

### 5.4 Update Promoter
- **Method**: `PUT`
- **Endpoint**: `/api/admin/promoters/{promoter}`
- **Permission**: `promoters.update`

#### Request Body
```json
{
  "name": "Samuel Okon Jr.",
  "phone": "+2348033221199"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Promoter updated successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
    "name": "Samuel Okon Jr."
  },
  "errors": null
}
```

---

### 5.5 Delete Promoter
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/promoters/{promoter}`
- **Permission**: `promoters.delete`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Promoter deleted successfully",
  "data": null,
  "errors": null
}
```

---

### 5.6 Export Promoters
- **Method**: `GET`
- **Endpoint**: `/api/admin/promoters/export`
- **Permission**: `promoters.export`
- **Query Parameters**: `format` (`xlsx` / `csv`), `campaign_id`, `search`.
- **Response**: Binary spreadsheet download.

---

## 6. Audiences Management

### 6.1 List Audiences
- **Method**: `GET`
- **Endpoint**: `/api/admin/audiences`
- **Permission**: `audiences.view`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `per_page` *(int, default: 15)*
  - `campaign_id` *(uuid, optional)*
  - `promoter_id` *(uuid, optional)*
  - `status` *(string, options: `all`, `verified`, `unverified`, `transacted`)*
  - `search` *(string, optional)*

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Audiences retrieved successfully",
  "data": {
    "summary": {
      "total_audiences": 1250,
      "verified_count": 890,
      "transacted_count": 420,
      "unverified_count": 360
    },
    "audiences": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de777777",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "promoter_id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
        "name": "Chinedu Eze",
        "email": "chinedu.eze@gmail.com",
        "phone": "+2348077665544",
        "is_verified": true,
        "has_transacted": true,
        "verified_at": "2026-10-03T14:20:00.000000Z",
        "first_trade_at": "2026-10-04T09:15:00.000000Z",
        "created_at": "2026-10-02T11:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 1250
  },
  "errors": null
}
```

---

### 6.2 Record Individual Audience
- **Method**: `POST`
- **Endpoint**: `/api/admin/audiences`
- **Permission**: `audiences.create`

#### Request Body
```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "promoter_id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
  "name": "Grace Adeleke",
  "email": "grace.adeleke@gmail.com",
  "phone": "+2348055443322",
  "is_verified": false
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Audience member created successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de888888",
    "name": "Grace Adeleke",
    "email": "grace.adeleke@gmail.com"
  },
  "errors": null
}
```

---

### 6.3 Show Audience Details
- **Method**: `GET`
- **Endpoint**: `/api/admin/audiences/{audience}`
- **Permission**: `audiences.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Audience details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de888888",
    "campaign": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
      "name": "Q4 Campus Tour 2026"
    },
    "promoter": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
      "name": "Samuel Okon"
    },
    "name": "Grace Adeleke",
    "email": "grace.adeleke@gmail.com",
    "is_verified": false,
    "has_transacted": false
  },
  "errors": null
}
```

---

### 6.4 Batch Import Audiences (`CSV / XLS / XLSX`)
Supports batch file upload with SHA-256 idempotency fingerprinting to prevent duplicate imports.
- **Method**: `POST`
- **Endpoint**: `/api/admin/audiences/import-csv`
- **Permission**: `audiences.create`
- **Content-Type**: `multipart/form-data`

#### Request Parameters
- `file` *(file, required)*: `.csv`, `.xls`, or `.xlsx` spreadsheet (max: 20MB).
- `campaign_id` *(uuid, required)*: Target campaign UUID.

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Import processed successfully",
  "data": {
    "total_rows": 250,
    "imported_count": 242,
    "skipped_duplicates": 8,
    "errors": []
  },
  "errors": null
}
```

---

### 6.5 Export Audiences
- **Method**: `GET`
- **Endpoint**: `/api/admin/audiences/export`
- **Permission**: `audiences.export`
- **Query Parameters**: `format` (`xlsx` / `csv`), `campaign_id`, `promoter_id`, `status`.
- **Response**: Binary spreadsheet file.

---

## 7. Attendances Management

### 7.1 List Attendances
- **Method**: `GET`
- **Endpoint**: `/api/admin/attendances`
- **Permission**: `attendances.view`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `per_page` *(int, default: 15)*
  - `event_id` *(uuid, optional)*
  - `campaign_id` *(uuid, optional)*
  - `status` *(string, options: `all`, `attended`, `not_attended`)*
  - `search` *(string, optional)*

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Attendances retrieved successfully",
  "data": {
    "summary": {
      "total_attendances": 320,
      "attended_count": 280,
      "not_attended_count": 40
    },
    "attendances": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de999999",
        "event_id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "name": "Tunde Bakare",
        "email": "tunde.bakare@example.com",
        "phone": "+2348022110099",
        "status": "attended",
        "status_label": "Attended",
        "method": "manual",
        "checked_in_at": "2026-10-07T11:30:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 320
  },
  "errors": null
}
```

---

### 7.2 Record Attendee (Manual Entry)
- **Method**: `POST`
- **Endpoint**: `/api/admin/attendances`
- **Permission**: `attendances.create`

#### Request Body
```json
{
  "event_id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "name": "Kelechi Iheanacho",
  "email": "kelechi.i@example.com",
  "phone": "+2348088776655",
  "status": "attended"
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Attendance recorded successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deaaaaaa",
    "name": "Kelechi Iheanacho",
    "email": "kelechi.i@example.com",
    "status": "attended"
  },
  "errors": null
}
```

---

### 7.3 Batch Mark Attendance
Batch updates attendance statuses (e.g. marking pre-registered attendees as `attended`).
- **Method**: `POST`
- **Endpoint**: `/api/admin/attendances/mark-attendance`
- **Permission**: `attendances.mark`

#### Request Body
```json
{
  "attendance_ids": [
    "9d8e5730-80ea-43f1-b9ea-c0b8deaaaaaa",
    "9d8e5730-80ea-43f1-b9ea-c0b8debbbbbb"
  ],
  "status": "attended"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Attendance marked successfully",
  "data": {
    "updated_count": 2,
    "status": "attended"
  },
  "errors": null
}
```

---

### 7.4 Show Attendance Details
- **Method**: `GET`
- **Endpoint**: `/api/admin/attendances/{attendance}`
- **Permission**: `attendances.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Attendance details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deaaaaaa",
    "name": "Kelechi Iheanacho",
    "email": "kelechi.i@example.com",
    "event": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
      "name": "Campus Ambassador Tour UNILAG"
    },
    "status": "attended",
    "method": "manual"
  },
  "errors": null
}
```

---

### 7.5 Batch Import Attendances (`CSV / XLS / XLSX`)
- **Method**: `POST`
- **Endpoint**: `/api/admin/attendances/import-csv`
- **Permission**: `attendances.create`
- **Content-Type**: `multipart/form-data`
- **Payload**: `file` (binary), `event_id` (optional), `campaign_id` (optional).

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Attendance import processed successfully",
  "data": {
    "total_rows": 180,
    "imported_count": 178,
    "skipped_duplicates": 2
  },
  "errors": null
}
```

---

### 7.6 Export Attendances
- **Method**: `GET`
- **Endpoint**: `/api/admin/attendances/export`
- **Permission**: `attendances.export`
- **Query Parameters**: `format` (`xlsx` / `csv`), `event_id`, `campaign_id`, `status`.
- **Response**: Binary file download.

---

## 8. Events Management & QR Codes

### 8.1 List Events
- **Method**: `GET`
- **Endpoint**: `/api/admin/events`
- **Permission**: `events.view`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `per_page` *(int, default: 15)*
  - `campaign_id` *(uuid, optional)*
  - `status` *(string, options: `all`, `pending`, `running`, `completed`, `cancelled`)*
  - `search` *(string, optional)*

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Events retrieved successfully",
  "data": {
    "summary": {
      "total_events": 14,
      "pending_count": 6,
      "running_count": 4,
      "upcoming_count": 6,
      "active_count": 4,
      "completed_count": 3,
      "cancelled_count": 1
    },
    "events": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "name": "Campus Ambassador Tour UNILAG",
        "slug": "campus-ambassador-tour-unilag-x7k2q9",
        "venue": "Main Auditorium, University of Lagos, Akoka",
        "event_date": "2026-10-15T10:00:00.000000Z",
        "status": "running",
        "status_label": "Running",
        "target": 500,
        "banner_url": "https://assets.vent.africa/banners/unilag.png",
        "auto_check_in_on_scan": true,
        "registration_url": "https://dashboard.vent.africa/events/campus-ambassador-tour-unilag-x7k2q9",
        "metrics": {
          "target": 500,
          "total_attendees": 480,
          "attended_count": 425,
          "not_attended_count": 55
        },
        "created_at": "2026-10-01T10:00:00.000000Z",
        "updated_at": "2026-10-07T12:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 14
  },
  "errors": null
}
```

---

### 8.2 Create Event
- **Method**: `POST`
- **Endpoint**: `/api/admin/events`
- **Permission**: `events.create`

#### Request Body
```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "name": "Tech Expo Covenant University",
  "venue": "University Chapel Grounds, Ota, Ogun State",
  "event_date": "2026-11-05 10:00:00",
  "description": "Student developer outreach and trading workshop.",
  "status": "pending",
  "target": 350,
  "banner_url": "https://assets.vent.africa/banners/cu-expo.png",
  "auto_check_in_on_scan": true
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Event created successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc",
    "name": "Tech Expo Covenant University",
    "slug": "tech-expo-covenant-university-m3p9l1",
    "status": "pending",
    "target": 350,
    "registration_url": "https://dashboard.vent.africa/events/tech-expo-covenant-university-m3p9l1"
  },
  "errors": null
}
```

---

### 8.3 Show Event Details (With QR Code Payload)
- **Method**: `GET`
- **Endpoint**: `/api/admin/events/{event}`
- **Permission**: `events.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Event details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc",
    "name": "Tech Expo Covenant University",
    "slug": "tech-expo-covenant-university-m3p9l1",
    "target": 350,
    "qr_code": {
      "registration_url": "https://dashboard.vent.africa/events/tech-expo-covenant-university-m3p9l1",
      "qr_code_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...></svg>"
    },
    "metrics": {
      "target": 350,
      "total_attendees": 0,
      "attended_count": 0,
      "not_attended_count": 0
    }
  },
  "errors": null
}
```

---

### 8.4 Update Event
- **Method**: `PUT`
- **Endpoint**: `/api/admin/events/{event}`
- **Permission**: `events.update`

#### Request Body
```json
{
  "status": "running",
  "target": 400
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Event updated successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc",
    "status": "running",
    "target": 400
  },
  "errors": null
}
```

---

### 8.5 Delete Event
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/events/{event}`
- **Permission**: `events.delete`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Event deleted successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc"
  },
  "errors": null
}
```

---

### 8.6 Generate / Fetch Standalone Event QR Code
- **Method**: `GET`
- **Endpoint**: `/api/admin/events/{event}/qr-code`
- **Permission**: `events.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Event QR code generated successfully",
  "data": {
    "event_id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc",
    "name": "Tech Expo Covenant University",
    "slug": "tech-expo-covenant-university-m3p9l1",
    "registration_url": "https://dashboard.vent.africa/events/tech-expo-covenant-university-m3p9l1",
    "qr_code_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...></svg>"
  },
  "errors": null
}
```

---

### 8.7 List Attendees of a Specific Event
- **Method**: `GET`
- **Endpoint**: `/api/admin/events/{event}/attendees`
- **Permission**: `events.view`
- **Query Parameters**: `page`, `per_page`, `status`, `search`.

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Event attendees retrieved successfully",
  "data": {
    "summary": {
      "total_attendees": 150,
      "attended_count": 140,
      "not_attended_count": 10
    },
    "attendees": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8deaaaaaa",
        "name": "Kelechi Iheanacho",
        "email": "kelechi.i@example.com",
        "status": "attended"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 150
  },
  "errors": null
}
```

---

### 8.8 Export Event Attendees
- **Method**: `GET`
- **Endpoint**: `/api/admin/events/{event}/export`
- **Permission**: `events.export`
- **Query Parameters**: `format` (`xlsx` / `csv`), `search`, `status`.
- **Response**: Binary spreadsheet download.

---

## 9. Deep Links Engine

### 9.1 List Deep Links
- **Method**: `GET`
- **Endpoint**: `/api/admin/deep-links`
- **Permission**: `deep_links.view`
- **Query Parameters**: `page`, `per_page`, `status` (`active`, `inactive`).

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Deep links retrieved successfully",
  "data": [
    {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8dedddddd",
      "slug": "campus-tour-lagos",
      "destination_url": "https://dashboard.vent.africa/register?campaign=lagos",
      "status": "active",
      "clicks_count": 1845,
      "created_at": "2026-09-10T14:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 1
  },
  "errors": null
}
```

---

### 9.2 Create Deep Link
- **Method**: `POST`
- **Endpoint**: `/api/admin/deep-links`
- **Permission**: `deep_links.create`

#### Request Body
```json
{
  "slug": "unilag-onboarding",
  "destination_url": "https://dashboard.vent.africa/auth/sign-up?ref=UNILAG",
  "status": "active"
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Deep link created successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deeeeeee",
    "slug": "unilag-onboarding",
    "destination_url": "https://dashboard.vent.africa/auth/sign-up?ref=UNILAG",
    "status": "active"
  },
  "errors": null
}
```

---

### 9.3 Show Deep Link Details
- **Method**: `GET`
- **Endpoint**: `/api/admin/deep-links/{deepLink}`
- **Permission**: `deep_links.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Deep link details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deeeeeee",
    "slug": "unilag-onboarding",
    "destination_url": "https://dashboard.vent.africa/auth/sign-up?ref=UNILAG",
    "status": "active",
    "clicks_count": 42
  },
  "errors": null
}
```

---

### 9.4 Update Deep Link
- **Method**: `PUT`
- **Endpoint**: `/api/admin/deep-links/{deepLink}`
- **Permission**: `deep_links.update`

#### Request Body
```json
{
  "destination_url": "https://dashboard.vent.africa/auth/sign-up?ref=UNILAG_V2"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Deep link updated successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deeeeeee",
    "destination_url": "https://dashboard.vent.africa/auth/sign-up?ref=UNILAG_V2"
  },
  "errors": null
}
```

---

### 9.5 Toggle Deep Link Status
- **Method**: `PATCH`
- **Endpoint**: `/api/admin/deep-links/{deepLink}/toggle-status`
- **Permission**: `deep_links.update`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Deep link status toggled successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deeeeeee",
    "status": "inactive"
  },
  "errors": null
}
```

---

### 9.6 Delete Deep Link
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/deep-links/{deepLink}`
- **Permission**: `deep_links.delete`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Deep link deleted successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8deeeeeee"
  },
  "errors": null
}
```

---

## 10. Dashboard Analytics & Digest

### 10.1 Real-Time System Overview
- **Method**: `GET`
- **Endpoint**: `/api/admin/dashboard/overview`
- **Permission**: `dashboard.view.basic`
- **Query Parameters**:
  - `timeframe` *(string, options: `today`, `this_week`, `this_month`, `this_year`, `all_time`, `custom`)*
  - `start_date` *(date, optional when timeframe=custom)*
  - `end_date` *(date, optional when timeframe=custom)*

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "timeframe": "all_time",
    "campaigns": {
      "total": 24,
      "running": 8,
      "pending": 12,
      "closed": 4
    },
    "promoters": {
      "total": 45
    },
    "audiences": {
      "total": 2450,
      "verified": 1820,
      "transacted": 890,
      "unverified": 630
    },
    "attendances": {
      "total": 620,
      "attended": 580,
      "not_attended": 40
    },
    "events": {
      "total": 14,
      "running": 4,
      "pending": 6,
      "completed": 3,
      "cancelled": 1
    },
    "deep_links": {
      "total": 18,
      "active": 15,
      "total_clicks": 14200
    }
  },
  "errors": null
}
```

---

### 10.2 Conversion Funnel Analytics
- **Method**: `GET`
- **Endpoint**: `/api/admin/dashboard/conversion-funnel`
- **Permission**: `dashboard.view.advanced`
- **Query Parameters**: `timeframe`, `start_date`, `end_date`, `campaign_id`.

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Conversion funnel retrieved successfully",
  "data": {
    "stages": [
      {
        "stage": "Registered Audience",
        "count": 2450,
        "percentage": 100.0
      },
      {
        "stage": "Verified KYC Users",
        "count": 1820,
        "percentage": 74.29
      },
      {
        "stage": "First Crypto Trade Completed",
        "count": 890,
        "percentage": 36.33
      }
    ],
    "verification_rate": 74.29,
    "trade_conversion_rate": 36.33
  },
  "errors": null
}
```

---

### 10.3 Campaign Performance Breakdown
- **Method**: `GET`
- **Endpoint**: `/api/admin/dashboard/campaign-performance`
- **Permission**: `dashboard.view.advanced`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Campaign performance retrieved successfully",
  "data": [
    {
      "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
      "campaign_name": "Q4 Campus Tour 2026",
      "target": 5000,
      "audiences_count": 1420,
      "completion_percentage": 28.4,
      "verified_count": 980,
      "transacted_count": 450
    }
  ],
  "errors": null
}
```

---

### 10.4 Promoter Leaderboard
- **Method**: `GET`
- **Endpoint**: `/api/admin/dashboard/promoter-leaderboard`
- **Permission**: `dashboard.view.advanced`
- **Query Parameters**: `limit` *(int, default: 10)*, `campaign_id` *(uuid, optional)*.

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Promoter leaderboard retrieved successfully",
  "data": [
    {
      "rank": 1,
      "promoter_id": "9d8e5730-80ea-43f1-b9ea-c0b8de555555",
      "name": "Jane Doe",
      "referral_code": "JANE01",
      "total_referrals": 340,
      "verified_referrals": 280,
      "transacted_referrals": 190,
      "conversion_rate": 55.88
    }
  ],
  "errors": null
}
```

---

### 10.5 Trigger Weekly Performance Email Digest
Manually queues and dispatches the weekly analytics email digest to configured stakeholders.
- **Method**: `POST`
- **Endpoint**: `/api/admin/dashboard/send-digest`
- **Permission**: `dashboard.view.advanced`
- **Rate Limit**: `10 requests / minute`

#### Request Body
```json
{
  "recipients": [
    "stakeholders@vent.africa"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Weekly performance digest queued for delivery",
  "data": {
    "recipients": ["stakeholders@vent.africa"],
    "queued_at": "2026-10-07T14:00:00.000000Z"
  },
  "errors": null
}
```

---

## 11. RBAC: Roles, Permissions & User Delegation

### 11.1 Role-Permission Matrix
Lists all system roles mapped against their granted permissions.
- **Method**: `GET`
- **Endpoint**: `/api/admin/roles/matrix`
- **Permission**: `roles.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Role permission matrix retrieved successfully",
  "data": {
    "roles": ["Super Admin", "Campaign Manager", "Events Lead", "Auditor"],
    "matrix": {
      "Super Admin": ["*"],
      "Campaign Manager": ["campaigns.view", "campaigns.create", "campaigns.update", "promoters.view"],
      "Events Lead": ["events.view", "events.create", "attendances.view", "attendances.mark"]
    }
  },
  "errors": null
}
```

---

### 11.2 List Roles
- **Method**: `GET`
- **Endpoint**: `/api/admin/roles`
- **Permission**: `roles.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Roles retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Campaign Manager",
      "guard_name": "web",
      "permissions_count": 12,
      "users_count": 4
    }
  ],
  "errors": null
}
```

---

### 11.3 Create Custom Role
- **Method**: `POST`
- **Endpoint**: `/api/admin/roles`
- **Permission**: `roles.modify`

#### Request Body
```json
{
  "name": "Field Promoter Manager",
  "permissions": [
    "promoters.view",
    "promoters.create",
    "promoters.update",
    "audiences.view"
  ]
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Role created successfully",
  "data": {
    "id": 5,
    "name": "Field Promoter Manager",
    "permissions": ["promoters.view", "promoters.create", "promoters.update", "audiences.view"]
  },
  "errors": null
}
```

---

### 11.4 Show Role Details
- **Method**: `GET`
- **Endpoint**: `/api/admin/roles/{role}`
- **Permission**: `roles.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Role details retrieved successfully",
  "data": {
    "id": 5,
    "name": "Field Promoter Manager",
    "permissions": ["promoters.view", "promoters.create", "promoters.update", "audiences.view"]
  },
  "errors": null
}
```

---

### 11.5 Update Role
- **Method**: `PUT`
- **Endpoint**: `/api/admin/roles/{role}`
- **Permission**: `roles.modify`

#### Request Body
```json
{
  "name": "Field Operations Lead",
  "permissions": [
    "promoters.view",
    "promoters.create",
    "promoters.update",
    "audiences.view",
    "audiences.create"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Role updated successfully",
  "data": {
    "id": 5,
    "name": "Field Operations Lead"
  },
  "errors": null
}
```

---

### 11.6 Delete Role
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/roles/{role}`
- **Permission**: `roles.modify`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Role deleted successfully",
  "data": {
    "id": 5
  },
  "errors": null
}
```

---

### 11.7 List All System Permissions
- **Method**: `GET`
- **Endpoint**: `/api/admin/permissions`
- **Permission**: `permissions.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Permissions retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "campaigns.view",
      "module": "campaigns"
    },
    {
      "id": 2,
      "name": "campaigns.create",
      "module": "campaigns"
    },
    {
      "id": 3,
      "name": "events.view",
      "module": "events"
    }
  ],
  "errors": null
}
```

---

### 11.8 Get User Individual Permissions
- **Method**: `GET`
- **Endpoint**: `/api/admin/users/{user}/permissions`
- **Permission**: `permissions.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "User permissions retrieved successfully",
  "data": {
    "user_id": "9d8e5730-80ea-43f1-b9ea-c0b8de912345",
    "direct_permissions": ["reports.view"],
    "role_permissions": ["campaigns.view", "campaigns.create"]
  },
  "errors": null
}
```

---

### 11.9 Assign Direct Permissions to User
- **Method**: `POST`
- **Endpoint**: `/api/admin/users/{user}/permissions/assign`
- **Permission**: `permissions.assign`

#### Request Body
```json
{
  "permissions": [
    "reports.download",
    "system.diagnostics.view"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Permissions assigned to user successfully",
  "data": {
    "user_id": "9d8e5730-80ea-43f1-b9ea-c0b8de912345",
    "assigned_permissions": ["reports.download", "system.diagnostics.view"]
  },
  "errors": null
}
```

---

### 11.10 Revoke Permissions from User
- **Method**: `POST`
- **Endpoint**: `/api/admin/users/{user}/permissions/revoke`
- **Permission**: `permissions.revoke`

#### Request Body
```json
{
  "permissions": [
    "system.diagnostics.view"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Permissions revoked successfully",
  "data": {
    "revoked_permissions": ["system.diagnostics.view"]
  },
  "errors": null
}
```

---

### 11.11 Sync Direct Permissions on User
- **Method**: `PUT`
- **Endpoint**: `/api/admin/users/{user}/permissions/sync`
- **Permission**: `permissions.assign`

#### Request Body
```json
{
  "permissions": [
    "reports.view",
    "reports.download"
  ]
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "User permissions synced successfully",
  "data": {
    "direct_permissions": ["reports.view", "reports.download"]
  },
  "errors": null
}
```

---

### 11.12 Assign Primary Role to User
- **Method**: `POST`
- **Endpoint**: `/api/admin/users/{user}/role`
- **Permission**: `admins.role.assign`

#### Request Body
```json
{
  "role": "Campaign Manager"
}
```

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Role assigned to user successfully",
  "data": {
    "user_id": "9d8e5730-80ea-43f1-b9ea-c0b8de912345",
    "roles": ["Campaign Manager"]
  },
  "errors": null
}
```

---

## 12. User Invitations

### 12.1 List Team Invitations
- **Method**: `GET`
- **Endpoint**: `/api/admin/invitations`
- **Permission**: `users.create`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Invitations retrieved successfully",
  "data": [
    {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8deffffff",
      "email": "invitee@vent.africa",
      "role": "Campaign Manager",
      "status": "pending",
      "expires_at": "2026-10-14T10:00:00.000000Z",
      "created_at": "2026-10-07T10:00:00.000000Z"
    }
  ],
  "errors": null
}
```

---

### 12.2 Send Team Invitation
- **Method**: `POST`
- **Endpoint**: `/api/admin/invitations`
- **Permission**: `users.create`

#### Request Body
```json
{
  "email": "operations@vent.africa",
  "role": "Events Lead"
}
```

#### Response (`201 Created`)
```json
{
  "status": true,
  "message": "Invitation sent successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de121212",
    "email": "operations@vent.africa",
    "role": "Events Lead",
    "expires_at": "2026-10-14T10:00:00.000000Z"
  },
  "errors": null
}
```

---

### 12.3 Resend Invitation Email
- **Method**: `POST`
- **Endpoint**: `/api/admin/invitations/{invitation}/resend`
- **Permission**: `users.create`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Invitation resent successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de121212",
    "expires_at": "2026-10-14T14:30:00.000000Z"
  },
  "errors": null
}
```

---

### 12.4 Revoke / Cancel Invitation
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/invitations/{invitation}`
- **Permission**: `users.create`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Invitation cancelled successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de121212"
  },
  "errors": null
}
```

---

## 13. Forensic Activity Logs

### 13.1 Query Activity Logs
- **Method**: `GET`
- **Endpoint**: `/api/admin/activity-logs`
- **Permission**: `reports.view`
- **Query Parameters**:
  - `page` *(int, default: 1)*
  - `per_page` *(int, default: 15)*
  - `log_name` *(string, optional, e.g. `events`, `campaigns`, `promoters`)*
  - `causer_id` *(uuid, optional)*: Filter by user ID.
  - `date_from` *(date, optional)*
  - `date_to` *(date, optional)*

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Activity logs retrieved successfully",
  "data": [
    {
      "id": 182,
      "log_name": "events",
      "description": "Created event Tech Expo Covenant University (Slug: tech-expo-covenant-university-m3p9l1)",
      "subject_type": "App\\Models\\Event",
      "subject_id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc",
      "causer": {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de912345",
        "name": "Super Admin",
        "email": "admin@vent.africa"
      },
      "properties": {
        "target": 350,
        "status": "pending",
        "ip": "127.0.0.1",
        "user_agent": "PostmanRuntime/7.42.0"
      },
      "created_at": "2026-10-07T13:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 182
  },
  "errors": null
}
```

---

### 13.2 Export Activity Logs
- **Method**: `GET`
- **Endpoint**: `/api/admin/activity-logs/export`
- **Permission**: `reports.download`
- **Query Parameters**: `format` (`xlsx` / `csv`), `log_name`, `date_from`, `date_to`.
- **Response**: Binary file download.

---

## 14. System Health, Diagnostics & Inbound Webhooks

### 14.1 Liveness & Readiness Probe
Lightweight endpoint for load balancers and container orchestrators.
- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Access**: Public

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "System is healthy",
  "data": {
    "environment": "production",
    "timestamp": "2026-10-07T14:35:00.000000Z",
    "services": {
      "database": "connected",
      "redis_cache": "connected"
    }
  },
  "errors": null
}
```

---

### 14.2 Deep Diagnostics & Health Telemetry
Deep infrastructure analysis probing database latency, Redis memory, disk utilization, and queued jobs.
- **Method**: `GET`
- **Endpoint**: `/api/admin/diagnostics/system-health`
- **Permission**: `system.diagnostics.view`

#### Response (`200 OK`)
```json
{
  "status": true,
  "message": "Diagnostics collected successfully",
  "data": {
    "app": {
      "version": "2.0.0",
      "php_version": "8.4.1",
      "laravel_version": "12.x",
      "debug_mode": false
    },
    "database": {
      "driver": "pgsql",
      "ping_ms": 1.45,
      "status": "healthy"
    },
    "cache_and_redis": {
      "driver": "redis",
      "latency_ms": 0.82,
      "status": "healthy"
    },
    "disk": {
      "free_gb": 42.8,
      "total_gb": 100.0,
      "usage_percentage": 57.2
    },
    "horizon_queue": {
      "status": "running",
      "failed_jobs_last_24h": 0,
      "pending_jobs": 0
    }
  },
  "errors": null
}
```

---

### 14.3 Inbound Webhooks from VentV2 Core
Secure webhook ingestion receiver managed by Spatie Webhook Client for processing transactional updates and KYC user verifications.
- **Method**: `POST`
- **Endpoint**: `/api/webhooks/ventv2`
- **Access**: Public (Verified via HMAC signature header)
- **Header**: `Vent-Signature: <hmac_sha256_signature>`

#### Request Body (User KYC Verification Event)
```json
{
  "event": "user.kyc_verified",
  "timestamp": 1791370000,
  "data": {
    "user_id": "usr_9988776655",
    "email": "chinedu.eze@gmail.com",
    "referral_code": "JANE01",
    "verified_at": "2026-10-07T14:10:00Z"
  }
}
```

#### Request Body (First Crypto Trade Event)
```json
{
  "event": "user.first_trade_completed",
  "timestamp": 1791370500,
  "data": {
    "user_id": "usr_9988776655",
    "email": "chinedu.eze@gmail.com",
    "referral_code": "JANE01",
    "trade_volume_usd": 150.00,
    "completed_at": "2026-10-07T14:18:00Z"
  }
}
```

#### Response (`200 OK`)
```json
{
  "message": "Webhook processed successfully"
}
```
*(On invalid signature: HTTP `400 Bad Request` or `Invalid signature`)*

---

## 15. Postman Collection Integration

A ready-to-run Postman collection containing all the routes, variables, authentication headers, and request bodies is pre-configured and maintained in the repository:

- 📄 **File Path**: [`postman/CTServiceBackendV2.postman_collection.json`](file:///Users/donald/Desktop/projects/vent-africa/CTServiceBackendV2/postman/CTServiceBackendV2.postman_collection.json)
- **Import Instructions**:
  1. Open Postman.
  2. Click **Import** -> Select `postman/CTServiceBackendV2.postman_collection.json`.
  3. Configure your Environment variables:
     - `base_url`: `http://localhost:8000/api` (or your staging/production URL)
     - `token`: (Obtained after running the `Admin - Login` request)
     - `campaign_id`: A valid campaign UUID
     - `event_id`: A valid event UUID
     - `promoter_id`: A valid promoter UUID
