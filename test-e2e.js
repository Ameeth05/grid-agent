/**
 * E2E Test Script for GridAgent
 * Run with: npx playwright test test-e2e.js --headed
 * Or simply: node test-e2e.js (uses fetch + EventSource polyfill)
 */

const http = require('http');

// Simple test without browser
async function testServer() {
  console.log('=== GridAgent E2E Test ===\n');

  // Test 1: Health check
  console.log('1. Testing health endpoint...');
  try {
    const health = await fetch('http://localhost:8081/health');
    const data = await health.json();
    console.log('   ✓ Health:', JSON.stringify(data));
  } catch (e) {
    console.log('   ✗ Health failed:', e.message);
    console.log('   Make sure server is running: python gridagent_server_sse.py');
    process.exit(1);
  }

  // Test 2: Root endpoint
  console.log('\n2. Testing root endpoint...');
  try {
    const root = await fetch('http://localhost:8081/');
    const data = await root.json();
    console.log('   ✓ Root:', data.name);
  } catch (e) {
    console.log('   ✗ Root failed:', e.message);
  }

  // Test 3: SSE connection
  console.log('\n3. Testing SSE connection...');
  try {
    const sseResponse = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:8081/events?session_id=test-123', (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk.toString();
          // Got first message, that's enough
          if (data.includes('data:')) {
            req.destroy();
            resolve(data);
          }
        });
        setTimeout(() => {
          req.destroy();
          resolve(data || 'timeout');
        }, 3000);
      });
      req.on('error', reject);
    });

    if (sseResponse.includes('connected')) {
      console.log('   ✓ SSE connected! First message received');
    } else {
      console.log('   ? SSE response:', sseResponse.substring(0, 100));
    }
  } catch (e) {
    console.log('   ✗ SSE failed:', e.message);
  }

  // Test 4: Query submission
  console.log('\n4. Testing query submission...');
  try {
    const query = await fetch('http://localhost:8081/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Hello, what files are available?',
        session_id: 'test-123'
      })
    });
    const data = await query.json();
    console.log('   ✓ Query submitted:', data.status);
  } catch (e) {
    console.log('   ✗ Query failed:', e.message);
  }

  // Test 5: Frontend check
  console.log('\n5. Testing frontend...');
  try {
    const frontend = await fetch('http://localhost:3000');
    if (frontend.ok) {
      console.log('   ✓ Frontend is running on port 3000');
    } else {
      console.log('   ✗ Frontend returned:', frontend.status);
    }
  } catch (e) {
    console.log('   ✗ Frontend not reachable:', e.message);
    console.log('   Make sure frontend is running: npm run dev');
  }

  console.log('\n=== Test Complete ===');
}

testServer().catch(console.error);
