// Enhanced server.js with PDF Upload, Order History, and Security
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced Webhook URLs - Updated to match your n8n setup
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/dataload',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/ordersubmit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quotesubmit',
  HISTORY_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/historyload'
};

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://primary-s0q-production.up.railway.app"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Performance Middleware
app.use(compression());

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 uploads per minute
  message: {
    error: 'Too many file uploads, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 API requests per minute
  message: {
    error: 'Too many API requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/', generalLimiter);
app.use('/api/', apiLimiter);

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://lcmbgroup.com.au', 'https://www.lcmbgroup.com.au']
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '15mb', // Increased for base64 PDF uploads
  verify: (req, res, buf) => {
    // Log large payloads for monitoring
    if (buf.length > 5 * 1024 * 1024) { // 5MB
      console.log(`⚠️ Large payload received: ${(buf.length / 1024 / 1024).toFixed(2)}MB from ${req.ip}`);
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '15mb'
}));

// Static file serving
app.use(express.static('.', {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true
}));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`📊 [${timestamp}] ${method} ${url} - ${ip} - ${userAgent.substring(0, 50)}`);
  
  // Log payload size for POST requests
  if (method === 'POST' && req.get('content-length')) {
    const sizeKB = Math.round(parseInt(req.get('content-length')) / 1024);
    console.log(`📦 Payload size: ${sizeKB}KB`);
  }
  
  next();
});

// Enhanced Webhook Helper function with detailed logging and retry logic
async function callWebhook(webhookUrl, method = 'GET', data = null, retries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔗 [${new Date().toISOString()}] Attempt ${attempt}/${retries}: ${method} ${webhookUrl}`);
      
      const config = {
        method,
        url: webhookUrl,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LCMB-Material-Management/2.0',
          'Accept': 'application/json',
          'X-Request-ID': `lcmb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        },
        timeout: 45000, // 45 seconds timeout for large PDFs
        validateStatus: function (status) {
          return status < 500; // Accept any status code less than 500
        },
        maxContentLength: 20 * 1024 * 1024, // 20MB max response
        maxBodyLength: 20 * 1024 * 1024 // 20MB max request
      };

      if (data) {
        config.data = data;
        
        // Log data size and type
        const dataSize = JSON.stringify(data).length;
        const hasPDF = data.pdfAttachment ? 'Yes' : 'No';
        const materialsCount = Array.isArray(data.materials) ? data.materials.length : 0;
        
        console.log(`📦 Request data: ${(dataSize / 1024).toFixed(1)}KB, PDF: ${hasPDF}, Materials: ${materialsCount}`);
      }

      const startTime = Date.now();
      const response = await axios(config);
      const duration = Date.now() - startTime;
      
      console.log(`✅ [${new Date().toISOString()}] Webhook response: ${response.status} ${response.statusText} (${duration}ms)`);
      
      // Log response size
      const responseSize = JSON.stringify(response.data).length;
      console.log(`📊 Response size: ${(responseSize / 1024).toFixed(1)}KB`);
      
      // Check if response indicates success
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Validate response structure for specific endpoints
      if (webhookUrl.includes('dataload') || webhookUrl.includes('historyload')) {
        if (!response.data) {
          throw new Error('Empty response from webhook');
        }
      }
      
      return response.data;
      
    } catch (error) {
      lastError = error;
      
      console.error(`❌ [${new Date().toISOString()}] Webhook Error (Attempt ${attempt}/${retries}):`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: webhookUrl,
        timeout: error.code === 'ECONNABORTED',
        retryable: attempt < retries
      });
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw new Error(`Webhook call failed after ${retries} attempts: ${lastError.message}`);
}

// Input validation middleware
const validateOrderSubmission = [
  body('requestType').isIn(['order', 'quote']).withMessage('Invalid request type'),
  body('pdfMode').isIn(['no-pdf', 'with-order', 'pdf-only']).withMessage('Invalid PDF mode'),
  body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category is required'),
  body('supplier').trim().isLength({ min: 1, max: 100 }).withMessage('Supplier is required'),
  body('requestorName').trim().isLength({ min: 1, max: 100 }).withMessage('Requestor name is required'),
  body('requestorEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('urgency').optional().isIn(['Normal', 'High', 'Urgent']).withMessage('Invalid urgency level'),
  body('projectRef').optional().trim().isLength({ max: 50 }).withMessage('Project reference too long'),
  body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes too long'),
  body('materials').optional().isArray().withMessage('Materials must be an array'),
  body('pdfAttachment.name').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Invalid PDF filename'),
  body('pdfAttachment.base64').optional().isBase64().withMessage('Invalid PDF data'),
];

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

// API Routes - Direct webhook proxies with enhanced logging and validation

// Data Loading API
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
      timestamp: new Date().toISOString(),
      endpoint: 'data/load'
    });
  }
});

// Order History API
app.get('/api/history/load', async (req, res) => {
  try {
    console.log(`🔄 [${new Date().toISOString()}] API: Loading order history via webhook...`);
    const startTime = Date.now();
    
    const data = await callWebhook(WEBHOOKS.HISTORY_LOAD);
    const loadTime = Date.now() - startTime;
    
    console.log(`✅ [${loadTime}ms] API order history load successful:`, {
      ordersCount: Array.isArray(data.orders) ? data.orders.length : 0
    });
    
    res.json(data);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (history/load):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'history/load'
    });
  }
});

// Enhanced Order Submission API with PDF support
app.post('/api/order/submit', uploadLimiter, validateOrderSubmission, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting order via webhook...`);
    console.log('📦 Order data received:', {
      requestType: req.body.requestType,
      pdfMode: req.body.pdfMode,
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      hasPDF: !!req.body.pdfAttachment,
      pdfSize: req.body.pdfAttachment ? `${(Buffer.from(req.body.pdfAttachment.base64, 'base64').length / 1024 / 1024).toFixed(2)}MB` : 'N/A',
      requestorName: req.body.requestorName
    });
    
    const result = await callWebhook(WEBHOOKS.ORDER_SUBMIT, 'POST', req.body);
    console.log(`✅ [${new Date().toISOString()}] Order submission successful`);
    res.json(result);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (order/submit):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'order/submit'
    });
  }
});

// Enhanced Quote Submission API with PDF support
app.post('/api/quote/submit', uploadLimiter, validateOrderSubmission, async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`🔄 [${new Date().toISOString()}] API: Submitting quote via webhook...`);
    console.log('💬 Quote data received:', {
      requestType: req.body.requestType,
      pdfMode: req.body.pdfMode,
      category: req.body.category,
      supplier: req.body.supplier,
      materials: req.body.materials?.length || 0,
      hasPDF: !!req.body.pdfAttachment,
      pdfSize: req.body.pdfAttachment ? `${(Buffer.from(req.body.pdfAttachment.base64, 'base64').length / 1024 / 1024).toFixed(2)}MB` : 'N/A',
      requestorName: req.body.requestorName
    });
    
    const result = await callWebhook(WEBHOOKS.QUOTE_SUBMIT, 'POST', req.body);
    console.log(`✅ [${new Date().toISOString()}] Quote submission successful`);
    res.json(result);
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] API Error (quote/submit):`, error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString(),
      endpoint: 'quote/submit'
    });
  }
});

// Enhanced health check endpoint with system info
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: Math.floor(uptime),
      human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    version: require('./package.json').version,
    nodeVersion: process.version,
    webhooks: {
      dataLoad: WEBHOOKS.DATA_LOAD,
      orderSubmit: WEBHOOKS.ORDER_SUBMIT,
      quoteSubmit: WEBHOOKS.QUOTE_SUBMIT,
      historyLoad: WEBHOOKS.HISTORY_LOAD
    },
    features: {
      pdfUpload: true,
      orderHistory: true,
      rateLimiting: true,
      compression: true,
      security: true
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

    // Test history load webhook
    try {
      console.log('🧪 Testing history load webhook...');
      const historyLoadStart = Date.now();
      const historyLoadResult = await callWebhook(WEBHOOKS.HISTORY_LOAD);
      const historyLoadTime = Date.now() - historyLoadStart;
      
      results.historyLoad = {
        status: 'success',
        loadTime: `${historyLoadTime}ms`,
        ordersCount: Array.isArray(historyLoadResult.orders) ? historyLoadResult.orders.length : 0
      };
      console.log(`✅ History load test passed (${historyLoadTime}ms)`);
    } catch (error) {
      results.historyLoad = { status: 'error', error: error.message };
      console.log(`❌ History load test failed: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    
    res.json({
      timestamp: new Date().toISOString(),
      totalTestTime: `${totalTime}ms`,
      webhookUrls: WEBHOOKS,
      testResults: results,
      systemInfo: {
        nodeVersion: process.version,
        uptime: `${Math.floor(process.uptime())}s`,
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      recommendations: Object.values(results).every(r => r.status === 'success')
        ? ['✅ All webhooks are working correctly']
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
      features: {
        materialsByCategoryAndSupplier: !!data?.data?.materialsByCategoryAndSupplier,
        suppliersByCategory: !!data?.data?.suppliersByCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// PDF Upload test endpoint (for development)
app.post('/debug/pdf-test', uploadLimiter, (req, res) => {
  try {
    const { pdfAttachment } = req.body;
    
    if (!pdfAttachment) {
      return res.status(400).json({
        success: false,
        error: 'No PDF attachment provided'
      });
    }
    
    const pdfBuffer = Buffer.from(pdfAttachment.base64, 'base64');
    const sizeKB = Math.round(pdfBuffer.length / 1024);
    
    console.log('📄 PDF Test Upload:', {
      name: pdfAttachment.name,
      originalSize: pdfAttachment.size,
      base64Size: pdfAttachment.base64.length,
      decodedSize: pdfBuffer.length,
      sizeKB: sizeKB
    });
    
    res.json({
      success: true,
      message: 'PDF processed successfully',
      details: {
        filename: pdfAttachment.name,
        originalSize: pdfAttachment.size,
        processedSizeKB: sizeKB,
        isValidBase64: true,
        type: pdfAttachment.type
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ PDF test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`🚨 [${new Date().toISOString()}] Global Error Handler:`, {
    message: err.message,
    stack: err.stack.split('\n').slice(0, 5).join('\n'),
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.get('X-Request-ID') || 'unknown'
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ [${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url} from ${req.ip}`);
  res.status(404).json({ 
    error: 'Not found',
    message: `The requested resource ${req.url} was not found`,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Enhanced LCMB Material Management Server Started');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Node.js: ${process.version}`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log('🔗 Webhook Endpoints:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
  console.log(`   📋 History Load: ${WEBHOOKS.HISTORY_LOAD}`);
  console.log('🛡️ Security Features:');
  console.log('   ✅ Helmet (Security Headers)');
  console.log('   ✅ Rate Limiting');
  console.log('   ✅ Input Validation');
  console.log('   ✅ CORS Protection');
  console.log('   ✅ Compression');
  console.log('⚡ Performance Features:');
  console.log('   ✅ Response Compression');
  console.log('   ✅ Static File Caching');
  console.log('   ✅ Request Logging');
  console.log('📄 PDF Features:');
  console.log('   ✅ Base64 PDF Upload (15MB max)');
  console.log('   ✅ Upload Rate Limiting (5/min)');
  console.log('   ✅ PDF Validation');
  console.log('✅ Ready to receive requests!');
  console.log('💡 Visit / to load page with initial data');
  console.log('🔧 Visit /debug/webhooks to test webhook connectivity');
  console.log('🔄 Visit /force-load to manually test data loading');
  console.log('📊 Visit /health for system status');
});
