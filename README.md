# Housekeeping App

A mobile-first housekeeping management app for hotel staff, connected to Cloudbeds PMS.

## What it does

- Shows rooms checking out today with guest first name, room type, and room number
- Reflects live checkout state from Cloudbeds (30-second polling)
- Housekeepers mark rooms clean or dirty with a single tap — undo with another tap
- Optimistic UI with automatic rollback if the API call fails
- Role-based access: housekeepers see departures only; admins can manage branding and team roles
- Full audit log of all housekeeping status changes

## Setup

### 1. Environment variables

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

CLOUDBEDS_CLIENT_ID=your-client-id
CLOUDBEDS_CLIENT_SECRET=your-client-secret
# OR: CLOUDBEDS_API_KEY=your-direct-api-key

CLOUDBEDS_PROPERTY_ID=your-property-id
NEXT_PUBLIC_PROPERTY_ID_DISPLAY=your-property-id
```

### 2. Run Supabase schema

In the Supabase SQL Editor, paste and run `supabase/schema.sql`.

### 3. Create first user

Go to Supabase → Authentication → Users → Invite user.
The first user automatically becomes admin. Subsequent users get housekeeper role.

### 4. Run locally

```bash
npm install
npm run dev
```

### 5. Deploy

```bash
vercel --prod
```

Set all env vars in Vercel dashboard under Settings → Environment Variables.

## Cloudbeds API used

| Endpoint | Purpose |
|---|---|
| GET /getReservations | Today's departures |
| GET /getHousekeepingStatus | Current room conditions |
| POST /postHousekeepingStatus | Mark room clean or dirty |

All Cloudbeds calls are server-side only. API keys never reach the browser.

## Known limitations (v1)

- Single property only
- No push notifications (30s polling)
- Logo URL must be set directly in the branding_config table
- No dark mode
