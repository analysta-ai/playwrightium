# Example: Data Scraping Script

Create `.playwright-mcp/scripts/scrape-headlines.ts`:

```typescript
export default async function({ page, args, logger }) {
  logger('Starting headline scrape...');
  
  // Navigate to the page
  await page.goto(args.url || 'https://news.ycombinator.com');
  
  // Wait for content to load
  await page.waitForSelector('.titleline');
  
  // Extract headlines
  const headlines = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.titleline'));
    return items.slice(0, 10).map((item, index) => ({
      rank: index + 1,
      title: item.textContent?.trim() || '',
      url: item.querySelector('a')?.href || '',
    }));
  });
  
  logger(`Scraped ${headlines.length} headlines`);
  
  // Return structured data
  return {
    source: args.url || 'https://news.ycombinator.com',
    scrapedAt: new Date().toISOString(),
    headlines,
  };
}
```

## Usage

Call the MCP tool:

```json
{
  "name": "execute-script",
  "input": {
    "scriptPath": "scrape-headlines.ts",
    "scriptArgs": {
      "url": "https://news.ycombinator.com"
    }
  }
}
```

The script will:
1. Navigate to the URL
2. Wait for content
3. Extract top 10 headlines with URLs
4. Return structured data

You get full Playwright API access + custom logic!
