import React from 'react';
import ReactDOM from 'react-dom/client';
import MinimalApp from './MinimalApp';
import './index.css';

console.log('🚀 Starting MINIMAL React app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1 style="color: red;">ERROR: Root element not found!</h1>';
} else {
  console.log('✅ Root element found, mounting React...');
  
  const root = ReactDOM.createRoot(rootElement);
  root.render(<MinimalApp />);
  
  console.log('✅ React app mounted successfully!');
}