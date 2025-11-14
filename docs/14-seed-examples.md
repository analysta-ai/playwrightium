# Seed Command Examples

## GitHub Copilot Workspace Setup

```bash
# Navigate to your project
cd my-web-app

# Install Playwrightium configurations
playwrightium seed --loop=copilot

# Commit to version control
git add .github/
git commit -m "Add Playwrightium chatmodels and prompts"
```

**What was created:**
```
.github/
├── chatmodels/
│   └── playwrightium.md
└── prompts/
    ├── create-playwrightium-shortcut.md
    └── create-playwrightium-script.md
```

**Usage in Copilot:**

1. **Reference the chatmodel:**
   ```
   @playwrightium I need to automate our login flow
   ```

2. **Use the prompts:**
   ```
   #file:.github/prompts/create-playwrightium-shortcut.md
   Create a shortcut for staging login
   ```

## Claude Desktop Setup

```bash
# Navigate to your project
cd my-web-app

# Install Claude agent
playwrightium seed --loop=claude
```

**What was created:**
```
.claude/
└── agents/
    └── playwrightium-automation.md
```

**Usage in Claude:**
- The agent is automatically available
- Includes all instructions and best practices
- Guides through test-first workflow

## Team Collaboration

### 1. Commit to Repository

```bash
# After seeding
git add .github/ .claude/
git commit -m "Add Playwrightium AI assistance"
git push
```

### 2. Team Members Clone

```bash
git clone <repo>
cd <repo>
# Configurations are already there!
```

### 3. Consistent Automation Patterns

Everyone on the team gets:
- Same chatmodel/agent instructions
- Same prompts for creating shortcuts/scripts
- Same best practices enforcement
- Same test-first workflow

## CI/CD Integration

### Automatic Setup in GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Playwrightium
        run: npm install -g playwrightium
      
      - name: Seed configurations (if not in repo)
        run: playwrightium seed --loop=copilot
      
      - name: Run browser tests
        run: |
          # Your test commands here
          playwrightium execute-shortcut login-flow.yaml
```

## Multiple Projects

You can run seed in multiple projects:

```bash
# E-commerce project
cd ~/projects/ecommerce
playwrightium seed --loop=copilot

# Admin dashboard project
cd ~/projects/admin-dashboard
playwrightium seed --loop=copilot

# Marketing site project
cd ~/projects/marketing-site
playwrightium seed --loop=claude
```

Each project gets its own isolated configuration.

## Updating Configurations

To update to latest templates:

```bash
# Just run seed again
playwrightium seed --loop=copilot

# It will overwrite existing files with latest versions
```

## Tips

1. **Version Control**: Always commit the generated files so the team has consistent configurations
2. **Documentation**: The generated files are self-documenting - team members can read them directly
3. **Customization**: You can edit the generated files to add project-specific instructions
4. **Updates**: Re-run seed command after Playwrightium updates to get latest templates

## Troubleshooting

### Permission Denied

```bash
# Run with appropriate permissions
sudo playwrightium seed --loop=copilot
```

### Directory Already Exists

The seed command will overwrite existing files. This is safe and intended behavior.

### Git Conflicts

If files are committed and someone else also runs seed:
```bash
git pull  # Get latest
# No need to run seed again if files are already there
```
