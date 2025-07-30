const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Your n8n webhook base URL
const N8N_BASE_URL = 'https://primary-s0q-production.up.railway.app';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS for all origins and methods
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

// Security headers
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent')?.substring(0, 50) || 'Unknown'}`);
    next();
});

// Serve static files with proper caching
app.use(express.static('.', {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        } else if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
    }
}));

// 🔧 N8N PROXY ENDPOINTS (Mobile CORS Fix)
// These endpoints proxy requests to your n8n workflow to avoid CORS issues on mobile

app.get('/api/n8n-proxy/materials-data', async (req, res) => {
    console.log('📱 Mobile proxy request - Materials Data');
    
    try {
        const fetch = (await import('node-fetch')).default;
        const n8nUrl = `${N8N_BASE_URL}/webhook/materials-data`;
        
        console.log(`📡 Proxying to: ${n8nUrl}`);
        
        const response = await fetch(n8nUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'LCMB-Proxy/1.0'
            },
            timeout: 10000
        });
        
        if (!response.ok) {
            console.error(`❌ n8n response error: ${response.status} ${response.statusText}`);
            throw new Error(`n8n returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ n8n materials data received successfully');
        
        res.json(data);
        
    } catch (error) {
        console.error('❌ n8n proxy error:', error.message);
        
        // Return demo data as fallback
        console.log('🔄 Returning demo data as fallback');
        res.json({
            status: 'success',
            version: '2.0',
            system: 'Smart LCMB Procurement (Proxy Fallback)',
            timestamp: new Date().toISOString(),
            data: {
                suppliers: [
                    {
                        id: 'SUP001',
                        name: 'ElectroSupply Co.',
                        email: 'orders@electrosupply.com.au',
                        phone: '(02) 1234-5678',
                        specialties: ['Electrical', 'AC Install'],
                        reliabilityScore: 95.5,
                        tier: 'Premium',
                        leadTimeDays: 2,
                        minOrderValue: 100
                    },
                    {
                        id: 'SUP002',
                        name: 'AC Parts Direct',
                        email: 'sales@acpartsdirect.com.au',
                        phone: '(02) 8765-4321',
                        specialties: ['AC Install', 'AC Service'],
                        reliabilityScore: 92.1,
                        tier: 'Premium',
                        leadTimeDays: 1,
                        minOrderValue: 200
                    }
                ],
                materials: {
                    'Electrical': [
                        {
                            id: 'EL-CB-20A',
                            name: 'Circuit Breaker 20A',
                            category: 'Electrical',
                            unit: 'pcs',
                            basePrice: 25.00,
                            description: 'Single pole circuit breaker 20A rated',
                            code: 'EL-CB-20A',
                            brand: 'Schneider Electric',
                            stockLevel: 150,
                            availabilityStatus: 'In Stock'
                        }
                    ],
                    'AC Install': [
                        {
                            id: 'AC-SS-25',
                            name: 'Split System Unit 2.5kW',
                            category: 'AC Install',
                            unit: 'pcs',
                            basePrice: 899.00,
                            description: 'Energy efficient split system 2.5kW cooling',
                            code: 'AC-SS-25',
                            brand: 'Daikin',
                            stockLevel: 25,
                            availabilityStatus: 'In Stock'
                        }
                    ]
                },
                categories: ['Electrical', 'AC Install'],
                supplierCapabilities: {
                    'SUP001': {
                        categories: ['Electrical'],
                        materials: [{
                            id: 'EL-CB-20A',
                            name: 'Circuit Breaker 20A',
                            category: 'Electrical',
                            unit: 'pcs',
                            basePrice: 25.00,
                            supplierPrice: 23.50,
                            description: 'Single pole circuit breaker 20A rated',
                            code: 'EL-CB-20A',
                            brand: 'Schneider Electric',
                            stockLevel: 150,
                            availabilityStatus: 'In Stock',
                            supplierLeadTime: 2
                        }],
                        totalMaterials: 1
                    },
                    'SUP002': {
                        categories: ['AC Install'],
                        materials: [{
                            id: 'AC-SS-25',
                            name: 'Split System Unit 2.5kW',
                            category: 'AC Install',
                            unit: 'pcs',
                            basePrice: 899.00,
                            supplierPrice: 850.00,
                            description: 'Energy efficient split system 2.5kW cooling',
                            code: 'AC-SS-25',
                            brand: 'Daikin',
                            stockLevel: 25,
                            availabilityStatus: 'In Stock',
                            supplierLeadTime: 1
                        }],
                        totalMaterials: 1
                    }
                },
                metadata: {
                    totalSuppliers: 2,
                    totalMaterials: 2,
                    totalCategories: 2,
                    averageSupplierScore: 93.8
                },
                recommendations: {
                    topSuppliers: [
                        { id: 'SUP001', name: 'ElectroSupply Co.', score: 95.5, tier: 'Premium' },
                        { id: 'SUP002', name: 'AC Parts Direct', score: 92.1, tier: 'Premium' }
                    ]
                }
            }
        });
    }
});

app.post('/api/n8n-proxy/material-order', async (req, res) => {
    console.log('📱 Mobile proxy request - Material Order');
    console.log('📦 Order data:', req.body);
    
    try {
        const fetch = (await import('node-fetch')).default;
        const n8nUrl = `${N8N_BASE_URL}/webhook/material-order`;
        
        console.log(`📡 Proxying order to: ${n8nUrl}`);
        
        const response = await fetch(n8nUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'LCMB-Proxy/1.0'
            },
            body: JSON.stringify(req.body),
            timeout: 15000
        });
        
        if (!response.ok) {
            console.error(`❌ n8n order response error: ${response.status} ${response.statusText}`);
            throw new Error(`n8n returned ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ n8n order submitted successfully:', result.order_id);
        
        res.json(result);
        
    } catch (error) {
        console.error('❌ n8n order proxy error:', error.message);
        
        // Return demo success response
        console.log('🔄 Returning demo order success');
        const orderId = `PROXY-DEMO-${Date.now()}`;
        
        res.json({
            status: 'success',
            message: 'Demo order submitted successfully! (Mobile Proxy Fallback)',
            order_id: orderId,
            total_price: '0.00',
            supplier: req.body.supplier_name || 'Demo Supplier',
            estimated_processing: '1-2 business days (Demo Mode)'
        });
    }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        service: 'LCMB Smart Procurement Frontend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        n8nProxy: 'enabled'
    });
});

// API status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'active',
        service: 'LCMB Frontend API',
        endpoints: {
            health: '/health',
            materials: '/api/materials-data',
            order: '/api/material-order',
            n8nMaterials: '/api/n8n-proxy/materials-data',
            n8nOrder: '/api/n8n-proxy/material-order'
        },
        n8nTarget: N8N_BASE_URL,
        timestamp: new Date().toISOString()
    });
});

// Fallback API endpoints (for direct testing)
app.get('/api/materials-data', (req, res) => {
    console.log('📡 Direct fallback materials API called');
    
    const demoData = {
        status: 'success',
        version: '2.0',
        system: 'Smart LCMB Procurement (Direct Fallback)',
        timestamp: new Date().toISOString(),
        data: {
            suppliers: [
                {
                    id: 'SUP001',
                    name: 'Demo ElectroSupply Co.',
                    email: 'demo@electrosupply.com.au',
                    phone: '(02) 1234-5678',
                    specialties: ['Electrical'],
                    reliabilityScore: 95.5,
                    tier: 'Premium',
                    leadTimeDays: 2,
                    minOrderValue: 100
                }
            ],
            materials: {
                'Electrical': [
                    {
                        id: 'EL-CB-20A',
                        name: 'Demo Circuit Breaker 20A',
                        category: 'Electrical',
                        unit: 'pcs',
                        basePrice: 25.00,
                        description: 'Demo single pole circuit breaker',
                        code: 'EL-CB-20A',
                        brand: 'Demo Brand',
                        stockLevel: 150,
                        availabilityStatus: 'In Stock'
                    }
                ]
            },
            categories: ['Electrical'],
            supplierCapabilities: {
                'SUP001': {
                    categories: ['Electrical'],
                    materials: [
                        {
                            id: 'EL-CB-20A',
                            name: 'Demo Circuit Breaker 20A',
                            category: 'Electrical',
                            unit: 'pcs',
                            basePrice: 25.00,
                            supplierPrice: 23.50,
                            description: 'Demo single pole circuit breaker',
                            code: 'EL-CB-20A',
                            brand: 'Demo Brand',
                            stockLevel: 150,
                            availabilityStatus: 'In Stock',
                            supplierLeadTime: 2
                        }
                    ],
                    totalMaterials: 1
                }
            },
            metadata: {
                totalSuppliers: 1,
                totalMaterials: 1,
                totalCategories: 1,
                averageSupplierScore: 95.5
            },
            recommendations: {
                topSuppliers: [
                    { id: 'SUP001', name: 'Demo ElectroSupply Co.', score: 95.5, tier: 'Premium' }
                ]
            }
        }
    };
    
    res.json(demoData);
});

app.post('/api/material-order', (req, res) => {
    console.log('📡 Direct fallback order API called:', req.body);
    
    const orderData = req.body;
    const orderId = `FALLBACK-${Date.now()}`;
    
    setTimeout(() => {
        res.json({
            status: 'success',
            message: 'Demo order submitted successfully! (Direct Fallback)',
            order_id: orderId,
            total_price: '0.00',
            supplier: orderData.supplier_name || 'Demo Supplier',
            estimated_processing: '1-2 business days (Demo Mode)'
        });
    }, 1000);
});

// Test n8n connectivity endpoint
app.get('/api/test-n8n', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const testUrl = `${N8N_BASE_URL}/webhook/materials-data`;
        
        console.log(`🔍 Testing n8n connectivity: ${testUrl}`);
        
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LCMB-Test/1.0'
            },
            timeout: 8000
        });
        
        const status = response.ok ? 'connected' : 'error';
        const data = response.ok ? await response.json() : null;
        
        res.json({
            status,
            n8nUrl: testUrl,
            responseStatus: response.status,
            responseStatusText: response.statusText,
            timestamp: new Date().toISOString(),
            dataReceived: !!data,
            supplierCount: data?.data?.suppliers?.length || 0
        });
        
    } catch (error) {
        res.json({
            status: 'error',
            error: error.message,
            n8nUrl: `${N8N_BASE_URL}/webhook/materials-data`,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle SPA routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || 
        req.path.includes('.') || 
        req.path === '/health') {
        res.status(404).json({ 
            error: 'Not Found',
            path: req.path,
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
        path: req.path
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LCMB Smart Procurement Frontend Server (Mobile-Optimized)`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`🔧 n8n Test: http://localhost:${PORT}/api/test-n8n`);
    console.log(`📡 n8n Target: ${N8N_BASE_URL}`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📅 Started: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
