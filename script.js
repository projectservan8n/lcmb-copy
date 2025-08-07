// Enhanced script.js with Order Confirmation Step
class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        this.filteredMaterials = [];
        this.selectedSubcategory = '';
        this.currentStep = 'form'; // 'form' or 'confirmation'
    }

    init() {
        console.log('🚀 Initializing Enhanced LCMB Material Management App with Confirmation');
        
        // Check if server already loaded data
        if (window.INITIAL_FORM_DATA) {
            console.log('📊 Using initial form data from server');
            this.formData = window.INITIAL_FORM_DATA;
            this.populateForm(window.INITIAL_FORM_DATA);
        } else if (window.INITIAL_LOAD_ERROR) {
            console.error('❌ Initial data load failed:', window.INITIAL_LOAD_ERROR);
            this.showError('Failed to load initial data: ' + window.INITIAL_LOAD_ERROR);
        } else {
            console.log('🔄 No initial data found, loading from API...');
            this.loadFormData();
        }
        
        this.setupEventListeners();
        this.validateForm();
    }

    setupEventListeners() {
        try {
            console.log('⚙️ Setting up enhanced event listeners...');
            
            // Request type change
            const requestTypeInputs = document.querySelectorAll('input[name="requestType"]');
            if (requestTypeInputs && requestTypeInputs.length > 0) {
                requestTypeInputs.forEach(input => {
                    if (input) {
                        input.addEventListener('change', () => this.handleRequestTypeChange());
                    }
                });
            }

            // Category change
            const categorySelect = document.getElementById('category');
            if (categorySelect) {
                categorySelect.addEventListener('change', () => this.handleCategoryChange());
            }

            // Supplier change
            const supplierSelect = document.getElementById('supplier');
            if (supplierSelect) {
                supplierSelect.addEventListener('change', () => this.handleSupplierChange());
            }

            // Subcategory change
            const subcategorySelect = document.getElementById('subcategory');
            if (subcategorySelect) {
                subcategorySelect.addEventListener('change', () => this.handleSubcategoryChange());
            }

            // Material search
            const materialSearch = document.getElementById('materialSearch');
            if (materialSearch) {
                materialSearch.addEventListener('input', () => this.handleMaterialSearch());
            }

            // Form submission
            const form = document.getElementById('materialForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e));
                
                // Form validation on input changes
                const formInputs = form.querySelectorAll('input, select, textarea');
                if (formInputs && formInputs.length > 0) {
                    formInputs.forEach(input => {
                        if (input) {
                            input.addEventListener('change', () => this.validateForm());
                            input.addEventListener('input', () => this.validateForm());
                        }
                    });
                }
            }
            
            console.log('✅ Enhanced event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    async loadFormData() {
        try {
            this.showLoading(true);
            console.log('🔄 Loading form data from API...');
            
            const response = await fetch('/api/data/load');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Form data loaded from API:', data);
            
            if (data.success !== false) {
                this.formData = data;
                this.populateForm(data);
            } else {
                this.showError('Failed to load form data: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error loading form data:', error);
            this.showError('Unable to load form data. Please check your connection and try again.');
        } finally {
            this.showLoading(false);
        }
    }

    populateForm(data) {
        try {
            if (!data?.data) {
                console.warn('⚠️ No data to populate form with');
                return;
            }

            console.log('📋 Populating enhanced form with data:', {
                suppliers: data.data.suppliers?.length || 0,
                categories: data.data.categories?.length || 0,
                materials: Object.keys(data.data.materials || {}).length
            });

            // Populate categories
            const categorySelect = document.getElementById('category');
            if (categorySelect && data.data.categories) {
                categorySelect.innerHTML = '<option value="">Select a category...</option>';
                data.data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = category.name;
                    if (category.description) {
                        option.dataset.description = category.description;
                    }
                    categorySelect.appendChild(option);
                });
                console.log(`✅ Populated ${data.data.categories.length} categories`);
            }

            this.showLoading(false);
        } catch (error) {
            console.error('❌ Error populating form:', error);
            this.showError('Error setting up form: ' + error.message);
        }
    }

    handleRequestTypeChange() {
        try {
            const selectedType = document.querySelector('input[name="requestType"]:checked')?.value;
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            
            if (!selectedType || !submitBtn || !btnText) return;
            
            if (selectedType === 'order') {
                btnText.textContent = 'Review Order';
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%)';
            } else {
                btnText.textContent = 'Review Quote Request';
                submitBtn.style.background = 'linear-gradient(135deg, var(--warning-orange) 0%, #f59e0b 100%)';
            }
        } catch (error) {
            console.error('❌ Error handling request type change:', error);
        }
    }

    handleCategoryChange() {
        try {
            const categorySelect = document.getElementById('category');
            const supplierSelect = document.getElementById('supplier');
            
            if (!categorySelect) return;
            
            const selectedCategory = categorySelect.value;
            console.log('📂 Category changed to:', selectedCategory);
            
            // Reset dependent fields
            if (supplierSelect) {
                supplierSelect.innerHTML = '<option value="">Select a supplier...</option>';
            }
            this.resetMaterialSelection();
            this.hideSupplierInfo();

            if (!selectedCategory || !this.formData?.data) {
                this.validateForm();
                return;
            }

            // Populate suppliers for selected category
            const suppliers = this.formData.data.suppliersByCategory?.[selectedCategory] || [];
            
            if (suppliers.length === 0 && this.formData.data.suppliers) {
                // Fallback: show suppliers that match the category
                const allSuppliers = this.formData.data.suppliers;
                allSuppliers.forEach(supplier => {
                    if (supplier.specialties?.some(specialty => 
                        specialty.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                        selectedCategory.toLowerCase().includes(specialty.toLowerCase())
                    )) {
                        this.addSupplierOption(supplierSelect, supplier);
                    }
                });
            } else {
                console.log(`✅ Found ${suppliers.length} suppliers for category ${selectedCategory}`);
                suppliers.forEach(supplier => {
                    this.addSupplierOption(supplierSelect, supplier);
                });
            }

            this.validateForm();
        } catch (error) {
            console.error('❌ Error handling category change:', error);
        }
    }

    addSupplierOption(supplierSelect, supplier) {
        if (!supplierSelect || !supplier) return;
        
        const option = document.createElement('option');
        option.value = supplier.name;
        option.dataset.email = supplier.email || '';
        option.dataset.phone = supplier.phone || '';
        option.dataset.id = supplier.id || '';
        option.textContent = supplier.name;
        supplierSelect.appendChild(option);
    }

    handleSupplierChange() {
        try {
            const supplierSelect = document.getElementById('supplier');
            const categorySelect = document.getElementById('category');
            
            if (!supplierSelect) return;
            
            const selectedSupplier = supplierSelect.value;
            const selectedCategory = categorySelect?.value;
            console.log('🏢 Supplier changed to:', selectedSupplier);
            
            // Reset material selection
            this.resetMaterialSelection();

            if (!selectedSupplier) {
                this.hideSupplierInfo();
                this.validateForm();
                return;
            }

            // Show supplier info
            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                this.showSupplierInfo(selectedOption);
            }

            // Populate subcategories for selected category
            if (selectedCategory && this.formData?.data?.materials?.[selectedCategory]) {
                this.populateSubcategories(selectedCategory);
            }

            this.validateForm();
        } catch (error) {
            console.error('❌ Error handling supplier change:', error);
        }
    }

    populateSubcategories(category) {
        try {
            const subcategorySelect = document.getElementById('subcategory');
            if (!subcategorySelect) return;

            const materials = this.formData.data.materials[category] || [];
            const subcategories = [...new Set(materials.map(m => m.subcategory).filter(sub => sub))];
            
            subcategorySelect.innerHTML = '<option value="">All subcategories</option>';
            subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory;
                option.textContent = subcategory;
                subcategorySelect.appendChild(option);
            });

            // Show subcategory dropdown
            const subcategoryGroup = document.getElementById('subcategoryGroup');
            if (subcategoryGroup) {
                subcategoryGroup.style.display = 'block';
            }

            // Enable material search and populate all materials initially
            this.populateMaterials(category, '');
            
        } catch (error) {
            console.error('❌ Error populating subcategories:', error);
        }
    }

    handleSubcategoryChange() {
        try {
            const subcategorySelect = document.getElementById('subcategory');
            const categorySelect = document.getElementById('category');
            
            if (!subcategorySelect || !categorySelect) return;
            
            const selectedSubcategory = subcategorySelect.value;
            const selectedCategory = categorySelect.value;
            
            this.selectedSubcategory = selectedSubcategory;
            console.log('📁 Subcategory changed to:', selectedSubcategory || 'All');
            
            // Repopulate materials based on subcategory
            this.populateMaterials(selectedCategory, selectedSubcategory);
            
        } catch (error) {
            console.error('❌ Error handling subcategory change:', error);
        }
    }

    populateMaterials(category, subcategory = '') {
        try {
            const materialSearch = document.getElementById('materialSearch');
            const materialsContainer = document.getElementById('materialsContainer');
            
            if (!category || !this.formData?.data?.materials?.[category]) return;

            let materials = this.formData.data.materials[category];
            
            // Filter by subcategory if selected
            if (subcategory) {
                materials = materials.filter(m => m.subcategory === subcategory);
            }

            this.filteredMaterials = materials;
            
            // Enable search and show materials container
            if (materialSearch) {
                materialSearch.disabled = false;
                materialSearch.placeholder = `Search from ${materials.length} materials...`;
            }
            
            if (materialsContainer) {
                materialsContainer.style.display = 'block';
            }

            // Render materials with checkbox approach
            this.renderMaterialsList();
            
            console.log(`📦 Populated ${materials.length} materials for ${category}${subcategory ? ` > ${subcategory}` : ''}`);
            
        } catch (error) {
            console.error('❌ Error populating materials:', error);
        }
    }

    handleMaterialSearch() {
        try {
            const materialSearch = document.getElementById('materialSearch');
            if (!materialSearch) return;
            
            const searchTerm = materialSearch.value.toLowerCase();
            console.log('🔍 Searching materials:', searchTerm);
            
            this.renderMaterialsList(searchTerm);
            
        } catch (error) {
            console.error('❌ Error handling material search:', error);
        }
    }

    renderMaterialsList(searchTerm = '') {
        try {
            const materialsList = document.getElementById('materialsList');
            if (!materialsList) return;

            let materialsToShow = this.filteredMaterials;

            // Apply search filter
            if (searchTerm) {
                materialsToShow = this.filteredMaterials.filter(material => 
                    material.name.toLowerCase().includes(searchTerm) ||
                    material.code.toLowerCase().includes(searchTerm) ||
                    material.subcategory.toLowerCase().includes(searchTerm)
                );
            }

            // Limit results for performance
            const maxResults = 100;
            const displayMaterials = materialsToShow.slice(0, maxResults);

            if (displayMaterials.length === 0) {
                materialsList.innerHTML = `
                    <div class="no-materials">
                        <p>No materials found${searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                        ${searchTerm ? '<p>Try a different search term.</p>' : ''}
                    </div>
                `;
                return;
            }

            // Grid-based material cards with full clickability
            materialsList.innerHTML = displayMaterials.map(material => {
                const isSelected = this.selectedMaterials.some(m => m.id === material.id);
                return `
                    <div class="material-card ${isSelected ? 'selected' : ''}" data-material-id="${material.id}">
                        <div class="material-card-header">
                            <div class="material-checkbox-section">
                                <input type="checkbox" 
                                       class="material-checkbox" 
                                       data-material-id="${material.id}"
                                       ${isSelected ? 'checked' : ''}>
                                <span class="checkbox-custom"></span>
                            </div>
                            <div class="material-status">
                                ${isSelected ? '<span class="selected-badge">✓ Selected</span>' : '<span class="select-badge">Click to Select</span>'}
                            </div>
                        </div>
                        <div class="material-card-body">
                            <div class="material-name">${material.name}</div>
                            <div class="material-meta">
                                ${material.code ? `<span class="material-code">Code: ${material.code}</span>` : ''}
                                <span class="material-unit">Unit: ${material.unit}</span>
                                <span class="material-category">${material.subcategory}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add event listeners to entire cards for clickability
            materialsList.querySelectorAll('.material-card').forEach(card => {
                const materialId = card.dataset.materialId;
                const checkbox = card.querySelector('.material-checkbox');
                
                // Make entire card clickable
                card.addEventListener('click', (e) => {
                    // Don't trigger if clicking directly on checkbox (prevent double toggle)
                    if (e.target.type === 'checkbox') return;
                    
                    // Toggle checkbox
                    checkbox.checked = !checkbox.checked;
                    
                    // Trigger change event
                    if (checkbox.checked) {
                        this.addMaterialById(materialId, 1);
                        card.classList.add('selected');
                    } else {
                        this.removeMaterialById(materialId);
                        card.classList.remove('selected');
                    }
                    
                    // Update status badge
                    const statusBadge = card.querySelector('.material-status');
                    if (checkbox.checked) {
                        statusBadge.innerHTML = '<span class="selected-badge">✓ Selected</span>';
                    } else {
                        statusBadge.innerHTML = '<span class="select-badge">Click to Select</span>';
                    }
                });

                // Also handle direct checkbox clicks
                checkbox.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    
                    if (isChecked) {
                        this.addMaterialById(materialId, 1);
                        card.classList.add('selected');
                        card.querySelector('.material-status').innerHTML = '<span class="selected-badge">✓ Selected</span>';
                    } else {
                        this.removeMaterialById(materialId);
                        card.classList.remove('selected');
                        card.querySelector('.material-status').innerHTML = '<span class="select-badge">Click to Select</span>';
                    }
                });
            });

            // Show result count
            const resultInfo = document.getElementById('materialsResultInfo');
            if (resultInfo) {
                resultInfo.textContent = `Showing ${displayMaterials.length}${materialsToShow.length > maxResults ? ` of ${materialsToShow.length}` : ''} materials`;
            }

        } catch (error) {
            console.error('❌ Error rendering materials list:', error);
        }
    }

    addMaterialById(materialId, quantity = 1) {
        try {
            const material = this.filteredMaterials.find(m => m.id === materialId);
            if (!material) {
                this.showError('Material not found.');
                return;
            }

            // Check if material already selected
            const existingIndex = this.selectedMaterials.findIndex(m => m.id === materialId);
            if (existingIndex !== -1) {
                // Material already exists, don't add again (checkbox prevents this)
                return;
            }

            // Add new material with default quantity
            const newMaterial = {
                id: material.id,
                name: material.name,
                code: material.code || '',
                unit: material.unit || 'pcs',
                subcategory: material.subcategory || '',
                quantity: quantity,
                supplierId: material.supplierId,
                supplierName: material.supplierName
            };

            this.selectedMaterials.push(newMaterial);
            console.log(`✅ Added material: ${material.name} (${quantity} ${material.unit})`);

            this.renderSelectedMaterials();
            this.validateForm();
            
        } catch (error) {
            console.error('❌ Error adding material:', error);
        }
    }

    removeMaterialById(materialId) {
        try {
            const index = this.selectedMaterials.findIndex(m => m.id === materialId);
            if (index !== -1) {
                const removed = this.selectedMaterials.splice(index, 1)[0];
                console.log('➖ Removed material:', removed.name);
                this.renderSelectedMaterials();
                this.validateForm();
            }
        } catch (error) {
            console.error('❌ Error removing material by ID:', error);
        }
    }

    renderSelectedMaterials() {
        try {
            const container = document.getElementById('selectedMaterials');
            if (!container) return;
            
            if (this.selectedMaterials.length === 0) {
                container.innerHTML = '<div class="no-selection">No materials selected yet...</div>';
                return;
            }

            container.innerHTML = this.selectedMaterials.map((material, index) => `
                <div class="selected-material-item" data-index="${index}">
                    <div class="material-info">
                        <div class="material-name">${material.name}</div>
                        <div class="material-meta">
                            ${material.code ? `Code: ${material.code} • ` : ''}
                            Unit: ${material.unit} • 
                            ${material.subcategory}
                        </div>
                    </div>
                    <div class="material-controls">
                        <div class="quantity-controls">
                            <button type="button" class="qty-btn minus" onclick="window.app.updateQuantity(${index}, -1)" ${material.quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="quantity-display">${material.quantity} ${material.unit}</span>
                            <button type="button" class="qty-btn plus" onclick="window.app.updateQuantity(${index}, 1)">+</button>
                        </div>
                        <button type="button" class="remove-material" onclick="window.app.removeMaterial(${index})">
                            Remove
                        </button>
                    </div>
                </div>
            `).join('');

            // Update summary
            const totalItems = this.selectedMaterials.length;
            const totalQuantity = this.selectedMaterials.reduce((sum, m) => sum + m.quantity, 0);
            
            const summary = document.getElementById('materialsSummary');
            if (summary) {
                summary.innerHTML = `
                    <strong>${totalItems} unique materials, ${totalQuantity} total items</strong>
                `;
            }
        } catch (error) {
            console.error('❌ Error rendering selected materials:', error);
        }
    }

    updateQuantity(index, change) {
        try {
            if (index >= 0 && index < this.selectedMaterials.length) {
                const newQuantity = this.selectedMaterials[index].quantity + change;
                if (newQuantity >= 1) {  // Don't allow quantity to go below 1
                    this.selectedMaterials[index].quantity = newQuantity;
                    console.log(`🔄 Updated quantity for ${this.selectedMaterials[index].name}: ${newQuantity}`);
                    this.renderSelectedMaterials();
                    this.validateForm();
                }
            }
        } catch (error) {
            console.error('❌ Error updating quantity:', error);
        }
    }

    removeMaterial(index) {
        try {
            if (index >= 0 && index < this.selectedMaterials.length) {
                const removed = this.selectedMaterials.splice(index, 1)[0];
                console.log('➖ Removed material:', removed.name);
                
                // Uncheck the corresponding checkbox in the materials list
                const checkbox = document.querySelector(`.material-checkbox[data-material-id="${removed.id}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                }
                
                this.renderSelectedMaterials();
                this.validateForm();
            }
        } catch (error) {
            console.error('❌ Error removing material:', error);
        }
    }

    resetMaterialSelection() {
        try {
            const subcategorySelect = document.getElementById('subcategory');
            const materialSearch = document.getElementById('materialSearch');
            const materialsContainer = document.getElementById('materialsContainer');
            
            // Hide and reset subcategory
            const subcategoryGroup = document.getElementById('subcategoryGroup');
            if (subcategoryGroup) {
                subcategoryGroup.style.display = 'none';
            }
            if (subcategorySelect) {
                subcategorySelect.innerHTML = '<option value="">All subcategories</option>';
            }
            
            // Reset material search and container
            if (materialSearch) {
                materialSearch.value = '';
                materialSearch.disabled = true;
                materialSearch.placeholder = 'Select category and supplier first...';
            }
            
            if (materialsContainer) {
                materialsContainer.style.display = 'none';
            }

            // Clear filtered materials and selected materials
            this.filteredMaterials = [];
            this.selectedMaterials = [];
            this.selectedSubcategory = '';
            
            // Update display
            this.renderSelectedMaterials();
            
        } catch (error) {
            console.error('❌ Error resetting material selection:', error);
        }
    }

    showSupplierInfo(supplierOption) {
        try {
            const supplierInfo = document.getElementById('supplierInfo');
            const supplierEmail = document.getElementById('supplierEmail');
            const supplierPhone = document.getElementById('supplierPhone');

            if (supplierOption && supplierInfo && supplierEmail && supplierPhone) {
                supplierEmail.textContent = `📧 ${supplierOption.dataset.email || 'N/A'}`;
                supplierPhone.textContent = `📞 ${supplierOption.dataset.phone || 'N/A'}`;
                supplierInfo.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Error showing supplier info:', error);
        }
    }

    hideSupplierInfo() {
        try {
            const supplierInfo = document.getElementById('supplierInfo');
            if (supplierInfo) {
                supplierInfo.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Error hiding supplier info:', error);
        }
    }

    validateForm() {
        try {
            const form = document.getElementById('materialForm');
            const submitBtn = document.getElementById('submitBtn');
            
            if (!form || !submitBtn) return;

            const requiredFields = ['category', 'supplier', 'requestorName', 'requestorEmail'];
            let isValid = true;

            // Check required fields
            for (const fieldName of requiredFields) {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    isValid = false;
                    break;
                }
            }

            // Check materials
            if (this.selectedMaterials.length === 0) {
                isValid = false;
            }

            // Check email format
            const emailField = form.querySelector('[name="requestorEmail"]');
            if (emailField && emailField.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailField.value)) {
                    isValid = false;
                }
            }

            submitBtn.disabled = !isValid;
        } catch (error) {
            console.error('❌ Error validating form:', error);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            if (this.currentStep === 'form') {
                // Show confirmation step instead of submitting
                this.showConfirmation();
            } else {
                // Actually submit the form
                await this.submitForm();
            }
        } catch (error) {
            console.error('❌ Form submission error:', error);
            this.showError(`Submission failed: ${error.message}`);
        }
    }

    showConfirmation() {
        try {
            console.log('📋 Showing order confirmation');
            
            const form = document.getElementById('materialForm');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Store current form state for restoration later
            this.lastSelectedCategory = data.category;
            this.lastSelectedSupplier = data.supplier;
            this.lastRequestorName = data.requestorName;
            this.lastRequestorEmail = data.requestorEmail;
            this.lastUrgency = data.urgency;
            this.lastProjectRef = data.projectRef;
            this.lastNotes = data.notes;
            
            // Get supplier details
            const supplierSelect = document.getElementById('supplier');
            const selectedSupplierOption = supplierSelect.selectedOptions[0];
            const supplierEmail = selectedSupplierOption?.dataset.email || '';
            const supplierPhone = selectedSupplierOption?.dataset.phone || '';
            
            // Create confirmation view
            this.renderConfirmation({
                requestType: data.requestType,
                category: data.category,
                supplier: data.supplier,
                supplierEmail: supplierEmail,
                supplierPhone: supplierPhone,
                requestorName: data.requestorName,
                requestorEmail: data.requestorEmail,
                urgency: data.urgency,
                projectRef: data.projectRef,
                notes: data.notes,
                materials: this.selectedMaterials
            });
            
            this.currentStep = 'confirmation';
            
        } catch (error) {
            console.error('❌ Error showing confirmation:', error);
        }
    }

    renderConfirmation(orderData) {
        try {
            const mainForm = document.getElementById('mainForm');
            if (!mainForm) return;

            // Calculate totals
            const totalItems = this.selectedMaterials.length;
            const totalQuantity = this.selectedMaterials.reduce((sum, m) => sum + m.quantity, 0);
            
            // Create confirmation HTML
            const confirmationHTML = `
                <div class="form-header">
                    <h2>📋 ${orderData.requestType === 'order' ? 'Order' : 'Quote'} Confirmation</h2>
                    <p>Please review all details before submitting your ${orderData.requestType}</p>
                </div>

                <div class="confirmation-container">
                    <!-- Order Summary -->
                    <div class="confirmation-section">
                        <h3>📦 ${orderData.requestType === 'order' ? 'Order' : 'Quote'} Summary</h3>
                        <div class="confirmation-grid">
                            <div class="confirmation-item">
                                <label>Request Type:</label>
                                <span class="value ${orderData.requestType}">${orderData.requestType === 'order' ? '📦 Material Order' : '💬 Quote Request'}</span>
                            </div>
                            <div class="confirmation-item">
                                <label>Category:</label>
                                <span class="value">${orderData.category}</span>
                            </div>
                            <div class="confirmation-item">
                                <label>Priority Level:</label>
                                <span class="value priority-${orderData.urgency.toLowerCase()}">${orderData.urgency}</span>
                            </div>
                            ${orderData.projectRef ? `
                            <div class="confirmation-item">
                                <label>ServiceM8 Job #:</label>
                                <span class="value">${orderData.projectRef}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Supplier Information -->
                    <div class="confirmation-section">
                        <h3>🏢 Supplier Information</h3>
                        <div class="supplier-confirmation">
                            <div class="supplier-main">
                                <strong>${orderData.supplier}</strong>
                            </div>
                            <div class="supplier-details">
                                <span>📧 ${orderData.supplierEmail}</span>
                                ${orderData.supplierPhone ? `<span>📞 ${orderData.supplierPhone}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Materials List -->
                    <div class="confirmation-section">
                        <h3>📋 Materials ${orderData.requestType === 'order' ? 'to Order' : 'for Quote'}</h3>
                        <div class="materials-confirmation-summary">
                            <strong>${totalItems} unique materials • ${totalQuantity} total items</strong>
                        </div>
                        <div class="materials-confirmation-list">
                            ${this.selectedMaterials.map((material, index) => `
                                <div class="material-confirmation-item">
                                    <div class="material-number">${index + 1}.</div>
                                    <div class="material-details">
                                        <div class="material-name">${material.name}</div>
                                        <div class="material-meta">
                                            ${material.code ? `Code: ${material.code} • ` : ''}
                                            Category: ${material.subcategory} • 
                                            Quantity: <strong>${material.quantity} ${material.unit}</strong>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Requestor Information -->
                    <div class="confirmation-section">
                        <h3>👤 Requestor Information</h3>
                        <div class="confirmation-grid">
                            <div class="confirmation-item">
                                <label>Name:</label>
                                <span class="value">${orderData.requestorName}</span>
                            </div>
                            <div class="confirmation-item">
                                <label>Email:</label>
                                <span class="value">${orderData.requestorEmail}</span>
                            </div>
                        </div>
                    </div>

                    ${orderData.notes ? `
                    <!-- Special Instructions -->
                    <div class="confirmation-section">
                        <h3>📝 Special Instructions</h3>
                        <div class="notes-confirmation">
                            ${orderData.notes}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="confirmation-actions">
                        <button type="button" class="btn btn-secondary" id="backToFormBtn">
                            ← Back to Edit ${orderData.requestType === 'order' ? 'Order' : 'Quote'}
                        </button>
                        <button type="button" class="btn btn-primary" id="confirmSubmitBtn">
                            ${orderData.requestType === 'order' ? '✅ Submit Order' : '✅ Submit Quote Request'}
                        </button>
                    </div>
                </div>
            `;

            // Replace form content with confirmation
            mainForm.innerHTML = confirmationHTML;

            // Add event listeners for confirmation actions
            const backBtn = document.getElementById('backToFormBtn');
            const confirmBtn = document.getElementById('confirmSubmitBtn');

            if (backBtn) {
                backBtn.addEventListener('click', () => this.backToForm());
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => this.submitForm());
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('❌ Error rendering confirmation:', error);
        }
    }

    backToForm() {
        try {
            console.log('🔙 Going back to form while preserving data');
            
            // Store the current state
            this.currentStep = 'form';
            
            // Restore the original form HTML structure
            this.restoreOriginalForm();
            
            // Re-populate all form fields with current data
            this.restoreFormData();
            
            // Re-setup event listeners
            this.setupEventListeners();
            
            // Re-validate the form
            this.validateForm();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error going back to form:', error);
            // Fallback to reload if something goes wrong
            location.reload();
        }
    }

    restoreOriginalForm() {
        try {
            const mainForm = document.getElementById('mainForm');
            if (!mainForm) return;

            // Restore the original form HTML
            const originalFormHTML = `
                <div class="form-header">
                    <h2>Submit Material Request</h2>
                    <p>Select your request type and fill in the details below</p>
                </div>

                <form id="materialForm" class="material-form">
                    <!-- Request Type -->
                    <div class="form-group">
                        <label class="form-label">Request Type *</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="requestType" value="order" checked>
                                <span class="radio-custom"></span>
                                <div class="radio-content">
                                    <strong>Material Order</strong>
                                    <p>Place an order for immediate delivery</p>
                                </div>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="requestType" value="quote">
                                <span class="radio-custom"></span>
                                <div class="radio-content">
                                    <strong>Quote Request</strong>
                                    <p>Request pricing information</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Category -->
                    <div class="form-group">
                        <label for="category" class="form-label">Category *</label>
                        <select id="category" name="category" class="form-select" required>
                            <option value="">Select a category...</option>
                        </select>
                    </div>

                    <!-- Supplier -->
                    <div class="form-group">
                        <label for="supplier" class="form-label">Supplier *</label>
                        <select id="supplier" name="supplier" class="form-select" required>
                            <option value="">First select a category...</option>
                        </select>
                        <div id="supplierInfo" class="supplier-info" style="display: none;">
                            <div class="supplier-details">
                                <span id="supplierEmail"></span>
                                <span id="supplierPhone"></span>
                            </div>
                        </div>
                    </div>

                    <!-- Subcategory (Hidden initially) -->
                    <div class="form-group" id="subcategoryGroup" style="display: none;">
                        <label for="subcategory" class="form-label">Subcategory</label>
                        <select id="subcategory" name="subcategory" class="form-select">
                            <option value="">All subcategories</option>
                        </select>
                    </div>

                    <!-- Enhanced Materials Selection -->
                    <div class="form-group">
                        <label class="form-label">Materials Required *</label>
                        <p class="form-help-text">Browse materials and specify the quantities you need for your order.</p>
                        
                        <!-- Materials Search and List Container -->
                        <div id="materialsContainer" class="materials-selection-container" style="display: none;">
                            <!-- Search Bar -->
                            <div class="materials-search">
                                <input type="text" 
                                       id="materialSearch" 
                                       class="form-input" 
                                       placeholder="Select category and supplier first..."
                                       disabled>
                                <div id="materialsResultInfo" class="search-result-info"></div>
                            </div>

                            <!-- Materials List -->
                            <div id="materialsList" class="materials-list">
                                <!-- Materials will be populated here -->
                            </div>
                        </div>

                        <!-- Selected Materials -->
                        <div class="selected-materials-section">
                            <h4>Your Order</h4>
                            <div id="materialsSummary" class="materials-summary"></div>
                            <div id="selectedMaterials" class="selected-materials">
                                <div class="no-selection">No materials added to your order yet...</div>
                            </div>
                        </div>

                        <!-- Legacy Add Material Button (Hidden) -->
                        <button type="button" id="addMaterial" class="btn btn-secondary" disabled style="display: none;">Add Material</button>
                    </div>

                    <!-- Requestor Information -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="requestorName" class="form-label">Your Name *</label>
                            <input type="text" id="requestorName" name="requestorName" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label for="requestorEmail" class="form-label">Your Email *</label>
                            <input type="email" id="requestorEmail" name="requestorEmail" class="form-input" required>
                        </div>
                    </div>

                    <!-- Additional Details -->
                    <div class="form-row">
                        <div class="form-group">
                            <label for="urgency" class="form-label">Priority Level</label>
                            <select id="urgency" name="urgency" class="form-select">
                                <option value="Normal">Normal</option>
                                <option value="High">High</option>
                                <option value="Urgent">Urgent</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="projectRef" class="form-label">ServiceM8 Job #</label>
                            <input type="text" id="projectRef" name="projectRef" class="form-input" placeholder="Optional">
                        </div>
                    </div>

                    <!-- Notes -->
                    <div class="form-group">
                        <label for="notes" class="form-label">Special Instructions</label>
                        <textarea id="notes" name="notes" class="form-textarea" rows="3" placeholder="Any special requirements or instructions..."></textarea>
                    </div>

                    <!-- Submit Button -->
                    <div class="form-actions">
                        <button type="submit" id="submitBtn" class="btn btn-primary" disabled>
                            <span class="btn-text">Submit Request</span>
                            <span class="btn-loading" style="display: none;">
                                <span class="spinner-small"></span>
                                Submitting...
                            </span>
                        </button>
                    </div>
                </form>
            `;

            mainForm.innerHTML = originalFormHTML;
            console.log('✅ Original form structure restored');
            
        } catch (error) {
            console.error('❌ Error restoring original form:', error);
        }
    }

    restoreFormData() {
        try {
            console.log('🔄 Restoring form data from saved state');
            
            // Get the current form data that was in the confirmation
            const currentFormData = this.getCurrentFormData();
            
            // Restore categories first
            if (this.formData?.data?.categories) {
                const categorySelect = document.getElementById('category');
                if (categorySelect) {
                    categorySelect.innerHTML = '<option value="">Select a category...</option>';
                    this.formData.data.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.name;
                        option.textContent = category.name;
                        if (category.description) {
                            option.dataset.description = category.description;
                        }
                        categorySelect.appendChild(option);
                    });
                }
            }
            
            // Restore request type
            if (currentFormData.requestType) {
                const requestTypeRadio = document.querySelector(`input[name="requestType"][value="${currentFormData.requestType}"]`);
                if (requestTypeRadio) {
                    requestTypeRadio.checked = true;
                    this.handleRequestTypeChange();
                }
            }
            
            // Restore category
            if (currentFormData.category) {
                const categorySelect = document.getElementById('category');
                if (categorySelect) {
                    categorySelect.value = currentFormData.category;
                    this.handleCategoryChange();
                }
                
                // Wait a bit for suppliers to populate, then restore supplier
                setTimeout(() => {
                    if (currentFormData.supplier) {
                        const supplierSelect = document.getElementById('supplier');
                        if (supplierSelect) {
                            supplierSelect.value = currentFormData.supplier;
                            this.handleSupplierChange();
                        }
                        
                        // Wait for materials to populate, then restore them
                        setTimeout(() => {
                            this.restoreSelectedMaterials();
                        }, 500);
                    }
                }, 500);
            }
            
            // Restore basic form fields
            const fieldsToRestore = [
                'requestorName', 'requestorEmail', 'urgency', 'projectRef', 'notes'
            ];
            
            fieldsToRestore.forEach(fieldName => {
                if (currentFormData[fieldName]) {
                    const field = document.getElementById(fieldName);
                    if (field) {
                        field.value = currentFormData[fieldName];
                    }
                }
            });
            
            console.log('✅ Form data restored successfully');
            
        } catch (error) {
            console.error('❌ Error restoring form data:', error);
        }
    }

    getCurrentFormData() {
        try {
            // Extract form data from various sources (DOM elements, stored state, etc.)
            return {
                requestType: document.querySelector('input[name="requestType"]:checked')?.value || 'order',
                category: this.lastSelectedCategory || '',
                supplier: this.lastSelectedSupplier || '',
                requestorName: this.lastRequestorName || '',
                requestorEmail: this.lastRequestorEmail || '',
                urgency: this.lastUrgency || 'Normal',
                projectRef: this.lastProjectRef || '',
                notes: this.lastNotes || ''
            };
        } catch (error) {
            console.error('❌ Error getting current form data:', error);
            return {};
        }
    }

    restoreSelectedMaterials() {
        try {
            console.log('📦 Restoring selected materials:', this.selectedMaterials);
            
            // Re-render the selected materials
            this.renderSelectedMaterials();
            
            // Re-populate and re-render the materials list to show checkboxes correctly
            if (this.lastSelectedCategory && this.formData?.data?.materials?.[this.lastSelectedCategory]) {
                this.populateMaterials(this.lastSelectedCategory, this.selectedSubcategory);
            }
            
            console.log('✅ Selected materials restored successfully');
            
        } catch (error) {
            console.error('❌ Error restoring selected materials:', error);
        }
    }

    async submitForm() {
        try {
            console.log('🚀 Actually submitting the form');
            
            const confirmBtn = document.getElementById('confirmSubmitBtn');
            const btnText = confirmBtn?.textContent;
            
            // Disable and show loading
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `
                    <span class="spinner-small"></span>
                    Submitting...
                `;
            }

            // Get form data from current state
            const form = document.querySelector('form') || document.createElement('form');
            const requestType = document.querySelector('input[name="requestType"]:checked')?.value;
            
            const data = {
                requestType: requestType,
                category: document.getElementById('category')?.value,
                supplier: document.getElementById('supplier')?.value,
                requestorName: document.getElementById('requestorName')?.value,
                requestorEmail: document.getElementById('requestorEmail')?.value,
                urgency: document.getElementById('urgency')?.value,
                projectRef: document.getElementById('projectRef')?.value,
                notes: document.getElementById('notes')?.value,
                materials: this.selectedMaterials
            };
            
            console.log('📦 Submitting final data:', data);
            
            // Determine endpoint
            const endpoint = requestType === 'order' ? '/api/order/submit' : '/api/quote/submit';
            
            // Submit form
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('✅ Submission result:', result);

            if (result.success !== false) {
                const type = requestType === 'order' ? 'order' : 'quote';
                const id = result.orderId || result.quoteId || result.id || `${type.toUpperCase()}-${Date.now()}`;
                this.showSuccess(type, id, data.supplier);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('❌ Form submission error:', error);
            this.showError(`Submission failed: ${error.message}`);
            
            // Re-enable button
            const confirmBtn = document.getElementById('confirmSubmitBtn');
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = '✅ Submit Order';
            }
        }
    }

    showSuccess(type, id, supplier) {
        try {
            // Hide form and show success
            const mainForm = document.getElementById('mainForm');
            const successAlert = document.getElementById('successAlert');
            const successMessage = document.getElementById('successMessage');
            const referenceId = document.getElementById('referenceId');
            const successSupplier = document.getElementById('successSupplier');

            if (mainForm) mainForm.style.display = 'none';
            if (successAlert) successAlert.style.display = 'block';
            if (successMessage) successMessage.textContent = `Your ${type} request has been submitted successfully!`;
            if (referenceId) referenceId.textContent = id;
            if (successSupplier) successSupplier.textContent = supplier;

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('❌ Error showing success:', error);
        }
    }

    showLoading(show) {
        try {
            const loading = document.getElementById('loading');
            const mainForm = document.getElementById('mainForm');
            
            if (loading && mainForm) {
                loading.style.display = show ? 'block' : 'none';
                mainForm.style.display = show ? 'none' : 'block';
            }
        } catch (error) {
            console.error('❌ Error showing/hiding loading:', error);
        }
    }

    showError(message) {
        try {
            const errorAlert = document.getElementById('errorAlert');
            const errorMessage = document.getElementById('errorMessage');
            
            if (errorAlert && errorMessage) {
                errorMessage.textContent = message;
                errorAlert.style.display = 'block';
                
                // Auto-hide after 5 seconds
                setTimeout(() => {
                    if (errorAlert) errorAlert.style.display = 'none';
                }, 5000);
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('❌ Error showing error message:', error);
        }
    }
}

// Global function for resetting form
function resetForm() {
    try {
        const mainForm = document.getElementById('mainForm');
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        
        if (mainForm) mainForm.style.display = 'block';
        if (successAlert) successAlert.style.display = 'none';
        if (errorAlert) errorAlert.style.display = 'none';
        
        // Reset form
        const form = document.getElementById('materialForm');
        if (form) form.reset();
        
        // Reset app state
        if (window.app) {
            window.app.selectedMaterials = [];
            window.app.filteredMaterials = [];
            window.app.selectedSubcategory = '';
            window.app.currentStep = 'form';
            window.app.renderSelectedMaterials();
            window.app.resetMaterialSelection();
            window.app.validateForm();
        }
        
        // Reload page to restore original form
        location.reload();
        
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting Enhanced App with Confirmation');
        window.app = new MaterialManagementApp();
        window.app.init();
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
    location.reload();
});
