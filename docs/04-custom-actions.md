# Custom Actions - Reusable TypeScript Tools

Custom Actions are the most powerful feature of Playwrighium - they let you create reusable, parameterized automation tools that appear as MCP tools in your AI clients.

## 🎯 What are Custom Actions?

Custom Actions are TypeScript files that define:
- **Tool name** and description for AI discovery
- **Input parameters** with type validation
- **Automation logic** with full Playwright API access
- **Structured results** for chaining with other actions

Think of them as **"automation functions"** that your AI can discover and use intelligently.

## 🏗️ Action Structure

Every custom action follows this pattern:

```typescript
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const action: PlaywrightActionDefinition = {
  // 🏷️ Tool Identity
  name: 'my-action',
  title: 'My Custom Action',
  description: 'What this action does and when to use it',

  // ⚙️ Configuration
  browser: 'chromium', // Optional: chromium | firefox | webkit
  headless: false,     // Optional: true for background execution

  // 📋 Input Schema (Zod validation)
  inputSchema: z.object({
    url: z.string().url().describe('Target URL'),
    timeout: z.number().optional().describe('Wait timeout in ms')
  }),

  // 🚀 Automation Logic
  async run({ page, context, browser, input, logger, env }) {
    await logger('Starting my custom action');

    // Your automation code here
    await page.goto(input.url);

    return {
      message: 'Action completed successfully',
      structuredContent: { /* data for other actions */ }
    };
  }
};

export default action;
```

## 📋 Input Schema & Validation

Use Zod schemas to define and validate inputs:

### Basic Types
```typescript
inputSchema: z.object({
  // Strings
  name: z.string().describe('User name'),
  email: z.string().email().describe('Valid email address'),
  url: z.string().url().describe('Valid URL'),

  // Numbers
  count: z.number().int().positive().describe('Positive integer'),
  timeout: z.number().min(1000).max(30000).describe('Timeout 1-30 seconds'),

  // Booleans
  fullPage: z.boolean().describe('Take full page screenshot'),

  // Enums
  browser: z.enum(['chrome', 'firefox', 'safari']).describe('Browser type'),

  // Optional fields
  description: z.string().optional().describe('Optional description'),

  // Arrays
  urls: z.array(z.string().url()).describe('List of URLs to visit'),

  // Objects
  credentials: z.object({
    username: z.string(),
    password: z.string()
  }).describe('Login credentials')
})
```

### Advanced Validation
```typescript
inputSchema: z.object({
  // Custom validation
  port: z.number().refine(port => port > 1024, {
    message: 'Port must be > 1024'
  }),

  // Conditional fields
  mode: z.enum(['upload', 'download']),
  files: z.array(z.string()).optional(),
  downloadPath: z.string().optional()
}).refine(data => {
  if (data.mode === 'upload' && !data.files) {
    throw new Error('Files required for upload mode');
  }
  return true;
})
```

## 🎭 Action Context

Your `run` function receives a rich context object:

```typescript
async run(ctx, helpers) {
  const {
    // 🌐 Playwright Objects
    page,      // Main page instance
    context,   // Browser context
    browser,   // Browser instance

    // 📥 Input & Config
    input,     // Validated input parameters

    // 🔧 Utilities
    logger,    // Logging function
    env,       // Environment variables
    interpolateSecrets, // ${{VAR}} interpolation
    baseDir,   // Repository root directory
  } = ctx;

  const { playwright } = helpers; // Full Playwright API
}
```

### Logging
```typescript
// Different log levels
await logger('Info message', 'info');
await logger('Warning message', 'warning');
await logger('Error message', 'error');
await logger('Debug details', 'debug');

// Progress tracking
await logger('Starting data extraction...');
await logger(`Processing ${items.length} items`);
await logger('✅ Extraction complete');
```

### Environment Variables
```typescript
// Direct access
const apiKey = env.API_KEY;
const baseUrl = env.BASE_URL || 'https://localhost:3000';

// Secret interpolation
const endpoint = interpolateSecrets('${{API_URL}}/users/${{USER_ID}}');

// File paths relative to repo root
const configPath = path.join(baseDir, 'config', 'app.json');
```

## 🎨 Real-World Examples

### 1. Application Login

```typescript
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const loginAction: PlaywrightActionDefinition = {
  name: 'login-to-app',
  title: 'Login to Application',
  description: 'Login to our application with role-based access',

  inputSchema: z.object({
    environment: z.enum(['staging', 'production']).describe('Target environment'),
    role: z.enum(['admin', 'user', 'viewer']).optional().describe('User role'),
    rememberMe: z.boolean().optional().describe('Keep logged in')
  }),

  async run({ page, input, logger, env }) {
    const baseUrl = input.environment === 'staging'
      ? env.STAGING_URL
      : env.PRODUCTION_URL;

    await logger(`Logging into ${input.environment} as ${input.role || 'default user'}`);

    // Navigate to login page
    await page.goto(`${baseUrl}/login`);
    await page.waitForSelector('#login-form');

    // Get credentials based on role
    const username = env[`${input.role?.toUpperCase()}_USERNAME`] || env.DEFAULT_USERNAME;
    const password = env[`${input.role?.toUpperCase()}_PASSWORD`] || env.DEFAULT_PASSWORD;

    // Fill login form
    await page.fill('#username', username);
    await page.fill('#password', password);

    if (input.rememberMe) {
      await page.check('#remember-me');
    }

    // Submit and wait for redirect
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Verify login success
    const userInfo = await page.textContent('.user-info');

    await logger('✅ Login successful');

    return {
      message: `Successfully logged in as ${input.role || 'user'}`,
      structuredContent: {
        environment: input.environment,
        role: input.role,
        userInfo,
        loginUrl: `${baseUrl}/login`,
        dashboardUrl: page.url()
      }
    };
  }
};

export default loginAction;
```

### 2. Data Extraction

```typescript
import { z } from 'zod';
import * as fs from 'fs/promises';
import type { PlaywrightActionDefinition } from '../action-types';

const extractData: PlaywrightActionDefinition = {
  name: 'extract-user-data',
  title: 'Extract User Data',
  description: 'Extract user information from admin panel and export to CSV',

  inputSchema: z.object({
    filters: z.object({
      role: z.string().optional(),
      status: z.enum(['active', 'inactive', 'all']).default('all'),
      dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional()
      }).optional()
    }).optional(),
    exportFormat: z.enum(['json', 'csv']).default('json'),
    outputFile: z.string().optional().describe('Output filename')
  }),

  async run({ page, input, logger, baseDir }) {
    await logger('Starting user data extraction');

    // Navigate to admin panel
    await page.goto('/admin/users');
    await page.waitForSelector('.user-table');

    // Apply filters if provided
    if (input.filters) {
      if (input.filters.role) {
        await page.selectOption('#role-filter', input.filters.role);
      }
      if (input.filters.status !== 'all') {
        await page.selectOption('#status-filter', input.filters.status);
      }

      await page.click('#apply-filters');
      await page.waitForSelector('.user-table tbody tr');
    }

    // Extract user data
    const users = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.user-table tbody tr'));
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          id: cells[0]?.textContent?.trim(),
          name: cells[1]?.textContent?.trim(),
          email: cells[2]?.textContent?.trim(),
          role: cells[3]?.textContent?.trim(),
          status: cells[4]?.textContent?.trim(),
          lastLogin: cells[5]?.textContent?.trim()
        };
      });
    });

    await logger(`Extracted ${users.length} users`);

    // Export data
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = input.outputFile || `users-${timestamp}.${input.exportFormat}`;
    const filepath = path.join(baseDir, filename);

    if (input.exportFormat === 'csv') {
      const csv = [
        'ID,Name,Email,Role,Status,Last Login',
        ...users.map(u => `${u.id},"${u.name}","${u.email}",${u.role},${u.status},"${u.lastLogin}"`)
      ].join('\n');
      await fs.writeFile(filepath, csv);
    } else {
      await fs.writeFile(filepath, JSON.stringify(users, null, 2));
    }

    await logger(`✅ Data exported to ${filename}`);

    return {
      message: `Extracted ${users.length} users to ${filename}`,
      structuredContent: {
        userCount: users.length,
        filename,
        filepath,
        format: input.exportFormat,
        filters: input.filters,
        users: users.slice(0, 5) // Include first 5 for preview
      }
    };
  }
};

export default extractData;
```

### 3. E2E Workflow Testing

```typescript
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const e2eTest: PlaywrightActionDefinition = {
  name: 'test-checkout-flow',
  title: 'E2E Checkout Test',
  description: 'Test complete e-commerce checkout process with validation',

  inputSchema: z.object({
    product: z.object({
      name: z.string().describe('Product name to search for'),
      quantity: z.number().positive().default(1)
    }),
    customerInfo: z.object({
      email: z.string().email(),
      firstName: z.string(),
      lastName: z.string(),
      address: z.string(),
      city: z.string(),
      zipCode: z.string()
    }),
    paymentMethod: z.enum(['card', 'paypal']).default('card'),
    validateOrder: z.boolean().default(true)
  }),

  async run({ page, input, logger }) {
    const testResults = {
      steps: [],
      errors: [],
      screenshots: []
    };

    try {
      // Step 1: Search for product
      await logger('🔍 Searching for product');
      await page.goto('/');
      await page.fill('#search', input.product.name);
      await page.click('#search-btn');
      await page.waitForSelector('.product-grid');

      const productFound = await page.locator(`.product:has-text("${input.product.name}")`).count() > 0;
      testResults.steps.push({ step: 'search', success: productFound });

      if (!productFound) {
        throw new Error(`Product "${input.product.name}" not found`);
      }

      // Step 2: Add to cart
      await logger('🛒 Adding to cart');
      await page.click(`.product:has-text("${input.product.name}") .add-to-cart`);

      if (input.product.quantity > 1) {
        await page.fill('.quantity-input', input.product.quantity.toString());
      }

      await page.click('#add-to-cart-btn');
      await page.waitForSelector('.cart-notification');
      testResults.steps.push({ step: 'add-to-cart', success: true });

      // Step 3: Proceed to checkout
      await logger('💳 Proceeding to checkout');
      await page.click('.cart-icon');
      await page.click('#checkout-btn');
      await page.waitForSelector('#checkout-form');

      // Step 4: Fill customer information
      await logger('📝 Filling customer information');
      await page.fill('#email', input.customerInfo.email);
      await page.fill('#firstName', input.customerInfo.firstName);
      await page.fill('#lastName', input.customerInfo.lastName);
      await page.fill('#address', input.customerInfo.address);
      await page.fill('#city', input.customerInfo.city);
      await page.fill('#zipCode', input.customerInfo.zipCode);

      testResults.steps.push({ step: 'customer-info', success: true });

      // Step 5: Select payment method
      await logger(`💰 Selecting payment method: ${input.paymentMethod}`);
      await page.click(`#payment-${input.paymentMethod}`);

      if (input.paymentMethod === 'card') {
        // Fill test card details
        await page.fill('#card-number', '4111 1111 1111 1111');
        await page.fill('#expiry', '12/25');
        await page.fill('#cvv', '123');
      }

      testResults.steps.push({ step: 'payment-method', success: true });

      // Step 6: Submit order
      await logger('🚀 Submitting order');
      await page.click('#submit-order');

      // Wait for order confirmation
      await page.waitForSelector('.order-confirmation', { timeout: 15000 });
      const orderNumber = await page.textContent('.order-number');

      testResults.steps.push({ step: 'order-submission', success: true, orderNumber });

      // Step 7: Validate order (if requested)
      if (input.validateOrder) {
        await logger('✅ Validating order');

        const orderSummary = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.order-item'));
          return items.map(item => ({
            name: item.querySelector('.item-name')?.textContent,
            quantity: item.querySelector('.item-quantity')?.textContent,
            price: item.querySelector('.item-price')?.textContent
          }));
        });

        testResults.steps.push({
          step: 'order-validation',
          success: true,
          orderSummary
        });
      }

      // Take final screenshot
      const screenshotPath = `checkout-success-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      testResults.screenshots.push(screenshotPath);

      await logger('🎉 Checkout flow completed successfully');

      return {
        message: `Checkout test completed successfully. Order: ${orderNumber}`,
        structuredContent: {
          success: true,
          orderNumber,
          testResults,
          product: input.product,
          customer: input.customerInfo.email,
          paymentMethod: input.paymentMethod
        }
      };

    } catch (error) {
      const errorMsg = error.message;
      testResults.errors.push(errorMsg);

      // Take error screenshot
      const errorScreenshot = `checkout-error-${Date.now()}.png`;
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      testResults.screenshots.push(errorScreenshot);

      await logger(`❌ Checkout test failed: ${errorMsg}`);

      return {
        message: `Checkout test failed: ${errorMsg}`,
        structuredContent: {
          success: false,
          error: errorMsg,
          testResults,
          completedSteps: testResults.steps.length
        },
        isError: true
      };
    }
  }
};

export default e2eTest;
```

## 🔄 Return Values

Actions can return different types of results:

### Simple String
```typescript
return "Action completed successfully";
```

### Action Response Object
```typescript
return {
  message: "Human-readable summary",
  structuredContent: {
    // Data for other actions to use
    userId: 123,
    status: "active",
    metadata: { ... }
  },
  isError: false // Optional error flag
};
```

### Full MCP Result (Advanced)
```typescript
return {
  content: [
    { type: 'text', text: 'Summary message' },
    { type: 'image', data: base64ImageData, mimeType: 'image/png' }
  ],
  structuredContent: { ... },
  isError: false
};
```

## 🛠️ Development Workflow

### 1. Create Action File
```bash
# Copy a template
cp .playwright-mcp/actions/README.md example-action.ts

# Or create from scratch
touch .playwright-mcp/actions/my-action.ts
```

### 2. Implement Action
```typescript
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const action: PlaywrightActionDefinition = {
  name: 'my-action',
  description: 'Clear description for AI to understand',
  inputSchema: z.object({
    // Define your parameters
  }),
  async run(ctx) {
    // Implement your logic
  }
};

export default action;
```

### 3. Test & Debug
```bash
# Restart MCP server to load new action
# Test with simple inputs
# Add logging to debug issues
# Use headed mode to watch execution
```

### 4. Refine & Document
```typescript
// Add comprehensive descriptions
description: 'Detailed explanation of what this does, when to use it, and expected outcomes',

// Document parameters clearly
inputSchema: z.object({
  url: z.string().url().describe('Target URL to process'),
  timeout: z.number().optional().describe('Maximum wait time in milliseconds')
}),

// Log progress steps
await logger('Starting data extraction from table');
await logger(`Found ${rows.length} rows to process`);
```

## 📚 Best Practices

### 1. **Descriptive Names & Documentation**
```typescript
// ❌ Bad
name: 'action1',
description: 'Does stuff',

// ✅ Good
name: 'extract-product-catalog',
description: 'Extract product information from e-commerce catalog page including name, price, availability, and ratings',
```

### 2. **Robust Error Handling**
```typescript
try {
  await page.click('#submit-btn');
  await page.waitForSelector('.success-message');
} catch (error) {
  await logger(`Button click failed: ${error.message}`);

  // Try alternative approach
  await page.keyboard.press('Enter');

  // Or fail gracefully
  return {
    message: 'Submission failed - manual intervention needed',
    isError: true
  };
}
```

### 3. **Flexible Selectors**
```typescript
// Try multiple selector strategies
async function findElement(page, identifier) {
  // Try CSS selector first
  if (await page.locator(identifier).count() > 0) {
    return page.locator(identifier);
  }

  // Try text content
  if (await page.getByText(identifier).count() > 0) {
    return page.getByText(identifier);
  }

  // Try role-based
  if (identifier.startsWith('role:')) {
    const [, role, name] = identifier.match(/role:(\w+)(?:\[(.+)\])?/);
    return page.getByRole(role, name ? { name } : {});
  }

  throw new Error(`Element not found: ${identifier}`);
}
```

### 4. **Environment-Aware Actions**
```typescript
// Support multiple environments
const getEnvironmentConfig = (env) => {
  const environment = env.NODE_ENV || 'development';

  return {
    development: {
      baseUrl: 'http://localhost:3000',
      timeout: 5000
    },
    staging: {
      baseUrl: env.STAGING_URL,
      timeout: 10000
    },
    production: {
      baseUrl: env.PRODUCTION_URL,
      timeout: 15000
    }
  }[environment];
};
```

## 🔧 Advanced Features

### Context Sharing Between Actions
```typescript
// Store data in browser context for other actions
await context.addInitScript(() => {
  window.playwrightiumData = {
    userId: 123,
    sessionToken: 'abc123'
  };
});

// Retrieve in other actions
const sharedData = await page.evaluate(() => window.playwrightiumData);
```

### File Operations
```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

// Read configuration files
const configPath = path.join(baseDir, 'config', 'test-data.json');
const testData = JSON.parse(await fs.readFile(configPath, 'utf-8'));

// Save results
const resultsPath = path.join(baseDir, 'results', `test-${Date.now()}.json`);
await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
```

### Multiple Browser Contexts
```typescript
// Create isolated context for certain operations
const isolatedContext = await browser.newContext({
  userAgent: 'Custom Bot 1.0',
  viewport: { width: 1920, height: 1080 }
});

const isolatedPage = await isolatedContext.newPage();
// Perform isolated operations
await isolatedContext.close();
```

## 🚀 Next Steps

- **[Environment Variables](./08-secrets.md)** - Secure credential management
- **[Command Reference](./11-commands.md)** - Master browser automation commands
- **[Best Practices](./10-best-practices.md)** - Patterns for robust actions
- **[API Reference](./12-api-reference.md)** - Complete TypeScript interfaces

Ready to create powerful automation tools? Start with a simple action and gradually add complexity as you learn the patterns! 🎉