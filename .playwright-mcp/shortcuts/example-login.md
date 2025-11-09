# Example: GitHub Login Shortcut

Create `.playwright-mcp/shortcuts/login-github.yaml`:

```yaml
commands:
  - type: navigate
    url: https://github.com/login
  
  - type: fill
    selector: "#login_field"
    value: your-username
  
  - type: fill
    selector: "#password"
    value: your-password
  
  - type: click
    selector: 'input[name="commit"]'
  
  - type: wait_for_selector
    selector: '[data-login-status="authenticated"]'
    timeout: 5000
  
  - type: screenshot
    path: github-logged-in.png
```

## Usage

Call the MCP tool:

```json
{
  "name": "execute-shortcut",
  "input": {
    "shortcutPath": "login-github.yaml"
  }
}
```

The shortcut will:
1. Navigate to GitHub login
2. Fill username and password
3. Click submit
4. Wait for authentication
5. Take a screenshot

All in the same browser session!
