// 🧠 SMART LCMB PROCUREMENT FRONTEND
// ✅ Using your existing correct webhook URLs
const MATERIALS_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/materials-data';
const ORDER_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/material-order';

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

// Initialize App
async function initializeSmartSystem() {
    try {
        showMessage('info', 'Loading smart procurement data...');
        
        console.log('🔗 Connecting to:', MATERIALS_ENDPOINT);
        
        const response = await fetch(MATERIALS_ENDPOINT, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        smartData = await response.json();
        console.log('🚀 Smart Data Loaded:', smartData);

        if (smartData.status !== 'success') {
            throw new Error(smartData.error?.message || 'Failed to load data');
        }

        // Validate data structure
        if (!smartData.data || !smartData.data.suppliers || !smartData.data.materials) {
            console.warn('⚠️ Incomplete data structure, using fallback');
            useFallbackData();
        }

        // Update system status
        updateSystemStatus();
        updateRecommendations();
        
        // Populate suppliers
        populateSuppliers();
        
        // Hide loading and show app
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        hideMessages();
        showMessage('success', '✅ Smart Procurement System Ready!');
        
    } catch (error) {
        console.error('❌ Initialization Error:', error);
        
        // Use fallback data for demo
        console.log('🔄 Loading fallback data...');
        useFallbackData();
        
        // Still show the app
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('error', `⚠️ Using demo data: ${error.message}`);
    }
}

// Fallback Data for Demo/Testing
function useFallbackData() {
    smartData = {
        status: 'success',
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
            supplierCapabilities: {
                'SUP001': {
                    categories: ['Electrical', 'AC Install'],
                    materials: [
                        {
                            id: 'EL-CB-20A',
                            name: 'Circuit Breaker 20A',
                            category: 'Electrical',
                            unit: 'pcs',
                            basePrice: 25.00,
                            supplierPrice: 23.50,
                            description: 'Single pole circuit breaker',
                            code: 'EL-CB-20A',
                            stockLevel: 150,
                            availabilityStatus: 'In Stock'
                        },
                        {
                            id: 'AC-WMB-HD',
                            name: 'Wall Mounting Bracket Heavy Duty',
                            category: 'AC Install',
                            unit: 'pcs',
                            basePrice: 45.00,
                            supplierPrice: 42.75,
                            description: 'Heavy duty wall mount',
                            code: 'AC-WMB-HD',
                            stockLevel: 75,
                            availabilityStatus: 'In Stock'
                        }
                    ],
                    totalMaterials: 2
                },
                'SUP002': {
                    categories: ['AC Install', 'AC Service'],
                    materials: [
                        {
                            id: 'AC-SS-25',
                            name: 'Split System Unit 2.5kW',
                            category: 'AC Install',
                            unit: 'pcs',
                            basePrice: 899.00,
                            supplierPrice: 849.00,
                            description: 'Energy efficient cooling unit',
                            code: 'AC-SS-25',
                            stockLevel: 25,
                            availabilityStatus: 'In Stock'
                        },
                        {
                            id: 'AC-R410A',
                            name: 'R410A Refrigerant Gas',
                            category: 'AC Service',
                            unit: 'kg',
                            basePrice: 28.00,
                            supplierPrice: 26.50,
                            description: 'Eco-friendly refrigerant',
                            code: 'AC-R410A',
                            stockLevel: 12,
                            availabilityStatus: 'Low Stock'
                        }
                    ],
                    totalMaterials: 2
                },
                'SUP003': {
                    categories: ['Electrical', 'Factory Stock'],
                    materials: [
                        {
                            id: 'FS-HAT-WHT',
                            name: 'Safety Helmet White',
                            category: 'Factory Stock',
                            unit: 'pcs',
                            basePrice: 18.00,
                            supplierPrice: 16.20,
                            description: 'Hard hat safety helmet',
                            code: 'FS-HAT-WHT',
                            stockLevel: 200,
                            availabilityStatus: 'In Stock'
                        }
                    ],
                    totalMaterials: 1
                }
            },
            metadata: {
                totalSuppliers: 3,
                totalMaterials: 5,
                totalCategories: 4,
                averageSupplierScore: 91.8
            },
            recommendations: {
                topSuppliers: [
                    { id: 'SUP001', name: 'ElectroSupply Co.', score: 95.5, tier: 'Premium' }
                ]
            }
        }
    };
    
    console.log('📋 Fallback data loaded');
}

// Update System Status
function updateSystemStatus() {
    const data = smartData.data;
    document.getElementById('supplierCount').textContent = data.metadata.totalSuppliers;
    document.getElementById('materialCount').textContent = data.metadata.totalMaterials;  
    document.getElementById('categoryCount').textContent = data.metadata.totalCategories;
}

// Update Recommendations
function updateRecommendations() {
    const recommendations = document.getElementById('recommendations');
    const topSupplier = smartData.data.recommendations.topSuppliers[0];
    
    if (topSupplier) {
        recommendations.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">⭐</div>
                <div class="stat-label">Top Rated: ${topSupplier.name}</div>
            </div>
        `;
    }
}

// Populate Suppliers
function populateSuppliers() {
    const suppliers = smartData.data.suppliers;
    supplierGrid.innerHTML = '';

    suppliers.forEach(supplier => {
        const capabilities = smartData.data.supplierCapabilities[supplier.id];
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
                    <div class="stat-value">${capabilities?.categories.length || 0}</div>
                    <div class="stat-label">Categories</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${capabilities?.totalMaterials || 0}</div>
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
    // Remove previous selection
    document.querySelectorAll('.supplier-card').forEach(card => 
        card.classList.remove('selected'));
    
    // Mark as selected
    cardElement.classList.add('selected');
    selectedSupplier = supplierId;
    
    // Show categories for this supplier
    populateCategories(supplierId);
    
    // Activate step 2
    activateStep(2);
    
    console.log('✅ Supplier selected:', supplierId);
}

// Populate Categories
function populateCategories(supplierId) {
    const capabilities = smartData.data.supplierCapabilities[supplierId];
    const categories = capabilities?.categories || [];
    
    categoryGrid.innerHTML = '';

    if (categories.length === 0) {
        categoryGrid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No categories available for this supplier</p>';
        return;
    }

    categories.forEach(categoryName => {
        const materialsInCategory = capabilities.materials.filter(m => m.category === categoryName);
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
    // Remove previous selection
    document.querySelectorAll('.category-card').forEach(card => 
        card.classList.remove('selected'));
    
    // Mark as selected
    cardElement.classList.add('selected');
    selectedCategory = categoryName;
    
    // Show materials for this category
    populateMaterials(selectedSupplier, categoryName);
    
    // Activate step 3
    activateStep(3);
    
    console.log('✅ Category selected:', categoryName);
}

// Populate Materials
function populateMaterials(supplierId, categoryName) {
    const capabilities = smartData.data.supplierCapabilities[supplierId];
    const materials = capabilities.materials.filter(m => m.category === categoryName);
    
    materialGrid.innerHTML = '';
    selectedMaterials = []; // Reset

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
                    <div class="material-price">$${material.supplierPrice.toFixed(2)}/${material.unit}</div>
                </div>
            </div>
            <div class="material-description">${material.description}</div>
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
                <span class="subtotal">$${material.supplierPrice.toFixed(2)}</span>
            </div>
        `;

        // Add event listeners
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
        const subtotal = material.supplierPrice * quantity;
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
        quantity: quantity
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

    // Update items
    summaryItems.innerHTML = selectedMaterials.map(item => `
        <div class="summary-item">
            <div>
                <div>${item.name}</div>
                <div class="item-details">${item.quantity} ${item.unit} × $${item.supplierPrice.toFixed(2)}</div>
            </div>
            <div class="item-price">$${(item.quantity * item.supplierPrice).toFixed(2)}</div>
        </div>
    `).join('');

    // Update totals
    const totalItems = selectedMaterials.length;
    const totalQuantity = selectedMaterials.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.supplierPrice), 0);

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

// Activate Workflow Step
function activateStep(stepNumber) {
    // Update step states
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

// Handle Form Submission
async function handleSubmission(e) {
    e.preventDefault();
    
    hideMessages();
    setLoading(true);
    
    try {
        const formData = new FormData(form);
        const supplier = smartData.data.suppliers.find(s => s.id === selectedSupplier);
        
        if (!supplier) {
            throw new Error('Please select a supplier');
        }
        
        if (!selectedCategory) {
            throw new Error('Please select a category');
        }
        
        if (selectedMaterials.length === 0) {
            throw new Error('Please select at least one material');
        }
        
        const orderData = {
            category: selectedCategory,
            materials: selectedMaterials.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                price: item.supplierPrice,
                code: item.code
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

        const response = await fetch(ORDER_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Order submission error:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Order result:', result);
        
        if (result.status === 'success') {
            const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.supplierPrice), 0);
            showMessage('success', `🎉 Smart Order Submitted Successfully!
            
Order ID: ${result.order_id}
Supplier: ${supplier.name}
Category: ${selectedCategory}
Total: $${totalPrice.toFixed(2)}
            
Your order has been sent to the supplier and you'll receive confirmation shortly.`);
            
            // Reset form
            resetForm();
        } else {
            throw new Error(result.message || 'Order submission failed');
        }
        
    } catch (error) {
        console.error('❌ Submission Error:', error);
        showMessage('error', `Failed to submit order: ${error.message}`);
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
    
    // Clear selections
    document.querySelectorAll('.smart-card').forEach(card => 
        card.classList.remove('selected'));
    
    // Reset steps
    activateStep(1);
    
    // Clear grids
    categoryGrid.innerHTML = '';
    materialGrid.innerHTML = '';
    orderSummary.classList.remove('visible');
}

// Utility Functions
function showMessage(type, message) {
    hideMessages();
    const messageEl = type === 'success' ? successMessage : errorMessage;
    messageEl.innerHTML = message.replace(/\n/g, '<br>');
    messageEl.style.display = 'block';
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Auto-hide success messages after 10 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 10000);
    }
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? '⏳ Processing...' : '🚀 Submit Smart Order';
}

// Event Listeners
form.addEventListener('submit', handleSubmission);

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeSmartSystem);

// Debug helper
window.debugLCMB = {
    smartData,
    selectedSupplier,
    selectedCategory,
    selectedMaterials,
    resetForm,
    showMessage
};
