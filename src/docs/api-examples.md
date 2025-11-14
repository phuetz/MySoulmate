# MySoulmate API Examples

This document provides practical examples of using the MySoulmate API.

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Companions](#companions)
4. [Messaging](#messaging)
5. [Subscriptions](#subscriptions)
6. [Analytics](#analytics)
7. [GDPR](#gdpr)
8. [Internationalization](#internationalization)

## Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "username": "johndoe"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "createdAt": "2025-01-14T10:00:00.000Z"
  },
  "expiresIn": "24h"
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Login with 2FA

```bash
# Step 1: Login (returns twoFactorRequired: true)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# Step 2: Verify 2FA code
curl -X POST http://localhost:3000/api/v1/2fa/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEMP_TOKEN" \
  -d '{
    "token": "123456"
  }'
```

## User Management

### Get User Profile

```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User Profile

```bash
curl -X PUT http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "preferences": {
      "theme": "dark",
      "language": "fr"
    }
  }'
```

## Companions

### Create a Companion

```bash
curl -X POST http://localhost:3000/api/v1/companions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Luna",
    "personality": {
      "traits": ["friendly", "supportive", "creative"],
      "tone": "warm"
    },
    "appearance": {
      "avatarUrl": "https://example.com/avatar.png",
      "style": "modern"
    },
    "voiceSettings": {
      "voice": "female",
      "pitch": 1.0,
      "speed": 1.0
    }
  }'
```

### Get Companion Details

```bash
curl http://localhost:3000/api/v1/companions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Companion Personality

```bash
curl -X PUT http://localhost:3000/api/v1/companions/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "personality": {
      "traits": ["friendly", "supportive", "adventurous"],
      "tone": "energetic"
    }
  }'
```

## Messaging

### Send a Message

```bash
curl -X POST http://localhost:3000/api/v1/companions/1/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! How are you today?",
    "type": "text"
  }'
```

**Response:**
```json
{
  "message": {
    "id": 123,
    "conversationId": 1,
    "role": "user",
    "content": "Hello! How are you today?",
    "timestamp": "2025-01-14T10:30:00.000Z"
  },
  "response": {
    "id": 124,
    "conversationId": 1,
    "role": "assistant",
    "content": "Hi! I'm doing great, thank you for asking! How about you?",
    "timestamp": "2025-01-14T10:30:02.000Z"
  }
}
```

### Get Conversation History

```bash
curl "http://localhost:3000/api/v1/conversations/1/messages?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Subscriptions

### Get Available Plans

```bash
curl http://localhost:3000/api/v1/subscriptions/plans
```

### Subscribe to Premium

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "premium",
    "billingPeriod": "monthly",
    "paymentMethod": "stripe"
  }'
```

### Get Current Subscription

```bash
curl http://localhost:3000/api/v1/subscriptions/current \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Cancel Subscription

```bash
curl -X POST http://localhost:3000/api/v1/subscriptions/current/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Analytics

### Track Custom Event

```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Feature Used",
    "properties": {
      "feature_name": "voice_call",
      "duration": 120
    }
  }'
```

### Identify User (Set Properties)

```bash
curl -X POST http://localhost:3000/api/v1/analytics/identify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "properties": {
      "plan": "premium",
      "signup_date": "2025-01-01",
      "preferred_language": "en"
    }
  }'
```

### Get Analytics Dashboard (Admin)

```bash
curl "http://localhost:3000/api/v1/analytics/dashboard?startDate=2025-01-01&endDate=2025-01-14" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## GDPR

### Export User Data

```bash
curl -X GET http://localhost:3000/api/v1/gdpr/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "companions": [...],
  "messages": [...],
  "subscriptions": [...],
  "purchases": [...],
  "analytics": [...]
}
```

### Request Account Deletion

```bash
curl -X POST http://localhost:3000/api/v1/gdpr/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "DELETE MY ACCOUNT"
  }'
```

### Manage Consent

```bash
curl -X POST http://localhost:3000/api/v1/gdpr/consent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "analytics": true,
    "marketing": false,
    "essential": true
  }'
```

## Internationalization

### Get Available Languages

```bash
curl http://localhost:3000/api/v1/i18n/locales
```

**Response:**
```json
{
  "defaultLocale": "en",
  "supportedLocales": ["en", "fr", "es", "de", "it", "pt", "ja", "zh"],
  "locales": [
    { "code": "en", "name": "English" },
    { "code": "fr", "name": "Français" },
    { "code": "es", "name": "Español" }
  ]
}
```

### Get Translations for a Locale

```bash
curl http://localhost:3000/api/v1/i18n/translations/fr
```

### Make Request with Specific Language

```bash
# Using query parameter
curl "http://localhost:3000/api/v1/users/me?lang=fr" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Using header
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Locale: fr"

# Using Accept-Language
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept-Language: fr-FR,fr;q=0.9,en;q=0.8"
```

## WebSocket Examples

### Connect to WebSocket

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('message:receive', (message) => {
  console.log('New message:', message);
});

// Send a message
socket.emit('message:send', {
  content: 'Hello!',
  companionId: 1
});

// Typing indicators
socket.emit('typing:start', { companionId: 1 });
socket.emit('typing:stop', { companionId: 1 });

// Presence
socket.emit('presence:update', { status: 'online' });
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes
- **AI interactions**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642156800
```

## Pagination

List endpoints support pagination:

```bash
curl "http://localhost:3000/api/v1/products?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```
