import { z } from 'zod';
import type { PlaywrightActionDefinition } from './types';

/**
 * Capture accessibility snapshot of the current page
 * 
 * This provides a structured view of the page similar to @playwright/mcp's browser_snapshot.
 * Use this to discover proper selectors for elements before interacting with them.
 */
const browserSnapshot: PlaywrightActionDefinition = {
  name: 'browser-snapshot',
  title: 'Browser Snapshot',
  description: 'Capture accessibility snapshot of the current page to discover element selectors and page structure',
  inputSchema: z.object({}),
  async run(ctx) {
    ctx.logger(`📸 Capturing page snapshot...`);

    const page = ctx.page;
    
    // Get page info
    const url = page.url();
    const title = await page.title();
    
    // Use Playwright's ariaSnapshot method (same as @playwright/mcp)
    const snapshot = await page.locator('body').ariaSnapshot();
    
    ctx.logger(`✅ Snapshot captured`);

    return {
      content: [{
        type: 'text' as const,
        text: `### Page State
- Page URL: ${url}
- Page Title: ${title}
- Page Snapshot:
\`\`\`yaml
${snapshot}
\`\`\``,
      }],
    };
  },
};

export default browserSnapshot;
