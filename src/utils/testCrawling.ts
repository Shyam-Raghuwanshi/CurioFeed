import { crawlLinksForInterest } from '../server/crawl';
import { INTEREST_OPTIONS } from '../utils/constants';

/**
 * Test function to verify crawling works with mock data fallback
 */
export const testCrawlingFunctionality = async (): Promise<void> => {
  console.log('🧪 Testing crawling functionality with mock data fallback...\n');
  
  for (const interest of INTEREST_OPTIONS) {
    console.log(`Testing interest: ${interest}`);
    
    try {
      const startTime = Date.now();
      const results = await crawlLinksForInterest(interest, 5);
      const endTime = Date.now();
      
      console.log(`✅ ${interest}: Got ${results.length} results in ${endTime - startTime}ms`);
      
      if (results.length > 0) {
        console.log(`  First result: "${results[0].title}" from ${results[0].source}`);
      } else {
        console.log(`  ❌ No results for ${interest}`);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${interest}:`, error);
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🏁 Crawling test completed!');
};

// Auto-run test when module is imported (for quick testing)
if (typeof window !== 'undefined') {
  // Only run in browser environment
  testCrawlingFunctionality().catch(console.error);
}