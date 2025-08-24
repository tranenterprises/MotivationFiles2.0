#!/usr/bin/env node

/**
 * Database setup utility
 * This script helps verify the database connection and schema
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('quotes').select('count', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful')
    console.log(`📊 Current quotes count: ${data || 0}`)
    
    return true
  } catch (err) {
    console.error('❌ Connection error:', err.message)
    return false
  }
}

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...')
    
    // Check if quotes table exists and has expected structure
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.error('❌ Quotes table does not exist. Please run the migration:')
      console.error('   1. Go to Supabase Dashboard > SQL Editor')
      console.error('   2. Run the contents of supabase/migrations/001_initial_schema.sql')
      return false
    } else if (error) {
      console.error('❌ Schema check failed:', error.message)
      return false
    }
    
    console.log('✅ Quotes table exists and is accessible')
    return true
  } catch (err) {
    console.error('❌ Schema check error:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 Starting database verification...\n')
  
  const connectionOk = await verifyConnection()
  if (!connectionOk) return
  
  const schemaOk = await checkSchema()
  if (!schemaOk) return
  
  console.log('\n✅ Database setup verification complete!')
  console.log('🎉 Your database is ready for the motivation app!')
}

main().catch(console.error)