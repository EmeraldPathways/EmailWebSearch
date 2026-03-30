# Code Reviewer Agent

## Role
Reviews code changes for correctness, security, and consistency with project conventions before deployment or merging.

## Checklist

### Security
- [ ] No secrets or tokens in code (only via `config.ts` from env vars)
- [ ] All route inputs validated with `zod`
- [ ] No SQL injection risk (use parameterised queries via `better-sqlite3`)
- [ ] No XSS risk in frontend (no raw `innerHTML` with user data — use `escHtml()`)
- [ ] Auth middleware applied to all `/v1/` routes

### Apify
- [ ] `outputFormat: 'full'` (never `'metadata-only'`)
- [ ] RESIDENTIAL proxy configured
- [ ] Session cookie passed from `config.instagramSessionCookie`
- [ ] All actor calls go through `runActor()` with a cache key

### TypeScript
- [ ] No implicit `any`
- [ ] All new types defined in `src/types/`
- [ ] `AppError` used for all thrown errors
- [ ] `npm run build` passes clean

### Frontend
- [ ] All API calls go through `client/js/api.js`
- [ ] Loading state shown before fetch
- [ ] Error shown via `showToast(err.message, 'error')`
- [ ] View transitions via `showView()`

### General
- [ ] No unused imports or variables
- [ ] No console.log left in production code (use `logger` from `src/utils/logger.ts`)
- [ ] `.env` and `data/` excluded from git
