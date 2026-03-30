# {{PROJECT_NAME}} — AI Agent Guide

This document provides essential context for AI coding agents working on the {{PROJECT_NAME}} project.

---

## Project Overview

{{PROJECT_DESCRIPTION}}

**Architecture:**
```
Browser (Vanilla JS SPA)
  └─ GET /v1/* (Bearer token: {{API_SECRET_KEY}})
       └─ Express API (Cloud Run)
            └─ Apify actor: {{APIFY_ACTOR_ID}}
                 └─ Target website APIs (with session/auth + proxy)
```

**Live URLs:**
- Web app: https://{{CLOUD_RUN_SERVICE}}-{{PROJECT_ID}}.uc.a.run.app
- GCP project: `{{GCP_PROJECT_ID}}`
- Cloud Run service: `{{CLOUD_RUN_SERVICE}}` (region: `{{GCP_REGION}}`)
- GitHub: https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}

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
- **Scraping:** Private Apify Actor (`{{APIFY_ACTOR_ID}}`)
- **Proxy:** Apify RESIDENTIAL proxy group

---

## Project Structure

```
{{PROJECT_FOLDER}}/
├── src/                          # Backend TypeScript source
│   ├── server.ts                 # Express entry point
│   ├── config.ts                 # Environment configuration
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # Bearer token authentication
│   │   ├── error-handler.ts      # Global error handling
│   │   └── rate-limiter.ts       # Rate limiting (20 req/min)
│   ├── routes/                   # API route handlers
│   │   ├── index.ts              # Route aggregator
│   │   ├── profiles.ts           # Main entity endpoints
│   │   ├── compare.ts            # Multi-entity comparison
│   │   ├── analysis.ts           # Deep analysis endpoints
│   │   └── snapshots.ts          # Snapshot tracking & growth
│   ├── services/                 # Business logic layer
│   │   ├── apify-client.ts       # Actor runner with caching
│   │   ├── profile-service.ts    # Entity fetching
│   │   ├── posts-service.ts      # Posts/data fetching
│   │   ├── analysis-service.ts   # Analysis algorithms
│   │   └── snapshot-service.ts   # Snapshot CRUD & growth
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts              # Main entity types
│   │   ├── analysis.ts           # Analysis result types
│   │   ├── api.ts                # API response/error types
│   │   └── apify.ts              # Actor input/output types
│   └── utils/                    # Utilities
│       ├── db.ts                 # SQLite connection & schema
│       ├── decimal.ts            # Decimal math helpers
│       └── logger.ts             # Structured JSON logging
├── client/                       # Frontend SPA (no build)
│   ├── index.html                # Main HTML shell
│   ├── css/styles.css            # Global styles
│   ├── js/api.js                 # API client functions
│   ├── js/views/                 # Page views
│   └── js/components/            # Reusable UI components
├── tests/                        # Jest test suites
│   ├── unit/                     # Unit tests (services)
│   └── integration/              # Integration tests (routes)
├── apify-actor/                  # Embedded Apify actor project
│   ├── src/                      # Actor source (TypeScript)
│   ├── dist/                     # Compiled actor JS
│   ├── .actor/                   # Actor metadata
│   └── package.json              # Actor dependencies
├── data/                         # SQLite database & snapshots
├── dist/                         # Compiled backend JS
├── package.json                  # Main project dependencies
├── tsconfig.json                 # TypeScript config
├── Dockerfile                    # Cloud Run container
└── .github/                      # GitHub Actions (optional)
    └── workflows/
        └── deploy.yml            # Auto-deploy to Cloud Run
```

---

## Initial Setup Checklist

### 1. Google Cloud Platform Setup

```bash
# Create GCP project
gcloud projects create {{GCP_PROJECT_ID}} --name="{{PROJECT_NAME}}"

# Set as default
gcloud config set project {{GCP_PROJECT_ID}}

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create service account for Cloud Run
gcloud iam service-accounts create {{SERVICE_ACCOUNT_NAME}} \
  --display-name="{{PROJECT_NAME}} Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding {{GCP_PROJECT_ID}} \
  --member="serviceAccount:{{SERVICE_ACCOUNT_NAME}}@{{GCP_PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

### 2. GitHub Repository Setup

```bash
# Create GitHub repo
cd {{PROJECT_FOLDER}}
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/{{GITHUB_OWNER}}/{{GITHUB_REPO}}.git
git push -u origin main
```

### 3. Apify Actor Setup

```bash
# Install Apify CLI
npm install -g apify-cli

# Login to Apify
apify login

# Create actor in project
cd apify-actor
apify create {{APIFY_ACTOR_NAME}}

# Build and push
npm run build
apify push --force
```

### 4. Environment Variables

Create `.env` file locally:
```
APIFY_API_TOKEN=apify_api_XXX
API_SECRET_KEY=dev-secret-key
APIFY_RUN_TIMEOUT_SECS=180
MAX_CONCURRENT_APIFY_RUNS=2
CACHE_TTL_PROFILE=600
CACHE_TTL_POSTS=300
PORT=3000
NODE_ENV=development
```

Store secrets in GCP Secret Manager:
```bash
# Create secrets
gcloud secrets create apify-api-token --data-file=<(echo -n "apify_api_XXX")
gcloud secrets create api-secret-key --data-file=<(echo -n "your-secret-key")

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding apify-api-token \
  --member="serviceAccount:{{SERVICE_ACCOUNT_NAME}}@{{GCP_PROJECT_ID}}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Environment Variables

All required secrets should be configured in Google Cloud Secret Manager and mounted as env vars in Cloud Run.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APIFY_API_TOKEN` | Yes | - | Apify account API token |
| `API_SECRET_KEY` | Yes | - | Bearer token for API auth |
| `APIFY_RUN_TIMEOUT_SECS` | No | 180 | Max actor run time |
| `MAX_CONCURRENT_APIFY_RUNS` | No | 2 | Concurrency limit |
| `CACHE_TTL_PROFILE` | No | 600 | Profile cache TTL (seconds) |
| `CACHE_TTL_POSTS` | No | 300 | Posts cache TTL (seconds) |
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
gcloud builds submit --tag gcr.io/{{GCP_PROJECT_ID}}/{{CLOUD_RUN_SERVICE}} --project={{GCP_PROJECT_ID}}
gcloud run deploy {{CLOUD_RUN_SERVICE}} \
  --image gcr.io/{{GCP_PROJECT_ID}}/{{CLOUD_RUN_SERVICE}} \
  --project={{GCP_PROJECT_ID}} \
  --region={{GCP_REGION}} \
  --platform=managed \
  --allow-unauthenticated
```

### Apify Actor
```bash
cd apify-actor
npm run build
apify push --force
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
- Files: kebab-case (e.g., `profile-service.ts`)
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

// Paginated
{ data: T[], total: number, page: number, pageSize: number, hasMore: boolean }

// Error
{ error: { code: string, message: string, requestId: string } }
```

---

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Test service layer functions in isolation
- Mock external dependencies (Apify client, database)
- Use Jest with ts-jest preset
- Test files: `*.test.ts`

### Integration Tests (`tests/integration/`)
- Test route handlers with full middleware stack
- Use supertest for HTTP assertions
- Mock service layer to avoid external calls
- Test authentication, validation, error responses

### Test Utilities
```typescript
// Mock Apify client
jest.mock('../../src/services/apify-client');

// Clear mocks between tests
beforeEach(() => jest.clearAllMocks());

// Test with auth token
const TOKEN = process.env['API_SECRET_KEY'] ?? 'dev-secret-key';
await request(app).get('/v1/profiles/test').set('Authorization', `Bearer ${TOKEN}`);
```

---

## Key Architectural Patterns

### Service Layer Pattern
Business logic is encapsulated in `src/services/`:
- Services are pure functions (no Express dependencies)
- Services return typed promises
- Services handle external API calls (Apify)
- Services use caching via `apify-client.ts`

### Repository Pattern (SQLite)
- Database access through `getDb()` utility
- Schema initialized automatically on first use
- WAL mode enabled for concurrent access

### Caching Strategy
- In-memory TTL cache in `apify-client.ts`
- Cache keys: `${type}:${identifier}`
- Configurable TTL per content type
- Cache cleared on app restart (ephemeral)

### Rate Limiting
- 20 requests per minute per IP
- Returns `429` with `RATE_LIMIT_EXCEEDED` code
- Trusts proxy (required for Cloud Run)

---

## Database Schema Template

```sql
-- Main entity snapshots for tracking over time
CREATE TABLE snapshots (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  taken_at TEXT NOT NULL,
  data TEXT NOT NULL  -- JSON blob
);
CREATE INDEX idx_snapshots_entity ON snapshots(entity_id);
CREATE INDEX idx_snapshots_taken_at ON snapshots(taken_at);

-- Auto-tracking schedule
CREATE TABLE tracked_entities (
  entity_id TEXT PRIMARY KEY,
  schedule TEXT NOT NULL DEFAULT 'daily',
  added_at TEXT NOT NULL
);
```

---

## Security Considerations

### Authentication
- All `/v1/*` routes require Bearer token auth
- Token configured via `API_SECRET_KEY` env var
- Default in dev: `change-me-in-production`

### Data Sanitization
- Logger sanitizes output (never logs tokens, passwords, PII)
- Safe fields whitelist in `utils/logger.ts`

### Rate Limiting
- Express-rate-limit configured for 20 req/min
- IP-based limiting with Cloud Run proxy support

### Dependencies
- `better-sqlite3` requires native compilation (python3, make, g++ in Docker)
- Decimal.js for precise financial/math calculations
- Zod for input validation

---

## Adding New Features

When adding new features, follow this pattern:

1. **Types First**: Define types in `src/types/` (follow existing conventions)
2. **Service Layer**: Implement logic in `src/services/`
3. **Routes**: Add endpoints in `src/routes/`, register in `src/routes/index.ts`
4. **Validation**: Use Zod for input validation
5. **Tests**: Add unit tests for services, integration tests for routes
6. **Client**: Add view in `client/js/views/` if needed

### Feature Checklist
- [ ] Type definitions in `src/types/`
- [ ] Service functions in `src/services/`
- [ ] Route handlers in `src/routes/`
- [ ] API endpoint registered in `src/routes/index.ts`
- [ ] Unit tests in `tests/unit/`
- [ ] Integration tests in `tests/integration/`
- [ ] Frontend view/component updated
- [ ] CSS styles added
- [ ] Manual testing completed
- [ ] Deployed to Cloud Run

---

## GitHub Actions CI/CD (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build TypeScript
      run: npm run build
    
    - name: Setup gcloud
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ secrets.CLOUD_RUN_SERVICE }}
        gcloud run deploy ${{ secrets.CLOUD_RUN_SERVICE }} \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ secrets.CLOUD_RUN_SERVICE }} \
          --region=${{ secrets.GCP_REGION }} \
          --platform=managed \
          --allow-unauthenticated
```

---

## Troubleshooting

### Common Issues

1. **Apify Actor Fails**
   - Check `APIFY_API_TOKEN` is valid
   - Verify actor ID is correct
   - Check actor logs in Apify console

2. **Database Errors on Cloud Run**
   - Ensure Dockerfile includes build tools (python3, make, g++)
   - SQLite requires native compilation

3. **Rate Limiting Issues**
   - Verify `trust proxy` is set in Express
   - Check `MAX_CONCURRENT_APIFY_RUNS` isn't exceeded

4. **Authentication Failures**
   - Verify `API_SECRET_KEY` matches client token
   - Check Authorization header format: `Bearer {token}`

5. **CORS Errors**
   - Add CORS middleware in `server.ts` if needed
   - Verify frontend is using correct API URL

---

## External Dependencies

### Apify Actor: `{{APIFY_ACTOR_ID}}`
- **Location:** `apify-actor/` (embedded in repo)
- **How it works:**
  1. Fetches target website data (needs auth/session if required)
  2. Parses and extracts structured data
  3. Returns standardized output format

### Actor Input Configuration Template
```json
{
  "urls": ["https://example.com/profile/username"],
  "downloadMedia": false,
  "maxItems": 50,
  "outputFormat": "full",
  "proxyConfiguration": { 
    "useApifyProxy": true, 
    "apifyProxyGroups": ["RESIDENTIAL"] 
  },
  "maxConcurrency": 1
}
```

---

## Resources

- **Apify Docs:** https://docs.apify.com/
- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **Express Docs:** https://expressjs.com/
- **TypeScript Docs:** https://www.typescriptlang.org/docs/
- **better-sqlite3:** https://github.com/WiseLibs/better-sqlite3

---

## Template Variables Reference

Replace these placeholders when creating a new project:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{PROJECT_NAME}}` | Project display name | "LinkedIn Researcher" |
| `{{PROJECT_FOLDER}}` | Local folder name | "linkedinresearcher" |
| `{{PROJECT_DESCRIPTION}}` | Brief description | "LinkedIn analytics tool" |
| `{{API_SECRET_KEY}}` | Dev auth token | "dev-secret-key" |
| `{{APIFY_ACTOR_ID}}` | Apify actor ID | "username/actor-name" |
| `{{APIFY_ACTOR_NAME}}` | Apify actor short name | "linkedin-scraper" |
| `{{GCP_PROJECT_ID}}` | Google Cloud project ID | "myproject-123456" |
| `{{CLOUD_RUN_SERVICE}}` | Cloud Run service name | "linkedin-researcher" |
| `{{GCP_REGION}}` | GCP region | "us-central1" |
| `{{SERVICE_ACCOUNT_NAME}}` | GCP service account | "app-runner" |
| `{{GITHUB_OWNER}}` | GitHub username/org | "myusername" |
| `{{GITHUB_REPO}}` | GitHub repo name | "linkedinresearcher" |

---

*This is a template. Copy to `AGENTS.md` and replace all `{{VARIABLES}}` with your project-specific values.*
