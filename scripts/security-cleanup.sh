#!/bin/bash

# =============================================================================
# SECURITY CLEANUP SCRIPT - Remove Sensitive Files from Git History
# =============================================================================

echo "🚨 SECURITY CLEANUP: Removing sensitive files from Git history"
echo "⚠️  WARNING: This will rewrite Git history!"
echo ""

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "Installing git-filter-repo..."
    pip install git-filter-repo
fi

# Backup current repository
echo "📦 Creating backup..."
cp -r . ../T4G-Urban-Loyalty-Game-backup-$(date +%Y%m%d-%H%M%S)

# Remove sensitive files from entire Git history
echo "🧹 Removing sensitive files from Git history..."

# Remove certificate files
git-filter-repo --path certs/key.pem --invert-paths
git-filter-repo --path certs/cert.pem --invert-paths
git-filter-repo --path certs/ --invert-paths

# Remove any .env files that might contain secrets
git-filter-repo --path .env --invert-paths
git-filter-repo --path server/.env --invert-paths
git-filter-repo --path client/.env --invert-paths

# Remove any other potential secret files
git-filter-repo --path "*.key" --invert-paths
git-filter-repo --path "*.pem" --invert-paths
git-filter-repo --path "**/secrets/**" --invert-paths

echo "✅ Git history cleaned!"
echo ""
echo "⚠️  IMPORTANT: You must force-push to update remote repository:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "🔄 Consider these next steps:"
echo "1. Regenerate all certificates and keys"
echo "2. Rotate any API keys or secrets"
echo "3. Review all team members' local clones"
echo "4. Use AWS Certificate Manager for SSL in production"
