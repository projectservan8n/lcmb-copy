const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

// Serve static files with cache-busting headers
app.use(express.static('.', {
    maxAge: 0, // No caching during development
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
        // Disable all caching for development
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Add version header for debugging
        res.setHeader('X-App-Version', Date.now().toString());
    }
}));

// Health check for Railway
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        service: 'LCMB Smart Procurement',
        timestamp: new Date().toISOString(),
        version: Date.now(),
        caching: 'disabled'
    });
});

// Force refresh endpoint (for testing deployments)
app.get('/refresh', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.redirect('/');
});

// Version check endpoint
app.get('/version', (req, res) => {
    res.json({
        version: Date.now(),
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LCMB Frontend Server - Simple Direct Mode`);
    console.log(`📱 URL: http://localhost:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
});
