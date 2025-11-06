import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
config({ path: join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test Firecrawl API key
app.get('/api/test/apikey', (req, res) => {
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
  res.json({ 
    hasApiKey: !!apiKey,
    keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : null
  });
});

// Simple crawl endpoint (using crawl directly)
app.post('/api/feed/crawl', async (req, res) => {
  try {
    const { interest, limit = 10, offset = 0 } = req.body;
    
    console.log('API: Crawl request:', { interest, limit, offset });
    
    if (!interest) {
      return res.status(400).json({ 
        error: 'Missing required parameter: interest' 
      });
    }

    // Import crawl function dynamically to avoid ES module issues
    const { crawlLinksForInterest } = await import('../src/server/crawl.ts');
    
    // Get the API key from environment
    const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
    
    // Get enough items to handle pagination
    const allItems = await crawlLinksForInterest(interest, Math.max(limit + offset, 20), apiKey);
    
    console.log(`API: Crawled ${allItems.length} total items`);
    
    // Apply pagination
    const paginatedItems = allItems.slice(offset, offset + limit);
    
    // Format as SmartFeedResult
    const result = paginatedItems.map(item => ({
      ...item,
      interest
    }));
    
    res.json({ 
      data: result, 
      hasMore: allItems.length > offset + limit,
      total: allItems.length,
      offset,
      limit
    });
    
  } catch (error) {
    console.error('API: Crawl error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to crawl content',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Smart feed endpoint (with engagement data)
app.post('/api/feed/smart', async (req, res) => {
  try {
    const { userId, interest, totalItems = 10, offset = 0, engagementData = [] } = req.body;
    
    console.log('API: Smart feed request:', { userId, interest, totalItems, offset });
    
    if (!userId || !interest) {
      return res.status(400).json({ 
        error: 'Missing required parameters: userId and interest' 
      });
    }

    // For now, fall back to simple crawling until smart algorithm is properly integrated
    const { crawlLinksForInterest } = await import('../src/server/crawl.ts');
    
    // Get the API key from environment
    const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
    
    const allItems = await crawlLinksForInterest(interest, Math.max(totalItems + offset, 20), apiKey);
    const paginatedItems = allItems.slice(offset, offset + totalItems);
    
    const result = paginatedItems.map(item => ({
      ...item,
      interest
    }));
    
    res.json({ 
      data: result, 
      hasMore: allItems.length > offset + totalItems,
      total: allItems.length,
      offset,
      totalItems
    });
    
  } catch (error) {
    console.error('API: Smart feed error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch smart feed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API: Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/test/apikey - Test API key`);
  console.log(`   POST /api/feed/crawl - Direct crawling`);
  console.log(`   POST /api/feed/smart - Smart feed (fallback to crawl)`);
  console.log(`🔑 Firecrawl API Key: ${process.env.VITE_FIRECRAWL_API_KEY ? 'Found' : 'Missing'}`);
});

export default app;