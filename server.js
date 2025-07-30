const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS for all origins and methods
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
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
    console.log(`${timestamp} - ${req.method} ${req.url} - ${req.ip}`);
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
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
        }
    }
}));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK',
        service: 'LCMB Smart Procurement Frontend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
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
            order: '/api/material-order'
        },
        timestamp: new Date().toISOString()
    });
});

// Fallback API endpoints (for demo/testing when n8n is not available)
app.get('/api/materials-data', (req, res) => {
    console.log('📡 Fallback materials API called');
    
    // Return demo data structure matching your n8n workflow
    const demoData = {
        status: 'success',
        version: '2.0',
        system: 'Smart LCMB Procurement (Fallback API)',
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
                    materials: [
                        {
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
                        }
                    ],
                    totalMaterials: 1
                },
                'SUP002': {
                    categories: ['AC Install'],
                    materials: [
                        {
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
                        }
                    ],
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
    };
    
    res.json(demoData);
});

app.post('/api/material-order', (req, res) => {
    console.log('📡 Fallback order API called:', req.body);
    
    // Simulate order processing
    const orderData = req.body;
    const orderId = `DEMO-${Date.now()}`;
    
    setTimeout(() => {
        res.json({
            status: 'success',
            message: 'Demo order submitted successfully! (Fallback API)',
            order_id: orderId,
            total_price: '0.00',
            supplier: orderData.supplier_name || 'Demo Supplier',
            estimated_processing: '1-2 business days (Demo Mode)'
        });
    }, 1500); // Simulate processing delay
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle SPA routing - serve index.html for all unmatched routes
app.get('*', (req, res) => {
    // Don't serve index.html for API routes or static files
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
    console.log(`🚀 LCMB Smart Procurement Frontend Server`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
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
