import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import type { PlaywrightActionDefinition } from './types';

/**
 * Execute a YAML shortcut file containing browser commands
 * 
 * Shortcuts are simple YAML files that define sequences of browser commands.
 * They run in a single browser session and can be reused across different contexts.
 * 
 * Example shortcut file (.playwright-mcp/shortcuts/login-github.yaml):
 * ```yaml
 * commands:
 *   - type: navigate
 *     url: https://github.com/login
 *   - type: fill
 *     selector: "#login_field"
 *     value: myusername
 *   - type: fill
 *     selector: "#password"
 *     value: mypassword
 *   - type: click
 *     selector: 'input[type="submit"]'
 *   - type: wait_for_selector
 *     selector: '[data-login="true"]'
 * ```
 */
const executeShortcut: PlaywrightActionDefinition = {
  name: 'execute-shortcut',
  title: 'Execute Shortcut (YAML)',
  description: 'Execute a YAML shortcut file containing browser automation commands. Shortcuts are reusable command sequences stored as YAML files.',
  inputSchema: z.object({
    shortcutPath: z.string().describe('Path to the YAML shortcut file (absolute or relative to .playwright-mcp/shortcuts/)'),
  }),
  async run(ctx, helpers) {
    const { shortcutPath } = ctx.input;
    const yaml = await import('yaml');

    ctx.logger(`📋 Loading shortcut: ${shortcutPath}`);

    // Resolve the shortcut path using the base directory
    const workspaceRoot = ctx.baseDir;
    
    let resolvedPath = shortcutPath;
    if (!path.isAbsolute(shortcutPath)) {
      // Check in .playwright-mcp/shortcuts first
      const shortcutsDir = path.join(workspaceRoot, '.playwright-mcp', 'shortcuts');
      const shortcutInDir = path.join(shortcutsDir, shortcutPath);
      
      if (fs.existsSync(shortcutInDir)) {
        resolvedPath = shortcutInDir;
      } else if (fs.existsSync(path.join(workspaceRoot, shortcutPath))) {
        resolvedPath = path.join(workspaceRoot, shortcutPath);
      }
    }

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Shortcut file not found: ${resolvedPath}\nSearched in: .playwright-mcp/shortcuts/ and workspace root`);
    }

    // Read and parse YAML
    const yamlContent = fs.readFileSync(resolvedPath, 'utf-8');
    
    // Interpolate secrets before parsing YAML
    const interpolatedYaml = ctx.interpolateSecrets(yamlContent);
    
    let shortcutData: any;
    
    try {
      shortcutData = yaml.parse(interpolatedYaml);
    } catch (error: any) {
      throw new Error(`Failed to parse YAML shortcut: ${error.message}`);
    }

    if (!shortcutData?.commands || !Array.isArray(shortcutData.commands)) {
      throw new Error('Shortcut file must contain a "commands" array');
    }

    ctx.logger(`✅ Loaded ${shortcutData.commands.length} commands from shortcut`);

    // Execute commands in this browser session
    const results: any[] = [];
    
    for (let i = 0; i < shortcutData.commands.length; i++) {
      const cmd = shortcutData.commands[i];
      ctx.logger(`[${i + 1}/${shortcutData.commands.length}] Executing: ${cmd.type}`);
      
      try {
        let result: any;
        
        switch (cmd.type) {
          case 'navigate':
            await ctx.page.goto(cmd.url, { waitUntil: cmd.waitUntil || 'load' });
            result = { url: ctx.page.url() };
            break;
            
          case 'click':
            await ctx.page.locator(cmd.selector).click();
            result = { clicked: cmd.selector };
            break;
            
          case 'fill':
            await ctx.page.locator(cmd.selector).fill(cmd.value);
            result = { filled: cmd.selector };
            break;
            
          case 'type':
            await ctx.page.locator(cmd.selector).pressSequentially(cmd.value, { delay: cmd.delay || 100 });
            result = { typed: cmd.selector };
            break;
            
          case 'press_key':
            await ctx.page.keyboard.press(cmd.key);
            result = { pressed: cmd.key };
            break;
            
          case 'wait_for_selector':
            await ctx.page.waitForSelector(cmd.selector, { timeout: cmd.timeout });
            result = { found: cmd.selector };
            break;
            
          case 'wait_for_text':
            await ctx.page.waitForSelector(`text=${cmd.text}`, { timeout: cmd.timeout });
            result = { found: cmd.text };
            break;
            
          case 'wait_for_timeout':
            await ctx.page.waitForTimeout(cmd.duration);
            result = { waited: `${cmd.duration}ms` };
            break;
            
          case 'screenshot':
            const screenshotPath = cmd.path || `screenshot-${Date.now()}.png`;
            await ctx.page.screenshot({ path: screenshotPath, fullPage: cmd.fullPage });
            result = { screenshot: screenshotPath };
            break;
            
          case 'get_text':
            const text = await ctx.page.locator(cmd.selector).textContent();
            result = { text };
            break;
            
          case 'get_url':
            result = { url: ctx.page.url() };
            break;
            
          case 'get_title':
            result = { title: await ctx.page.title() };
            break;
            
          default:
            throw new Error(`Unknown command type: ${cmd.type}`);
        }
        
        results.push({ step: i + 1, command: cmd.type, ...result });
        
      } catch (error: any) {
        ctx.logger(`❌ Error at step ${i + 1}: ${error.message}`);
        throw error;
      }
    }

    ctx.logger(`✅ Successfully executed ${shortcutData.commands.length} commands`);

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          shortcutPath: resolvedPath,
          commandsExecuted: shortcutData.commands.length,
          results,
        }, null, 2),
      }],
    };
  },
};

export default executeShortcut;
