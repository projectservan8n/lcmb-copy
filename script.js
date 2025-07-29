// ✅ UPDATED WITH YOUR RAILWAY WEBHOOK URLS ✅
const MATERIALS_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/materials-data';
const ORDER_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/material-order';

// Global data storage
let materialsData = {};
let suppliersData = [];
let selectedMaterials = [];
let allMaterials = [];

// DOM elements
const initialLoading = document.getElementById('initialLoading');
const formCard = document.getElementById('formCard');
const categoryGrid = document.getElementById('categoryGrid');
const materialsSection = document.getElementById('materialsSection');
const materialsPlaceholder = document.getElementById('materialsPlaceholder');
const materialsGrid = document.getElementById('materialsGrid');
const materialSearch = document.getElementById('materialSearch');
const selectedMaterialsSection = document.getElementById('selectedMaterials');
const selectedItems = document.getElementById('selectedItems');
const supplierGrid = document.getElementById('supplierGrid');
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
        await loadMaterialsAndSuppliers();
        populateCategories();
        populateSuppliers();
        setupEventListeners();
        
        initialLoading.style.display = 'none';
        formCard.classList.add('loaded');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showError('Failed to load materials and suppliers. Please check your n8n webhooks and try again.');
        initialLoading.style.display = 'none';
    }
}

// Load materials and suppliers from n8n webhooks
async function loadMaterialsAndSuppliers() {
    try {
        const response = await fetch(MATERIALS_ENDPOINT);
        if (!response.ok) {
            throw new Error('Failed to fetch materials data');
        }
        const data = await response.json();
        materialsData = data.data.materials;
        suppliersData = data.data.suppliers;
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to mock data for demo
        materialsData = {
            'AC Install': [
                { name: 'Split System Unit 2.5kW', unit: 'pcs', price: 899.00, description: 'Energy efficient cooling unit', code: 'AC-SS-25' },
                { name: 'Copper Refrigerant Line Set 5m', unit: 'pcs', price: 125.00, description: 'Pre-insulated copper lines', code: 'AC-CRL-5M' },
                { name: 'Wall Mounting Bracket Heavy Duty', unit: 'pcs', price: 45.00, description: 'Heavy duty wall mount', code: 'AC-WMB-HD' }
            ],
            'AC Service': [
                { name: 'R410A Refrigerant Gas', unit: 'kg', price: 28.00, description: 'Eco-friendly refrigerant', code: 'AC-R410A' },
                { name: 'Air Filter Standard', unit: 'pcs', price: 15.00, description: 'Washable air filter', code: 'AC-FLT-STD' },
                { name: 'Coil Cleaning Solution', unit: 'liters', price: 18.00, description: 'Professional cleaning solution', code: 'AC-CLN-COIL' }
            ],
            'Electrical': [
                { name: 'Circuit Breaker 20A', unit: 'pcs', price: 25.00, description: 'Single pole circuit breaker', code: 'EL-CB-20A' },
                { name: 'Power Point Double GPO White', unit: 'pcs', price: 8.50, description: 'Standard power outlet', code: 'EL-PP-DBL-WHT' },
                { name: 'LED Downlight 10W', unit: 'pcs', price: 15.00, description: 'Warm white LED light', code: 'EL-LED-10W' }
            ],
            'Factory Stock': [
                { name: 'Safety Helmet White', unit: 'pcs', price: 18.00, description: 'Hard hat safety helmet', code: 'FS-HAT-WHT' },
                { name: 'Safety Vest Hi-Vis Orange', unit: 'pcs', price: 12.00, description: 'High visibility vest', code: 'FS-VST-HIVO' },
                { name: 'Work Gloves Leather', unit: 'pcs', price: 15.00, description: 'Leather work gloves', code: 'FS-GLV-LTHR' }
            ]
        };

        suppliersData = [
            { id: 'supplier1', name: 'ElectroSupply Co.', email: 'orders@electrosupply.com.au', specialties: ['Electrical', 'AC Install'] },
            { id: 'supplier2', name: 'AC Parts Direct', email: 'sales@acpartsdirect.com.au', specialties: ['AC Install', 'AC Service'] },
            { id: 'supplier3', name: 'Trade Materials Plus', email: 'sales@tradematerials.com.au', specialties: ['Electrical', 'Factory Stock'] }
        ];
    }
}

// Populate categories
function populateCategories() {
    const categories = Object.keys(materialsData);
    categoryGrid.innerHTML = '';

    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-option';
        categoryDiv.innerHTML = `
            <input type="radio" name="category" value="${category}" id="category-${category.replace(/\s+/g, '-')}">
            <label for="category-${category.replace(/\s+/g, '-')}" class="category-label">
                <span class="category-emoji">${categoryIcons[category] || categoryIcons.default}</span>
                <div class="category-name">${category}</div>
            </label>
        `;
        categoryGrid.appendChild(categoryDiv);
    });
}

// Populate suppliers
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
            </label>
        `;
        supplierGrid.appendChild(supplierDiv);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Category change handler
    document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                populateMaterials(this.value);
                materialsPlaceholder.style.display = 'none';
                materialsSection.classList.add('visible');
            }
        });
    });

    // Material search handler
    materialSearch.addEventListener('input', function() {
        filterMaterials(this.value);
    });

    // Form submission handler
    form.addEventListener('submit', handleFormSubmission);
}

// Populate materials based on category
function populateMaterials(category) {
    const materials = materialsData[category] || [];
    allMaterials = materials;
    selectedMaterials = []; // Reset selected materials
    
    renderMaterials(materials);
    updateSelectedMaterialsDisplay();
}

// Render materials in the grid
function renderMaterials(materials) {
    materialsGrid.innerHTML = '';
    
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
        
        // Add event listeners
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

// Filter materials based on search
function filterMaterials(searchTerm) {
    if (!allMaterials.length) return;
    
    const filtered = allMaterials.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    renderMaterials(filtered);
}

// Add material to selected list
function addToSelectedMaterials(material, index, quantity) {
    const selectedMaterial = {
        ...material,
        index: index,
        quantity: quantity
    };
    selectedMaterials.push(selectedMaterial);
    updateSelectedMaterialsDisplay();
}

// Remove material from selected list
function removeFromSelectedMaterials(index) {
    selectedMaterials = selectedMaterials.filter(item => item.index !== index);
    updateSelectedMaterialsDisplay();
}

// Update quantity of selected material
function updateSelectedMaterialQuantity(index, quantity) {
    const material = selectedMaterials.find(item => item.index === index);
    if (material) {
        material.quantity = quantity;
        updateSelectedMaterialsDisplay();
    }
}

// Update selected materials display
function updateSelectedMaterialsDisplay() {
    if (selectedMaterials.length === 0) {
        selectedMaterialsSection.classList.remove('visible');
        return;
    }

    selectedMaterialsSection.classList.add('visible');
    
    // Update items list
    selectedItems.innerHTML = selectedMaterials.map(item => `
        <div class="selected-item">
            <div>
                <div class="item-name">${item.name}</div>
                <div class="item-details">${item.quantity} ${item.unit} × $${item.price.toFixed(2)}</div>
            </div>
            <div class="item-price">$${(item.quantity * item.price).toFixed(2)}</div>
        </div>
    `).join('');

    // Update totals
    const totalItems = selectedMaterials.length;
    const totalQuantity = selectedMaterials.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
}

// Handle form submission
async function handleFormSubmission(e) {
    e.preventDefault();
    
    hideMessages();
    showLoading(true);
    
    const formData = new FormData(form);
    const selectedSupplier = document.querySelector('input[name="supplier"]:checked');
    const supplierInfo = selectedSupplier ? suppliersData.find(s => s.id === selectedSupplier.value) : null;
    
    const orderData = {
        category: formData.get('category'),
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
    if (!orderData.category || selectedMaterials.length === 0 || !orderData.supplier_email || !orderData.user_name || !orderData.user_email) {
        showError('Please complete all required fields before submitting.');
        showLoading(false);
        return;
    }

    try {
        const response = await fetch(ORDER_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit order');
        }

        const result = await response.json();
        
        const totalPrice = selectedMaterials.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        showSuccess(`Order submitted successfully! 
        
Order ID: ${result.order_id}
Total: $${totalPrice.toFixed(2)}

The supplier will be contacted and you'll receive a confirmation email shortly.`);
        
        // Reset form
        form.reset();
        selectedMaterials = [];
        updateSelectedMaterialsDisplay();
        materialsSection.classList.remove('visible');
        materialsPlaceholder.style.display = 'block';
        
    } catch (error) {
        showError('Failed to submit order. Please try again or contact support.');
        console.error('Submission error:', error);
    } finally {
        showLoading(false);
    }
}

// Utility functions
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
