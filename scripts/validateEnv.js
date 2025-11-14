#!/usr/bin/env node

/**
 * Standalone Environment Variable Validation Script
 *
 * Can be run independently to validate .env file before starting the app
 */

require('dotenv').config();
const { runValidation } = require('../src/config/validateEnv');

console.log('================================');
console.log('Environment Validation');
console.log('================================');
console.log('');

const results = runValidation();

if (!results.valid) {
  console.log('');
  console.log('❌ Validation FAILED');
  console.log('');
  console.log('Please fix the errors above before starting the application.');
  process.exit(1);
}

console.log('');
console.log('✅ All validations PASSED');
console.log('');
console.log('Environment is properly configured!');
process.exit(0);
