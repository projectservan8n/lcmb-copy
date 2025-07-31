// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook URLs
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/data/load',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/order/submit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quote/submit'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Webhook Helper function
async function callWebhook(webhookUrl, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: webhookUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LCMB-Material-Management/1.0'
      },
      timeout: 30000 // 30 seconds timeout
    };

    if (data) {
      config.data = data;
    }

    console.log(`🔗 Calling webhook: ${method} ${webhookUrl}`);
    const response = await axios(config);
    console.log(`✅ Webhook response: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Webhook Error [${webhookUrl}]:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`Webhook call failed: ${error.response?.data?.message || error.message}`);
  }
}

// THIS IS THE BIG CHANGE: Server now calls webhook immediately when page loads
app.get('/', async (req, res) => {
  try {
    console.log('📄 Loading home page with initial data...');
    
    // IMMEDIATELY call the data load webhook when page is requested
    console.log('🔄 Fetching initial form data from webhook...');
    const formData = await callWebhook(WEBHOOKS.DATA_LOAD);
    console.log('📊 Initial form data loaded successfully:', {
      suppliers: formData?.data?.suppliers?.length || 0,
      categories: formData?.data?.categories?.length || 0,
      materials: Object.keys(formData?.data?.materials || {}).length
    });
    
    // Read the HTML file and inject the data
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Inject the form data into the HTML
    const dataScript = `
    <script>
      window.INITIAL_FORM_DATA = ${JSON.stringify(formData)};
      console.log('📊 Initial form data injected:', window.INITIAL_FORM_DATA);
    </script>`;
    
    // Insert before the closing </body> tag
    html = html.replace('</body>', `${dataScript}</body>`);
    
    res.send(html);
  } catch (error) {
    console.error('❌ Error loading home page with data:', error.message);
    
    // Fallback: serve HTML without data
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    const errorScript = `
    <script>
      window.INITIAL_FORM_DATA = null;
      window.INITIAL_LOAD_ERROR = '${error.message}';
      console.error('❌ Failed to load initial data:', window.INITIAL_LOAD_ERROR);
    </script>`;
    
    html = html.replace('</body>', `${errorScript}</body>`);
    res.send(html);
  }
});

// API Routes - Direct webhook proxies
app.get('/api/data/load', async (req, res) => {
  try {
    console.log('🔄 API: Loading data via webhook...');
    const data = await callWebhook(WEBHOOKS.DATA_LOAD);
    res.json(data);
  } catch (error) {
    console.error('❌ API Error (data/load):', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/order/submit', async (req, res) => {
  try {
    console.log('🔄 API: Submitting order via webhook...');
    console.log('📦 Order data:', JSON.stringify(req.body, null, 2));
    const result = await callWebhook(WEBHOOKS.ORDER_SUBMIT, 'POST', req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ API Error (order/submit):', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/quote/submit', async (req, res) => {
  try {
    console.log('🔄 API: Submitting quote via webhook...');
    console.log('💬 Quote data:', JSON.stringify(req.body, null, 2));
    const result = await callWebhook(WEBHOOKS.QUOTE_SUBMIT, 'POST', req.body);
    res.json(result);
  } catch (error) {
    console.error('❌ API Error (quote/submit):', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    webhooks: {
      dataLoad: WEBHOOKS.DATA_LOAD,
      orderSubmit: WEBHOOKS.ORDER_SUBMIT,
      quoteSubmit: WEBHOOKS.QUOTE_SUBMIT
    }
  });
});

// Debug endpoint to test webhook connectivity
app.get('/debug/webhooks', async (req, res) => {
  const results = {};
  
  try {
    console.log('🔍 Testing webhook connectivity...');
    
    // Test data load webhook
    try {
      const dataLoadResult = await callWebhook(WEBHOOKS.DATA_LOAD);
      results.dataLoad = { status: 'success', data: dataLoadResult };
    } catch (error) {
      results.dataLoad = { status: 'error', error: error.message };
    }

    res.json({
      timestamp: new Date().toISOString(),
      webhookUrls: WEBHOOKS,
      testResults: results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug test failed',
      message: error.message
    });
  }
});

// Force data load endpoint (for testing)
app.get('/force-load', async (req, res) => {
  try {
    console.log('🔄 Force loading data from webhook...');
    const data = await callWebhook(WEBHOOKS.DATA_LOAD);
    res.json({
      success: true,
      message: 'Data loaded successfully',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message 
  });
});

app.listen(PORT, () => {
  console.log('🚀 LCMB Material Management Server Started');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔗 Webhook Endpoints:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
  console.log('✅ Ready to receive requests!');
  console.log('💡 Visit / to load page with initial data');
  console.log('🔧 Visit /debug/webhooks to test webhook connectivity');
});
