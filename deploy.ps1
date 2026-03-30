# EmailWebSearch Deployment Script
# Based on APIFYAGENTS.md deployment strategy
# Project: emailwebsearch (732497578431)
# Service: emailwebsearch
# Region: us-central1

$PROJECT_ID = "emailwebsearch"
$SERVICE_NAME = "emailwebsearch"
$REGION = "us-central1"

Write-Host "=== EmailWebSearch Deployment ===" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Gray
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Gray
Write-Host "Region: $REGION" -ForegroundColor Gray
Write-Host ""

# Step 1: Build TypeScript
Write-Host "[1/4] Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build successful!" -ForegroundColor Green

# Step 2: Submit container to Cloud Build
Write-Host "`n[2/4] Building and pushing container image..." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --project=$PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Host "Container build failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Deploy to Cloud Run with env vars from env.yaml
Write-Host "`n[3/4] Deploying to Cloud Run..." -ForegroundColor Yellow
if (Test-Path "env.yaml") {
    Write-Host "Using env.yaml for environment variables..." -ForegroundColor Gray
    gcloud run deploy $SERVICE_NAME `
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
        --project=$PROJECT_ID `
        --region=$REGION `
        --platform=managed `
        --allow-unauthenticated `
        --env-vars-file=env.yaml
} else {
    Write-Host "env.yaml not found! Using inline env vars..." -ForegroundColor Yellow
    gcloud run deploy $SERVICE_NAME `
        --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
        --project=$PROJECT_ID `
        --region=$REGION `
        --platform=managed `
        --allow-unauthenticated `
        --set-env-vars="NODE_ENV=production,APIFY_ACTOR_ID=emeraldpathways/custom-web-scraper"
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Verify deployment
Write-Host "`n[4/4] Verifying deployment..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "`nTest commands:" -ForegroundColor Gray
Write-Host "  curl $SERVICE_URL/v1/health" -ForegroundColor White
Write-Host "  curl -H 'Authorization: Bearer dev-secret-key' $SERVICE_URL/v1/extractions" -ForegroundColor White
