# Apify Actor Conventions

## Actor: `emeraldpathways/instagram-downloader`

### Always use these actor input settings
```json
{
  "downloadMedia": false,
  "outputFormat": "full",
  "proxyConfiguration": { "useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"] },
  "maxConcurrency": 1,
  "sessionCookie": "<INSTAGRAM_SESSION_COOKIE>",
  "userAgent": "<INSTAGRAM_USER_AGENT>"
}
```

### Critical rules
- **Always `outputFormat: 'full'`** — `'metadata-only'` strips `mediaUrls`, breaking type detection and thumbnails
- **Always RESIDENTIAL proxy** — datacenter proxies get blocked by Instagram
- **Never increase `maxConcurrency` above 1** per actor run — Instagram rate limits aggressively
- **Session cookie must be URL-decoded** — store with `:` not `%3A`

### Caching
- All actor calls go through `runActor()` in `src/services/apify-client.ts`
- Cache keys follow pattern: `<type>:<username>:<limit>` e.g. `posts:natgeo:50`
- TTLs configured in `.env`: `CACHE_TTL_PROFILE`, `CACHE_TTL_POSTS`, `CACHE_TTL_HASHTAGS`

### Actor output shape
- Defined in `src/types/apify.ts` as `DownloadRecord`
- `record.mediaUrls[0]` = thumbnail URL
- `record.mediaUrls.length > 1` = carousel post
- `record.type === 'reel' || 'igtv'` = video

### Deploying actor changes
```bash
cd "C:\Users\dubli\Downloads\CLAUDE\instagram-downloader-actor"
npm run build
apify push --force
```
Current build: `0.1.41`

### Concurrency limit
`MAX_CONCURRENT_APIFY_RUNS=2` — if compare + posts run simultaneously, this can be hit.
Increase env var and redeploy if 503 errors appear under load.
