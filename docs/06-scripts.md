# Scripts - Advanced TypeScript/JavaScript Automation

Scripts provide the full power of TypeScript/JavaScript for complex automation logic. Unlike shortcuts, scripts can include loops, conditions, data processing, and API calls.

## 🎯 What are Scripts?

Scripts are:
- **TypeScript/JavaScript files** with full programming capabilities
- **Flexible** - loops, conditions, variables, functions
- **Powerful** - data processing, API integration, file operations
- **Context-aware** - receive browser objects and environment
- **Executable** - run via the built-in `execute-script` action

Perfect for: data extraction, complex workflows, conditional logic, API integrations, file processing.

## 📁 File Structure

Create scripts in `.playwright-mcp/scripts/`:

```
.playwright-mcp/
└── scripts/
    ├── extract-user-data.ts
    ├── process-orders.js
    ├── health-check.ts
    └── cleanup-temp-files.ts
```

Scripts are executed using the built-in `execute-script` action:

```json
{
  "scriptPath": "extract-user-data.ts",
  "scriptArgs": {
    "exportFormat": "csv",
    "limit": 100
  }
}
```

## 📝 Basic Structure

### TypeScript Script Template

```typescript
// .playwright-mcp/scripts/my-script.ts
import type { Page, BrowserContext, Browser } from 'playwright';

interface ScriptContext {
  page: Page;
  context: BrowserContext;
  browser: Browser;
  args: Record<string, any>;
  logger: (message: string) => void;
  env: Record<string, string | undefined>;
  interpolateSecrets: (text: string) => string;
  playwright: typeof import('playwright');
}

export default async function({ page, args, logger, env }: ScriptContext) {
  logger('Script starting...');

  // Your automation logic here
  await page.goto('https://example.com');

  const title = await page.title();
  logger(`Page title: ${title}`);

  // Return results
  return {
    success: true,
    title,
    timestamp: new Date().toISOString()
  };
}
```

### JavaScript Script Template

```javascript
// .playwright-mcp/scripts/my-script.js
module.exports = async function({ page, args, logger, env }) {
  logger('JavaScript script starting...');

  await page.goto('https://example.com');

  const data = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      links: Array.from(document.querySelectorAll('a')).length
    };
  });

  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
};
```

## 🛠️ Script Context

Scripts receive a rich context object with everything needed for automation:

### Browser Objects
```typescript
const { page, context, browser } = scriptContext;

// page: Main Playwright page instance
await page.goto('https://example.com');
await page.click('#button');

// context: Browser context (isolated session)
const newPage = await context.newPage();
await context.clearCookies();

// browser: Browser instance
const contexts = browser.contexts();
const version = await browser.version();
```

### Script Arguments
```typescript
const { args } = scriptContext;

// Arguments passed from MCP client
const format = args.exportFormat || 'json';  // Default to 'json'
const limit = args.limit || 50;              // Default to 50
const filters = args.filters || {};          // Default to empty object
```

### Utilities
```typescript
const { logger, env, interpolateSecrets } = scriptContext;

// Logging with different levels
logger('Starting data extraction');
logger('Warning: rate limit approaching');

// Environment variables
const apiKey = env.API_KEY;
const baseUrl = env.BASE_URL || 'https://localhost:3000';

// Secret interpolation
const endpoint = interpolateSecrets('${{API_URL}}/users/${{USER_ID}}');
```

### Playwright API
```typescript
const { playwright } = scriptContext;

// Access full Playwright API
const chromium = playwright.chromium;
const devices = playwright.devices;
```

## 🎨 Real-World Examples

### 1. Data Extraction Script

```typescript
// .playwright-mcp/scripts/extract-product-data.ts
import * as fs from 'fs/promises';
import * as path from 'path';

interface ProductData {
  name: string;
  price: string;
  rating: number;
  availability: string;
  imageUrl: string;
  productUrl: string;
}

export default async function({ page, args, logger, env }) {
  const category = args.category || 'electronics';
  const maxPages = args.maxPages || 5;
  const outputFormat = args.outputFormat || 'json';

  logger(`Starting product extraction for category: ${category}`);

  const baseUrl = env.SHOP_URL || 'https://example-shop.com';
  const allProducts: ProductData[] = [];

  // Navigate to category page
  await page.goto(`${baseUrl}/category/${category}`);
  await page.waitForSelector('.product-grid');

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    logger(`Processing page ${pageNum}/${maxPages}`);

    // Extract products from current page
    const products = await page.evaluate(() => {
      const productElements = document.querySelectorAll('.product-item');

      return Array.from(productElements).map(element => {
        const nameEl = element.querySelector('.product-name');
        const priceEl = element.querySelector('.product-price');
        const ratingEl = element.querySelector('.product-rating');
        const availabilityEl = element.querySelector('.availability');
        const imageEl = element.querySelector('.product-image img');
        const linkEl = element.querySelector('.product-link');

        return {
          name: nameEl?.textContent?.trim() || '',
          price: priceEl?.textContent?.trim() || '',
          rating: parseFloat(ratingEl?.textContent?.trim() || '0'),
          availability: availabilityEl?.textContent?.trim() || '',
          imageUrl: imageEl?.getAttribute('src') || '',
          productUrl: linkEl?.getAttribute('href') || ''
        };
      });
    });

    allProducts.push(...products);
    logger(`Found ${products.length} products on page ${pageNum}`);

    // Navigate to next page if exists
    if (pageNum < maxPages) {
      const nextButton = page.locator('.pagination .next');
      if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForSelector('.product-grid');
        await page.waitForTimeout(2000); // Rate limiting
      } else {
        logger('No more pages available');
        break;
      }
    }
  }

  // Export data
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `products-${category}-${timestamp}.${outputFormat}`;

  if (outputFormat === 'csv') {
    const csvHeaders = 'Name,Price,Rating,Availability,Image URL,Product URL';
    const csvRows = allProducts.map(p =>
      `"${p.name}","${p.price}",${p.rating},"${p.availability}","${p.imageUrl}","${p.productUrl}"`
    );
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    await fs.writeFile(filename, csvContent);
  } else {
    await fs.writeFile(filename, JSON.stringify(allProducts, null, 2));
  }

  logger(`✅ Extracted ${allProducts.length} products to ${filename}`);

  return {
    success: true,
    productCount: allProducts.length,
    filename,
    category,
    pagesProcessed: pageNum,
    products: allProducts.slice(0, 3) // Return first 3 as preview
  };
}
```

### 2. Health Check Script

```typescript
// .playwright-mcp/scripts/health-check.ts
interface HealthCheckResult {
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'timeout';
  responseTime: number;
  error?: string;
}

export default async function({ page, args, logger, env }) {
  const endpoints = args.endpoints || [
    '/health',
    '/api/status',
    '/login',
    '/dashboard'
  ];

  const baseUrl = env.APP_URL || 'https://localhost:3000';
  const timeout = args.timeout || 30000;

  logger(`Starting health check for ${endpoints.length} endpoints`);

  const results: HealthCheckResult[] = [];

  for (const endpoint of endpoints) {
    const fullUrl = `${baseUrl}${endpoint}`;
    logger(`Checking: ${fullUrl}`);

    const startTime = Date.now();

    try {
      const response = await page.goto(fullUrl, {
        waitUntil: 'domcontentloaded',
        timeout
      });

      const responseTime = Date.now() - startTime;
      const status = response?.status();

      if (status && status >= 200 && status < 400) {
        results.push({
          endpoint: fullUrl,
          status: 'healthy',
          responseTime
        });
        logger(`✅ ${endpoint}: ${status} (${responseTime}ms)`);
      } else {
        results.push({
          endpoint: fullUrl,
          status: 'unhealthy',
          responseTime,
          error: `HTTP ${status}`
        });
        logger(`❌ ${endpoint}: HTTP ${status} (${responseTime}ms)`);
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        endpoint: fullUrl,
        status: responseTime > timeout ? 'timeout' : 'unhealthy',
        responseTime,
        error: error.message
      });
      logger(`❌ ${endpoint}: ${error.message} (${responseTime}ms)`);
    }

    // Rate limiting between requests
    await page.waitForTimeout(1000);
  }

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const overallStatus = healthyCount === results.length ? 'healthy' : 'degraded';

  logger(`Health check complete: ${healthyCount}/${results.length} endpoints healthy`);

  return {
    success: true,
    overallStatus,
    totalEndpoints: results.length,
    healthyEndpoints: healthyCount,
    results,
    timestamp: new Date().toISOString()
  };
}
```

### 3. User Account Management

```typescript
// .playwright-mcp/scripts/manage-test-users.ts
interface TestUser {
  username: string;
  email: string;
  role: string;
  status: 'created' | 'exists' | 'error';
}

export default async function({ page, args, logger, env }) {
  const action = args.action || 'create'; // create, delete, list
  const users = args.users || [
    { username: 'testuser1', email: 'test1@example.com', role: 'user' },
    { username: 'testuser2', email: 'test2@example.com', role: 'admin' }
  ];

  const adminUrl = env.ADMIN_URL || 'https://admin.example.com';

  logger(`Starting user management: ${action}`);

  // Login to admin panel
  await page.goto(`${adminUrl}/login`);
  await page.fill('#username', env.ADMIN_USERNAME);
  await page.fill('#password', env.ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.admin-dashboard');

  const results: TestUser[] = [];

  if (action === 'create') {
    for (const user of users) {
      logger(`Creating user: ${user.username}`);

      try {
        // Navigate to user creation
        await page.goto(`${adminUrl}/users/new`);
        await page.waitForSelector('#user-form');

        // Check if user already exists
        await page.fill('#username', user.username);
        await page.blur('#username'); // Trigger validation
        await page.waitForTimeout(500);

        const errorElement = page.locator('.username-error');
        if (await errorElement.count() > 0) {
          results.push({
            ...user,
            status: 'exists'
          });
          logger(`⚠️  User ${user.username} already exists`);
          continue;
        }

        // Fill user form
        await page.fill('#email', user.email);
        await page.selectOption('#role', user.role);
        await page.fill('#password', 'TempPassword123!');

        // Submit form
        await page.click('#create-user');
        await page.waitForSelector('.success-message');

        results.push({
          ...user,
          status: 'created'
        });
        logger(`✅ Created user: ${user.username}`);

      } catch (error) {
        results.push({
          ...user,
          status: 'error'
        });
        logger(`❌ Error creating ${user.username}: ${error.message}`);
      }
    }
  }

  else if (action === 'delete') {
    for (const user of users) {
      logger(`Deleting user: ${user.username}`);

      try {
        // Search for user
        await page.goto(`${adminUrl}/users`);
        await page.fill('#user-search', user.username);
        await page.click('#search-btn');
        await page.waitForSelector('.user-results');

        // Find and delete user
        const userRow = page.locator(`tr:has-text("${user.username}")`);
        if (await userRow.count() === 0) {
          results.push({
            ...user,
            status: 'error'
          });
          logger(`⚠️  User ${user.username} not found`);
          continue;
        }

        await userRow.locator('.delete-btn').click();
        await page.click('.confirm-delete');
        await page.waitForSelector('.success-message');

        results.push({
          ...user,
          status: 'created' // Reusing status field
        });
        logger(`✅ Deleted user: ${user.username}`);

      } catch (error) {
        results.push({
          ...user,
          status: 'error'
        });
        logger(`❌ Error deleting ${user.username}: ${error.message}`);
      }
    }
  }

  else if (action === 'list') {
    logger('Listing all test users');

    await page.goto(`${adminUrl}/users`);
    await page.fill('#user-search', 'test');
    await page.click('#search-btn');
    await page.waitForSelector('.user-results');

    const existingUsers = await page.evaluate(() => {
      const rows = document.querySelectorAll('.user-results tbody tr');
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          username: cells[0]?.textContent?.trim(),
          email: cells[1]?.textContent?.trim(),
          role: cells[2]?.textContent?.trim(),
          status: 'exists'
        };
      });
    });

    results.push(...existingUsers);
    logger(`Found ${existingUsers.length} test users`);
  }

  logger(`User management complete: ${action}`);

  return {
    success: true,
    action,
    totalUsers: results.length,
    results,
    timestamp: new Date().toISOString()
  };
}
```

### 4. API Integration Script

```typescript
// .playwright-mcp/scripts/sync-data-with-api.ts
import axios from 'axios';

interface ApiUser {
  id: number;
  name: string;
  email: string;
  status: string;
}

export default async function({ page, args, logger, env }) {
  const apiUrl = env.API_URL || 'https://api.example.com';
  const apiKey = env.API_KEY;

  if (!apiKey) {
    throw new Error('API_KEY environment variable is required');
  }

  const syncDirection = args.syncDirection || 'api-to-web'; // api-to-web, web-to-api

  logger(`Starting data sync: ${syncDirection}`);

  // Configure API client
  const apiClient = axios.create({
    baseURL: apiUrl,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (syncDirection === 'api-to-web') {
    // Fetch users from API
    logger('Fetching users from API...');
    const apiResponse = await apiClient.get('/users');
    const apiUsers: ApiUser[] = apiResponse.data;

    logger(`Found ${apiUsers.length} users in API`);

    // Login to web admin
    await page.goto(`${env.WEB_URL}/admin/login`);
    await page.fill('#username', env.ADMIN_USERNAME);
    await page.fill('#password', env.ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.admin-dashboard');

    // Sync each user to web interface
    const syncResults = [];

    for (const apiUser of apiUsers) {
      logger(`Syncing user: ${apiUser.name}`);

      try {
        // Check if user exists in web interface
        await page.goto(`${env.WEB_URL}/admin/users/search`);
        await page.fill('#search-email', apiUser.email);
        await page.click('#search-btn');
        await page.waitForTimeout(1000);

        const userExists = await page.locator('.user-results tr').count() > 0;

        if (userExists) {
          // Update existing user
          await page.click('.user-results tr:first-child .edit-btn');
          await page.waitForSelector('#user-edit-form');

          await page.fill('#name', apiUser.name);
          await page.selectOption('#status', apiUser.status);
          await page.click('#save-user');
          await page.waitForSelector('.success-message');

          syncResults.push({
            ...apiUser,
            action: 'updated',
            success: true
          });
        } else {
          // Create new user
          await page.goto(`${env.WEB_URL}/admin/users/new`);
          await page.fill('#name', apiUser.name);
          await page.fill('#email', apiUser.email);
          await page.selectOption('#status', apiUser.status);
          await page.click('#create-user');
          await page.waitForSelector('.success-message');

          syncResults.push({
            ...apiUser,
            action: 'created',
            success: true
          });
        }

        logger(`✅ Synced: ${apiUser.name}`);

      } catch (error) {
        syncResults.push({
          ...apiUser,
          action: 'error',
          success: false,
          error: error.message
        });
        logger(`❌ Error syncing ${apiUser.name}: ${error.message}`);
      }
    }

    const successCount = syncResults.filter(r => r.success).length;
    logger(`Sync complete: ${successCount}/${syncResults.length} users synced`);

    return {
      success: true,
      syncDirection,
      totalUsers: apiUsers.length,
      successfulSyncs: successCount,
      results: syncResults
    };
  }

  // web-to-api sync would be implemented similarly...
  return { success: false, error: 'web-to-api sync not implemented' };
}
```

## 🔧 Advanced Features

### File Operations

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export default async function({ page, args, logger }) {
  // Read configuration
  const configPath = path.join(process.cwd(), 'config', 'test-data.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

  // Process data
  const results = await processWebData(page, config);

  // Write results
  const outputPath = path.join(process.cwd(), 'output', `results-${Date.now()}.json`);
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));

  return { outputPath, recordCount: results.length };
}
```

### Error Handling & Retry Logic

```typescript
export default async function({ page, args, logger }) {
  const maxRetries = args.maxRetries || 3;
  const retryDelay = args.retryDelay || 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger(`Attempt ${attempt}/${maxRetries}`);

      await page.goto('https://unreliable-site.com');
      await page.waitForSelector('.content', { timeout: 10000 });

      // Success - break out of retry loop
      logger('✅ Operation successful');
      break;

    } catch (error) {
      logger(`❌ Attempt ${attempt} failed: ${error.message}`);

      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts`);
      }

      // Wait before retrying
      await page.waitForTimeout(retryDelay);
    }
  }

  return { success: true, attempts: attempt };
}
```

### Multiple Browser Contexts

```typescript
export default async function({ browser, logger }) {
  // Create multiple isolated contexts
  const contexts = await Promise.all([
    browser.newContext({ userAgent: 'Bot-1' }),
    browser.newContext({ userAgent: 'Bot-2' }),
    browser.newContext({ userAgent: 'Bot-3' })
  ]);

  const results = await Promise.all(
    contexts.map(async (context, index) => {
      const page = await context.newPage();

      try {
        await page.goto(`https://example.com/user/${index + 1}`);
        const data = await page.textContent('.user-info');
        return { contextId: index + 1, data };
      } finally {
        await context.close();
      }
    })
  );

  return { results };
}
```

### Dynamic Workflow Based on Page Content

```typescript
export default async function({ page, logger }) {
  await page.goto('https://example.com/dashboard');

  // Check what type of user is logged in
  const userRole = await page.textContent('.user-role');
  logger(`Detected user role: ${userRole}`);

  if (userRole === 'admin') {
    // Admin workflow
    await page.click('.admin-panel-link');
    await page.waitForSelector('.admin-dashboard');

    const adminData = await page.evaluate(() => {
      return {
        totalUsers: document.querySelector('.metric-users')?.textContent,
        totalOrders: document.querySelector('.metric-orders')?.textContent,
        revenue: document.querySelector('.metric-revenue')?.textContent
      };
    });

    return { workflow: 'admin', data: adminData };

  } else if (userRole === 'user') {
    // Regular user workflow
    await page.click('.my-account-link');
    await page.waitForSelector('.account-info');

    const userData = await page.evaluate(() => {
      return {
        profileComplete: document.querySelector('.profile-status')?.textContent,
        orderCount: document.querySelectorAll('.order-item').length,
        favoriteItems: document.querySelectorAll('.favorite-item').length
      };
    });

    return { workflow: 'user', data: userData };

  } else {
    // Guest workflow
    await page.click('.signup-link');
    await page.waitForSelector('.signup-form');

    return { workflow: 'guest', message: 'Redirected to signup' };
  }
}
```

## 🔐 Environment Variables & Secrets

### Using Environment Variables

```typescript
export default async function({ env, interpolateSecrets, logger }) {
  // Direct access
  const apiKey = env.API_KEY;
  const baseUrl = env.BASE_URL || 'https://localhost:3000';

  // Check required variables
  if (!apiKey) {
    throw new Error('API_KEY environment variable is required');
  }

  // Interpolate secrets in strings
  const endpoint = interpolateSecrets('${{API_URL}}/users/${{USER_ID}}');
  logger(`Connecting to: ${endpoint}`);

  // Use in API calls
  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  return { endpoint, status: response.status };
}
```

### Environment-Specific Logic

```typescript
export default async function({ env, page, logger }) {
  const environment = env.NODE_ENV || 'development';

  const config = {
    development: {
      baseUrl: 'http://localhost:3000',
      timeout: 5000,
      headless: false
    },
    staging: {
      baseUrl: env.STAGING_URL,
      timeout: 10000,
      headless: true
    },
    production: {
      baseUrl: env.PRODUCTION_URL,
      timeout: 15000,
      headless: true
    }
  }[environment];

  logger(`Running in ${environment} mode`);

  await page.goto(config.baseUrl);
  // Use config.timeout, etc.

  return { environment, config };
}
```

## ⚡ Script Execution

### Using execute-script Action

```json
{
  "scriptPath": "extract-product-data.ts",
  "scriptArgs": {
    "category": "electronics",
    "maxPages": 3,
    "outputFormat": "csv"
  }
}
```

### Path Resolution

Scripts are found in this order:
1. `.playwright-mcp/scripts/extract-product-data.ts`
2. `extract-product-data.ts` (relative to repository root)
3. Absolute path if provided

### Return Value

```json
{
  "success": true,
  "scriptPath": "/full/path/to/script.ts",
  "result": {
    "productCount": 150,
    "filename": "products-electronics-2024-01-15.csv",
    "category": "electronics"
  }
}
```

## 📚 Best Practices

### 1. **Type Safety**
```typescript
// Define interfaces for your data
interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

// Type your script arguments
interface ScriptArgs {
  category: string;
  maxResults?: number;
  exportFormat: 'json' | 'csv';
}

export default async function({ args }: { args: ScriptArgs }) {
  // TypeScript will help catch errors
}
```

### 2. **Error Handling**
```typescript
export default async function({ page, args, logger }) {
  try {
    // Main logic here
    const result = await performOperation(page, args);
    return { success: true, result };

  } catch (error) {
    logger(`Script failed: ${error.message}`);

    // Return error information
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      args
    };
  }
}
```

### 3. **Progress Logging**
```typescript
export default async function({ page, logger }) {
  const totalSteps = 5;
  let currentStep = 0;

  logger(`[${++currentStep}/${totalSteps}] Starting navigation...`);
  await page.goto('https://example.com');

  logger(`[${++currentStep}/${totalSteps}] Logging in...`);
  await performLogin(page);

  logger(`[${++currentStep}/${totalSteps}] Extracting data...`);
  const data = await extractData(page);

  logger(`[${++currentStep}/${totalSteps}] Processing results...`);
  const processed = processData(data);

  logger(`[${++currentStep}/${totalSteps}] Saving output...`);
  await saveResults(processed);

  logger('✅ Script completed successfully');
  return { success: true, recordCount: processed.length };
}
```

### 4. **Reusable Functions**
```typescript
// Create utility functions
async function loginAsAdmin(page, env) {
  await page.goto(`${env.ADMIN_URL}/login`);
  await page.fill('#username', env.ADMIN_USERNAME);
  await page.fill('#password', env.ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.admin-dashboard');
}

async function extractTableData(page, selector) {
  return await page.evaluate((sel) => {
    const rows = document.querySelectorAll(`${sel} tbody tr`);
    return Array.from(rows).map(row => {
      const cells = row.querySelectorAll('td');
      return Array.from(cells).map(cell => cell.textContent?.trim());
    });
  }, selector);
}

// Use in your main script
export default async function({ page, env, logger }) {
  await loginAsAdmin(page, env);

  const userData = await extractTableData(page, '.user-table');
  const orderData = await extractTableData(page, '.order-table');

  return { userData, orderData };
}
```

## 🔄 When to Use Scripts vs. Other Tools

### Use Scripts When:
- ✅ Complex logic (loops, conditions, calculations)
- ✅ Data processing (parsing, transforming, analyzing)
- ✅ API integrations (REST calls, data synchronization)
- ✅ File operations (reading config, writing results)
- ✅ Dynamic workflows (different paths based on content)
- ✅ Multiple browser contexts
- ✅ Error handling and retry logic

### Use Shortcuts When:
- ❌ Simple linear workflows
- ❌ No programming logic needed
- ❌ Just navigation and form filling

### Use Custom Actions When:
- ❌ Need to expose as reusable MCP tools
- ❌ Complex parameter validation
- ❌ Team-wide standardization

## 🚀 Next Steps

- **[Custom Actions](./04-custom-actions.md)** - Create reusable automation tools
- **[Environment Variables](./08-secrets.md)** - Secure credential management
- **[API Reference](./12-api-reference.md)** - TypeScript interfaces and types
- **[Best Practices](./10-best-practices.md)** - Patterns for robust automation

Scripts give you the full power of programming for complex automation tasks. Start simple and build up complexity as you learn the patterns! 🚀