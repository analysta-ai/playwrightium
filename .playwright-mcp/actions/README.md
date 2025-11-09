# User Custom Actions

This folder is for **your custom actions** - automation workflows specific to your project.

## 🎯 Purpose

- Store repo-specific automation actions
- Keep your custom workflows version-controlled
- Separate from built-in playwrighium actions

## 📝 Creating Custom Actions

### Quick Start

1. **Copy an example:**
   ```bash
   cp ../examples/example-login.ts ./my-action.ts
   ```

2. **Edit the action:**
   - Change the `name` field
   - Update `description`
   - Modify `inputSchema` for your parameters
   - Update the `run` function with your logic

3. **Reload MCP servers** in VS Code

4. **Your action is now available!**

### Action Template

```typescript
import { z } from 'zod';
import type { PlaywrightActionDefinition } from '../action-types';

const myAction: PlaywrightActionDefinition = {
  name: 'my-custom-action',
  title: 'My Custom Action',
  description: 'What this action does',
  inputSchema: z.object({
    // Your parameters here
    url: z.string().describe('Target URL'),
    username: z.string(),
    // ... more fields
  }),
  headless: false, // Set to true for CI/production
  async run({ page, context, browser, input, logger }) {
    await logger('Starting my custom action');
    
    // Your automation logic here
    await page.goto(input.url);
    // ...
    
    return {
      message: 'Action completed',
      structuredContent: {
        // Return data for other actions to use
        result: 'success'
      }
    };
  }
};

export default myAction;
```

## 📚 Examples to Copy From

Check the `../examples/` folder for:

- `example-login.ts` - Simple login workflow
- `login-then-automate.ts` - Parameterized multi-step
- `interactive-session.ts` - Manual exploration mode
- `setup-authenticated-session.ts` - Save auth state
- `complete-complex-workflow.ts` - Complex E2E workflow
- `browser-session.ts` - Full Playwright wrapper

## 🏗️ Built-in Actions

You don't need to copy these - they're always available:

- **`browser-session`** - Execute multiple commands in one session
- **`login-then-automate`** - Login + custom steps
- **`interactive-session`** - Setup + manual control
- **`setup-authenticated-session`** - Save authentication state
- **`complete-complex-workflow`** - Multi-step template

Just use them directly! Custom actions here are for your **additional** workflows.

## 💡 When to Create Custom Actions

Create custom actions when you need:

✅ **Application-specific workflows**
- Login to YOUR app
- Fill YOUR forms
- Navigate YOUR pages

✅ **Reusable automation**
- Run the same flow multiple times
- Share with team members
- Version control your automation

✅ **Complex business logic**
- Multi-step processes
- Conditional flows
- Data validation

✅ **TypeScript power**
- Type-safe parameters
- Advanced logic
- Helper functions

## 🆚 When to Use Built-in Actions

Use built-in actions when you need:

✅ **General automation**
- One-off tasks
- Exploration
- Testing different approaches

✅ **Quick scripts**
- Don't need reuse
- Rapid iteration
- Learning/experimenting

Use `browser-session` for most tasks, create custom actions for repeated workflows.

## 📁 Structure

```
.playwright-mcp/
├── action-types.d.ts    # Type definitions (auto-generated)
└── actions/             # Your custom actions (this folder)
    ├── my-app-login.ts
    ├── submit-form.ts
    └── data-export.ts
```

## 🔄 Development Workflow

1. **Create** action file here
2. **Edit** and save
3. **Reload** MCP servers in VS Code
4. **Test** your action
5. **Iterate** until it works
6. **Commit** to version control

## 📖 Documentation

See `../examples/` folder for:
- `INDEX.md` - Navigation guide
- `QUICK-REFERENCE.md` - Command cheat sheet
- `BROWSER-SESSION-GUIDE.md` - Complete command reference
- `WORKFLOW-GUIDE.md` - Patterns and best practices
- `ARCHITECTURE.md` - System design

## 💡 Tips

1. **Start from examples** - Don't write from scratch
2. **Use descriptive names** - `login-to-staging` not `action1`
3. **Add good descriptions** - Help AI understand when to use it
4. **Log progress** - Use `await logger()` liberally
5. **Return structured data** - Make results useful for other actions
6. **Test incrementally** - Build up complexity gradually

## 🎓 Example Use Cases

### Application Login
```typescript
name: 'login-to-myapp',
description: 'Login to MyApp staging environment',
// ... implement your specific login flow
```

### Form Submission
```typescript
name: 'submit-user-form',
description: 'Fill and submit the user registration form',
// ... your form fields and validation
```

### Data Export
```typescript
name: 'export-report-data',
description: 'Navigate to reports and export data as CSV',
// ... your navigation and export logic
```

### E2E Test Flow
```typescript
name: 'complete-checkout-flow',
description: 'Full e-commerce checkout process',
// ... add to cart, checkout, payment
```

## 🚀 Next Steps

1. Check `../examples/README.md` for detailed guidance
2. Copy an example that's close to what you need
3. Modify it for your use case
4. Test and iterate
5. Share with your team!

---

**This folder is yours!** Add any custom actions your project needs.
