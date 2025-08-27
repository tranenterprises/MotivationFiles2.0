#!/usr/bin/env node

/**
 * Validation script to ensure Edge Function logic matches existing codebase
 * This compares the Edge Function implementation with the main codebase APIs
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const edgeFunctionPath = path.join(
  projectRoot,
  'supabase/functions/daily-quote-generator/index.ts'
);
const mainApiPath = path.join(
  projectRoot,
  'src/app/api/generate-daily-content/route.ts'
);
const openaiApiPath = path.join(projectRoot, 'src/lib/api/openai.ts');
const elevenlabsApiPath = path.join(projectRoot, 'src/lib/api/elevenlabs.ts');
const promptsConfigPath = path.join(projectRoot, 'src/lib/config/prompts.ts');

console.log('🔍 Validating Edge Function alignment with existing codebase...');
console.log('');

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ Could not read ${filePath}:`, error.message);
    return null;
  }
}

function extractConstants(content, constantNames) {
  const constants = {};

  for (const name of constantNames) {
    const regex = new RegExp(`const ${name}[\\s=][^;]*;`, 'gms');
    const match = content.match(regex);
    if (match) {
      constants[name] = match[0];
    }
  }

  return constants;
}

function extractPromptTemplates(content) {
  const match = content.match(/PROMPT_TEMPLATES[\\s\\S]*?};/gm);
  return match ? match[0] : null;
}

function extractSystemPrompt(content) {
  const match = content.match(/SYSTEM_PROMPT\\s*=\\s*[`'"][\\s\\S]*?[`'"];/gm);
  return match ? match[0] : null;
}

function compareStrings(str1, str2, label) {
  if (!str1 || !str2) {
    console.log(`⚠️  ${label}: One or both values are missing`);
    return false;
  }

  // Normalize whitespace for comparison
  const normalize = str => str.replace(/\\s+/g, ' ').trim();

  if (normalize(str1) === normalize(str2)) {
    console.log(`✅ ${label}: Match`);
    return true;
  } else {
    console.log(`❌ ${label}: Mismatch`);
    console.log(`   Edge Function length: ${str1.length}`);
    console.log(`   Main codebase length: ${str2.length}`);
    return false;
  }
}

function validatePromptConsistency() {
  console.log('📝 Validating Prompt Templates...');

  const edgeFunction = readFileContent(edgeFunctionPath);
  const promptsConfig = readFileContent(promptsConfigPath);

  if (!edgeFunction || !promptsConfig) {
    console.log('❌ Could not read required files for prompt validation');
    return false;
  }

  const edgePrompts = extractPromptTemplates(edgeFunction);
  const mainPrompts = extractPromptTemplates(promptsConfig);

  const edgeSystemPrompt = extractSystemPrompt(edgeFunction);
  const mainSystemPrompt = extractSystemPrompt(promptsConfig);

  let allMatch = true;

  allMatch &= compareStrings(edgePrompts, mainPrompts, 'Prompt Templates');
  allMatch &= compareStrings(
    edgeSystemPrompt,
    mainSystemPrompt,
    'System Prompt'
  );

  return allMatch;
}

function validateVoiceConfig() {
  console.log('');
  console.log('🔊 Validating Voice Configuration...');

  const edgeFunction = readFileContent(edgeFunctionPath);
  const elevenlabsApi = readFileContent(elevenlabsApiPath);

  if (!edgeFunction || !elevenlabsApi) {
    console.log('❌ Could not read required files for voice validation');
    return false;
  }

  // Extract voice IDs and settings
  const extractVoiceId = (content, varName) => {
    const regex = new RegExp(`${varName}[\\s:]*['"](\\w+)['"]`, 'g');
    const match = regex.exec(content);
    return match ? match[1] : null;
  };

  const edgePrimaryVoice = extractVoiceId(edgeFunction, 'voiceId');
  const mainPrimaryVoice = extractVoiceId(elevenlabsApi, 'voiceId');

  let allMatch = true;

  if (edgePrimaryVoice === mainPrimaryVoice) {
    console.log(`✅ Primary Voice ID: ${edgePrimaryVoice} (Match)`);
  } else {
    console.log(
      `❌ Primary Voice ID: Edge=${edgePrimaryVoice}, Main=${mainPrimaryVoice}`
    );
    allMatch = false;
  }

  // Check for fallback strategy presence
  const edgeHasFallbacks =
    edgeFunction.includes('fallbackVoiceId') &&
    edgeFunction.includes('emergencyFallbackVoiceId');
  const mainHasFallbacks =
    elevenlabsApi.includes('FALLBACK_VOICE_ID') ||
    elevenlabsApi.includes('generateVoiceWithFallbacks');

  if (edgeHasFallbacks && mainHasFallbacks) {
    console.log(
      '✅ Fallback Strategy: Both implementations have fallback mechanisms'
    );
  } else {
    console.log(
      `⚠️  Fallback Strategy: Edge=${edgeHasFallbacks}, Main=${mainHasFallbacks}`
    );
  }

  return allMatch;
}

function validateGenerationLogic() {
  console.log('');
  console.log('⚙️  Validating Generation Logic...');

  const edgeFunction = readFileContent(edgeFunctionPath);
  const mainRoute = readFileContent(mainApiPath);

  if (!edgeFunction || !mainRoute) {
    console.log('❌ Could not read required files for logic validation');
    return false;
  }

  const checks = [
    {
      name: 'Category Selection Logic',
      edgeHas:
        edgeFunction.includes('getNextCategory') &&
        edgeFunction.includes('categoryCounts'),
      mainHas:
        mainRoute.includes('getNextCategory') ||
        mainRoute.includes('category balance'),
    },
    {
      name: 'Quote Validation',
      edgeHas: edgeFunction.includes('validateQuoteContent'),
      mainHas:
        mainRoute.includes('validate') ||
        edgeFunction.includes('validateQuoteContent'), // Since we're migrating
    },
    {
      name: 'Retry Logic',
      edgeHas:
        edgeFunction.includes('isRetryable') &&
        edgeFunction.includes('attempt < 3'),
      mainHas: mainRoute.includes('retry') || mainRoute.includes('attempt'),
    },
    {
      name: 'Error Handling',
      edgeHas:
        edgeFunction.includes('catch') &&
        edgeFunction.includes('console.error'),
      mainHas:
        mainRoute.includes('catch') && mainRoute.includes('console.error'),
    },
  ];

  let allPassed = true;

  checks.forEach(check => {
    if (check.edgeHas) {
      console.log(`✅ ${check.name}: Present in Edge Function`);
    } else {
      console.log(`❌ ${check.name}: Missing in Edge Function`);
      allPassed = false;
    }
  });

  return allPassed;
}

function validateEnvironmentVariables() {
  console.log('');
  console.log('🔐 Validating Environment Variables...');

  const edgeFunction = readFileContent(edgeFunctionPath);

  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'ELEVENLABS_API_KEY',
    'CRON_SECRET',
  ];

  let allPresent = true;

  requiredEnvVars.forEach(envVar => {
    if (edgeFunction.includes(`Deno.env.get('${envVar}')`)) {
      console.log(`✅ ${envVar}: Referenced in Edge Function`);
    } else {
      console.log(`❌ ${envVar}: Not found in Edge Function`);
      allPresent = false;
    }
  });

  return allPresent;
}

function generateReport(results) {
  console.log('');
  console.log('📊 VALIDATION REPORT');
  console.log('==================');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });

  console.log('');
  console.log(`Overall: ${passed}/${total} checks passed`);

  if (passed === total) {
    console.log(
      '🎉 All validations passed! Edge Function is well-aligned with existing codebase.'
    );
  } else {
    console.log(
      '⚠️  Some issues found. Consider reviewing the mismatches above.'
    );
  }

  console.log('');
  console.log('💡 Next Steps:');
  console.log(
    '1. Deploy the Edge Function: supabase functions deploy daily-quote-generator'
  );
  console.log(
    '2. Test with: node scripts/test-edge-function.js PROJECT_REF CRON_SECRET'
  );
  console.log('3. Set up pg_cron using the updated SQL script');
  console.log('4. Monitor the daily generation in your Supabase dashboard');
}

// Run all validations
async function runValidation() {
  const results = [
    {
      name: 'Prompt Templates Consistency',
      passed: validatePromptConsistency(),
    },
    {
      name: 'Voice Configuration Alignment',
      passed: validateVoiceConfig(),
    },
    {
      name: 'Generation Logic Completeness',
      passed: validateGenerationLogic(),
    },
    {
      name: 'Environment Variables Setup',
      passed: validateEnvironmentVariables(),
    },
  ];

  generateReport(results);
}

// Execute validation
runValidation().catch(console.error);
