const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    next();
});

// Serve static files from current directory
app.use(express.static('.', {
    maxAge: '1d', // Cache static files for 1 day
    etag: true
}));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'LCMB Smart Procurement Frontend',
        version: '1.0.0'
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LCMB Smart Procurement Frontend running on port ${PORT}`);
    console.log(`📱 Access at: http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
});
