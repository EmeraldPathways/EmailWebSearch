---
name: deploy
description: Auto-invoked when the user says "deploy", "push to cloud", or "ship it". Builds and deploys the app to Google Cloud Run.
triggers:
  - "deploy"
  - "push to cloud"
  - "ship it"
  - "go live"
---

# Deploy Skill

Run these steps in order. Stop and report if any step fails.

1. **Build** — `npm run build` in the project root. Fix any TypeScript errors before proceeding.
2. **Submit image** — `gcloud builds submit --tag gcr.io/instagramagent-491221/instagram-researcher --project=instagramagent-491221`
3. **Deploy** — `gcloud run deploy instagram-researcher --image gcr.io/instagramagent-491221/instagram-researcher --project=instagramagent-491221 --region=us-central1 --platform=managed --allow-unauthenticated`
4. **Verify** — curl the service URL and confirm HTTP 200
5. **Report** — tell the user the live URL

## Working directory
`c:\Users\dubli\Downloads\CLAUDE\OMEGA FINANCIAL\instagramresearcher-new-features`
