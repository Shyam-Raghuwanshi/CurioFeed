// Example TanStack Start API route that uses the crawl function
// This file shows how to integrate the crawlLinksForInterest function
// into a TanStack Start server function or API route

// Note: Import json from @tanstack/start when setting up actual routes
// import { json } from '@tanstack/start';
import { crawlLinksForInterest, type Interest } from './index';

// Mock json response helper for example purposes
const json = (data: Record<string, unknown>, options?: { status?: number }) => ({
  ...data,
  status: options?.status || 200,
});

/**
 * Example server function for TanStack Start
 * GET /api/crawl?interest=Tech&limit=10
 */
export async function GET({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const interest = url.searchParams.get('interest') as Interest;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Validate interest parameter
    if (!interest) {
      return json({ error: 'Interest parameter is required' }, { status: 400 });
    }

    // Validate limit parameter
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return json({ error: 'Limit must be between 1 and 50' }, { status: 400 });
    }

    // Crawl links for the specified interest
    const links = await crawlLinksForInterest(interest, limit);

    return json({
      success: true,
      data: {
        interest,
        limit,
        count: links.length,
        links,
      },
    });
  } catch (error) {
    console.error('Error in crawl API route:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Example POST endpoint for batch crawling multiple interests
 * POST /api/crawl/batch
 * Body: { interests: ["Tech", "Design"], limit: 5 }
 */
export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { interests, limit = 10 } = body;

    // Validate input
    if (!Array.isArray(interests) || interests.length === 0) {
      return json({ error: 'Interests array is required' }, { status: 400 });
    }

    if (interests.length > 5) {
      return json({ error: 'Maximum 5 interests allowed per batch' }, { status: 400 });
    }

    // Crawl links for all interests in parallel
    const results = await Promise.all(
      interests.map(async (interest: Interest) => {
        const links = await crawlLinksForInterest(interest, limit);
        return { interest, links };
      })
    );

    return json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error in batch crawl API route:', error);
    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}