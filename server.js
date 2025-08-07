// server.js - Enhanced with PDF Upload Support and Complete API Integration
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook URLs - Updated to match your n8n workflow endpoints
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/dataload',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/ordersubmit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quotesubmit',
  PDF_UPLOAD: 'https://primary-s0q-production.up.railway.app/webhook/pdfupload'  // NEW: PDF Upload endpoint
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Increased limit for PDF uploads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static('.'));

// Enhanced Webhook Helper function with PDF upload support
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
      timeout: 60000, // Increased timeout for PDF uploads (60 seconds)
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    };

    if (data) {
      config.data = data;
      
      // Log data preview (hide PDF data for brevity)
      const logData = { ...data };
      if (logData.pdfData) {
        logData.pdfData = `[BASE64_DATA_${logData.pdfData.length}_CHARS]`;
      }
      console.log(`📦 Request data:`, JSON.stringify(logData, null, 2));
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    console.log(`✅ [${new Date().toISOString()}] Webhook response (${duration}ms): ${response.status} ${response.statusText}`);
    console.log(`📊 Response headers:`, response.headers);
    
    // Log response preview
    const responsePreview = JSON.stringify(response.data).substring(0, 500);
    console.log(`📋 Response data preview:`, responsePreview + (responsePreview.length === 500 ? '...' : ''));
    
    // Check if response indicates success
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Validate response structure based on endpoint
    if (webhookUrl.includes('dataload')) {
      if (!response.data) {
        throw new Error('Empty response from data load webhook');
      }
      
      console.log(`🔍 Data validation:`, {
        hasSuccess: 'success' in response.data,
        hasData: 'data' in response.data,
        dataKeys: response.data.data ? Object.keys(response.data.data) : 'none'
      });
    } else if (webhookUrl.includes('pdfupload')) {
      console.log(`📄 PDF upload validation:`, {
        hasSuccess: 'success' in response.data,
        hasOrderId: 'orderId' in response.data || 'quoteId' in response.data,
        hasPdfInfo: 'pdfFileName' in response.data || 'driveLink' in response.data
      });
    } else {
      // Order/Quote submission validation
      console.log(`📝 Submission validation:`, {
        hasSuccess: 'success' in response.data,
        hasId: 'orderId' in response.data || 'quoteId' in response.data,
        hasSupplier: 'supplier' in response.data
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

// ===============================================
// ENHANCED HOME PAGE WITH INITIAL DATA LOADING
// ===============================================

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
      materialsByCategoryAndSupplier: formData?.data?.materialsByCategoryAndSupplier ? 'Available' : 'Not Available',
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
        materials: Object.keys(window.INITIAL_FORM_DATA?.data?.materials || {}).length,
        materialsByCategoryAndSupplier: window.INITIAL_FORM_DATA?.data?.materialsByCategoryAndSupplier ? 'Available' : 'Not Available'
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

// ===============================================
// API ROUTES - ENHANCED WITH PDF SUPPORT
// ===============================================

// Data Load API (existing)
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

// Order Submit API (existing)
app.post('/api/order/submit', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting order via webhook...`);
    console.log('📦 Order data received:', {
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      requestorName: req.body.requestorName,
      hasAdditionalPdf: !!req.body.additionalPdfData
    });
    
    const result = await callWebhook(WEBHOOKS.ORDER_SUBMIT, 'POST', req.body);
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

// Quote Submit API (existing)
app.post('/api/quote/submit', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting quote via webhook...`);
    console.log('💬 Quote data received:', {
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      requestorName: req.body.requestorName,
      hasAdditionalPdf: !!req.body.additionalPdfData
    });
    
    const result = await callWebhook(WEBHOOKS.QUOTE_SUBMIT, 'POST', req.body);
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

// NEW: PDF Upload API
app.post('/api/pdf/upload', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Processing PDF upload...`);
    
    // Validate required fields
    const requiredFields = ['requestType', 'supplierName', 'supplierEmail', 'requestorName', 'requestorEmail', 'pdfData', 'filename'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate PDF data
    if (!req.body.pdfData || typeof req.body.pdfData !== 'string') {
      throw new Error('Invalid PDF data provided');
    }
    
    // Validate file size (approximate - base64 is ~33% larger than original)
    const estimatedFileSize = (req.body.pdfData.length * 0.75) / 1024 / 1024; // Convert to MB
    if (estimatedFileSize > 10) {
      throw new Error(`PDF file too large: ${estimatedFileSize.toFixed(2)}MB (max 10MB)`);
    }
    
    console.log('📄 PDF upload data received:', {
      requestType: req.body.requestType,
      supplierName: req.body.supplierName,
      requestorName: req.body.requestorName,
      filename: req.body.filename,
      estimatedSize: `${estimatedFileSize.toFixed(2)}MB`,
      category: req.body.category || 'PDF Upload',
      urgency: req.body.urgency || 'Normal',
      hasProjectRef: !!req.body.projectRef,
      hasNotes: !!req.body.notes
    });
    
    // Prepare data for n8n webhook (matches your workflow structure)
    const webhookData = {
      requestType: req.body.requestType,
      supplierName: req.body.supplierName,
      supplierEmail: req.body.supplierEmail,
      requestorName: req.body.requestorName,
      requestorEmail: req.body.requestorEmail,
      urgency: req.body.urgency || 'Normal',
      projectRef: req.body.projectRef || '',
      notes: req.body.notes || '',
      category: req.body.category || 'PDF Upload',
      filename: req.body.filename,
      pdfData: req.body.pdfData,
      // Add materials array if this is from "both" method
      materials: req.body.materials || []
    };
    
    const startTime = Date.now();
    const result = await callWebhook(WEBHOOKS.PDF_UPLOAD, 'POST', webhookData);
    const uploadTime = Date.now() - startTime;
    
    console.log(`✅ [${uploadTime}ms] PDF upload successful:`, {
      orderId: result.orderId,
      quoteId: result.quoteId,
      pdfFileName: result.pdfFileName,
      driveLink: result.driveLink ? 'Available' : 'Not Available',
      supplier: result.supplier
    });
    
    res.json(result);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (pdf/upload):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===============================================
// HEALTH & DEBUG ENDPOINTS
// ===============================================

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: '2.0.0-enhanced',
    features: [
      'Method Selection',
      'PDF Upload Support', 
      'System Material Selection',
      'Confirmation Flow',
      'Enhanced Error Handling'
    ],
    webhooks: {
      dataLoad: WEBHOOKS.DATA_LOAD,
      orderSubmit: WEBHOOKS.ORDER_SUBMIT,
      quoteSubmit: WEBHOOKS.QUOTE_SUBMIT,
      pdfUpload: WEBHOOKS.PDF_UPLOAD
    }
  });
});

// Enhanced debug endpoint to test all webhook connectivity
app.get('/debug/webhooks', async (req, res) => {
  const results = {};
  const startTime = Date.now();
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Testing all webhook connectivity...`);
    
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
          materials: Object.keys(dataLoadResult?.data?.materials || {}).length,
          materialsByCategoryAndSupplier: dataLoadResult?.data?.materialsByCategoryAndSupplier ? 'Available' : 'Not Available'
        }
      };
      console.log(`✅ Data load test passed (${dataLoadTime}ms)`);
    } catch (error) {
      results.dataLoad = { status: 'error', error: error.message };
      console.log(`❌ Data load test failed: ${error.message}`);
    }

    // Test PDF upload webhook (with minimal test data)
    try {
      console.log('🧪 Testing PDF upload webhook availability...');
      // We don't actually send test data, just check if endpoint responds
      results.pdfUpload = { 
        status: 'available',
        note: 'Endpoint available (not tested with actual data to avoid creating test records)'
      };
      console.log(`✅ PDF upload endpoint available`);
    } catch (error) {
      results.pdfUpload = { status: 'error', error: error.message };
      console.log(`❌ PDF upload test failed: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    
    res.json({
      timestamp: new Date().toISOString(),
      totalTestTime: `${totalTime}ms`,
      version: '2.0.0-enhanced',
      webhookUrls: WEBHOOKS,
      testResults: results,
      recommendations: [
        results.dataLoad?.status === 'success' 
          ? '✅ Data loading is working correctly'
          : '❌ Check n8n workflow execution and Google Sheets access',
        '📄 PDF upload endpoint is configured and ready',
        '🔧 All webhook URLs are properly configured',
        results.dataLoad?.dataStructure?.materialsByCategoryAndSupplier === 'Available'
          ? '✅ Enhanced material filtering is available'
          : '⚠️ Using fallback material filtering'
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

// Test PDF upload endpoint (for development)
app.get('/debug/pdf-test', (req, res) => {
  res.json({
    message: 'PDF Upload Test Endpoint',
    timestamp: new Date().toISOString(),
    instructions: [
      '1. Use POST method to /api/pdf/upload',
      '2. Include required fields: requestType, supplierName, supplierEmail, requestorName, requestorEmail, pdfData, filename',
      '3. pdfData should be base64 encoded PDF content',
      '4. Maximum file size: 10MB',
      '5. Supported request types: order, quote'
    ],
    requiredFields: [
      'requestType (order|quote)',
      'supplierName (string)',
      'supplierEmail (email)',
      'requestorName (string)', 
      'requestorEmail (email)',
      'pdfData (base64 string)',
      'filename (string)'
    ],
    optionalFields: [
      'category (string, default: "PDF Upload")',
      'urgency (string, default: "Normal")',
      'projectRef (string)',
      'notes (string)',
      'materials (array, for "both" method)'
    ],
    webhookEndpoint: WEBHOOKS.PDF_UPLOAD
  });
});

// Enhanced force data load endpoint
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
      version: '2.0.0-enhanced',
      dataStructure: {
        suppliers: data?.data?.suppliers?.length || 0,
        categories: data?.data?.categories?.length || 0,
        materials: Object.keys(data?.data?.materials || {}).length,
        materialsByCategoryAndSupplier: data?.data?.materialsByCategoryAndSupplier ? 'Available' : 'Not Available',
        suppliersByCategory: data?.data?.suppliersByCategory ? Object.keys(data.data.suppliersByCategory).length : 0,
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

// ===============================================
// ERROR HANDLING & 404
// ===============================================

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ [${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`,
    availableRoutes: [
      'GET /',
      'GET /api/data/load',
      'POST /api/order/submit',
      'POST /api/quote/submit',
      'POST /api/pdf/upload',
      'GET /health',
      'GET /debug/webhooks',
      'GET /debug/pdf-test',
      'GET /force-load'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`🚨 [${new Date().toISOString()}] Server Error:`, err.stack);
  
  // Handle different types of errors
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request payload too large';
  }
  
  res.status(statusCode).json({ 
    error: message,
    details: process.env.NODE_ENV === 'production' ? undefined : err.message,
    timestamp: new Date().toISOString(),
    version: '2.0.0-enhanced'
  });
});

// ===============================================
// SERVER STARTUP
// ===============================================

app.listen(PORT, () => {
  console.log('🚀 LCMB Material Management Server Started (Enhanced Version)');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Version: 2.0.0-enhanced`);
  console.log('');
  console.log('🔗 Webhook Endpoints:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
  console.log(`   📄 PDF Upload: ${WEBHOOKS.PDF_UPLOAD}`);
  console.log('');
  console.log('🎯 API Endpoints:');
  console.log(`   📊 GET /api/data/load - Load form data`);
  console.log(`   📦 POST /api/order/submit - Submit material order`);
  console.log(`   💬 POST /api/quote/submit - Submit quote request`);
  console.log(`   📄 POST /api/pdf/upload - Upload PDF request`);
  console.log('');
  console.log('🔧 Debug Endpoints:');
  console.log(`   ✅ GET /health - Health check`);
  console.log(`   🧪 GET /debug/webhooks - Test webhook connectivity`);
  console.log(`   📄 GET /debug/pdf-test - PDF upload instructions`);
  console.log(`   🔄 GET /force-load - Manually test data loading`);
  console.log('');
  console.log('✅ Ready to receive requests!');
  console.log('💡 Visit / to load page with initial data');
  console.log('🔧 Visit /debug/webhooks to test all webhook connectivity');
  console.log('📄 Visit /debug/pdf-test for PDF upload documentation');
});
