/**
 * Inspect the actual database schema
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSchema() {
  console.log('🔍 Inspecting database schema...\n');

  try {
    // Get all data to see what columns exist
    console.log('📊 Getting sample data to inspect columns...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('quotes')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error getting sample:', sampleError);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      console.log('✅ Sample record structure:');
      const sample = sampleData[0];
      console.log(JSON.stringify(sample, null, 2));
      console.log();

      console.log('📋 Available columns:');
      Object.keys(sample).forEach(key => {
        console.log(`- ${key}: ${typeof sample[key]} = ${sample[key]}`);
      });
    } else {
      console.log('📭 No data found in quotes table');
    }
  } catch (error) {
    console.error('❌ Schema inspection failed:', error);
  }
}

inspectSchema();
