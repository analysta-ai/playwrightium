import { z } from 'zod';
import type { PlaywrightActionDefinition } from './types';

/**
 * Close the persistent browser session
 * 
 * Use this when you're done with automation and want to clean up resources.
 */
const closeBrowser: PlaywrightActionDefinition = {
  name: 'close-browser',
  title: 'Close Browser Session',
  description: 'Close the persistent browser session to free up resources',
  inputSchema: z.object({}),
  async run(ctx) {
    ctx.logger(`Closing browser session...`);
    
    // Close page, context, and browser
    try {
      await ctx.page.close();
      await ctx.context.close();
      await ctx.browser.close();
      ctx.logger(`✅ Browser closed successfully`);
    } catch (error: any) {
      ctx.logger(`⚠️  Error closing browser: ${error.message}`);
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: 'Browser session closed.',
      }],
    };
  },
};

export default closeBrowser;
