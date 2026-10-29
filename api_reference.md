# Vent Africa CT Service V2 — REST API Reference

Canonical, verified API reference for the **Vent Africa Campus Tour & Campaign Tracking Service** (`CTServiceBackendV2`). Every request payload is derived from the actual `FormRequest` rules and every response shape from the actual `ApiResource` / controller output. Intended for frontend engineers building the admin dashboard and the public QR registration flow.

| Item                     | Value                                                                    |
| :----------------------- | :----------------------------------------------------------------------- |
| API Version              | `v2.0`                                                                   |
| Auth                     | Laravel Sanctum bearer tokens (`Authorization: Bearer <token>`)          |
| Base URL (Local)         | `http://localhost:8000/api` or `https://ctservicebackendv2.test/api`     |
| Base URL (Staging)       | `https://staging-ctbackend.vent.africa/api`                              |
| Base URL (Production)    | `https://ctbackend.vent.africa/api`                                      |
| Machine-readable OpenAPI | `GET /docs/api.json` (Scramble) · UI at `GET /docs/api`                  |
| IDs                      | All resource identifiers are **UUID v4 strings** unless stated otherwise |
| Timestamps               | ISO-8601 UTC (e.g. `2026-10-15T10:00:00.000000Z`)                        |

---

## Table of Contents

1. [Conventions, Envelopes, Auth & Errors](#1-conventions-envelopes-auth--errors)
2. [Authentication & Account Recovery](#2-authentication--account-recovery)
3. [Public Event QR Self-Registration](#3-public-event-qr-self-registration)
4. [Health, Webhooks & Platform Utilities](#4-health-webhooks--platform-utilities)
5. [Campaigns](#5-campaigns)
6. [Promoters](#6-promoters)
7. [Audiences](#7-audiences)
8. [Attendances](#8-attendances)
9. [Events](#9-events)
10. [Deep Links](#10-deep-links)
11. [Dashboard Analytics & Digest](#11-dashboard-analytics--digest)
12. [RBAC: Roles, Permissions & User Delegation](#12-rbac-roles-permissions--user-delegation)
13. [User Invitations](#13-user-invitations)
14. [Forensic Activity Logs](#14-forensic-activity-logs)
15. [System Diagnostics & Health Telemetry](#15-system-diagnostics--health-telemetry)
16. [Appendix: Enums, Permissions & Error Map](#16-appendix-enums-permissions--error-map)

---

## 1. Conventions, Envelopes, Auth & Errors

### 1.1 Required headers

All JSON endpoints expect:

```http
Accept: application/json
Content-Type: application/json
```

Authenticated endpoints additionally require a Sanctum bearer token:

```http
Authorization: Bearer <plainTextToken>
```

> Every response also carries security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

### 1.2 Success envelope

All controller-produced JSON (except framework-level `401`/`404`/`422`/`429`, see §1.4) uses this envelope. Note `errors` is an **empty array** `[]`, not `null`.

```json
{
  "status": true,
  "message": "Campaigns retrieved successfully",
  "data": {},
  "errors": []
}
```

- `data` is an object, array, scalar, or `null` depending on the endpoint.
- `message` is a human-readable, display-safe string (safe to toast directly).

### 1.3 Pagination

List endpoints add **top-level `meta` and `links`** (siblings of `data`, **not** nested inside it):

```json
{
  "status": true,
  "message": "Audiences retrieved successfully",
  "data": { "summary": {}, "audiences": [] },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "path": "https://ctbackend.vent.africa/api/admin/audiences",
    "per_page": 15,
    "to": 15,
    "total": 42
  },
  "links": {
    "first": "https://ctbackend.vent.africa/api/admin/audiences?page=1",
    "last": "https://ctbackend.vent.africa/api/admin/audiences?page=3",
    "prev": null,
    "next": "https://ctbackend.vent.africa/api/admin/audiences?page=2"
  },
  "errors": []
}
```

Pagination query parameters accepted by every list endpoint:

| Param      | Type | Default | Notes                                               |
| :--------- | :--- | :------ | :-------------------------------------------------- |
| `per_page` | int  | `15`    | Clamped to `1..100`. Alias `perPage` also accepted. |
| `page`     | int  | `1`     | Standard page cursor.                               |

### 1.4 Error envelopes (IMPORTANT — not uniform)

The API mixes the custom envelope with Laravel's framework defaults. Frontend error handling must branch on the **HTTP status**, not solely on the presence of `status: false`.

**403 Forbidden** (Spatie permission denial) — custom envelope:

```json
{
  "status": false,
  "message": "User does not have the right permissions.",
  "data": [],
  "errors": []
}
```

**Business error** (e.g. duplicate registration, immutable-role) — custom envelope:

```json
{
  "status": false,
  "message": "You're already registered. Your details are already captured for this event.",
  "data": { "email": "a@vent.africa", "event_name": "Tech Expo" },
  "errors": { "email": ["Your details are already captured for this event."] }
}
```

**401 Unauthenticated** — framework default:

```json
{ "message": "Unauthenticated." }
```

**404 Not Found** (route-model binding `firstOrFail()`) — framework default:

```json
{
  "message": "No query results for model [App\\Models\\Campaign] 9d8e5730-80ea-43f1-b9ea-c0b8de333333"
}
```

**422 Validation error** — framework default (this is the shape for _all_ `FormRequest` failures):

```json
{
  "message": "The email field is required. (and 1 more error)",
  "errors": {
    "email": [
      "The email field is required.",
      "The email has already been taken."
    ]
  }
}
```

**429 Too Many Attempts** — framework default:

```json
{ "message": "Too Many Attempts." }
```

with headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

> Frontend rule of thumb: `status === true` → success; `status === false` → app error (read `message`/`errors`); no `status` key → framework error, read `message` and, for 422, `errors`.

### 1.5 Standard status codes

| Code  | Meaning             | Typical cause                                    |
| :---- | :------------------ | :----------------------------------------------- |
| `200` | OK                  | Read / update / delete succeeded.                |
| `201` | Created             | Resource created (or invitation accepted).       |
| `202` | Accepted            | Async job queued (CSV imports).                  |
| `401` | Unauthorized        | Missing/expired token.                           |
| `403` | Forbidden           | Authenticated but lacks the required permission. |
| `404` | Not Found           | Unknown route or resource id.                    |
| `409` | Conflict            | Duplicate registration for event/campaign.       |
| `422` | Unprocessable       | Validation failed, or business-rule rejection.   |
| `429` | Too Many Requests   | Throttle limit hit.                              |
| `503` | Service Unavailable | Health probe reports degraded.                   |

### 1.6 Idempotency

Global `IdempotentRequestMiddleware` fingerprints mutating requests (`POST`/`PUT`/`PATCH`/`DELETE`) by actor token + method + path + body + file hashes. A successful (`2xx`) response is cached for **30 seconds**; an identical repeat within that window is replayed and tagged:

```http
X-Idempotent-Replay: true
```

Exempt endpoints (dedicated lifecycle validators): `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/invitations/{token}/accept`, `POST /api/auth/forgot-password*`, `POST /api/public/events/{slug}/register`. None of these ever return `X-Idempotent-Replay`.

### 1.7 Rate limits (throttle)

Named limiters (per email + IP where noted):

| Limiter           | Applied to                                   | Limit                                     |
| :---------------- | :------------------------------------------- | :---------------------------------------- |
| `login`           | `POST /api/auth/login`                       | **5/min** per email+IP, **20/min** per IP |
| `forgot-password` | `POST /api/auth/forgot-password`             | 5/min email+IP, 15/min IP                 |
| `verify-otp`      | `POST /api/auth/forgot-password/verify-code` | 5/min email+IP, 20/min IP                 |
| `resend-otp`      | `POST /api/auth/forgot-password/resend`      | 3/min email+IP, 10/min IP (25s cooldown)  |
| `reset-password`  | `POST /api/auth/forgot-password/reset`       | 5/min email+IP, 15/min IP                 |

All `/api/admin/*` endpoints sit behind `auth:sanctum` + `throttle:60,1`. Per-route overrides: mutations use `throttle:30,1` (or `15,1` for bulk/sensitive ops); reads inherit `60,1`.

---

## 2. Authentication & Account Recovery

### 2.1 Admin Login

- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Auth**: none · **Throttle**: `login`
- **UI**: Login screen.

#### Request body

| field      | type   | required | rules                                         |
| :--------- | :----- | :------- | :-------------------------------------------- |
| `email`    | string | yes      | `email:rfc,dns`, must end with `@vent.africa` |
| `password` | string | yes      | min 8 chars                                   |

```json
{
  "email": "admin@vent.africa",
  "password": "SecurePass123"
}
```

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Login successful.",
  "data": {
    "token": "12|Xy7Zk9Pq...plainTextSanctumToken",
    "user": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de000001",
      "name": "Ada Admin",
      "email": "admin@vent.africa",
      "roles": ["admin"],
      "permissions": [
        "campaigns.view",
        "campaigns.create",
        "dashboard.basic.view"
      ],
      "created_at": "2026-09-01T10:00:00.000000Z",
      "updated_at": "2026-10-07T12:00:00.000000Z"
    }
  },
  "errors": []
}
```

#### Errors

| Status | Message                                                                           | Notes                                                 |
| :----- | :-------------------------------------------------------------------------------- | :---------------------------------------------------- |
| `401`  | `Invalid credentials.`                                                            | Wrong password, unknown email, or non-`@vent.africa`. |
| `422`  | `email.ends_with` → `Only @vent.africa email addresses are authorized to log in.` | Or default validation messages.                       |
| `429`  | `Too Many Attempts.`                                                              | See `Retry-After`.                                    |

> **Frontend**: store the token securely; send it on every admin request. `data.user.permissions` can drive client-side menu visibility (server still enforces).

---

### 2.2 Get Authenticated User

- **Method**: `GET`
- **Endpoint**: `/api/auth/user` (alias: `GET /api/user`)
- **Auth**: `auth:sanctum`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "User profile retrieved successfully.",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de000001",
    "name": "Ada Admin",
    "email": "admin@vent.africa",
    "roles": ["admin"],
    "permissions": ["campaigns.view", "dashboard.basic.view"],
    "created_at": "2026-09-01T10:00:00.000000Z",
    "updated_at": "2026-10-07T12:00:00.000000Z"
  },
  "errors": []
}
```

| Status | Body                                |
| :----- | :---------------------------------- |
| `401`  | `{ "message": "Unauthenticated." }` |

---

### 2.3 Logout

- **Method**: `POST`
- **Endpoint**: `/api/auth/logout`
- **Auth**: `auth:sanctum` · revokes only the **current** token.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Logged out successfully.",
  "data": null,
  "errors": []
}
```

---

### 2.4 Forgot Password — Request OTP

- **Method**: `POST` · **Endpoint**: `/api/auth/forgot-password` · **Throttle**: `forgot-password`
- **UI**: “Forgot password” screen — enter email.

OTP TTL is **300s**; 6-digit numeric code.

#### Request body

| field   | type   | required | rules            |
| :------ | :----- | :------- | :--------------- |
| `email` | string | yes      | `email`, max 255 |

```json
{ "email": "admin@vent.africa" }
```

#### Response (`200 OK`)

Always returns `200` even for unknown emails (anti-enumeration + timing defense).

```json
{
  "status": true,
  "message": "If the email is registered, a verification code has been sent.",
  "data": { "email": "admin@vent.africa" },
  "errors": []
}
```

---

### 2.5 Forgot Password — Verify OTP

- **Method**: `POST` · **Endpoint**: `/api/auth/forgot-password/verify-code` · **Throttle**: `verify-otp`
- **UI**: “Enter the 6-digit code” screen.

#### Request body

| field   | type   | required | rules                             |
| :------ | :----- | :------- | :-------------------------------- |
| `email` | string | yes      | `email`, max 255                  |
| `code`  | string | yes      | exactly 6 digits (`/^[0-9]{6}$/`) |

```json
{ "email": "admin@vent.africa", "code": "482913" }
```

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Code verified successfully.",
  "data": { "reset_token": "b3f1c2…64char…9a" },
  "errors": []
}
```

#### Errors

| Status | Message                                                                       |
| :----- | :---------------------------------------------------------------------------- |
| `422`  | `The verification code has expired or is invalid. Please request a new code.` |
| `422`  | `Too many incorrect attempts. Please request a new verification code.`        |
| `422`  | `Incorrect code. Please try again`                                            |
| `422`  | `The verification code must be a 6-digit number.` (`code.regex`)              |
| `429`  | `A verification request is already in progress. Please wait a moment.`        |

---

### 2.6 Forgot Password — Resend OTP

- **Method**: `POST` · **Endpoint**: `/api/auth/forgot-password/resend` · **Throttle**: `resend-otp`
- 25-second cooldown between sends.

#### Request body

```json
{ "email": "admin@vent.africa" }
```

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Verification code resent successfully.",
  "data": { "email": "admin@vent.africa" },
  "errors": []
}
```

#### Errors

| Status | Message                                                | Header            |
| :----- | :----------------------------------------------------- | :---------------- |
| `429`  | `Please wait 25 seconds before requesting a new code.` | `Retry-After: 25` |

---

### 2.7 Forgot Password — Reset

- **Method**: `POST` · **Endpoint**: `/api/auth/forgot-password/reset` · **Throttle**: `reset-password`
- Reset token TTL is **900s**. On success all existing tokens are revoked and a `PasswordChangedMail` is queued.

#### Request body

| field                   | type   | required | rules                                                                                         |
| :---------------------- | :----- | :------- | :-------------------------------------------------------------------------------------------- |
| `email`                 | string | yes      | `email`, max 255                                                                              |
| `reset_token`           | string | yes      | from §2.5                                                                                     |
| `password`              | string | yes      | `confirmed` + min 8, letters, mixed case, numbers (production additionally `uncompromised()`) |
| `password_confirmation` | string | yes      | must match `password`                                                                         |

```json
{
  "email": "admin@vent.africa",
  "reset_token": "b3f1c2…64char…9a",
  "password": "NewSecure123",
  "password_confirmation": "NewSecure123"
}
```

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Your password has been reset. You can now sign in with your new password",
  "data": { "email": "admin@vent.africa" },
  "errors": []
}
```

#### Errors

| Status | Message                                                                      |
| :----- | :--------------------------------------------------------------------------- |
| `422`  | `Invalid or expired password reset token. Please restart the reset process.` |
| `422`  | `Your new password cannot be the same as your current password.`             |
| `404`  | `User not found.`                                                            |
| `429`  | `A password reset request is already in progress. Please wait a moment.`     |

---

### 2.8 Inspect User Invitation Token

- **Method**: `GET` · **Endpoint**: `/api/auth/invitations/{token}` · **Throttle**: `30/min`
- Public (no auth). Used to render the “Accept invitation” screen. Token is looked up by SHA-256 hash.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Invitation is valid.",
  "data": {
    "email": "new.hire@vent.africa",
    "role": "admin",
    "expires_at": "2026-10-18T10:00:00.000000Z"
  },
  "errors": []
}
```

| Status | Message                                            |
| :----- | :------------------------------------------------- |
| `422`  | `This invitation token is invalid or has expired.` |

---

### 2.9 Accept User Invitation

- **Method**: `POST` · **Endpoint**: `/api/auth/invitations/{token}/accept` · **Throttle**: `15/min`
- Public. Creates the user, assigns role/permissions, returns a login token.

#### Request body

| field                   | type   | required | rules                                |
| :---------------------- | :----- | :------- | :----------------------------------- |
| `name`                  | string | yes      | max 255                              |
| `password`              | string | yes      | `confirmed` + `Password::defaults()` |
| `password_confirmation` | string | yes      | must match                           |

```json
{
  "name": "New Hire",
  "password": "NewSecure123",
  "password_confirmation": "NewSecure123"
}
```

#### Response (`201 Created`)

```json
{
  "status": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de000099",
      "name": "New Hire",
      "email": "new.hire@vent.africa",
      "roles": ["admin"],
      "permissions": ["campaigns.view"],
      "created_at": "2026-10-16T10:00:00.000000Z",
      "updated_at": "2026-10-16T10:00:00.000000Z"
    },
    "token": "34|Ab1Cd2Ef...plainTextSanctumToken"
  },
  "errors": []
}
```

#### Errors

| Status | Message                                                                          |
| :----- | :------------------------------------------------------------------------------- |
| `422`  | `This invitation token is invalid or has expired.`                               |
| `429`  | `An invitation acceptance request is already in progress. Please wait a moment.` |

---

## 3. Public Event QR Self-Registration

Unauthenticated endpoints powering the attendee-facing QR scan experience. Base: `/api/public/events`.

### 3.1 Public Event Details on QR Scan

- **Method**: `GET` · **Endpoint**: `/api/public/events/{slug}` · **Throttle**: `60/min`
- **UI**: Landing screen shown when an attendee scans the event QR — event name, venue, date, banner.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Event details retrieved successfully",
  "data": {
    "name": "Campus Ambassadors Program (CAP)",
    "slug": "campus-ambassadors-program-cap-x7k2q9",
    "venue": "Auditorium Hall, University of Lagos, Akoka, Yaba, Lagos",
    "event_date": "2026-10-15T10:00:00.000000Z",
    "description": "Student developer outreach and trading workshop.",
    "banner_url": "https://assets.vent.africa/banners/unilag.png"
  },
  "errors": []
}
```

| Status | Body                                                                      |
| :----- | :------------------------------------------------------------------------ |
| `404`  | `{ "message": "No query results for model [App\\Models\\Event] {slug}" }` |

---

### 3.2 Public Attendee Self-Registration & Check-In

- **Method**: `POST` · **Endpoint**: `/api/public/events/{slug}/register` · **Throttle**: `30/min`
- **UI**: Registration form → success modal (“You're all set, {first_name}!”).
- If the event has `auto_check_in_on_scan = true`, the attendee is immediately marked `attended` with method `qr_scan`.

#### Request body

| field   | type   | required | rules                    |
| :------ | :----- | :------- | :----------------------- |
| `name`  | string | yes      | min 2, max 255           |
| `email` | string | yes      | `email:rfc,dns`, max 255 |
| `phone` | string | no       | max 30                   |

Custom messages: `name.required` → `Please enter your full name.`, `email.required` → `Please enter your email address.`, `email.email` → `Enter a valid email address`.

```json
{
  "name": "Clement Bassey",
  "email": "clement.bassey@gmail.com",
  "phone": "+2348011223344"
}
```

#### Response (`201 Created`)

```json
{
  "status": true,
  "message": "You're all set, Clement! Your registration was successful.",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de000055",
    "name": "Clement Bassey",
    "first_name": "Clement",
    "email": "clement.bassey@gmail.com",
    "phone": "+2348011223344",
    "status": "attended",
    "method": "qr_scan",
    "event": {
      "name": "Campus Ambassadors Program (CAP)",
      "venue": "Auditorium Hall, University of Lagos, Akoka, Yaba, Lagos",
      "event_date": "2026-10-15T10:00:00.000000Z"
    },
    "download_url": "https://vent.africa/download"
  },
  "errors": []
}
```

- `status` is `attended` when `auto_check_in_on_scan` is enabled, otherwise `not_attended`.
- `download_url` comes from `services.vent_africa.app_download_url` (default `https://vent.africa/download`) — use it for the “Download the app” CTA.

#### Errors

**Duplicate registration (`409 Conflict`)**:

```json
{
  "status": false,
  "message": "You're already registered. Your details are already captured for this event.",
  "data": {
    "email": "clement.bassey@gmail.com",
    "event_name": "Campus Ambassadors Program (CAP)"
  },
  "errors": { "email": ["Your details are already captured for this event."] }
}
```

If the attendee is already registered under the parent campaign:

```json
{
  "status": false,
  "message": "You're already registered. Your details are already captured for this campaign.",
  "data": {
    "email": "clement.bassey@gmail.com",
    "event_name": "Campus Ambassadors Program (CAP)"
  },
  "errors": {
    "email": ["Your details are already captured for this campaign."]
  }
}
```

| Status | Body                                 |
| :----- | :----------------------------------- |
| `422`  | Default validation shape (see §1.4). |
| `404`  | Unknown event slug.                  |

---

## 4. Health, Webhooks & Platform Utilities

### 4.1 Liveness / Readiness Probe

- **Method**: `GET` · **Endpoint**: `/api/health` · **Auth**: none
- `200` when DB **and** cache are connected, else `503` (same JSON body).

#### Response (`200 OK` / `503 Service Unavailable`)

```json
{
  "status": true,
  "message": "System is healthy",
  "data": {
    "status": "healthy",
    "environment": "production",
    "database": {
      "status": "connected",
      "driver": "mysql",
      "latency_ms": 1.84
    },
    "cache": { "status": "connected", "driver": "redis" },
    "redis": { "status": "connected", "latency_ms": 0.62 },
    "timestamp": "2026-10-16T10:00:00.000000Z"
  },
  "errors": []
}
```

When the DB or cache is disconnected, HTTP is `503` and both `message` and `data.status` flip to `degraded` (i.e. `"message": "System is degraded"`). `redis.status` may be `not_configured`.

### 4.2 Inbound Webhooks (VentV2 Core)

- **Method**: `POST` · **Endpoint**: `/api/webhooks/ventv2`
- Verified and processed by Spatie Webhook Client profile `ventv2`; dispatched to `ProcessVentV2WebhookJob`. Signature verification happens in middleware — no bearer token. Not intended for frontend consumption.

---

## 5. Campaigns

Base: `/api/admin/campaigns` — all require `auth:sanctum`. Permission strings use `campaigns.*`.

### 5.1 List Campaigns

- **Method**: `GET` · **Endpoint**: `/api/admin/campaigns` · **Permission**: `campaigns.view`

#### Query parameters

| Param      | Type   | Notes                                                       |
| :--------- | :----- | :---------------------------------------------------------- |
| `status`   | string | `all` (default) or `pending` / `running` / `closed`         |
| `search`   | string | Matches `name` OR `referral_code` (LIKE, wildcards escaped) |
| `per_page` | int    | 1–100, default 15                                           |

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Campaigns retrieved successfully",
  "data": {
    "summary": { "all": 12, "running": 4, "pending": 6, "closed": 2 },
    "campaigns": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "name": "Campus Tour 2026",
        "target": 5000,
        "referral_code": "CAMP26",
        "status": "running",
        "status_label": "Running",
        "promoters_count": 8,
        "created_at": "2026-10-01T10:00:00.000000Z",
        "updated_at": "2026-10-07T12:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 5.2 Create Campaign

- **Method**: `POST` · **Endpoint**: `/api/admin/campaigns` · **Permission**: `campaigns.create` · **Throttle**: `30,1`

#### Request body

| field           | type   | required | rules                                                  |
| :-------------- | :----- | :------- | :----------------------------------------------------- |
| `name`          | string | yes      | max 255                                                |
| `referral_code` | string | yes      | max 50, unique                                         |
| `target`        | int    | no       | min 0 (default `0`)                                    |
| `status`        | enum   | no       | `pending` \| `running` \| `closed` (default `pending`) |

```json
{
  "name": "Campus Tour 2026",
  "referral_code": "camp26",
  "target": 5000,
  "status": "pending"
}
```

#### Response (`201 Created`)

```json
{
  "status": true,
  "message": "Campaign created successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "name": "Campus Tour 2026",
    "target": 5000,
    "referral_code": "CAMP26",
    "status": "pending",
    "status_label": "Pending",
    "promoters_count": 0,
    "created_at": "2026-10-16T10:00:00.000000Z",
    "updated_at": "2026-10-16T10:00:00.000000Z"
  },
  "errors": []
}
```

`referral_code` is stored uppercase & trimmed.

### 5.3 Show Campaign Details

- **Method**: `GET` · **Endpoint**: `/api/admin/campaigns/{campaign}` · **Permission**: `campaigns.view`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Campaign details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "name": "Campus Tour 2026",
    "target": 5000,
    "referral_code": "CAMP26",
    "status": "running",
    "status_label": "Running",
    "metrics": {
      "promoters_count": 8,
      "audience_count": 1250,
      "verified_audience_count": 980,
      "total_transactions": 640,
      "successful_transactions": 610,
      "easypay_volume": 1520000.0,
      "safewallet_volume": 320000.0,
      "total_volume": 1840000.0
    },
    "promoters": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de444444",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "campaign_name": "Campus Tour 2026",
        "name": "Bolu Promoter",
        "email": "bolu@vent.africa",
        "phone": "+2348011223344",
        "referral_code": "BOLU88",
        "app_referral_link": "https://vent.africa.app.link/BOLU88",
        "web_referral_link": "https://dashboard.vent.africa/auth/sign-up?ref=BOLU88",
        "avatar_url": null,
        "created_at": "2026-10-01T10:00:00.000000Z",
        "updated_at": "2026-10-07T12:00:00.000000Z"
      }
    ],
    "created_at": "2026-10-01T10:00:00.000000Z",
    "updated_at": "2026-10-07T12:00:00.000000Z"
  },
  "errors": []
}
```

### 5.4 Update Campaign

- **Method**: `PUT` · **Endpoint**: `/api/admin/campaigns/{campaign}` · **Permission**: `campaigns.update` · **Throttle**: `30,1`
- All fields optional (`sometimes`); send only what changes.

```json
{ "status": "running", "target": 4000 }
```

#### Response (`200 OK`) — `data` = CampaignResource, message `Campaign updated successfully`.

### 5.5 Delete Campaign

- **Method**: `DELETE` · **Endpoint**: `/api/admin/campaigns/{campaign}` · **Permission**: `campaigns.delete` · **Throttle**: `30,1`
- Soft delete.

```json
{
  "status": true,
  "message": "Campaign deleted successfully",
  "data": null,
  "errors": []
}
```

### 5.6 Batch Delete Campaigns

- **Method**: `POST` · **Endpoint**: `/api/admin/campaigns/batch-delete` · **Permission**: `campaigns.delete` · **Throttle**: `15,1`

#### Request body

```json
{
  "ids": [
    "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "9d8e5730-80ea-43f1-b9ea-c0b8de222222"
  ]
}
```

| field   | rules                  |
| :------ | :--------------------- |
| `ids`   | required, array, min 1 |
| `ids.*` | required, string, uuid |

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Successfully deleted 2 campaign(s)",
  "data": { "deleted_count": 2 },
  "errors": []
}
```

### 5.7 Export Campaigns

- **Method**: `GET` · **Endpoint**: `/api/admin/campaigns/export` · **Permission**: `campaigns.export`
- Query: `format` (`xlsx` default, or `csv`), `search`, `status`.
- Returns a binary file (not JSON). Filename: `campaigns_export_{Y_m_d_His}.{ext}`.
- Columns: `ID, Name, Target, Referral Code, Status, Promoters Count, Created At`.

---

## 6. Promoters

Base: `/api/admin/promoters`.

### 6.1 List Promoters

- **Method**: `GET` · **Endpoint**: `/api/admin/promoters` · **Permission**: `promoters.view`
- Query: `campaign_id` (uuid), `search` (name/email/referral_code/phone), `per_page`.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Promoters retrieved successfully",
  "data": {
    "summary": {
      "total_promoters": 8,
      "total_audience": 1250,
      "verified_users": 980,
      "completed_trades": 610,
      "conversion_rate": 48.8
    },
    "promoters": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de444444",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "campaign_name": "Campus Tour 2026",
        "name": "Bolu Promoter",
        "email": "bolu@vent.africa",
        "phone": "+2348011223344",
        "referral_code": "BOLU88",
        "app_referral_link": "https://vent.africa.app.link/BOLU88",
        "web_referral_link": "https://dashboard.vent.africa/auth/sign-up?ref=BOLU88",
        "avatar_url": null,
        "created_at": "2026-10-01T10:00:00.000000Z",
        "updated_at": "2026-10-07T12:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 6.2 Onboard New Promoter

- **Method**: `POST` · **Endpoint**: `/api/admin/promoters` · **Permission**: `promoters.create` · **Throttle**: `30,1`

#### Request body

| field           | type   | required | rules                                    |
| :-------------- | :----- | :------- | :--------------------------------------- |
| `campaign_id`   | uuid   | yes      | exists in campaigns                      |
| `name`          | string | yes      | max 255                                  |
| `email`         | string | yes      | `email:rfc,dns`, max 255, unique         |
| `phone`         | string | no       | max 50                                   |
| `referral_code` | string | no       | max 50, unique — auto-generated if empty |
| `avatar_url`    | string | no       | valid URL, max 2048                      |

```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "name": "Bolu Promoter",
  "email": "bolu@vent.africa",
  "phone": "+2348011223344",
  "avatar_url": "https://assets.vent.africa/avatars/bolu.png"
}
```

#### Response (`201 Created`) — `data` = PromoterResource (see §6.1), message `Promoter created successfully`.

`app_referral_link` and `web_referral_link` are generated from the referral code.

### 6.3 Show Promoter Profile

- **Method**: `GET` · **Endpoint**: `/api/admin/promoters/{promoter}` · **Permission**: `promoters.view`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Promoter profile retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de444444",
    "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "campaign_name": "Campus Tour 2026",
    "name": "Bolu Promoter",
    "email": "bolu@vent.africa",
    "phone": "+2348011223344",
    "referral_code": "BOLU88",
    "app_referral_link": "https://vent.africa.app.link/BOLU88",
    "web_referral_link": "https://dashboard.vent.africa/auth/sign-up?ref=BOLU88",
    "avatar_url": null,
    "referral_codes": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de555555",
        "code": "BOLU88",
        "label": "Default",
        "deep_link": "https://vent.africa.app.link/BOLU88",
        "created_at": "2026-10-01T10:00:00.000000Z"
      }
    ],
    "metrics": {
      "transactions": {
        "total_transactions": 120,
        "successful_transactions": 112,
        "this_week_transactions": 0,
        "easypay_volume": 152000.0,
        "safewallet_volume": 32000.0,
        "total_trading_volume": 184000.0
      },
      "audience": {
        "total_audience": 250,
        "registered_audience": 250,
        "verified_audience": 180,
        "audience_with_transaction": 112
      }
    },
    "created_at": "2026-10-01T10:00:00.000000Z",
    "updated_at": "2026-10-07T12:00:00.000000Z"
  },
  "errors": []
}
```

### 6.4 Update Promoter

- **Method**: `PUT` · **Endpoint**: `/api/admin/promoters/{promoter}` · **Permission**: `promoters.update` · **Throttle**: `30,1`
- All fields optional. If `referral_code` changes, links and the default referral code record are regenerated.

```json
{ "name": "Bolu A. Promoter", "phone": "+2348099887766" }
```

#### Response (`200 OK`) — `data` = PromoterResource, message `Promoter updated successfully`.

### 6.5 Delete Promoter

- **Method**: `DELETE` · **Endpoint**: `/api/admin/promoters/{promoter}` · **Permission**: `promoters.delete` · **Throttle**: `30,1` · soft delete.

```json
{
  "status": true,
  "message": "Promoter deleted successfully",
  "data": null,
  "errors": []
}
```

### 6.6 Export Promoters

- **Method**: `GET` · **Endpoint**: `/api/admin/promoters/export` · **Permission**: `promoters.export`
- Query: `format` (`xlsx` \| `csv`), `search`, `campaign_id`.
- Filename: `promoters_export_{Y_m_d_His}.{ext}`.
- Columns: `ID, Name, Campaign, Email, Phone, Referral Code, App Referral Link, Web Referral Link, Created At`.

---

## 7. Audiences

Base: `/api/admin/audiences`.

### 7.1 List Audiences

- **Method**: `GET` · **Endpoint**: `/api/admin/audiences` · **Permission**: `audiences.view`
- Query: `campaign_id`, `promoter_id`, `is_verified` (bool), `search` (name/email/phone), `per_page`.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Audiences retrieved successfully",
  "data": {
    "summary": {
      "registered_total": 1250,
      "verified_total": 980,
      "with_transaction_total": 610,
      "unverified_total": 270,
      "today": 12,
      "this_week": 88,
      "this_month": 430,
      "this_year": 1250
    },
    "audiences": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de666666",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "campaign_name": "Campus Tour 2026",
        "promoter_id": "9d8e5730-80ea-43f1-b9ea-c0b8de444444",
        "promoter_name": "Bolu Promoter",
        "name": "Ifeoma Nwosu",
        "email": "ifeoma@example.com",
        "phone": "+2348011223344",
        "is_verified": true,
        "has_transacted": true,
        "verified_at": "2026-10-05T09:00:00.000000Z",
        "first_trade_at": "2026-10-06T11:00:00.000000Z",
        "created_at": "2026-10-04T08:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 7.2 Record Individual Audience

- **Method**: `POST` · **Endpoint**: `/api/admin/audiences` · **Permission**: `audiences.create` · **Throttle**: `30,1`

#### Request body

| field            | type   | required | rules                            |
| :--------------- | :----- | :------- | :------------------------------- |
| `campaign_id`    | uuid   | yes      | exists in campaigns              |
| `name`           | string | yes      | max 255                          |
| `email`          | string | yes      | `email:rfc,dns`, max 255, unique |
| `promoter_id`    | uuid   | no       | exists in promoters              |
| `phone`          | string | no       | max 50                           |
| `is_verified`    | bool   | no       | —                                |
| `has_transacted` | bool   | no       | —                                |

```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "promoter_id": "9d8e5730-80ea-43f1-b9ea-c0b8de444444",
  "name": "Ifeoma Nwosu",
  "email": "ifeoma@example.com",
  "phone": "+2348011223344",
  "is_verified": true,
  "has_transacted": false
}
```

#### Response (`201 Created`) — `data` = AudienceResource, message `Audience registered successfully`.

### 7.3 Show Audience Details

- **Method**: `GET` · **Endpoint**: `/api/admin/audiences/{audience}` · **Permission**: `audiences.view`
- Returns `AudienceDetailResource` (same fields as list item plus `updated_at`), message `Audience details retrieved successfully`.

### 7.4 Batch Import Audiences (CSV / XLS / XLSX)

- **Method**: `POST` · **Endpoint**: `/api/admin/audiences/import-csv` · **Permission**: `audiences.create` · **Throttle**: `15,1`
- Multipart form-data. Queues `ImportAudiencesCsvJob` (async).

#### Request (multipart/form-data)

| field         | type | required | rules                             |
| :------------ | :--- | :------- | :-------------------------------- |
| `campaign_id` | uuid | yes      | exists in campaigns               |
| `file`        | file | yes      | CSV/XLSX or legacy XLS, max 10 MB |

Custom messages: `file.required` → `A CSV or Excel (.xlsx, .xls) file is required for batch import.`, `file.max` → `The import file size may not exceed 10MB.`, `campaign_id.required` → `The campaign ID is required.`, `campaign_id.exists` → `The selected campaign does not exist.`

#### Response (`202 Accepted`)

```json
{
  "status": true,
  "message": "Audience CSV import job has been queued successfully for background processing.",
  "data": {
    "file_name": "audiences_october.xlsx",
    "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
    "queued_at": "2026-10-16T10:00:00.000000Z"
  },
  "errors": []
}
```

### 7.5 Export Audiences

- **Method**: `GET` · **Endpoint**: `/api/admin/audiences/export` · **Permission**: `audiences.export`
- Query: `format`, `search`, `campaign_id`, `promoter_id`, `is_verified`.
- Filename: `audiences_export_{Y_m_d_His}.{ext}`.
- Columns: `ID, Name, Email, Phone, Campaign, Promoter, Is Verified, Has Transacted, Verified At, First Trade At, Registered At`.

---

## 8. Attendances

Base: `/api/admin/attendances`.

### 8.1 List Attendances

- **Method**: `GET` · **Endpoint**: `/api/admin/attendances` · **Permission**: `attendances.view`
- Query: `campaign_id`, `event_id`, `status` (`all` skips filter), `search` (name/email/referral_code/phone), `per_page`.
- **Note**: `summary` counters are computed over **all** attendances, not the filtered set.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Attendances retrieved successfully",
  "data": {
    "summary": {
      "total_attendances": 480,
      "attended_count": 425,
      "not_attended_count": 55
    },
    "attendances": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de777777",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "campaign_name": "Campus Tour 2026",
        "event_id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
        "event_name": "Campus Ambassador Tour UNILAG",
        "promoter_id": null,
        "promoter_name": null,
        "name": "Clement Bassey",
        "email": "clement.bassey@gmail.com",
        "phone": "+2348011223344",
        "referral_code": null,
        "status": "attended",
        "status_label": "Attended",
        "method": "qr_scan",
        "method_label": "QR Scan",
        "attended_at": "2026-10-15T10:05:00.000000Z",
        "created_at": "2026-10-15T10:05:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 8.2 Record Attendee (Manual Entry)

- **Method**: `POST` · **Endpoint**: `/api/admin/attendances` · **Permission**: `attendances.create` · **Throttle**: `30,1`

#### Request body

| field           | type   | required                         | rules                        |
| :-------------- | :----- | :------------------------------- | :--------------------------- |
| `campaign_id`   | uuid   | required unless `event_id` given | exists in campaigns          |
| `event_id`      | uuid   | no                               | exists in events             |
| `promoter_id`   | uuid   | no                               | exists in promoters          |
| `name`          | string | yes                              | max 255                      |
| `email`         | string | yes                              | `email:rfc,dns`, max 255     |
| `phone`         | string | no                               | max 50                       |
| `referral_code` | string | no                               | max 50                       |
| `status`        | enum   | no                               | `attended` \| `not_attended` |
| `method`        | enum   | no                               | `manual` \| `qr_scan`        |

```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "name": "Clement Bassey",
  "email": "clement.bassey@gmail.com",
  "phone": "+2348011223344",
  "status": "attended",
  "method": "manual"
}
```

#### Response (`201 Created`) — `data` = AttendanceResource, message `Attendance recorded successfully`.

#### Errors

Duplicate within the same campaign/event (from `CreateAttendanceAction`):

```json
{
  "status": false,
  "message": "You're already registered. Your details are already captured for this campaign.",
  "data": {
    "email": "clement.bassey@gmail.com",
    "event_name": "Campus Ambassador Tour UNILAG"
  },
  "errors": {
    "email": ["Your details are already captured for this campaign."]
  }
}
```

(`…for this event.` when the conflict is scoped to an event.)

### 8.3 Batch Mark Attendance

- **Method**: `POST` · **Endpoint**: `/api/admin/attendances/mark-attendance` · **Permission**: `attendances.mark` · **Throttle**: `30,1`

#### Request body

```json
{
  "ids": [
    "9d8e5730-80ea-43f1-b9ea-c0b8de777777",
    "9d8e5730-80ea-43f1-b9ea-c0b8de888888"
  ],
  "method": "manual"
}
```

| field    | rules                                              |
| :------- | :------------------------------------------------- |
| `ids`    | required, array, min 1                             |
| `ids.*`  | required, string, uuid, exists in attendances      |
| `method` | optional, `manual` \| `qr_scan` (default `manual`) |

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Successfully marked attendance for 2 attendee(s)",
  "data": { "marked_count": 2 },
  "errors": []
}
```

### 8.4 Show Attendance Details

- **Method**: `GET` · **Endpoint**: `/api/admin/attendances/{attendance}` · **Permission**: `attendances.view`
- Returns `AttendanceDetailResource` = list fields + `activities[]` + `updated_at`. Message `Attendance details retrieved successfully`.

```json
{
  "status": true,
  "message": "Attendance details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de777777",
    "name": "Clement Bassey",
    "email": "clement.bassey@gmail.com",
    "status": "attended",
    "status_label": "Attended",
    "method": "qr_scan",
    "method_label": "QR Scan",
    "activities": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de999999",
        "activity": "attended",
        "actor": {
          "id": "9d8e5730-80ea-43f1-b9ea-c0b8de000001",
          "name": "Ada Admin",
          "email": "admin@vent.africa"
        },
        "created_at": "2026-10-15T10:05:00.000000Z"
      }
    ],
    "updated_at": "2026-10-15T10:05:00.000000Z"
  },
  "errors": []
}
```

### 8.5 Batch Import Attendances (CSV / XLS / XLSX)

- **Method**: `POST` · **Endpoint**: `/api/admin/attendances/import-csv` · **Permission**: `attendances.create` · **Throttle**: `15,1`
- Same multipart contract as §7.4. Queues `ImportAttendancesCsvJob`.

#### Response (`202 Accepted`)

```json
{
  "status": true,
  "message": "Attendance CSV import job has been queued successfully for background processing.",
  "data": {
    "file_name": "attendances_october.xlsx",
    "campaign_id": "…",
    "queued_at": "2026-10-16T10:00:00.000000Z"
  },
  "errors": []
}
```

### 8.6 Export Attendances

- **Method**: `GET` · **Endpoint**: `/api/admin/attendances/export` · **Permission**: `attendances.export`
- Query: `format`, `search`, `campaign_id`, `status`.
- Filename: `attendances_export_{Y_m_d_His}.{ext}`.
- Columns: `ID, Name, Email, Phone, Campaign, Promoter, Referral Code, Status, Method, Attended At, Registered At`.

---

## 9. Events

Base: `/api/admin/events`.

### 9.1 List Events

- **Method**: `GET` · **Endpoint**: `/api/admin/events` · **Permission**: `events.view`
- Query: `campaign_id`, `status` (`all` skips), `search` (name/venue/slug), `per_page`.

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
        "description": "Student developer outreach.",
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
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 9.2 Create Event

- **Method**: `POST` · **Endpoint**: `/api/admin/events` · **Permission**: `events.create` · **Throttle**: `30,1`

#### Request body

| field                   | type   | required | rules                                                                                               |
| :---------------------- | :----- | :------- | :-------------------------------------------------------------------------------------------------- |
| `name`                  | string | yes      | max 255                                                                                             |
| `venue`                 | string | yes      | max 255                                                                                             |
| `event_date`            | date   | yes      | any parseable date                                                                                  |
| `campaign_id`           | uuid   | no       | exists in campaigns                                                                                 |
| `description`           | string | no       | max 5000                                                                                            |
| `status`                | enum   | no       | `pending` \| `running` \| `completed` \| `cancelled` \| `upcoming` \| `active` (default `upcoming`) |
| `banner_url`            | string | no       | valid URL, max 2048                                                                                 |
| `auto_check_in_on_scan` | bool   | no       | default `true`                                                                                      |
| `target`                | int    | no       | min 0, default `0`                                                                                  |

```json
{
  "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
  "name": "Tech Expo Covenant University",
  "venue": "University Chapel Grounds, Ota, Ogun State",
  "event_date": "2026-11-05 10:00:00",
  "description": "Student developer outreach and trading workshop.",
  "status": "upcoming",
  "target": 350,
  "banner_url": "https://assets.vent.africa/banners/cu-expo.png",
  "auto_check_in_on_scan": true
}
```

`slug` is auto-generated and not a request field.

#### Response (`201 Created`) — `data` = EventResource, message `Event created successfully`.

### 9.3 Show Event Details (with QR Code)

- **Method**: `GET` · **Endpoint**: `/api/admin/events/{event}` · **Permission**: `events.view`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Event details retrieved successfully",
  "data": {
    "id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
    "name": "Tech Expo Covenant University",
    "slug": "tech-expo-covenant-university-m3p9l1",
    "status": "running",
    "status_label": "Running",
    "target": 350,
    "registration_url": "https://dashboard.vent.africa/events/tech-expo-covenant-university-m3p9l1",
    "qr_code": {
      "registration_url": "https://dashboard.vent.africa/events/tech-expo-covenant-university-m3p9l1",
      "qr_code_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...></svg>"
    },
    "campaign": {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
      "name": "Campus Tour 2026",
      "target": 5000,
      "referral_code": "CAMP26",
      "status": "running",
      "status_label": "Running",
      "promoters_count": 8,
      "created_at": "…",
      "updated_at": "…"
    },
    "attendances": [
      {
        "id": "…",
        "name": "Clement Bassey",
        "status": "attended",
        "status_label": "Attended",
        "method": "qr_scan",
        "method_label": "QR Scan"
      }
    ],
    "metrics": {
      "target": 350,
      "total_attendees": 0,
      "attended_count": 0,
      "not_attended_count": 0
    },
    "created_at": "2026-10-01T10:00:00.000000Z",
    "updated_at": "2026-10-07T12:00:00.000000Z"
  },
  "errors": []
}
```

### 9.4 Update Event

- **Method**: `PUT` · **Endpoint**: `/api/admin/events/{event}` · **Permission**: `events.update` · **Throttle**: `30,1`
- All fields optional.

```json
{ "status": "completed", "target": 400 }
```

#### Response (`200 OK`) — `data` = EventResource, message `Event updated successfully`.

### 9.5 Delete Event

- **Method**: `DELETE` · **Endpoint**: `/api/admin/events/{event}` · **Permission**: `events.delete` · **Throttle**: `30,1` · soft delete.

```json
{
  "status": true,
  "message": "Event deleted successfully",
  "data": { "id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111" },
  "errors": []
}
```

### 9.6 Generate / Fetch Standalone Event QR Code

- **Method**: `GET` · **Endpoint**: `/api/admin/events/{event}/qr-code` · **Permission**: `events.view`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Event QR code generated successfully",
  "data": {
    "event_id": "9d8e5730-80ea-43f1-b9ea-c0b8de111111",
    "name": "Tech Expo Covenant University",
    "slug": "tech-expo-covenant-university-m3p9l1",
    "registration_url": "https://dashboard.vent.africa/events/tech-expo-covenant-university-m3p9l1",
    "qr_code_svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" ...></svg>"
  },
  "errors": []
}
```

`qr_code_svg` is a ready-to-render SVG string (size 320, margin 1, error correction H).

### 9.7 List Attendees of a Specific Event

- **Method**: `GET` · **Endpoint**: `/api/admin/events/{event}/attendees` · **Permission**: `events.view`
- Query: `status` (`all` skips), `search`, `per_page`.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Event attendees retrieved successfully",
  "data": {
    "summary": {
      "total_attendees": 480,
      "attended_count": 425,
      "not_attended_count": 55
    },
    "attendees": [
      {
        "id": "…",
        "name": "Clement Bassey",
        "email": "clement.bassey@gmail.com",
        "status": "attended",
        "method": "qr_scan"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 9.8 Export Event Attendees

- **Method**: `GET` · **Endpoint**: `/api/admin/events/{event}/export` · **Permission**: `events.export`
- Query: `format`, `search`, `status`.
- Filename: `event_{slug}_attendees_{Y_m_d_His}.{ext}`.
- Columns: `ID, Event Name, Attendee Name, Email, Phone, Status, Method, Attended At, Registered At`.

---

## 10. Deep Links

Base: `/api/admin/deep-links`. `type` ∈ `referral | route | link`; `status` ∈ `active | inactive`. `provider` is always `branch`.

### 10.1 List Deep Links

- **Method**: `GET` · **Endpoint**: `/api/admin/deep-links` · **Permission**: `deep_links.view`
- Query: `type` (`all` ignored), `status` (`all` ignored), `search` (name/referral_code/target/link_url), `per_page`.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Deep links retrieved successfully",
  "data": {
    "summary": {
      "total_links": 20,
      "active_links": 15,
      "inactive_links": 5,
      "total_clicks": 8421
    },
    "deep_links": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8deaaaaaa",
        "name": "Campus Tour Promo",
        "type": "referral",
        "type_label": "Referral",
        "provider": "branch",
        "target": "https://vent.africa/campus-tour",
        "referral_code": "CAMP26",
        "link_url": "https://vent.africa.app.link/CAMP26",
        "preview_title": "Join the Campus Tour",
        "preview_description": "Sign up and start trading.",
        "preview_image_url": "https://assets.vent.africa/previews/campus.png",
        "clicks_count": 512,
        "status": "active",
        "status_label": "Active",
        "created_at": "2026-10-01T10:00:00.000000Z"
      }
    ]
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 10.2 Create Deep Link

- **Method**: `POST` · **Endpoint**: `/api/admin/deep-links` · **Permission**: `deep_links.create` · **Throttle**: `30,1`

#### Request body

| field                 | type   | required | rules                                     |
| :-------------------- | :----- | :------- | :---------------------------------------- |
| `name`                | string | yes      | max 255                                   |
| `type`                | enum   | yes      | `referral` \| `route` \| `link`           |
| `target`              | string | yes      | max 500                                   |
| `referral_code`       | string | no       | max 50 (uppercased; empty → null)         |
| `preview_title`       | string | no       | max 255                                   |
| `preview_description` | string | no       | max 1000                                  |
| `preview_image_url`   | string | no       | valid URL, max 2048                       |
| `status`              | enum   | no       | `active` \| `inactive` (default `active`) |

```json
{
  "name": "Campus Tour Promo",
  "type": "referral",
  "target": "https://vent.africa/campus-tour",
  "referral_code": "camp26",
  "preview_title": "Join the Campus Tour",
  "preview_description": "Sign up and start trading.",
  "preview_image_url": "https://assets.vent.africa/previews/campus.png",
  "status": "active"
}
```

#### Response (`201 Created`) — `data` = DeepLinkResource, message `Deep link created successfully`.

### 10.3 Show Deep Link Details

- **Method**: `GET` · **Endpoint**: `/api/admin/deep-links/{deepLink}` · **Permission**: `deep_links.view`
- Returns `DeepLinkDetailResource` = list fields + `creator` (`{id,name,email}|null`) + `updated_at`. Message `Deep link retrieved successfully`.

### 10.4 Update Deep Link

- **Method**: `PUT` · **Endpoint**: `/api/admin/deep-links/{deepLink}` · **Permission**: `deep_links.update` · **Throttle**: `30,1`
- All fields optional (same fields as create).

```json
{ "status": "inactive", "preview_title": "Campus Tour — now closed" }
```

#### Response (`200 OK`) — message `Deep link updated successfully`.

### 10.5 Toggle Deep Link Status

- **Method**: `PATCH` · **Endpoint**: `/api/admin/deep-links/{deepLink}/toggle-status` · **Permission**: `deep_links.update` · **Throttle**: `30,1`
- No body.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Deep link status changed to inactive",
  "data": { "id": "…", "status": "inactive", "status_label": "Inactive" },
  "errors": []
}
```

### 10.6 Delete Deep Link

- **Method**: `DELETE` · **Endpoint**: `/api/admin/deep-links/{deepLink}` · **Permission**: `deep_links.delete` · **Throttle**: `30,1`

```json
{
  "status": true,
  "message": "Deep link deleted successfully",
  "data": null,
  "errors": []
}
```

---

## 11. Dashboard Analytics & Digest

Base: `/api/admin/dashboard`. All read endpoints inherit `throttle:60,1`.

### 11.1 Real-Time System Overview

- **Method**: `GET` · **Endpoint**: `/api/admin/dashboard/overview` · **Permission**: `dashboard.basic.view`
- Query: `timeframe` (default `all_time`; one of `today`, `this_week`, `this_month`, `this_year`, `custom`, `all_time`), `start_date`, `end_date` (used only when `timeframe=custom`).

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Dashboard overview analytics retrieved successfully",
  "data": {
    "timeframe": "all_time",
    "campaigns": { "total": 12, "running": 4, "pending": 6, "closed": 2 },
    "promoters": { "total": 8 },
    "audiences": {
      "total": 1250,
      "verified": 980,
      "transacted": 610,
      "unverified": 270
    },
    "attendances": { "total": 480, "attended": 425, "not_attended": 55 },
    "events": {
      "total": 14,
      "running": 4,
      "pending": 6,
      "completed": 3,
      "cancelled": 1
    },
    "deep_links": { "total": 20, "active": 15, "total_clicks": 8421 }
  },
  "errors": []
}
```

### 11.2 Conversion Funnel Analytics

- **Method**: `GET` · **Endpoint**: `/api/admin/dashboard/conversion-funnel` · **Permission**: `dashboard.advanced.view`
- Query: `timeframe`, `campaign_id`, `start_date`, `end_date`.

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Conversion funnel analytics retrieved successfully",
  "data": {
    "timeframe": "all_time",
    "registered_count": 1250,
    "verified_count": 980,
    "transacted_count": 610,
    "verification_rate": 78.4,
    "transaction_rate_from_verified": 62.24,
    "overall_conversion_rate": 48.8,
    "stages": [
      { "stage": "Registered Leads", "count": 1250, "percentage": 100.0 },
      { "stage": "KYC Verified Users", "count": 980, "percentage": 78.4 },
      {
        "stage": "First-Trade Transacted Users",
        "count": 610,
        "percentage": 48.8
      }
    ]
  },
  "errors": []
}
```

### 11.3 Campaign Performance Breakdown

- **Method**: `GET` · **Endpoint**: `/api/admin/dashboard/campaign-performance` · **Permission**: `dashboard.advanced.view`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Campaign performance analytics retrieved successfully",
  "data": {
    "campaigns": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "name": "Campus Tour 2026",
        "status": "running",
        "target": 5000,
        "promoters_count": 8,
        "registered_count": 1250,
        "verified_count": 980,
        "transacted_count": 610,
        "target_achievement_rate": 25.0,
        "conversion_rate": 48.8
      }
    ]
  },
  "errors": []
}
```

### 11.4 Promoter Leaderboard

- **Method**: `GET` · **Endpoint**: `/api/admin/dashboard/promoter-leaderboard` · **Permission**: `dashboard.advanced.view`
- Query: `campaign_id` (optional), `limit` (default 10).

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Promoter leaderboard retrieved successfully",
  "data": {
    "leaderboard": [
      {
        "id": "9d8e5730-80ea-43f1-b9ea-c0b8de444444",
        "name": "Bolu Promoter",
        "email": "bolu@vent.africa",
        "referral_code": "BOLU88",
        "campaign_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
        "campaign_name": "Campus Tour 2026",
        "registered_count": 250,
        "verified_count": 180,
        "transacted_count": 112,
        "conversion_rate": 44.8
      }
    ]
  },
  "errors": []
}
```

### 11.5 Trigger Weekly Performance Email Digest

- **Method**: `POST` · **Endpoint**: `/api/admin/dashboard/send-digest` · **Permission**: `dashboard.advanced.view` · **Throttle**: `10,1`
- Optional body `{ "email": "ops@vent.africa" }`; falls back to super-admins → `services.superadmin.alert_email` → `mail.from.address`.

#### Request body

```json
{ "email": "ops@vent.africa" }
```

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Weekly performance digest generated and dispatched successfully",
  "data": {
    "period": { "start": "2026-10-09", "end": "2026-10-16" },
    "metrics": {
      "leads_registered": 430,
      "leads_verified": 300,
      "leads_transacted": 180,
      "event_attendees": 425
    },
    "funnel": {
      "verification_rate_percent": 69.77,
      "transaction_rate_percent": 60.0,
      "overall_conversion_percent": 41.86
    },
    "top_promoters": [
      {
        "id": "…",
        "name": "Bolu Promoter",
        "email": "bolu@vent.africa",
        "referral_code": "BOLU88",
        "campaign_id": "…",
        "campaign_name": "Campus Tour 2026",
        "registered_count": 120,
        "verified_count": 90,
        "transacted_count": 60,
        "conversion_rate": 50.0
      }
    ],
    "active_campaigns": [
      {
        "id": "…",
        "name": "Campus Tour 2026",
        "target": 5000,
        "registered_count": 1250,
        "verified_count": 980,
        "transacted_count": 610,
        "progress_percentage": 25.0
      }
    ],
    "recipients_count": 1
  },
  "errors": []
}
```

---

## 12. RBAC: Roles, Permissions & User Delegation

All under `/api/admin`. Requires the relevant `roles.*` / `permissions.*` / `admins.role_assign` permission. Shared guard is `api`.

### 12.1 Role-Permission Matrix

- **Method**: `GET` · **Endpoint**: `/api/admin/roles/matrix` · **Permission**: `roles.view`

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Role permission matrix fetched successfully",
  "data": {
    "roles": ["super-admin", "admin", "manager", "viewer"],
    "groups": [
      {
        "id": "campaigns",
        "name": "campaigns",
        "label": "Campaigns",
        "permissions": [
          {
            "id": "uuid",
            "name": "campaigns.view",
            "label": "Can view campaigns",
            "roles": {
              "super-admin": true,
              "admin": true,
              "manager": true,
              "viewer": true
            }
          }
        ]
      }
    ]
  },
  "errors": []
}
```

### 12.2 List Roles

- **Method**: `GET` · **Endpoint**: `/api/admin/roles` · **Permission**: `roles.view`
- Query: `per_page`. Message `Roles fetched successfully`.

```json
{
  "status": true,
  "message": "Roles fetched successfully",
  "data": [
    {
      "id": "1",
      "name": "admin",
      "guard_name": "api",
      "permissions": [
        {
          "id": "uuid",
          "name": "campaigns.view",
          "label": "Can view campaigns",
          "guard_name": "api",
          "created_at": "…",
          "updated_at": "…"
        }
      ],
      "created_at": "2026-09-01T10:00:00.000000Z",
      "updated_at": "2026-10-07T12:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 12.3 Create Custom Role

- **Method**: `POST` · **Endpoint**: `/api/admin/roles` · **Permission**: `roles.modify` · **Throttle**: `15,1`

#### Request body

| field         | type     | required | rules                                  |
| :------------ | :------- | :------- | :------------------------------------- |
| `name`        | string   | yes      | max 255, unique in roles               |
| `permissions` | string[] | no       | each must exist in permissions by name |

```json
{
  "name": "regional-manager",
  "permissions": ["campaigns.view", "dashboard.basic.view"]
}
```

#### Response (`201 Created`) — `data` = RoleResource, message `Role created successfully`. `guard_name` is forced to `api`.

### 12.4 Show Role Details

- **Method**: `GET` · **Endpoint**: `/api/admin/roles/{role}` · **Permission**: `roles.view`
- Message `Role fetched successfully`, `data` = RoleResource.

### 12.5 Update Role

- **Method**: `PUT` · **Endpoint**: `/api/admin/roles/{role}` · **Permission**: `roles.modify` · **Throttle**: `15,1`
- Same `RoleFormRequest` rules as create (name uniqueness ignores self).

#### Errors

| Status | Message                                                                |
| :----- | :--------------------------------------------------------------------- |
| `422`  | `System role is immutable and cannot be renamed.` (only `super-admin`) |

### 12.6 Delete Role

- **Method**: `DELETE` · **Endpoint**: `/api/admin/roles/{role}` · **Permission**: `roles.modify` · **Throttle**: `15,1`
- Message `Role deleted successfully`, `data: null`.

| Status | Message                                                                         |
| :----- | :------------------------------------------------------------------------------ |
| `403`  | `System role is immutable and cannot be deleted.`                               |
| `422`  | `Role cannot be deleted because it is currently assigned to one or more users.` |

### 12.7 List All System Permissions (grouped)

- **Method**: `GET` · **Endpoint**: `/api/admin/permissions` · **Permission**: `permissions.view`
- Message `Permissions fetched successfully`. `data` is an array of permission groups, each with a `permissions` array.

```json
{
  "status": true,
  "message": "Permissions fetched successfully",
  "data": [
    {
      "id": "campaigns",
      "name": "campaigns",
      "label": "Campaigns",
      "permissions": [
        {
          "id": "uuid",
          "name": "campaigns.view",
          "label": "Can view campaigns",
          "guard_name": "api",
          "created_at": "…",
          "updated_at": "…"
        }
      ],
      "created_at": "…",
      "updated_at": "…"
    }
  ],
  "errors": []
}
```

### 12.8 Get User Individual Permissions

- **Method**: `GET` · **Endpoint**: `/api/admin/users/{user}/permissions` · **Permission**: `permissions.view`

```json
{
  "status": true,
  "message": "User permissions fetched successfully",
  "data": {
    "user": { "id": "uuid", "name": "Ada Admin", "email": "admin@vent.africa" },
    "direct_permissions": ["campaigns.export"],
    "all_permissions": [
      "campaigns.view",
      "campaigns.export",
      "dashboard.basic.view"
    ]
  },
  "errors": []
}
```

### 12.9 Assign Direct Permissions to User

- **Method**: `POST` · **Endpoint**: `/api/admin/users/{user}/permissions/assign` · **Permission**: `permissions.assign` · **Throttle**: `15,1`

```json
{ "permissions": ["campaigns.export", "reports.view"] }
```

| field           | rules                                           |
| :-------------- | :---------------------------------------------- |
| `permissions`   | required, array, min 1                          |
| `permissions.*` | required, string, exists in permissions by name |

Response (`200 OK`): `data` = `{ user, direct_permissions, all_permissions }`, message `Permissions assigned successfully`.

| Status | Message                                          |
| :----- | :----------------------------------------------- |
| `422`  | `Self-permission modification is not permitted.` |

### 12.10 Revoke Permissions from User

- **Method**: `POST` · **Endpoint**: `/api/admin/users/{user}/permissions/revoke` · **Permission**: `permissions.revoke` · **Throttle**: `15,1`
- Same body as §12.9. Side effect: revokes the user's tokens. Message `Permissions revoked successfully`.

### 12.11 Sync Direct Permissions on User

- **Method**: `PUT` · **Endpoint**: `/api/admin/users/{user}/permissions/sync` · **Permission**: `permissions.assign` · **Throttle**: `15,1`
- Body: `{ "permissions": [...] }` (empty array allowed → clears all direct permissions). Message `Permissions synced successfully`.

### 12.12 Assign Primary Role to User

- **Method**: `POST` · **Endpoint**: `/api/admin/users/{user}/role` · **Permission**: `admins.role_assign` · **Throttle**: `15,1`

```json
{ "role": "manager" }
```

| field  | rules                                     |
| :----- | :---------------------------------------- |
| `role` | required, string, exists in roles by name |

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "User role has been updated successfully",
  "data": {
    "user": { "id": "uuid", "name": "Ada Admin", "email": "admin@vent.africa" },
    "roles": ["manager"]
  },
  "errors": []
}
```

| Status | Message                                                       |
| :----- | :------------------------------------------------------------ |
| `422`  | `Self-role modification is not permitted.`                    |
| `403`  | `Only super-administrators can assign the super-admin role.`  |
| `422`  | `Cannot demote or remove the last super-admin in the system.` |

---

## 13. User Invitations

Base: `/api/admin/invitations`. All require permission `users.create`.

### 13.1 List Team Invitations

- **Method**: `GET` · **Endpoint**: `/api/admin/invitations`
- Query: `role`, `search` (email LIKE), `per_page`. Message `Invitations fetched successfully`.

```json
{
  "status": true,
  "message": "Invitations fetched successfully",
  "data": [
    {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8debbbbbb",
      "email": "new.hire@vent.africa",
      "role": "admin",
      "permissions": ["campaigns.view"],
      "invited_by": {
        "id": "uuid",
        "name": "Ada Admin",
        "email": "admin@vent.africa"
      },
      "expires_at": "2026-10-18T10:00:00.000000Z",
      "created_at": "2026-10-16T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 13.2 Send Team Invitation

- **Method**: `POST` · **Endpoint**: `/api/admin/invitations` · **Throttle**: `15,1`

#### Request body

| field         | type   | required | rules                                                                |
| :------------ | :----- | :------- | :------------------------------------------------------------------- |
| `email`       | string | yes      | `email:rfc,dns`, max 255, unique in users, must match `@vent.africa` |
| `role`        | enum   | yes      | one of the role names                                                |
| `permissions` | enum[] | no       | each a valid permission name                                         |

```json
{
  "email": "new.hire@vent.africa",
  "role": "admin",
  "permissions": ["campaigns.view", "dashboard.basic.view"]
}
```

Custom messages: `email.regex` → `The email address must belong to the @vent.africa domain.`, `email.unique` → `A user with this email address already exists on the platform.`

#### Response (`201 Created`) — `data` = UserInvitationResource, message `Invitation sent successfully`. Token expires in 48h. Any prior pending invite for the email is replaced.

| Status            | Message                                                                    |
| :---------------- | :------------------------------------------------------------------------- |
| `422` (on `role`) | `Only super-administrators can send invitations for the super-admin role.` |

### 13.3 Resend Invitation Email

- **Method**: `POST` · **Endpoint**: `/api/admin/invitations/{invitation}/resend` · **Throttle**: `15,1`
- No body. Issues a new token and refreshes `expires_at` (+48h). Message `Invitation resent successfully`.

### 13.4 Revoke / Cancel Invitation

- **Method**: `DELETE` · **Endpoint**: `/api/admin/invitations/{invitation}` · **Throttle**: `15,1`

```json
{
  "status": true,
  "message": "Invitation cancelled and deleted successfully",
  "data": null,
  "errors": []
}
```

---

## 14. Forensic Activity Logs

Base: `/api/admin/activity-logs`.

### 14.1 Query Activity Logs

- **Method**: `GET` · **Endpoint**: `/api/admin/activity-logs` · **Permission**: `reports.view`

#### Query parameters

| Param        | Type   | Rules                         |
| :----------- | :----- | :---------------------------- |
| `log_name`   | string | max 50                        |
| `causer_id`  | uuid   | —                             |
| `subject_id` | uuid   | —                             |
| `from_date`  | date   | —                             |
| `to_date`    | date   | after or equal to `from_date` |
| `per_page`   | int    | 1–100                         |

#### Response (`200 OK`)

```json
{
  "status": true,
  "message": "Activity logs fetched successfully",
  "data": [
    {
      "id": "9d8e5730-80ea-43f1-b9ea-c0b8decccccc",
      "log_name": "campaigns",
      "description": "Campaign created",
      "subject_type": "App\\Models\\Campaign",
      "subject_id": "9d8e5730-80ea-43f1-b9ea-c0b8de333333",
      "causer_type": "App\\Models\\User",
      "causer_id": "9d8e5730-80ea-43f1-b9ea-c0b8de000001",
      "properties": {
        "attributes": { "name": "Campus Tour 2026" },
        "ip": "102.89.1.1",
        "user_agent": "Mozilla/5.0"
      },
      "created_at": "2026-10-16T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "path": "…",
    "per_page": 15,
    "to": 1,
    "total": 1
  },
  "links": { "first": "…", "last": "…", "prev": null, "next": null },
  "errors": []
}
```

### 14.2 Export Activity Logs

- **Method**: `GET` · **Endpoint**: `/api/admin/activity-logs/export` · **Permission**: `reports.download`
- Same filters as §14.1 (no `per_page`). Returns a binary XLSX. Filename: `activity_logs_{Ymd_His}.xlsx`.
- Columns: `ID, Timestamp (UTC), Log Name, Description, Actor ID, Subject Type, Subject ID, IP Address, User Agent, Properties`.

---

## 15. System Diagnostics & Health Telemetry

### 15.1 Deep Diagnostics & Health Telemetry

- **Method**: `GET` · **Endpoint**: `/api/admin/diagnostics/system-health` · **Permission**: `system_diagnostics.view`
- Returns `200` when healthy, `503` when degraded (same body).

#### Response (`200 OK` / `503 Service Unavailable`)

```json
{
  "status": true,
  "message": "System telemetry retrieved successfully",
  "data": {
    "status": "healthy",
    "environment": "production",
    "timestamp": "2026-10-16T10:00:00.000000Z",
    "database": {
      "status": "connected",
      "driver": "mysql",
      "latency_ms": 1.84
    },
    "cache": { "status": "connected", "driver": "redis", "latency_ms": 0.42 },
    "redis": { "status": "connected", "latency_ms": 0.62 },
    "horizon": { "status": "running", "master_supervisors_count": 1 },
    "storage": {
      "storage_path": "/var/www/storage",
      "free_space_mb": 15360.5,
      "total_space_mb": 51200.0,
      "used_percentage": 70.0
    },
    "runtime": {
      "php_version": "8.4.0",
      "laravel_version": "12.0.0",
      "memory_usage_mb": 42.5,
      "memory_limit": "512M",
      "opcache_enabled": true
    },
    "backup": { "disks": ["s3"], "notifications_enabled": true }
  },
  "errors": []
}
```

`horizon.status` may be `inactive` / `running` / `paused` / `error`. `status` is `degraded` (with `503`) if DB or cache is not `connected`.

---

## 16. Appendix: Enums, Permissions & Error Map

### 16.1 Enumerations

| Enum               | Values                                                                                                                                          | Labels                                                                             |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- |
| `CampaignStatus`   | `pending`, `running`, `closed`                                                                                                                  | Pending, Running, Closed                                                           |
| `EventStatus`      | `upcoming`, `pending`, `running`, `active`, `completed`, `cancelled`                                                                            | Pending (`upcoming`/`pending`), Running (`running`/`active`), Completed, Cancelled |
| `AttendanceStatus` | `attended`, `not_attended`                                                                                                                      | Attended, Not Attended                                                             |
| `AttendanceMethod` | `manual`, `qr_scan`                                                                                                                             | Manual, QR Scan                                                                    |
| `DeepLinkType`     | `referral`, `route`, `link`                                                                                                                     | Referral, Route, Link                                                              |
| `DeepLinkStatus`   | `active`, `inactive`                                                                                                                            | Active, Inactive                                                                   |
| Roles              | `super-admin`, `admin`, `administrator`, `compliance-officer`, `customer-support`, `manager`, `supervisor`, `user`, `viewer`, `account-manager` | —                                                                                  |

> Always render the `*_label` field returned by the API rather than mapping the raw enum client-side.

### 16.2 Permissions used by this service

`campaigns.view|create|update|delete|export` · `promoters.view|create|update|delete|export` · `audiences.view|create|export` · `attendances.view|create|mark|export` · `events.view|create|update|delete|export` · `deep_links.view|create|update|delete` · `dashboard.basic.view` · `dashboard.advanced.view` · `roles.view|modify` · `permissions.view|assign|revoke` · `admins.role_assign` · `users.create` · `reports.view|download` · `system_diagnostics.view`.

(The wider permission registry is shared with the core platform; only the above gate this service's endpoints.)

### 16.3 Error map (quick reference for frontend)

| Trigger                                                               | Status      | Body shape                                                                                  |
| :-------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------ |
| Missing/expired token                                                 | `401`       | `{ "message": "Unauthenticated." }`                                                         |
| Missing permission                                                    | `403`       | `{ status:false, message:"User does not have the right permissions.", data:[], errors:[] }` |
| Unknown resource id                                                   | `404`       | `{ "message": "No query results for model [...]" }`                                         |
| Duplicate event/campaign registration                                 | `409`       | custom envelope, `errors.email[]`                                                           |
| Validation failure                                                    | `422`       | `{ "message": "...", "errors": { field: ["..."] } }`                                        |
| Business-rule rejection (immutable role, self-edit, last super-admin) | `422`/`403` | custom envelope, `message` set                                                              |
| Throttle exceeded                                                     | `429`       | `{ "message": "Too Many Attempts." }` + `Retry-After`                                       |
| Health/degraded                                                       | `503`       | custom envelope, `data.status = "degraded"`                                                 |

### 16.4 Idempotent replay

Repeat of an identical mutating request within 30s returns the cached first response with `X-Idempotent-Replay: true`. Detect it if you need to distinguish a replay from a fresh execution (e.g. analytics).

---

_This document reflects the current `main` branch contracts (FormRequest rules + ApiResource output). For a machine-readable spec importable into Postman/Insomnia/Swagger, use `GET /docs/api.json`._
