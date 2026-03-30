@echo off
echo === EmailWebSearch Deployment ===
echo.

if not exist env.yaml (
    echo ERROR: env.yaml not found! Please create it with your secrets.
    exit /b 1
)

set PROJECT_ID=emailwebsearch
set SERVICE_NAME=emailwebsearch
set REGION=us-central1

echo [1/3] Authenticating with Google Cloud...
gcloud auth login
gcloud config set project %PROJECT_ID%

echo.
echo [2/3] Building container image...
gcloud builds submit --tag gcr.io/%PROJECT_ID%/%SERVICE_NAME% --project=%PROJECT_ID%
if errorlevel 1 (
    echo Build failed!
    exit /b 1
)

echo.
echo [3/3] Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image gcr.io/%PROJECT_ID%/%SERVICE_NAME% ^
    --project=%PROJECT_ID% ^
    --region=%REGION% ^
    --platform=managed ^
    --allow-unauthenticated ^
    --env-vars-file=env.yaml ^
    --memory=1Gi ^
    --cpu=1

if errorlevel 1 (
    echo Deployment failed!
    exit /b 1
)

echo.
echo === Deployment Complete! ===
for /f "tokens=*" %%a in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do echo Service URL: %%a
pause
