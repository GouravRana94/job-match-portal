const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runAllTests() {
  console.log('🎯 Running Complete Test Suite\n');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Database Test', file: 'test-database.js' },
    { name: 'Security Test', file: 'security-test.js' },
    { name: 'Load Test', file: 'load-test.js' },
    { name: 'API Endpoints Test', file: 'test-all-endpoints.js' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n📝 Running ${test.name}...`);
    try {
      const { stdout, stderr } = await execPromise(`node ${test.file}`);
      console.log(stdout);
      if (stderr) console.error(stderr);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${(passed / (passed + failed) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Ready for deployment!');
  } else {
    console.log('\n⚠️ Some tests failed. Fix issues before deployment.');
  }
}

runAllTests();