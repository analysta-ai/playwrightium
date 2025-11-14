import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';
import type { PlaywrightActionDefinition } from './types';

interface TestResult {
  testCase: {
    name: string;
    file: string;
    id: string;
    executedAt: string;
    environment: string;
  };
  summary: {
    status: 'PASSED' | 'FAILED';
    totalSteps: number;
    executedSteps: number;
    passedSteps: number;
    failedSteps: number;
    duration: number;
    browser: string;
  };
  testData: Record<string, string>;
  steps: Array<{
    stepNumber: number;
    description: string;
    action: string;
    status: 'PASSED' | 'FAILED';
    duration: number;
    screenshot?: string;
    error?: string | null;
    timestamp: string;
  }>;
  metadata: {
    generatedBy: string;
    reportVersion: string;
  };
}

interface TestStatistics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  totalDuration: number;
  avgDuration: number;
}

/**
 * Test Summary Report Generator Action
 * Processes JSON test results and generates a beautiful summary HTML report
 */
const generateSummaryReport: PlaywrightActionDefinition = {
  name: 'generate-summary-report',
  title: 'Generate Test Summary Report',
  description: 'Processes JSON test results and generates a comprehensive HTML summary report with statistics, test details, and screenshots.',
  inputSchema: z.object({
    jsonDir: z.string().optional().describe('Path to JSON results directory (default: test-results/json)'),
    outputFile: z.string().optional().describe('Path to output HTML file (default: test-results/summary-report.html)'),
  }),
  async run(ctx) {
    const jsonDir = ctx.input.jsonDir || 'test-results/json';
    const outputFile = ctx.input.outputFile || 'test-results/summary-report.html';

    const baseDir = ctx.baseDir;
    const jsonPath = path.isAbsolute(jsonDir) ? jsonDir : path.join(baseDir, jsonDir);
    const outputPath = path.isAbsolute(outputFile) ? outputFile : path.join(baseDir, outputFile);

    ctx.logger('='.repeat(60));
    ctx.logger('🔍 Test Summary Report Generator');
    ctx.logger('='.repeat(60));
    ctx.logger('');

    // Load JSON test results
    const testResults = await loadJsonResults(jsonPath, ctx.logger);
    
    if (testResults.length === 0) {
      ctx.logger('⚠️  No test results found to generate report');
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            message: 'No test results found',
            jsonDir: jsonPath
          }, null, 2),
        }],
      };
    }

    // Calculate statistics
    const stats = calculateStatistics(testResults);

    // Generate HTML report
    const htmlContent = generateHtmlTemplate(stats, testResults);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Write the HTML file
    await fs.writeFile(outputPath, htmlContent, 'utf-8');

    ctx.logger(`\n✅ Summary report generated: ${outputPath}`);
    ctx.logger(`   Total Tests: ${stats.totalTests}`);
    ctx.logger(`   Passed: ${stats.passedTests} (${stats.passRate.toFixed(1)}%)`);
    ctx.logger(`   Failed: ${stats.failedTests}`);
    ctx.logger('');
    ctx.logger('='.repeat(60));

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          outputFile: outputPath,
          stats
        }, null, 2),
      }],
    };
  },
};

async function loadJsonResults(jsonDir: string, logger: (msg: string) => void): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    const files = await fs.readdir(jsonDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();

    if (jsonFiles.length === 0) {
      logger(`⚠️  No JSON files found in ${jsonDir}`);
      return results;
    }

    logger(`📂 Found ${jsonFiles.length} JSON result file(s)`);

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(jsonDir, file), 'utf-8');
        const data = JSON.parse(content) as TestResult;
        results.push(data);
        logger(`   ✓ Loaded: ${file}`);
      } catch (err) {
        logger(`   ✗ Error loading ${file}: ${err}`);
      }
    }
  } catch (err) {
    logger(`❌ Directory not found: ${jsonDir}`);
  }

  return results;
}

function calculateStatistics(results: TestResult[]): TestStatistics {
  const totalTests = results.length;
  const passedTests = results.filter(r => r.summary.status === 'PASSED').length;
  const failedTests = totalTests - passedTests;

  const totalSteps = results.reduce((sum, r) => sum + r.summary.totalSteps, 0);
  const passedSteps = results.reduce((sum, r) => sum + r.summary.passedSteps, 0);
  const failedSteps = results.reduce((sum, r) => sum + r.summary.failedSteps, 0);

  const totalDuration = results.reduce((sum, r) => sum + r.summary.duration, 0);

  const passRate = totalTests > 0 ? (passedTests / totalTests * 100) : 0;
  const avgDuration = totalTests > 0 ? totalDuration / totalTests : 0;

  return {
    totalTests,
    passedTests,
    failedTests,
    passRate,
    totalSteps,
    passedSteps,
    failedSteps,
    totalDuration,
    avgDuration
  };
}

function generateHtmlTemplate(stats: TestStatistics, results: TestResult[]): string {
  // Sort tests by execution time (most recent first)
  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.testCase.executedAt).getTime();
    const dateB = new Date(b.testCase.executedAt).getTime();
    return dateB - dateA;
  });

  const testRowsHtml = sortedResults.map((result, idx) => generateTestRow(result, idx + 1)).join('');

  const passRateColor = stats.passRate >= 80 ? '#27ae60' : stats.passRate >= 50 ? '#f39c12' : '#e74c3c';

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Summary Report - ${formattedDate}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { font-family: 'Inter', sans-serif; }
        .expand-icon { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: inline-block; }
        .expand-icon.expanded { transform: rotate(90deg); }
        .test-row { transition: all 0.2s ease; }
        .test-row:nth-child(4n+1) { background: linear-gradient(to right, #fafafa 0%, #ffffff 100%); }
        .glass-effect { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
        .gradient-bg { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .stat-card { animation: fadeIn 0.6s ease-out forwards; }
        .stat-card:nth-child(1) { animation-delay: 0.1s; opacity: 0; }
        .stat-card:nth-child(2) { animation-delay: 0.2s; opacity: 0; }
        .stat-card:nth-child(3) { animation-delay: 0.3s; opacity: 0; }
        .stat-card:nth-child(4) { animation-delay: 0.4s; opacity: 0; }
        .stat-card:nth-child(5) { animation-delay: 0.5s; opacity: 0; }
        .modal { display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0, 0, 0, 0.9); animation: fadeIn 0.3s ease; }
        .modal-content { margin: auto; display: block; max-width: 90%; max-height: 90%; animation: zoomIn 0.3s ease; }
        @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .modal-close { position: absolute; top: 30px; right: 50px; color: #fff; font-size: 50px; font-weight: bold; cursor: pointer; transition: 0.3s; text-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .modal-close:hover, .modal-close:focus { color: #bbb; }
        .modal-caption { margin: auto; display: block; width: 80%; max-width: 700px; text-align: center; color: #ccc; padding: 20px 0; font-size: 18px; }
    </style>
    <script>
        function toggleDetails(detailsId) {
            const detailsRow = document.getElementById(detailsId);
            const iconId = detailsId.replace('details-', 'icon-');
            const icon = document.getElementById(iconId);
            if (detailsRow.classList.contains('hidden')) {
                detailsRow.classList.remove('hidden');
                icon.classList.add('expanded');
            } else {
                detailsRow.classList.add('hidden');
                icon.classList.remove('expanded');
            }
            updateToggleButton();
        }
        function toggleAll() {
            const detailsRows = document.querySelectorAll('.details-row');
            const icons = document.querySelectorAll('.expand-icon');
            const allExpanded = Array.from(detailsRows).every(row => !row.classList.contains('hidden'));
            if (allExpanded) {
                detailsRows.forEach(row => row.classList.add('hidden'));
                icons.forEach(icon => icon.classList.remove('expanded'));
            } else {
                detailsRows.forEach(row => row.classList.remove('hidden'));
                icons.forEach(icon => icon.classList.add('expanded'));
            }
            updateToggleButton();
        }
        function updateToggleButton() {
            const detailsRows = document.querySelectorAll('.details-row');
            const toggleBtn = document.getElementById('toggleAllBtn');
            const toggleText = document.getElementById('toggleText');
            const toggleIcon = document.getElementById('toggleIcon');
            const allExpanded = Array.from(detailsRows).every(row => !row.classList.contains('hidden'));
            if (allExpanded) {
                toggleText.textContent = 'Collapse All';
                toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>';
                toggleBtn.classList.remove('from-indigo-600', 'to-purple-600', 'hover:from-indigo-700', 'hover:to-purple-700');
                toggleBtn.classList.add('from-gray-600', 'to-gray-700', 'hover:from-gray-700', 'hover:to-gray-800');
            } else {
                toggleText.textContent = 'Expand All';
                toggleIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
                toggleBtn.classList.remove('from-gray-600', 'to-gray-700', 'hover:from-gray-700', 'hover:to-gray-800');
                toggleBtn.classList.add('from-indigo-600', 'to-purple-600', 'hover:from-indigo-700', 'hover:to-purple-700');
            }
        }
        function openModal(imageSrc, caption) {
            const modal = document.getElementById('screenshotModal');
            const modalImg = document.getElementById('modalImage');
            const modalCaption = document.getElementById('modalCaption');
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modalImg.src = imageSrc;
            modalCaption.innerHTML = caption;
            document.body.style.overflow = 'hidden';
        }
        function closeModal() {
            const modal = document.getElementById('screenshotModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        window.onclick = function(event) {
            const modal = document.getElementById('screenshotModal');
            if (event.target == modal) { closeModal(); }
        }
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') { closeModal(); }
        });
    </script>
</head>
<body class="gradient-bg min-h-screen py-12 px-4">
    <div id="screenshotModal" class="modal">
        <span class="modal-close" onclick="closeModal()">&times;</span>
        <img class="modal-content" id="modalImage" alt="Screenshot">
        <div class="modal-caption" id="modalCaption"></div>
    </div>
    <div class="max-w-[1600px] mx-auto">
        <div class="glass-effect rounded-xl shadow-lg text-white py-4 px-8 mb-8 backdrop-blur-xl">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="bg-white/20 p-2 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold tracking-tight">Test Summary Report</h1>
                </div>
                <div class="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-sm font-medium">${formattedDate} at ${formattedTime}</p>
                </div>
            </div>
        </div>
        <div class="mb-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div class="stat-card group glass-effect rounded-xl shadow-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div class="text-xs font-bold text-white/80 uppercase tracking-wide mb-1.5">Total Tests</div>
                    <div class="text-3xl font-extrabold text-white my-1">${stats.totalTests}</div>
                    <div class="h-0.5 w-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mx-auto mt-1.5"></div>
                </div>
                <div class="stat-card group glass-effect rounded-xl shadow-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div class="text-xs font-bold text-white/80 uppercase tracking-wide mb-1.5">Passed</div>
                    <div class="text-3xl font-extrabold text-white my-1">${stats.passedTests}</div>
                    <div class="h-0.5 w-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full mx-auto mt-1.5"></div>
                </div>
                <div class="stat-card group glass-effect rounded-xl shadow-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div class="text-xs font-bold text-white/80 uppercase tracking-wide mb-1.5">Failed</div>
                    <div class="text-3xl font-extrabold text-white my-1">${stats.failedTests}</div>
                    <div class="h-0.5 w-8 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mx-auto mt-1.5"></div>
                </div>
                <div class="stat-card group glass-effect rounded-xl shadow-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div class="text-xs font-bold text-white/80 uppercase tracking-wide mb-1.5">Pass Rate</div>
                    <div class="text-3xl font-extrabold text-white my-1">${stats.passRate.toFixed(1)}%</div>
                    <div class="w-full bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden backdrop-blur-sm">
                        <div class="h-1.5 rounded-full transition-all duration-1000 ease-out shadow-lg" style="width: ${stats.passRate.toFixed(1)}%; background: linear-gradient(90deg, ${passRateColor} 0%, ${passRateColor}DD 100%);"></div>
                    </div>
                </div>
                <div class="stat-card group glass-effect rounded-xl shadow-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                    <div class="text-xs font-bold text-white/80 uppercase tracking-wide mb-1.5">Total Duration</div>
                    <div class="text-3xl font-extrabold text-white my-1">${(stats.totalDuration / 1000).toFixed(1)}s</div>
                    <div class="text-xs font-semibold text-white/90 mt-2 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 inline-block">⌀ ${(stats.avgDuration / 1000).toFixed(1)}s/test</div>
                </div>
            </div>
        </div>
        <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl px-10 py-12 border border-white/50">
            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <h2 class="text-4xl font-extrabold text-gray-900 flex items-center gap-4">
                    <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                    </div>
                    <span class="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Test Execution Details</span>
                </h2>
                <button id="toggleAllBtn" onclick="toggleAll()" class="group px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <span class="flex items-center gap-2">
                        <svg id="toggleIcon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                        <span id="toggleText">Expand All</span>
                    </span>
                </button>
            </div>
            <div class="overflow-hidden shadow-2xl rounded-2xl border-2 border-gray-300">
                <table class="min-w-full bg-white">
                    <thead class="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                        <tr>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">#</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">Test Case</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">Environment</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">Status</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">Steps</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">Duration</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest border-r border-gray-700">Executed At</th>
                            <th class="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${testRowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
        <div class="glass-effect text-white text-center py-8 rounded-2xl mt-8 backdrop-blur-xl border border-white/20">
            <p class="text-sm font-medium flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Generated by Playwrightium Test Executor | Report Version 2.0.0
            </p>
        </div>
    </div>
</body>
</html>`;
}

function generateTestRow(result: TestResult, idx: number): string {
  const { testCase, summary, steps, testData } = result;
  const status = summary.status;
  const statusBadgeClass = status === 'PASSED'
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
    : 'bg-gradient-to-r from-rose-500 to-pink-500';

  const executedAt = new Date(testCase.executedAt);
  const formattedDate = executedAt.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const durationSec = (summary.duration / 1000).toFixed(2);

  // Generate steps HTML
  const stepsHtml = steps.map(step => {
    const stepStatus = step.status;
    const stepIcon = stepStatus === 'PASSED' ? '✅' : '❌';
    const stepBorderColor = stepStatus === 'PASSED' ? 'border-emerald-500' : 'border-rose-500';
    const stepBgColor = stepStatus === 'PASSED'
      ? 'bg-gradient-to-r from-emerald-50 to-teal-50'
      : 'bg-gradient-to-r from-rose-50 to-pink-50';
    const stepDuration = (step.duration / 1000).toFixed(2);

    const screenshotHtml = step.screenshot
      ? `<button onclick="openModal('${step.screenshot}', '${path.basename(step.screenshot)}')" class="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-xs cursor-pointer whitespace-nowrap"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Screenshot</button>`
      : '<span class="text-gray-400 text-xs italic">No screenshot</span>';

    const errorHtml = step.error
      ? `<div class="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-800 px-4 py-2.5 rounded-r-lg mt-2 shadow-sm"><div class="flex items-start gap-2"><svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg><div class="text-sm"><strong class="font-bold">Error:</strong> <span class="font-medium">${step.error}</span></div></div></div>`
      : '';

    return `<div class="border-l-4 ${stepBorderColor} ${stepBgColor} rounded-r-xl p-4 mb-3 shadow-md hover:shadow-lg transition-shadow duration-200">
        <div class="flex justify-between items-center gap-4">
            <div class="flex items-center gap-3 flex-1">
                <span class="font-bold text-gray-900 text-base whitespace-nowrap">${stepIcon} Step ${step.stepNumber}</span>
                <span class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">${step.action}</span>
                <span class="text-gray-700 text-sm font-medium flex-1">${step.description}</span>
            </div>
            <div class="flex items-center gap-3 whitespace-nowrap">
                ${screenshotHtml}
                <span class="text-gray-600 text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">${stepDuration}s</span>
            </div>
        </div>
        ${errorHtml}
    </div>`;
  }).join('');

  // Generate test data HTML
  const testDataHtml = Object.keys(testData).length > 0
    ? `<div class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6 shadow-md border border-gray-200"><h4 class="text-xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-indigo-500 flex items-center gap-2"><svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Test Data:</h4>${Object.entries(testData).map(([k, v]) => `<div class="py-2 text-gray-700 flex items-center gap-2"><svg class="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg><strong class="text-gray-900 font-semibold">${k}:</strong> <span class="font-medium">${v}</span></div>`).join('')}</div>`
    : '';

  return `<tr class="test-row cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 border-b border-gray-200" onclick="toggleDetails('details-${idx}')">
    <td class="py-5 px-6 font-bold text-gray-900 text-base border-r border-gray-200">${idx}</td>
    <td class="py-5 px-6 border-r border-gray-200">
        <div class="font-bold text-gray-900 text-base">${testCase.name}</div>
        <div class="text-xs text-gray-500 font-medium mt-1">${testCase.file}</div>
    </td>
    <td class="py-5 px-6 border-r border-gray-200"><span class="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">${testCase.environment}</span></td>
    <td class="py-5 px-6 border-r border-gray-200"><span class="${statusBadgeClass} text-white px-4 py-2 rounded-full text-xs font-bold shadow-md">${status}</span></td>
    <td class="py-5 px-6 font-bold text-gray-700 text-base border-r border-gray-200">${summary.passedSteps}/${summary.totalSteps}</td>
    <td class="py-5 px-6 text-gray-700 font-semibold text-sm border-r border-gray-200">${durationSec}s</td>
    <td class="py-5 px-6 text-gray-600 text-xs font-medium border-r border-gray-200">${formattedDate}</td>
    <td class="py-5 px-6">
        <div class="flex items-center gap-2">
            <span class="expand-icon inline-block text-indigo-600 font-bold text-lg" id="icon-${idx}">▶</span>
            <span class="text-indigo-600 font-semibold text-sm">Details</span>
        </div>
    </td>
</tr>
<tr class="details-row hidden bg-gradient-to-br from-gray-50 to-indigo-50 border-b-2 border-indigo-200" id="details-${idx}">
    <td colspan="8" class="py-8 px-10">
        <div class="bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
            ${testDataHtml}
            <h4 class="text-xl font-bold text-gray-900 mb-5 pb-3 border-b-2 border-indigo-500 flex items-center gap-2"><svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>Test Steps:</h4>
            ${stepsHtml}
        </div>
    </td>
</tr>`;
}

export default generateSummaryReport;
