# Playwrightium

[![npm version](https://badge.fury.io/js/playwrightium.svg)](https://www.npmjs.com/package/playwrightium)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Model Context Protocol server for browser automation with Playwright**

Build reusable browser automation workflows that AI can intelligently select and execute. Stop regenerating the same steps repeatedly—define tested automation once, use everywhere.

---

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g playwrightium

# Or use with npx (no installation needed)
npx playwrightium
```

### MCP Configuration

Add to your MCP settings (VS Code, Claude Desktop, etc.):

```json
{
  "mcpServers": {
    "playwrightium": {
      "command": "npx",
      "args": ["-y", "playwrightium"]
    }
  }
}
```

**That's it!** The server will automatically create a `.playwright-mcp` workspace in your home directory.

#### Custom Workspace (Optional)

```json
{
  "mcpServers": {
    "playwrightium": {
      "command": "npx",
      "args": [
        "-y",
        "playwrightium",
        "--base",
        "/path/to/your/workspace"
      ]
    }
  }
}
```

### Seed AI Assistant Integration (Optional)

Install chatmodels and prompts for your AI assistant:

```bash
# For GitHub Copilot
playwrightium seed --loop=copilot

# For Claude
playwrightium seed --loop=claude
```

This creates workspace-specific configurations in `.github/chatmodels` and `.github/prompts` (Copilot) or `.claude/agents` (Claude).

### Your First Automation

Use the `@create-shortcut` prompt in your AI assistant:

```
@create-shortcut Login to my staging environment
```

The AI will guide you through:
1. Testing the workflow manually with `browser-session`
2. Creating a YAML shortcut with proper selectors
3. Saving to `.playwright-mcp/shortcuts/login.yaml`
4. Testing the final shortcut

---

## 🎯 Three Ways to Automate

### 1. Browser Session (Built-in)
Execute commands directly without creating files:

```json
{
  "tool": "browser-session",
  "commands": [
    { "type": "navigate", "url": "https://example.com" },
    { "type": "fill", "selector": "#email", "value": "user@example.com" },
    { "type": "click", "selector": "button[type='submit']" },
    { "type": "screenshot", "path": "result.png" }
  ]
}
```

### 2. Shortcuts (YAML)
Reusable workflows with environment variable support:

```yaml
# .playwright-mcp/shortcuts/login.yaml
commands:
  - type: navigate
    url: ${{STAGING_URL}}
  
  - type: fill
    selector: "#email"
    value: ${{USER_EMAIL}}
  
  - type: fill
    selector: "#password"
    value: ${{USER_PASSWORD}}
  
  - type: click
    selector: 'button[type="submit"]'
  
  - type: wait_for_text
    text: "Dashboard"
```

Run with: `execute-shortcut { "shortcutPath": "login.yaml" }`

### 3. Scripts (TypeScript/JavaScript)
Advanced automation with full programming capabilities:

```typescript
// .playwright-mcp/scripts/extract-users.ts
import type { Page } from 'playwright';

export default async function({ page, logger, env }) {
  await page.goto(env.ADMIN_URL);
  
  const users = await page.$$eval('.user-row', rows =>
    rows.map(row => ({
      name: row.querySelector('.name').textContent,
      email: row.querySelector('.email').textContent
    }))
  );
  
  logger(`Extracted ${users.length} users`);
  return { users };
}
```

Run with: `execute-script { "scriptPath": "extract-users.ts" }`

---

## 🔐 Environment Variables

Keep credentials secure using `.env` files:

```bash
# .env (at repository root)
STAGING_URL=https://staging.example.com
USER_EMAIL=test@example.com
USER_PASSWORD=secure-password
API_KEY=your-api-key
```

Use in shortcuts: `${{VARIABLE_NAME}}`  
Use in scripts: `env.VARIABLE_NAME`

---

## 🧰 Built-in Tools

- **`browser-session`** - Execute 25+ browser commands in one call
- **`execute-shortcut`** - Run YAML workflow files
- **`execute-script`** - Run TypeScript/JavaScript automation
- **`browser-snapshot`** - Capture page state for debugging
- **`browser-debug`** - Get console logs and network requests
- **`close-browser`** - Reset browser session

### Available Commands

Navigate, click, fill, type, hover, screenshot, scroll, evaluate, wait_for_text, get_text, get_attribute, press_key, select_option, check, uncheck, upload_file, drag, reload, get_url, get_title, and more!

---

## 🤖 AI Assistant Prompts

Playwrightium includes built-in prompts to guide automation creation:

### `@create-shortcut`
Creates YAML shortcuts with proper testing workflow:
```
@create-shortcut Login to staging and navigate to user dashboard
```

### `@create-script`
Creates TypeScript scripts with best practices:
```
@create-script Extract all product data from the admin panel
```

Both prompts enforce:
- ✅ Test manually first with `browser-session`
- ✅ Use environment variables for credentials
- ✅ Create file only after successful testing
- ✅ Include comprehensive error handling

### Project-Level Integration

Use `playwrightium seed` to install chatmodels/agents in your project for team-wide consistency:

```bash
playwrightium seed --loop=copilot  # → .github/chatmodels & prompts
playwrightium seed --loop=claude   # → .claude/agents
```

See [Seed Command Documentation](./docs/13-seed-command.md) for details.

---

## 📖 Documentation

Full documentation available in the [docs/](./docs/) directory:

- **[Quick Start Guide](./docs/02-quick-start.md)** - Detailed setup and first automation
- **[Commands Reference](./docs/11-commands.md)** - Complete command documentation
- **[Shortcuts Guide](./docs/05-shortcuts.md)** - YAML workflow creation
- **[Scripts Guide](./docs/06-scripts.md)** - TypeScript/JavaScript automation
- **[Secrets Management](./docs/08-secrets.md)** - Environment variables and security
- **[Custom Actions](./docs/04-custom-actions.md)** - Build reusable TypeScript tools
- **[Best Practices](./docs/10-best-practices.md)** - Robust automation patterns
- **[Architecture](./docs/09-architecture.md)** - How Playwrightium works

---

## 🌟 Key Features

- 🖥️ **Headed browser by default** - see your automation in action
- 🔐 **Secure secret management** - environment variables with `${{VAR}}` syntax
- 🎯 **Persistent browser sessions** - maintain state across actions
- 🤖 **AI-guided creation** - built-in prompts for shortcuts and scripts
- 📦 **Three automation layers** - browser commands, shortcuts, and scripts
- 🔧 **TypeScript-first** - full type safety and intellisense
- ⚡ **Zero config** - works out of the box with sensible defaults
- 🧪 **Test-first workflow** - manual testing before file creation

---

## 🔄 Development

### Local Development

```bash
git clone https://github.com/analysta-ai/playwrightium.git
cd playwrightium
npm install
npm run build
npm run dev
```

### Configuration Options

```bash
# Headed (default) - watch automation
playwrightium

# Headless - background execution
playwrightium --headless
PLAYWRIGHTIUM_HEADLESS=1 playwrightium

# Custom workspace
playwrightium --base /path/to/workspace --actions .my-actions

# Verbose logging
playwrightium --verbose
```

---

## � Examples

### Quick Search Automation
```json
{
  "tool": "browser-session",
  "commands": [
    { "type": "navigate", "url": "https://google.com" },
    { "type": "fill", "selector": "input[name='q']", "value": "Playwright" },
    { "type": "press_key", "key": "Enter" },
    { "type": "screenshot", "path": "results.png" }
  ]
}
```

### E-commerce Testing Shortcut
```yaml
# test-checkout.yaml
commands:
  - type: navigate
    url: ${{SHOP_URL}}
  - type: fill
    selector: "#search"
    value: "laptop"
  - type: click
    selector: ".product:first-child"
  - type: click
    selector: "#add-to-cart"
  - type: screenshot
    path: "cart.png"
```

### Data Extraction Script
```typescript
export default async function({ page, env, logger }) {
  await page.goto(`${env.ADMIN_URL}/reports`);
  
  const data = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.data-row'))
      .map(row => ({
        date: row.querySelector('.date').textContent,
        revenue: row.querySelector('.revenue').textContent
      }));
  });
  
  logger(`Extracted ${data.length} records`);
  return { data, timestamp: new Date().toISOString() };
}
```

---

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/playwrightium
- **GitHub Repository**: https://github.com/analysta-ai/playwrightium
- **Documentation**: [./docs/](./docs/)
- **Model Context Protocol**: https://modelcontextprotocol.io
- **Playwright**: https://playwright.dev

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests to the repository.

Happy automating! 🚀