# Playwrightium Seed Command

The `seed` command installs Playwrightium chatmodels and prompts to your project for AI assistant integration.

## Usage

```bash
# For GitHub Copilot
playwrightium seed --loop=copilot

# For Claude
playwrightium seed --loop=claude
```

## What Gets Created

### GitHub Copilot (`--loop=copilot`)

Creates files in `.github/` directory:

```
.github/
├── chatmodes/
│   ├── test-developer.chatmode.md              # QA Engineer for exploratory testing
│   └── test-executor.chatmode.md               # QA Engineer for test execution
└── prompts/
    ├── create-playwrightium-shortcut.prompt.md # Shortcut creation guide
    └── create-playwrightium-script.prompt.md   # Script creation guide
```

**Usage in Copilot:**
- Reference chatmode with `@test-developer` in chat
- Use prompts with `#file` references in workspace

### Claude (`--loop=claude`)

Creates files in `.claude/` directory:

```
.claude/
├── agents/
│   ├── test-developer.md                  # QA Engineer for exploratory testing
│   └── test-executor.md                   # QA Engineer for test execution
└── skills/
    ├── create-playwrightium-shortcut.md   # Shortcut creation guide
    └── create-playwrightium-script.md     # Script creation guide
```

**Usage in Claude:**
- Reference agent with `@test-developer` in Claude Desktop
- Skills are automatically available to the agent

## What the Files Contain

### Chatmodel/Agent Instructions
- Available MCP tools overview
- Best practices for browser automation
- Workflow guidance (test first, use secrets, proper selectors)
- Error handling patterns

### Prompts
- **create-shortcut**: Step-by-step guide for creating YAML shortcuts
- **create-script**: Step-by-step guide for creating TypeScript scripts
- Both enforce test-first workflow and proper secret management

## Examples

### Setup for GitHub Copilot Project

```bash
cd my-project
playwrightium seed --loop=copilot
git add .github/
git commit -m "Add Playwrightium chatmodels and prompts"
```

Now team members can use:
```
@test-developer create a login shortcut for staging
#file:.github/prompts/create-playwrightium-shortcut.prompt.md
```

### Setup for Claude Project

```bash
cd my-project
playwrightium seed --loop=claude
```

Now the test-developer agent with skills will be available in Claude Desktop.

## Integration with CI/CD

These files can be committed to version control so the entire team has consistent AI assistance for browser automation.

```yaml
# .github/workflows/setup.yml
- name: Setup Playwrightium
  run: npx playwrightium seed --loop=copilot
```

## Notes

- Files are created in current working directory
- Directories are created automatically if they don't exist
- Safe to run multiple times (overwrites existing files)
- No configuration required - works out of the box
