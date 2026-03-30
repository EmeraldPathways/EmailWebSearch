# /project:check-logs

Fetch and display recent Cloud Run logs for debugging.

## Steps

1. Run:
   ```
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=instagram-researcher" \
     --project=instagramagent-491221 \
     --limit=50 \
     --format=json | jq '.[] | {time: .timestamp, msg: (.textPayload // .jsonPayload)}'
   ```
2. Filter for errors or warnings
3. Summarise what you find — highlight any actor failures, session cookie errors, or 5xx responses

## Common issues to look for
- `INSTAGRAM_SESSION_COOKIE` expired → profiles return zeros
- Apify actor timeout → increase `APIFY_RUN_TIMEOUT_SECS`
- `MAX_CONCURRENT_APIFY_RUNS` hit → 503 errors under load
- Actor HTML parser picking wrong username → compare-service username normalisation
