import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import type { PlaywrightActionDefinition } from './types';

interface TestResultBuilder {
  testCase?: {
    name: string;
    file: string;
    id: string;
    executedAt: string;
    environment: string;
  };
  summary?: {
    status: 'PASSED' | 'FAILED';
    totalSteps: number;
    executedSteps: number;
    passedSteps: number;
    failedSteps: number;
    duration: number;
    browser: string;
  };
  testData?: Record<string, string>;
  steps?: Array<{
    stepNumber: number;
    description: string;
    action: string;
    status: 'PASSED' | 'FAILED';
    duration: number;
    screenshot?: string;
    error?: string | null;
    timestamp: string;
  }>;
  metadata?: {
    generatedBy: string;
    reportVersion: string;
  };
}

/**
 * Create Test Result Record Action
 * Iteratively builds and saves test result JSON files
 * Allows step-by-step construction to avoid large, error-prone JSON generation
 */
const createTestResult: PlaywrightActionDefinition = {
  name: 'create-test-result',
  title: 'Create Test Result Record',
  description: 'Iteratively create or update test result JSON file. Supports step-by-step construction: set test case info, add test data, add steps one by one, set summary, and finalize.',
  inputSchema: z.object({
    testId: z.string().describe('Unique test identifier (e.g., l1_login) - used in filename'),
    action: z.enum(['init', 'set-testcase', 'set-testdata', 'add-step', 'set-summary', 'finalize']).describe('Action to perform: init (start new), set-testcase (test info), set-testdata (env variables), add-step (add test step), set-summary (test results), finalize (save JSON)'),
    
    // Test Case fields (for set-testcase)
    testName: z.string().optional().describe('Test case name'),
    testFile: z.string().optional().describe('Test case file path'),
    environment: z.string().optional().describe('Environment (e.g., staging, dev, prod)'),
    
    // Test Data fields (for set-testdata)
    testData: z.record(z.string()).optional().describe('Test data key-value pairs (environment variables used)'),
    
    // Step fields (for add-step)
    stepNumber: z.number().optional().describe('Step number (sequential)'),
    stepDescription: z.string().optional().describe('Step description'),
    stepAction: z.string().optional().describe('Step action (navigate, click, type, verify, etc.)'),
    stepStatus: z.enum(['PASSED', 'FAILED']).optional().describe('Step execution status'),
    stepDuration: z.number().optional().describe('Step duration in milliseconds'),
    stepScreenshot: z.string().optional().describe('Screenshot path (e.g., screenshots/test-step-1.png)'),
    stepError: z.string().optional().describe('Error message if step failed'),
    
    // Summary fields (for set-summary)
    status: z.enum(['PASSED', 'FAILED']).optional().describe('Overall test status'),
    totalSteps: z.number().optional().describe('Total number of steps'),
    executedSteps: z.number().optional().describe('Number of executed steps'),
    passedSteps: z.number().optional().describe('Number of passed steps'),
    failedSteps: z.number().optional().describe('Number of failed steps'),
    duration: z.number().optional().describe('Total test duration in milliseconds'),
    browser: z.string().optional().describe('Browser used (chromium, firefox, webkit)'),
    
    // Output options
    outputDir: z.string().optional().describe('Output directory (default: test-results/json)'),
  }),
  async run(ctx) {
    const { testId, action: actionType, outputDir = 'test-results/json' } = ctx.input;
    
    const baseDir = ctx.baseDir;
    const outputPath = path.isAbsolute(outputDir) ? outputDir : path.join(baseDir, outputDir);
    const stateFile = path.join(outputPath, `.${testId}.tmp.json`);
    const finalFile = path.join(outputPath, `${testId}-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.json`);

    // Ensure output directory exists
    await fs.mkdir(outputPath, { recursive: true });

    let builder: TestResultBuilder = {};

    // Load existing state for non-init actions
    if (actionType !== 'init') {
      try {
        const stateContent = await fs.readFile(stateFile, 'utf-8');
        builder = JSON.parse(stateContent);
      } catch (err) {
        throw new Error(`Test result state not found for ${testId}. Run with action='init' first.`);
      }
    }

    switch (actionType) {
      case 'init':
        ctx.logger(`🆕 Initializing test result for: ${testId}`);
        builder = {
          testCase: {
            name: '',
            file: '',
            id: testId,
            executedAt: new Date().toISOString(),
            environment: ''
          },
          summary: {
            status: 'PASSED',
            totalSteps: 0,
            executedSteps: 0,
            passedSteps: 0,
            failedSteps: 0,
            duration: 0,
            browser: 'chromium'
          },
          testData: {},
          steps: [],
          metadata: {
            generatedBy: 'Playwrightium Test Executor',
            reportVersion: '1.0.0'
          }
        };
        await fs.writeFile(stateFile, JSON.stringify(builder, null, 2), 'utf-8');
        ctx.logger(`✅ Initialized state file: ${stateFile}`);
        break;

      case 'set-testcase':
        ctx.logger(`📝 Setting test case information for: ${testId}`);
        if (!builder.testCase) {
          throw new Error('Test case not initialized. Run with action=\'init\' first.');
        }
        if (ctx.input.testName) builder.testCase.name = ctx.input.testName;
        if (ctx.input.testFile) builder.testCase.file = ctx.input.testFile;
        if (ctx.input.environment) builder.testCase.environment = ctx.input.environment;
        await fs.writeFile(stateFile, JSON.stringify(builder, null, 2), 'utf-8');
        ctx.logger(`✅ Updated test case: ${builder.testCase.name}`);
        break;

      case 'set-testdata':
        ctx.logger(`📊 Setting test data for: ${testId}`);
        if (!builder.testData) builder.testData = {};
        if (ctx.input.testData) {
          builder.testData = { ...builder.testData, ...ctx.input.testData };
        }
        await fs.writeFile(stateFile, JSON.stringify(builder, null, 2), 'utf-8');
        ctx.logger(`✅ Updated test data (${Object.keys(builder.testData || {}).length} keys)`);
        break;

      case 'add-step':
        ctx.logger(`➕ Adding step ${ctx.input.stepNumber || '?'} for: ${testId}`);
        if (!builder.steps) builder.steps = [];
        
        const step = {
          stepNumber: ctx.input.stepNumber || builder.steps.length + 1,
          description: ctx.input.stepDescription || '',
          action: ctx.input.stepAction || 'unknown',
          status: ctx.input.stepStatus || 'PASSED',
          duration: ctx.input.stepDuration || 0,
          screenshot: ctx.input.stepScreenshot || null,
          error: ctx.input.stepError || null,
          timestamp: new Date().toISOString()
        };
        
        builder.steps.push(step);
        await fs.writeFile(stateFile, JSON.stringify(builder, null, 2), 'utf-8');
        ctx.logger(`✅ Added step ${step.stepNumber}: ${step.description}`);
        break;

      case 'set-summary':
        ctx.logger(`📋 Setting summary for: ${testId}`);
        if (!builder.summary) {
          builder.summary = {
            status: 'PASSED',
            totalSteps: 0,
            executedSteps: 0,
            passedSteps: 0,
            failedSteps: 0,
            duration: 0,
            browser: 'chromium'
          };
        }
        
        if (ctx.input.status) builder.summary.status = ctx.input.status;
        if (ctx.input.totalSteps !== undefined) builder.summary.totalSteps = ctx.input.totalSteps;
        if (ctx.input.executedSteps !== undefined) builder.summary.executedSteps = ctx.input.executedSteps;
        if (ctx.input.passedSteps !== undefined) builder.summary.passedSteps = ctx.input.passedSteps;
        if (ctx.input.failedSteps !== undefined) builder.summary.failedSteps = ctx.input.failedSteps;
        if (ctx.input.duration !== undefined) builder.summary.duration = ctx.input.duration;
        if (ctx.input.browser) builder.summary.browser = ctx.input.browser;
        
        await fs.writeFile(stateFile, JSON.stringify(builder, null, 2), 'utf-8');
        ctx.logger(`✅ Updated summary: ${builder.summary.status} (${builder.summary.passedSteps}/${builder.summary.totalSteps} passed)`);
        break;

      case 'finalize':
        ctx.logger(`💾 Finalizing test result for: ${testId}`);
        
        // Validate required fields
        if (!builder.testCase?.name) {
          throw new Error('Test case name is required. Use action=\'set-testcase\' to set it.');
        }
        if (!builder.steps || builder.steps.length === 0) {
          ctx.logger('⚠️  Warning: No test steps recorded');
        }
        
        // Auto-calculate summary if not set
        if (builder.steps && builder.steps.length > 0) {
          const passedCount = builder.steps.filter(s => s.status === 'PASSED').length;
          const failedCount = builder.steps.filter(s => s.status === 'FAILED').length;
          const totalDuration = builder.steps.reduce((sum, s) => sum + s.duration, 0);
          
          if (builder.summary) {
            if (builder.summary.totalSteps === 0) builder.summary.totalSteps = builder.steps.length;
            if (builder.summary.executedSteps === 0) builder.summary.executedSteps = builder.steps.length;
            if (builder.summary.passedSteps === 0) builder.summary.passedSteps = passedCount;
            if (builder.summary.failedSteps === 0) builder.summary.failedSteps = failedCount;
            if (builder.summary.duration === 0) builder.summary.duration = totalDuration;
            if (failedCount > 0 && builder.summary.status === 'PASSED') {
              builder.summary.status = 'FAILED';
            }
          }
        }
        
        // Save final JSON file
        await fs.writeFile(finalFile, JSON.stringify(builder, null, 2), 'utf-8');
        
        // Delete temporary state file
        try {
          await fs.unlink(stateFile);
        } catch (err) {
          // Ignore if already deleted
        }
        
        ctx.logger(`✅ Test result saved: ${finalFile}`);
        ctx.logger(`   Status: ${builder.summary?.status}`);
        ctx.logger(`   Steps: ${builder.summary?.passedSteps}/${builder.summary?.totalSteps} passed`);
        ctx.logger(`   Duration: ${((builder.summary?.duration || 0) / 1000).toFixed(2)}s`);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              action: 'finalize',
              testId,
              outputFile: finalFile,
              summary: builder.summary
            }, null, 2),
          }],
        };
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          action: actionType,
          testId,
          message: `Test result ${actionType} completed`,
          currentState: builder
        }, null, 2),
      }],
    };
  },
};

export default createTestResult;
