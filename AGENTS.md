# EmailWebSearch — AI Agent Guide

This document provides essential context for AI coding agents working on the EmailWebSearch project.

---

## Project Overview

EmailWebSearch is a full-stack web application that extracts contact information (emails, phone numbers, social links) from websites using an Apify actor.

**Architecture:**
```
Browser (Vanilla JS SPA)
  └─ GET /v1/* (Bearer token: dev-secret-key)
       └─ Express API (Cloud Run)
            └─ Apify actor: logical_scrapers/extract-email-from-any-website
                 └─ Target websites (with proxy)
```

---

## Technology Stack

### Backend
- **Runtime:** Node.js 20
- **Language:** TypeScript (ES2022 target, CommonJS modules)
- **Framework:** Express.js 4.x
- **Database:** SQLite (better-sqlite3) with WAL mode
- **External APIs:** Apify Client (for web scraping)

### Frontend
- **Type:** Vanilla JavaScript SPA (Single Page Application)
- **No build step:** Plain HTML + ES modules
- **Styling:** Custom CSS (client/css/styles.css)

### Infrastructure
- **Deployment:** Google Cloud Run (Docker container)
- **Scraping:** Public Apify Actor (`logical_scrapers/extract-email-from-any-website`)

---

## Project Structure

```
emailwebsearch/
├── src/                          # Backend TypeScript source
│   ├── server.ts                 # Express entry point
│   ├── config.ts                 # Environment configuration
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # Bearer token authentication
│   │   ├── error-handler.ts      # Global error handling
│   │   └── rate-limiter.ts       # Rate limiting (20 req/min)
│   ├── routes/                   # API route handlers
│   │   ├── index.ts              # Route aggregator
│   │   └── extractions.ts        # Extraction endpoints
│   ├── services/                 # Business logic layer
│   │   └── extraction-service.ts # Apify actor runner + SQLite storage
│   ├── types/                    # TypeScript type definitions
│   │   ├── api.ts                # API response/error types
│   │   └── extraction.ts         # Extraction result types
│   └── utils/                    # Utilities
│       ├── db.ts                 # SQLite connection & schema
│       ├── decimal.ts            # Decimal math helpers
│       ├── logger.ts             # Structured JSON logging
│       └── file-store.ts         # Legacy file storage
├── client/                       # Frontend SPA (no build)
│   ├── index.html                # Main HTML shell
│   ├── css/styles.css            # Global styles
│   ├── js/api.js                 # API client functions
│   ├── js/components/            # Reusable UI components
│   │   └── nav.js                # Navigation + theme toggle
│   └── js/views/                 # Page views
│       ├── home.js               # URL input form
│       ├── result.js             # Extraction results display
│       └── history.js            # Past extractions list
├── tests/                        # Jest test suites
├── data/                         # SQLite database
├── dist/                         # Compiled backend JS
├── package.json                  # Main project dependencies
├── tsconfig.json                 # TypeScript config
└── Dockerfile                    # Cloud Run container
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APIFY_API_TOKEN` | Yes | - | Apify account API token |
| `API_SECRET_KEY` | Yes | - | Bearer token for API auth |
| `APIFY_RUN_TIMEOUT_SECS` | No | 180 | Max actor run time |
| `MAX_CONCURRENT_APIFY_RUNS` | No | 3 | Concurrency limit |
| `CACHE_TTL_EXTRACT` | No | 600 | Extraction cache TTL (seconds) |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |

---

## Build and Run Commands

### Development
```bash
# Install dependencies
npm install

# Run dev server with hot reload (ts-node)
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server
npm start
```

### Testing
```bash
# Run unit tests only
npm test

# Run integration tests only
npm run test:int

# Run all tests
npm run test:all
```

### Deployment
```bash
# Build and deploy to Cloud Run
npm run build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/emailwebsearch --project=YOUR_PROJECT_ID
gcloud run deploy emailwebsearch \
  --image gcr.io/YOUR_PROJECT_ID/emailwebsearch \
  --project=YOUR_PROJECT_ID \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated
```

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig.json)
- Target: ES2022, Module: CommonJS
- Use explicit return types on public functions
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation

### Naming Conventions
- Files: kebab-case (e.g., `extraction-service.ts`)
- Classes: PascalCase
- Functions/Variables: camelCase
- Constants: UPPER_SNAKE_CASE for true constants
- Types/Interfaces: PascalCase with descriptive names

### Error Handling
- Use `AppError` class for operational errors
- Error codes: `NOT_FOUND`, `APIFY_RUN_FAILED`, `APIFY_TIMEOUT`, `RATE_LIMIT_EXCEEDED`, `INVALID_PARAMS`, `UNAUTHORIZED`, `INTERNAL_ERROR`
- Always pass errors to `next()` in route handlers
- Unknown errors are caught by `errorHandler` middleware

### API Response Format
```typescript
// Success
{ data: T }

// Error
{ error: { code: string, message: string, requestId: string } }
```

---

## Database Schema

```sql
CREATE TABLE extractions (
  id TEXT PRIMARY KEY,
  urls TEXT NOT NULL,
  status TEXT NOT NULL,
  results TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX idx_extractions_created_at ON extractions(created_at);
```

---

## Security Considerations

### Authentication
- All `/v1/*` routes require Bearer token auth
- Token configured via `API_SECRET_KEY` env var
- Default in dev: `dev-secret-key`

### Rate Limiting
- Express-rate-limit configured for 20 req/min
- IP-based limiting with Cloud Run proxy support

---

## Adding New Features

When adding new features, follow this pattern:

1. **Types First**: Define types in `src/types/`
2. **Service Layer**: Implement logic in `src/services/`
3. **Routes**: Add endpoints in `src/routes/`, register in `src/routes/index.ts`
4. **Validation**: Use Zod for input validation
5. **Tests**: Add unit tests for services, integration tests for routes
6. **Client**: Add view in `client/js/views/` if needed

---

## External Dependencies

### Apify Actor: `logical_scrapers/extract-email-from-any-website`
- **Input:** `{ urls: ["https://example.com"] }`
- **Output:** `{ url, emails[], social_links{}, phone_numbers[], scanned_pages[], status, error }`
