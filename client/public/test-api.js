console.log('🔧 T4G API Configuration Test');
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'EMPTY (using proxy)');
console.log('Environment:', import.meta.env.MODE);
console.log('✅ API will use Vite proxy for relative URLs');

// Test API call
fetch('/auth/user/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@test.com',
    password: 'wrongpassword'
  })
})
.then(response => {
  console.log('📡 API Response Status:', response.status);
  if (response.status === 400 || response.status === 401) {
    console.log('✅ API is working! (400/401 expected for invalid login)');
  } else {
    console.log('❌ Unexpected response:', response.status);
  }
  return response.json();
})
.then(data => {
  console.log('📝 API Response:', data);
})
.catch(error => {
  console.error('❌ Network Error:', error);
  console.log('This would be the "network error" you saw before!');
});
