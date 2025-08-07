// server.js - Enhanced with PDF Upload and Order History Support
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook URLs - Updated to match your n8n setup
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/dataload',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/ordersubmit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quotesubmit',
  ORDER_HISTORY: 'https://primary-s0q-production.up.railway.app/webhook/orderhistory'
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for PDF uploads
app.use(express.static('.'));

// Enhanced Webhook Helper function with detailed logging
async function callWebhook(webhookUrl, method = 'GET', data = null) {
  try {
    console.log(`🔗 [${new Date().toISOString()}] Calling webhook: ${method} ${webhookUrl}`);
    
    const config = {
      method,
      url: webhookUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LCMB-Material-Management/1.0',
        'Accept': 'application/json'
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    };

    if (data) {
      config.data = data;
      const dataPreview = JSON.stringify(data, null, 2);
      console.log(`📦 Request data:`, dataPreview.length > 1000 ? 
        `${dataPreview.substring(0, 1000)}... (truncated, ${dataPreview.length} chars total)` : 
        dataPreview);
    }

    const response = await axios(config);
    
    console.log(`✅ [${new Date().toISOString()}] Webhook response: ${response.status} ${response.statusText}`);
    console.log(`📊 Response headers:`, response.headers);
    console.log(`📋 Response data preview:`, JSON.stringify(response.data).substring(0, 500) + '...');
    
    // Check if response indicates success
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Validate response structure for data load
    if (webhookUrl.includes('dataload')) {
      if (!response.data) {
        throw new Error('Empty response from webhook');
      }
      
      console.log(`🔍 Data validation:`, {
        hasSuccess: 'success' in response.data,
        hasData: 'data' in response.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : 'none'
      });
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Webhook Error [${webhookUrl}]:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      stack: error.stack.split('\n').slice(0, 3).join('\n')
    });
    throw new Error(`Webhook call failed: ${error.response?.data?.message || error.message}`);
  }
}

// ENHANCED: Server now calls webhook immediately when page loads
app.get('/', async (req, res) => {
  console.log(`🌐 [${new Date().toISOString()}] Loading home page with initial data...`);
  
  try {
    // IMMEDIATELY call the data load webhook when page is requested
    console.log('🔄 Fetching initial form data from webhook...');
    const startTime = Date.now();
    
    const formData = await callWebhook(WEBHOOKS.DATA_LOAD);
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 [${loadTime}ms] Initial form data loaded successfully:`, {
      success: formData?.success,
      suppliers: formData?.data?.suppliers?.length || 0,
      categories: formData?.data?.categories?.length || 0,
      materials: Object.keys(formData?.data?.materials || {}).length,
      summary: formData?.data?.summary
    });
    
    // Read the HTML file and inject the data
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    // Inject the form data into the HTML
    const dataScript = `
    <script>
      window.INITIAL_FORM_DATA = ${JSON.stringify(formData)};
      console.log('📊 Initial form data injected (${loadTime}ms load time):', window.INITIAL_FORM_DATA);
      console.log('🔍 Data summary:', {
        success: window.INITIAL_FORM_DATA?.success,
        suppliers: window.INITIAL_FORM_DATA?.data?.suppliers?.length || 0,
        categories: window.INITIAL_FORM_DATA?.data?.categories?.length || 0,
        materials: Object.keys(window.INITIAL_FORM_DATA?.data?.materials || {}).length
      });
    </script>`;
    
    // Insert before the closing </body> tag
    html = html.replace('</body>', `${dataScript}</body>`);
    
    res.send(html);
    console.log(`✅ [${new Date().toISOString()}] Home page served successfully with embedded data`);
    
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error loading home page with data:`, error.message);
    
    // Fallback: serve HTML without data
    const fs = require('fs');
    let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    
    const errorScript = `
    <script>
      window.INITIAL_FORM_DATA = null;
      window.INITIAL_LOAD_ERROR = '${error.message.replace(/'/g, "\\'")}';
      console.error('❌ Failed to load initial data:', window.INITIAL_LOAD_ERROR);
      console.log('🔄 Will attempt to load data via JavaScript fallback');
    </script>`;
    
    html = html.replace('</body>', `${errorScript}</body>`);
    res.send(html);
    console.log(`⚠️ [${new Date().toISOString()}] Home page served with error fallback`);
  }
});

// API Routes - Direct webhook proxies with enhanced logging
app.get('/api/data/load', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Loading data via webhook...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.DATA_LOAD);
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ [${loadTime}ms] API data load successful`);
    res.json(data);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (data/load):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ENHANCED: Order submission with PDF support
app.post('/api/order/submit', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting order via webhook...`);
    console.log('📦 Order data received:', {
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      requestorName: req.body.requestorName,
      hasPdf: !!req.body.pdfFileData,
      pdfSendMode: req.body.pdfSendMode || 'none'
    });
    
    // Prepare data for n8n workflow
    const orderData = {
      ...req.body,
      // Include PDF metadata if present
      hasPdf: !!req.body.pdfFileData,
      pdfFileName: req.body.pdfFile?.name || null,
      pdfFileSize: req.body.pdfFile?.size || null,
      pdfSendMode: req.body.pdfSendMode || 'with-order'
    };
    
    const result = await callWebhook(WEBHOOKS.ORDER_SUBMIT, 'POST', orderData);
    console.log(`✅ [${new Date().toISOString()}] Order submission successful`);
    res.json(result);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (order/submit):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ENHANCED: Quote submission with PDF support
app.post('/api/quote/submit', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting quote via webhook...`);
    console.log('💬 Quote data received:', {
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      requestorName: req.body.requestorName,
      hasPdf: !!req.body.pdfFileData,
      pdfSendMode: req.body.pdfSendMode || 'none'
    });
    
    // Prepare data for n8n workflow
    const quoteData = {
      ...req.body,
      // Include PDF metadata if present
      hasPdf: !!req.body.pdfFileData,
      pdfFileName: req.body.pdfFile?.name || null,
      pdfFileSize: req.body.pdfFile?.size || null,
      pdfSendMode: req.body.pdfSendMode || 'with-order'
    };
    
    const result = await callWebhook(WEBHOOKS.QUOTE_SUBMIT, 'POST', quoteData);
    console.log(`✅ [${new Date().toISOString()}] Quote submission successful`);
    res.json(result);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (quote/submit):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Order History API
app.get('/api/orders/history', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Loading order history via webhook...`);
    const startTime = Date.now();
    
    // Call the order history webhook (you'll need to create this in n8n)
    const data = await callWebhook(WEBHOOKS.ORDER_HISTORY);
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ [${loadTime}ms] Order history load successful:`, {
      ordersCount: data?.orders?.length || 0
    });
    
    res.json(data);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (orders/history):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    webhooks: {
      dataLoad: WEBHOOKS.DATA_LOAD,
      orderSubmit: WEBHOOKS.ORDER_SUBMIT,
      quoteSubmit: WEBHOOKS.QUOTE_SUBMIT,
      orderHistory: WEBHOOKS.ORDER_HISTORY
    },
    features: {
      pdfUpload: true,
      orderHistory: true,
      maxFileSize: '50MB'
    }
  });
});

// Enhanced debug endpoint to test webhook connectivity
app.get('/debug/webhooks', async (req, res) => {
  const results = {};
  const startTime = Date.now();
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Testing webhook connectivity...`);
    
    // Test data load webhook
    try {
      console.log('🧪 Testing data load webhook...');
      const dataLoadStart = Date.now();
      const dataLoadResult = await callWebhook(WEBHOOKS.DATA_LOAD);
      const dataLoadTime = Date.now() - dataLoadStart;
      
      results.dataLoad = { 
        status: 'success', 
        loadTime: `${dataLoadTime}ms`,
        dataStructure: {
          hasSuccess: 'success' in dataLoadResult,
          hasData: 'data' in dataLoadResult,
          suppliers: dataLoadResult?.data?.suppliers?.length || 0,
          categories: dataLoadResult?.data?.categories?.length || 0,
          materials: Object.keys(dataLoadResult?.data?.materials || {}).length
        }
      };
      console.log(`✅ Data load test passed (${dataLoadTime}ms)`);
    } catch (error) {
      results.dataLoad = { status: 'error', error: error.message };
      console.log(`❌ Data load test failed: ${error.message}`);
    }

    // Test order history webhook
    try {
      console.log('🧪 Testing order history webhook...');
      const historyStart = Date.now();
      const historyResult = await callWebhook(WEBHOOKS.ORDER_HISTORY);
      const historyTime = Date.now() - historyStart;
      
      results.orderHistory = { 
        status: 'success', 
        loadTime: `${historyTime}ms`,
        ordersCount: historyResult?.orders?.length || 0
      };
      console.log(`✅ Order history test passed (${historyTime}ms)`);
    } catch (error) {
      results.orderHistory = { status: 'error', error: error.message };
      console.log(`❌ Order history test failed: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    
    res.json({
      timestamp: new Date().toISOString(),
      totalTestTime: `${totalTime}ms`,
      webhookUrls: WEBHOOKS,
      testResults: results,
      recommendations: [
        results.dataLoad?.status === 'success' ? '✅ Data loading works' : '❌ Check data load webhook',
        results.orderHistory?.status === 'success' ? '✅ Order history works' : '❌ Check order history webhook',
        '💡 PDF uploads supported up to 50MB',
        '🔧 Create order history webhook in n8n if missing'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced force data load endpoint (for testing)
app.get('/force-load', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Force loading data from webhook...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.DATA_LOAD);
    const loadTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Data loaded successfully',
      loadTime: `${loadTime}ms`,
      dataStructure: {
        suppliers: data?.data?.suppliers?.length || 0,
        categories: data?.data?.categories?.length || 0,
        materials: Object.keys(data?.data?.materials || {}).length,
        summary: data?.data?.summary
      },
      timestamp: new Date().toISOString(),
      rawData: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// NEW: Test order history endpoint
app.get('/test-history', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Testing order history load...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.ORDER_HISTORY);
    const loadTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Order history loaded successfully',
      loadTime: `${loadTime}ms`,
      ordersCount: data?.orders?.length || 0,
      timestamp: new Date().toISOString(),
      sampleOrders: data?.orders?.slice(0, 3) || [],
      rawData: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ [${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`🚨 [${new Date().toISOString()}] Server Error:`, err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('🚀 LCMB Material Management Server Started (Enhanced)');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🔗 Webhook Endpoints:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
  console.log(`   📋 Order History: ${WEBHOOKS.ORDER_HISTORY}`);
  console.log('✨ New Features:');
  console.log('   📎 PDF Upload Support (up to 50MB)');
  console.log('   📊 Order History Tracking');
  console.log('   🎯 PDF-only sending mode');
  console.log('✅ Ready to receive requests!');
  console.log('💡 Visit / to load page with initial data');
  console.log('🔧 Visit /debug/webhooks to test webhook connectivity');
  console.log('🔄 Visit /force-load to manually test data loading');
  console.log('📋 Visit /test-history to test order history loading');
});
