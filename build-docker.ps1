# Chili Cookoff Voting - Docker Build & Deploy Script (PowerShell)
# This script builds the Docker image and pushes it to Docker Hub

param(
    [string]$DockerUsername = "sadeghhajiazimi641",  # Replace with your Docker Hub username
    [string]$ImageName = "chili-voting-app",
    [string]$Version = "latest"
)

Write-Host "Building Chili Cookoff Voting App Docker Image" -ForegroundColor Red
Write-Host "==================================================" -ForegroundColor Yellow

try {
    # Build the Docker image
    Write-Host "Building Docker image..." -ForegroundColor Green
    $dateTag = Get-Date -Format "yyyyMMdd"
    
    docker build -t "${DockerUsername}/${ImageName}:${Version}" .
    docker build -t "${DockerUsername}/${ImageName}:${dateTag}" .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Image built successfully!" -ForegroundColor Green
    } else {
        throw "Docker build failed"
    }

    # Push to Docker Hub
    Write-Host "Pushing to Docker Hub..." -ForegroundColor Green
    docker push "${DockerUsername}/${ImageName}:${Version}"
    docker push "${DockerUsername}/${ImageName}:${dateTag}"
    Write-Host "Image pushed to Docker Hub!" -ForegroundColor Green

    Write-Host ""
    Write-Host "Build complete!" -ForegroundColor Green
    Write-Host "Image: ${DockerUsername}/${ImageName}:${Version}" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To test locally:" -ForegroundColor Yellow
    Write-Host "docker run -p 3000:3000 -v `"`$(pwd)/data:/app/data`" ${DockerUsername}/${ImageName}:${Version}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Ready for Unraid deployment!" -ForegroundColor Green

} catch {
    Write-Host "Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}