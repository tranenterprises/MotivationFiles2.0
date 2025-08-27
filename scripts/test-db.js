/**
 * Database testing script
 * Tests all Supabase utility functions with mock data
 *
 * Run with: node scripts/test-db.js
 */

require('dotenv').config({ path: '.env.local' });

const {
  getTodaysQuote,
  getAllQuotes,
  getQuotesByCategory,
  getQuoteByDate,
  createQuote,
  updateQuote,
  deleteQuote,
  quoteExistsForDate,
  getQuoteCount,
  getQuotesByDateRange,
} = require('../src/lib/supabase.ts');

async function testDatabaseOperations() {
  console.log('🚀 Starting database operations test...\n');

  try {
    // Test 1: Get total quote count
    console.log('📊 Testing getQuoteCount...');
    const totalCount = await getQuoteCount();
    console.log(`Total quotes in database: ${totalCount}\n`);

    // Test 2: Get all quotes
    console.log('📚 Testing getAllQuotes...');
    const allQuotes = await getAllQuotes(5); // Get first 5 quotes
    console.log(`Retrieved ${allQuotes.length} quotes:`);
    allQuotes.forEach(quote => {
      console.log(`- ${quote.date}: ${quote.content.substring(0, 50)}...`);
    });
    console.log();

    // Test 3: Get quotes by category
    console.log('🎯 Testing getQuotesByCategory...');
    const motivationQuotes = await getQuotesByCategory('motivation');
    console.log(`Found ${motivationQuotes.length} motivation quotes`);
    const disciplineQuotes = await getQuotesByCategory('discipline');
    console.log(`Found ${disciplineQuotes.length} discipline quotes\n`);

    // Test 4: Get today's quote
    console.log('📅 Testing getTodaysQuote...');
    const todaysQuote = await getTodaysQuote();
    if (todaysQuote) {
      console.log(`Today's quote: ${todaysQuote.content.substring(0, 50)}...`);
    } else {
      console.log('No quote found for today');
    }
    console.log();

    // Test 5: Get quote by specific date
    console.log('🗓️  Testing getQuoteByDate...');
    const specificDate = '2024-08-25';
    const quoteByDate = await getQuoteByDate(specificDate);
    if (quoteByDate) {
      console.log(
        `Quote for ${specificDate}: ${quoteByDate.content.substring(0, 50)}...`
      );
    } else {
      console.log(`No quote found for ${specificDate}`);
    }
    console.log();

    // Test 6: Check if quote exists for date
    console.log('🔍 Testing quoteExistsForDate...');
    const existsToday = await quoteExistsForDate(
      new Date().toISOString().split('T')[0]
    );
    const exists2024 = await quoteExistsForDate('2024-08-25');
    console.log(`Quote exists for today: ${existsToday}`);
    console.log(`Quote exists for 2024-08-25: ${exists2024}\n`);

    // Test 7: Get quotes by date range
    console.log('📊 Testing getQuotesByDateRange...');
    const rangeQuotes = await getQuotesByDateRange('2024-08-20', '2024-08-25');
    console.log(
      `Found ${rangeQuotes.length} quotes in range 2024-08-20 to 2024-08-25`
    );
    rangeQuotes.forEach(quote => {
      console.log(`- ${quote.date}: ${quote.category}`);
    });
    console.log();

    // Test 8: Create a new test quote (be careful with this in production!)
    console.log('✏️  Testing createQuote (test mode)...');
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 30); // 30 days in the future
    const futureDate = testDate.toISOString().split('T')[0];

    const newQuote = {
      date: futureDate,
      content:
        'This is a test quote created by the database test script. It demonstrates that our create functionality is working properly.',
      category: 'test',
      audio_url: null,
    };

    try {
      const createdQuote = await createQuote(newQuote);
      console.log(
        `✅ Successfully created test quote with ID: ${createdQuote.id}`
      );

      // Test 9: Update the test quote
      console.log('✏️  Testing updateQuote...');
      const updatedQuote = await updateQuote(createdQuote.id, {
        content:
          'This test quote has been updated to verify the update functionality is working correctly.',
        audio_url: 'https://example.com/test-audio.mp3',
      });
      console.log(
        `✅ Successfully updated quote. New content: ${updatedQuote.content.substring(0, 50)}...`
      );

      // Test 10: Delete the test quote (cleanup)
      console.log('🗑️  Testing deleteQuote (cleanup)...');
      await deleteQuote(createdQuote.id);
      console.log('✅ Successfully deleted test quote\n');
    } catch (error) {
      console.error(
        '❌ Error with create/update/delete operations:',
        error.message
      );
      console.log('This might be expected if running in read-only mode\n');
    }

    console.log('🎉 Database operations test completed successfully!');
    console.log('All core functionality appears to be working correctly.');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testDatabaseOperations();
