# AWS Deployment Guide

## 🚨 **IMMEDIATE SECURITY ACTIONS REQUIRED**

**⚠️ CRITICAL: You have exposed private keys in your Git repository!**

### 1. **Clean Git History First**
```bash
# Run the security cleanup script
chmod +x scripts/security-cleanup.sh
./scripts/security-cleanup.sh

# Force push to update remote repository
git push origin --force --all
git push origin --force --tags
```

### 2. **Regenerate All Certificates**
- Delete the exposed private key immediately
- Generate new SSL certificates
- Use AWS Certificate Manager for production

---

## 🏗️ **AWS Deployment Overview**

This guide will help you deploy your T4G Urban Loyalty Game to AWS using:
- **ECS Fargate** for container orchestration
- **RDS PostgreSQL** for database
- **ElastiCache Redis** for caching
- **Application Load Balancer** for traffic distribution
- **ECR** for container registry
- **Secrets Manager** for secure credential storage

## 📋 **Prerequisites**

### 1. **AWS Account Setup**
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Domain name (optional, for custom SSL)

### 2. **Required Tools**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Verify installations
aws --version
terraform --version
```

### 3. **AWS Configuration**
```bash
# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., eu-west-1)
# Enter default output format (json)

# Verify configuration
aws sts get-caller-identity
```

## 🚀 **Deployment Methods**

### Method 1: **Manual Deployment Script**

```bash
# Make script executable
chmod +x scripts/deploy-aws.sh

# Set your AWS Account ID
export AWS_ACCOUNT_ID=123456789012

# Deploy to staging
./scripts/deploy-aws.sh staging

# Deploy to production
./scripts/deploy-aws.sh production
```

### Method 2: **GitHub Actions (Recommended)**

1. **Set up GitHub Secrets:**
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_ACCOUNT_ID=123456789012
SLACK_WEBHOOK=your_slack_webhook_url
```

2. **Push to trigger deployment:**
```bash
# Staging deployment
git push origin develop

# Production deployment
git push origin main
```

### Method 3: **Manual Terraform**

```bash
cd infrastructure

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="staging.tfvars"

# Apply deployment
terraform apply -var-file="staging.tfvars"
```

## 🌐 **Domain and SSL Setup**

### 1. **Request SSL Certificate**
```bash
# Request certificate in AWS Certificate Manager
aws acm request-certificate \
    --domain-name yourdomain.com \
    --subject-alternative-names "*.yourdomain.com" \
    --validation-method DNS \
    --region eu-west-1
```

### 2. **Update Terraform Configuration**
```hcl
# In infrastructure/production.tfvars
certificate_arn = "arn:aws:acm:eu-west-1:123456789012:certificate/your-cert-id"
domain_name = "yourdomain.com"
```

### 3. **Configure Route 53 (Optional)**
```bash
# Create hosted zone
aws route53 create-hosted-zone \
    --name yourdomain.com \
    --caller-reference $(date +%s)

# Add A record pointing to load balancer
# (Use the load balancer DNS from Terraform outputs)
```

## 🔒 **Security Configuration**

### 1. **Secrets Management**
All sensitive data is stored in AWS Secrets Manager:
- Database passwords (auto-generated)
- JWT secrets (auto-generated)
- Application secrets

### 2. **Network Security**
- VPC with private/public subnets
- Security groups with minimal required access
- Database in private subnets only
- SSL/TLS encryption in transit and at rest

### 3. **IAM Policies**
- Least privilege access principles
- Separate roles for different services
- No hardcoded credentials

## 📊 **Monitoring and Logging**

### 1. **CloudWatch Integration**
- Container logs automatically sent to CloudWatch
- Metrics for CPU, memory, and network
- Alarms for high resource usage

### 2. **Health Checks**
- Load balancer health checks
- ECS service health monitoring
- Database monitoring

### 3. **Auto Scaling**
- CPU-based scaling (70% threshold)
- Memory-based scaling (80% threshold)
- Configurable min/max instances

## 💰 **Cost Optimization**

### Staging Environment:
- **ECS**: 1 instance, 512 CPU, 1GB RAM
- **RDS**: db.t3.micro, 20GB storage
- **ElastiCache**: cache.t3.micro, 1 node
- **Estimated monthly cost**: ~$30-50

### Production Environment:
- **ECS**: 2-10 instances, 1024 CPU, 2GB RAM
- **RDS**: db.t3.small, 100GB storage, Multi-AZ
- **ElastiCache**: cache.t3.micro, 2 nodes
- **Estimated monthly cost**: ~$100-300

## 🔧 **Troubleshooting**

### Common Issues:

#### 1. **ECS Service Won't Start**
```bash
# Check service events
aws ecs describe-services --cluster t4g-staging-cluster --services t4g-staging-backend

# Check task definition
aws ecs describe-task-definition --task-definition t4g-staging-backend

# Check logs
aws logs get-log-events --log-group-name /ecs/t4g-staging/app --log-stream-name backend/backend/task-id
```

#### 2. **Database Connection Issues**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxx

# Test database connectivity from ECS task
aws ecs execute-command --cluster t4g-staging-cluster --task task-id --command "/bin/sh" --interactive
```

#### 3. **Load Balancer Health Check Failures**
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Check application health endpoint
curl http://load-balancer-dns/api/health
```

## 🔄 **Rollback Procedures**

### 1. **ECS Service Rollback**
```bash
# List task definition revisions
aws ecs list-task-definitions --family-prefix t4g-staging-backend

# Rollback to previous revision
aws ecs update-service \
    --cluster t4g-staging-cluster \
    --service t4g-staging-backend \
    --task-definition t4g-staging-backend:PREVIOUS_REVISION
```

### 2. **Database Rollback**
```bash
# Restore from automated backup
aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier t4g-staging-postgres-restored \
    --db-snapshot-identifier t4g-staging-postgres-snapshot-date
```

### 3. **Infrastructure Rollback**
```bash
# Revert Terraform changes
cd infrastructure
git checkout previous-commit
terraform plan -var-file="staging.tfvars"
terraform apply -var-file="staging.tfvars"
```

## 📚 **Additional Resources**

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

## 🆘 **Support**

For deployment issues:
1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Contact the development team
4. Create an issue in the repository

---

**⚠️ Remember**: Always test deployments in staging before production!
