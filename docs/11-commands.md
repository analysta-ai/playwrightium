# Command Reference - Complete Browser Automation Commands

Complete reference for all browser automation commands available in Playwrighium shortcuts and the `browser-session` action.

## 🎯 Command Overview

All commands use the same structure:

```yaml
- type: command_name
  # Required parameters
  selector: "#element"
  value: "input value"
  # Optional parameters
  timeout: 5000
  description: "Human-readable description"
```

## 🧭 Navigation Commands

### navigate
Navigate to a URL.

**Parameters:**
- `url` (required): Target URL
- `waitUntil` (optional): When to consider navigation complete
  - `'load'` - Wait for load event (default)
  - `'domcontentloaded'` - Wait for DOM ready
  - `'networkidle'` - Wait for no network activity

**Examples:**
```yaml
- type: navigate
  url: "https://example.com"
  description: "Navigate to homepage"

- type: navigate
  url: ${{APP_URL}}/dashboard
  waitUntil: "networkidle"
  description: "Navigate to dashboard and wait for full load"
```

### navigate_back
Go back to the previous page.

**Parameters:**
- None

**Example:**
```yaml
- type: navigate_back
  description: "Go back to previous page"
```

### reload
Reload the current page.

**Parameters:**
- None

**Example:**
```yaml
- type: reload
  description: "Refresh the current page"
```

## 👆 Click Commands

### click
Click on an element.

**Parameters:**
- `selector` (required): Element selector
- `button` (optional): Mouse button (`'left'`, `'right'`, `'middle'`)
- `clickCount` (optional): Number of clicks (1=single, 2=double)

**Examples:**
```yaml
# Basic click
- type: click
  selector: "#submit-btn"
  description: "Click submit button"

# Right click for context menu
- type: click
  selector: ".file-item"
  button: "right"
  description: "Right-click file for context menu"

# Double click
- type: click
  selector: ".folder-icon"
  clickCount: 2
  description: "Double-click to open folder"
```

### hover
Hover over an element.

**Parameters:**
- `selector` (required): Element selector

**Example:**
```yaml
- type: hover
  selector: ".dropdown-trigger"
  description: "Hover to show dropdown menu"
```

## ⌨️ Input Commands

### fill
Fill a form field (clears existing content first).

**Parameters:**
- `selector` (required): Form field selector
- `value` (required): Text to fill

**Examples:**
```yaml
- type: fill
  selector: "#email"
  value: ${{USER_EMAIL}}
  description: "Enter email address"

- type: fill
  selector: 'input[name="search"]'
  value: "search query"
  description: "Enter search term"
```

### type
Type text into a field (preserves existing content).

**Parameters:**
- `selector` (required): Form field selector
- `value` (required): Text to type
- `delay` (optional): Delay between keystrokes in milliseconds

**Examples:**
```yaml
- type: type
  selector: "#comment"
  value: "Additional comments here"
  description: "Add comment text"

- type: type
  selector: "#code-editor"
  value: "console.log('hello');"
  delay: 50
  description: "Type code slowly for demo"
```

### clear
Clear the content of a form field.

**Parameters:**
- `selector` (required): Form field selector

**Example:**
```yaml
- type: clear
  selector: "#search-box"
  description: "Clear search field"
```

## ⌨️ Keyboard Commands

### press_key
Press a keyboard key.

**Parameters:**
- `key` (required): Key name to press

**Common Keys:**
- Navigation: `Enter`, `Tab`, `Escape`, `Space`
- Arrows: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- Editing: `Backspace`, `Delete`, `Home`, `End`
- Page: `PageUp`, `PageDown`
- Function: `F1`, `F2`, ... `F12`
- Modifiers: `Control`, `Alt`, `Shift`, `Meta`

**Examples:**
```yaml
- type: press_key
  key: "Enter"
  description: "Press Enter to submit"

- type: press_key
  key: "Escape"
  description: "Press Escape to close dialog"

- type: press_key
  key: "Control+A"
  description: "Select all text"
```

## ☑️ Form Control Commands

### check
Check a checkbox.

**Parameters:**
- `selector` (required): Checkbox selector

**Example:**
```yaml
- type: check
  selector: "#agree-terms"
  description: "Accept terms and conditions"
```

### uncheck
Uncheck a checkbox.

**Parameters:**
- `selector` (required): Checkbox selector

**Example:**
```yaml
- type: uncheck
  selector: "#newsletter"
  description: "Opt out of newsletter"
```

### select_option
Select an option from a dropdown.

**Parameters:**
- `selector` (required): Select element selector
- `value` (required): Option value, text, or index

**Examples:**
```yaml
# Select by value
- type: select_option
  selector: "#country"
  value: "US"
  description: "Select United States"

# Select by visible text
- type: select_option
  selector: "#category"
  value: "Electronics"
  description: "Select electronics category"

# Select by index (0-based)
- type: select_option
  selector: "#priority"
  value: "2"
  description: "Select third option"
```

### upload_file
Upload files to a file input.

**Parameters:**
- `selector` (required): File input selector
- `files` (required): Array of file paths

**Examples:**
```yaml
# Single file
- type: upload_file
  selector: "#avatar-upload"
  files:
    - "/path/to/profile.jpg"
  description: "Upload profile picture"

# Multiple files
- type: upload_file
  selector: "#document-upload"
  files:
    - "/path/to/document1.pdf"
    - "/path/to/document2.pdf"
  description: "Upload multiple documents"
```

## ⏳ Wait Commands

### wait_for_selector
Wait for an element to appear.

**Parameters:**
- `selector` (required): Element selector to wait for
- `timeout` (optional): Maximum wait time in milliseconds

**Examples:**
```yaml
- type: wait_for_selector
  selector: ".loading-spinner"
  timeout: 10000
  description: "Wait for loading spinner to appear"

- type: wait_for_selector
  selector: ".content-loaded"
  description: "Wait for content to load"
```

### wait_for_text
Wait for specific text to appear anywhere on the page.

**Parameters:**
- `text` (required): Text to wait for
- `timeout` (optional): Maximum wait time in milliseconds

**Examples:**
```yaml
- type: wait_for_text
  text: "Welcome back!"
  timeout: 5000
  description: "Wait for welcome message"

- type: wait_for_text
  text: "Processing complete"
  timeout: 30000
  description: "Wait for processing to finish"
```

### wait_for_timeout
Wait for a specific duration.

**Parameters:**
- `duration` (required): Time to wait in milliseconds

**Examples:**
```yaml
- type: wait_for_timeout
  duration: 2000
  description: "Wait 2 seconds for animation"

- type: wait_for_timeout
  duration: 5000
  description: "Wait 5 seconds for page to settle"
```

## 📊 Data Extraction Commands

### get_text
Extract text content from an element.

**Parameters:**
- `selector` (required): Element selector

**Examples:**
```yaml
- type: get_text
  selector: ".result-count"
  description: "Get number of search results"

- type: get_text
  selector: "h1"
  description: "Get page title"
```

### get_attribute
Get an attribute value from an element.

**Parameters:**
- `selector` (required): Element selector
- `attribute` (required): Attribute name

**Examples:**
```yaml
- type: get_attribute
  selector: "#download-link"
  attribute: "href"
  description: "Get download URL"

- type: get_attribute
  selector: ".product-image"
  attribute: "alt"
  description: "Get image alt text"

- type: get_attribute
  selector: "#user-form"
  attribute: "data-user-id"
  description: "Get user ID from form"
```

### get_url
Get the current page URL.

**Parameters:**
- None

**Example:**
```yaml
- type: get_url
  description: "Get current page URL"
```

### get_title
Get the current page title.

**Parameters:**
- None

**Example:**
```yaml
- type: get_title
  description: "Get page title"
```

## 📸 Utility Commands

### screenshot
Take a screenshot of the page.

**Parameters:**
- `path` (optional): File path to save screenshot (auto-generated if not provided)
- `fullPage` (optional): Capture full scrollable page (default: false)

**Examples:**
```yaml
# Basic screenshot
- type: screenshot
  path: "homepage.png"
  description: "Capture homepage"

# Full page screenshot
- type: screenshot
  path: "full-page.png"
  fullPage: true
  description: "Capture entire page"

# Auto-generated filename
- type: screenshot
  description: "Take screenshot with auto-generated name"
```

### scroll
Scroll the page to specific coordinates.

**Parameters:**
- `x` (optional): Horizontal scroll position
- `y` (optional): Vertical scroll position

**Examples:**
```yaml
# Scroll down
- type: scroll
  y: 1000
  description: "Scroll down 1000 pixels"

# Scroll to specific position
- type: scroll
  x: 0
  y: 2000
  description: "Scroll to position (0, 2000)"

# Scroll to top
- type: scroll
  x: 0
  y: 0
  description: "Scroll to top of page"
```

### evaluate
Execute JavaScript code on the page.

**Parameters:**
- `script` (required): JavaScript code to execute

**Examples:**
```yaml
# Hide popup
- type: evaluate
  script: "document.querySelector('#popup').style.display = 'none'"
  description: "Hide popup dialog"

# Scroll element into view
- type: evaluate
  script: "document.querySelector('#target').scrollIntoView()"
  description: "Scroll element into view"

# Set localStorage
- type: evaluate
  script: "localStorage.setItem('theme', 'dark')"
  description: "Set dark theme preference"

# Get computed style
- type: evaluate
  script: "window.getComputedStyle(document.querySelector('#element')).color"
  description: "Get element color"
```

### drag
Drag an element to another location.

**Parameters:**
- `selector` (required): Source element selector
- `targetSelector` (required): Target element selector

**Example:**
```yaml
- type: drag
  selector: ".draggable-item"
  targetSelector: ".drop-zone"
  description: "Drag item to drop zone"
```

## 🔍 Selector Strategies

Playwrighium supports multiple selector strategies for maximum flexibility:

### CSS Selectors
```yaml
selector: "#submit-btn"           # ID
selector: ".btn-primary"          # Class
selector: "button[type='submit']" # Attribute
selector: "form > .input-group"   # Child combinator
selector: "input:nth-child(2)"    # Pseudo-selector
```

### Text-Based Selectors
```yaml
selector: "Sign In"               # Button/link text
selector: "Welcome, John"         # Any element with text
selector: "text=Exact match"      # Exact text match
```

### Role-Based Selectors
```yaml
selector: "role:button"           # Any button
selector: "role:button[Submit]"   # Button with accessible name "Submit"
selector: "role:textbox"          # Any text input
selector: "role:link[Home]"       # Link with accessible name "Home"
```

### Specialized Selectors
```yaml
selector: "label:Email Address"   # Element with label text
selector: "placeholder:Enter email" # Input with placeholder
selector: "testid:login-form"     # Element with data-testid
selector: "title:Click here"      # Element with title attribute
```

### Advanced Selectors
```yaml
# Has text content
selector: "div:has-text('Welcome')"

# Has child element
selector: "article:has(.author)"

# Visible elements only
selector: "button:visible"

# Nth match
selector: "tr >> nth=2"

# Within another element
selector: "#container >> .item"
```

## 📋 Common Patterns

### Login Flow
```yaml
commands:
  - type: navigate
    url: ${{APP_URL}}/login
    description: "Navigate to login page"

  - type: wait_for_selector
    selector: "#login-form"
    description: "Wait for login form"

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
    text: "Dashboard"
    description: "Wait for successful login"
```

### Form Submission with Validation
```yaml
commands:
  - type: fill
    selector: "#name"
    value: "John Doe"
    description: "Enter name"

  - type: fill
    selector: "#email"
    value: "john@example.com"
    description: "Enter email"

  - type: click
    selector: "#submit"
    description: "Submit form"

  # Wait for either success or error
  - type: wait_for_selector
    selector: ".success-message, .error-message"
    description: "Wait for form result"

  - type: screenshot
    path: "form-result.png"
    description: "Capture form submission result"
```

### Data Extraction
```yaml
commands:
  - type: navigate
    url: ${{DATA_URL}}
    description: "Navigate to data page"

  - type: wait_for_selector
    selector: ".data-table"
    description: "Wait for data table to load"

  - type: get_text
    selector: ".total-count"
    description: "Get total record count"

  - type: get_attribute
    selector: ".download-link"
    attribute: "href"
    description: "Get download URL"

  - type: screenshot
    path: "data-page.png"
    description: "Capture data page"
```

### Multi-Step Workflow
```yaml
commands:
  # Step 1: Setup
  - type: navigate
    url: ${{APP_URL}}/workflow
    description: "Navigate to workflow page"

  - type: click
    selector: "#start-workflow"
    description: "Start workflow"

  # Step 2: Wait for processing
  - type: wait_for_text
    text: "Step 1 Complete"
    timeout: 30000
    description: "Wait for step 1"

  - type: click
    selector: "#continue-step2"
    description: "Continue to step 2"

  # Step 3: Final confirmation
  - type: wait_for_text
    text: "Step 2 Complete"
    timeout: 30000
    description: "Wait for step 2"

  - type: click
    selector: "#finalize"
    description: "Finalize workflow"

  - type: wait_for_text
    text: "Workflow Complete"
    description: "Wait for completion"

  - type: screenshot
    path: "workflow-complete.png"
    description: "Capture final result"
```

## ⚠️ Command Best Practices

### 1. **Always Use Descriptions**
```yaml
# ✅ Good - clear description
- type: click
  selector: "#submit-payment"
  description: "Submit payment form and process transaction"

# ❌ Bad - no description
- type: click
  selector: "#submit-payment"
```

### 2. **Wait Before Interacting**
```yaml
# ✅ Good - wait for element
- type: wait_for_selector
  selector: "#dynamic-button"
  description: "Wait for button to appear"

- type: click
  selector: "#dynamic-button"
  description: "Click the button"

# ❌ Bad - might click before element is ready
- type: click
  selector: "#dynamic-button"
```

### 3. **Use Appropriate Timeouts**
```yaml
# ✅ Good - appropriate timeouts
- type: wait_for_selector
  selector: ".quick-loading"
  timeout: 5000
  description: "Wait for quick content"

- type: wait_for_text
  text: "Processing complete"
  timeout: 60000
  description: "Wait for long processing"

# ❌ Bad - same timeout for everything
- type: wait_for_selector
  selector: ".quick-loading"
  timeout: 30000
```

### 4. **Use Stable Selectors**
```yaml
# ✅ Good - stable selectors
selector: "[data-testid='submit-button']"  # Test ID
selector: "#unique-id"                     # Unique ID
selector: "role:button[Submit]"            # Semantic role

# ❌ Bad - fragile selectors
selector: ".btn.btn-primary.btn-lg"        # Multiple classes
selector: "div > div > button:nth-child(3)" # Structure-dependent
```

### 5. **Take Strategic Screenshots**
```yaml
# ✅ Good - screenshots at key points
- type: screenshot
  path: "before-action.png"
  description: "Capture state before critical action"

- type: click
  selector: "#critical-button"
  description: "Perform critical action"

- type: screenshot
  path: "after-action.png"
  description: "Capture result of critical action"
```

## 🚀 Next Steps

- **[Shortcuts Guide](./05-shortcuts.md)** - Learn how to use commands in YAML
- **[Browser Session Action](./07-builtin-actions.md)** - Use commands in JSON format
- **[Best Practices](./10-best-practices.md)** - Patterns for reliable automation
- **[Troubleshooting](./13-troubleshooting.md)** - Debug command issues

This command reference gives you the building blocks for any browser automation workflow. Combine these commands creatively to accomplish your automation goals! 🎯