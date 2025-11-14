import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import type { PlaywrightActionDefinition } from './types';

/**
 * Test Results Cleanup Action
 * Archives old test results and prepares for new test execution
 */
const cleanupTestResults: PlaywrightActionDefinition = {
  name: 'cleanup-test-results',
  title: 'Cleanup Test Results',
  description: 'Archives or deletes old test results and prepares for fresh test execution. Creates required directory structure.',
  inputSchema: z.object({
    mode: z.enum(['archive', 'delete', 'prepare']).optional().describe('Cleanup mode: prepare (archive + setup dirs), archive (move to timestamped folder), delete (permanent removal)'),
    testResultsDir: z.string().optional().describe('Path to test-results directory (default: test-results)'),
  }),
  async run(ctx) {
    const mode = ctx.input.mode || 'prepare';
    const testResultsDir = ctx.input.testResultsDir || 'test-results';
    
    const baseDir = ctx.baseDir;
    const resultsPath = path.join(baseDir, testResultsDir);
    const jsonDir = path.join(resultsPath, 'json');
    const screenshotsDir = path.join(resultsPath, 'screenshots');
    const archiveDir = path.join(resultsPath, 'archive');

    ctx.logger('='.repeat(60));
    ctx.logger('🧹 Test Results Cleanup');
    ctx.logger('='.repeat(60));

    // Count existing files
    const stats = await countFiles(resultsPath, jsonDir, screenshotsDir);
    
    if (stats.jsonFiles === 0 && stats.screenshots === 0 && stats.htmlReports === 0) {
      ctx.logger('ℹ️  No test results found. Nothing to cleanup.');
      
      if (mode === 'prepare') {
        await fs.mkdir(jsonDir, { recursive: true });
        await fs.mkdir(screenshotsDir, { recursive: true });
        ctx.logger('✅ Created directory structure for new test execution');
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            mode,
            stats,
            message: 'No test results found. Directory structure ready.'
          }, null, 2),
        }],
      };
    }

    ctx.logger(`📊 Found:`);
    ctx.logger(`   - ${stats.jsonFiles} JSON result file(s)`);
    ctx.logger(`   - ${stats.screenshots} screenshot(s)`);
    ctx.logger(`   - ${stats.htmlReports} HTML report(s)`);

    let cleanedStats: { jsonFiles: number; screenshots: number; htmlReports: number };

    if (mode === 'archive' || mode === 'prepare') {
      cleanedStats = await archiveResults(resultsPath, jsonDir, screenshotsDir, archiveDir, ctx.logger);
    } else if (mode === 'delete') {
      cleanedStats = await deleteResults(resultsPath, jsonDir, screenshotsDir, ctx.logger);
    } else {
      throw new Error(`Invalid mode: ${mode}. Use 'archive', 'delete', or 'prepare'`);
    }

    if (mode === 'prepare') {
      ctx.logger('');
      ctx.logger('🚀 Preparing Fresh Test Run');
      ctx.logger('='.repeat(60));
      
      await fs.mkdir(jsonDir, { recursive: true });
      await fs.mkdir(screenshotsDir, { recursive: true });
      
      ctx.logger('✅ Ready for new test execution!');
      ctx.logger('');
      ctx.logger('📁 Directory structure:');
      ctx.logger(`   - ${jsonDir} ✓`);
      ctx.logger(`   - ${screenshotsDir} ✓`);
    }

    ctx.logger('='.repeat(60));

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          mode,
          stats: cleanedStats,
          message: `Cleanup completed. ${mode === 'archive' || mode === 'prepare' ? 'Results archived.' : 'Results deleted.'}`
        }, null, 2),
      }],
    };
  },
};

async function countFiles(
  resultsPath: string,
  jsonDir: string,
  screenshotsDir: string
): Promise<{ jsonFiles: number; screenshots: number; htmlReports: number }> {
  const stats = {
    jsonFiles: 0,
    screenshots: 0,
    htmlReports: 0
  };

  try {
    const jsonFiles = await fs.readdir(jsonDir);
    stats.jsonFiles = jsonFiles.filter(f => f.endsWith('.json') && !f.startsWith('.sample')).length;
  } catch (err) {
    // Directory doesn't exist
  }

  try {
    const screenshots = await fs.readdir(screenshotsDir);
    stats.screenshots = screenshots.filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length;
  } catch (err) {
    // Directory doesn't exist
  }

  try {
    const files = await fs.readdir(resultsPath);
    stats.htmlReports = files.filter(f => f.endsWith('.html')).length;
  } catch (err) {
    // Directory doesn't exist
  }

  return stats;
}

async function archiveResults(
  resultsPath: string,
  jsonDir: string,
  screenshotsDir: string,
  archiveDir: string,
  logger: (msg: string) => void
): Promise<{ jsonFiles: number; screenshots: number; htmlReports: number }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const archivePath = path.join(archiveDir, timestamp);

  logger(`📦 Archiving to: ${archivePath}`);
  logger('');

  const stats = {
    jsonFiles: 0,
    screenshots: 0,
    htmlReports: 0
  };

  // Archive JSON files
  try {
    const jsonFiles = await fs.readdir(jsonDir);
    const validJsonFiles = jsonFiles.filter(f => f.endsWith('.json') && !f.startsWith('.sample'));
    
    if (validJsonFiles.length > 0) {
      const archiveJsonDir = path.join(archivePath, 'json');
      await fs.mkdir(archiveJsonDir, { recursive: true });
      
      for (const file of validJsonFiles) {
        await fs.rename(
          path.join(jsonDir, file),
          path.join(archiveJsonDir, file)
        );
        stats.jsonFiles++;
      }
      
      logger(`   ✅ Archived ${stats.jsonFiles} JSON file(s)`);
    }
  } catch (err) {
    // Directory doesn't exist or error reading
  }

  // Archive screenshots
  try {
    const screenshots = await fs.readdir(screenshotsDir);
    const validScreenshots = screenshots.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    if (validScreenshots.length > 0) {
      const archiveScreenshotsDir = path.join(archivePath, 'screenshots');
      await fs.mkdir(archiveScreenshotsDir, { recursive: true });
      
      for (const file of validScreenshots) {
        await fs.rename(
          path.join(screenshotsDir, file),
          path.join(archiveScreenshotsDir, file)
        );
        stats.screenshots++;
      }
      
      logger(`   ✅ Archived ${stats.screenshots} screenshot(s)`);
    }
  } catch (err) {
    // Directory doesn't exist or error reading
  }

  // Archive HTML reports
  try {
    const files = await fs.readdir(resultsPath);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    if (htmlFiles.length > 0) {
      const archiveReportsDir = path.join(archivePath, 'reports');
      await fs.mkdir(archiveReportsDir, { recursive: true });
      
      for (const file of htmlFiles) {
        await fs.rename(
          path.join(resultsPath, file),
          path.join(archiveReportsDir, file)
        );
        stats.htmlReports++;
      }
      
      logger(`   ✅ Archived ${stats.htmlReports} HTML report(s)`);
    }
  } catch (err) {
    // Error reading directory
  }

  logger('');
  logger(`✅ Archive completed: ${archivePath}`);

  return stats;
}

async function deleteResults(
  resultsPath: string,
  jsonDir: string,
  screenshotsDir: string,
  logger: (msg: string) => void
): Promise<{ jsonFiles: number; screenshots: number; htmlReports: number }> {
  logger('⚠️  WARNING: Permanently deleting all test results!');
  logger('');

  const stats = {
    jsonFiles: 0,
    screenshots: 0,
    htmlReports: 0
  };

  // Delete JSON files
  try {
    const jsonFiles = await fs.readdir(jsonDir);
    const validJsonFiles = jsonFiles.filter(f => f.endsWith('.json') && !f.startsWith('.sample'));
    
    for (const file of validJsonFiles) {
      await fs.unlink(path.join(jsonDir, file));
      stats.jsonFiles++;
    }
    
    if (stats.jsonFiles > 0) {
      logger(`   🗑️  Deleted ${stats.jsonFiles} JSON file(s)`);
    }
  } catch (err) {
    // Directory doesn't exist or error reading
  }

  // Delete screenshots
  try {
    const screenshots = await fs.readdir(screenshotsDir);
    const validScreenshots = screenshots.filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    
    for (const file of validScreenshots) {
      await fs.unlink(path.join(screenshotsDir, file));
      stats.screenshots++;
    }
    
    if (stats.screenshots > 0) {
      logger(`   🗑️  Deleted ${stats.screenshots} screenshot(s)`);
    }
  } catch (err) {
    // Directory doesn't exist or error reading
  }

  // Delete HTML reports
  try {
    const files = await fs.readdir(resultsPath);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    
    for (const file of htmlFiles) {
      await fs.unlink(path.join(resultsPath, file));
      stats.htmlReports++;
    }
    
    if (stats.htmlReports > 0) {
      logger(`   🗑️  Deleted ${stats.htmlReports} HTML report(s)`);
    }
  } catch (err) {
    // Error reading directory
  }

  logger('');
  logger('✅ Deletion completed');

  return stats;
}

export default cleanupTestResults;
