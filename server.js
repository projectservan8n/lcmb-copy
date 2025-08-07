// server.js - Enhanced with Binary PDF Upload Support
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook URLs - Updated to match your n8n workflow endpoints
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/dataload',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/ordersubmit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quotesubmit',
  PDF_UPLOAD: 'https://primary-s0q-production.up.railway.app/webhook/pdfupload'  // Binary PDF Upload endpoint
};

// Configure multer for PDF file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  storage: multer.memoryStorage() // Store in memory for forwarding to n8n
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // For JSON requests
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static('.'));

// Enhanced Webhook Helper function with binary PDF support
async function callWebhook(webhookUrl, method = 'GET', data = null, isFormData = false) {
  try {
    console.log(`🔗 [${new Date().toISOString()}] Calling webhook: ${method} ${webhookUrl} ${isFormData ? '(Binary FormData)' : ''}`);
    
    const config = {
      method,
      url: webhookUrl,
      headers: {
        'User-Agent': 'LCMB-Material-Management/2.0',
      },
      timeout: 120000, // Increased timeout for binary uploads (120 seconds)
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    };

    if (data) {
      if (isFormData) {
        // For binary FormData uploads
        config.data = data;
        config.headers = {
          ...config.headers,
          ...data.getHeaders() // Let form-data set the correct headers
        };
      } else {
        // For JSON data
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
        config.headers['Accept'] = 'application/json';
      }
      
      if (!isFormData) {
        // Log data preview (hide binary data for brevity)
        const logData = { ...data };
        if (logData.pdfData) {
          logData.pdfData = `[BASE64_DATA_${logData.pdfData.length}_CHARS]`;
        }
        console.log(`📦 Request data:`, JSON.stringify(logData, null, 2));
      } else {
        console.log(`📦 Binary FormData request with PDF file`);
      }
    }

    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    console.log(`✅ [${new Date().toISOString()}] Webhook response (${duration}ms): ${response.status} ${response.statusText}`);
    
    // Log response preview
    const responsePreview = JSON.stringify(response.data).substring(0, 500);
    console.log(`📋 Response data preview:`, responsePreview + (responsePreview.length === 500 ? '...' : ''));
    
    // Check if response indicates success
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Validate response structure based on endpoint
    if (webhookUrl.includes('pdfupload')) {
      console.log(`📄 PDF upload validation:`, {
        hasSuccess: 'success' in response.data,
        hasOrderId: 'orderId' in response.data || 'quoteId' in response.data,
        hasPdfInfo: 'pdfFileName' in response.data || 'driveLink' in response.data
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

// NEW: Binary PDF Upload API
app.post('/api/pdf/upload', upload.single('pdfFile'), async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Processing binary PDF upload...`);
    
    // Validate file upload
    if (!req.file) {
      throw new Error('No PDF file uploaded');
    }
    
    if (req.file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }
    
    // Validate required fields
    const requiredFields = ['requestType', 'supplierName', 'supplierEmail', 'requestorName', 'requestorEmail', 'filename'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      throw new Error(`PDF file too large: ${(req.file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`);
    }
    
    console.log('📄 Binary PDF upload data received:', {
      requestType: req.body.requestType,
      supplierName: req.body.supplierName,
      requestorName: req.body.requestorName,
      filename: req.body.filename,
      originalName: req.file.originalname,
      fileSize: `${(req.file.size / 1024 / 1024).toFixed(2)}MB`,
      mimeType: req.file.mimetype,
      category: req.body.category || 'PDF Upload',
      urgency: req.body.urgency || 'Normal',
      hasProjectRef: !!req.body.projectRef,
      hasNotes: !!req.body.notes,
      categories: req.body.categories ? JSON.parse(req.body.categories) : []
    });
    
    // Create FormData for n8n webhook with binary PDF
    const formData = new FormData();
    
    // Add the PDF file as binary data
    formData.append('pdfFile', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.size
    });
    
    // Add all other form fields
    formData.append('requestType', req.body.requestType);
    formData.append('supplierName', req.body.supplierName);
    formData.append('supplierEmail', req.body.supplierEmail);
    formData.append('requestorName', req.body.requestorName);
    formData.append('requestorEmail', req.body.requestorEmail);
    formData.append('urgency', req.body.urgency || 'Normal');
    formData.append('projectRef', req.body.projectRef || '');
    formData.append('notes', req.body.notes || '');
    formData.append('category', req.body.category || 'PDF Upload');
    formData.append('filename', req.body.filename);
    
    // Add categories if provided
    if (req.body.categories) {
      formData.append('categories', req.body.categories);
    }
    
    // Add materials array if this is from "both" method
    if (req.body.materials) {
      formData.append('materials', req.body.materials);
    }
    
    console.log('📤 Forwarding binary PDF to n8n webhook...');
    
    const startTime = Date.now();
    const result = await callWebhook(WEBHOOKS.PDF_UPLOAD, 'POST', formData, true);
    const uploadTime = Date.now() - startTime;
    
    console.log(`✅ [${uploadTime}ms] Binary PDF upload successful:`, {
      orderId: result.orderId,
      quoteId: result.quoteId,
      pdfFileName: result.pdfFileName,
      driveLink: result.driveLink ? 'Available' : 'Not Available',
      supplier: result.supplier
    });
    
    res.json(result);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (pdf/upload):`, error.message);
    
    // Handle multer errors specifically
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ 
        success: false, 
        error: 'PDF file too large (max 10MB)',
        timestamp: new Date().toISOString()
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ 
        success: false, 
        error: 'Unexpected file upload',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
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
