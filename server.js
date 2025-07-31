// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Webhook URLs
const WEBHOOKS = {
  DATA_LOAD: 'https://primary-s0q-production.up.railway.app/webhook/data/load',
  ORDER_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/order/submit',
  QUOTE_SUBMIT: 'https://primary-s0q-production.up.railway.app/webhook/quote/submit'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Routes - Direct webhook calls
app.get('/api/data/load', async (req, res) => {
  try {
    console.log('🔄 Loading data from webhook...');
    const response = await axios.get(WEBHOOKS.DATA_LOAD);
    console.log('✅ Data loaded successfully');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error loading data:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/order/submit', async (req, res) => {
  try {
    console.log('🔄 Submitting order to webhook...');
    console.log('📦 Order data:', req.body);
    const response = await axios.post(WEBHOOKS.ORDER_SUBMIT, req.body);
    console.log('✅ Order submitted successfully');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error submitting order:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/quote/submit', async (req, res) => {
  try {
    console.log('🔄 Submitting quote to webhook...');
    console.log('💬 Quote data:', req.body);
    const response = await axios.post(WEBHOOKS.QUOTE_SUBMIT, req.body);
    console.log('✅ Quote submitted successfully');
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error submitting quote:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    webhooks: WEBHOOKS,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('🚀 LCMB Material Management Server Started');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log('🔗 Webhook URLs:');
  console.log(`   📊 Data Load: ${WEBHOOKS.DATA_LOAD}`);
  console.log(`   📦 Order Submit: ${WEBHOOKS.ORDER_SUBMIT}`);
  console.log(`   💬 Quote Submit: ${WEBHOOKS.QUOTE_SUBMIT}`);
});
