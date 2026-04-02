const axios = require('axios');
const { performance } = require('perf_hooks');

async function loadTest() {
  console.log('🚀 Starting Load Test\n');
  
  const concurrentUsers = 10;
  const requests = [];
  const startTime = performance.now();
  
  // Simulate multiple users
  for (let i = 0; i < concurrentUsers; i++) {
    requests.push(
      axios.get('http://localhost:5000/api/health')
        .then(() => ({ success: true, user: i }))
        .catch(() => ({ success: false, user: i }))
    );
  }
  
  const results = await Promise.all(requests);
  const endTime = performance.now();
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`📊 Load Test Results:`);
  console.log(`   Concurrent Users: ${concurrentUsers}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`   Avg Response: ${((endTime - startTime) / concurrentUsers).toFixed(2)}ms`);
  
  if (failed === 0) {
    console.log('\n✅ Load test passed! System can handle concurrent users.');
  } else {
    console.log('\n⚠️ Some requests failed. Check server performance.');
  }
}

loadTest();