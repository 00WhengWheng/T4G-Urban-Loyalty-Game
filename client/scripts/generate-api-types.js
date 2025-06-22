// Frontend API client generator script
// Add to client/scripts/generate-api-types.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function generateApiTypes() {
  try {
    // Download OpenAPI spec from backend
    const response = await fetch('http://localhost:3001/api/docs-json');
    const spec = await response.json();
    
    // Save spec locally
    const specPath = path.join(__dirname, '../generated/openapi.json');
    fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
    
    // Generate TypeScript types
    execSync(`npx openapi-typescript ${specPath} --output ./src/types/api.ts`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    // Generate axios client
    execSync(`npx openapi-generator-cli generate -i ${specPath} -g typescript-axios -o ./src/services/generated`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('✅ API types and client generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate API types:', error);
  }
}

generateApiTypes();
