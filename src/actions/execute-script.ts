import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import type { PlaywrightActionDefinition } from './types';

/**
 * Execute a TypeScript/JavaScript script file in the browser context
 * 
 * Scripts are coded automation files that have full access to the Playwright API.
 * They receive the browser context (browser, context, page) and can perform complex operations.
 * 
 * Example script file (.playwright-mcp/scripts/scrape-data.ts):
 * ```typescript
 * export default async function({ page, context, browser }) {
 *   await page.goto('https://example.com');
 *   const data = await page.evaluate(() => {
 *     return Array.from(document.querySelectorAll('h1')).map(h => h.textContent);
 *   });
 *   return { scraped: data };
 * }
 * ```
 */
const executeScript: PlaywrightActionDefinition = {
  name: 'execute-script',
  title: 'Execute Script (TS/JS)',
  description: 'Execute a TypeScript or JavaScript file in the browser context. Scripts receive full Playwright API access (page, context, browser).',
  inputSchema: z.object({
    scriptPath: z.string().describe('Path to the TS/JS script file (absolute or relative to .playwright-mcp/scripts/)'),
    scriptArgs: z.record(z.any()).optional().describe('Optional arguments to pass to the script'),
  }),
  async run(ctx, helpers) {
    const { scriptPath, scriptArgs = {} } = ctx.input;

    ctx.logger(`📜 Loading script: ${scriptPath}`);

    // Resolve the script path
    const workspaceRoot = ctx.baseDir;
    
    let resolvedPath = scriptPath;
    if (!path.isAbsolute(scriptPath)) {
      // Check in .playwright-mcp/scripts first
      const scriptsDir = path.join(workspaceRoot, '.playwright-mcp', 'scripts');
      const scriptInDir = path.join(scriptsDir, scriptPath);
      
      if (fs.existsSync(scriptInDir)) {
        resolvedPath = scriptInDir;
      } else if (fs.existsSync(path.join(workspaceRoot, scriptPath))) {
        resolvedPath = path.join(workspaceRoot, scriptPath);
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Script file not found: ${resolvedPath}\nSearched in: .playwright-mcp/scripts/ and workspace root`);
    }

    ctx.logger(`✅ Loading script from: ${resolvedPath}`);

    // For TypeScript files, use ts-node to execute
    let scriptModule: any;
    
    try {
      if (resolvedPath.endsWith('.ts')) {
        // Register ts-node for TypeScript execution
        require('ts-node').register({
          transpileOnly: true,
          compilerOptions: {
            module: 'commonjs',
            target: 'es2020',
          },
        });
      }
      
      // Clear module cache to ensure fresh execution
      delete require.cache[require.resolve(resolvedPath)];
      
      scriptModule = require(resolvedPath);
    } catch (error: any) {
      throw new Error(`Failed to load script: ${error.message}`);
    }

    // Get the default export or the module itself
    const scriptFn = scriptModule.default || scriptModule;
    
    if (typeof scriptFn !== 'function') {
      throw new Error('Script must export a default function');
    }

    ctx.logger(`▶️  Executing script...`);

    // Execute the script with browser context
    let scriptResult: any;
    
    try {
      scriptResult = await scriptFn({
        page: ctx.page,
        context: ctx.context,
        browser: ctx.browser,
        args: scriptArgs,
        logger: ctx.logger,
        playwright: helpers.playwright,
        env: ctx.env,
        interpolateSecrets: ctx.interpolateSecrets,
      });
    } catch (error: any) {
      ctx.logger(`❌ Script execution failed: ${error.message}`);
      throw error;
    }

    ctx.logger(`✅ Script completed successfully`);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          scriptPath: resolvedPath,
          result: scriptResult,
        }, null, 2),
      }],
    };
  },
};

export default executeScript;
