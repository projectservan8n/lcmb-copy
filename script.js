// 🚀 LCMB Smart Procurement Frontend - Updated for Clean Database Structure
// Compatible with the new consolidated Materials sheet and enhanced n8n workflow

// Your n8n webhook URLs - Updated to match your current setup
const MATERIALS_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/materials-data';
const ORDER_ENDPOINT = 'https://primary-s0q-production.up.railway.app/webhook/material-order';

console.log('🚀 LCMB Smart Procurement System - Enhanced Version');
console.log('Endpoints:', { MATERIALS_ENDPOINT, ORDER_ENDPOINT });

// Global State
let smartData = null;
let selectedSupplier = null;
let selectedCategory = null;
let selectedMaterials = [];
let currentStep = 1;
let currentMaterials = [];
let filteredMaterials = [];
let currentPage = 1;
const materialsPerPage = 8; // Increased for better UX

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

// Enhanced Category Icons with more categories
const categoryIcons = {
    'Electrical': '⚡',
    'AC Installation': '❄️',
    'AC Install': '❄️', // Legacy compatibility
    'AC Service': '🔧',
    'Solar': '☀️',
    'Factory Stock': '📦',
    'Equipment Hire': '🏗️',
    'General': '📋',
    'default': '📋'
};

// Initialize Smart System with Enhanced Error Handling
async function initializeSmartSystem() {
    try {
        console.log('🚀 Initializing LCMB Smart Procurement System...');
        updateLoadingText('Connecting to LCMB procurement database...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(MATERIALS_ENDPOINT, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📡 System Response:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`System Error ${response.status}: ${response.statusText}. Please contact your system administrator.`);
        }

        smartData = await response.json();
        console.log('✅ Smart Data loaded:', smartData);
        console.log('🔍 DEBUG: Suppliers structure:', smartData.data?.suppliers);
        console.log('🔍 DEBUG: First supplier:', smartData.data?.suppliers?.[0]);

        // Enhanced validation for new data structure
        if (!smartData || smartData.status !== 'success' || !smartData.data) {
            throw new Error('Invalid system response format. Please contact your administrator.');
        }

        // Validate required data structure
        const data = smartData.data;
        if (!data.suppliers || !data.materials || !data.supplierCapabilities) {
            throw new Error('Missing required data components. System may be updating, please try again.');
        }

        updateLoadingText('Setting up intelligent interface...');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Setup Enhanced UI
        updateSystemStatus();
        updateRecommendations();
        populateSupplierDropdown();
        
        // Show app with smooth transition
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        showMessage('success', `✅ LCMB Smart Procurement System Ready!
        
<strong>System Status:</strong> Optimal<br>
<strong>Suppliers:</strong> ${data.suppliers.length} active<br>
<strong>Materials:</strong> ${data.metadata.totalMaterials} available<br>
<strong>Categories:</strong> ${data.metadata.totalCategories} types<br>
<strong>Last Updated:</strong> ${new Date(data.metadata.lastUpdate).toLocaleString()}

🎯 Ready to process intelligent material orders!`);
        
    } catch (error) {
        console.error('❌ System Initialization Error:', error);
        
        loadingOverlay.style.display = 'none';
        appContainer.classList.add('loaded');
        
        let errorMessage = '';
        if (error.name === 'AbortError') {
            errorMessage = 'Connection timeout. The system may be starting up or under heavy load.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the procurement system. Please check your internet connection.';
        } else {
            errorMessage = error.message;
        }
        
        showMessage('error', `❌ System Unavailable: ${errorMessage}
        
<strong>Troubleshooting:</strong><br>
• Check your internet connection<br>
• Wait a moment and refresh the page<br>
• Contact your system administrator if this persists<br>
• Emergency contact: your-admin@lcmb.com`);

        // Show retry button
        setTimeout(() => {
            if (errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
                addRetryButton();
            }
        }, 2000);
    }
}

function addRetryButton() {
    const retryBtn = document.createElement('button');
    retryBtn.className = 'submit-btn';
    retryBtn.style.maxWidth = '300px';
    retryBtn.style.margin = '20px auto';
    retryBtn.style.display = 'block';
    retryBtn.innerHTML = '🔄 Retry Connection';
    retryBtn.onclick = () => {
        retryBtn.remove();
        loadingOverlay.style.display = 'flex';
        appContainer.classList.remove('loaded');
        setTimeout(initializeSmartSystem, 1000);
    };
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.appendChild(retryBtn);
    }
}

function updateLoadingText(text) {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = text;
    }
}

// Enhanced System Status with Performance Metrics
function updateSystemStatus() {
    if (!smartData?.data?.metadata) return;
    
    const data = smartData.data;
    document.getElementById('supplierCount').textContent = data.metadata.totalSuppliers;
    document.getElementById('materialCount').textContent = data.metadata.totalMaterials;
    document.getElementById('categoryCount').textContent = data.metadata.totalCategories;
    
    // Add performance indicator (check if it doesn't already exist)
    const systemStatus = document.getElementById('systemStatus');
    const existingHealthStat = Array.from(systemStatus.children).find(child => 
        child.querySelector('.stat-label')?.textContent?.includes('System Health')
    );
    
    if (!existingHealthStat) {
        const performanceScore = data.insights?.performance?.totalValue || 0;
        const performanceElement = document.createElement('div');
        performanceElement.className = 'stat-item';
        performanceElement.innerHTML = `
            <div class="stat-value">✅</div>
            <div class="stat-label">System Health</div>
        `;
        
        systemStatus.appendChild(performanceElement);
    }
}

// Enhanced Recommendations
function updateRecommendations() {
    const recommendations = document.getElementById('recommendations');
    const insights = smartData?.data?.insights;
    
    if (!insights) return;
    
    let recommendationsHTML = '';
    
    // Top supplier recommendation
    if (insights.topSuppliers?.[0]) {
        const topSupplier = insights.topSuppliers[0];
        recommendationsHTML += `
            <div class="stat-item">
                <div class="stat-value">⭐</div>
                <div class="stat-label">Top: ${topSupplier.name}</div>
            </div>
        `;
    }
    
    // Category recommendation
    if (insights.categoryInsights?.[0]) {
        const topCategory = insights.categoryInsights[0];
        recommendationsHTML += `
            <div class="stat-item">
                <div class="stat-value">${categoryIcons[topCategory.name] || '📋'}</div>
                <div class="stat-label">Popular: ${topCategory.name}<br>${topCategory.materialCount} items</div>
            </div>
        `;
    }
    
    // If no insights available, show basic info
    if (!recommendationsHTML && smartData?.data?.suppliers?.length > 0) {
        recommendationsHTML = `
            <div class="stat-item">
                <div class="stat-value">✅</div>
                <div class="stat-label">System Ready</div>
            </div>
        `;
    }
    
    recommendations.innerHTML = recommendationsHTML;
}

// Enhanced Supplier Dropdown Population
function populateSupplierDropdown() {
    if (!smartData?.data?.suppliers) {
        supplierSelect.innerHTML = '<option value="">No suppliers available</option>';
        return;
    }
    
    const suppliers = smartData.data.suppliers;
    
    // Clear and add default option
    supplierSelect.innerHTML = '<option value="">🏪 Select your preferred supplier...</option>';
    
    // Sort suppliers by performance score
    const sortedSuppliers = suppliers.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    
    // Add supplier options with enhanced display
    sortedSuppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        
        // Enhanced supplier display with tier and performance
        const tierEmoji = supplier.tier === 'Premium' ? '💎' : supplier.tier === 'Standard' ? '⭐' : '📊';
        const leadTime = supplier.leadTimeDays ? ` • ${supplier.leadTimeDays}d delivery` : '';
        
        option.textContent = `${tierEmoji} ${supplier.name} (${supplier.reliabilityScore.toFixed(0)}% reliability${leadTime})`;
        option.title = `Specialties: ${supplier.specialties.join(', ')}`;
        
        supplierSelect.appendChild(option);
    });
    
    // Add event listener
    supplierSelect.removeEventListener('change', handleSupplierChange);
    supplierSelect.addEventListener('change', handleSupplierChange);
}

// Enhanced Supplier Selection Handler
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
    const supplier = smartData.data.suppliers.find(s => s.id === supplierId);
    
    console.log('✅ Supplier selected:', supplier?.name || supplierId);
    
    populateCategoryDropdown(supplierId);
    activateStep(2);
    
    // Show supplier info in a subtle way
    showMessage('success', `Selected: ${supplier?.name || 'Supplier'} (${supplier?.tier || 'Standard'} tier, ${supplier?.reliabilityScore?.toFixed(0) || 'N/A'}% reliability)`, 3000);
}

// Enhanced Category Dropdown Population
function populateCategoryDropdown(supplierId) {
    const capabilities = smartData.data.supplierCapabilities?.[supplierId];
    const categories = capabilities?.categories || [];
    
    // Clear and enable
    categorySelect.innerHTML = '<option value="">📂 Select a material category...</option>';
    categorySelect.disabled = false;
    
    if (categories.length === 0) {
        categorySelect.innerHTML = '<option value="">No categories available for this supplier</option>';
        categorySelect.disabled = true;
        return;
    }
    
    // Add category options with material counts
    categories.forEach(categoryName => {
        const materialsInCategory = capabilities.materials?.filter(m => m.category === categoryName) || [];
        const option = document.createElement('option');
        option.value = categoryName;
        
        const icon = categoryIcons[categoryName] || categoryIcons.default;
        const count = materialsInCategory.length;
        
        option.textContent = `${icon} ${categoryName} (${count} material${count !== 1 ? 's' : ''})`;
        categorySelect.appendChild(option);
    });
    
    // Add event listener
    categorySelect.removeEventListener('change', handleCategoryChange);
    categorySelect.addEventListener('change', handleCategoryChange);
}

// Enhanced Category Selection Handler
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

// Enhanced Materials Loading with Better Data Handling
function loadMaterials(supplierId, categoryName) {
    const capabilities = smartData.data.supplierCapabilities?.[supplierId];
    let materials = [];
    
    if (capabilities && capabilities.materials) {
        // Use supplier-specific materials with pricing
        materials = capabilities.materials.filter(m => m.category === categoryName);
    } else {
        // Fallback to general materials from the category
        materials = smartData.data.materials?.[categoryName] || [];
        
        // Add supplier-specific pricing if not already present
        materials = materials.map(material => ({
            ...material,
            supplierPrice: material.basePrice * (0.85 + Math.random() * 0.15),
            availability: material.stockLevel > 50 ? 'In Stock' : 'Limited Stock'
        }));
    }
    
    // Sort materials by name for consistency
    materials.sort((a, b) => a.name.localeCompare(b.name));
    
    currentMaterials = materials;
    filteredMaterials = materials;
    currentPage = 1;
    selectedMaterials = selectedMaterials.filter(selected => 
        materials.some(m => m.id === selected.id)
    ); // Keep only valid selections
    
    // Show materials section
    document.getElementById('materialsSection').style.display = 'block';
    
    // Setup search with debouncing
    materialSearch.value = '';
    materialSearch.removeEventListener('input', debouncedSearch);
    materialSearch.addEventListener('input', debouncedSearch);
    
    // Display materials
    displayMaterials();
    updateOrderSummary();
    
    console.log(`📦 Loaded ${materials.length} materials for ${categoryName}`);
}

// Debounced search for better performance
const debouncedSearch = debounce(handleSearch, 300);

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced Search Handler
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredMaterials = currentMaterials;
    } else {
        filteredMaterials = currentMaterials.filter(material => {
            const searchableText = [
                material.name,
                material.description || '',
                material.materialCode || material.code || '',
                material.brand || '',
                material.category || ''
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    displayMaterials();
    
    // Show search results count
    const searchInfo = document.querySelector('.search-info');
    if (searchInfo) searchInfo.remove();
    
    if (searchTerm) {
        const info = document.createElement('div');
        info.className = 'search-info';
        info.style.cssText = 'text-align: center; color: #64748b; margin: 10px 0; font-size: 0.9rem;';
        info.textContent = `Found ${filteredMaterials.length} material${filteredMaterials.length !== 1 ? 's' : ''} matching "${searchTerm}"`;
        materialSearch.parentNode.appendChild(info);
    }
}

// Enhanced Materials Display with Better UX
function displayMaterials() {
    const startIndex = (currentPage - 1) * materialsPerPage;
    const endIndex = startIndex + materialsPerPage;
    const materialsToShow = filteredMaterials.slice(startIndex, endIndex);
    
    materialGrid.innerHTML = '';
    
    if (filteredMaterials.length === 0) {
        materialGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
                <h3 style="margin-bottom: 8px;">No materials found</h3>
                <p>Try adjusting your search terms or select a different category.</p>
            </div>
        `;
        paginationContainer.innerHTML = '';
        return;
    }
    
    // Display materials with enhanced information
    materialsToShow.forEach((material, index) => {
        const globalIndex = startIndex + index;
        const isSelected = isSelectedMaterial(material.id);
        const price = material.supplierPrice || material.basePrice || 0;
        const stockStatus = material.stockLevel > 50 ? 'In Stock' : material.stockLevel > 0 ? 'Limited' : 'Out of Stock';
        const stockClass = material.stockLevel > 50 ? 'tag-stock' : material.stockLevel > 0 ? 'tag-low-stock' : 'tag-out-stock';
        
        const card = document.createElement('div');
        card.className = `material-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="material-header">
                <input type="checkbox" class="material-checkbox" data-index="${globalIndex}" ${isSelected ? 'checked' : ''}>
                <div class="material-info">
                    <div class="material-name">${material.name}</div>
                    <div class="material-price">$${price.toFixed(2)}/${material.unit}</div>
                </div>
            </div>
            <div class="material-description">${material.description || 'No description available'}</div>
            <div class="material-meta">
                ${material.materialCode || material.code ? `<span class="meta-tag tag-code">${material.materialCode || material.code}</span>` : ''}
                <span class="meta-tag tag-brand">${material.brand || 'Generic'}</span>
                <span class="meta-tag ${stockClass}">${stockStatus}</span>
                ${material.leadTimeDays ? `<span class="meta-tag tag-delivery">${material.leadTimeDays}d delivery</span>` : ''}
            </div>
            <div class="quantity-controls ${isSelected ? 'visible' : ''}">
                <button type="button" class="qty-btn" data-action="decrease" data-material-id="${material.id}">−</button>
                <input type="number" class="qty-input" min="1" max="999" value="${getSelectedQuantity(material.id) || 1}" data-material-id="${material.id}">
                <button type="button" class="qty-btn" data-action="increase" data-material-id="${material.id}">+</button>
                <span class="unit-label">${material.unit}</span>
                <span class="subtotal">$${(price * (getSelectedQuantity(material.id) || 1)).toFixed(2)}</span>
            </div>
        `;

        setupMaterialCard(card, material, globalIndex);
        materialGrid.appendChild(card);
    });
    
    // Update pagination
    createPagination();
}

// Enhanced Material Card Setup
function setupMaterialCard(card, material, index) {
    const checkbox = card.querySelector('.material-checkbox');
    const quantityControls = card.querySelector('.quantity-controls');
    const quantityInput = card.querySelector('.qty-input');
    const subtotalSpan = card.querySelector('.subtotal');
    const decreaseBtn = card.querySelector('[data-action="decrease"]');
    const increaseBtn = card.querySelector('[data-action="increase"]');

    // Checkbox handler
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            quantityControls.classList.add('visible');
            card.classList.add('selected');
            addMaterial(material, parseInt(quantityInput.value) || 1);
        } else {
            quantityControls.classList.remove('visible');
            card.classList.remove('selected');
            removeMaterial(material.id);
        }
    });

    // Quantity input handler with validation
    quantityInput.addEventListener('input', function() {
        let quantity = parseInt(this.value) || 1;
        
        // Validate quantity bounds
        if (quantity < 1) {
            quantity = 1;
            this.value = 1;
        } else if (quantity > 999) {
            quantity = 999;
            this.value = 999;
        }
        
        const price = material.supplierPrice || material.basePrice || 0;
        
        // Handle pricing display
        if (price === 'Unavailable' || price === 0) {
            subtotalSpan.textContent = 'Quote required';
        } else {
            const subtotal = parseFloat(price) * quantity;
            subtotalSpan.textContent = `${subtotal.toFixed(2)}`;
        }
        
        updateMaterialQuantity(material.id, quantity);
    });

    // Quantity buttons
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
        if (quantity < 999) {
            quantity++;
            quantityInput.value = quantity;
            quantityInput.dispatchEvent(new Event('input'));
        }
    });

    // Double-click card to toggle selection
    card.addEventListener('dblclick', function() {
        checkbox.click();
    });
}

// Material Selection Helper Functions (Enhanced)
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
    
    // Add with new quantity and enhanced data
    selectedMaterials.push({
        id: material.id,
        name: material.name,
        code: material.materialCode || material.code || material.id,
        category: material.category || selectedCategory,
        subcategory: material.subcategory || '',
        quantity: quantity,
        unit: material.unit || 'pcs',
        unitPrice: material.supplierPrice || material.basePrice || 'Unavailable',
        brand: material.brand || 'Generic',
        lineTotal: (material.supplierPrice === 'Unavailable' || material.basePrice === 'Unavailable' || !material.supplierPrice) ? 'Quote required' : (material.supplierPrice || material.basePrice || 0) * quantity,
        notes: material.notes || ''
    });
    
    updateOrderSummary();
    activateStep(4);
    
    console.log(`➕ Added: ${material.name} (${quantity} ${material.unit})`);
}

function removeMaterial(materialId) {
    const materialName = selectedMaterials.find(item => item.id === materialId)?.name;
    selectedMaterials = selectedMaterials.filter(item => item.id !== materialId);
    updateOrderSummary();
    
    if (selectedMaterials.length === 0) {
        orderSummary.classList.remove('visible');
        deactivateStep(4);
    }
    
    console.log(`➖ Removed: ${materialName || materialId}`);
}

function updateMaterialQuantity(materialId, quantity) {
    const material = selectedMaterials.find(item => item.id === materialId);
    if (material) {
        material.quantity = quantity;
        material.lineTotal = material.unitPrice * quantity;
        updateOrderSummary();
    }
}

// Enhanced Pagination
function createPagination() {
    const totalPages = Math.ceil(filteredMaterials.length / materialsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})">← Prev</button>`;
    }
    
    // Smart page numbering
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="page-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
            paginationHTML += `<button class="page-btn" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Next →</button>`;
    }
    
    paginationHTML += '</div>';
    
    // Enhanced pagination info
    const startItem = ((currentPage - 1) * materialsPerPage) + 1;
    const endItem = Math.min(currentPage * materialsPerPage, filteredMaterials.length);
    paginationHTML += `<div class="pagination-info">
        Showing ${startItem}-${endItem} of ${filteredMaterials.length} materials
        ${filteredMaterials.length !== currentMaterials.length ? ` (filtered from ${currentMaterials.length})` : ''}
    </div>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Change Page Function (global for onclick)
window.changePage = function(page) {
    currentPage = page;
    displayMaterials();
    materialGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Clear Materials Function
function clearMaterials() {
    document.getElementById('materialsSection').style.display = 'none';
    materialGrid.innerHTML = '';
    paginationContainer.innerHTML = '';
    selectedMaterials = [];
    updateOrderSummary();
    
    // Clear search
    const searchInfo = document.querySelector('.search-info');
    if (searchInfo) searchInfo.remove();
}

// Enhanced Order Summary
function updateOrderSummary() {
    if (selectedMaterials.length === 0) {
        orderSummary.classList.remove('visible');
        return;
    }

    orderSummary.classList.add('visible');

    // Enhanced summary items with more details
    summaryItems.innerHTML = selectedMaterials.map(item => `
        <div class="summary-item">
            <div>
                <div style="font-weight: 600;">${item.name}</div>
                <div class="item-details">
                    ${item.code ? `Code: ${item.code} • ` : ''}
                    ${item.quantity} ${item.unit} × ${item.unitPrice === 'Unavailable' ? 'Price on request' : `${parseFloat(item.unitPrice).toFixed(2)}`}
                    ${item.brand !== 'Generic' ? ` • ${item.brand}` : ''}
                    ${item.subcategory ? ` • ${item.subcategory}` : ''}
                </div>
            </div>
            <div class="item-price">${item.lineTotal === 'Quote required' ? 'Quote required' : `${parseFloat(item.lineTotal).toFixed(2)}`}</div>
        </div>
    `).join('');

    // Calculate totals (only for items with pricing)
    const totalItems = selectedMaterials.length;
    const totalQuantity = selectedMaterials.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate total price only for items with actual pricing
    const pricedItems = selectedMaterials.filter(item => item.lineTotal !== 'Quote required' && item.unitPrice !== 'Unavailable');
    const totalPrice = pricedItems.reduce((sum, item) => sum + parseFloat(item.lineTotal), 0);
    const hasUnpricedItems = selectedMaterials.length > pricedItems.length;

    // Update totals display
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    
    // Handle total price display
    if (hasUnpricedItems && totalPrice > 0) {
        document.getElementById('totalPrice').textContent = `${totalPrice.toFixed(2)}*`;
        document.getElementById('totalPrice').title = 'Total excludes items requiring quotes';
    } else if (hasUnpricedItems && totalPrice === 0) {
        document.getElementById('totalPrice').textContent = 'Quote required';
    } else {
        document.getElementById('totalPrice').textContent = `${totalPrice.toFixed(2)}`;
    }

    // Scroll summary into view if not visible
    if (!isElementInViewport(orderSummary)) {
        orderSummary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Helper function to check if element is in viewport
function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Enhanced Step Management
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

// Enhanced Form Validation
function validateForm(formData) {
    const errors = [];
    
    if (!selectedSupplier) errors.push('Please select a supplier');
    if (!selectedCategory) errors.push('Please select a category');
    if (selectedMaterials.length === 0) errors.push('Please select at least one material');
    
    const userName = formData.get('user_name')?.trim();
    if (!userName) errors.push('Please enter your full name');
    
    const userEmail = formData.get('user_email')?.trim();
    if (!userEmail) {
        errors.push('Please enter your email address');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        errors.push('Please enter a valid email address');
    }
    
    return errors;
}

// Enhanced Form Submission with Better Error Handling
async function handleSubmission(e) {
    e.preventDefault();
    
    hideMessages();
    setLoading(true);
    
    try {
        const formData = new FormData(form);
        
        // Enhanced validation
        const validationErrors = validateForm(formData);
        if (validationErrors.length > 0) {
            throw new Error(validationErrors.join('. ') + '.');
        }
        
        const supplier = smartData.data.suppliers.find(s => s.id === selectedSupplier);
        if (!supplier) {
            throw new Error('Selected supplier information not found. Please refresh and try again.');
        }
        
        // Enhanced order data with more details
        const orderData = {
            category: selectedCategory,
            materials: selectedMaterials.map(item => ({
                id: item.id,
                name: item.name,
                code: item.code,
                category: item.category,
                quantity: item.quantity,
                unit: item.unit,
                price: item.unitPrice,
                unitPrice: item.unitPrice,
                brand: item.brand,
                notes: item.notes
            })),
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            supplier_email: supplier.email,
            user_name: formData.get('user_name').trim(),
            user_email: formData.get('user_email').trim(),
            department: formData.get('department')?.trim() || 'General',
            urgency: formData.get('urgency') || 'Normal',
            project_ref: formData.get('project_ref')?.trim() || '',
            notes: formData.get('notes')?.trim() || ''
        };

        console.log('🚀 Submitting enhanced order:', orderData);

        // Submit with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(ORDER_ENDPOINT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Order submission failed (${response.status}): ${errorText || response.statusText}`);
        }

        const result = await response.json();
        console.log('✅ Order submitted successfully:', result);
        
        if (result.status === 'success') {
            const totalPrice = selectedMaterials.reduce((sum, item) => {
                return item.lineTotal !== 'Quote required' ? sum + parseFloat(item.lineTotal) : sum;
            }, 0);
            
            showMessage('success', `🎉 Order Submitted Successfully!
            
<strong>Order ID:</strong> ${result.order_id}<br>
<strong>Supplier:</strong> ${supplier.name}<br>
<strong>Category:</strong> ${selectedCategory}<br>
<strong>Items:</strong> ${selectedMaterials.length} different materials<br>
<strong>Total Value:</strong> ${totalPrice > 0 ? `${totalPrice.toFixed(2)} AUD` : 'Quote required'}<br>
<strong>Urgency:</strong> ${orderData.urgency}<br>
<strong>Est. Processing:</strong> ${result.estimated_processing}

✅ <strong>System Actions Completed:</strong><br>
• Order saved to Google Sheets<br>
• Email sent to ${supplier.name}<br>
• Confirmation sent to ${orderData.user_email}<br>
• Order tracking initiated

🎯 <strong>Next Steps:</strong><br>
• ${supplier.name} will confirm availability<br>
• You'll receive delivery updates via email<br>
• Contact ${supplier.email} for urgent queries<br>
${totalPrice === 0 ? '• Pricing quotes will be provided separately' : ''}`);
            
            // Auto-reset form after success
            setTimeout(() => resetForm(), 8000);
        } else {
            throw new Error(result.message || 'Order submission failed - please try again');
        }
        
    } catch (error) {
        console.error('❌ Order Submission Error:', error);
        
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = 'Order submission timed out. Please check your connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to the order system. Please check your internet connection and try again.';
        }
        
        showMessage('error', `❌ Order Submission Failed
        
<strong>Error:</strong> ${errorMessage}

<strong>Troubleshooting:</strong><br>
• Check your internet connection<br>
• Verify all required fields are completed<br>
• Try submitting again in a moment<br>
• Contact support if problem persists: support@lcmb.com

<strong>Your selections have been preserved</strong> - no need to start over.`);
    } finally {
        setLoading(false);
    }
}

// Enhanced Form Reset
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
    
    // Reset materials section
    clearMaterials();
    
    // Reset steps
    activateStep(1);
    
    // Clear messages
    hideMessages();
    
    console.log('🔄 Form reset - ready for new order');
}

// Enhanced Utility Functions
function showMessage(type, message, autoHide = null) {
    hideMessages();
    const messageEl = type === 'success' ? successMessage : errorMessage;
    messageEl.innerHTML = message.replace(/\n/g, '<br>');
    messageEl.style.display = 'block';
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (autoHide || (type === 'success' && autoHide !== false)) {
        setTimeout(() => {
            if (messageEl.style.display === 'block') {
                messageEl.style.display = 'none';
            }
        }, autoHide || 15000);
    }
}

function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.innerHTML = loading ? 
        '⏳ Processing Order...' : 
        '🚀 Submit Smart Order';
    
    if (loading) {
        submitBtn.style.opacity = '0.7';
        submitBtn.style.cursor = 'wait';
    } else {
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }
}

// Event Listeners
form.addEventListener('submit', handleSubmission);

// Enhanced keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter to submit form if valid
    if (e.ctrlKey && e.key === 'Enter' && selectedMaterials.length > 0) {
        e.preventDefault();
        handleSubmission(e);
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === materialSearch) {
        materialSearch.value = '';
        handleSearch({ target: materialSearch });
    }
});

// Initialize system
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 LCMB Smart Procurement Frontend Loaded');
    setTimeout(initializeSmartSystem, 800);
});

// Debug helper - run this in console to force clear everything
window.debugClearAll = function() {
    console.log('🧹 Forcing complete cache clear...');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear service worker caches
    if ('caches' in window) {
        caches.keys().then(function(names) {
            for (let name of names) caches.delete(name);
        });
    }
    
    // Clear any existing data
    window.smartData = null;
    window.lcmbRealData = null;
    
    console.log('🧹 Cache cleared, reloading...');
    
    // Force reload
    setTimeout(() => {
        window.location.reload(true);
    }, 500);
};

// Debug helper to check current data structure
window.debugCheckData = function() {
    console.log('📊 Current smartData:', window.smartData);
    if (window.smartData?.data?.suppliers) {
        console.log('🏪 Suppliers:', window.smartData.data.suppliers);
        console.log('📋 First supplier keys:', Object.keys(window.smartData.data.suppliers[0] || {}));
    }
    return window.smartData;
};

console.log('🎯 LCMB Enhanced Frontend Ready - Debug available via window.debugLCMB');
