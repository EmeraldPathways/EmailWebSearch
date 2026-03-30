# Google Cloud Setup Script for EmailWebSearch
# Run this once to configure your project for automated deployment

# Configuration
$PROJECT_ID = "emailwebsearch"
$PROJECT_NUMBER = "732497578431"
$REGION = "us-central1"
$SERVICE_NAME = "emailwebsearch"

Write-Host "Setting up Google Cloud for EmailWebSearch deployment..." -ForegroundColor Green

# Login and set project
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable required APIs
Write-Host "Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable cloudbuild.googleapis.com run.googleapis.com secretmanager.googleapis.com iamcredentials.googleapis.com

# Create secrets in Secret Manager (you'll be prompted to enter these)
Write-Host "Creating secrets in Secret Manager..." -ForegroundColor Yellow
Write-Host "Enter your Apify API Token:"
$apifyToken = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apifyToken)
$plainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
echo $plainToken | gcloud secrets create apify-api-token --data-file=-

Write-Host "Enter your API Secret Key:"
$apiSecret = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiSecret)
$plainSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
echo $plainSecret | gcloud secrets create api-secret-key --data-file=-

# Create service account for GitHub Actions
Write-Host "Creating service account for GitHub Actions..." -ForegroundColor Yellow
gcloud iam service-accounts create github-deployer --display-name="GitHub Actions Deployer"

# Grant permissions to service account
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-deployer@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-deployer@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:github-deployer@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"

# Grant Cloud Build service account permissions
gcloud projects add-iam-policy-binding $PROJECT_ID `
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" `
  --role="roles/run.admin"

# Create Workload Identity Pool for GitHub Actions
Write-Host "Setting up Workload Identity Federation..." -ForegroundColor Yellow
gcloud iam workload-identity-pools create github-pool --location="global" --display-name="GitHub Actions Pool"

# Create provider
gcloud iam workload-identity-pools providers create-oidc github-provider `
  --location="global" `
  --workload-identity-pool="github-pool" `
  --display-name="GitHub Provider" `
  --issuer-uri="https://token.actions.githubusercontent.com" `
  --allowed-audiences="https://github.com/EmeraldPathways" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"

# Allow GitHub repo to impersonate service account
$REPO = "EmeraldPathways/EmailWebSearch"
gcloud iam service-accounts add-iam-policy-binding `
  "github-deployer@$PROJECT_ID.iam.gserviceaccount.com" `
  --role="roles/iam.workloadIdentityUser" `
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$REPO"

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Now push to GitHub and the deployment will happen automatically." -ForegroundColor Cyan
