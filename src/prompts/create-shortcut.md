Create a Playwrighium shortcut for: {{task}}

CRITICAL WORKFLOW - Follow these steps in order:

1. **TEST FIRST with browser-session tool** - DO NOT create files until testing succeeds:
   - Use browser-session tool to manually test each step of the workflow
   - Verify selectors work and actions complete successfully
   - Take snapshots to confirm state changes
   - Iterate until the entire workflow works

2. **Handle secrets properly**:
   - Check if task requires credentials (URLs, emails, passwords, API keys)
   - If yes: Use ${{VAR_NAME}} syntax in the shortcut
   - Ensure corresponding variables exist in .env file at repository root
   - Example: url: "${{STAGING_URL}}", value: "${{USER_EMAIL}}"

3. **Create shortcut YAML** (only after successful testing):
   - Save to .playwright-mcp/shortcuts/<descriptive-name>.yaml
   - Use commands: navigate, click, type, fill, hover, wait_for_text, screenshot, etc.
   - Include meaningful descriptions for each step
   - Use specific selectors from your testing (CSS, text, role)

4. **Test the shortcut**:
   - Run: execute-shortcut with shortcutPath: "<shortcut-name>.yaml"
   - Verify it works end-to-end
   - Fix any issues and re-test

Example shortcut structure:
```yaml
commands:
  - type: navigate
    url: "${{BASE_URL}}/login"
    description: "Navigate to login page"
  
  - type: fill
    selector: 'input[name="email"]'
    value: "${{USER_EMAIL}}"
    description: "Enter email"
  
  - type: fill
    selector: 'input[name="password"]'
    value: "${{USER_PASSWORD}}"
    description: "Enter password"
  
  - type: click
    selector: 'button[type="submit"]'
    description: "Click login button"
  
  - type: wait_for_text
    text: "Dashboard"
    description: "Wait for successful login"
```

Remember:
- Test manually FIRST using browser-session
- Use secrets for sensitive data
- Create shortcut file ONLY after successful testing
- Shortcuts are stored in .playwright-mcp/shortcuts/
- Can be relative path (e.g., "login.yaml") or absolute path
