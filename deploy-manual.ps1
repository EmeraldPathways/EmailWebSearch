# Manual Deployment Script for EmailWebSearch
# Run this after gcloud auth login

$PROJECT_ID = "emailwebsearch"
$SERVICE_NAME = "emailwebsearch"
$REGION = "us-central1"

Write-Host "Deploying EmailWebSearch to Google Cloud Run..." -ForegroundColor Green

# Build and push container
Write-Host "Building container image..." -ForegroundColor Yellow
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --project=$PROJECT_ID

# Deploy to Cloud Run with env vars
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
  --project=$PROJECT_ID `
  --region=$REGION `
  --platform=managed `
  --allow-unauthenticated `
  --env-vars-file=env.yaml `
  --memory=1Gi `
  --cpu=1

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Check the URL above to access your service." -ForegroundColor Cyan
