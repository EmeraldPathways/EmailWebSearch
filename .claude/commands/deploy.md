# /project:deploy

Deploy the Instagram Researcher app to Google Cloud Run.

## Steps

1. Run `npm run build` — compile TypeScript, fail fast on errors
2. Run `gcloud builds submit --tag gcr.io/instagramagent-491221/instagram-researcher --project=instagramagent-491221`
3. Run `gcloud run deploy instagram-researcher --image gcr.io/instagramagent-491221/instagram-researcher --project=instagramagent-491221 --region=us-central1 --platform=managed --allow-unauthenticated`
4. Confirm the service URL is live with a health check curl
5. Report the deployed URL to the user

## Working directory
`c:\Users\dubli\Downloads\CLAUDE\OMEGA FINANCIAL\instagramresearcher-new-features`

## Notes
- Never skip the build step — deploy only compiled, passing code
- If build fails, stop and report the TypeScript errors
- The service URL pattern: `https://instagram-researcher-*.us-central1.run.app`
