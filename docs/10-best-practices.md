# Best Practices - Robust Automation Patterns

Learn proven patterns and practices for building reliable, maintainable automation with Playwrighium.

## 🎯 General Principles

### 1. **Start Simple, Add Complexity Gradually**

```yaml
# ✅ Start with a basic shortcut
commands:
  - type: navigate
    url: ${{APP_URL}}
  - type: screenshot
    path: "homepage.png"
```

Then evolve to more complex patterns:

```typescript
// ✅ Add logic when needed
export default async function({ page, args, logger }) {
  const pages = args.pages || ['home', 'about', 'contact'];

  for (const pageName of pages) {
    await page.goto(`${args.baseUrl}/${pageName}`);
    await page.screenshot({ path: `${pageName}.png` });
    logger(`✅ Captured ${pageName} page`);
  }

  return { capturedPages: pages.length };
}
```

### 2. **Be Descriptive and Self-Documenting**

```yaml
# ❌ Bad - unclear intent
- type: click
  selector: "#btn"

# ✅ Good - clear purpose
- type: click
  selector: "#submit-payment-btn"
  description: "Submit payment form and process transaction"
```

```typescript
// ✅ Good function and variable names
async function extractUserAccountData(page: Page): Promise<UserAccount[]> {
  const accountRows = await page.locator('.account-row').all();

  return await Promise.all(accountRows.map(async row => {
    const accountNumber = await row.locator('.account-number').textContent();
    const balance = await row.locator('.balance').textContent();
    const status = await row.locator('.status').textContent();

    return { accountNumber, balance, status };
  }));
}
```

### 3. **Design for Reusability**

```typescript
// ✅ Create reusable utility functions
async function loginAsRole(page: Page, role: string, env: Record<string, string>) {
  const username = env[`${role.toUpperCase()}_USERNAME`];
  const password = env[`${role.toUpperCase()}_PASSWORD`];

  if (!username || !password) {
    throw new Error(`Missing credentials for role: ${role}`);
  }

  await page.goto('/login');
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard');
}

// Use in multiple actions
export default async function({ page, env, args }) {
  await loginAsRole(page, args.role || 'user', env);
  // ... rest of automation
}
```

## 🛡️ Error Handling & Resilience

### 1. **Graceful Error Handling**

```typescript
export default async function({ page, args, logger }) {
  const results = { successes: [], failures: [] };

  for (const url of args.urls) {
    try {
      await page.goto(url, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      results.successes.push({ url, title });
      logger(`✅ ${url}: ${title}`);

    } catch (error) {
      results.failures.push({ url, error: error.message });
      logger(`❌ ${url}: ${error.message}`);

      // Continue with other URLs instead of failing completely
    }
  }

  return {
    success: results.failures.length === 0,
    summary: `${results.successes.length} succeeded, ${results.failures.length} failed`,
    results
  };
}
```

### 2. **Retry Logic for Flaky Operations**

```typescript
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  logger?: (msg: string) => void
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      logger?.(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);

      if (attempt === maxRetries) {
        throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw new Error('Unreachable code');
}

// Usage
export default async function({ page, logger }) {
  const data = await retryOperation(
    async () => {
      await page.goto('https://flaky-api.com/data');
      return await page.locator('.data-container').textContent();
    },
    3,
    2000,
    logger
  );

  return { data };
}
```

### 3. **Timeout Management**

```typescript
// ✅ Good - appropriate timeouts for different operations
export default async function({ page, args }) {
  // Quick operations - short timeout
  await page.goto(args.url, { timeout: 10000 });

  // Form submission - medium timeout
  await page.click('#submit');
  await page.waitForSelector('.success', { timeout: 30000 });

  // Heavy processing - long timeout
  await page.click('#generate-report');
  await page.waitForSelector('.report-ready', { timeout: 300000 }); // 5 minutes

  // Always provide fallback
  const result = await page.waitForSelector('.result', { timeout: 60000 })
    .catch(() => null);

  if (!result) {
    throw new Error('Operation timed out - no result after 60 seconds');
  }
}
```

## 🎛️ Selector Strategies

### 1. **Prefer Stable Selectors**

```typescript
// ✅ Priority order (most stable to least stable)
const selectors = [
  '[data-testid="submit-button"]',  // 1. Test IDs (most stable)
  '#submit-btn',                    // 2. IDs (usually stable)
  'button[type="submit"]',          // 3. Semantic attributes
  '.submit-button',                 // 4. Classes (can change)
  'div > button:nth-child(2)'       // 5. Structure-dependent (fragile)
];

// Try selectors in order of stability
async function findElement(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    if (await page.locator(selector).count() > 0) {
      return page.locator(selector);
    }
  }
  throw new Error('Element not found with any selector');
}
```

### 2. **Use Semantic Locators**

```typescript
// ✅ Good - semantic and readable
await page.getByRole('button', { name: 'Submit Payment' }).click();
await page.getByLabel('Email Address').fill('user@example.com');
await page.getByText('Welcome back!').waitFor();
await page.getByPlaceholder('Enter your search term').fill('playwright');

// ✅ Good - test IDs for dynamic content
await page.getByTestId('user-profile-card').click();
await page.getByTestId(`product-${productId}`).hover();
```

### 3. **Create Selector Utilities**

```typescript
// Reusable selector strategies
class PageSelectors {
  static async findByTextContent(page: Page, text: string) {
    return page.locator(`text="${text}"`);
  }

  static async findByAriaLabel(page: Page, label: string) {
    return page.locator(`[aria-label="${label}"]`);
  }

  static async findSubmitButton(page: Page) {
    const selectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Submit")',
      '.submit-btn',
      '#submit'
    ];

    for (const selector of selectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        return element;
      }
    }

    throw new Error('Submit button not found');
  }
}
```

## 📊 Data Management

### 1. **Structure Your Data**

```typescript
// ✅ Define clear data interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  lastLogin: Date;
  isActive: boolean;
}

interface ExtractedData {
  timestamp: string;
  source: string;
  users: UserProfile[];
  metadata: {
    totalCount: number;
    pageCount: number;
    extractionDuration: number;
  };
}

export default async function({ page, logger }): Promise<ExtractedData> {
  const startTime = Date.now();
  const users: UserProfile[] = [];

  // ... extraction logic

  return {
    timestamp: new Date().toISOString(),
    source: page.url(),
    users,
    metadata: {
      totalCount: users.length,
      pageCount: 1,
      extractionDuration: Date.now() - startTime
    }
  };
}
```

### 2. **Validate Extracted Data**

```typescript
function validateUserData(user: any): user is UserProfile {
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    ['admin', 'user', 'viewer'].includes(user.role) &&
    typeof user.isActive === 'boolean'
  );
}

export default async function({ page, logger }) {
  const rawUsers = await page.evaluate(() => {
    // Extract raw data from page
    return Array.from(document.querySelectorAll('.user-row')).map(row => ({
      id: row.querySelector('.id')?.textContent,
      name: row.querySelector('.name')?.textContent,
      email: row.querySelector('.email')?.textContent,
      role: row.querySelector('.role')?.textContent,
      isActive: row.querySelector('.status')?.textContent === 'Active'
    }));
  });

  // Validate and filter valid data
  const validUsers = rawUsers.filter(user => {
    const isValid = validateUserData(user);
    if (!isValid) {
      logger(`⚠️ Invalid user data: ${JSON.stringify(user)}`);
    }
    return isValid;
  });

  logger(`✅ Validated ${validUsers.length}/${rawUsers.length} users`);

  return { users: validUsers };
}
```

### 3. **Export Data Consistently**

```typescript
// Consistent export utilities
class DataExporter {
  static async exportToCSV<T>(data: T[], filename: string): Promise<string> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => `"${String(row[header]).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    await fs.writeFile(filename, csvContent);
    return filename;
  }

  static async exportToJSON<T>(data: T[], filename: string): Promise<string> {
    const exportData = {
      timestamp: new Date().toISOString(),
      count: data.length,
      data
    };

    await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
    return filename;
  }
}
```

## 🔄 Workflow Organization

### 1. **Separate Concerns**

```typescript
// ✅ Good - separate functions for different concerns
async function authenticateUser(page: Page, credentials: UserCredentials) {
  await page.goto('/login');
  await page.fill('#username', credentials.username);
  await page.fill('#password', credentials.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard');
}

async function navigateToReports(page: Page) {
  await page.click('nav a[href="/reports"]');
  await page.waitForSelector('.reports-dashboard');
}

async function extractReportData(page: Page): Promise<ReportData[]> {
  return await page.evaluate(() => {
    // Extraction logic here
  });
}

// Main function orchestrates the workflow
export default async function({ page, env, args }) {
  await authenticateUser(page, {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD
  });

  await navigateToReports(page);
  const data = await extractReportData(page);

  return { reportData: data };
}
```

### 2. **Use Configuration Objects**

```typescript
// ✅ Configuration-driven automation
interface AutomationConfig {
  environment: 'dev' | 'staging' | 'prod';
  userRole: 'admin' | 'user';
  actions: Array<{
    type: 'navigate' | 'extract' | 'screenshot';
    target: string;
    options?: Record<string, any>;
  }>;
  retries: number;
  timeout: number;
}

export default async function({ page, args, env, logger }) {
  const config: AutomationConfig = {
    environment: args.environment || 'dev',
    userRole: args.userRole || 'user',
    actions: args.actions || [],
    retries: args.retries || 3,
    timeout: args.timeout || 30000
  };

  // Configure based on environment
  const baseUrl = env[`${config.environment.toUpperCase()}_URL`];

  for (const action of config.actions) {
    await executeAction(page, action, config, logger);
  }
}
```

### 3. **Progress Tracking**

```typescript
// ✅ Clear progress reporting
interface ProgressTracker {
  current: number;
  total: number;
  stage: string;
  startTime: number;
}

export default async function({ page, args, logger }) {
  const tasks = args.tasks || [];
  const progress: ProgressTracker = {
    current: 0,
    total: tasks.length,
    stage: 'initialization',
    startTime: Date.now()
  };

  const updateProgress = (stage: string) => {
    progress.current++;
    progress.stage = stage;
    const elapsed = Date.now() - progress.startTime;
    const estimated = progress.current > 0 ? (elapsed / progress.current) * progress.total : 0;

    logger(`[${progress.current}/${progress.total}] ${stage} (${Math.round(elapsed/1000)}s elapsed, ~${Math.round((estimated - elapsed)/1000)}s remaining)`);
  };

  for (const task of tasks) {
    updateProgress(`Processing ${task.name}`);
    await processTask(page, task);
  }

  updateProgress('Complete');

  return {
    success: true,
    tasksCompleted: progress.current,
    duration: Date.now() - progress.startTime
  };
}
```

## 🧪 Testing & Validation

### 1. **Validate Assumptions**

```typescript
export default async function({ page, args, logger }) {
  // Validate page state before proceeding
  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard')) {
    throw new Error(`Expected to be on dashboard, but found: ${currentUrl}`);
  }

  // Validate required elements exist
  const requiredElements = ['.user-menu', '.main-navigation', '.content-area'];
  for (const selector of requiredElements) {
    const exists = await page.locator(selector).count() > 0;
    if (!exists) {
      throw new Error(`Required element not found: ${selector}`);
    }
  }

  logger('✅ All pre-conditions validated');

  // Proceed with automation...
}
```

### 2. **Take Strategic Screenshots**

```typescript
export default async function({ page, args, logger }) {
  const screenshotDir = args.screenshotDir || './screenshots';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Before operation
  await page.screenshot({
    path: `${screenshotDir}/before-${timestamp}.png`,
    fullPage: true
  });

  try {
    // Perform critical operation
    await page.click('#critical-button');
    await page.waitForSelector('.result');

    // After success
    await page.screenshot({
      path: `${screenshotDir}/success-${timestamp}.png`
    });

  } catch (error) {
    // After failure
    await page.screenshot({
      path: `${screenshotDir}/error-${timestamp}.png`
    });
    throw error;
  }
}
```

### 3. **Verify Results**

```typescript
export default async function({ page, args, logger }) {
  const results = await extractData(page);

  // Validate results make sense
  if (results.length === 0) {
    logger('⚠️ No data extracted - this might indicate a problem');
  }

  if (results.length > 10000) {
    logger('⚠️ Unusually large dataset - please verify');
  }

  // Check for data quality issues
  const invalidRecords = results.filter(record => !record.id || !record.name);
  if (invalidRecords.length > 0) {
    logger(`⚠️ Found ${invalidRecords.length} records with missing data`);
  }

  // Statistical validation
  const avgScore = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
  if (avgScore < 1 || avgScore > 100) {
    logger(`⚠️ Unusual average score: ${avgScore} - please verify data`);
  }

  return {
    totalRecords: results.length,
    invalidRecords: invalidRecords.length,
    averageScore: avgScore,
    data: results
  };
}
```

## 🔧 Environment & Configuration

### 1. **Environment-Specific Behavior**

```typescript
export default async function({ env, args, logger }) {
  const environment = env.NODE_ENV || 'development';

  const config = {
    development: {
      timeout: 5000,
      headless: false,
      slowMo: 100,  // Slow down for debugging
      retries: 1
    },
    staging: {
      timeout: 15000,
      headless: true,
      slowMo: 0,
      retries: 2
    },
    production: {
      timeout: 30000,
      headless: true,
      slowMo: 0,
      retries: 3
    }
  }[environment];

  logger(`Running in ${environment} mode with config:`, config);

  // Use environment-specific settings
  if (environment === 'development') {
    logger('🔧 Development mode - taking extra screenshots for debugging');
    await page.screenshot({ path: 'debug-state.png' });
  }

  return { environment, config };
}
```

### 2. **Feature Flags**

```typescript
interface FeatureFlags {
  takeScreenshots: boolean;
  validateData: boolean;
  enableRetries: boolean;
  verboseLogging: boolean;
}

export default async function({ args, logger }) {
  const features: FeatureFlags = {
    takeScreenshots: args.screenshots ?? true,
    validateData: args.validate ?? true,
    enableRetries: args.retries ?? true,
    verboseLogging: args.verbose ?? false
  };

  if (features.verboseLogging) {
    logger('🔧 Verbose logging enabled');
    logger('Feature flags:', features);
  }

  // Use feature flags throughout
  if (features.takeScreenshots) {
    await page.screenshot({ path: 'operation-complete.png' });
  }

  if (features.validateData && results.length === 0) {
    throw new Error('Data validation failed - no results found');
  }

  return { features, success: true };
}
```

## 📝 Documentation & Maintenance

### 1. **Self-Documenting Code**

```typescript
/**
 * Extracts user account information from the admin dashboard.
 *
 * Prerequisites:
 * - User must be logged in as admin
 * - Must be on the admin dashboard page
 *
 * @param filters - Optional filters to apply to user list
 * @param limit - Maximum number of users to extract (default: 100)
 * @returns User account data with metadata
 */
const action: PlaywrightActionDefinition = {
  name: 'extract-user-accounts',
  title: 'Extract User Account Data',
  description: 'Extract user account information from admin dashboard with optional filtering and pagination support',

  inputSchema: z.object({
    filters: z.object({
      role: z.enum(['admin', 'user', 'viewer']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      dateRange: z.object({
        from: z.string().optional(),
        to: z.string().optional()
      }).optional()
    }).optional().describe('Filters to apply to user list'),

    limit: z.number()
      .min(1)
      .max(1000)
      .default(100)
      .describe('Maximum number of users to extract'),

    exportFormat: z.enum(['json', 'csv'])
      .default('json')
      .describe('Output format for extracted data')
  }),

  async run({ page, input, logger }) {
    // Implementation with clear steps...
  }
};
```

### 2. **Version Your Automation**

```typescript
// Add version tracking to your actions
const action: PlaywrightActionDefinition = {
  name: 'extract-sales-data',
  title: 'Extract Sales Data v2.1',
  description: 'Extract sales data from dashboard. v2.1: Added date filtering, improved error handling',

  // Track version in metadata
  async run({ page, input, logger }) {
    const version = '2.1.0';
    const changelog = {
      '2.1.0': 'Added date range filtering and improved error handling',
      '2.0.0': 'Switched to new dashboard layout, added CSV export',
      '1.0.0': 'Initial version with basic data extraction'
    };

    logger(`Running sales data extraction v${version}`);

    return {
      message: 'Sales data extracted successfully',
      structuredContent: {
        version,
        changelog: changelog[version],
        // ... other data
      }
    };
  }
};
```

### 3. **Health Checks**

```typescript
// Add health checks to validate your automation still works
const healthCheck: PlaywrightActionDefinition = {
  name: 'health-check-user-extraction',
  description: 'Verify user extraction automation is working correctly',

  async run({ page, env, logger }) {
    const issues: string[] = [];

    try {
      // Check login still works
      await page.goto(`${env.ADMIN_URL}/login`);
      await page.fill('#username', env.ADMIN_USERNAME);
      await page.fill('#password', env.ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForSelector('.admin-dashboard', { timeout: 10000 });
      logger('✅ Login working');

    } catch (error) {
      issues.push(`Login failed: ${error.message}`);
    }

    try {
      // Check users page loads
      await page.goto(`${env.ADMIN_URL}/users`);
      await page.waitForSelector('.user-table', { timeout: 10000 });

      const userCount = await page.locator('.user-table tbody tr').count();
      if (userCount === 0) {
        issues.push('No users found in table');
      } else {
        logger(`✅ Users page working (${userCount} users found)`);
      }

    } catch (error) {
      issues.push(`Users page failed: ${error.message}`);
    }

    const isHealthy = issues.length === 0;

    return {
      message: isHealthy ? 'All health checks passed' : `${issues.length} issues found`,
      structuredContent: {
        healthy: isHealthy,
        issues,
        timestamp: new Date().toISOString()
      },
      isError: !isHealthy
    };
  }
};
```

## 🚀 Performance & Optimization

### 1. **Parallel Processing**

```typescript
export default async function({ browser, args, logger }) {
  const urls = args.urls || [];
  const concurrency = Math.min(args.concurrency || 3, 5); // Limit concurrent tabs

  logger(`Processing ${urls.length} URLs with concurrency: ${concurrency}`);

  // Process URLs in batches
  const results = [];
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (url, index) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          await page.goto(url);
          const title = await page.title();

          return { url, title, success: true };
        } catch (error) {
          return { url, error: error.message, success: false };
        } finally {
          await context.close();
        }
      })
    );

    results.push(...batchResults);
    logger(`Completed batch ${Math.floor(i/concurrency) + 1}/${Math.ceil(urls.length/concurrency)}`);
  }

  return {
    totalProcessed: results.length,
    successful: results.filter(r => r.success).length,
    results
  };
}
```

### 2. **Resource Management**

```typescript
export default async function({ page, args, logger }) {
  // Block unnecessary resources for faster loading
  await page.route('**/*', (route) => {
    const resourceType = route.request().resourceType();

    // Block images, stylesheets, fonts for data extraction
    if (['image', 'stylesheet', 'font'].includes(resourceType)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  // Monitor memory usage
  const startMemory = process.memoryUsage();

  try {
    // Your automation logic here
    await performDataExtraction(page);

  } finally {
    const endMemory = process.memoryUsage();
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    logger(`Memory usage: ${Math.round(memoryDelta / 1024 / 1024)}MB`);
  }
}
```

## ✅ Checklist for New Automation

Before creating new automation, ask yourself:

### Planning
- [ ] **Clear objective**: What exactly does this automation accomplish?
- [ ] **Success criteria**: How do I know it worked?
- [ ] **Failure scenarios**: What can go wrong and how do I handle it?
- [ ] **Data validation**: How do I verify the results are correct?

### Implementation
- [ ] **Descriptive names**: Are functions and variables self-explanatory?
- [ ] **Error handling**: Does it fail gracefully with useful messages?
- [ ] **Logging**: Can I trace what happened when it runs?
- [ ] **Timeouts**: Are timeouts appropriate for each operation?
- [ ] **Selectors**: Am I using stable, semantic selectors?

### Testing
- [ ] **Manual verification**: Have I watched it run end-to-end?
- [ ] **Edge cases**: Does it handle empty data, network issues, UI changes?
- [ ] **Different environments**: Does it work in dev, staging, production?
- [ ] **Screenshots**: Are there screenshots for debugging failures?

### Documentation
- [ ] **Clear description**: Would someone else understand what this does?
- [ ] **Prerequisites**: Are setup requirements documented?
- [ ] **Example usage**: Is there a clear example of how to use it?
- [ ] **Return format**: Is the output format documented?

### Maintenance
- [ ] **Version tracking**: Can I track changes over time?
- [ ] **Health checks**: Can I verify it still works?
- [ ] **Monitoring**: Will I know when it breaks?
- [ ] **Update plan**: How do I handle UI changes?

## 🚀 Next Steps

- **[Troubleshooting](./13-troubleshooting.md)** - Debug common issues
- **[API Reference](./12-api-reference.md)** - Complete interface documentation
- **[Architecture](./09-architecture.md)** - Understand how it all works together

Following these patterns will help you build automation that's reliable, maintainable, and grows with your needs! 🎯