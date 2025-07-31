// script.js
class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
    }

    init() {
        console.log('🚀 Initializing LCMB Material Management App');
        
        // THIS IS THE BIG CHANGE: Check if server already loaded data
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
            console.log('⚙️ Setting up event listeners...');
            
            // Request type change
            const requestTypeInputs = document.querySelectorAll('input[name="requestType"]');
            if (requestTypeInputs && requestTypeInputs.length > 0) {
                requestTypeInputs.forEach(input => {
                    if (input) {
                        input.addEventListener('change', () => this.handleRequestTypeChange());
                    }
                });
                console.log(`✅ Added listeners to ${requestTypeInputs.length} request type inputs`);
            }

            // Category change
            const categorySelect = document.getElementById('category');
            if (categorySelect) {
                categorySelect.addEventListener('change', () => this.handleCategoryChange());
                console.log('✅ Added category change listener');
            }

            // Supplier change
            const supplierSelect = document.getElementById('supplier');
            if (supplierSelect) {
                supplierSelect.addEventListener('change', () => this.handleSupplierChange());
                console.log('✅ Added supplier change listener');
            }

            // Add material button
            const addMaterialBtn = document.getElementById('addMaterial');
            if (addMaterialBtn) {
                addMaterialBtn.addEventListener('click', () => this.addMaterial());
                console.log('✅ Added material button listener');
            }

            // Form submission
            const form = document.getElementById('materialForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e));
                console.log('✅ Added form submit listener');
                
                // Form validation on input changes
                const formInputs = form.querySelectorAll('input, select, textarea');
                if (formInputs && formInputs.length > 0) {
                    formInputs.forEach(input => {
                        if (input) {
                            input.addEventListener('change', () => this.validateForm());
                            input.addEventListener('input', () => this.validateForm());
                        }
                    });
                    console.log(`✅ Added validation listeners to ${formInputs.length} form inputs`);
                }
            } else {
                console.warn('⚠️ Form element not found');
            }
            
            console.log('✅ Event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    // This now only runs as fallback if server didn't provide data
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

            console.log('📋 Populating form with data:', {
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
            } else {
                console.warn('⚠️ Category select element not found or no categories data');
            }

            // Hide loading and show form
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
                btnText.textContent = 'Submit Order';
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%)';
            } else {
                btnText.textContent = 'Request Quote';
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
            const materialsSelect = document.getElementById('materialsSelect');
            const addMaterialBtn = document.getElementById('addMaterial');
            
            if (!categorySelect) return;
            
            const selectedCategory = categorySelect.value;
            console.log('📂 Category changed to:', selectedCategory);
            
            // Reset dependent fields
            if (supplierSelect) {
                supplierSelect.innerHTML = '<option value="">Select a supplier...</option>';
            }
            if (materialsSelect) {
                materialsSelect.innerHTML = '<option value="">Select materials...</option>';
                materialsSelect.disabled = true;
            }
            if (addMaterialBtn) {
                addMaterialBtn.disabled = true;
            }
            this.hideSupplierInfo();

            if (!selectedCategory || !this.formData?.data) {
                this.validateForm();
                return;
            }

            // Populate suppliers for selected category
            const suppliers = this.formData.data.suppliersByCategory?.[selectedCategory] || [];
            
            if (suppliers.length === 0 && this.formData.data.suppliers) {
                // Fallback: show suppliers that match the category
                console.log('🔄 Using fallback supplier matching for category:', selectedCategory);
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
            const materialsSelect = document.getElementById('materialsSelect');
            const addMaterialBtn = document.getElementById('addMaterial');
            const categorySelect = document.getElementById('category');
            
            if (!supplierSelect) return;
            
            const selectedSupplier = supplierSelect.value;
            const selectedCategory = categorySelect?.value;
            console.log('🏢 Supplier changed to:', selectedSupplier);
            
            // Reset materials
            if (materialsSelect) {
                materialsSelect.innerHTML = '<option value="">Select materials...</option>';
                materialsSelect.disabled = true;
            }
            if (addMaterialBtn) {
                addMaterialBtn.disabled = true;
            }

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

            // Populate materials for selected category
            if (selectedCategory && this.formData?.data?.materials?.[selectedCategory]) {
                const materials = this.formData.data.materials[selectedCategory];
                console.log(`📦 Loading ${materials.length} materials for category ${selectedCategory}`);
                
                materials.forEach(material => {
                    const option = document.createElement('option');
                    option.value = material.name;
                    option.dataset.id = material.id || '';
                    option.dataset.code = material.code || '';
                    option.dataset.unit = material.unit || 'pcs';
                    option.dataset.subcategory = material.subcategory || '';
                    option.textContent = `${material.name} (${material.unit || 'pcs'})`;
                    materialsSelect?.appendChild(option);
                });

                if (materialsSelect) materialsSelect.disabled = false;
                if (addMaterialBtn) addMaterialBtn.disabled = false;
            }

            this.validateForm();
        } catch (error) {
            console.error('❌ Error handling supplier change:', error);
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

    addMaterial() {
        try {
            const materialsSelect = document.getElementById('materialsSelect');
            if (!materialsSelect) return;
            
            const selectedOption = materialsSelect.selectedOptions[0];
            
            if (!selectedOption || !selectedOption.value) {
                this.showError('Please select a material first.');
                return;
            }

            // Check if material already selected
            const materialExists = this.selectedMaterials.some(m => m.id === selectedOption.dataset.id);
            if (materialExists) {
                this.showError('Material already added.');
                return;
            }

            // Add material to selected list
            const material = {
                id: selectedOption.dataset.id || `mat-${Date.now()}`,
                name: selectedOption.value,
                code: selectedOption.dataset.code || '',
                unit: selectedOption.dataset.unit || 'pcs',
                subcategory: selectedOption.dataset.subcategory || '',
                quantity: 1
            };

            this.selectedMaterials.push(material);
            console.log('➕ Added material:', material.name);
            this.renderSelectedMaterials();
            
            // Reset select
            materialsSelect.value = '';
            
            this.validateForm();
        } catch (error) {
            console.error('❌ Error adding material:', error);
        }
    }

    renderSelectedMaterials() {
        try {
            const container = document.getElementById('selectedMaterials');
            if (!container) return;
            
            if (this.selectedMaterials.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = this.selectedMaterials.map((material, index) => `
                <div class="material-item" data-index="${index}">
                    <div class="material-info">
                        <div class="material-name">${material.name}</div>
                        <div class="material-meta">
                            ${material.code ? `Code: ${material.code} • ` : ''}
                            Unit: ${material.unit} • 
                            Category: ${material.subcategory}
                        </div>
                    </div>
                    <button type="button" class="remove-material" onclick="window.app && window.app.removeMaterial(${index})">
                        Remove
                    </button>
                </div>
            `).join('');
        } catch (error) {
            console.error('❌ Error rendering selected materials:', error);
        }
    }

    removeMaterial(index) {
        try {
            if (index >= 0 && index < this.selectedMaterials.length) {
                const removed = this.selectedMaterials.splice(index, 1)[0];
                console.log('➖ Removed material:', removed.name);
                this.renderSelectedMaterials();
                this.validateForm();
            }
        } catch (error) {
            console.error('❌ Error removing material:', error);
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
            const form = e.target;
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoading = submitBtn?.querySelector('.btn-loading');
            
            // Disable form
            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';

            // Prepare form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add selected materials
            data.materials = this.selectedMaterials;
            
            console.log('📦 Submitting form data:', data);
            
            // Determine endpoint
            const requestType = data.requestType;
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
        } finally {
            // Re-enable form
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoading = submitBtn?.querySelector('.btn-loading');
            
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
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
            window.app.renderSelectedMaterials();
            window.app.validateForm();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// CHANGED: Better initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting App');
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
