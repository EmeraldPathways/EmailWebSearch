# Diagnostic script for EmailWebSearch deployment

$PROJECT_ID = "emailwebsearch"
$SERVICE_NAME = "emailwebsearch"
$REGION = "us-central1"

Write-Host "=== EmailWebSearch Deployment Diagnostics ===" -ForegroundColor Cyan

# Check authentication
Write-Host "`n1. Checking gcloud authentication..." -ForegroundColor Yellow
gcloud auth list

# Check project
Write-Host "`n2. Checking project configuration..." -ForegroundColor Yellow
gcloud config get-value project

# Check if service exists
Write-Host "`n3. Checking Cloud Run service status..." -ForegroundColor Yellow
try {
    gcloud run services describe $SERVICE_NAME --region=$REGION --format="table(status.conditions)"
} catch {
    Write-Host "Service not found or error retrieving status" -ForegroundColor Red
}

# Check logs
Write-Host "`n4. Recent logs (last 10 entries)..." -ForegroundColor Yellow
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=10 --format="table(timestamp,severity,textPayload)"

# Check if container image exists
Write-Host "`n5. Checking container registry..." -ForegroundColor Yellow
gcloud container images list-tags gcr.io/$PROJECT_ID/$SERVICE_NAME --limit=5

Write-Host "`n=== End Diagnostics ===" -ForegroundColor Cyan
Write-Host "`nCommon fixes:" -ForegroundColor Green
Write-Host "- If 'Image not found': Run 'gcloud builds submit --tag gcr.io/emailwebsearch/emailwebsearch'" -ForegroundColor White
Write-Host "- If 'Container crashing': Check that env vars are set correctly" -ForegroundColor White
Write-Host "- If 'Permission denied': Run 'gcloud auth login' and try again" -ForegroundColor White
