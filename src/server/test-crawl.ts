// Test file for the crawl functionality
// This can be run in development to verify the Firecrawl integration

import { crawlLinksForInterest, testCrawling } from './crawl';

// Test individual interest
async function testSingleInterest() {
  console.log('Testing single interest...');
  const results = await crawlLinksForInterest('Tech', 3);
  console.log('Tech results:', results);
}

// Run the full test suite
async function runTests() {
  try {
    await testCrawling();
    await testSingleInterest();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

export { runTests };