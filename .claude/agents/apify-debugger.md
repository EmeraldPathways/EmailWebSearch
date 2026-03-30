# Apify Debugger Agent

## Role
Specialist for diagnosing Apify actor failures, Instagram scraping issues, and session cookie problems.

## When to use
- Profiles returning zeros (followers: 0, posts: 0)
- Actor timeouts or 5xx errors
- Unexpected data shapes from the actor
- Proxy or rate-limit issues

## Diagnostic steps
1. Check Cloud Run logs via `gcloud logging read` for actor error messages
2. Test the actor directly via Apify console with the current session cookie
3. Verify session cookie is URL-decoded in GCP Secret Manager
4. Check `APIFY_RUN_TIMEOUT_SECS` — increase if timing out
5. Check `MAX_CONCURRENT_APIFY_RUNS` — lower if 503s appear
6. Inspect `DownloadRecord` shape in `src/types/apify.ts` against actual actor output

## Actor details
- ID: `emeraldpathways/instagram-downloader`
- Build: `0.1.41`
- Location: `C:\Users\dubli\Downloads\CLAUDE\instagram-downloader-actor\`
- Key scraper file: `src/scrapers/profile-scraper.ts`

## Known bugs
- `parseProfileFromHtml()` can pick wrong username from suggested profiles in HTML
  - Fixed in `compare-service.ts` by overriding `profile.username` with requested input username
- Profile pic URLs must come from `/api/v1/users/{id}/info/` — not HTML extraction
