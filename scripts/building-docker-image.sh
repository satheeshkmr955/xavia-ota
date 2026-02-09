#!/bin/bash
# Load .env variables
export $(grep -v '^#' .env | xargs)

echo "----------------------------------------"
echo "PRE-BUILD SUMMARY"
echo "Image Name:  ${IMAGE_NAME}"
echo "Version:     ${APP_VERSION}"
echo "----------------------------------------"

# Confirmation Prompt
read -p "Do you want to proceed with the build? (y/N): " confirm

# Convert input to lowercase and check
if [[ "${confirm,,}" != "y" ]]; then
    echo "❌ Build cancelled by user."
    exit 1
fi

echo "🛠️  Building ${IMAGE_NAME} version ${APP_VERSION}..."

# Build and tag with the version from .env
docker compose --env-file .env -f containers/nextjs/docker-compose.build.yml build

echo "✅ Build complete. You can now test locally with: docker run ${IMAGE_NAME}:${APP_VERSION}"
docker images -a ${IMAGE_NAME}