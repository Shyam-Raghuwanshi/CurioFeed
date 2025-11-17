/**
 * Test script for AI Service
 * Run this to verify the AI functionality works correctly
 */

import { summarizeArticle, deepResearch } from '../src/services/aiService.js';

async function testAIService() {
  console.log('🧪 Testing AI Service Integration...\n');

  // Test data
  const testTitle = "AI Breakthrough: New Language Model Shows Human-Level Reasoning";
  const testExcerpt = "Researchers have developed a revolutionary AI system that demonstrates unprecedented reasoning capabilities, potentially changing the landscape of artificial intelligence and its applications across industries.";
  const testUrl = "https://example.com/ai-breakthrough";

  try {
    console.log('📝 Testing Smart Summary...');
    const summary = await summarizeArticle(testTitle, testExcerpt, testUrl);
    
    if (summary.success) {
      console.log('✅ Summary Success!');
      console.log('Content Preview:', summary.content.substring(0, 200) + '...\n');
    } else {
      console.log('❌ Summary Failed:', summary.error, '\n');
    }

    console.log('🔍 Testing Deep Research...');
    const research = await deepResearch(testTitle, testExcerpt);
    
    if (research.success) {
      console.log('✅ Research Success!');
      console.log('Content Preview:', research.content.substring(0, 200) + '...\n');
      if (research.sources) {
        console.log('📚 Sources found:', research.sources.length);
      }
    } else {
      console.log('❌ Research Failed:', research.error, '\n');
    }

    console.log('🎉 AI Service Test Complete!');
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  }
}

// Run the test
testAIService();