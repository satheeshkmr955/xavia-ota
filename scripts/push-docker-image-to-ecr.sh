#!/bin/bash

# Load .env variables
export $(grep -v '^#' .env | xargs)

# Generate a dynamic tag based on the current Git commit
GIT_HASH=$(git rev-parse --short HEAD)
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# --- Confirmation Prompt ---
echo "--------------------------------------------------------"
echo "READY TO PUSH TO AWS ECR"
echo "Image Name: ${IMAGE_NAME}"
echo "Version:    ${APP_VERSION}"
echo "Git Hash:   ${GIT_HASH}"
echo "Region:     ${AWS_REGION}"
echo "Registry:   ${ECR_URI}"
echo "--------------------------------------------------------"

read -p "Do you want to proceed with the push? (y/N): " confirm

# Check if input is 'y' or 'Y' (defaults to No if empty)
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled by user."
    exit 1
fi

echo "🔐 Authenticating to AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

echo "🏷️  Preparing ECR tags..."
# Tagging the local version for the remote repository
docker tag ${IMAGE_NAME}:${APP_VERSION} ${ECR_URI}/${IMAGE_NAME}:${APP_VERSION}
docker tag ${IMAGE_NAME}:${APP_VERSION} ${ECR_URI}/${IMAGE_NAME}:${GIT_HASH}

echo "📤 Pushing to ECR..."
docker push ${ECR_URI}/${IMAGE_NAME}:${APP_VERSION}
docker push ${ECR_URI}/${IMAGE_NAME}:${GIT_HASH}

echo "🚀 Push complete! Image URI: ${ECR_URI}/${IMAGE_NAME}:${APP_VERSION}"