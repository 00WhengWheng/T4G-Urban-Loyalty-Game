#!/bin/bash

# =============================================================================
# AWS DEPLOYMENT SCRIPT FOR T4G URBAN LOYALTY GAME
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
AWS_REGION=${AWS_REGION:-eu-west-1}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}

if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: AWS_ACCOUNT_ID environment variable is required${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Starting AWS deployment for T4G Urban Loyalty Game${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"

# =============================================================================
# PREREQUISITES CHECK
# =============================================================================

echo -e "\n${YELLOW}📋 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform not found. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# =============================================================================
# ECR REPOSITORIES
# =============================================================================

echo -e "\n${YELLOW}🏗️ Setting up ECR repositories...${NC}"

# Create ECR repositories if they don't exist
for service in backend frontend; do
    REPO_NAME="t4g-${service}"
    
    if ! aws ecr describe-repositories --repository-names $REPO_NAME --region $AWS_REGION &> /dev/null; then
        echo -e "${BLUE}Creating ECR repository: ${REPO_NAME}${NC}"
        aws ecr create-repository \
            --repository-name $REPO_NAME \
            --region $AWS_REGION \
            --image-scanning-configuration scanOnPush=true \
            --tags Key=Project,Value=T4G-Urban-Loyalty-Game Key=Environment,Value=$ENVIRONMENT
    else
        echo -e "${GREEN}✅ ECR repository ${REPO_NAME} already exists${NC}"
    fi
done

# =============================================================================
# TERRAFORM DEPLOYMENT
# =============================================================================

echo -e "\n${YELLOW}🏗️ Deploying infrastructure with Terraform...${NC}"

cd infrastructure

# Initialize Terraform
echo -e "${BLUE}Initializing Terraform...${NC}"
terraform init

# Plan deployment
echo -e "${BLUE}Planning Terraform deployment...${NC}"
terraform plan -var-file="${ENVIRONMENT}.tfvars" -out=tfplan

# Apply deployment
echo -e "${BLUE}Applying Terraform deployment...${NC}"
terraform apply -auto-approve tfplan

# Get outputs
CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
LOAD_BALANCER_DNS=$(terraform output -raw load_balancer_dns)

echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
echo -e "${GREEN}ECS Cluster: ${CLUSTER_NAME}${NC}"
echo -e "${GREEN}Load Balancer: ${LOAD_BALANCER_DNS}${NC}"

cd ..

# =============================================================================
# BUILD AND PUSH DOCKER IMAGES
# =============================================================================

echo -e "\n${YELLOW}🐳 Building and pushing Docker images...${NC}"

# Login to ECR
echo -e "${BLUE}Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push images
for service in backend frontend; do
    echo -e "${BLUE}Building ${service} image...${NC}"
    
    cd $service
    
    # Build image
    IMAGE_TAG="${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"
    IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/t4g-${service}:${IMAGE_TAG}"
    LATEST_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/t4g-${service}:${ENVIRONMENT}-latest"
    
    docker build -f Dockerfile.prod -t $IMAGE_URI .
    docker tag $IMAGE_URI $LATEST_URI
    
    # Push image
    echo -e "${BLUE}Pushing ${service} image...${NC}"
    docker push $IMAGE_URI
    docker push $LATEST_URI
    
    echo -e "${GREEN}✅ ${service} image pushed successfully${NC}"
    
    cd ..
done

# =============================================================================
# UPDATE ECS SERVICES
# =============================================================================

echo -e "\n${YELLOW}🔄 Updating ECS services...${NC}"

for service in backend frontend; do
    SERVICE_NAME="t4g-${ENVIRONMENT}-${service}"
    
    echo -e "${BLUE}Updating ${service} service...${NC}"
    
    # Force new deployment
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_NAME \
        --force-new-deployment \
        --region $AWS_REGION
    
    echo -e "${BLUE}Waiting for ${service} service to stabilize...${NC}"
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_NAME \
        --region $AWS_REGION
    
    echo -e "${GREEN}✅ ${service} service updated successfully${NC}"
done

# =============================================================================
# HEALTH CHECK
# =============================================================================

echo -e "\n${YELLOW}🏥 Performing health checks...${NC}"

echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 60

# Check API health
echo -e "${BLUE}Checking API health...${NC}"
if curl -f "http://${LOAD_BALANCER_DNS}/api/health" &> /dev/null; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API health check failed${NC}"
    exit 1
fi

# Check frontend
echo -e "${BLUE}Checking frontend...${NC}"
if curl -f "http://${LOAD_BALANCER_DNS}/" &> /dev/null; then
    echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    exit 1
fi

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================

echo -e "\n${GREEN}🎉 AWS deployment completed successfully!${NC}"
echo -e "${GREEN}Application URL: http://${LOAD_BALANCER_DNS}${NC}"
echo -e "${GREEN}API URL: http://${LOAD_BALANCER_DNS}/api${NC}"
echo -e "\n${YELLOW}📋 Next steps:${NC}"
echo -e "${YELLOW}1. Set up custom domain and SSL certificate in ACM${NC}"
echo -e "${YELLOW}2. Update Route 53 DNS records${NC}"
echo -e "${YELLOW}3. Configure monitoring and alerting${NC}"
echo -e "${YELLOW}4. Set up automated backups${NC}"
