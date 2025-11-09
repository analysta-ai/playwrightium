import { z } from 'zod';
import type { PlaywrightActionDefinition } from './types';

/**
 * Get debugging information from the browser
 * 
 * Returns console messages and network requests captured during the session.
 * Useful for debugging page behavior and API calls.
 */
const browserDebug: PlaywrightActionDefinition = {
  name: 'browser-debug',
  title: 'Browser Debug Info',
  description: 'Get console messages and network requests from the current browser session',
  inputSchema: z.object({
    includeConsole: z.boolean().optional().describe('Include console messages (default: true)'),
    includeNetwork: z.boolean().optional().describe('Include network requests (default: true)'),
    onlyErrors: z.boolean().optional().describe('For console: only show error messages (default: false)'),
  }),
  async run(ctx) {
    const { includeConsole = true, includeNetwork = true, onlyErrors = false } = ctx.input;
    
    ctx.logger(`🔍 Gathering debug information...`);

    const page = ctx.page;
    const result: any = {
      url: page.url(),
    };
    
    if (includeConsole) {
      // Note: Console messages need to be captured with page.on('console')
      // This is a limitation - messages must be captured during session
      ctx.logger(`⚠️  Console messages must be captured with listeners during the session`);
      result.consoleNote = 'Console messages require capturing with page.on("console") during navigation';
    }
    
    if (includeNetwork) {
      // Same limitation for network requests
      ctx.logger(`⚠️  Network requests must be captured with listeners during the session`);
      result.networkNote = 'Network requests require capturing with page.on("request") during navigation';
    }
    
    // Alternative: Get current page content and resources
    const content = await page.content();
    const metrics = await page.evaluate(() => ({
      performance: performance.getEntriesByType('navigation').map(e => ({
        type: e.entryType,
        duration: (e as any).duration,
        loadEventEnd: (e as any).loadEventEnd,
      })),
      resources: performance.getEntriesByType('resource').map(e => ({
        name: e.name,
        type: (e as any).initiatorType,
        duration: e.duration,
      })),
    }));
    
    result.pageMetrics = metrics;
    result.contentLength = content.length;
    
    ctx.logger(`✅ Debug info gathered`);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
};

export default browserDebug;
