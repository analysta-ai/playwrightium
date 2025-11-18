#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult, LoggingLevel } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import * as playwright from 'playwright';
import { config as loadDotenv } from 'dotenv';

import type { ActionInputSchema, ActionRunResult, PlaywrightActionDefinition } from './actions/types.js';

interface CliOptions {
  actionRoot: string;
  baseDir: string;
  verbose: boolean;
  headless: boolean;
  browser: string;
}

const CLI_OPTIONS = parseCliOptions();
const ACTION_ROOT = CLI_OPTIONS.actionRoot!;
const BASE_DIR = CLI_OPTIONS.baseDir!;
const VERBOSE = CLI_OPTIONS.verbose;
const HEADLESS = CLI_OPTIONS.headless;
const BUILTIN_ACTIONS_DIR = path.join(__dirname, 'actions');
const USER_ACTIONS_DIR = path.join(ACTION_ROOT, 'actions');

// Load environment variables from .env file in the repository root
loadDotenv({ path: path.join(BASE_DIR, '.env') });

interface LoadedAction {
  definition: PlaywrightActionDefinition;
  filePath: string;
  relativePath: string;
}

let tsRuntimeRegistered = false;

// Persistent browser state
let persistentBrowser: playwright.Browser | null = null;
let persistentContext: playwright.BrowserContext | null = null;
let persistentPage: playwright.Page | null = null;

/**
 * Interpolate environment variables in a string using ${{VAR_NAME}} syntax
 * @param text - Text containing ${{VAR_NAME}} placeholders
 * @returns Text with placeholders replaced by environment variable values
 */
function interpolateSecrets(text: string): string {
  return text.replace(/\$\{\{([^}]+)\}\}/g, (_, varName) => {
    const value = process.env[varName.trim()];
    if (value === undefined) {
      throw new Error(`Environment variable "${varName.trim()}" is not defined. Make sure it's set in .env file at repository root`);
    }
    return value;
  });
}

/**
 * Deep interpolate secrets in an object (recursively handles nested objects and arrays)
 */
function interpolateSecretsInObject(obj: any): any {
  if (typeof obj === 'string') {
    return interpolateSecrets(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(interpolateSecretsInObject);
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = interpolateSecretsInObject(obj[key]);
    }
    return result;
  }
  return obj;
}

async function handleSeedCommand() {
  const args = process.argv.slice(2);
  let loopType: 'copilot' | 'claude' | null = null;

  // Parse --loop argument
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--loop=')) {
      const value = arg.split('=')[1];
      if (value === 'copilot' || value === 'claude') {
        loopType = value;
      }
    } else if (arg === '--loop') {
      const value = args[i + 1];
      if (value === 'copilot' || value === 'claude') {
        loopType = value;
        i++;
      }
    }
  }

  if (!loopType) {
    console.error('Error: --loop parameter is required. Use: playwrightium seed --loop=copilot or --loop=claude');
    process.exit(1);
  }

  const cwd = process.cwd();
  console.log(`🌱 Seeding Playwrightium ${loopType} configuration in ${cwd}...`);

  try {
    if (loopType === 'copilot') {
      await seedCopilot(cwd);
    } else {
      await seedClaude(cwd);
    }
    console.log('✅ Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function seedCopilot(cwd: string) {
  const chatmodesDir = path.join(cwd, '.github', 'chatmodes');
  const promptsDir = path.join(cwd, '.github', 'prompts');

  // Create directories
  await fs.mkdir(chatmodesDir, { recursive: true });
  await fs.mkdir(promptsDir, { recursive: true });

  const srcPromptsDir = path.join(__dirname, 'prompts');
  const srcChatmodesDir = path.join(__dirname, 'chatmodes');
  
  // Copy prompts with correct naming: *.prompt.md
  const shortcutPrompt = await fs.readFile(path.join(srcPromptsDir, 'create-shortcut.md'), 'utf-8');
  await fs.writeFile(
    path.join(promptsDir, 'create-playwrightium-shortcut.prompt.md'),
    shortcutPrompt
  );
  console.log(`  📄 Created ${path.relative(cwd, path.join(promptsDir, 'create-playwrightium-shortcut.prompt.md'))}`);

  const scriptPrompt = await fs.readFile(path.join(srcPromptsDir, 'create-script.md'), 'utf-8');
  await fs.writeFile(
    path.join(promptsDir, 'create-playwrightium-script.prompt.md'),
    scriptPrompt
  );
  console.log(`  📄 Created ${path.relative(cwd, path.join(promptsDir, 'create-playwrightium-script.prompt.md'))}`);

  // Copy chatmodes with correct naming: *.chatmode.md
  const testDeveloperChatmode = await fs.readFile(path.join(srcChatmodesDir, 'test-developer.md'), 'utf-8');
  await fs.writeFile(
    path.join(chatmodesDir, 'test-developer.chatmode.md'),
    testDeveloperChatmode
  );
  console.log(`  🤖 Created ${path.relative(cwd, path.join(chatmodesDir, 'test-developer.chatmode.md'))}`);

  const testExecutorChatmode = await fs.readFile(path.join(srcChatmodesDir, 'test-executor.md'), 'utf-8');
  await fs.writeFile(
    path.join(chatmodesDir, 'test-executor.chatmode.md'),
    testExecutorChatmode
  );
  console.log(`  🤖 Created ${path.relative(cwd, path.join(chatmodesDir, 'test-executor.chatmode.md'))}`);
}

async function seedClaude(cwd: string) {
  const agentsDir = path.join(cwd, '.claude', 'agents');
  const skillsDir = path.join(cwd, '.claude', 'skills');

  // Create directories
  await fs.mkdir(agentsDir, { recursive: true });
  await fs.mkdir(skillsDir, { recursive: true });

  const srcPromptsDir = path.join(__dirname, 'prompts');
  const srcChatmodesDir = path.join(__dirname, 'chatmodes');
  
  // Copy prompts to skills directory
  const shortcutPrompt = await fs.readFile(path.join(srcPromptsDir, 'create-shortcut.md'), 'utf-8');
  await fs.writeFile(
    path.join(skillsDir, 'create-playwrightium-shortcut.md'),
    shortcutPrompt
  );
  console.log(`  📄 Created ${path.relative(cwd, path.join(skillsDir, 'create-playwrightium-shortcut.md'))}`);

  const scriptPrompt = await fs.readFile(path.join(srcPromptsDir, 'create-script.md'), 'utf-8');
  await fs.writeFile(
    path.join(skillsDir, 'create-playwrightium-script.md'),
    scriptPrompt
  );
  console.log(`  📄 Created ${path.relative(cwd, path.join(skillsDir, 'create-playwrightium-script.md'))}`);

  // Copy chatmodes/agents
  const testDeveloperChatmode = await fs.readFile(path.join(srcChatmodesDir, 'test-developer.md'), 'utf-8');
  await fs.writeFile(
    path.join(agentsDir, 'test-developer.md'),
    testDeveloperChatmode
  );
  console.log(`  🤖 Created ${path.relative(cwd, path.join(agentsDir, 'test-developer.md'))}`);

  const testExecutorChatmode = await fs.readFile(path.join(srcChatmodesDir, 'test-executor.md'), 'utf-8');
  await fs.writeFile(
    path.join(agentsDir, 'test-executor.md'),
    testExecutorChatmode
  );
  console.log(`  🤖 Created ${path.relative(cwd, path.join(agentsDir, 'test-executor.md'))}`);
}

async function main() {
  const pkg = await readPackageJson();
  await ensureActionWorkspace();
  const server = new McpServer({
    name: pkg.name ?? 'playwrightium',
    version: pkg.version ?? '0.1.0',
    description: pkg.description ?? 'Reusable Playwright shortcuts surfaced via MCP.'
  });
  
  // Load built-in actions from src/actions
  const builtinActions = await loadActionsFrom(BUILTIN_ACTIONS_DIR, 'built-in', server);
  // Load user custom actions from .playwright-mcp/actions
  const userActions = await loadActionsFrom(USER_ACTIONS_DIR, 'user', server);
  const actions = [...builtinActions, ...userActions];

  registerActions(server, actions);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  const builtinCount = builtinActions.length;
  const userCount = userActions.length;
  
  await reportVerbose(server, `Discovered ${builtinCount} built-in + ${userCount} user action(s).`);
  await server.sendLoggingMessage({
    level: 'info',
    data: `[playwrighium] User action root: ${ACTION_ROOT}`
  });
  await server.sendLoggingMessage({
    level: 'info',
    data: `[playwrighium] Built-in actions: ${BUILTIN_ACTIONS_DIR}`
  });
  await server.sendLoggingMessage({
    level: 'info',
    data: `[playwrighium] Ready with ${actions.length} total action${actions.length === 1 ? '' : 's'} (${builtinCount} built-in, ${userCount} user).`
  });
}

// Check if this is a CLI command (seed) or MCP server mode
const args = process.argv.slice(2);
const command = args[0];

if (command === 'seed') {
  handleSeedCommand().catch(error => {
    console.error('[playwrightium] Seed command failed:', error);
    process.exit(1);
  });
} else {
  // Normal MCP server mode
  main().catch(error => {
    console.error('[playwrightium] Fatal error', error);
    process.exit(1);
  });
}

async function readPackageJson() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function ensureActionWorkspace() {
  await fs.mkdir(ACTION_ROOT, { recursive: true });
  await fs.mkdir(USER_ACTIONS_DIR, { recursive: true });
}

async function loadActionsFrom(dir: string, source: string, server?: McpServer): Promise<LoadedAction[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const actions: LoadedAction[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!isSupportedActionFile(entry.name)) continue;

      const actionPath = path.join(dir, entry.name);
      try {
        const definition = await importActionDefinition(actionPath);
        actions.push({
          definition,
          filePath: actionPath,
          relativePath: `[${source}] ${entry.name}`
        });
        if (server) {
          await reportVerbose(server, `Loaded ${source} action: ${definition.name}`);
        }
      } catch (error) {
        console.error(`[playwrighium] Failed to load ${source} action ${entry.name}:`, error);
        if (server) {
          void reportVerbose(server, `Failed to load ${source} action ${entry.name}: ${(error as Error).message}`);
        }
      }
    }

    return actions;
  } catch (error) {
    // Directory doesn't exist or can't be read
    if (server) {
      await reportVerbose(server, `Could not load ${source} actions from ${dir}: ${(error as Error).message}`);
    }
    return [];
  }
}

function isSupportedActionFile(filename: string) {
  // Exclude files that are not actions
  const excludedFiles = ['types.ts', 'types.js', 'types.d.ts', 'index.ts', 'index.js'];
  if (excludedFiles.includes(filename)) {
    return false;
  }
  
  return ['.ts', '.tsx', '.js', '.cjs', '.mjs'].includes(path.extname(filename));
}

async function importActionDefinition(actionPath: string): Promise<PlaywrightActionDefinition> {
  const ext = path.extname(actionPath);
  if (ext === '.ts' || ext === '.tsx') {
    await ensureTsRuntime();
  }

  const imported = await import(actionPath);
  const candidate = (imported?.default ?? imported?.action ?? imported) as PlaywrightActionDefinition | undefined;

  if (!candidate || typeof candidate !== 'object' || typeof candidate.run !== 'function' || typeof candidate.name !== 'string') {
    throw new Error('Action modules must export an object with at least name and run properties.');
  }

  return candidate;
}

async function ensureTsRuntime() {
  if (tsRuntimeRegistered) return;

  if (!process.env.TS_NODE_COMPILER_OPTIONS) {
    process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
      module: 'CommonJS',
      moduleResolution: 'node',
      esModuleInterop: true
    });
  }

  await import('ts-node/register/transpile-only');
  tsRuntimeRegistered = true;
}

function registerActions(server: McpServer, actions: LoadedAction[]) {
  if (!actions.length) {
    console.warn('[playwrighium] No actions found under .playwright-mcp/actions');
    void reportVerbose(server, 'No actions registered.');
  }

  for (const action of actions) {
    const inputShape = normalizeInputSchema(action.definition.inputSchema) ?? {};

    server.registerTool(action.definition.name, {
      title: action.definition.title ?? action.definition.name,
      description: action.definition.description ?? `Playwright shortcut from ${action.relativePath}`,
      inputSchema: inputShape
    }, async (args: Record<string, unknown> = {}, extra) => {
      return runAction(action, args, server, extra.sessionId);
    });
  }
}

async function loadPromptTemplate(filename: string): Promise<string> {
  const promptPath = path.join(__dirname, 'prompts', filename);
  return await fs.readFile(promptPath, 'utf-8');
}

function registerPrompts(server: McpServer) {
  // Prompt for creating shortcuts
  server.registerPrompt('create-shortcut', {
    description: 'Guide to create a YAML shortcut file from a user task. Always test the workflow manually with browser-session first, use secrets from .env for credentials, then create the YAML file.',
    argsSchema: {
      task: z.string().describe('The task or workflow that the shortcut should automate')
    }
  }, async (args) => {
    const task = args.task;
    const template = await loadPromptTemplate('create-shortcut.md');
    const text = template.replace('{{task}}', task);
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text
          }
        }
      ]
    };
  });

  // Prompt for creating scripts
  server.registerPrompt('create-script', {
    description: 'Guide to create a TypeScript script from a user task. Always test the automation manually with browser-session first, use ctx.env for credentials, then create the TypeScript file.',
    argsSchema: {
      task: z.string().describe('The task or automation that the script should perform')
    }
  }, async (args) => {
    const task = args.task;
    const template = await loadPromptTemplate('create-script.md');
    const text = template.replace('{{task}}', task);
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text
          }
        }
      ]
    };
  });
}

function normalizeInputSchema(schema?: ActionInputSchema): z.ZodRawShape | undefined {
  if (!schema) return undefined;
  if (schema instanceof z.ZodObject) {
    return schema.shape;
  }
  return schema;
}

async function runAction(action: LoadedAction, args: Record<string, unknown>, server: McpServer, sessionId?: string): Promise<CallToolResult> {
  let browserName = action.definition.browser ?? CLI_OPTIONS.browser;
  let channel: string | undefined = undefined;
  
  // Map browser names to Playwright browser types and channels
  const browserLower = browserName.toLowerCase();
  if (browserLower === 'chrome') {
    browserName = 'chromium';
    channel = 'chrome';
  } else if (browserLower === 'edge') {
    browserName = 'chromium';
    channel = 'msedge';
  } else if (browserLower === 'safari') {
    browserName = 'webkit';
  }
  
  const launcher = (playwright as Record<string, unknown>)[browserName];
  if (!launcher) {
    return toolError(`Unsupported browser: ${browserName}. Supported: chromium, chrome, firefox, webkit, edge`);
  }

  const browserType = launcher as playwright.BrowserType<playwright.Browser>;
  const logger = createActionLogger(server, action.definition.name, sessionId);

  // Reuse persistent browser or create new one
  let browser: playwright.Browser;
  let context: playwright.BrowserContext;
  let page: playwright.Page;

  if (persistentBrowser && persistentContext && persistentPage) {
    await logger(`Reusing existing browser session`, 'debug');
    browser = persistentBrowser;
    context = persistentContext;
    page = persistentPage;
  } else {
    await logger(`Launching ${channel || browserName}`, 'debug');
    // Use global HEADLESS setting if action doesn't specify, default to headed (false)
    const headlessMode = action.definition.headless ?? HEADLESS;
    const launchOptions: playwright.LaunchOptions = { headless: headlessMode };
    if (channel) {
      launchOptions.channel = channel as any;
    }
    browser = await browserType.launch(launchOptions);
    context = await browser.newContext(action.definition.contextOptions);
    page = await context.newPage();
    
    // Store persistent references
    persistentBrowser = browser;
    persistentContext = context;
    persistentPage = page;
  }

  try {
    // Interpolate secrets in input arguments
    const interpolatedArgs = interpolateSecretsInObject(args);
    
    const result = await action.definition.run({
      browser,
      context,
      page,
      input: interpolatedArgs,
      logger,
      env: process.env as Record<string, string | undefined>,
      interpolateSecrets,
      baseDir: BASE_DIR
    }, { playwright });

    // If close-browser was called, clear persistent references
    if (action.definition.name === 'close-browser') {
      persistentBrowser = null;
      persistentContext = null;
      persistentPage = null;
      await logger(`Persistent browser references cleared`, 'debug');
    }

    return normalizeActionResult(action.definition.name, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logger(`Action failed: ${message}`, 'error');
    return {
      content: [
        { type: 'text', text: `Action ${action.definition.name} failed: ${message}` }
      ],
      isError: true
    };
  }
  // Don't close browser - keep it persistent!
}

async function disposeResource(resource: { close: () => Promise<unknown> } | undefined) {
  if (!resource) return;
  try {
    await resource.close();
  } catch (error) {
    console.warn('[playwrighium] Failed to dispose resource', error);
  }
}

function normalizeActionResult(actionName: string, result: ActionRunResult): CallToolResult {
  if (!result) {
    return { content: [{ type: 'text', text: `${actionName} completed.` }] };
  }

  if (typeof result === 'string') {
    return { content: [{ type: 'text', text: result }] };
  }

  if (isCallToolResult(result)) {
    return result;
  }

  const content = [...(result.content ?? [])];
  if (result.message) {
    content.push({ type: 'text', text: result.message });
  }

  if (!content.length) {
    content.push({ type: 'text', text: `${actionName} finished.` });
  }

  const normalized: CallToolResult = { content };

  if (result.structuredContent) {
    normalized.structuredContent = result.structuredContent;
  }

  if (typeof result.isError === 'boolean') {
    normalized.isError = result.isError;
  }

  return normalized;
}

function isCallToolResult(value: unknown): value is CallToolResult {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as CallToolResult).content));
}

function toolError(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true
  };
}

function createActionLogger(server: McpServer, actionName: string, sessionId?: string) {
  return async (message: string, level: LoggingLevel = 'info') => {
    const formatted = `[${actionName}] ${message}`;
    const severeLevels: LoggingLevel[] = ['error', 'critical', 'alert', 'emergency'];
    if (severeLevels.includes(level)) {
      console.error(formatted);
    } else if (level === 'warning' || level === 'notice') {
      console.warn(formatted);
    }

    if (server.isConnected()) {
      await server.sendLoggingMessage({
        level,
        data: formatted
      }, sessionId);
    }
  };
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const actionAliases = ['--actions', '--actions-dir', '--workspace', '-a'];
  const baseAliases = ['--base', '--repo', '--project', '--working-dir', '-C'];
  const verboseAliases = ['--verbose', '-v'];
  const headlessAliases = ['--headless', '-h'];
  const browserAliases = ['--browser', '-b'];

  let actionRoot =
    process.env.PLAYWRIGHIUM_ACTIONS_DIR ??
    process.env.PLAYWRIGHIUM_ROOT ??
    undefined;

  let baseDir =
    process.env.PLAYWRIGHIUM_BASE_DIR ??
    process.env.PLAYWRIGHIUM_PROJECT ??
    undefined;

  let verbose = process.env.PLAYWRIGHIUM_VERBOSE === '1';
  
  // Default to headed browser (headless: false), unless explicitly set
  let headless = process.env.PLAYWRIGHIUM_HEADLESS === '1';
  
  // Default browser: chromium (Chrome). Options: chromium, firefox, webkit
  let browser = process.env.PLAYWRIGHIUM_BROWSER ?? 'chromium';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const [key, valueFromAssignment] = arg.split('=', 2);

    if (actionAliases.includes(key)) {
      const value =
        valueFromAssignment !== undefined ? valueFromAssignment : args[++i];
      if (value) {
        actionRoot = value;
      }
      continue;
    }

    if (baseAliases.includes(key)) {
      const value =
        valueFromAssignment !== undefined ? valueFromAssignment : args[++i];
      if (value) {
        baseDir = value;
      }
      continue;
    }

    if (verboseAliases.includes(key)) {
      verbose = true;
      continue;
    }

    if (headlessAliases.includes(key)) {
      headless = true;
      continue;
    }

    if (browserAliases.includes(key)) {
      const value =
        valueFromAssignment !== undefined ? valueFromAssignment : args[++i];
      if (value) {
        browser = value;
      }
      continue;
    }
  }

  const resolvedBase = path.resolve(baseDir ?? process.cwd());
  const resolvedActions =
    actionRoot && actionRoot.length > 0
      ? path.isAbsolute(actionRoot)
        ? path.normalize(actionRoot)
        : path.resolve(resolvedBase, actionRoot)
      : path.join(resolvedBase, '.playwright-mcp');

  return { actionRoot: resolvedActions, baseDir: resolvedBase, verbose, headless, browser };
}

async function reportVerbose(server: McpServer, message: string) {
  if (!VERBOSE) return;

  await server.sendLoggingMessage({
    level: 'info',
    data: `[playwrighium] ${message}`
  });
}
