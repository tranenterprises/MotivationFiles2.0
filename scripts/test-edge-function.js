#!/usr/bin/env node

/**
 * Test script for the Supabase Edge Function
 * This script tests the daily quote generation Edge Function
 *
 * Usage:
 * node scripts/test-edge-function.js [project-ref] [cron-secret]
 *
 * Environment variables (alternative to command line args):
 * SUPABASE_PROJECT_REF - Your Supabase project reference
 * CRON_SECRET - Your cron secret for authentication
 */

const https = require('https');
const url = require('url');

// Configuration
const args = process.argv.slice(2);
const projectRef = args[0] || process.env.SUPABASE_PROJECT_REF;
const cronSecret = args[1] || process.env.CRON_SECRET;

if (!projectRef || !cronSecret) {
  console.error('❌ Missing required parameters');
  console.error(
    'Usage: node scripts/test-edge-function.js [project-ref] [cron-secret]'
  );
  console.error(
    'Or set environment variables: SUPABASE_PROJECT_REF and CRON_SECRET'
  );
  process.exit(1);
}

const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/daily-quote-generator`;

console.log('🧪 Testing Supabase Edge Function');
console.log('📍 URL:', edgeFunctionUrl);
console.log('🔐 Using provided authentication');
console.log('');

function makeRequest(method = 'POST') {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(edgeFunctionUrl);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.path,
      method: method,
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Edge-Function-Test/1.0',
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            json: null,
          };

          try {
            response.json = JSON.parse(data);
          } catch (e) {
            // Response is not JSON
          }

          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEdgeFunction() {
  console.log('🚀 Sending request to Edge Function...');

  try {
    const startTime = Date.now();
    const response = await makeRequest('POST');
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('');
    console.log('📊 Response Details:');
    console.log('⏱️  Duration:', `${duration}ms`);
    console.log('🔢 Status Code:', response.statusCode);
    console.log(
      '📦 Content-Type:',
      response.headers['content-type'] || 'not specified'
    );
    console.log('');

    if (response.statusCode === 200) {
      console.log('✅ Request successful!');

      if (response.json) {
        console.log('📄 Response JSON:');
        console.log(JSON.stringify(response.json, null, 2));

        // Analyze the response
        if (response.json.success) {
          console.log('');
          console.log('🎉 Edge Function executed successfully!');

          if (response.json.skipReason === 'already_exists') {
            console.log(
              'ℹ️  Quote already exists for today - this is expected behavior'
            );
          } else if (response.json.voiceGenerated) {
            console.log('🔊 Voice generation: SUCCESS');
            console.log('🎵 Audio URL:', response.json.audioUrl);
          } else if (response.json.voiceGenerated === false) {
            console.log('⚠️  Voice generation: FAILED');
            console.log('❌ Voice error:', response.json.voiceError);
            console.log('✅ Quote still created successfully');
          }

          if (response.json.category) {
            console.log('🏷️  Category:', response.json.category);
          }

          if (response.json.quote) {
            console.log(
              '💬 Quote content preview:',
              response.json.quote.content.substring(0, 100) +
                (response.json.quote.content.length > 100 ? '...' : '')
            );
          }
        } else {
          console.log('');
          console.log('❌ Edge Function reported failure');
          console.log('💥 Error:', response.json.error);
          if (response.json.details) {
            console.log('📝 Details:', response.json.details);
          }
        }
      } else {
        console.log('📄 Raw response body:');
        console.log(response.body);
      }
    } else if (response.statusCode === 401) {
      console.log('🔐 Authentication failed!');
      console.log('❌ Check your CRON_SECRET value');
      console.log(
        '📝 Make sure it matches the environment variable in Supabase'
      );
    } else if (response.statusCode === 404) {
      console.log('🔍 Edge Function not found!');
      console.log('❌ Check that the function is deployed');
      console.log('📝 Verify the project reference is correct');
    } else if (response.statusCode >= 500) {
      console.log('💥 Server error!');
      console.log('📄 Response body:', response.body);
    } else {
      console.log('⚠️  Unexpected response');
      console.log('📄 Response body:', response.body);
    }
  } catch (error) {
    console.log('');
    console.log('💥 Request failed!');
    console.log('❌ Error:', error.message);

    if (error.message.includes('ENOTFOUND')) {
      console.log('🌐 DNS resolution failed - check your project reference');
    } else if (error.message.includes('timeout')) {
      console.log(
        '⏱️  Request timed out - the function may be slow or unresponsive'
      );
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(
        '🔌 Connection refused - check if the Edge Function is deployed'
      );
    }
  }
}

// Test with different scenarios
async function runTests() {
  await testEdgeFunction();

  console.log('');
  console.log('🔧 Troubleshooting Tips:');
  console.log('1. Verify Edge Function is deployed: supabase functions list');
  console.log('2. Check environment variables in Supabase dashboard');
  console.log('3. Ensure quotes table exists in your database');
  console.log('4. Verify storage bucket "quote-audio" exists');
  console.log('5. Check Edge Function logs in Supabase dashboard');
  console.log('');
  console.log('📚 For more help, see: supabase/MIGRATION_GUIDE.md');
}

// Run the tests
runTests().catch(console.error);
