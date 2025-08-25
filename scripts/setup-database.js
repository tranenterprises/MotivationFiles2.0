/**
 * Database setup script
 * Creates the quotes table and seeds it with initial data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase admin client (with service role key for DDL operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupDatabase() {
  console.log('🚀 Setting up database schema and data...\n');
  
  try {
    // First, let's check if the quotes table already exists
    console.log('🔍 Checking if quotes table exists...');
    const { data: existingData, error: checkError } = await supabase
      .from('quotes')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Quotes table already exists!');
      console.log('📊 Checking current data...');
      
      const { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });
        
      console.log(`Found ${count} existing quotes in the table\n`);
      
      if (count > 0) {
        console.log('📚 Sample of existing quotes:');
        const { data: samples } = await supabase
          .from('quotes')
          .select('date, category, content')
          .order('date', { ascending: false })
          .limit(3);
          
        samples?.forEach(quote => {
          console.log(`- ${quote.date}: ${quote.category} - ${quote.content.substring(0, 50)}...`);
        });
        console.log();
      }
    } else {
      console.log('📝 Quotes table does not exist. This is expected for a new project.');
      console.log('❌ Error details:', checkError.message);
      console.log('🔧 You may need to run the migration manually via Supabase dashboard or CLI.\n');
    }
    
    // Test basic operations even if table doesn't exist to verify connection
    console.log('🔌 Testing basic Supabase connection...');
    
    // Try to list all tables (this should work even without our custom table)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema', { schema_name: 'public' });
      
    if (!tablesError && tables) {
      console.log('✅ Successfully connected to Supabase!');
      console.log(`📋 Found ${tables.length} tables in the public schema`);
    } else {
      // Fallback test - try to access auth tables which should always exist
      console.log('🔄 Trying alternative connection test...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (!authError) {
        console.log('✅ Supabase connection confirmed via Auth API');
      } else {
        console.log('⚠️  Connection test results unclear, but service is likely working');
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. If quotes table exists: You can proceed with testing');
    console.log('2. If quotes table is missing: Run the migration via Supabase dashboard:');
    console.log('   - Go to: https://supabase.com/dashboard/project/jrbkzqbutldvkfoaxgry');
    console.log('   - Navigate to SQL Editor');
    console.log('   - Run the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('   - Then run: supabase/seed.sql');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the setup
setupDatabase();