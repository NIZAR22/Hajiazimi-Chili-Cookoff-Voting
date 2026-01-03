#!/bin/bash

# Chili Cookoff Voting - Docker Build & Deploy Script
# This script builds the Docker image and pushes it to Docker Hub

set -e

# Configuration
IMAGE_NAME="chili-voting-app"
DOCKER_USERNAME="sadeghhajiazimi641"  # Replace with your Docker Hub username
VERSION="latest"

echo "Building Chili Cookoff Voting App Docker Image"
echo "=================================================="

# Build the Docker image
echo "Building Docker image..."
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$VERSION .
docker build -t $DOCKER_USERNAME/$IMAGE_NAME:$(date +%Y%m%d) .

echo "✅ Image built successfully!"

# Push to Docker Hub (optional - uncomment to enable)
# echo "Pushing to Docker Hub..."
# docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION
# docker push $DOCKER_USERNAME/$IMAGE_NAME:$(date +%Y%m%d)
# echo "✅ Image pushed to Docker Hub!"

echo ""
echo "Build complete!"
echo "Image: $DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
echo ""
echo "To test locally:"
echo "docker run -p 3005:3005 -v \$(pwd)/data:/app/data $DOCKER_USERNAME/$IMAGE_NAME:$VERSION"
echo ""
echo "Ready for Unraid deployment!"