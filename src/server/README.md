# Server Functions - Crawl API

This directory contains server functions for the CurioFeed application, specifically for web crawling functionality using the Firecrawl API.

## Files

### `crawl.ts`
Main crawling functionality that integrates with Firecrawl API to search and scrape web content based on user interests.

**Key Functions:**

#### `crawlLinksForInterest(interest: Interest, limit?: number): Promise<CrawledLink[]>`
- **Purpose**: Crawls web links relevant to a specific interest category
- **Parameters**:
  - `interest`: Interest category ("Tech", "Design", "Business", "Health", "Finance", "Other")
  - `limit`: Maximum number of links to return (default: 10)
- **Returns**: Array of crawled links with title, URL, source, excerpt, and imageUrl
- **Error Handling**: Returns empty array if API fails

**Example Usage:**
```typescript
import { crawlLinksForInterest } from './server/crawl';

// Get 5 tech-related links
const techLinks = await crawlLinksForInterest('Tech', 5);

// Get default number of design links
const designLinks = await crawlLinksForInterest('Design');
```

#### `testCrawling(): Promise<void>`
- **Purpose**: Test function to verify Firecrawl integration
- **Usage**: Call during development to test API connectivity

### `test-crawl.ts`
Test utilities for verifying the crawling functionality during development.

## Interest Mapping

The function maps interests to specific search terms:

- **Tech**: "tech news", "programming", "developer blogs", "software engineering"
- **Design**: "design trends", "UI UX", "design inspiration", "graphic design"  
- **Business**: "startup news", "business trends", "entrepreneurship", "innovation"
- **Health**: "health tips", "wellness", "fitness", "nutrition"
- **Finance**: "financial news", "investment", "cryptocurrency", "stock market"
- **Other**: Uses the interest name directly as search term

## Configuration

### Environment Variables
- `VITE_FIRECRAWL_API_KEY`: Required API key for Firecrawl service

### Constants Used
- `API_CONFIG.FIRECRAWL_TIMEOUT`: 30 seconds
- `API_CONFIG.RETRY_ATTEMPTS`: 3 attempts
- `API_CONFIG.RETRY_DELAY`: 1 second base delay

## Error Handling

The crawling function implements several layers of error handling:

1. **API Key Validation**: Checks for environment variable
2. **Timeout Protection**: 30-second timeout per request
3. **Retry Logic**: Up to 3 attempts with exponential backoff
4. **Graceful Degradation**: Returns empty array instead of throwing errors
5. **Input Validation**: Validates URLs and filters invalid results

## Response Format

Each crawled link contains:

```typescript
interface CrawledLink {
  title: string;        // Page title (max 100 chars)
  url: string;         // Full URL to the page
  source: string;      // Domain name (e.g., "github.com")
  excerpt: string;     // Description/summary (max 200 chars)
  imageUrl?: string;   // Optional featured image URL
}
```

## Usage in TanStack Start

This server function is designed to be called from TanStack Start server functions or API routes:

```typescript
// In a TanStack Start server function
import { json } from '@tanstack/start'
import { crawlLinksForInterest } from './server/crawl'

export async function GET({ request }) {
  const url = new URL(request.url)
  const interest = url.searchParams.get('interest') as Interest
  const limit = parseInt(url.searchParams.get('limit') || '10')
  
  const links = await crawlLinksForInterest(interest, limit)
  return json({ links })
}
```

## Testing

To test the crawling functionality:

```typescript
import { runTests } from './server/test-crawl'

// Run in development console or test environment
await runTests()
```

## Cost Considerations

- Firecrawl search costs 2 credits per 10 search results
- Function limits results per query to control costs
- Implements deduplication to avoid processing duplicate URLs
- Uses efficient search terms to get relevant results quickly