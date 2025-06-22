import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: `${__ENV.DURATION || '5m'}`, target: 50 }, // Stay at load
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'https://staging.t4g-game.com';

// Test data
const TEST_USERS = [
  { email: 'test1@example.com', password: 'TestPassword123!' },
  { email: 'test2@example.com', password: 'TestPassword123!' },
  { email: 'test3@example.com', password: 'TestPassword123!' },
];

export function setup() {
  // Setup test data if needed
  console.log(`Starting load test against: ${BASE_URL}`);
  return { baseUrl: BASE_URL };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  
  // Test 1: Health Check
  let response = http.get(`${baseUrl}/api/health`);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: User Registration
  const userData = {
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };

  response = http.post(`${baseUrl}/api/auth/user/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'registration status is 201': (r) => r.status === 201,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: User Login
  const loginData = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  response = http.post(`${baseUrl}/api/auth/user/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const authToken = response.json('accessToken');
  
  check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'auth token received': (r) => authToken !== undefined,
  }) || errorRate.add(1);

  if (authToken) {
    // Test 4: Authenticated API calls
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // Get user profile
    response = http.get(`${baseUrl}/api/users/profile`, { headers });
    check(response, {
      'profile fetch status is 200': (r) => r.status === 200,
      'profile fetch response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);

    sleep(0.5);

    // Get challenges
    response = http.get(`${baseUrl}/api/challenges`, { headers });
    check(response, {
      'challenges fetch status is 200': (r) => r.status === 200,
      'challenges fetch response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(0.5);

    // Get tokens/rewards
    response = http.get(`${baseUrl}/api/tokens`, { headers });
    check(response, {
      'tokens fetch status is 200': (r) => r.status === 200,
      'tokens fetch response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
  }

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed');
}
