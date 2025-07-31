class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFormData();
        this.validateForm();
    }

    setupEventListeners() {
        // Request type change
        const requestTypeInputs = document.querySelectorAll('input[name="requestType"]');
        requestTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.handleRequestTypeChange());
        });

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

        // Add material button
        const addMaterialBtn = document.getElementById('addMaterial');
        if (addMaterialBtn) {
            addMaterialBtn.addEventListener('click', () => this.addMaterial());
        }

        // Form submission
        const form = document.getElementById('materialForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Form validation
        const formInputs = form?.querySelectorAll('input, select, textarea');
        formInputs?.forEach(input => {
            input.addEventListener('change', () => this.validateForm());
            input.addEventListener('input', () => this.validateForm());
        });
    }

    async loadFormData() {
        try {
            this.showLoading(true);
            console.log('🔄 Loading form data from webhooks...');
            
            const response = await fetch('/api/data/load');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Form data loaded:', data);
            
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
        if (!data?.data) return;

        // Populate categories
        const categorySelect = document.getElementById('category');
        if (categorySelect && data.data.categories) {
            categorySelect.innerHTML = '<option value="">Select a category...</option>';
            data.data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                option.dataset.description = category.description;
                categorySelect.appendChild(option);
            });
        }
    }

    handleRequestTypeChange() {
        const selectedType = document.querySelector('input[name="requestType"]:checked')?.value;
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        
        if (selectedType === 'order') {
            if (btnText) btnText.textContent = 'Submit Order';
            if (submitBtn) submitBtn.style.background = 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%)';
        } else {
            if (btnText) btnText.textContent = 'Request Quote';
            if (submitBtn) submitBtn.style.background = 'linear-gradient(135deg, var(--warning-orange) 0%, #f59e0b 100%)';
        }
    }

    handleCategoryChange() {
        const categorySelect = document.getElementById('category');
        const supplierSelect = document.getElementById('supplier');
        const materialsSelect = document.getElementById('materialsSelect');
        const addMaterialBtn = document.getElementById('addMaterial');
        
        const selectedCategory = categorySelect?.value;
        
        // Reset dependent fields
        if (supplierSelect) supplierSelect.innerHTML = '<option value="">Select a supplier...</option>';
        if (materialsSelect) materialsSelect.innerHTML = '<option value="">Select materials...</option>';
        if (materialsSelect) materialsSelect.disabled = true;
        if (addMaterialBtn) addMaterialBtn.disabled = true;
        this.hideSupplierInfo();

        if (!selectedCategory || !this.formData?.data) return;

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
                    const option = document.createElement('option');
                    option.value = supplier.name;
                    option.dataset.email = supplier.email;
                    option.dataset.phone = supplier.phone;
                    option.dataset.id = supplier.id;
                    option.textContent = supplier.name;
                    supplierSelect?.appendChild(option);
                }
            });
        } else {
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.name;
                option.dataset.email = supplier.email;
                option.dataset.phone = supplier.phone;
                option.dataset.id = supplier.id;
                option.textContent = supplier.name;
                supplierSelect?.appendChild(option);
            });
        }

        this.validateForm();
    }

    handleSupplierChange() {
        const supplierSelect = document.getElementById('supplier');
        const materialsSelect = document.getElementById('materialsSelect');
        const addMaterialBtn = document.getElementById('addMaterial');
        const categorySelect = document.getElementById('category');
        
        const selectedSupplier = supplierSelect?.value;
        const selectedCategory = categorySelect?.value;
        
        // Reset materials
        if (materialsSelect) {
            materialsSelect.innerHTML = '<option value="">Select materials...</option>';
            materialsSelect.disabled = true;
        }
        if (addMaterialBtn) addMaterialBtn.disabled = true;

        if (!selectedSupplier) {
            this.hideSupplierInfo();
            this.validateForm();
            return;
        }

        // Show supplier info
        this.showSupplierInfo(supplierSelect?.selectedOptions[0]);

        // Populate materials for selected category
        if (selectedCategory && this.formData?.data?.materials?.[selectedCategory]) {
            const materials = this.formData.data.materials[selectedCategory];
            
            materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.name;
                option.dataset.id = material.id;
                option.dataset.code = material.code;
                option.dataset.unit = material.unit;
                option.dataset.subcategory = material.subcategory;
                option.textContent = `${material.name} (${material.unit})`;
                materialsSelect?.appendChild(option);
            });

            if (materialsSelect) materialsSelect.disabled = false;
            if (addMaterialBtn) addMaterialBtn.disabled = false;
        }

        this.validateForm();
    }

    showSupplierInfo(supplierOption) {
        const supplierInfo = document.getElementById('supplierInfo');
        const supplierEmail = document.getElementById('supplierEmail');
        const supplierPhone = document.getElementById('supplierPhone');

        if (supplierOption && supplierInfo && supplierEmail && supplierPhone) {
            supplierEmail.textContent = `📧 ${supplierOption.dataset.email}`;
            supplierPhone.textContent = `📞 ${supplierOption.dataset.phone}`;
            supplierInfo.style.display = 'block';
        }
    }

    hideSupplierInfo() {
        const supplierInfo = document.getElementById('supplierInfo');
        if (supplierInfo) supplierInfo.style.display = 'none';
    }

    addMaterial() {
        const materialsSelect = document.getElementById('materialsSelect');
        const selectedOption = materialsSelect?.selectedOptions[0];
        
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
            id: selectedOption.dataset.id,
            name: selectedOption.value,
            code: selectedOption.dataset.code,
            unit: selectedOption.dataset.unit,
            subcategory: selectedOption.dataset.subcategory,
            quantity: 1
        };

        this.selectedMaterials.push(material);
        this.renderSelectedMaterials();
        
        // Reset select
        if (materialsSelect) materialsSelect.value = '';
        
        this.validateForm();
    }

    renderSelectedMaterials() {
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
                <button type="button" class="remove-material" onclick="app.removeMaterial(${index})">
                    Remove
                </button>
            </div>
        `).join('');
    }

    removeMaterial(index) {
        this.selectedMaterials.splice(index, 1);
        this.renderSelectedMaterials();
        this.validateForm();
    }

    validateForm() {
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
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        
        // Disable form
        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';

        try {
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
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    showSuccess(type, id, supplier) {
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
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const mainForm = document.getElementById('mainForm');
        
        if (loading && mainForm) {
            loading.style.display = show ? 'block' : 'none';
            mainForm.style.display = show ? 'none' : 'block';
        }
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorAlert && errorMessage) {
            errorMessage.textContent = message;
            errorAlert.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorAlert.style.display = 'none';
            }, 5000);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
}

// Global function for removing materials (called from HTML)
function resetForm() {
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing LCMB Material Management App');
    window.app = new MaterialManagementApp();
});

// Handle browser back/forward
window.addEventListener('popstate', () => {
    location.reload();
});
