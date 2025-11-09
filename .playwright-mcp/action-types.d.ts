import type { Browser, BrowserContext, BrowserContextOptions, Page } from 'playwright';
import type { CallToolResult, LoggingLevel } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

export interface ActionContext<TInput = Record<string, unknown>> {
  input: TInput;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  logger: (message: string, level?: LoggingLevel) => void | Promise<void>;
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
  name: string;
  title?: string;
  description?: string;
  browser?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  contextOptions?: BrowserContextOptions;
  inputSchema?: TSchema;
  run: (
    ctx: ActionContext<InferActionInput<TSchema>>,
    helpers: { playwright: typeof import('playwright') }
  ) => Promise<ActionRunResult> | ActionRunResult;
}
