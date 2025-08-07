// server.js - Enhanced with File Upload Support and Debug Logging
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook URLs - Updated to match your n8n setup
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/dataload',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/ordersubmit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quotesubmit'
};

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Enhanced Webhook Helper function with detailed logging
async function callWebhook(webhookUrl, method = 'GET', data = null, file = null) {
  try {
    console.log(`🔗 [${new Date().toISOString()}] Calling webhook: ${method} ${webhookUrl}`);
    
    const config = {
      method,
      url: webhookUrl,
      headers: {
        'User-Agent': 'LCMB-Material-Management/1.0',
        'Accept': 'application/json'
      },
      timeout: 30000, // 30 seconds timeout
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    };

    // Handle file uploads with FormData
    if (file || (data && data.requestMethod && (data.requestMethod === 'pdf' || data.requestMethod === 'mixed'))) {
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Add all data fields
      if (data) {
        Object.keys(data).forEach(key => {
          if (key === 'materials' && Array.isArray(data[key])) {
            formData.append(key, JSON.stringify(data[key]));
          } else if (key === 'uploadedFile' && typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        });
      }
      
      // Add PDF file if present
      if (file) {
        formData.append('pdfFile', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
        console.log(`📎 Adding PDF file: ${file.originalname} (${file.size} bytes)`);
      }
      
      config.data = formData;
      config.headers = {
        ...config.headers,
        ...formData.getHeaders()
      };
    } else if (data) {
      // Regular JSON data
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
      console.log(`📦 Request data:`, JSON.stringify(data, null, 2));
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

// ENHANCED: Order submission with file upload support
app.post('/api/order/submit', upload.single('pdfFile'), async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting order via webhook...`);
    
    // Parse form data
    const formData = { ...req.body };
    
    // Parse JSON fields
    if (formData.materials && typeof formData.materials === 'string') {
      try {
        formData.materials = JSON.parse(formData.materials);
      } catch (e) {
        console.warn('⚠️ Failed to parse materials JSON, using as string');
      }
    }
    
    if (formData.uploadedFile && typeof formData.uploadedFile === 'string') {
      try {
        formData.uploadedFile = JSON.parse(formData.uploadedFile);
      } catch (e) {
        console.warn('⚠️ Failed to parse uploadedFile JSON, using as string');
      }
    }
    
    console.log('📦 Order data received:', {
      requestMethod: formData.requestMethod,
      category: formData.category,
      supplier: formData.supplier,
      materials: formData.materials?.length || 0,
      requestorName: formData.requestorName,
      hasFile: !!req.file,
      fileName: req.file?.originalname
    });
    
    const result = await callWebhook(WEBHOOKS.ORDER_SUBMIT, 'POST', formData, req.file);
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

// ENHANCED: Quote submission with file upload support
app.post('/api/quote/submit', upload.single('pdfFile'), async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting quote via webhook...`);
    
    // Parse form data
    const formData = { ...req.body };
    
    // Parse JSON fields
    if (formData.materials && typeof formData.materials === 'string') {
      try {
        formData.materials = JSON.parse(formData.materials);
      } catch (e) {
        console.warn('⚠️ Failed to parse materials JSON, using as string');
      }
    }
    
    if (formData.uploadedFile && typeof formData.uploadedFile === 'string') {
      try {
        formData.uploadedFile = JSON.parse(formData.uploadedFile);
      } catch (e) {
        console.warn('⚠️ Failed to parse uploadedFile JSON, using as string');
      }
    }
    
    console.log('💬 Quote data received:', {
      requestMethod: formData.requestMethod,
      category: formData.category,
      supplier: formData.supplier,
      materials: formData.materials?.length || 0,
      requestorName: formData.requestorName,
      hasFile: !!req.file,
      fileName: req.file?.originalname
    });
    
    const result = await callWebhook(WEBHOOKS.QUOTE_SUBMIT, 'POST', formData, req.file);
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

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    features: ['file-upload', 'pdf-support'],
    webhooks: {
      dataLoad: WEBHOOKS.DATA_LOAD,
      orderSubmit: WEBHOOKS.ORDER_SUBMIT,
      quoteSubmit: WEBHOOKS.QUOTE_SUBMIT
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

    const totalTime = Date.now() - startTime;
    
    res.json({
      timestamp: new Date().toISOString(),
      totalTestTime: `${totalTime}ms`,
      webhookUrls: WEBHOOKS,
      testResults: results,
      fileUploadSupport: true,
      maxFileSize: '10MB',
      supportedFormats: ['PDF'],
      recommendations: results.dataLoad?.status === 'success' 
        ? ['✅ Webhooks are working correctly', '✅ PDF upload support enabled']
        : ['❌ Check n8n workflow execution', '❌ Verify Google Sheets access', '❌ Check webhook URLs']
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

// Handle multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 10MB.',
        timestamp: new Date().toISOString()
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only 1 file allowed.',
        timestamp: new Date().toISOString()
      });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({
      success: false,
      error: 'Only PDF files are allowed.',
      timestamp: new Date().toISOString()
    });
  }
  
  next(error);
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
  console.log('🚀 LCMB Material Management Server Started (Enhanced with PDF Upload)');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('📎 Features: PDF Upload Support, File Size Limit: 10MB');
  console.log('🔗 Webhook Endpoints:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
  console.log('✅ Ready to receive requests with file uploads!');
  console.log('💡 Visit / to load page with initial data');
  console.log('🔧 Visit /debug/webhooks to test webhook connectivity');
  console.log('🔄 Visit /force-load to manually test data loading');
});
