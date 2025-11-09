import type { Browser, BrowserContext, BrowserContextOptions, Page } from 'playwright';
import type { CallToolResult, LoggingLevel } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

export interface ActionContext<TInput = Record<string, unknown>> {
  input: TInput;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  logger: (message: string, level?: LoggingLevel) => void | Promise<void>;
  /** Environment variables loaded from .env file */
  env: Record<string, string | undefined>;
  /** Helper to interpolate secrets in strings using ${{VAR_NAME}} syntax */
  interpolateSecrets: (text: string) => string;
  /** Base directory (repository root) */
  baseDir: string;
}

export interface ActionResponse {
  message?: string;
  content?: CallToolResult['content'];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export type ActionRunResult = void | string | ActionResponse | CallToolResult;

export type ActionInputSchema = z.ZodRawShape | z.ZodObject<any>;

export type InferActionInput<TSchema extends ActionInputSchema | undefined> =
  TSchema extends z.ZodObject<infer Shape>
    ? z.infer<z.ZodObject<Shape>>
    : TSchema extends z.ZodRawShape
      ? z.infer<z.ZodObject<TSchema>>
      : Record<string, unknown>;

export interface PlaywrightActionDefinition<TSchema extends ActionInputSchema | undefined = ActionInputSchema> {
  /** Name that will be exposed as the MCP tool identifier. */
  name: string;
  /** Optional human friendly name shown in clients. */
  title?: string;
  /** Description used by models to understand what the action does. */
  description?: string;
  /** Which browser engine to spin up for the shortcut. Defaults to Chromium. */
  browser?: BrowserEngine;
  /** Whether the Playwright browser should run headless. Defaults to true. */
  headless?: boolean;
  /** Browser context overrides that will be passed to browser.newContext(). */
  contextOptions?: BrowserContextOptions;
  /** Optional Zod schema describing the action arguments. */
  inputSchema?: TSchema;
  /** The actual sequence of steps executed by the shortcut. */
  run: (
    ctx: ActionContext<InferActionInput<TSchema>>,
    helpers: { playwright: typeof import('playwright') }
  ) => Promise<ActionRunResult> | ActionRunResult;
}
