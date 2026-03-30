# API Conventions

## Route structure
All routes are under `/v1/` and require `Authorization: Bearer <API_SECRET_KEY>`.

```
GET  /v1/profiles/:username              — profile lookup
GET  /v1/profiles/:username/posts        — paginated posts (?page=1&limit=12)
GET  /v1/profiles/:username/analysis     — deep analysis (fetches up to 50 posts)
GET  /v1/profiles/:username/snapshots    — list snapshots
POST /v1/profiles/:username/snapshots    — take new snapshot
GET  /v1/profiles/:username/growth       — follower growth (requires 2+ snapshots)
GET  /v1/profiles/:username/track        — check auto-tracking status
POST /v1/profiles/:username/track        — enable auto-tracking { schedule: 'daily'|'weekly' }
DELETE /v1/profiles/:username/track      — disable auto-tracking
GET  /v1/profiles/:username/export       — export snapshots (?format=json|csv)
GET  /v1/compare                         — compare 2-4 profiles (?usernames=a,b,c)
GET  /v1/compare/analysis                — competitor analysis (?usernames=a,b,c)
GET  /v1/hashtags/search                 — hashtag search (?q=travel&limit=20)
GET  /v1/tracked                         — list all auto-tracked profiles
```

## Response envelope
All responses follow:
```json
{ "data": <payload> }
```
Errors follow:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

## Username validation
All usernames validated with: `/^[\w.]+$/` — letters, numbers, underscores, dots only.

## Adding a new route
1. Create handler in `src/routes/`
2. Register in `src/routes/index.ts`
3. Add frontend fetch function to `client/js/api.js`
4. Never access the API directly from view files — always go through `api.js`
