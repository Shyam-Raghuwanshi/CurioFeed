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
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
if (NODE_ENV === 'development') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }));
} else {
  // Production: more permissive CORS for deployment
  app.use(cors({
    origin: true,
    credentials: true
  }));
  
  // Serve static files in production
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

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
    
    // Always fetch fresh content for each request to ensure new content
    // This allows the infinite scroll to continue working by getting new search results
    const itemsToFetch = limit * 3; // Fetch more to account for potential duplicates and filtering
    const allItems = await crawlLinksForInterest(interest, itemsToFetch, apiKey);
    
    console.log(`API: Crawled ${allItems.length} total items`);
    
    // Apply pagination - but since we're fetching fresh content each time,
    // we don't slice by offset, instead we just return the latest results
    const result = allItems.slice(0, limit).map(item => ({
      ...item,
      interest
    }));
    
    // Always indicate there's more content available for infinite scroll
    // Since we're crawling real-time web content, there's always potentially more
    const hasMore = result.length === limit && allItems.length > 0;
    
    res.json({ 
      data: result, 
      hasMore: hasMore,
      total: allItems.length,
      offset: offset + result.length,
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

// Catch-all handler for React Router (only in production)
if (NODE_ENV !== 'development') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

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