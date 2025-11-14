/**
 * Load Testing Script
 * Uses autocannon for HTTP load testing
 */

const autocannon = require('autocannon');
const chalk = require('chalk');

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test configurations
const tests = {
  health: {
    title: 'Health Check Endpoint',
    url: `${API_URL}/health`,
    connections: 100,
    duration: 10
  },
  authLogin: {
    title: 'Authentication - Login',
    url: `${API_URL}/api/v1/auth/login`,
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123'
    }),
    connections: 50,
    duration: 10
  },
  apiList: {
    title: 'API - List Products',
    url: `${API_URL}/api/v1/products`,
    headers: {
      'authorization': 'Bearer YOUR_TEST_TOKEN_HERE'
    },
    connections: 100,
    duration: 15
  },
  stress: {
    title: 'Stress Test - Multiple Endpoints',
    url: `${API_URL}/api/v1/users/me`,
    headers: {
      'authorization': 'Bearer YOUR_TEST_TOKEN_HERE'
    },
    connections: 200,
    duration: 30
  }
};

async function runTest(testName) {
  const config = tests[testName];

  if (!config) {
    console.error(chalk.red(`Test "${testName}" not found`));
    console.log('Available tests:', Object.keys(tests).join(', '));
    return;
  }

  console.log('');
  console.log(chalk.bold.cyan(`Running test: ${config.title}`));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');

  const instance = autocannon({
    url: config.url,
    connections: config.connections || 100,
    pipelining: config.pipelining || 1,
    duration: config.duration || 10,
    method: config.method || 'GET',
    headers: config.headers || {},
    body: config.body || null,
    requests: config.requests || null
  }, (err, result) => {
    if (err) {
      console.error(chalk.red('Test failed:'), err);
      return;
    }

    printResults(result);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

function printResults(result) {
  console.log('');
  console.log(chalk.bold.green('Test Results:'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');

  // Summary
  console.log(chalk.bold('Summary:'));
  console.log(`  Duration:        ${result.duration}s`);
  console.log(`  Connections:     ${result.connections}`);
  console.log(`  Requests:        ${result.requests.total}`);
  console.log(`  Throughput:      ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`);
  console.log('');

  // Latency
  console.log(chalk.bold('Latency:'));
  console.log(`  Average:         ${result.latency.mean.toFixed(2)} ms`);
  console.log(`  Median:          ${result.latency.p50.toFixed(2)} ms`);
  console.log(`  95th Percentile: ${result.latency.p95.toFixed(2)} ms`);
  console.log(`  99th Percentile: ${result.latency.p99.toFixed(2)} ms`);
  console.log(`  Max:             ${result.latency.max.toFixed(2)} ms`);
  console.log('');

  // Requests per second
  console.log(chalk.bold('Requests per Second:'));
  console.log(`  Average:         ${result.requests.average.toFixed(2)} req/s`);
  console.log(`  Mean:            ${result.requests.mean.toFixed(2)} req/s`);
  console.log(`  Max:             ${result.requests.max} req/s`);
  console.log('');

  // Errors
  if (result.errors > 0 || result.timeouts > 0 || result['2xx'] < result.requests.total) {
    console.log(chalk.bold.red('Errors:'));
    console.log(`  Errors:          ${result.errors}`);
    console.log(`  Timeouts:        ${result.timeouts}`);
    console.log(`  Non-2xx:         ${result.non2xx}`);
    console.log('');
  }

  // Status codes
  console.log(chalk.bold('Status Codes:'));
  console.log(`  2xx:             ${result['2xx']} (${((result['2xx'] / result.requests.total) * 100).toFixed(2)}%)`);
  console.log(`  3xx:             ${result['3xx']}`);
  console.log(`  4xx:             ${result['4xx']}`);
  console.log(`  5xx:             ${result['5xx']}`);
  console.log('');

  // Performance assessment
  const avgLatency = result.latency.mean;
  const p95Latency = result.latency.p95;
  const rps = result.requests.average;

  console.log(chalk.bold('Performance Assessment:'));

  if (avgLatency < 100 && p95Latency < 200 && result['2xx'] === result.requests.total) {
    console.log(chalk.green('  ✓ Excellent - All metrics within acceptable range'));
  } else if (avgLatency < 200 && p95Latency < 500) {
    console.log(chalk.yellow('  ⚠ Good - Some optimization recommended'));
  } else {
    console.log(chalk.red('  ✗ Poor - Performance optimization required'));
  }

  if (avgLatency >= 200) {
    console.log(chalk.yellow(`  ⚠ Average latency is high (${avgLatency.toFixed(2)}ms)`));
  }

  if (p95Latency >= 500) {
    console.log(chalk.yellow(`  ⚠ 95th percentile latency is high (${p95Latency.toFixed(2)}ms)`));
  }

  if (result.errors > 0 || result.timeouts > 0) {
    console.log(chalk.red(`  ✗ ${result.errors + result.timeouts} errors/timeouts detected`));
  }

  if (result['5xx'] > 0) {
    console.log(chalk.red(`  ✗ ${result['5xx']} server errors (5xx) detected`));
  }

  console.log('');
}

async function runAllTests() {
  console.log(chalk.bold.cyan('Running all load tests...'));
  console.log('');

  for (const testName of Object.keys(tests)) {
    await runTest(testName);
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(chalk.bold.green('All tests completed!'));
}

// CLI interface
if (require.main === module) {
  const testName = process.argv[2] || 'all';

  if (testName === 'all') {
    runAllTests().catch(console.error);
  } else if (testName === 'list') {
    console.log('Available tests:');
    Object.entries(tests).forEach(([name, config]) => {
      console.log(`  ${name.padEnd(15)} - ${config.title}`);
    });
  } else {
    runTest(testName).catch(console.error);
  }
}

module.exports = { runTest, runAllTests };
