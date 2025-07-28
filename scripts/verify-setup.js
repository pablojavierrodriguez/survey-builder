#!/usr/bin/env node

/**
 * Verification Script for Vercel + Supabase Integration
 * 
 * This script checks that:
 * 1. Environment variables are properly configured
 * 2. Database connection is working
 * 3. Tables exist and are accessible
 * 4. Sample data is present
 */

const https = require('https');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function checkEnvironmentVariables() {
  log('\n🔍 Checking Environment Variables...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    log(`❌ Missing environment variables: ${missing.join(', ')}`, 'red');
    log('💡 Make sure to set up the Vercel + Supabase integration', 'yellow');
    return false;
  }
  
  log('✅ Environment variables are configured', 'green');
  return true;
}

async function checkDatabaseConnection() {
  log('\n🔍 Checking Database Connection...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    log('❌ Missing Supabase credentials', 'red');
    return false;
  }
  
  try {
    const response = await makeRequest(
      `${supabaseUrl}/rest/v1/pc_survey_data_dev?limit=1`,
      {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    );
    
    if (response.status === 200) {
      log('✅ Database connection successful', 'green');
      return true;
    } else {
      log(`❌ Database connection failed: ${response.status}`, 'red');
      log(`Response: ${response.data}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Database connection error: ${error.message}`, 'red');
    return false;
  }
}

async function checkTables() {
  log('\n🔍 Checking Database Tables...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const tables = ['app_settings', 'pc_survey_data', 'pc_survey_data_dev', 'profiles'];
  const results = {};
  
  for (const table of tables) {
    try {
      const response = await makeRequest(
        `${supabaseUrl}/rest/v1/${table}?limit=1`,
        {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      );
      
      results[table] = response.status === 200;
      
      if (response.status === 200) {
        log(`✅ Table '${table}' exists and is accessible`, 'green');
      } else {
        log(`❌ Table '${table}' not accessible: ${response.status}`, 'red');
      }
    } catch (error) {
      results[table] = false;
      log(`❌ Error checking table '${table}': ${error.message}`, 'red');
    }
  }
  
  return Object.values(results).every(Boolean);
}

async function checkSampleData() {
  log('\n🔍 Checking Sample Data...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    const response = await makeRequest(
      `${supabaseUrl}/rest/v1/pc_survey_data_dev?select=count`,
      {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    );
    
    if (response.status === 200) {
      const count = parseInt(response.headers['content-range']?.split('/')[1] || '0');
      if (count > 0) {
        log(`✅ Sample data found: ${count} records in dev table`, 'green');
        return true;
      } else {
        log('⚠️  No sample data found in dev table', 'yellow');
        log('💡 Run the database schema to create sample data', 'yellow');
        return false;
      }
    } else {
      log(`❌ Could not check sample data: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error checking sample data: ${error.message}`, 'red');
    return false;
  }
}

async function checkAppSettings() {
  log('\n🔍 Checking App Settings...', 'blue');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  try {
    const response = await makeRequest(
      `${supabaseUrl}/rest/v1/app_settings?select=*`,
      {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    );
    
    if (response.status === 200) {
      const data = JSON.parse(response.data);
      if (data && data.length > 0) {
        const environments = data.map(setting => setting.environment).join(', ');
        log(`✅ App settings found for environments: ${environments}`, 'green');
        return true;
      } else {
        log('⚠️  No app settings found', 'yellow');
        log('💡 Run the database schema to create app settings', 'yellow');
        return false;
      }
    } else {
      log(`❌ Could not check app settings: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error checking app settings: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Vercel + Supabase Integration Verification', 'blue');
  log('==============================================', 'blue');
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Database Tables', fn: checkTables },
    { name: 'App Settings', fn: checkAppSettings },
    { name: 'Sample Data', fn: checkSampleData }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, success: result });
    } catch (error) {
      log(`❌ Error in ${check.name}: ${error.message}`, 'red');
      results.push({ name: check.name, success: false });
    }
  }
  
  // Summary
  log('\n📊 Verification Summary', 'blue');
  log('=====================', 'blue');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });
  
  log(`\n${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');
  
  if (passed === total) {
    log('\n🎉 All checks passed! Your Vercel + Supabase integration is working correctly.', 'green');
  } else {
    log('\n⚠️  Some checks failed. Please review the issues above.', 'yellow');
    log('📖 See VERCEL_SUPABASE_SETUP.md for setup instructions.', 'blue');
  }
}

// Run the verification
if (require.main === module) {
  main().catch(error => {
    log(`❌ Verification failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, checkEnvironmentVariables, checkDatabaseConnection, checkTables, checkAppSettings, checkSampleData };