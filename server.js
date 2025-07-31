const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Generate version timestamp for cache busting
const VERSION = Date.now();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
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

// Cache control for static files
app.use('/static', express.static('.', {
    maxAge: '1y', // Cache static files for 1 year
    etag: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// No cache for HTML files and API endpoints
app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/' || req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Health check for Railway
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        service: 'LCMB Smart Procurement',
        version: VERSION,
        timestamp: new Date().toISOString()
    });
});

// Serve main app with version-busted assets
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    
    fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Server Error');
        }
        
        // Inject version into script and style tags for cache busting
        const versionedData = data
            .replace(/script\.js/g, `script.js?v=${VERSION}`)
            .replace(/style\.css/g, `style.css?v=${VERSION}`)
            .replace(/<head>/i, `<head>\n    <meta name="cache-version" content="${VERSION}">`);
        
        res.setHeader('Content-Type', 'text/html');
        res.send(versionedData);
    });
});

// Serve JavaScript with version check
app.get('/script.js', (req, res) => {
    const scriptPath = path.join(__dirname, 'script.js');
    
    fs.readFile(scriptPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading script.js:', err);
            return res.status(500).send('// Script loading error');
        }
        
        // Add version check at the top of the script
        const versionCheck = `
// LCMB Frontend Version: ${VERSION}
console.log('🚀 LCMB Frontend Version: ${VERSION}');
console.log('📅 Build Time: ${new Date(VERSION).toLocaleString()}');

// Force reload if cached version is older
const CURRENT_VERSION = ${VERSION};
const cachedVersion = localStorage.getItem('lcmb_version');
if (cachedVersion && parseInt(cachedVersion) < CURRENT_VERSION) {
    console.log('🔄 New version detected, clearing cache...');
    localStorage.clear();
    sessionStorage.clear();
    if ('caches' in window) {
        caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
}
localStorage.setItem('lcmb_version', CURRENT_VERSION.toString());

`;
        
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(versionCheck + data);
    });
});

// Serve CSS with version
app.get('/style.css', (req, res) => {
    const cssPath = path.join(__dirname, 'style.css');
    
    fs.readFile(cssPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading style.css:', err);
            return res.status(500).send('/* CSS loading error */');
        }
        
        const versionComment = `/* LCMB Styles Version: ${VERSION} - ${new Date(VERSION).toLocaleString()} */\n`;
        
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(versionComment + data);
    });
});

// Handle all other routes (SPA)
app.get('*', (req, res) => {
    res.redirect('/');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LCMB Frontend Server - Cache-Busted Version ${VERSION}`);
    console.log(`📱 URL: http://localhost:${PORT}`);
    console.log(`✅ Health: http://localhost:${PORT}/health`);
    console.log(`🔄 Version: ${new Date(VERSION).toLocaleString()}`);
});
