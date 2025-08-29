#!/usr/bin/env node

/**
 * Deployment Test Script
 *
 * Tests the deployed daily-quote-generator edge function
 * Usage: node scripts/test-deployment.js <project-ref> <cron-secret>
 */

const https = require('https');

const projectRef = process.argv[2];
const cronSecret = process.argv[3];

if (!projectRef || !cronSecret) {
  console.error(
    'Usage: node scripts/test-deployment.js <project-ref> <cron-secret>'
  );
  console.error(
    'Example: node scripts/test-deployment.js abcdefghijklmnop your-secret-key'
  );
  process.exit(1);
}

const baseUrl = `https://${projectRef}.supabase.co/functions/v1/daily-quote-generator`;

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null,
          };
          resolve(response);
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Test health check endpoint
 */
async function testHealthCheck() {
  console.log('\n🔍 Testing health check endpoint...');

  try {
    const response = await makeRequest(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);

    if (response.status === 200 && response.data) {
      console.log(`✅ Health status: ${response.data.status}`);
      console.log(
        `✅ Environment: ${response.data.checks?.environment ? 'PASS' : 'FAIL'}`
      );
      console.log(
        `✅ Database: ${response.data.checks?.database ? 'PASS' : 'FAIL'}`
      );
      console.log(
        `✅ OpenAI: ${response.data.checks?.openai ? 'PASS' : 'FAIL'}`
      );
      console.log(
        `✅ ElevenLabs: ${response.data.checks?.elevenlabs ? 'PASS' : 'FAIL'}`
      );

      if (response.data.errors && response.data.errors.length > 0) {
        console.log(`⚠️  Errors: ${response.data.errors.join(', ')}`);
      }

      return response.data.status === 'healthy';
    } else {
      console.log(`❌ Health check failed: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Health check error: ${error.message}`);
    return false;
  }
}

/**
 * Test quote generation
 */
async function testQuoteGeneration() {
  console.log('\n📝 Testing quote generation...');

  try {
    const response = await makeRequest(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skipVoiceGeneration: true,
        forceRegenerate: true,
      }),
    });

    console.log(`Status: ${response.status}`);

    if (response.status === 200 && response.data) {
      console.log(`✅ Success: ${response.data.success}`);
      console.log(
        `✅ Quote: ${response.data.quote?.content?.substring(0, 100)}...`
      );
      console.log(`✅ Category: ${response.data.quote?.category}`);
      console.log(`✅ Duration: ${response.data.duration}ms`);

      return response.data.success;
    } else {
      console.log(`❌ Generation failed: ${response.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Generation error: ${error.message}`);
    return false;
  }
}

/**
 * Test unauthorized access
 */
async function testUnauthorized() {
  console.log('\n🔒 Testing unauthorized access...');

  try {
    const response = await makeRequest(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (response.status === 401) {
      console.log(`✅ Properly blocked unauthorized access`);
      return true;
    } else {
      console.log(`❌ Should have blocked access: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Auth test error: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Deployment Tests');
  console.log(`📍 Testing: ${baseUrl}`);
  console.log(`🔑 Secret: ${cronSecret.substring(0, 8)}...`);

  const results = {};

  results.health = await testHealthCheck();
  results.auth = await testUnauthorized();

  if (results.health) {
    results.generation = await testQuoteGeneration();
  } else {
    results.generation = false;
  }

  // Summary
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  console.log(`Health Check:     ${results.health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authorization:    ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(
    `Quote Generation: ${results.generation ? '✅ PASS' : '❌ FAIL'}`
  );

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Deployment is successful.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
    return false;
  }
}

// Run tests
runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
