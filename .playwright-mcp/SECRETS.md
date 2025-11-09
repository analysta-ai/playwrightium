# Using Environment Variables and Secrets

Playwrighium supports environment variables and secrets in shortcuts, scripts, and actions using the `${{VARIABLE_NAME}}` syntax.

## Setup

1. Create a `.env` file in the repository root:

```bash
# .env (at repository root)
ELITEA_STAGING_URL=https://stage.elitea.ai
ELITEA_STAGING_EMAIL=user@example.com
ELITEA_STAGING_PASSWORD=secure-password-here

GITHUB_USERNAME=myusername
GITHUB_PAT=ghp_xxxxxxxxxxxxx

API_KEY=your-api-key
```

2. Add `.env` to your `.gitignore` to keep secrets safe (already included by default):

```bash
# .env is already in .gitignore
```

## Usage in Shortcuts (YAML)

Use `${{VARIABLE_NAME}}` syntax in your YAML shortcuts:

```yaml
# .playwright-mcp/shortcuts/login.yaml
commands:
  - type: navigate
    url: ${{ELITEA_STAGING_URL}}
  
  - type: fill
    selector: "#username"
    value: ${{ELITEA_STAGING_EMAIL}}
  
  - type: fill
    selector: "#password"
    value: ${{ELITEA_STAGING_PASSWORD}}
  
  - type: click
    selector: 'button[type="submit"]'
```

The variables are interpolated **before** the YAML is parsed, so they work anywhere in the file.

## Usage in Scripts (TypeScript/JavaScript)

Scripts receive `env` and `interpolateSecrets` in their context:

```typescript
// .playwright-mcp/scripts/api-login.ts
export default async function({ page, env, interpolateSecrets, logger }) {
  // Access environment variables directly
  const apiUrl = env.API_URL;
  const apiKey = env.API_KEY;
  
  if (!apiKey) {
    throw new Error('API_KEY is required');
  }
  
  // Use interpolateSecrets for dynamic string construction
  const endpoint = interpolateSecrets('${{API_URL}}/auth/login');
  
  await page.goto(endpoint);
  
  // Set authorization header
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${apiKey}`
  });
  
  return { success: true };
}
```

## Usage in Custom Actions

Custom actions receive `env` and `interpolateSecrets` in the action context:

```typescript
// .playwright-mcp/actions/my-action.ts
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const myAction: PlaywrightActionDefinition = {
  name: 'my-action',
  description: 'Custom action with secrets support',
  inputSchema: z.object({
    targetUrl: z.string().optional(),
  }),
  async run(ctx) {
    // Access environment variables
    const defaultUrl = ctx.env.DEFAULT_URL || 'https://example.com';
    const targetUrl = ctx.input.targetUrl || defaultUrl;
    
    // Use interpolateSecrets if needed
    const processedUrl = ctx.interpolateSecrets(targetUrl);
    
    await ctx.page.goto(processedUrl);
    
    return {
      message: `Navigated to ${processedUrl}`,
    };
  },
};

export default myAction;
```

## Input Argument Interpolation

You can also pass secrets in action inputs using the same syntax:

```json
{
  "url": "${{API_URL}}/endpoint",
  "credentials": {
    "username": "${{USERNAME}}",
    "password": "${{PASSWORD}}"
  }
}
```

These are automatically interpolated before being passed to the action.

## Security Best Practices

1. **Never commit `.env` files** - Add them to `.gitignore`
2. **Use `.env.example`** - Provide a template without real secrets
3. **Rotate secrets regularly** - Update passwords and API keys periodically
4. **Use environment-specific files** - Consider `.env.staging`, `.env.production`, etc.
5. **Limit secret scope** - Only use secrets where necessary

## Error Handling

If a referenced environment variable is not defined, you'll get a clear error:

```
Error: Environment variable "API_KEY" is not defined. Make sure it's set in .env file at repository root
```

Make sure all required variables are defined before running shortcuts or scripts.
