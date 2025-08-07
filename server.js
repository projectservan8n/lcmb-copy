// Enhanced server.js with PDF Support and Order History
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Webhook URLs - Updated with new order history endpoint
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/dataload',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/ordersubmit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quotesubmit',
  ORDER_HISTORY: 'https://primary-s0q-production.up.railway.app/webhook/orderhistory'
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Increased limit for PDF uploads
app.use(express.static('.'));

// Enhanced Webhook Helper function with PDF support
async function callWebhook(webhookUrl, method = 'GET', data = null) {
  try {
    console.log(`🔗 [${new Date().toISOString()}] Calling webhook: ${method} ${webhookUrl}`);
    
    const config = {
      method,
      url: webhookUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LCMB-Material-Management/2.0',
        'Accept': 'application/json'
      },
      timeout: 45000, // Increased timeout for PDF processing
      validateStatus: function (status) {
        return status < 500;
      }
    };

    if (data) {
      config.data = data;
      
      // Log data info without exposing sensitive PDF content
      const logData = { ...data };
      if (logData.pdfFile) {
        logData.pdfFile = {
          name: data.pdfFile.name,
          size: data.pdfFile.size,
          type: data.pdfFile.type,
          dataLength: data.pdfFile.data ? data.pdfFile.data.length : 0
        };
      }
      console.log(`📦 Request data:`, JSON.stringify(logData, null, 2));
    }

    const response = await axios(config);
    
    console.log(`✅ [${new Date().toISOString()}] Webhook response: ${response.status} ${response.statusText}`);
    console.log(`📊 Response headers:`, response.headers);
    
    // Log response preview without full data
    const responsePreview = JSON.stringify(response.data).substring(0, 500);
    console.log(`📋 Response data preview:`, responsePreview + (responsePreview.length >= 500 ? '...' : ''));
    
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Enhanced validation for different endpoints
    if (webhookUrl.includes('dataload')) {
      if (!response.data) {
        throw new Error('Empty response from data load webhook');
      }
      
      console.log(`🔍 Data validation:`, {
        hasSuccess: 'success' in response.data,
        hasData: 'data' in response.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : 'none'
      });
    } else if (webhookUrl.includes('orderhistory')) {
      console.log(`📋 Order history validation:`, {
        hasSuccess: 'success' in response.data,
        hasOrders: 'orders' in response.data,
        orderCount: response.data.orders ? response.data.orders.length : 0
      });
    } else if (webhookUrl.includes('submit')) {
      console.log(`📤 Submission validation:`, {
        hasSuccess: 'success' in response.data,
        hasId: 'orderId' in response.data || 'quoteId' in response.data,
        status: response.data.success
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

// Enhanced API Routes with PDF and History Support
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

// Enhanced order submission with PDF support
app.post('/api/order/submit', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting enhanced order via webhook...`);
    console.log('📦 Enhanced order data received:', {
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      requestorName: req.body.requestorName,
      pdfMode: req.body.pdfMode,
      hasPdfFile: !!req.body.pdfFile,
      pdfFileName: req.body.pdfFile?.name
    });
    
    // Validate PDF file size if present
    if (req.body.pdfFile && req.body.pdfFile.size > 10 * 1024 * 1024) {
      throw new Error('PDF file too large. Maximum size is 10MB.');
    }
    
    const result = await callWebhook(WEBHOOKS.ORDER_SUBMIT, 'POST', req.body);
    console.log(`✅ [${new Date().toISOString()}] Enhanced order submission successful`);
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

// Enhanced quote submission with PDF support
app.post('/api/quote/submit', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting enhanced quote via webhook...`);
    console.log('💬 Enhanced quote data received:', {
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      requestorName: req.body.requestorName,
      pdfMode: req.body.pdfMode,
      hasPdfFile: !!req.body.pdfFile,
      pdfFileName: req.body.pdfFile?.name
    });
    
    // Validate PDF file size if present
    if (req.body.pdfFile && req.body.pdfFile.size > 10 * 1024 * 1024) {
      throw new Error('PDF file too large. Maximum size is 10MB.');
    }
    
    const result = await callWebhook(WEBHOOKS.QUOTE_SUBMIT, 'POST', req.body);
    console.log(`✅ [${new Date().toISOString()}] Enhanced quote submission successful`);
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

// NEW: Order History API endpoint
app.get('/api/order/history', async (req, res) => {
  try {
    console.log(`📋 [${new Date().toISOString()}] API: Loading order history via webhook...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.ORDER_HISTORY);
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ [${loadTime}ms] Order history loaded successfully:`, {
      success: data?.success,
      orderCount: data?.orders?.length || 0,
      summary: data?.summary
    });
    
    res.json(data);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (order/history):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      orders: [],
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced health check endpoint with new webhooks
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: '2.0.0', // Updated version for enhanced features
    features: {
      pdfUpload: true,
      orderHistory: true,
      materialSelection: true,
      emailNotifications: true
    },
    webhooks: {
      dataLoad: WEBHOOKS.DATA_LOAD,
      orderSubmit: WEBHOOKS.ORDER_SUBMIT,
      quoteSubmit: WEBHOOKS.QUOTE_SUBMIT,
      orderHistory: WEBHOOKS.ORDER_HISTORY
    }
  });
});

// Enhanced debug endpoint to test all webhook connectivity
app.get('/debug/webhooks', async (req, res) => {
  const results = {};
  const startTime = Date.now();
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Testing enhanced webhook connectivity...`);
    
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
        dataStructure: {
          hasSuccess: 'success' in historyResult,
          hasOrders: 'orders' in historyResult,
          orderCount: historyResult?.orders?.length || 0,
          hasSummary: 'summary' in historyResult
        }
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
      version: '2.0.0',
      webhookUrls: WEBHOOKS,
      testResults: results,
      systemStatus: {
        dataLoad: results.dataLoad?.status || 'not tested',
        orderHistory: results.orderHistory?.status || 'not tested',
        overallHealth: (results.dataLoad?.status === 'success' && results.orderHistory?.status === 'success') ? 'healthy' : 'degraded'
      },
      recommendations: [
        ...(results.dataLoad?.status === 'success' ? ['✅ Data loading is working correctly'] : ['❌ Check n8n data load workflow']),
        ...(results.orderHistory?.status === 'success' ? ['✅ Order history is working correctly'] : ['❌ Check n8n order history workflow']),
        '💡 All webhooks should return success status',
        '🔒 Verify Google Sheets permissions',
        '📧 Test Gmail API connectivity'
      ]
    });
  } catch (error) {
    res.status(500).json({
      error: 'Enhanced debug test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  }
});

// Enhanced force data load endpoint
app.get('/force-load', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Force loading enhanced data from webhook...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.DATA_LOAD);
    const loadTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Enhanced data loaded successfully',
      loadTime: `${loadTime}ms`,
      version: '2.0.0',
      dataStructure: {
        suppliers: data?.data?.suppliers?.length || 0,
        categories: data?.data?.categories?.length || 0,
        materials: Object.keys(data?.data?.materials || {}).length,
        materialsByCategoryAndSupplier: data?.data?.materialsByCategoryAndSupplier ? 'Available' : 'Not Available',
        summary: data?.data?.summary
      },
      timestamp: new Date().toISOString(),
      rawData: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  }
});

// NEW: Force load order history endpoint
app.get('/force-load-history', async (req, res) => {
  try {
    console.log(`📋 [${new Date().toISOString()}] Force loading order history from webhook...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.ORDER_HISTORY);
    const loadTime = Date.now() - startTime;
    
    res.json({
      success: true,
      message: 'Order history loaded successfully',
      loadTime: `${loadTime}ms`,
      version: '2.0.0',
      historyStructure: {
        totalOrders: data?.orders?.length || 0,
        summary: data?.summary || {},
        hasTimestamp: !!data?.timestamp
      },
      timestamp: new Date().toISOString(),
      rawData: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    });
  }
});

// NEW: Test PDF upload endpoint (for development)
app.post('/test-pdf', (req, res) => {
  try {
    console.log(`📄 [${new Date().toISOString()}] Testing PDF upload...`);
    
    const pdfData = req.body;
    
    if (!pdfData.pdfFile) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file provided'
      });
    }
    
    // Validate PDF
    const pdfFile = pdfData.pdfFile;
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (pdfFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `PDF file too large. Size: ${Math.round(pdfFile.size / 1024)}KB, Max: ${Math.round(maxSize / 1024)}KB`
      });
    }
    
    if (pdfFile.type !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF files are allowed.'
      });
    }
    
    // Test base64 decoding
    try {
      const base64Data = pdfFile.data.split(',')[1];
      const binaryData = Buffer.from(base64Data, 'base64');
      
      res.json({
        success: true,
        message: 'PDF upload test successful',
        pdfInfo: {
          filename: pdfFile.name,
          size: pdfFile.size,
          sizeFormatted: `${Math.round(pdfFile.size / 1024)} KB`,
          type: pdfFile.type,
          base64Length: base64Data.length,
          binaryLength: binaryData.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to process PDF data: ' + error.message
      });
    }
    
  } catch (error) {
    console.error(`❌ PDF test error:`, error);
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
  res.status(404).json({ 
    error: 'Not found',
    availableEndpoints: [
      'GET / - Main application',
      'GET /api/data/load - Load form data',
      'POST /api/order/submit - Submit order',
      'POST /api/quote/submit - Submit quote',
      'GET /api/order/history - Get order history',
      'GET /health - Health check',
      'GET /debug/webhooks - Test webhooks',
      'GET /force-load - Force data reload',
      'GET /force-load-history - Force history reload',
      'POST /test-pdf - Test PDF upload'
    ],
    version: '2.0.0'
  });
});

// Enhanced error handler
app.use((err, req, res, next) => {
  console.error(`🚨 [${new Date().toISOString()}] Server Error:`, err.stack);
  
  // Handle specific PDF upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: 'PDF file exceeds maximum size limit of 10MB',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.listen(PORT, () => {
  console.log('🚀 Enhanced LCMB Material Management Server Started');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Version: 2.0.0 (Enhanced with PDF & History)`);
  console.log('🔗 Enhanced Webhook Endpoints:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
  console.log(`   📋 Order History: ${WEBHOOKS.ORDER_HISTORY}`);
  console.log('✨ New Features Available:');
  console.log('   📄 PDF Upload Support (max 10MB)');
  console.log('   📋 Order History with filtering');
  console.log('   🔄 Three request modes: Materials+PDF, PDF-only, Materials-only');
  console.log('   📧 Enhanced email templates with PDF attachments');
  console.log('✅ Ready to receive enhanced requests!');
  console.log('💡 Available endpoints:');
  console.log('   🏠 Visit / to load page with initial data');
  console.log('   🔧 Visit /debug/webhooks to test webhook connectivity');
  console.log('   🔄 Visit /force-load to manually test data loading');
  console.log('   📋 Visit /force-load-history to test order history');
  console.log('   📄 POST to /test-pdf to test PDF upload functionality');
});
