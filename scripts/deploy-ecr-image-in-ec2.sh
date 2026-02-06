#!/bin/bash

# Load .env variables
export $(grep -v '^#' .env | xargs)

# Generate a dynamic tag based on the current Git commit
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# --- Confirmation Prompt ---
echo "--------------------------------------------------------"
echo "READY TO DEPLOY ON EC2 (PRODUCTION)"
echo "Image Name: ${IMAGE_NAME}"
echo "Version:    ${APP_VERSION}"
echo "Region:     ${AWS_REGION}"
echo "Registry:   ${ECR_URI}"
echo "--------------------------------------------------------"

read -p "Do you want to proceed with the deployment? (y/N): " confirm

# Check if input is 'y' or 'Y'
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled by user."
    exit 1
fi

echo "🔐 Authenticating to AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}

echo "📥 Pulling versioned image: ${APP_VERSION}..."
# This uses the variables inside your compose.prod.yaml
docker compose --env-file .env -f containers/nextjs/docker-compose.prod.yml pull

echo "🚀 Restarting services..."
# --remove-orphans cleans up old containers from previous versions
docker compose --env-file .env -f containers/nextjs/docker-compose.prod.yml up -d --remove-orphans

echo "✅ Deployment complete! Running version: ${APP_VERSION}"