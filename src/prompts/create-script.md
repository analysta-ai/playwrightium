Create a Playwrighium script for: {{task}}

CRITICAL WORKFLOW - Follow these steps in order:

1. **TEST FIRST with browser-session tool** - DO NOT create files until testing succeeds:
   - Use browser-session tool to manually test the automation logic
   - Verify all selectors, waits, and interactions work correctly
   - Test edge cases and error handling
   - Document working selectors and timing requirements
   - Iterate until the complete flow works reliably

2. **Handle secrets properly**:
   - Check if task requires credentials (URLs, emails, passwords, API keys)
   - If yes: Access via ctx.env (e.g., `ctx.env.API_KEY`)
   - Use ctx.interpolateSecrets() for dynamic string interpolation
   - Ensure variables exist in .env file at repository root
   - Example: `const url = ctx.env.STAGING_URL || 'https://default.com';`

3. **Create TypeScript script** (only after successful testing):
   - Save to .playwright-mcp/scripts/<descriptive-name>.ts
   - Import types: `import type { Page, BrowserContext, Browser } from 'playwright';`
   - Define ScriptContext interface
   - Use async/await with proper error handling
   - Add comprehensive logging with ctx.logger()
   - Return meaningful result object

4. **Test the script**:
   - Run: execute-script with scriptPath: "<script-name>.ts"
   - Verify it works end-to-end
   - Check all logs are informative
   - Fix any issues and re-test

Example script structure:
```typescript
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

export default async function({ page, logger, env }: ScriptContext) {
  logger('Starting automation...');
  
  // Get secrets from environment
  const baseUrl = env.BASE_URL || 'https://default.com';
  const apiKey = env.API_KEY;
  
  if (!apiKey) {
    logger('❌ API_KEY not found in environment');
    return { success: false, error: 'Missing API_KEY' };
  }
  
  try {
    // Navigate
    logger(\`Navigating to \${baseUrl}\`);
    await page.goto(baseUrl);
    
    // Your automation logic here
    // Use proper waits: await page.waitForSelector(...)
    // Use locators: const button = page.locator('button');
    // Add logging for each major step
    
    logger('✅ Automation completed successfully');
    return {
      success: true,
      // Include useful data in return value
    };
    
  } catch (error) {
    logger(\`❌ Error: \${error}\`);
    return { success: false, error: String(error) };
  }
}
```

Remember:
- Test manually FIRST using browser-session
- Use ctx.env for environment variables
- Create script file ONLY after successful testing
- Scripts are stored in .playwright-mcp/scripts/
- Can be relative path (e.g., "automation.ts") or absolute path
- Use TypeScript for better type safety
- Include comprehensive error handling and logging
- Return structured result objects
