# Playwrighium - Reusable Browser Automation via MCP

A TypeScript-based [Model Context Protocol](https://modelcontextprotocol.io) server that bridges AI automation with reusable browser workflows. Instead of having AI generate individual browser steps each time, you define tested, reusable automation components that AI can intelligently select and execute.

## 🎯 The Problem Playwrighium Solves

**Traditional AI Automation Issues:**
- AI regenerates the same steps repeatedly → inconsistent results
- Complex workflows require perfect step-by-step generation → error-prone
- No reusability → same login flows recreated every time
- No version control → automation knowledge lost

**The Playwrighium Solution:**
Playwrighium provides three complementary automation approaches:

1. **Custom Actions** (TypeScript) - Reusable tools with full Playwright API access
2. **Shortcuts** (YAML) - Simple, declarative command sequences
3. **Scripts** (TS/JS) - Advanced automation logic with programming capabilities

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MCP-compatible client (Claude Desktop, VS Code, etc.)

### Installation
```bash
npm install
npm run build
```

### Your First Automation

Create a simple shortcut (`.playwright-mcp/shortcuts/google-search.yaml`):

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

  - type: screenshot
    path: "search-results.png"
    description: "Capture results"
```

Execute using the `browser-session` action:
```json
{
  "commands": [
    { "type": "navigate", "url": "https://google.com" },
    { "type": "fill", "selector": "input[name=\"q\"]", "value": "Playwright automation" },
    { "type": "press_key", "key": "Enter" },
    { "type": "screenshot", "path": "search-results.png" }
  ]
}
```

## 🎨 Three Automation Approaches

### 1. Custom Actions (TypeScript)
Reusable tools that appear as MCP tools in your AI clients.

```typescript
// .playwright-mcp/actions/login-to-staging.ts
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const action: PlaywrightActionDefinition = {
  name: 'login-to-staging',
  description: 'Login to our staging environment',
  inputSchema: z.object({
    role: z.enum(['admin', 'user']).optional()
  }),
  async run({ page, input, logger, env }) {
    await page.goto(env.STAGING_URL);
    await page.fill('#email', env.STAGING_EMAIL);
    await page.fill('#password', env.STAGING_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForText('Dashboard');

    return { message: 'Successfully logged in' };
  }
};

export default action;
```

### 2. Shortcuts (YAML)
Simple command sequences for repetitive workflows.

```yaml
# .playwright-mcp/shortcuts/login-flow.yaml
commands:
  - type: navigate
    url: ${{STAGING_URL}}
    description: "Navigate to staging"

  - type: fill
    selector: "#email"
    value: ${{USER_EMAIL}}
    description: "Enter email"

  - type: fill
    selector: "#password"
    value: ${{USER_PASSWORD}}
    description: "Enter password"

  - type: click
    selector: 'button[type="submit"]'
    description: "Submit login"

  - type: wait_for_text
    text: "Welcome"
    description: "Wait for success"
```

### 3. Scripts (TypeScript/JavaScript)
Advanced automation with full programming capabilities.

```typescript
// .playwright-mcp/scripts/extract-data.ts
export default async function({ page, args, logger }) {
  await page.goto('https://example.com/data');

  const users = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.user-row'))
      .map(row => ({
        name: row.querySelector('.name').textContent,
        email: row.querySelector('.email').textContent
      }));
  });

  logger(`Extracted ${users.length} users`);
  return { users };
}
```

## 🔐 Environment Variables & Secrets

Keep credentials secure using environment variables with `${{VARIABLE_NAME}}` syntax:

### .env File (at repository root)
```bash
# .env
STAGING_URL=https://staging.myapp.com
USER_EMAIL=test@example.com
USER_PASSWORD=secure-password
API_KEY=your-api-key
```

### Usage in All Automation Types
```yaml
# Shortcuts
- type: navigate
  url: ${{STAGING_URL}}

# Also works in Custom Actions and Scripts
```

## 🧰 Built-in Actions

Playwrighium ships with powerful built-in actions:

- **`browser-session`** ⭐ - Execute 25+ browser commands in one session
- **`execute-shortcut`** - Run YAML command sequences
- **`execute-script`** - Run TypeScript/JavaScript automation
- **`browser-debug`** - Interactive debugging sessions
- **`browser-snapshot`** - Save/restore browser state

**25+ command types available:** navigate, click, fill, screenshot, evaluate, wait_for_text, get_text, scroll, and more!

## 📁 Project Structure

```
.
├── docs/                           # 📚 Comprehensive documentation
│   ├── README.md                   # Documentation overview
│   ├── 01-overview.md              # Core concepts
│   ├── 02-quick-start.md           # Get started guide
│   ├── 04-custom-actions.md        # TypeScript automation tools
│   ├── 05-shortcuts.md             # YAML workflows
│   ├── 06-scripts.md               # Advanced TS/JS logic
│   ├── 08-secrets.md               # Environment variables
│   ├── 09-architecture.md          # System design
│   ├── 10-best-practices.md        # Robust automation patterns
│   └── 11-commands.md              # Complete command reference
├── src/                            # MCP server implementation
│   ├── index.ts                    # Main MCP server
│   └── actions/                    # Built-in actions
│       ├── browser-session.ts      # 🌟 Main browser automation
│       ├── execute-shortcut.ts     # YAML executor
│       ├── execute-script.ts       # TS/JS executor
│       └── types.ts                # Type definitions
├── .playwright-mcp/                # 🎯 Your automation workspace
│   ├── actions/                    # Custom TypeScript actions
│   ├── shortcuts/                  # YAML command sequences
│   ├── scripts/                    # TS/JS automation scripts
│   ├── action-types.d.ts           # Type definitions
│   └── SECRETS.md                  # Environment variable guide
└── package.json
```

## 🔧 MCP Client Setup

### Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "playwrighium": {
      "command": "node",
      "args": ["/path/to/playwrighium/dist/index.js"],
      "env": {
        "PLAYWRIGHIUM_BASE_DIR": "/path/to/playwrighium"
      }
    }
  }
}
```

### VS Code MCP Extension
Configure in workspace settings:

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

## ⚙️ Configuration Options

### Browser Mode
```bash
# Headed (default) - see automation in action
npm run dev

# Headless - run in background
npm run dev -- --headless
PLAYWRIGHIUM_HEADLESS=1 npm run dev
```

### Custom Paths
```bash
# Custom action directory
npm run dev -- --actions /path/to/actions

# Custom base directory
npm run dev -- --base /path/to/project
```

### Environment Variables
```bash
PLAYWRIGHIUM_ACTIONS_DIR=/path/to/actions
PLAYWRIGHIUM_BASE_DIR=/path/to/project
PLAYWRIGHIUM_HEADLESS=1
PLAYWRIGHIUM_VERBOSE=1
```

## 📖 Documentation

### Quick References
- **[Quick Start Guide](./docs/02-quick-start.md)** - Get running in 5 minutes
- **[Command Reference](./docs/11-commands.md)** - All 25+ browser commands
- **[Best Practices](./docs/10-best-practices.md)** - Robust automation patterns

### Deep Dives
- **[Custom Actions](./docs/04-custom-actions.md)** - Build reusable TypeScript tools
- **[Shortcuts](./docs/05-shortcuts.md)** - Master YAML workflows
- **[Scripts](./docs/06-scripts.md)** - Advanced TS/JS automation
- **[Environment Variables](./docs/08-secrets.md)** - Secure credential management
- **[Architecture](./docs/09-architecture.md)** - How Playwrighium works

### Getting Help
- **[Troubleshooting](./docs/13-troubleshooting.md)** - Debug common issues
- **[API Reference](./docs/12-api-reference.md)** - Complete TypeScript interfaces

## 🎯 When to Use What

| Use Case | Tool | Example |
|----------|------|---------|
| **One-off automation** | `browser-session` | Quick form fill, screenshot |
| **Repeated sequences** | **Shortcuts** (YAML) | Login flows, navigation paths |
| **Complex logic** | **Scripts** (TS/JS) | Data extraction, conditional flows |
| **Reusable tools** | **Custom Actions** | App-specific integrations |

## 🌟 Key Features

- 🚀 **TypeScript-first** with full Playwright support
- 🧰 **Dynamic tool loading** from `.playwright-mcp/actions/*.ts|js`
- 🧪 **Zod-powered validation** for every action
- 🧾 **Built-in logging** relayed through MCP notifications
- 🎯 **Persistent browser sessions** with detailed result tracking
- 🔧 **Flexible selector strategies** (CSS, text, role, label, testid, placeholder)
- 🖥️ **Headed browser by default** - see your automation in action
- 🔐 **Secure secret management** with environment variables
- ⚡ **Hot reloading** - edit actions without rebuilding

## 🔄 Development Workflow

```bash
# Development scripts
npm run dev          # Start server with hot reload
npm run build        # Compile TypeScript
npm start           # Run compiled server
npm run check       # Type-check without building
```

## 💡 Example Workflows

### E-commerce Testing
```yaml
# Test complete checkout flow
commands:
  - type: navigate
    url: ${{SHOP_URL}}
  - type: fill
    selector: "#search"
    value: "laptop"
  - type: click
    selector: ".product-card:first-child"
  - type: click
    selector: "#add-to-cart"
  - type: click
    selector: "#checkout"
  - type: screenshot
    path: "checkout-page.png"
```

### Data Extraction
```typescript
// Extract user data from admin panel
export default async function({ page, env }) {
  await page.goto(`${env.ADMIN_URL}/users`);

  const users = await page.$$eval('.user-row', rows =>
    rows.map(row => ({
      id: row.querySelector('.id').textContent,
      name: row.querySelector('.name').textContent,
      email: row.querySelector('.email').textContent
    }))
  );

  return { users, count: users.length };
}
```

### Health Monitoring
```typescript
// Custom action for health checks
const healthCheck: PlaywrightActionDefinition = {
  name: 'health-check',
  description: 'Check application health across environments',
  inputSchema: z.object({
    environments: z.array(z.string()).default(['dev', 'staging'])
  }),
  async run({ page, input, env, logger }) {
    const results = [];

    for (const env_name of input.environments) {
      const url = env[`${env_name.toUpperCase()}_URL`];
      try {
        await page.goto(`${url}/health`);
        const status = await page.textContent('.health-status');
        results.push({ environment: env_name, status, healthy: true });
        logger(`✅ ${env_name}: ${status}`);
      } catch (error) {
        results.push({ environment: env_name, error: error.message, healthy: false });
        logger(`❌ ${env_name}: ${error.message}`);
      }
    }

    return { results };
  }
};
```

## 🚀 Integration Examples

### With AI Agents
```
🤖 "Check the user dashboard and take a screenshot"
→ AI selects: login-to-production action
→ Then: navigate-to-dashboard shortcut
→ Finally: screenshot command
✅ Returns: Dashboard screenshot and user count
```

### With CI/CD Pipelines
```bash
# Automated testing in GitHub Actions
- name: Run health checks
  run: |
    npm run build
    echo '{"environments": ["staging", "production"]}' | \
    node dist/index.js health-check
```

## 📈 Benefits

### For AI Agents
- **Consistent Results**: Pre-tested workflows eliminate variability
- **Faster Execution**: No need to generate steps, just select tools
- **Better Context**: Rich descriptions help AI choose the right tool
- **Structured Output**: Predictable result formats for chaining

### For Developers
- **Reusability**: Write once, use everywhere
- **Version Control**: Track automation changes over time
- **Team Sharing**: Standardized automation across teams
- **Gradual Complexity**: Start simple, add complexity as needed

### For Organizations
- **Standardization**: Consistent automation patterns
- **Knowledge Capture**: Institutional automation knowledge preserved
- **Maintenance**: Update automation logic in one place
- **Security**: Centralized secret management

## 📝 Notes

- **Built-in actions** are loaded from `src/actions/` and always available
- **Custom actions** are loaded from `.playwright-mcp/actions/` (repo-specific)
- **Persistent browser sessions** maintained across actions (configurable)
- **TypeScript actions** executed through `ts-node` automatically
- **Hot reloading** - edit actions without rebuilding, just reload MCP clients
- **Headed by default** - watch your automation run for easier debugging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Write tests and documentation
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Ready to get started?**
1. Follow the [Quick Start Guide](./docs/02-quick-start.md)
2. Explore [example workflows](./docs/)
3. Build your first [Custom Action](./docs/04-custom-actions.md)

Happy automating! 🚀