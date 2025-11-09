# Quick Start Guide

Get Playwrighium up and running in your project in under 5 minutes.

## 🚀 Installation

### Prerequisites
- Node.js 16+
- npm or yarn
- MCP-compatible client (Claude Desktop, VS Code, etc.)

### 1. Install Dependencies
```bash
cd your-project
npm install
```

### 2. Build the Server
```bash
npm run build
```

### 3. Test the Server
```bash
# Start in development mode
npm run dev

# Or run the built version
npm start
```

## 🔧 MCP Client Configuration

### Claude Desktop Configuration

Add to your `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "playwrighium": {
      "command": "node",
      "args": ["/path/to/your/project/dist/index.js"],
      "env": {
        "PLAYWRIGHIUM_BASE_DIR": "/path/to/your/project"
      }
    }
  }
}
```

### VS Code MCP Extension Configuration

1. Install an MCP extension for VS Code
2. Configure the server path in your workspace settings:

```json
{
  "mcp.servers": {
    "playwrighium": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

## 🧪 Your First Automation

### 1. Create a Simple Shortcut

Create `.playwright-mcp/shortcuts/google-search.yaml`:

```yaml
commands:
  - type: navigate
    url: "https://google.com"
    description: "Navigate to Google"

  - type: fill
    selector: 'input[name="q"]'
    value: "Playwright automation"
    description: "Enter search term"

  - type: press_key
    key: "Enter"
    description: "Submit search"

  - type: wait_for_text
    text: "results"
    description: "Wait for results to load"

  - type: screenshot
    path: "google-search-results.png"
    description: "Take screenshot of results"
```

### 2. Test Your Shortcut

**Option A: Use Browser Session (Universal)**
```json
{
  "commands": [
    {
      "type": "navigate",
      "url": "https://google.com"
    },
    {
      "type": "fill",
      "selector": "input[name=\"q\"]",
      "value": "Playwright automation"
    },
    {
      "type": "press_key",
      "key": "Enter"
    },
    {
      "type": "wait_for_text",
      "text": "results"
    },
    {
      "type": "screenshot",
      "path": "google-search.png"
    }
  ]
}
```

**Option B: Execute Shortcut**
```json
{
  "shortcutPath": "google-search.yaml"
}
```

### 3. View Results

You should see:
- Browser opens (headed mode by default)
- Automation executes step by step
- Screenshot saved to your project directory
- Structured results returned

## 🎯 Common Use Cases

### Login Automation

Create `.playwright-mcp/shortcuts/login-staging.yaml`:

```yaml
commands:
  - type: navigate
    url: ${{STAGING_URL}}
    description: "Navigate to staging"

  - type: fill
    selector: "#email"
    value: ${{STAGING_EMAIL}}
    description: "Enter email"

  - type: fill
    selector: "#password"
    value: ${{STAGING_PASSWORD}}
    description: "Enter password"

  - type: click
    selector: 'button[type="submit"]'
    description: "Click login button"

  - type: wait_for_text
    text: "Dashboard"
    description: "Wait for successful login"
```

Add to `.env`:
```bash
STAGING_URL=https://staging.yourapp.com
STAGING_EMAIL=test@example.com
STAGING_PASSWORD=your-password
```

### Data Extraction Script

Create `.playwright-mcp/scripts/extract-links.ts`:

```typescript
export default async function({ page, logger }) {
  await page.goto('https://example.com');

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(link => ({
        text: link.textContent?.trim(),
        href: link.href,
        target: link.target
      }))
      .filter(link => link.href && link.text);
  });

  logger(`Found ${links.length} links`);

  return {
    links,
    count: links.length,
    timestamp: new Date().toISOString()
  };
}
```

### Custom Action

Create `.playwright-mcp/actions/take-full-screenshot.ts`:

```typescript
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const action: PlaywrightActionDefinition = {
  name: 'take-full-screenshot',
  title: 'Full Page Screenshot',
  description: 'Take a full page screenshot with timestamp',
  inputSchema: z.object({
    url: z.string().url().describe('URL to screenshot'),
    filename: z.string().optional().describe('Custom filename')
  }),
  async run({ page, input, logger }) {
    await logger(`Navigating to ${input.url}`);
    await page.goto(input.url);
    await page.waitForLoadState('networkidle');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = input.filename || `screenshot-${timestamp}.png`;

    await page.screenshot({
      path: filename,
      fullPage: true
    });

    await logger(`Screenshot saved: ${filename}`);

    return {
      message: `Screenshot taken successfully`,
      structuredContent: {
        filename,
        url: input.url,
        timestamp,
        size: 'full-page'
      }
    };
  }
};

export default action;
```

## 🎛️ Configuration Options

### Browser Modes

**Headed (default) - See automation in action:**
```bash
npm run dev
```

**Headless - Run in background:**
```bash
npm run dev -- --headless
```

**Environment variable:**
```bash
PLAYWRIGHIUM_HEADLESS=1 npm run dev
```

### Custom Paths

**Different action directory:**
```bash
npm run dev -- --actions /path/to/custom/actions
```

**Different base directory:**
```bash
npm run dev -- --base /path/to/project/root
```

### Debug Mode

**Verbose logging:**
```bash
npm run dev -- --verbose
```

## 🔍 Troubleshooting

### Common Issues

**1. Server Not Starting**
```bash
# Check TypeScript compilation
npm run check

# Rebuild if needed
npm run build
```

**2. Actions Not Loading**
```bash
# Verify action files exist
ls .playwright-mcp/actions/

# Check for syntax errors
npm run check
```

**3. Environment Variables Not Working**
```bash
# Verify .env file exists at project root
cat .env

# Check variable names match (case-sensitive)
echo ${{STAGING_URL}}
```

**4. Browser Issues**
```bash
# Install Playwright browsers
npx playwright install

# Test browser launch
npx playwright test --ui
```

### Debug Mode

Enable verbose logging to see what's happening:

```bash
PLAYWRIGHIUM_VERBOSE=1 npm run dev
```

This shows:
- Action discovery process
- File loading details
- Execution steps
- Error details

## ✅ Verification Checklist

Your setup is working correctly if:

- [ ] Server starts without errors
- [ ] MCP client connects successfully
- [ ] Built-in actions are available (`browser-session`)
- [ ] Can execute simple browser commands
- [ ] Screenshots are saved to project directory
- [ ] Environment variables interpolated correctly

## 🚀 Next Steps

Now that you have Playwrighium running:

1. **[Create Custom Actions](./04-custom-actions.md)** - Build reusable automation tools
2. **[Use Environment Variables](./08-secrets.md)** - Secure credential management
3. **[Explore Built-in Actions](./07-builtin-actions.md)** - Understand what's available
4. **[Learn Command Reference](./11-commands.md)** - Master all browser commands

## 💡 Tips for Success

1. **Start simple** - Begin with basic shortcuts, add complexity gradually
2. **Use headed mode** - Watch automation run to debug issues
3. **Log liberally** - Add descriptions to every command
4. **Test incrementally** - Build up complex workflows step by step
5. **Version control** - Commit your automation workflows

Happy automating! 🎉