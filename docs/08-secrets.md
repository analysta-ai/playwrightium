# Environment Variables & Secrets Management

Playwrighium provides secure, flexible environment variable management for all your automation needs. Use the `${{VARIABLE_NAME}}` syntax to inject secrets into shortcuts, scripts, and custom actions.

## 🔐 Security First

**Golden Rules:**
- ✅ Store secrets in `.env` files (never commit)
- ✅ Use `${{VARIABLE_NAME}}` syntax for interpolation
- ✅ Keep production and development secrets separate
- ✅ Rotate secrets regularly
- ❌ Never hardcode credentials in code
- ❌ Never commit `.env` files to version control

## 📁 Setup

### 1. Create Environment File

Create `.env` at your repository root:

```bash
# .env (at repository root)
# Development Environment
DEV_URL=http://localhost:3000
DEV_EMAIL=dev@example.com
DEV_PASSWORD=dev-password

# Staging Environment
STAGING_URL=https://staging.myapp.com
STAGING_EMAIL=test@staging.com
STAGING_PASSWORD=staging-secure-password

# Production Environment (use with caution!)
PROD_URL=https://myapp.com
PROD_EMAIL=prod@myapp.com
PROD_PASSWORD=ultra-secure-production-password

# API Credentials
API_KEY=your-api-key-here
API_SECRET=your-api-secret-here
GITHUB_TOKEN=ghp_your-github-token

# Database (for scripts that need DB access)
DB_HOST=localhost
DB_USER=myapp_user
DB_PASSWORD=db-password
DB_NAME=myapp_dev

# Third-party Services
STRIPE_API_KEY=sk_test_...
SENDGRID_API_KEY=SG....
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### 2. Add to .gitignore

Ensure `.env` is ignored (should already be included):

```bash
# .gitignore
.env
.env.local
.env.*.local
```

### 3. Create Template (Optional)

Create `.env.example` for team sharing:

```bash
# .env.example
# Copy to .env and fill in your values

# Development
DEV_URL=http://localhost:3000
DEV_EMAIL=your-dev-email@example.com
DEV_PASSWORD=your-dev-password

# Staging
STAGING_URL=https://staging.yourapp.com
STAGING_EMAIL=your-staging-email@example.com
STAGING_PASSWORD=your-staging-password

# API Keys
API_KEY=your-api-key
GITHUB_TOKEN=your-github-token
```

## 🎯 Usage in Shortcuts

Use `${{VARIABLE_NAME}}` syntax anywhere in your YAML files:

### Basic Login Flow

```yaml
# .playwright-mcp/shortcuts/login-staging.yaml
commands:
  - type: navigate
    url: ${{STAGING_URL}}
    description: "Navigate to ${{STAGING_URL}}"

  - type: fill
    selector: "#email"
    value: ${{STAGING_EMAIL}}
    description: "Enter staging email"

  - type: fill
    selector: "#password"
    value: ${{STAGING_PASSWORD}}
    description: "Enter staging password"

  - type: click
    selector: 'button[type="submit"]'
    description: "Submit login form"

  - type: wait_for_text
    text: "Welcome"
    description: "Wait for successful login"
```

### Multi-Environment Support

```yaml
# .playwright-mcp/shortcuts/health-check.yaml
commands:
  # Check development
  - type: navigate
    url: ${{DEV_URL}}/health
    description: "Check dev health endpoint"

  - type: screenshot
    path: "health-dev.png"
    description: "Capture dev health status"

  # Check staging
  - type: navigate
    url: ${{STAGING_URL}}/health
    description: "Check staging health endpoint"

  - type: screenshot
    path: "health-staging.png"
    description: "Capture staging health status"

  # Check production (if available)
  - type: navigate
    url: ${{PROD_URL}}/health
    description: "Check production health endpoint"

  - type: screenshot
    path: "health-prod.png"
    description: "Capture production health status"
```

### Complex URLs and Values

```yaml
# Variables can be used in complex expressions
commands:
  - type: navigate
    url: "${{API_URL}}/users/${{USER_ID}}/profile"
    description: "Navigate to user profile API"

  - type: fill
    selector: "#api-key"
    value: "Bearer ${{API_TOKEN}}"
    description: "Enter API authorization token"

  - type: evaluate
    script: "localStorage.setItem('authToken', '${{JWT_TOKEN}}')"
    description: "Set authentication token in localStorage"
```

## 🚀 Usage in Scripts

Scripts receive environment variables through the context:

### Direct Access

```typescript
// .playwright-mcp/scripts/api-integration.ts
export default async function({ page, env, logger }) {
  // Direct access to environment variables
  const apiUrl = env.API_URL;
  const apiKey = env.API_KEY;
  const environment = env.NODE_ENV || 'development';

  // Check required variables
  if (!apiKey) {
    throw new Error('API_KEY environment variable is required');
  }

  logger(`Connecting to ${apiUrl} in ${environment} mode`);

  // Use environment-specific settings
  const timeout = environment === 'production' ? 30000 : 10000;

  await page.goto(apiUrl, { timeout });

  return {
    success: true,
    environment,
    apiUrl
  };
}
```

### Secret Interpolation Function

```typescript
// .playwright-mcp/scripts/dynamic-config.ts
export default async function({ page, env, interpolateSecrets, logger }) {
  // Use interpolateSecrets for dynamic string construction
  const dynamicUrl = interpolateSecrets('${{API_URL}}/users/${{USER_ID}}/dashboard');
  const authHeader = interpolateSecrets('Bearer ${{API_TOKEN}}');

  logger(`Navigating to: ${dynamicUrl}`);

  // Set custom headers with secrets
  await page.setExtraHTTPHeaders({
    'Authorization': authHeader,
    'X-API-Key': env.API_KEY
  });

  await page.goto(dynamicUrl);

  return {
    success: true,
    url: dynamicUrl
  };
}
```

### Environment-Specific Configuration

```typescript
// .playwright-mcp/scripts/environment-aware.ts
interface EnvironmentConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headless: boolean;
}

export default async function({ page, env, logger }) {
  const environment = env.NODE_ENV || 'development';

  // Environment-specific configuration
  const configs: Record<string, EnvironmentConfig> = {
    development: {
      baseUrl: env.DEV_URL || 'http://localhost:3000',
      timeout: 5000,
      retries: 1,
      headless: false
    },
    staging: {
      baseUrl: env.STAGING_URL,
      timeout: 10000,
      retries: 2,
      headless: true
    },
    production: {
      baseUrl: env.PROD_URL,
      timeout: 15000,
      retries: 3,
      headless: true
    }
  };

  const config = configs[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  logger(`Running in ${environment} with config:`, config);

  // Use config for operations
  await page.goto(config.baseUrl, { timeout: config.timeout });

  return {
    success: true,
    environment,
    config
  };
}
```

## 🎨 Usage in Custom Actions

Custom actions also receive environment context:

### Environment-Aware Action

```typescript
// .playwright-mcp/actions/deploy-to-environment.ts
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const action: PlaywrightActionDefinition = {
  name: 'deploy-to-environment',
  description: 'Deploy application to specified environment',

  inputSchema: z.object({
    environment: z.enum(['staging', 'production']).describe('Target environment'),
    version: z.string().describe('Application version to deploy'),
    waitForHealth: z.boolean().default(true).describe('Wait for health check')
  }),

  async run({ page, input, logger, env, interpolateSecrets }) {
    const { environment, version, waitForHealth } = input;

    // Get environment-specific configuration
    const deployUrl = env[`${environment.toUpperCase()}_DEPLOY_URL`];
    const apiKey = env[`${environment.toUpperCase()}_API_KEY`];
    const healthUrl = env[`${environment.toUpperCase()}_URL`];

    if (!deployUrl || !apiKey) {
      throw new Error(`Missing configuration for ${environment} environment`);
    }

    await logger(`Deploying version ${version} to ${environment}`);

    // Navigate to deployment interface
    await page.goto(deployUrl);

    // Authenticate
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${apiKey}`
    });

    // Fill deployment form
    await page.fill('#version', version);
    await page.selectOption('#environment', environment);
    await page.click('#deploy-btn');

    // Wait for deployment
    await page.waitForText('Deployment successful', { timeout: 300000 });

    if (waitForHealth && healthUrl) {
      await logger('Checking health endpoint...');

      // Wait a bit for services to start
      await page.waitForTimeout(30000);

      // Check health
      await page.goto(`${healthUrl}/health`);
      const healthStatus = await page.textContent('.health-status');

      if (!healthStatus?.includes('healthy')) {
        throw new Error(`Health check failed: ${healthStatus}`);
      }
    }

    await logger(`✅ Successfully deployed ${version} to ${environment}`);

    return {
      message: `Deployed ${version} to ${environment}`,
      structuredContent: {
        environment,
        version,
        deployUrl,
        healthStatus: waitForHealth ? 'healthy' : 'not-checked',
        timestamp: new Date().toISOString()
      }
    };
  }
};

export default action;
```

### Database Integration

```typescript
// .playwright-mcp/actions/sync-user-data.ts
import { z } from 'zod';
import mysql from 'mysql2/promise';
import type { PlaywrightActionDefinition } from '../action-types';

const action: PlaywrightActionDefinition = {
  name: 'sync-user-data',
  description: 'Sync user data between database and web interface',

  inputSchema: z.object({
    operation: z.enum(['db-to-web', 'web-to-db']).describe('Sync direction'),
    limit: z.number().optional().describe('Maximum records to sync')
  }),

  async run({ page, input, logger, env }) {
    // Database connection from environment
    const dbConfig = {
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME
    };

    const webUrl = env.ADMIN_URL;
    const adminUser = env.ADMIN_USERNAME;
    const adminPass = env.ADMIN_PASSWORD;

    // Validate required environment variables
    const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'ADMIN_URL'];
    for (const key of required) {
      if (!env[key]) {
        throw new Error(`${key} environment variable is required`);
      }
    }

    await logger(`Starting ${input.operation} sync`);

    // Connect to database
    const connection = await mysql.createConnection(dbConfig);

    try {
      if (input.operation === 'db-to-web') {
        // Fetch users from database
        const [rows] = await connection.execute(
          'SELECT id, name, email, status FROM users LIMIT ?',
          [input.limit || 100]
        );

        const users = rows as any[];
        await logger(`Found ${users.length} users in database`);

        // Login to web admin
        await page.goto(`${webUrl}/login`);
        await page.fill('#username', adminUser);
        await page.fill('#password', adminPass);
        await page.click('button[type="submit"]');
        await page.waitForSelector('.admin-dashboard');

        // Sync each user
        let syncedCount = 0;
        for (const user of users) {
          try {
            await page.goto(`${webUrl}/admin/users/import`);
            await page.fill('#user-id', user.id.toString());
            await page.fill('#name', user.name);
            await page.fill('#email', user.email);
            await page.selectOption('#status', user.status);
            await page.click('#import-user');
            await page.waitForSelector('.success-message');

            syncedCount++;
            await logger(`Synced user: ${user.name}`);

          } catch (error) {
            await logger(`Failed to sync user ${user.name}: ${error.message}`);
          }
        }

        return {
          message: `Synced ${syncedCount}/${users.length} users from database to web`,
          structuredContent: {
            operation: input.operation,
            totalUsers: users.length,
            syncedUsers: syncedCount,
            failedUsers: users.length - syncedCount
          }
        };
      }

      // web-to-db sync would be implemented here...
      throw new Error('web-to-db sync not implemented yet');

    } finally {
      await connection.end();
    }
  }
};

export default action;
```

## 🔄 Multiple Environment Patterns

### Environment-Specific .env Files

```bash
# .env.development
NODE_ENV=development
APP_URL=http://localhost:3000
API_URL=http://localhost:8000
DB_HOST=localhost

# .env.staging
NODE_ENV=staging
APP_URL=https://staging.myapp.com
API_URL=https://api-staging.myapp.com
DB_HOST=staging-db.myapp.com

# .env.production
NODE_ENV=production
APP_URL=https://myapp.com
API_URL=https://api.myapp.com
DB_HOST=prod-db.myapp.com
```

Load specific environment:
```bash
# Use staging environment
cp .env.staging .env
npm run dev

# Or use environment variable
NODE_ENV=staging npm run dev
```

### Role-Based Credentials

```bash
# Different user roles
ADMIN_USERNAME=admin@myapp.com
ADMIN_PASSWORD=admin-password

USER_USERNAME=user@myapp.com
USER_PASSWORD=user-password

VIEWER_USERNAME=viewer@myapp.com
VIEWER_PASSWORD=viewer-password

# Different permission levels
READ_ONLY_API_KEY=readonly-key
WRITE_API_KEY=write-key
ADMIN_API_KEY=admin-key
```

### Service-Specific Variables

```bash
# Group by service
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@myapp.com
SENDGRID_TEMPLATE_ID=d-...

AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=myapp-uploads
```

## 🛡️ Security Best Practices

### 1. **Never Commit Secrets**

```bash
# Always check before committing
git status

# Make sure .env is in .gitignore
echo ".env" >> .gitignore

# Use git hooks to prevent accidental commits
# .git/hooks/pre-commit
#!/bin/sh
if grep -r "password\|secret\|key" --include="*.js" --include="*.ts" --include="*.yaml" .; then
  echo "WARNING: Potential secrets found in code"
  exit 1
fi
```

### 2. **Use Different Keys Per Environment**

```bash
# ✅ Good - separate keys
DEV_API_KEY=dev-key
STAGING_API_KEY=staging-key
PROD_API_KEY=prod-key

# ❌ Bad - same key everywhere
API_KEY=same-key-for-all-environments
```

### 3. **Rotate Secrets Regularly**

```bash
# Add creation dates to track age
API_KEY=your-key-here  # Created: 2024-01-15
DB_PASSWORD=your-pass  # Created: 2024-01-15

# Set calendar reminders to rotate quarterly
```

### 4. **Validate Environment Variables**

```typescript
// Validate required variables on startup
export default async function({ env, logger }) {
  const required = ['API_KEY', 'DB_PASSWORD', 'APP_URL'];
  const missing = required.filter(key => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  logger('✅ All required environment variables present');
}
```

### 5. **Use Principle of Least Privilege**

```bash
# Create specific users with minimal permissions
DB_READ_USER=readonly_user
DB_READ_PASSWORD=readonly_pass

DB_WRITE_USER=readwrite_user
DB_WRITE_PASSWORD=readwrite_pass

# Use read-only for reports, write access only when needed
```

## 🔧 Troubleshooting

### Common Issues

**1. Variable Not Found Error**
```
Error: Environment variable "API_KEY" is not defined
```

**Solution:**
```bash
# Check .env file exists and contains the variable
cat .env | grep API_KEY

# Check spelling and case sensitivity
API_KEY=value  # ✅ Correct
api_key=value  # ❌ Wrong case
```

**2. Variable Not Interpolating**
```yaml
# ❌ This won't work
url: ${API_URL}

# ✅ Correct syntax
url: ${{API_URL}}
```

**3. Spaces in Variable Names**
```bash
# ❌ Invalid
MY VAR=value

# ✅ Valid
MY_VAR=value
```

**4. Quotes and Special Characters**
```bash
# ✅ For values with spaces or special characters
PASSWORD="my complex password!"
API_URL="https://api.example.com/v1"

# ✅ For simple values, quotes optional
NODE_ENV=production
PORT=3000
```

### Debug Environment Variables

```typescript
// .playwright-mcp/scripts/debug-env.ts
export default async function({ env, logger }) {
  logger('Environment Variables:');

  // List all environment variables (be careful not to log secrets!)
  const safeVars = Object.keys(env)
    .filter(key => !key.includes('PASSWORD') && !key.includes('SECRET') && !key.includes('KEY'))
    .reduce((obj, key) => {
      obj[key] = env[key];
      return obj;
    }, {});

  logger(JSON.stringify(safeVars, null, 2));

  // Check specific variables (without revealing values)
  const requiredVars = ['API_URL', 'APP_URL', 'NODE_ENV'];
  for (const varName of requiredVars) {
    const exists = !!env[varName];
    const value = exists ? `${env[varName]?.substring(0, 10)}...` : 'undefined';
    logger(`${varName}: ${exists ? '✅' : '❌'} ${value}`);
  }

  return { success: true };
}
```

## 🚀 Next Steps

- **[Quick Start](./02-quick-start.md)** - Set up your first environment variables
- **[Shortcuts](./05-shortcuts.md)** - Use variables in YAML workflows
- **[Scripts](./06-scripts.md)** - Access environment in TypeScript
- **[Custom Actions](./04-custom-actions.md)** - Build environment-aware tools

Environment variables are the foundation of secure, flexible automation. Start with simple variables and build up to complex, multi-environment configurations! 🔐