# Custom Web Scraper — Apify Actor

A flexible web scraper built with **Playwright** and **Crawlee**. Extract any data from websites using CSS selectors or a custom JavaScript page function.

## Features

- **CSS Selector extraction** — Define field names and selectors via JSON input
- **Custom page function** — Write your own async extraction logic in JavaScript
- **Default contact extraction** — Automatically extracts emails, phone numbers, social links, and page metadata when no selectors or page function are provided
- **Link following** — Configurable CSS selector for crawling additional pages
- **Proxy support** — Built-in Apify Proxy integration

## Input

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `startUrls` | array | `[{ "url": "https://example.com" }]` | URLs to start scraping from |
| `linkSelector` | string | `a[href]` | CSS selector for links to follow. Empty string disables link following. |
| `maxPagesPerCrawl` | integer | `10` | Maximum pages to scrape (0 = unlimited) |
| `selectors` | object | `null` | Key-value pairs of field names and CSS selectors |
| `pageFunction` | string | `null` | Custom async function body. Overrides selectors. |
| `proxyConfiguration` | object | `{ "useApifyProxy": true }` | Proxy settings |

## Example Input — CSS Selectors

```json
{
  "startUrls": [{ "url": "https://example.com" }],
  "selectors": {
    "title": "h1",
    "description": "meta[name='description']",
    "emails": "a[href^='mailto:']"
  },
  "maxPagesPerCrawl": 5
}
```

## Example Input — Custom Page Function

```json
{
  "startUrls": [{ "url": "https://example.com" }],
  "pageFunction": "return { title: await page.title(), url: request.url };",
  "maxPagesPerCrawl": 5
}
```

## Example Input — Default Contact Extraction

```json
{
  "startUrls": [{ "url": "https://example.com" }],
  "maxPagesPerCrawl": 1,
  "linkSelector": ""
}
```

This will return:

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "description": "...",
  "emails": ["hello@example.com"],
  "phoneNumbers": ["+1-555-1234"],
  "socialLinks": { "twitter": ["https://twitter.com/example"] },
  "scannedPages": ["/about", "/contact"],
  "status": "success",
  "error": null
}
```

## Deploy to Apify

1. Install the [Apify CLI](https://docs.apify.com/cli):
   ```bash
   npm install -g apify-cli
   ```

2. Log in:
   ```bash
   apify login
   ```

3. Push the actor:
   ```bash
   cd actor
   apify push
   ```

4. Run it from the [Apify Console](https://console.apify.com).

## Local Development

```bash
cd actor
npm install
apify run
```

## Integration with EmailWebSearch

To use this actor instead of the public `logical_scrapers/extract-email-from-any-website` actor, update your `emailwebsearch` backend:

1. Change the actor ID in `src/services/extraction-service.ts`:
   ```typescript
   const run = await client.actor('YOUR_USERNAME/custom-web-scraper').call(
     { urls: normalized, maxPagesPerCrawl: 1, linkSelector: '' },
     { waitSecs: config.apifyRunTimeoutSecs }
   );
   ```

2. Adjust the result mapping if needed (the default output format matches the EmailWebSearch types).
