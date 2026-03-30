# Automated Deployment Script for EmailWebSearch
# Usage: .\deploy-auto.ps1
# Requires: env.yaml file with secrets (not committed to GitHub)

param(
    [switch]$SetupOnly
)

$PROJECT_ID = "emailwebsearch"
$SERVICE_NAME = "emailwebsearch"
$REGION = "us-central1"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) { Write-Output $args }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Load env vars from env.yaml
if (-not (Test-Path "env.yaml")) {
    Write-ColorOutput Red "env.yaml not found! Please create it with your secrets."
    exit 1
}

Write-ColorOutput Green "=== EmailWebSearch Automated Deployment ==="

# Step 1: Check Authentication
Write-ColorOutput Yellow "`n[1/4] Checking Google Cloud authentication..."
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($authStatus)) {
    Write-ColorOutput Red "Not authenticated. Opening browser for login..."
    gcloud auth login
}
gcloud config set project $PROJECT_ID
Write-ColorOutput Green "Authenticated!"

# Step 2: Enable APIs
Write-ColorOutput Yellow "`n[2/4] Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com run.googleapis.com

if ($SetupOnly) {
    Write-ColorOutput Green "`nSetup complete!"
    exit 0
}

# Step 3: Build Container
Write-ColorOutput Yellow "`n[3/4] Building container image..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME --project=$PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Build failed!"
    exit 1
}

# Step 4: Deploy to Cloud Run
Write-ColorOutput Yellow "`n[4/4] Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
    --project=$PROJECT_ID `
    --region=$REGION `
    --platform=managed `
    --allow-unauthenticated `
    --env-vars-file=env.yaml `
    --memory=1Gi `
    --cpu=1

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "Deployment failed!"
    exit 1
}

$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
Write-ColorOutput Green "`n=== Deployment Complete! ==="
Write-ColorOutput Cyan "Service URL: $SERVICE_URL"
