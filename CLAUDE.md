# Instagram Researcher — Project Context

## What it is
A full-stack Instagram analytics web app. Users search Instagram profiles, view posts, run deep analysis, compare accounts, and track snapshots over time. Built on **Node.js + Express + TypeScript**, served via **Google Cloud Run**, with scraping handled by a private **Apify actor**.

---

## Live URLs
- **Web app:** https://instagram-researcher-w3w2kopdjq-uc.a.run.app
- **GitHub:** https://github.com/EmeraldPathways/instagramresearcher
- **GCP project:** `instagramagent-491221`
- **Cloud Run service:** `instagram-researcher` (region: `us-central1`)

---

## Architecture

```
Browser (Vanilla JS SPA)
  └─ GET /v1/* (Bearer token: dev-secret-key)
       └─ Express API (Cloud Run)
            └─ Apify actor: emeraldpathways/instagram-downloader
                 └─ Instagram internal APIs (with session cookie + proxy)
```

- **Frontend:** `client/` — plain HTML + ES modules, no build step
- **Backend:** `src/` — TypeScript, compiled to `dist/`, runs in Docker

---

## Apify Actor: `emeraldpathways/instagram-downloader`
- **Location on disk:** `C:\Users\dubli\Downloads\CLAUDE\instagram-downloader-actor\`
- **Current build:** `0.1.41`
- **How it works:**
  1. `igGetHtml()` fetches the Instagram profile page (needs session cookie for embedded JSON)
  2. `parseProfileFromHtml()` extracts user ID from embedded JSON
  3. `/api/v1/users/{id}/info/` fetches follower/following/post counts
  4. `/api/v1/feed/user/{id}/` paginates posts
- **Key file:** `src/scrapers/profile-scraper.ts`
- **Deploy:** `cd instagram-downloader-actor && apify push --force`

---

## Key Config & Secrets (Cloud Run env vars via Secret Manager)

| Variable | Notes |
|---|---|
| `APIFY_API_TOKEN` | Apify account token |
| `API_SECRET_KEY` | `dev-secret-key` — Bearer token for all API calls |
| `INSTAGRAM_SESSION_COOKIE` | **Expires periodically — must be refreshed** |
| `INSTAGRAM_USER_AGENT` | Chrome 141 UA string |
| `APIFY_RUN_TIMEOUT_SECS` | 300 |
| `MAX_CONCURRENT_APIFY_RUNS` | 2 |

**Important:** Session cookie must be stored URL-decoded (use `:` not `%3A`).

---

## Actor Input (working config)
```json
{
  "urls": ["https://www.instagram.com/username/"],
  "downloadMedia": false,
  "maxPostsPerProfile": 20,
  "outputFormat": "full",
  "proxyConfiguration": { "useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"] },
  "maxConcurrency": 1,
  "sessionCookie": "<INSTAGRAM_SESSION_COOKIE>",
  "userAgent": "<INSTAGRAM_USER_AGENT>"
}
```
`outputFormat: 'metadata-only'` strips `mediaUrls` — always use `'full'`.

---

## Project Structure
```
src/
  config.ts                  — env vars
  server.ts                  — Express (trust proxy = 1 required for Cloud Run)
  routes/                    — profiles, posts, compare, analysis, hashtags, snapshots
  services/
    apify-client.ts          — runActor() with in-memory TTL cache
    profile-service.ts       — getProfile() → actor with session cookie + RESIDENTIAL proxy
    posts-service.ts         — getPosts() → actor, outputFormat: 'full'
    compare-service.ts       — compareProfiles() — normalises username from input array
    analysis-service.ts      — deep analysis helpers (exported: getTopPosts, calcPostingFrequency, calcContentMix, calcHashtagStrategy)
    hashtag-service.ts
    snapshot-service.ts
  types/
    instagram.ts             — InstagramProfile, InstagramPost, CompareMetrics, CompareResult
    apify.ts                 — DownloadRecord (actor output shape)
client/
  index.html
  js/views/                  — search, profile, posts, compare, analysis, hashtags, snapshots, recommendations
  js/components/             — nav, post-card, stat-badge, mini-chart, insight-card
  css/styles.css
```

---

## Deploy Commands

### App
```bash
cd "c:\Users\dubli\Downloads\CLAUDE\OMEGA FINANCIAL\instagram-researcher"
npm run build
gcloud builds submit --tag gcr.io/instagramagent-491221/instagram-researcher --project=instagramagent-491221
gcloud run deploy instagram-researcher \
  --image gcr.io/instagramagent-491221/instagram-researcher \
  --project=instagramagent-491221 \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated
```

### Actor
```bash
cd "C:\Users\dubli\Downloads\CLAUDE\instagram-downloader-actor"
npm run build
apify push --force
```

---

## Known Issues / Watch-outs

1. **Session cookie expires** — when profile returns zeros or fails, refresh `INSTAGRAM_SESSION_COOKIE` in GCP Secret Manager (URL-decoded value) then redeploy the app.

2. **Actor HTML parser username bug** — `parseProfileFromHtml` can pick up a wrong username from suggested profiles embedded in the page HTML. `compare-service.ts` normalises this by overriding `profile.username` with the requested input username.

3. **Concurrency limit** — `MAX_CONCURRENT_APIFY_RUNS = 2`. Compare + posts can approach this. Increase if 503 errors appear under load.

4. **Profile pic URLs** — always taken from `/api/v1/users/{id}/info/` response (not HTML extraction) to avoid unicode-escaped broken CDN URLs.

---

## Features
- Profile search (followers, bio, profile pic, verified badge)
- Posts grid (thumbnails, engagement rate, pagination)
- Deep Analysis (posting frequency, content mix, hashtag strategy, post timing, top posts)
- Compare 2–4 profiles (metrics table, content mix, top posts, top hashtags, winner badges)
- Recommendations
- Snapshots / growth tracking
- Hashtag search
