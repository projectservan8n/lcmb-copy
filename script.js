// ✅ UPDATED WITH YOUR RAILWAY WEBHOOK URLS ✅
const MATERIALS_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/materials-data';
const ORDER_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/material-order';

// Global data storage
let suppliersData = [];
let materialsBySupplier = {};
let allCategories = [];
let selectedSupplier = null;
let selectedCategory = null;
let selectedMaterials = [];

// DOM elements
const initialLoading = document.getElementById('initialLoading');
const formCard = document.getElementById('formCard');
const supplierGrid = document.getElementById('supplierGrid');
const categoryGrid = document.getElementById('categoryGrid');
const materialsSection = document.getElementById('materialsSection');
const materialsPlaceholder = document.getElementById('materialsPlaceholder');
const materialsGrid = document.getElementById('materialsGrid');
const materialSearch = document.getElementById('materialSearch');
const selectedMaterialsSection = document.getElementById('selectedMaterials');
const selectedItems = document.getElementById('selectedItems');
const form = document.getElementById('materialOrderForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');  
const loading = document.getElementById('loading');
const submitBtn = document.getElementById('submitBtn');

// Category icons mapping
const categoryIcons = {
    'AC Install': '❄️',
    'AC Service': '🔧', 
    'Electrical': '⚡',
    'Factory Stock': '📦',
    'default': '📋'
};

// Initialize the application
async function initializeApp() {
    try {
        await loadSuppliersAndMaterials();
        populateSuppliers();
        setupEventListeners();
        
        initialLoading.style.display = 'none';
        formCard.classList.add('loaded');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load data. Please check your n8n webhooks and try again.');
        initialLoading.style.display = 'none';
    }
}

// Load suppliers and materials from n8n webhook
async function loadSuppliersAndMaterials() {
    try {
        console.log('Fetching from:', MATERIALS_ENDPOINT);
        const response = await fetch(MATERIALS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        if (data.status === 'success' && data.data) {
            suppliersData = data.data.suppliers || [];
            materialsBySupplier = data.data.materials_by_supplier || {};
            allCategories = data.data.all_categories || [];
            
            console.log('Loaded suppliers:', suppliersData.length);
            console.log('Available categories:', allCategories);
        } else {
            throw new Error('Invalid data structure received from n8n');
        }
        
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to mock data
        suppliersData = [
            { 
                id: 'SUP001', 
                name: 'ElectroSupply Co.', 
                email: 'orders@electrosupply.com.au', 
                specialties: ['Electrical', 'AC Install'],
                available_categories: ['Electrical', 'AC Install'],
                materials_count: 5
            },
            { 
                id: 'SUP002', 
                name: 'AC Parts Direct', 
                email: 'sales@acpartsdirect.com.au', 
                specialties: ['AC Install', 'AC Service'],
                available_categories: ['AC Install', 'AC Service'],
                materials_count: 8
            }
        ];
        
        materialsBySupplier = {
            'SUP001': {
                'Electrical': [
                    { name: 'Circuit Breaker 20A', unit: 'pcs', price: 25.00, description: 'Single pole circuit breaker', code: 'EL-CB-20A' }
                ],
                'AC Install': [
                    { name: 'Wall Mounting Bracket', unit: 'pcs', price: 45.00, description: 'Heavy duty wall mount', code: 'AC-WMB-HD' }
                ]
            },
            'SUP002': {
                'AC Install': [
                    { name: 'Split System Unit 2.5kW', unit: 'pcs', price: 899.00, description: 'Energy efficient cooling unit', code: 'AC-SS-25' }
                ],
                'AC Service': [
                    { name: 'R410A Refrigerant Gas', unit: 'kg', price: 28.00, description: 'Eco-friendly refrigerant', code: 'AC-R410A' }
                ]
            }
        };
    }
}

// Populate suppliers (Step 1)
function populateSuppliers() {
    supplierGrid.innerHTML = '';

    suppliersData.forEach(supplier => {
        const supplierDiv = document.createElement('div');
        supplierDiv.className = 'supplier-option';
        supplierDiv.innerHTML = `
            <input type="radio" name="supplier" value="${supplier.id}" id="supplier-${supplier.id}">
            <label for="supplier-${supplier.id}" class="supplier-card">
                <div class="supplier-name">${supplier.name}</div>
                <div class="supplier-email">${supplier.email}</div>
                <div class="supplier-specialties">Specializes in: ${supplier.specialties.join(', ')}</div>
                <div class="supplier-stats">${supplier.materials_count} materials in ${supplier.categories_count || supplier.available_categories.length} categories</div>
            </label>
        `;
        supplierGrid.appendChild(supplierDiv);
    });
}

// Populate categories based on selected supplier (Step 2)
function populateCategories(supplierId) {
    const supplier = suppliersData.find(s => s.id === supplierId);
    if (!supplier) return;
    
    const availableCategories = supplier.available_categories || [];
    categoryGrid.innerHTML = '';
    
    if (availableCategories.length === 0) {
        categoryGrid.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic;">No categories available for this supplier</p>';
        return;
    }

    availableCategories.forEach(category => {
        const materialsCount = materialsBySupplier[supplierId] && materialsBySupplier[supplierId][category] 
            ? materialsBySupplier[supplierId][category].length 
            : 0;
            
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-option';
        categoryDiv.innerHTML = `
            <input type="radio" name="category" value="${category}" id="category-${category.replace(/\s+/g, '-')}">
            <label for="category-${category.replace(/\s+/g, '-')}" class="category-label">
                <span class="category-emoji">${categoryIcons[category] || categoryIcons.default}</span>
                <div class="category-name">${category}</div>
                <div class="category-count">${materialsCount} materials</div>
            </label>
        `;
        categoryGrid.appendChild(categoryDiv);
    });
}

// Populate materials based on supplier and category (Step 3)
function populateMaterials(supplierId, category) {
    const materials = (materialsBySupplier[supplierId] && materialsBySupplier[supplierId][category]) || [];
    selectedMaterials = []; // Reset
    
    renderMaterials(materials);
    updateSelectedMaterialsDisplay();
    
    if (materials.length > 0) {
        materialsPlaceholder.style.display = 'none';
        materialsSection.classList.add('visible');
    }
}

// Render materials in the grid
function renderMaterials(materials) {
    materialsGrid.innerHTML = '';
    
    if (materials.length === 0) {
        materialsGrid.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic;">No materials available in this category</p>';
        return;
    }
    
    materials.forEach((material, index) => {
        const materialCard = document.createElement('div');
        materialCard.className = 'material-card';
        materialCard.innerHTML = `
            <div class="material-header">
                <input type="checkbox" class="material-checkbox" data-material-index="${index}">
                <div class="material-info">
                    <div class="material-name">${material.name}</div>
                    <div class="material-price">$${material.price.toFixed(2)}/${material.unit}</div>
                </div>
            </div>
            ${material.description ? `<div class="material-description">${material.description}</div>` : ''}
            <div class="material-code">${material.code}</div>
            <div class="quantity-controls">
                <span class="quantity-label">Qty:</span>
                <div class="quantity-buttons">
                    <button type="button" class="qty-btn" data-action="decrease">−</button>
                    <input type="number" class="quantity-input" min="1" value="1" data-material-index="${index}">
                    <button type="button" class="qty-btn" data-action="increase">+</button>
                </div>
                <span class="unit-display">${material.unit}</span>
                <span class="subtotal">$${material.price.toFixed(2)}</span>
            </div>
        `;
        
        // Add event listeners (same as before)
        const checkbox = materialCard.querySelector('.material-checkbox');
        const quantityControls = materialCard.querySelector('.quantity-controls');
        const quantityInput = materialCard.querySelector('.quantity-input');
        const subtotalSpan = materialCard.querySelector('.subtotal');
        const decreaseBtn = materialCard.querySelector('[data-action="decrease"]');
        const increaseBtn = materialCard.querySelector('[data-action="increase"]');

        checkbox.addEventListener('change', function() {
            if (this.checked) {
                materialCard.classList.add('selected');
                quantityControls.classList.add('visible');
                addToSelectedMaterials(material, index, 1);
            } else {
                materialCard.classList.remove('selected');
                quantityControls.classList.remove('visible');
                removeFromSelectedMaterials(index);
            }
        });

        quantityInput.addEventListener('input', function() {
            const quantity = parseInt(this.value) || 1;
            const subtotal = material.price * quantity;
            subtotalSpan.textContent = `$${subtotal.toFixed(2)}`;
            updateSelectedMaterialQuantity(index, quantity);
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
        
        materialsGrid.appendChild(materialCard);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Supplier change handler (Step 1 → Step 2)
    document.addEventListener('change', function(e) {
        if (e.target.name === 'supplier') {
            selectedSupplier = e.target.value;
            selectedCategory = null;
            selectedMaterials = [];
            
            // Show categories for selected supplier
            populateCategories(selectedSupplier);
            
            // Hide materials until category is selected
            materialsSection.classList.remove('visible');
            materialsPlaceholder.style.display = 'block';
            updateSelectedMaterialsDisplay();
        }
    });

    // Category change handler (Step 2 → Step 3)
    document.addEventListener('change', function(e) {
        if (e.target.name === 'category') {
            selectedCategory = e.target.value;
            
            if (selectedSupplier && selectedCategory) {
                populateMaterials(selectedSupplier, selectedCategory);
            }
        }
    });

    // Material search handler
    materialSearch.addEventListener('input', function() {
        if (selectedSupplier && selectedCategory && materialsBySupplier[selectedSupplier] && materialsBySupplier[selectedSupplier][selectedCategory]) {
            const materials = materialsBySupplier[selectedSupplier][selectedCategory];
            const filtered = materials.filter(material => 
                material.name.toLowerCase().includes(this.value.toLowerCase()) ||
                material.description.toLowerCase().includes(this.value.toLowerCase()) ||
                material.code.toLowerCase().includes(this.value.toLowerCase())
            );
            renderMaterials(filtered);
        }
    });

    // Form submission handler
    form.addEventListener('submit', handleFormSubmission);
}

// Handle form submission (updated for supplier-first workflow)
async function handleFormSubmission(e) {
    e.preventDefault();
    
    hideMessages();
    showLoading(true);
    
    const formData = new FormData(form);
    const supplierInfo = suppliersData.find(s => s.id === selectedSupplier);
    
    const orderData = {
        category: selectedCategory,
        materials: selectedMaterials.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            code: item.code
        })),
        supplier_name: supplierInfo ? supplierInfo.name : '',
        supplier_email: supplierInfo ? supplierInfo.email : '',
        user_name: formData.get('user_name'),
        user_email: formData.get('user_email'),
        urgency: formData.get('urgency') || 'Normal',
        project_ref: formData.get('project_ref') || '',
        notes: formData.get('notes') || ''
    };

    // Validate required fields
    if (!selectedSupplier || !selectedCategory || selectedMaterials.length === 0 || !orderData.user_name || !orderData.user_email) {
        showError('Please complete all required fields: select supplier, category, materials, and fill in your information.');
        showLoading(false);
        return;
    }

    try {
        console.log('Submitting order:', orderData);
        
        const response = await fetch(ORDER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.price), 0);
            showSuccess(`Order submitted successfully! 
            
Order ID: ${result.order_id}
Supplier: ${supplierInfo.name}
Category: ${selectedCategory}
Total: $${totalPrice.toFixed(2)}

The supplier will be contacted and you'll receive a confirmation email shortly.`);
            
            // Reset form
            resetForm();
        } else {
            throw new Error(result.message || 'Order submission failed');
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        showError(`Failed to submit order: ${error.message}. Please try again or contact support.`);
    } finally {
        showLoading(false);
    }
}

// Reset form to initial state
function resetForm() {
    form.reset();
    selectedSupplier = null;
    selectedCategory = null;
    selectedMaterials = [];
    
    // Clear all selections
    document.querySelectorAll('input[type="radio"]').forEach(input => input.checked = false);
    
    // Hide sections
    categoryGrid.innerHTML = '';
    materialsSection.classList.remove('visible');
    materialsPlaceholder.style.display = 'block';
    updateSelectedMaterialsDisplay();
}

// Rest of the utility functions remain the same...
function addToSelectedMaterials(material, index, quantity) {
    const selectedMaterial = { ...material, index: index, quantity: quantity };
    selectedMaterials.push(selectedMaterial);
    updateSelectedMaterialsDisplay();
}

function removeFromSelectedMaterials(index) {
    selectedMaterials = selectedMaterials.filter(item => item.index !== index);
    updateSelectedMaterialsDisplay();
}

function updateSelectedMaterialQuantity(index, quantity) {
    const material = selectedMaterials.find(item => item.index === index);
    if (material) {
        material.quantity = quantity;
        updateSelectedMaterialsDisplay();
    }
}

function updateSelectedMaterialsDisplay() {
    if (selectedMaterials.length === 0) {
        selectedMaterialsSection.classList.remove('visible');
        return;
    }

    selectedMaterialsSection.classList.add('visible');
    
    selectedItems.innerHTML = selectedMaterials.map(item => `
        <div class="selected-item">
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-details">${item.quantity} ${item.unit} × $${item.price.toFixed(2)}</div>
            </div>
            <div class="item-price">$${(item.quantity * item.price).toFixed(2)}</div>
        </div>
    `).join('');

    const totalItems = selectedMaterials.length;
    const totalQuantity = selectedMaterials.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    scrollToTop();
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    scrollToTop();
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    submitBtn.disabled = show;
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
