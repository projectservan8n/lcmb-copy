// 🧠 SMART LCMB PROCUREMENT FRONTEND - MOBILE FIXED VERSION
// Solution: Use server proxy to avoid CORS issues on mobile

// Mobile-friendly API configuration
const API_CONFIG = {
    // Use relative URLs to proxy through our server (mobile-friendly)
    proxy: {
        materials: '/api/n8n-proxy/materials-data',
        order: '/api/n8n-proxy/material-order'
    },
    // Direct n8n URLs (desktop fallback)
    direct: {
        materials: 'https://primary-s0q-production.up.railway.app/webhook/materials-data',
        order: 'https://primary-s0q-production.up.railway.app/webhook/material-order'
    },
    // Demo fallback
    demo: {
        materials: '/api/materials-data',
        order: '/api/material-order'
    }
};

// Detect if we're on mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const preferProxy = isMobile || window.location.protocol === 'https:';

console.log('📱 Device Detection:', {
    isMobile,
    userAgent: navigator.userAgent,
    protocol: window.location.protocol,
    preferProxy
});

// Choose endpoints based on device
const ENDPOINTS = preferProxy ? API_CONFIG.proxy : API_CONFIG.direct;

console.log('🚀 LCMB System Config:', {
    endpoints: ENDPOINTS,
    strategy: preferProxy ? 'proxy' : 'direct'
});

// Global State
let smartData = null;
let selectedSupplier = null;
let selectedCategory = null;
let selectedMaterials = [];
let currentStep = 1;

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const appContainer = document.getElementById('appContainer');
const supplierGrid = document.getElementById('supplierGrid');
const categoryGrid = document.getElementById('categoryGrid');
const materialGrid = document.getElementById('materialGrid');
const orderSummary = document.getElementById('orderSummary');
const summaryItems = document.getElementById('summaryItems');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');
const form = document.getElementById('smartOrderForm');

// Category Icons
const categoryIcons = {
    'AC Install': '❄️',
    'AC Service': '🔧', 
    'Electrical': '⚡',
    'Factory Stock': '📦',
    'default': '📋'
};

// Initialize Smart System with Mobile Support
async function initializeSmartSystem() {
    const startTime = Date.now();
    
    try {
        console.log('🚀 Starting Smart Procurement System...');
        updateLoadingText('Connecting to backend...');
        
        // Try multiple connection strategies
        const strategies = [
            { name: 'Proxy API', endpoints: API_CONFIG.proxy },
            { name: 'Direct n8n', endpoints: API_CONFIG.direct },
            { name: 'Demo Fallback', endpoints: API_CONFIG.demo }
        ];
        
        let connected = false;
        let lastError = null;
        
        for (const strategy of strategies) {
            try {
                console.log(`📡 Trying ${strategy.name}...`);
                updateLoadingText(`Trying ${strategy.name}...`);
                
                const response = await fetchWithTimeout(strategy.endpoints.materials, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                }, 8000); // 8 second timeout
                
                console.log(`✅ ${strategy.name} response:`, response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                smartData = await response.json();
                console.log(`🎯 ${strategy.name} data loaded:`, smartData);
                
                // Validate data structure
                if (smartData && smartData.status === 'success' && smartData.data) {
                    connected = true;
                    updateLoadingText('Processing data...');
                    break;
                } else {
                    throw new Error('Invalid data structure received');
                }
                
            } catch (error) {
                console.warn(`❌ ${strategy.name} failed:`, error.message);
                lastError = error;
                continue;
            }
        }
        
        // If no strategy worked, use demo data
        if (!connected) {
            console.log('🔄 All strategies failed, loading demo data...');
            updateLoadingText('Loading demo data...');
            await loadDemoData();
        }
        
        // Ensure we have valid data
        if (!smartData || !smartData.data) {
            throw new Error('No valid data available');
        }
        
        updateLoadingText('Setting up interface...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update system status
        updateSystemStatus();
        updateRecommendations();
        
        // Populate suppliers
        populateSuppliers();
        
        // Hide loading and show app
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        const loadTime = Date.now() - startTime;
        const statusMessage = connected 
            ? `✅ Smart Procurement System Ready! Connected via ${strategies.find(s => connected)?.name || 'API'}. (${loadTime}ms)`
            : `⚠️ Demo Mode Active: Using sample data. All features work except live orders. (${loadTime}ms)`;
        
        showMessage('success', statusMessage + ' Select a supplier to begin.');
        
    } catch (error) {
        console.error('❌ Critical Initialization Error:', error);
        
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('error', `❌ System Error: ${error.message}. Please refresh the page or contact support.`);
    }
}

// Fetch with timeout for mobile reliability
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - connection too slow');
        }
        throw error;
    }
}

// Load demo data with mobile optimization
async function loadDemoData() {
    smartData = {
        status: 'success',
        version: '2.0',
        system: 'Smart LCMB Procurement (Demo)',
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
                },
                {
                    id: 'SUP003',
                    name: 'Trade Materials Plus', 
                    email: 'sales@tradematerials.com.au',
                    phone: '(02) 5555-1234',
                    specialties: ['Electrical', 'Factory Stock'],
                    reliabilityScore: 87.8,
                    tier: 'Standard',
                    leadTimeDays: 3,
                    minOrderValue: 50
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
                    },
                    {
                        id: 'EL-WIRE-25MM',
                        name: 'Electrical Wire 2.5mm Twin & Earth',
                        category: 'Electrical', 
                        unit: 'meters',
                        basePrice: 3.50,
                        description: 'Twin and earth cable 2.5mm² copper',
                        code: 'EL-WIRE-25MM',
                        brand: 'Olex',
                        stockLevel: 500,
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
                ],
                'AC Service': [
                    {
                        id: 'AC-R410A',
                        name: 'R410A Refrigerant Gas',
                        category: 'AC Service',
                        unit: 'kg',
                        basePrice: 28.00,
                        description: 'Eco-friendly R410A refrigerant gas',
                        code: 'AC-R410A',
                        brand: 'Chemours',
                        stockLevel: 12,
                        availabilityStatus: 'Low Stock'
                    }
                ],
                'Factory Stock': [
                    {
                        id: 'FS-HAT-WHT',
                        name: 'Safety Helmet White',
                        category: 'Factory Stock',
                        unit: 'pcs',
                        basePrice: 18.00,
                        description: 'Hard hat safety helmet white ANSI approved',
                        code: 'FS-HAT-WHT',
                        brand: 'ProSafe',
                        stockLevel: 200,
                        availabilityStatus: 'In Stock'
                    }
                ]
            },
            categories: ['Electrical', 'AC Install', 'AC Service', 'Factory Stock'],
            supplierCapabilities: {},
            metadata: {
                totalSuppliers: 3,
                totalMaterials: 5,
                totalCategories: 4,
                averageSupplierScore: 91.8
            },
            recommendations: {
                topSuppliers: [
                    { id: 'SUP001', name: 'ElectroSupply Co.', score: 95.5, tier: 'Premium' },
                    { id: 'SUP002', name: 'AC Parts Direct', score: 92.1, tier: 'Premium' }
                ]
            }
        }
    };
    
    // Build supplier capabilities
    Object.keys(smartData.data.materials).forEach(category => {
        const materials = smartData.data.materials[category];
        
        smartData.data.suppliers.forEach(supplier => {
            if (supplier.specialties.includes(category)) {
                if (!smartData.data.supplierCapabilities[supplier.id]) {
                    smartData.data.supplierCapabilities[supplier.id] = {
                        categories: [],
                        materials: [],
                        totalMaterials: 0
                    };
                }
                
                const capabilities = smartData.data.supplierCapabilities[supplier.id];
                
                if (!capabilities.categories.includes(category)) {
                    capabilities.categories.push(category);
                }
                
                capabilities.materials = capabilities.materials.concat(
                    materials.map(material => ({
                        ...material,
                        supplierPrice: material.basePrice * (0.85 + Math.random() * 0.15),
                        supplierLeadTime: supplier.leadTimeDays
                    }))
                );
                capabilities.totalMaterials = capabilities.materials.length;
            }
        });
    });
    
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('📋 Demo data loaded successfully');
}

// Update loading text
function updateLoadingText(text) {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

// Update System Status
function updateSystemStatus() {
    if (!smartData?.data?.metadata) return;
    
    const data = smartData.data;
    document.getElementById('supplierCount').textContent = data.metadata.totalSuppliers;
    document.getElementById('materialCount').textContent = data.metadata.totalMaterials;
    document.getElementById('categoryCount').textContent = data.metadata.totalCategories;
}

// Update Recommendations
function updateRecommendations() {
    const recommendations = document.getElementById('recommendations');
    const topSupplier = smartData?.data?.recommendations?.topSuppliers?.[0];
    
    if (topSupplier) {
        recommendations.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">⭐</div>
                <div class="stat-label">Top: ${topSupplier.name}</div>
            </div>
        `;
    }
}

// Populate Suppliers
function populateSuppliers() {
    if (!smartData?.data?.suppliers) {
        supplierGrid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No suppliers available</p>';
        return;
    }
    
    const suppliers = smartData.data.suppliers;
    supplierGrid.innerHTML = '';

    suppliers.forEach(supplier => {
        const capabilities = smartData.data.supplierCapabilities?.[supplier.id] || { categories: [], totalMaterials: 0 };
        const card = document.createElement('div');
        card.className = 'smart-card supplier-card';
        card.innerHTML = `
            <div class="supplier-tier tier-${supplier.tier.toLowerCase()}">${supplier.tier}</div>
            <div class="supplier-header">
                <div class="supplier-avatar">${supplier.name.charAt(0)}</div>
                <div class="supplier-info">
                    <h3>${supplier.name}</h3>
                    <div class="supplier-email">${supplier.email}</div>
                </div>
            </div>
            <div class="supplier-stats">
                <div class="stat-item">
                    <div class="stat-value">${capabilities.categories.length}</div>
                    <div class="stat-label">Categories</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${capabilities.totalMaterials}</div>
                    <div class="stat-label">Materials</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${supplier.reliabilityScore.toFixed(0)}%</div>
                    <div class="stat-label">Rating</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${supplier.leadTimeDays}d</div>
                    <div class="stat-label">Lead Time</div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => selectSupplier(supplier.id, card));
        supplierGrid.appendChild(card);
    });
}

// Select Supplier
function selectSupplier(supplierId, cardElement) {
    document.querySelectorAll('.supplier-card').forEach(card => 
        card.classList.remove('selected'));
    
    cardElement.classList.add('selected');
    selectedSupplier = supplierId;
    
    populateCategories(supplierId);
    activateStep(2);
    
    console.log('✅ Supplier selected:', supplierId);
}

// Populate Categories
function populateCategories(supplierId) {
    const capabilities = smartData.data.supplierCapabilities?.[supplierId];
    const categories = capabilities?.categories || [];
    
    categoryGrid.innerHTML = '';

    if (categories.length === 0) {
        categoryGrid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No categories available for this supplier</p>';
        return;
    }

    categories.forEach(categoryName => {
        const materialsInCategory = capabilities.materials?.filter(m => m.category === categoryName) || [];
        const card = document.createElement('div');
        card.className = 'smart-card category-card';
        card.innerHTML = `
            <div class="category-icon">${categoryIcons[categoryName] || categoryIcons.default}</div>
            <div class="category-name">${categoryName}</div>
            <div class="category-meta">${materialsInCategory.length} materials available</div>
        `;

        card.addEventListener('click', () => selectCategory(categoryName, card));
        categoryGrid.appendChild(card);
    });
}

// Select Category
function selectCategory(categoryName, cardElement) {
    document.querySelectorAll('.category-card').forEach(card => 
        card.classList.remove('selected'));
    
    cardElement.classList.add('selected');
    selectedCategory = categoryName;
    
    populateMaterials(selectedSupplier, categoryName);
    activateStep(3);
    
    console.log('✅ Category selected:', categoryName);
}

// Populate Materials
function populateMaterials(supplierId, categoryName) {
    const capabilities = smartData.data.supplierCapabilities?.[supplierId];
    let materials = [];
    
    if (capabilities && capabilities.materials) {
        materials = capabilities.materials.filter(m => m.category === categoryName);
    } else {
        materials = smartData.data.materials?.[categoryName] || [];
        materials = materials.map(material => ({
            ...material,
            supplierPrice: material.basePrice * (0.85 + Math.random() * 0.15)
        }));
    }
    
    materialGrid.innerHTML = '';
    selectedMaterials = [];

    if (materials.length === 0) {
        materialGrid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No materials available in this category</p>';
        return;
    }

    materials.forEach((material, index) => {
        const card = document.createElement('div');
        card.className = 'smart-card material-card';
        card.innerHTML = `
            <div class="material-header">
                <input type="checkbox" class="material-checkbox" data-index="${index}">
                <div class="material-info">
                    <div class="material-name">${material.name}</div>
                    <div class="material-price">$${(material.supplierPrice || material.basePrice).toFixed(2)}/${material.unit}</div>
                </div>
            </div>
            <div class="material-description">${material.description || 'No description available'}</div>
            <div class="material-meta">
                <span class="meta-tag tag-code">${material.code}</span>
                <span class="meta-tag ${material.stockLevel > 50 ? 'tag-stock' : 'tag-low-stock'}">
                    ${material.availabilityStatus}
                </span>
            </div>
            <div class="quantity-controls">
                <button type="button" class="qty-btn" data-action="decrease">−</button>
                <input type="number" class="qty-input" min="1" value="1" data-index="${index}">
                <button type="button" class="qty-btn" data-action="increase">+</button>
                <span class="subtotal">$${(material.supplierPrice || material.basePrice).toFixed(2)}</span>
            </div>
        `;

        setupMaterialCard(card, material, index);
        materialGrid.appendChild(card);
    });
}

// Setup Material Card Events
function setupMaterialCard(card, material, index) {
    const checkbox = card.querySelector('.material-checkbox');
    const quantityControls = card.querySelector('.quantity-controls');
    const quantityInput = card.querySelector('.qty-input');
    const subtotalSpan = card.querySelector('.subtotal');
    const decreaseBtn = card.querySelector('[data-action="decrease"]');
    const increaseBtn = card.querySelector('[data-action="increase"]');

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            card.classList.add('selected');
            quantityControls.classList.add('visible');
            addMaterial(material, index, 1);
        } else {
            card.classList.remove('selected');
            quantityControls.classList.remove('visible');
            removeMaterial(index);
        }
    });

    quantityInput.addEventListener('input', function() {
        const quantity = parseInt(this.value) || 1;
        const price = material.supplierPrice || material.basePrice;
        const subtotal = price * quantity;
        subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
        updateMaterialQuantity(index, quantity);
    });

    decreaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value) || 1;
        if (quantity > 1) {
            quantity--;
            quantityInput.value = quantity;
            quantityInput.dispatchEvent(new Event('input'));
        }
    });

    increaseBtn.addEventListener('click', function() {
        let quantity = parseInt(quantityInput.value) || 1;
        quantity++;
        quantityInput.value = quantity;
        quantityInput.dispatchEvent(new Event('input'));
    });
}

// Add Material to Selection
function addMaterial(material, index, quantity) {
    selectedMaterials.push({
        ...material,
        index: index,
        quantity: quantity,
        finalPrice: material.supplierPrice || material.basePrice
    });
    updateOrderSummary();
    activateStep(4);
}

// Remove Material from Selection
function removeMaterial(index) {
    selectedMaterials = selectedMaterials.filter(item => item.index !== index);
    updateOrderSummary();
    
    if (selectedMaterials.length === 0) {
        orderSummary.classList.remove('visible');
        deactivateStep(4);
    }
}

// Update Material Quantity
function updateMaterialQuantity(index, quantity) {
    const material = selectedMaterials.find(item => item.index === index);
    if (material) {
        material.quantity = quantity;
        updateOrderSummary();
    }
}

// Update Order Summary
function updateOrderSummary() {
    if (selectedMaterials.length === 0) {
        orderSummary.classList.remove('visible');
        return;
    }

    orderSummary.classList.add('visible');

    summaryItems.innerHTML = selectedMaterials.map(item => `
        <div class="summary-item">
            <div>
                <div>${item.name}</div>
                <div class="item-details">${item.quantity} ${item.unit} × $${item.finalPrice.toFixed(2)}</div>
            </div>
            <div class="item-price">$${(item.quantity * item.finalPrice).toFixed(2)}</div>
        </div>
    `).join('');

    const totalItems = selectedMaterials.length;
    const totalQuantity = selectedMaterials.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.finalPrice), 0);

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

// Activate Workflow Step
function activateStep(stepNumber) {
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        const stepIcon = step.querySelector('.step-number');
        
        if (i < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
            stepIcon.classList.add('completed');
            stepIcon.innerHTML = '✓';
        } else if (i === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
            stepIcon.classList.remove('completed');
            stepIcon.innerHTML = i;
        } else {
            step.classList.remove('active', 'completed');
            stepIcon.classList.remove('completed');
            stepIcon.innerHTML = i;
        }
    }
    currentStep = stepNumber;
}

// Deactivate Step
function deactivateStep(stepNumber) {
    const step = document.getElementById(`step${stepNumber}`);
    step.classList.remove('active');
    currentStep = Math.max(1, stepNumber - 1);
}

// Handle Form Submission with Mobile-Friendly Error Handling
async function handleSubmission(e) {
    e.preventDefault();
    
    hideMessages();
    setLoading(true);
    
    try {
        // Validate selections
        if (!selectedSupplier) throw new Error('Please select a supplier');
        if (!selectedCategory) throw new Error('Please select a category');
        if (selectedMaterials.length === 0) throw new Error('Please select at least one material');
        
        const formData = new FormData(form);
        const supplier = smartData.data.suppliers.find(s => s.id === selectedSupplier);
        
        if (!supplier) throw new Error('Selected supplier not found');
        
        // Build order data
        const orderData = {
            category: selectedCategory,
            materials: selectedMaterials.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                price: item.finalPrice,
                code: item.code || item.id
            })),
            supplier_name: supplier.name,
            supplier_email: supplier.email,
            user_name: formData.get('user_name'),
            user_email: formData.get('user_email'),
            urgency: formData.get('urgency') || 'Normal',
            project_ref: formData.get('project_ref') || '',
            notes: formData.get('notes') || ''
        };

        console.log('🚀 Submitting Smart Order:', orderData);

        const response = await fetchWithTimeout(ENDPOINTS.order, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        }, 15000); // 15 second timeout for orders

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Order submission error:', errorText);
            throw new Error(`Submission failed (${response.status}): ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Order result:', result);
        
        if (result.status === 'success') {
            const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.finalPrice), 0);
            showMessage('success', `🎉 Smart Order Submitted Successfully!
            
<strong>Order ID:</strong> ${result.order_id}<br>
<strong>Supplier:</strong> ${supplier.name}<br>
<strong>Category:</strong> ${selectedCategory}<br>
<strong>Total:</strong> $${totalPrice.toFixed(2)}<br>
<strong>Processing Time:</strong> ${result.estimated_processing}
            
✅ Order saved to Google Sheets<br>
📧 Emails sent to supplier and requestor`);
            
            setTimeout(() => resetForm(), 5000);
        } else {
            throw new Error(result.message || 'Order submission failed');
        }
        
    } catch (error) {
        console.error('❌ Submission Error:', error);
        
        // More user-friendly error messages for mobile
        let userMessage = error.message;
        if (error.message.includes('timeout')) {
            userMessage = 'Connection timeout - please check your internet and try again';
        } else if (error.message.includes('Failed to fetch')) {
            userMessage = 'Network error - please check your connection and try again';
        }
        
        showMessage('error', `Failed to submit order: ${userMessage}`);
    } finally {
        setLoading(false);
    }
}

// Reset Form
function resetForm() {
    form.reset();
    selectedSupplier = null;
    selectedCategory = null;
    selectedMaterials = [];
    
    document.querySelectorAll('.smart-card').forEach(card => 
        card.classList.remove('selected'));
    
    activateStep(1);
    
    categoryGrid.innerHTML = '';
    materialGrid.innerHTML = '';
    orderSummary.classList.remove('visible');
    
    hideMessages();
}

// Utility Functions
function showMessage(type, message) {
    hideMessages();
    const messageEl = type === 'success' ? successMessage : errorMessage;
    messageEl.innerHTML = message.replace(/\n/g, '<br>');
    messageEl.style.display = 'block';
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (type === 'success') {
        setTimeout(() => {
            if (messageEl.style.display === 'block') {
                messageEl.style.display = 'none';
            }
        }, 15000);
    }
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? '⏳ Processing Order...' : '🚀 Submit Smart Order';
}

// Event Listeners
form.addEventListener('submit', handleSubmission);

// Initialize with mobile-optimized timing
document.addEventListener('DOMContentLoaded', () => {
    // Faster initialization on mobile
    const delay = isMobile ? 300 : 600;
    setTimeout(initializeSmartSystem, delay);
});

// Debug helper
window.debugLCMB = {
    get smartData() { return smartData; },
    get selectedSupplier() { return selectedSupplier; },
    get selectedCategory() { return selectedCategory; },
    get selectedMaterials() { return selectedMaterials; },
    get config() { return { ENDPOINTS, isMobile, preferProxy }; },
    resetForm,
    showMessage,
    loadDemoData,
    testConnection: async () => {
        console.log('🔍 Testing all connection methods...');
        for (const [name, endpoints] of Object.entries(API_CONFIG)) {
            try {
                const response = await fetchWithTimeout(endpoints.materials, {}, 5000);
                console.log(`✅ ${name}:`, response.status);
            } catch (error) {
                console.log(`❌ ${name}:`, error.message);
            }
        }
    }
};

console.log('🎯 LCMB Smart Procurement System Loaded - Mobile Optimized');
