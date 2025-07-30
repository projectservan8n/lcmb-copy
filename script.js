// 🧠 STREAMLINED LCMB PROCUREMENT FRONTEND - User-Friendly Version
// Dropdowns for suppliers/categories, search & pagination for materials

// Your n8n webhook URLs
const MATERIALS_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/materials-data';
const ORDER_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/material-order';

console.log('🚀 LCMB Streamlined Mode:', { MATERIALS_ENDPOINT, ORDER_ENDPOINT });

// Global State
let smartData = null;
let selectedSupplier = null;
let selectedCategory = null;
let selectedMaterials = [];
let currentStep = 1;
let currentMaterials = [];
let filteredMaterials = [];
let currentPage = 1;
const materialsPerPage = 5;

// DOM Elements
const loadingOverlay = document.getElementById('loadingOverlay');
const appContainer = document.getElementById('appContainer');
const supplierSelect = document.getElementById('supplierSelect');
const categorySelect = document.getElementById('categorySelect');
const materialSearch = document.getElementById('materialSearch');
const materialGrid = document.getElementById('materialGrid');
const paginationContainer = document.getElementById('paginationContainer');
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

// Initialize System
async function initializeSmartSystem() {
    try {
        console.log('🚀 Starting LCMB System...');
        updateLoadingText('Connecting to procurement system...');
        
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

        if (!smartData || smartData.status !== 'success' || !smartData.data) {
            throw new Error('Invalid system response. Please contact administrator.');
        }

        updateLoadingText('Setting up interface...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Setup UI
        updateSystemStatus();
        updateRecommendations();
        populateSupplierDropdown();
        
        // Show app
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('success', `✅ LCMB Procurement System Ready! Found ${smartData.data.suppliers.length} suppliers and ${smartData.data.metadata.totalMaterials} materials.`);
        
    } catch (error) {
        console.error('❌ System Error:', error);
        
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('error', `❌ System Unavailable: Unable to connect to the procurement system. Please contact your administrator or try again later. Error: ${error.message}`);
    }
}

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

// Populate Supplier Dropdown
function populateSupplierDropdown() {
    if (!smartData?.data?.suppliers) {
        supplierSelect.innerHTML = '<option value="">No suppliers available</option>';
        return;
    }
    
    const suppliers = smartData.data.suppliers;
    
    // Clear and add default option
    supplierSelect.innerHTML = '<option value="">Select a supplier...</option>';
    
    // Add supplier options
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (${supplier.tier}) - ${supplier.reliabilityScore.toFixed(0)}%`;
        supplierSelect.appendChild(option);
    });
    
    // Add event listener
    supplierSelect.addEventListener('change', handleSupplierChange);
}

// Handle Supplier Selection
function handleSupplierChange(e) {
    const supplierId = e.target.value;
    
    if (!supplierId) {
        selectedSupplier = null;
        categorySelect.innerHTML = '<option value="">First select a supplier</option>';
        categorySelect.disabled = true;
        clearMaterials();
        deactivateStep(2);
        return;
    }
    
    selectedSupplier = supplierId;
    populateCategoryDropdown(supplierId);
    activateStep(2);
    
    console.log('✅ Supplier selected:', supplierId);
}

// Populate Category Dropdown
function populateCategoryDropdown(supplierId) {
    const capabilities = smartData.data.supplierCapabilities?.[supplierId];
    const categories = capabilities?.categories || [];
    
    // Clear and enable
    categorySelect.innerHTML = '<option value="">Select a category...</option>';
    categorySelect.disabled = false;
    
    if (categories.length === 0) {
        categorySelect.innerHTML = '<option value="">No categories available</option>';
        categorySelect.disabled = true;
        return;
    }
    
    // Add category options
    categories.forEach(categoryName => {
        const materialsInCategory = capabilities.materials?.filter(m => m.category === categoryName) || [];
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = `${categoryIcons[categoryName] || categoryIcons.default} ${categoryName} (${materialsInCategory.length} materials)`;
        categorySelect.appendChild(option);
    });
    
    // Add event listener
    categorySelect.removeEventListener('change', handleCategoryChange);
    categorySelect.addEventListener('change', handleCategoryChange);
}

// Handle Category Selection
function handleCategoryChange(e) {
    const categoryName = e.target.value;
    
    if (!categoryName) {
        selectedCategory = null;
        clearMaterials();
        deactivateStep(3);
        return;
    }
    
    selectedCategory = categoryName;
    loadMaterials(selectedSupplier, categoryName);
    activateStep(3);
    
    console.log('✅ Category selected:', categoryName);
}

// Load and Display Materials with Search & Pagination
function loadMaterials(supplierId, categoryName) {
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
    
    currentMaterials = materials;
    filteredMaterials = materials;
    currentPage = 1;
    selectedMaterials = [];
    
    // Show search bar and materials section
    document.getElementById('materialsSection').style.display = 'block';
    
    // Setup search
    materialSearch.value = '';
    materialSearch.removeEventListener('input', handleSearch);
    materialSearch.addEventListener('input', handleSearch);
    
    // Display materials
    displayMaterials();
    updateOrderSummary();
}

// Handle Search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        filteredMaterials = currentMaterials;
    } else {
        filteredMaterials = currentMaterials.filter(material => 
            material.name.toLowerCase().includes(searchTerm) ||
            material.description.toLowerCase().includes(searchTerm) ||
            material.code.toLowerCase().includes(searchTerm) ||
            material.brand.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    displayMaterials();
}

// Display Materials with Pagination
function displayMaterials() {
    const startIndex = (currentPage - 1) * materialsPerPage;
    const endIndex = startIndex + materialsPerPage;
    const materialsToShow = filteredMaterials.slice(startIndex, endIndex);
    
    materialGrid.innerHTML = '';
    
    if (filteredMaterials.length === 0) {
        materialGrid.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No materials found matching your search.</p>';
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Display materials
    materialsToShow.forEach((material, index) => {
        const globalIndex = startIndex + index;
        const card = document.createElement('div');
        card.className = 'material-card';
        card.innerHTML = `
            <div class="material-header">
                <input type="checkbox" class="material-checkbox" data-index="${globalIndex}" ${isSelectedMaterial(material.id) ? 'checked' : ''}>
                <div class="material-info">
                    <div class="material-name">${material.name}</div>
                    <div class="material-price">$${(material.supplierPrice || material.basePrice).toFixed(2)}/${material.unit}</div>
                </div>
            </div>
            <div class="material-description">${material.description || 'No description available'}</div>
            <div class="material-meta">
                <span class="meta-tag tag-code">${material.code}</span>
                <span class="meta-tag tag-brand">${material.brand}</span>
                <span class="meta-tag ${material.stockLevel > 50 ? 'tag-stock' : 'tag-low-stock'}">
                    ${material.availabilityStatus}
                </span>
            </div>
            <div class="quantity-controls ${isSelectedMaterial(material.id) ? 'visible' : ''}">
                <button type="button" class="qty-btn" data-action="decrease" data-material-id="${material.id}">−</button>
                <input type="number" class="qty-input" min="1" value="${getSelectedQuantity(material.id) || 1}" data-material-id="${material.id}">
                <button type="button" class="qty-btn" data-action="increase" data-material-id="${material.id}">+</button>
                <span class="unit-label">${material.unit}</span>
                <span class="subtotal">$${((material.supplierPrice || material.basePrice) * (getSelectedQuantity(material.id) || 1)).toFixed(2)}</span>
            </div>
        `;

        setupMaterialCard(card, material, globalIndex);
        materialGrid.appendChild(card);
    });
    
    // Update pagination
    createPagination();
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
            quantityControls.classList.add('visible');
            addMaterial(material, 1);
        } else {
            quantityControls.classList.remove('visible');
            removeMaterial(material.id);
        }
    });

    quantityInput.addEventListener('input', function() {
        const quantity = parseInt(this.value) || 1;
        const price = material.supplierPrice || material.basePrice;
        const subtotal = price * quantity;
        subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
        updateMaterialQuantity(material.id, quantity);
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

// Material Selection Helper Functions
function isSelectedMaterial(materialId) {
    return selectedMaterials.some(item => item.id === materialId);
}

function getSelectedQuantity(materialId) {
    const selected = selectedMaterials.find(item => item.id === materialId);
    return selected ? selected.quantity : null;
}

function addMaterial(material, quantity) {
    // Remove if already exists
    selectedMaterials = selectedMaterials.filter(item => item.id !== material.id);
    
    // Add with new quantity
    selectedMaterials.push({
        ...material,
        quantity: quantity,
        finalPrice: material.supplierPrice || material.basePrice
    });
    
    updateOrderSummary();
    activateStep(4);
}

function removeMaterial(materialId) {
    selectedMaterials = selectedMaterials.filter(item => item.id !== materialId);
    updateOrderSummary();
    
    if (selectedMaterials.length === 0) {
        orderSummary.classList.remove('visible');
        deactivateStep(4);
    }
}

function updateMaterialQuantity(materialId, quantity) {
    const material = selectedMaterials.find(item => item.id === materialId);
    if (material) {
        material.quantity = quantity;
        updateOrderSummary();
    }
}

// Create Pagination
function createPagination() {
    const totalPages = Math.ceil(filteredMaterials.length / materialsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})">← Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="page-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            paginationHTML += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Next →</button>`;
    }
    
    paginationHTML += '</div>';
    paginationHTML += `<div class="pagination-info">Showing ${((currentPage - 1) * materialsPerPage) + 1}-${Math.min(currentPage * materialsPerPage, filteredMaterials.length)} of ${filteredMaterials.length} materials</div>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change Page Function (global for onclick)
window.changePage = function(page) {
    currentPage = page;
    displayMaterials();
}

// Clear Materials
function clearMaterials() {
    document.getElementById('materialsSection').style.display = 'none';
    materialGrid.innerHTML = '';
    paginationContainer.innerHTML = '';
    selectedMaterials = [];
    updateOrderSummary();
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

// Activate/Deactivate Steps
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

// Handle Form Submission
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

// Reset Form
function resetForm() {
    form.reset();
    selectedSupplier = null;
    selectedCategory = null;
    selectedMaterials = [];
    currentPage = 1;
    
    // Reset dropdowns
    supplierSelect.value = '';
    categorySelect.innerHTML = '<option value="">First select a supplier</option>';
    categorySelect.disabled = true;
    
    // Reset materials
    clearMaterials();
    
    // Reset steps
    activateStep(1);
    
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

// Debug helper
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

console.log('🎯 LCMB Streamlined Mode Ready');
