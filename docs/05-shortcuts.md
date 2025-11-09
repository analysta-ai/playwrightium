# Shortcuts - YAML Command Sequences

Shortcuts are simple YAML files that define sequences of browser commands. They're perfect for repetitive workflows that don't need complex logic.

## 🎯 What are Shortcuts?

Shortcuts are:
- **YAML files** with command sequences
- **Declarative** - describe what to do, not how
- **Reusable** - parameterized with environment variables
- **Simple** - no programming knowledge required
- **Fast** - execute in single browser session

Perfect for: login flows, navigation paths, form filling, data entry workflows.

## 📁 File Structure

Create shortcuts in `.playwright-mcp/shortcuts/`:

```
.playwright-mcp/
└── shortcuts/
    ├── login-staging.yaml
    ├── navigate-to-reports.yaml
    ├── search-products.yaml
    └── take-screenshots.yaml
```

Shortcuts are executed using the built-in `execute-shortcut` action:

```json
{
  "shortcutPath": "login-staging.yaml"
}
```

## 📝 Basic Syntax

### Simple Command Sequence

```yaml
# .playwright-mcp/shortcuts/google-search.yaml
commands:
  - type: navigate
    url: "https://google.com"
    description: "Navigate to Google homepage"

  - type: fill
    selector: 'input[name="q"]'
    value: "Playwright automation"
    description: "Enter search term"

  - type: press_key
    key: "Enter"
    description: "Submit search"

  - type: wait_for_text
    text: "results"
    timeout: 5000
    description: "Wait for search results"

  - type: screenshot
    path: "search-results.png"
    fullPage: true
    description: "Capture results page"
```

### With Environment Variables

```yaml
# .playwright-mcp/shortcuts/login-app.yaml
commands:
  - type: navigate
    url: ${{APP_URL}}
    description: "Navigate to application"

  - type: fill
    selector: "#email"
    value: ${{USER_EMAIL}}
    description: "Enter email address"

  - type: fill
    selector: "#password"
    value: ${{USER_PASSWORD}}
    description: "Enter password"

  - type: click
    selector: 'button[type="submit"]'
    description: "Click login button"

  - type: wait_for_text
    text: "Dashboard"
    timeout: 10000
    description: "Wait for successful login"
```

## 🛠️ Available Commands

### Navigation Commands

#### navigate
Navigate to a URL.
```yaml
- type: navigate
  url: "https://example.com"
  waitUntil: "networkidle"  # Optional: load, domcontentloaded, networkidle
  description: "Go to homepage"
```

#### navigate_back
Go back to previous page.
```yaml
- type: navigate_back
  description: "Go back one page"
```

#### reload
Reload the current page.
```yaml
- type: reload
  description: "Refresh the page"
```

### Input Commands

#### fill
Fill a form field (clears existing content).
```yaml
- type: fill
  selector: "#username"
  value: "john.doe"
  description: "Enter username"
```

#### type
Type text into a field (preserves existing content).
```yaml
- type: type
  selector: "#comment"
  value: "Additional text here"
  delay: 100  # Optional: delay between keystrokes
  description: "Add comment text"
```

#### clear
Clear a form field.
```yaml
- type: clear
  selector: "#search-box"
  description: "Clear search field"
```

### Click Commands

#### click
Click an element.
```yaml
- type: click
  selector: "#submit-btn"
  button: "left"      # Optional: left, right, middle
  clickCount: 1       # Optional: 1=single, 2=double
  description: "Submit form"
```

#### hover
Hover over an element.
```yaml
- type: hover
  selector: ".dropdown-trigger"
  description: "Show dropdown menu"
```

### Keyboard Commands

#### press_key
Press a keyboard key.
```yaml
- type: press_key
  key: "Enter"        # Enter, Tab, Escape, ArrowDown, etc.
  description: "Press Enter key"
```

Common keys: `Enter`, `Tab`, `Escape`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Backspace`, `Delete`, `Home`, `End`, `PageUp`, `PageDown`

### Form Controls

#### check
Check a checkbox.
```yaml
- type: check
  selector: "#agree-terms"
  description: "Accept terms and conditions"
```

#### uncheck
Uncheck a checkbox.
```yaml
- type: uncheck
  selector: "#newsletter"
  description: "Opt out of newsletter"
```

#### select_option
Select from a dropdown.
```yaml
- type: select_option
  selector: "#country"
  value: "US"         # Can be value, text, or index
  description: "Select United States"
```

#### upload_file
Upload files to a file input.
```yaml
- type: upload_file
  selector: "#file-upload"
  files:
    - "/path/to/document.pdf"
    - "/path/to/image.jpg"
  description: "Upload documents"
```

### Wait Commands

#### wait_for_selector
Wait for an element to appear.
```yaml
- type: wait_for_selector
  selector: ".loading-spinner"
  timeout: 10000      # Optional timeout in ms
  description: "Wait for loading to start"
```

#### wait_for_text
Wait for text to appear anywhere on the page.
```yaml
- type: wait_for_text
  text: "Processing complete"
  timeout: 30000
  description: "Wait for processing to finish"
```

#### wait_for_timeout
Wait for a specific duration.
```yaml
- type: wait_for_timeout
  duration: 2000      # Milliseconds
  description: "Wait 2 seconds for animation"
```

### Data Extraction

#### get_text
Extract text from an element.
```yaml
- type: get_text
  selector: ".result-count"
  description: "Get number of results"
```

#### get_url
Get the current page URL.
```yaml
- type: get_url
  description: "Get current page URL"
```

#### get_title
Get the page title.
```yaml
- type: get_title
  description: "Get page title"
```

#### get_attribute
Get an element's attribute value.
```yaml
- type: get_attribute
  selector: "#download-link"
  attribute: "href"
  description: "Get download URL"
```

### Utility Commands

#### screenshot
Take a screenshot.
```yaml
- type: screenshot
  path: "page-capture.png"    # Optional: auto-generated if not provided
  fullPage: true              # Optional: capture full scrollable page
  description: "Capture current state"
```

#### scroll
Scroll the page.
```yaml
- type: scroll
  x: 0          # Optional: horizontal position
  y: 1000       # Optional: vertical position
  description: "Scroll down to load more content"
```

#### evaluate
Execute JavaScript on the page.
```yaml
- type: evaluate
  script: "document.querySelector('#popup').style.display = 'none'"
  description: "Hide popup dialog"
```

## 🔍 Selector Strategies

Shortcuts support multiple selector strategies:

### CSS Selectors
```yaml
selector: "#submit-btn"           # ID
selector: ".btn-primary"          # Class
selector: "button[type='submit']" # Attribute
selector: "form > .input-group"   # Child combinator
```

### Text-based Selectors
```yaml
selector: "Sign In"               # Button/link text
selector: "Welcome, John"         # Any text content
```

### Role-based Selectors
```yaml
selector: "role:button[Submit]"   # Button with name "Submit"
selector: "role:textbox"          # Any text input
selector: "role:link[Home]"       # Link with name "Home"
```

### Specialized Selectors
```yaml
selector: "label:Email Address"   # Form label
selector: "placeholder:Enter email" # Input placeholder
selector: "testid:login-form"     # Test ID attribute
```

## 🎨 Real-World Examples

### 1. Login Flow

```yaml
# .playwright-mcp/shortcuts/login-staging.yaml
commands:
  - type: navigate
    url: ${{STAGING_URL}}
    description: "Navigate to staging environment"

  - type: wait_for_selector
    selector: "#login-form"
    timeout: 5000
    description: "Wait for login form to load"

  - type: fill
    selector: "#email"
    value: ${{STAGING_EMAIL}}
    description: "Enter email address"

  - type: fill
    selector: "#password"
    value: ${{STAGING_PASSWORD}}
    description: "Enter password"

  - type: check
    selector: "#remember-me"
    description: "Check remember me option"

  - type: click
    selector: 'button[type="submit"]'
    description: "Submit login form"

  - type: wait_for_text
    text: "Dashboard"
    timeout: 10000
    description: "Wait for successful redirect"

  - type: screenshot
    path: "login-success.png"
    description: "Capture dashboard after login"
```

### 2. Form Submission

```yaml
# .playwright-mcp/shortcuts/submit-contact-form.yaml
commands:
  - type: navigate
    url: "https://example.com/contact"
    description: "Navigate to contact page"

  - type: fill
    selector: "#name"
    value: ${{CONTACT_NAME}}
    description: "Enter full name"

  - type: fill
    selector: "#email"
    value: ${{CONTACT_EMAIL}}
    description: "Enter email address"

  - type: select_option
    selector: "#subject"
    value: "General Inquiry"
    description: "Select inquiry type"

  - type: fill
    selector: "#message"
    value: ${{CONTACT_MESSAGE}}
    description: "Enter message content"

  - type: check
    selector: "#consent"
    description: "Accept privacy policy"

  - type: click
    selector: "#submit"
    description: "Submit contact form"

  - type: wait_for_text
    text: "Thank you"
    timeout: 5000
    description: "Wait for confirmation message"
```

### 3. E-commerce Product Search

```yaml
# .playwright-mcp/shortcuts/search-products.yaml
commands:
  - type: navigate
    url: ${{SHOP_URL}}
    description: "Navigate to online store"

  - type: fill
    selector: "#search-input"
    value: ${{SEARCH_TERM}}
    description: "Enter product search term"

  - type: click
    selector: "#search-button"
    description: "Execute search"

  - type: wait_for_selector
    selector: ".product-grid"
    timeout: 5000
    description: "Wait for search results"

  - type: select_option
    selector: "#sort-by"
    value: "price-low-high"
    description: "Sort by price ascending"

  - type: wait_for_timeout
    duration: 2000
    description: "Wait for results to re-sort"

  - type: screenshot
    path: "search-results-${{SEARCH_TERM}}.png"
    fullPage: true
    description: "Capture search results page"

  - type: get_text
    selector: ".results-count"
    description: "Get number of products found"
```

### 4. Multi-page Navigation

```yaml
# .playwright-mcp/shortcuts/navigate-admin-panels.yaml
commands:
  # Dashboard
  - type: navigate
    url: ${{ADMIN_URL}}/dashboard
    description: "Go to admin dashboard"

  - type: wait_for_text
    text: "Admin Dashboard"
    description: "Confirm dashboard loaded"

  - type: screenshot
    path: "admin-dashboard.png"
    description: "Capture dashboard"

  # Users section
  - type: click
    selector: "nav a[href='/admin/users']"
    description: "Navigate to users section"

  - type: wait_for_selector
    selector: ".user-table"
    description: "Wait for user table to load"

  - type: screenshot
    path: "admin-users.png"
    description: "Capture users page"

  # Settings section
  - type: click
    selector: "nav a[href='/admin/settings']"
    description: "Navigate to settings"

  - type: wait_for_text
    text: "System Settings"
    description: "Wait for settings page"

  - type: screenshot
    path: "admin-settings.png"
    description: "Capture settings page"

  # Reports section
  - type: click
    selector: "nav a[href='/admin/reports']"
    description: "Navigate to reports"

  - type: wait_for_selector
    selector: ".reports-dashboard"
    description: "Wait for reports to load"

  - type: screenshot
    path: "admin-reports.png"
    description: "Capture reports page"
```

## 🔐 Environment Variables

Use `${{VARIABLE_NAME}}` syntax to inject environment variables:

### .env File
```bash
# .env (at repository root)
STAGING_URL=https://staging.myapp.com
STAGING_EMAIL=test@example.com
STAGING_PASSWORD=secure-password

SHOP_URL=https://shop.example.com
SEARCH_TERM=laptop computers

ADMIN_URL=https://admin.myapp.com
CONTACT_NAME=John Doe
CONTACT_EMAIL=john@example.com
CONTACT_MESSAGE=This is a test message
```

### Variable Usage
```yaml
commands:
  - type: navigate
    url: ${{STAGING_URL}}/login
    description: "Navigate to ${{STAGING_URL}}"

  - type: fill
    selector: "#username"
    value: ${{STAGING_EMAIL}}
    description: "Enter email: ${{STAGING_EMAIL}}"
```

Variables are interpolated before YAML parsing, so they work anywhere in the file.

## ⚡ Execution

### Using execute-shortcut Action

```json
{
  "shortcutPath": "login-staging.yaml"
}
```

### Path Resolution

Shortcuts are found in this order:
1. `.playwright-mcp/shortcuts/login-staging.yaml`
2. `login-staging.yaml` (relative to repository root)
3. Absolute path if provided

### Return Value

```json
{
  "success": true,
  "shortcutPath": "/full/path/to/shortcut.yaml",
  "commandsExecuted": 6,
  "results": [
    {
      "step": 1,
      "command": "navigate",
      "url": "https://staging.myapp.com"
    },
    {
      "step": 2,
      "command": "fill",
      "filled": "#email"
    }
  ]
}
```

## 🔧 Debugging Shortcuts

### Add Detailed Descriptions
```yaml
- type: click
  selector: "#submit-btn"
  description: "Click the blue 'Submit Application' button in the bottom right"
```

### Use Screenshots
```yaml
- type: screenshot
  path: "before-click.png"
  description: "Capture state before clicking submit"

- type: click
  selector: "#submit-btn"
  description: "Click submit button"

- type: screenshot
  path: "after-click.png"
  description: "Capture state after clicking submit"
```

### Add Wait Commands
```yaml
- type: click
  selector: "#load-data"
  description: "Click load data button"

- type: wait_for_timeout
  duration: 3000
  description: "Wait for data loading animation"

- type: wait_for_text
  text: "Data loaded"
  description: "Wait for completion message"
```

### Use Flexible Selectors
```yaml
# Try multiple approaches
- type: click
  selector: 'button:has-text("Submit")'  # Text-based
  description: "Click submit button by text"

# Or role-based
- type: click
  selector: 'role:button[Submit]'
  description: "Click submit button by role"
```

## 📚 Best Practices

### 1. **Descriptive File Names**
```bash
✅ login-to-staging.yaml
✅ search-products-by-category.yaml
✅ submit-user-registration.yaml

❌ action1.yaml
❌ test.yaml
❌ stuff.yaml
```

### 2. **Clear Command Descriptions**
```yaml
✅ description: "Enter user email address for login"
✅ description: "Wait for dashboard to fully load (up to 10 seconds)"
✅ description: "Click the red 'Delete Account' button"

❌ description: "Click button"
❌ description: "Fill field"
❌ description: "Wait"
```

### 3. **Robust Waiting**
```yaml
# Wait for elements before interacting
- type: wait_for_selector
  selector: "#submit-btn"
  timeout: 5000
  description: "Ensure submit button is available"

- type: click
  selector: "#submit-btn"
  description: "Click submit button"
```

### 4. **Environment Variable Organization**
```bash
# Group by environment
STAGING_URL=...
STAGING_EMAIL=...
STAGING_PASSWORD=...

PRODUCTION_URL=...
PRODUCTION_EMAIL=...
PRODUCTION_PASSWORD=...

# Group by feature
SEARCH_TERM=...
FILTER_CATEGORY=...
SORT_ORDER=...
```

### 5. **Error Prevention**
```yaml
# Check for page load
- type: wait_for_text
  text: "Login"
  description: "Confirm login page loaded"

# Use specific selectors
- type: fill
  selector: "form#login-form input[name='email']"  # Specific
  value: ${{USER_EMAIL}}
  description: "Enter email in login form"
```

## 🚀 Advanced Tips

### Conditional Logic (Workarounds)

While shortcuts don't support if/else, you can create multiple shortcuts:

```yaml
# login-admin.yaml
commands:
  - type: navigate
    url: ${{APP_URL}}/admin/login
    # ... admin login steps

# login-user.yaml
commands:
  - type: navigate
    url: ${{APP_URL}}/login
    # ... user login steps
```

### Data Extraction Workflows

```yaml
# Extract data then navigate to next page
- type: get_text
  selector: ".page-title"
  description: "Get current page title"

- type: get_attribute
  selector: "#next-link"
  attribute: "href"
  description: "Get next page URL"

- type: click
  selector: "#next-link"
  description: "Navigate to next page"
```

### Complex Form Handling

```yaml
# Handle multi-step forms
- type: fill
  selector: "#step1-field"
  value: ${{STEP1_VALUE}}
  description: "Fill step 1"

- type: click
  selector: "#next-step"
  description: "Go to step 2"

- type: wait_for_selector
  selector: "#step2-field"
  description: "Wait for step 2 to load"

- type: fill
  selector: "#step2-field"
  value: ${{STEP2_VALUE}}
  description: "Fill step 2"
```

## 🔄 When to Use Shortcuts vs. Other Tools

### Use Shortcuts When:
- ✅ Linear workflow (step 1, step 2, step 3...)
- ✅ Repeatable process (same steps every time)
- ✅ Simple decision making (no complex logic)
- ✅ Form filling and navigation
- ✅ Quick setup/teardown tasks

### Use Scripts When:
- ❌ Complex logic (loops, conditions, calculations)
- ❌ Data processing (parsing, transforming, analyzing)
- ❌ API calls or external integrations
- ❌ Dynamic workflows (different steps based on page content)

### Use Custom Actions When:
- ❌ Reusable tools (used across multiple projects)
- ❌ Complex parameter validation
- ❌ Integration with team workflows
- ❌ Advanced error handling and recovery

## 🚀 Next Steps

- **[Scripts](./06-scripts.md)** - Add programming logic to automation
- **[Environment Variables](./08-secrets.md)** - Secure credential management
- **[Command Reference](./11-commands.md)** - Complete command documentation
- **[Best Practices](./10-best-practices.md)** - Patterns for reliable automation