import { z } from 'zod';
import type { PlaywrightActionDefinition } from './types';

/**
 * A comprehensive action that wraps @playwright/mcp capabilities
 * Allows you to execute multiple browser commands in a single session
 */
const browserSession: PlaywrightActionDefinition = {
  name: 'browser-session',
  title: 'Browser Session',
  description: 'Execute multiple browser commands (navigate, click, type, screenshot, etc.) in a single persistent session. Supports all common Playwright operations.',
  inputSchema: z.object({
    commands: z.array(z.object({
      type: z.enum([
        'navigate',
        'navigate_back',
        'click',
        'type',
        'fill',
        'press_key',
        'hover',
        'select_option',
        'drag',
        'wait_for_text',
        'wait_for_timeout',
        'wait_for_selector',
        'screenshot',
        'evaluate',
        'get_text',
        'get_attribute',
        'check',
        'uncheck',
        'upload_file',
        'clear',
        'scroll',
        'reload',
        'get_url',
        'get_title'
      ]),
      
      // Navigation
      url: z.string().optional().describe('URL for navigate'),
      
      // Selectors
      selector: z.string().optional().describe('CSS selector, text content, or role'),
      
      // Input values
      value: z.string().optional().describe('Value to type, fill, or select'),
      text: z.string().optional().describe('Text to wait for or search'),
      
      // Click options
      button: z.enum(['left', 'right', 'middle']).optional(),
      clickCount: z.number().optional().describe('Number of clicks (1=single, 2=double)'),
      
      // Keyboard
      key: z.string().optional().describe('Key to press (Enter, Tab, ArrowDown, etc.)'),
      
      // Drag
      targetSelector: z.string().optional().describe('Target selector for drag operation'),
      
      // Wait options
      timeout: z.number().optional().describe('Timeout in milliseconds'),
      
      // Screenshot options
      path: z.string().optional().describe('Path to save screenshot'),
      fullPage: z.boolean().optional().describe('Capture full scrollable page'),
      
      // Evaluate
      script: z.string().optional().describe('JavaScript to evaluate'),
      
      // Attribute
      attribute: z.string().optional().describe('Attribute name to get'),
      
      // File upload
      files: z.array(z.string()).optional().describe('File paths to upload'),
      
      // Scroll
      x: z.number().optional(),
      y: z.number().optional(),
      
      // General
      description: z.string().optional().describe('Human-readable description of this step')
    })).describe('Array of browser commands to execute in sequence')
  }),
  headless: false,
  async run({ page, input, logger }) {
    const results: any[] = [];
    let stepNumber = 0;

    await logger(`Starting browser session with ${input.commands.length} command(s)`);

    for (const cmd of input.commands) {
      stepNumber++;
      const desc = cmd.description || `${cmd.type} ${cmd.selector || cmd.url || ''}`.trim();
      await logger(`\n[${stepNumber}/${input.commands.length}] ${desc}`);

      try {
        let result: any;

        switch (cmd.type) {
          case 'navigate':
            await page.goto(cmd.url!);
            await page.waitForLoadState('networkidle');
            result = { url: page.url() };
            break;

          case 'navigate_back':
            await page.goBack();
            await page.waitForLoadState('networkidle');
            result = { url: page.url() };
            break;

          case 'click':
            if (cmd.selector) {
              const locator = await getLocator(page, cmd.selector);
              await locator.click({
                button: cmd.button as any,
                clickCount: cmd.clickCount
              });
              result = { clicked: cmd.selector };
            }
            break;

          case 'type':
            if (cmd.selector && cmd.value) {
              const locator = await getLocator(page, cmd.selector);
              await locator.pressSequentially(cmd.value, { delay: 50 });
              result = { typed: cmd.value.length + ' characters' };
            }
            break;

          case 'fill':
            if (cmd.selector && cmd.value !== undefined) {
              const locator = await getLocator(page, cmd.selector);
              await locator.fill(cmd.value);
              result = { filled: cmd.selector };
            }
            break;

          case 'press_key':
            if (cmd.key) {
              await page.keyboard.press(cmd.key);
              result = { pressed: cmd.key };
            }
            break;

          case 'hover':
            if (cmd.selector) {
              const locator = await getLocator(page, cmd.selector);
              await locator.hover();
              result = { hovered: cmd.selector };
            }
            break;

          case 'select_option':
            if (cmd.selector && cmd.value) {
              await page.selectOption(cmd.selector, cmd.value);
              result = { selected: cmd.value };
            }
            break;

          case 'drag':
            if (cmd.selector && cmd.targetSelector) {
              await page.dragAndDrop(cmd.selector, cmd.targetSelector);
              result = { dragged: `${cmd.selector} to ${cmd.targetSelector}` };
            }
            break;

          case 'wait_for_text':
            if (cmd.text) {
              await page.getByText(cmd.text).waitFor({ timeout: cmd.timeout });
              result = { found: cmd.text };
            }
            break;

          case 'wait_for_timeout':
            await page.waitForTimeout(cmd.timeout || 1000);
            result = { waited: cmd.timeout || 1000 + 'ms' };
            break;

          case 'wait_for_selector':
            if (cmd.selector) {
              await page.waitForSelector(cmd.selector, { timeout: cmd.timeout });
              result = { found: cmd.selector };
            }
            break;

          case 'screenshot':
            const screenshotPath = cmd.path || `.playwright-mcp/screenshot-${Date.now()}.png`;
            await page.screenshot({
              path: screenshotPath,
              fullPage: cmd.fullPage
            });
            result = { screenshot: screenshotPath };
            await logger(`  📸 Saved to: ${screenshotPath}`);
            break;

          case 'evaluate':
            if (cmd.script) {
              result = await page.evaluate(cmd.script);
              await logger(`  📊 Result: ${JSON.stringify(result)}`);
            }
            break;

          case 'get_text':
            if (cmd.selector) {
              const locator = await getLocator(page, cmd.selector);
              result = { text: await locator.textContent() };
              await logger(`  📝 Text: ${result.text}`);
            }
            break;

          case 'get_attribute':
            if (cmd.selector && cmd.attribute) {
              const locator = await getLocator(page, cmd.selector);
              result = { [cmd.attribute]: await locator.getAttribute(cmd.attribute) };
              await logger(`  🏷️  ${cmd.attribute}: ${result[cmd.attribute]}`);
            }
            break;

          case 'check':
            if (cmd.selector) {
              const locator = await getLocator(page, cmd.selector);
              await locator.check();
              result = { checked: cmd.selector };
            }
            break;

          case 'uncheck':
            if (cmd.selector) {
              const locator = await getLocator(page, cmd.selector);
              await locator.uncheck();
              result = { unchecked: cmd.selector };
            }
            break;

          case 'upload_file':
            if (cmd.selector && cmd.files) {
              await page.setInputFiles(cmd.selector, cmd.files);
              result = { uploaded: cmd.files.length + ' file(s)' };
            }
            break;

          case 'clear':
            if (cmd.selector) {
              const locator = await getLocator(page, cmd.selector);
              await locator.clear();
              result = { cleared: cmd.selector };
            }
            break;

          case 'scroll':
            await page.evaluate(({ x, y }) => {
              window.scrollTo(x || 0, y || 0);
            }, { x: cmd.x || 0, y: cmd.y || 0 });
            result = { scrolled: { x: cmd.x, y: cmd.y } };
            break;

          case 'reload':
            await page.reload();
            await page.waitForLoadState('networkidle');
            result = { reloaded: page.url() };
            break;

          case 'get_url':
            result = { url: page.url() };
            await logger(`  🔗 URL: ${result.url}`);
            break;

          case 'get_title':
            result = { title: await page.title() };
            await logger(`  📄 Title: ${result.title}`);
            break;
        }

        results.push({
          step: stepNumber,
          type: cmd.type,
          success: true,
          result
        });
        
        await logger(`  ✅ Success`);

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await logger(`  ❌ Error: ${errorMsg}`);
        results.push({
          step: stepNumber,
          type: cmd.type,
          success: false,
          error: errorMsg
        });
        
        // Optionally continue on error or break
        // throw error; // Uncomment to stop on first error
      }
    }

    const successCount = results.filter(r => r.success).length;
    await logger(`\n✨ Session complete: ${successCount}/${results.length} commands succeeded`);

    return {
      message: `Browser session completed: ${successCount}/${results.length} commands succeeded`,
      structuredContent: {
        totalCommands: results.length,
        succeeded: successCount,
        failed: results.length - successCount,
        finalUrl: page.url(),
        results
      }
    };
  }
};

// Helper function to get locator by various strategies
async function getLocator(page: any, selector: string) {
  // Try different strategies
  // 1. CSS selector
  if (selector.match(/^[.#[]/) || selector.includes('>') || selector.includes('+')) {
    return page.locator(selector);
  }
  
  // 2. Role-based (button, link, textbox, etc.)
  const roleMatch = selector.match(/^role:(\w+)(?:\[(.+)\])?$/);
  if (roleMatch) {
    const [, role, name] = roleMatch;
    return name ? page.getByRole(role, { name }) : page.getByRole(role);
  }
  
  // 3. Test ID
  if (selector.startsWith('testid:')) {
    return page.getByTestId(selector.replace('testid:', ''));
  }
  
  // 4. Placeholder
  if (selector.startsWith('placeholder:')) {
    return page.getByPlaceholder(selector.replace('placeholder:', ''));
  }
  
  // 5. Label
  if (selector.startsWith('label:')) {
    return page.getByLabel(selector.replace('label:', ''));
  }
  
  // 6. Text content (default for plain text)
  return page.getByText(selector);
}

export default browserSession;
