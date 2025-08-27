/**
 * Debug Supabase connection issues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Debug Info:');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey?.length);
console.log('Key starts with:', supabaseAnonKey?.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugConnection() {
  console.log('\n🧪 Testing different approaches...\n');

  try {
    // Test 1: Simple select without count
    console.log('1️⃣  Testing simple select...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('quotes')
      .select('id')
      .limit(1);

    console.log('Simple select result:');
    console.log('Data:', simpleData);
    console.log('Error:', simpleError);
    console.log();

    // Test 2: Count with different syntax
    console.log('2️⃣  Testing count with different approach...');
    const {
      data: countData,
      error: countError,
      count,
    } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true });

    console.log('Count result:');
    console.log('Count:', count);
    console.log('Data:', countData);
    console.log('Error:', countError);
    console.log();

    // Test 3: Regular select to see actual data
    console.log('3️⃣  Testing regular select with data...');
    const { data: regularData, error: regularError } = await supabase
      .from('quotes')
      .select('date, content, category')
      .limit(2);

    console.log('Regular select result:');
    console.log('Data length:', regularData?.length);
    console.log('Data sample:', regularData);
    console.log('Error:', regularError);
    console.log();
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugConnection();
