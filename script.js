// 🧠 SIMPLE LCMB PROCUREMENT FRONTEND - DIRECT WEBHOOK VERSION
// Direct connection to your n8n webhooks - no proxy needed

// Your actual n8n webhook URLs (from your workflow)
const MATERIALS_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/materials-data';
const ORDER_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/material-order';

console.log('🚀 LCMB Direct Mode:', { MATERIALS_ENDPOINT, ORDER_ENDPOINT });

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

// Initialize System - Simple and Direct
async function initializeSmartSystem() {
    try {
        console.log('🚀 Starting LCMB System...');
        updateLoadingText('Connecting to procurement system...');
        
        // Direct fetch to your n8n webhook
        const response = await fetch(MATERIALS_ENDPOINT, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 System Response:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`System Error ${response.status}: ${response.statusText}. Please contact administrator.`);
        }

        smartData = await response.json();
        console.log('✅ Data loaded:', smartData);

        // Validate data structure
        if (!smartData || smartData.status !== 'success' || !smartData.data) {
            throw new Error('Invalid system response. Please contact administrator.');
        }

        updateLoadingText('Setting up interface...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Setup UI
        updateSystemStatus();
        updateRecommendations();
        populateSuppliers();
        
        // Show app
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('success', `✅ LCMB Procurement System Ready! Found ${smartData.data.suppliers.length} suppliers and ${smartData.data.metadata.totalMaterials} materials. Select a supplier to begin.`);
        
    } catch (error) {
        console.error('❌ System Error:', error);
        
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('error', `❌ System Unavailable: Unable to connect to the procurement system. Please contact your administrator or try again later. Error: ${error.message}`);
    }
}

// Remove all demo data - we'll show proper error messages instead
// No demo data needed for production system

function updateLoadingText(text) {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

function updateSystemStatus() {
    if (!smartData?.data?.metadata) return;
    
    const data = smartData.data;
    document.getElementById('supplierCount').textContent = data.metadata.totalSuppliers;
    document.getElementById('materialCount').textContent = data.metadata.totalMaterials;
    document.getElementById('categoryCount').textContent = data.metadata.totalCategories;
}

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

function selectSupplier(supplierId, cardElement) {
    document.querySelectorAll('.supplier-card').forEach(card => 
        card.classList.remove('selected'));
    
    cardElement.classList.add('selected');
    selectedSupplier = supplierId;
    
    populateCategories(supplierId);
    activateStep(2);
    
    console.log('✅ Supplier selected:', supplierId);
}

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

function selectCategory(categoryName, cardElement) {
    document.querySelectorAll('.category-card').forEach(card => 
        card.classList.remove('selected'));
    
    cardElement.classList.add('selected');
    selectedCategory = categoryName;
    
    populateMaterials(selectedSupplier, categoryName);
    activateStep(3);
    
    console.log('✅ Category selected:', categoryName);
}

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

function removeMaterial(index) {
    selectedMaterials = selectedMaterials.filter(item => item.index !== index);
    updateOrderSummary();
    
    if (selectedMaterials.length === 0) {
        orderSummary.classList.remove('visible');
        deactivateStep(4);
    }
}

function updateMaterialQuantity(index, quantity) {
    const material = selectedMaterials.find(item => item.index === index);
    if (material) {
        material.quantity = quantity;
        updateOrderSummary();
    }
}

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

function deactivateStep(stepNumber) {
    const step = document.getElementById(`step${stepNumber}`);
    step.classList.remove('active');
    currentStep = Math.max(1, stepNumber - 1);
}

// Simple order submission - direct to n8n webhook
async function handleSubmission(e) {
    e.preventDefault();
    
    hideMessages();
    setLoading(true);
    
    try {
        if (!selectedSupplier) throw new Error('Please select a supplier');
        if (!selectedCategory) throw new Error('Please select a category');
        if (selectedMaterials.length === 0) throw new Error('Please select at least one material');
        
        const formData = new FormData(form);
        const supplier = smartData.data.suppliers.find(s => s.id === selectedSupplier);
        
        if (!supplier) throw new Error('Selected supplier not found');
        
        // Build order data matching your n8n workflow
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

        console.log('🚀 Submitting order to procurement system:', orderData);

        // Direct POST to your n8n webhook
        const response = await fetch(ORDER_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error(`Order submission failed (${response.status}). Please contact administrator.`);
        }

        const result = await response.json();
        console.log('✅ Order submitted successfully:', result);
        
        if (result.status === 'success') {
            const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.finalPrice), 0);
            showMessage('success', `🎉 Order Submitted Successfully!
            
<strong>Order ID:</strong> ${result.order_id}<br>
<strong>Supplier:</strong> ${supplier.name}<br>
<strong>Total:</strong> $${totalPrice.toFixed(2)}<br>
<strong>Processing:</strong> ${result.estimated_processing}
            
✅ Saved to Google Sheets<br>
📧 Emails sent to supplier and you`);
            
            setTimeout(() => resetForm(), 4000);
        } else {
            throw new Error(result.message || 'Order submission failed');
        }
        
    } catch (error) {
        console.error('❌ Order Submission Error:', error);
        showMessage('error', `❌ Order Failed: ${error.message}. If this problem persists, please contact your administrator.`);
    } finally {
        setLoading(false);
    }
}

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
        }, 12000);
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeSmartSystem, 500);
});

// Simple debug helper (admin only)
window.debugLCMB = {
    get data() { return smartData; },
    get selected() { return { selectedSupplier, selectedCategory, selectedMaterials }; },
    endpoints: { MATERIALS_ENDPOINT, ORDER_ENDPOINT },
    resetForm,
    testConnection: async () => {
        try {
            const response = await fetch(MATERIALS_ENDPOINT);
            console.log('Connection test:', response.status, response.statusText);
            return response.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
};

console.log('🎯 LCMB Direct Mode Ready');
