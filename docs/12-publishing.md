# Publishing to NPM

## Setup (One-time)

1. **Create NPM account** (if you don't have one):
   ```bash
   npm adduser
   ```

2. **Get NPM Access Token**:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token"
   - Select "Automation" (for CI/CD)
   - Copy the token

3. **Add NPM_TOKEN to GitHub Secrets**:
   - Go to https://github.com/analysta-ai/playwrightium/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

## Publishing a New Version

### Option 1: Automatic (via GitHub Actions)

1. Update version in `package.json`:
   ```bash
   npm version patch  # for 0.1.0 -> 0.1.1
   # or
   npm version minor  # for 0.1.0 -> 0.2.0
   # or
   npm version major  # for 0.1.0 -> 1.0.0
   ```

2. Push the tag:
   ```bash
   git push --follow-tags
   ```

3. GitHub Actions will automatically:
   - Build the project
   - Run tests
   - Publish to NPM

### Option 2: Manual

1. Build the project:
   ```bash
   npm run build
   ```

2. Login to NPM:
   ```bash
   npm login
   ```

3. Publish:
   ```bash
   npm publish --access public
   ```

## Verify Publication

After publishing, verify at:
- https://www.npmjs.com/package/playwrighium

## Version Guidelines

- **Patch** (0.1.x): Bug fixes, small improvements
- **Minor** (0.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

## What Gets Published

The following files/folders are included in the NPM package:
- `dist/` - Compiled JavaScript
- `README.md` - Documentation
- `.playwright-mcp/` - Examples and templates
- `LICENSE` - License file

The following are excluded (see `.npmignore`):
- `src/` - TypeScript source
- `node_modules/`
- `.env` files
- Development files
