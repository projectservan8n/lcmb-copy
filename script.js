// Enhanced script.js with PDF Upload and Order History - Corrected Version
class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        this.filteredMaterials = [];
        this.selectedSubcategory = '';
        this.pendingSubmissionData = null;
        this.uploadedFile = null;
        this.orderHistory = [];
        this.currentTab = 'submit-request';
    }

    init() {
        console.log('🚀 Initializing Enhanced LCMB Material Management App (PDF Upload + Order History)');
        
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
        this.setupTabNavigation();
        this.setupFileUpload();
        this.validateForm();
    }

    setupEventListeners() {
        try {
            console.log('⚙️ Setting up enhanced event listeners...');
            
            // Request type change
            const requestTypeInputs = document.querySelectorAll('input[name="requestType"]');
            if (requestTypeInputs) {
                requestTypeInputs.forEach(input => {
                    if (input) input.addEventListener('change', () => this.handleRequestTypeChange());
                });
            }

            // Form elements
            const categorySelect = document.getElementById('category');
            const supplierSelect = document.getElementById('supplier');
            const subcategorySelect = document.getElementById('subcategory');
            const materialSearch = document.getElementById('materialSearch');
            
            if (categorySelect) categorySelect.addEventListener('change', () => this.handleCategoryChange());
            if (supplierSelect) supplierSelect.addEventListener('change', () => this.handleSupplierChange());
            if (subcategorySelect) subcategorySelect.addEventListener('change', () => this.handleSubcategoryChange());
            if (materialSearch) materialSearch.addEventListener('input', () => this.handleMaterialSearch());

            // Form submission
            const form = document.getElementById('materialForm');
            if (form) {
                form.addEventListener('submit', (e) => this.handleFormSubmit(e));
                const formInputs = form.querySelectorAll('input, select, textarea');
                formInputs.forEach(input => {
                    if (input && input.type !== 'file') {
                        input.addEventListener('change', () => this.validateForm());
                        input.addEventListener('input', () => this.validateForm());
                    }
                });
            }

            // Confirmation page
            const backToEditBtn = document.getElementById('backToEditBtn');
            const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
            const addMoreMaterialsBtn = document.getElementById('addMoreMaterialsBtn');
            
            if (backToEditBtn) backToEditBtn.addEventListener('click', () => this.goBackToEdit());
            if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', () => this.handleConfirmedSubmission());
            if (addMoreMaterialsBtn) addMoreMaterialsBtn.addEventListener('click', () => this.goBackToEdit());

            // PDF send mode
            const pdfSendModeInputs = document.querySelectorAll('input[name="pdfSendMode"]');
            if (pdfSendModeInputs) {
                pdfSendModeInputs.forEach(input => {
                    input.addEventListener('change', () => this.handlePdfSendModeChange());
                });
            }

            // History tab
            const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
            const historyType = document.getElementById('historyType');
            const historySupplier = document.getElementById('historySupplier');
            const historyCategory = document.getElementById('historyCategory');
            
            if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', () => this.loadOrderHistory());
            if (historyType) historyType.addEventListener('change', () => this.filterOrderHistory());
            if (historySupplier) historySupplier.addEventListener('change', () => this.filterOrderHistory());
            if (historyCategory) historyCategory.addEventListener('change', () => this.filterOrderHistory());
            
            console.log('✅ Enhanced event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    setupTabNavigation() {
        try {
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.dataset.tab;
                    
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    tabContents.forEach(content => content.classList.remove('active'));
                    const targetContent = document.getElementById(targetTab);
                    if (targetContent) targetContent.classList.add('active');
                    
                    this.currentTab = targetTab;
                    
                    if (targetTab === 'order-history' && this.orderHistory.length === 0) {
                        this.loadOrderHistory();
                    }
                });
            });
        } catch (error) {
            console.error('❌ Error setting up tab navigation:', error);
        }
    }

    setupFileUpload() {
        try {
            const fileInput = document.getElementById('pdfFile');
            const fileUploadArea = document.getElementById('fileUploadArea');
            const removeFileBtn = document.getElementById('removeFileBtn');
            const dragOverlay = fileUploadArea?.querySelector('.drag-overlay');

            if (!fileInput || !fileUploadArea) return;

            fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
            fileUploadArea.addEventListener('click', () => {
                if (!this.uploadedFile) fileInput.click();
            });

            // Drag and drop
            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('drag-over');
                if (dragOverlay) dragOverlay.style.display = 'flex';
            });

            fileUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                if (!fileUploadArea.contains(e.relatedTarget)) {
                    fileUploadArea.classList.remove('drag-over');
                    if (dragOverlay) dragOverlay.style.display = 'none';
                }
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('drag-over');
                if (dragOverlay) dragOverlay.style.display = 'none';
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type === 'application/pdf') {
                    this.handleFileSelect(files[0]);
                } else {
                    this.showError('Please select a valid PDF file.');
                }
            });

            if (removeFileBtn) {
                removeFileBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeFile();
                });
            }

            console.log('✅ File upload setup complete');
        } catch (error) {
            console.error('❌ Error setting up file upload:', error);
        }
    }

    handleFileSelect(file) {
        try {
            if (!file) return;

            if (file.type !== 'application/pdf') {
                this.showError('Please select a PDF file.');
                return;
            }

            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                this.showError('File size must be less than 10MB.');
                return;
            }

            this.uploadedFile = file;
            this.showFilePreview(file);
            this.validateForm();

            console.log('📎 File selected:', {
                name: file.name,
                size: this.formatFileSize(file.size),
                type: file.type
            });

        } catch (error) {
            console.error('❌ Error handling file select:', error);
        }
    }

    showFilePreview(file) {
        try {
            const fileUploadArea = document.getElementById('fileUploadArea');
            const filePreview = document.getElementById('filePreview');
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');

            if (fileUploadArea) fileUploadArea.style.display = 'none';
            if (filePreview) filePreview.style.display = 'block';
            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = this.formatFileSize(file.size);

        } catch (error) {
            console.error('❌ Error showing file preview:', error);
        }
    }

    removeFile() {
        try {
            this.uploadedFile = null;
            
            const fileUploadArea = document.getElementById('fileUploadArea');
            const filePreview = document.getElementById('filePreview');
            const fileInput = document.getElementById('pdfFile');

            if (fileUploadArea) fileUploadArea.style.display = 'block';
            if (filePreview) filePreview.style.display = 'none';
            if (fileInput) fileInput.value = '';

            this.validateForm();
            console.log('📎 File removed');
        } catch (error) {
            console.error('❌ Error removing file:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handlePdfSendModeChange() {
        try {
            const pdfSendMode = document.querySelector('input[name="pdfSendMode"]:checked')?.value;
            const materialsSection = document.getElementById('materialsSection');
            
            if (pdfSendMode === 'pdf-only') {
                if (materialsSection) {
                    materialsSection.style.opacity = '0.5';
                    materialsSection.style.pointerEvents = 'none';
                }
            } else {
                if (materialsSection) {
                    materialsSection.style.opacity = '1';
                    materialsSection.style.pointerEvents = 'auto';
                }
            }
            this.validateForm();
        } catch (error) {
            console.error('❌ Error handling PDF send mode change:', error);
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
                    if (category.description) option.dataset.description = category.description;
                    categorySelect.appendChild(option);
                });
                console.log(`✅ Populated ${data.data.categories.length} categories`);
            }

            // Populate history filters
            this.populateHistoryFilters(data.data);
            this.showLoading(false);
        } catch (error) {
            console.error('❌ Error populating form:', error);
            this.showError('Error setting up form: ' + error.message);
        }
    }

    populateHistoryFilters(data) {
        try {
            const historySupplier = document.getElementById('historySupplier');
            const historyCategory = document.getElementById('historyCategory');
            
            if (historySupplier && data.suppliers) {
                historySupplier.innerHTML = '<option value="">All Suppliers</option>';
                data.suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.name;
                    option.textContent = supplier.name;
                    historySupplier.appendChild(option);
                });
            }

            if (historyCategory && data.categories) {
                historyCategory.innerHTML = '<option value="">All Categories</option>';
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.name;
                    option.textContent = category.name;
                    historyCategory.appendChild(option);
                });
            }
        } catch (error) {
            console.error('❌ Error populating history filters:', error);
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
            
            if (supplierSelect) supplierSelect.innerHTML = '<option value="">Select a supplier...</option>';
            this.resetMaterialSelection();
            this.hideSupplierInfo();

            if (!selectedCategory || !this.formData?.data) {
                this.validateForm();
                return;
            }

            const suppliers = this.formData.data.suppliersByCategory?.[selectedCategory] || [];
            
            if (suppliers.length === 0 && this.formData.data.suppliers) {
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
            
            this.resetMaterialSelection();

            if (!selectedSupplier) {
                this.hideSupplierInfo();
                this.validateForm();
                return;
            }

            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                this.showSupplierInfo(selectedOption);
                console.log('🔍 Selected Supplier ID:', selectedOption.dataset.id);
            }

            if (selectedCategory) {
                this.populateSubcategories(selectedCategory);
                this.populateMaterials(selectedCategory, '');
            }

            this.validateForm();
        } catch (error) {
            console.error('❌ Error handling supplier change:', error);
        }
    }

    populateSubcategories(category) {
        try {
            const subcategorySelect = document.getElementById('subcategory');
            const supplierSelect = document.getElementById('supplier');
            
            if (!subcategorySelect || !supplierSelect.value) return;

            const selectedOption = supplierSelect.selectedOptions[0];
            const selectedSupplierId = selectedOption?.dataset.id;

            if (!selectedSupplierId) return;

            let materials = [];
            if (this.formData?.data?.materialsByCategoryAndSupplier?.[category]?.[selectedSupplierId]) {
                materials = this.formData.data.materialsByCategoryAndSupplier[category][selectedSupplierId];
            } else if (this.formData?.data?.materials?.[category]) {
                materials = this.formData.data.materials[category].filter(m => m.supplierId === selectedSupplierId);
            }

            const subcategories = [...new Set(materials.map(m => m.subcategory).filter(sub => sub))];
            
            subcategorySelect.innerHTML = '<option value="">All subcategories</option>';
            subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory;
                option.textContent = subcategory;
                subcategorySelect.appendChild(option);
            });

            const subcategoryGroup = document.getElementById('subcategoryGroup');
            if (subcategoryGroup) subcategoryGroup.style.display = 'block';

            console.log(`📁 Found ${subcategories.length} subcategories`);
            
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
            
            this.populateMaterials(selectedCategory, selectedSubcategory);
            
        } catch (error) {
            console.error('❌ Error handling subcategory change:', error);
        }
    }

    populateMaterials(category, subcategory = '') {
        try {
            const materialSearch = document.getElementById('materialSearch');
            const materialsContainer = document.getElementById('materialsContainer');
            const supplierSelect = document.getElementById('supplier');
            
            if (!category || !supplierSelect.value) {
                console.log('⚠️ Missing category or supplier');
                return;
            }

            const selectedOption = supplierSelect.selectedOptions[0];
            if (!selectedOption) {
                console.log('⚠️ No supplier option selected');
                return;
            }
            
            const selectedSupplierId = selectedOption.dataset.id;
            if (!selectedSupplierId) {
                console.log('⚠️ No supplier ID found in dataset');
                return;
            }

            console.log(`🔍 Loading materials for Category: ${category}, Supplier ID: ${selectedSupplierId}`);

            let materials = [];
            
            if (this.formData?.data?.materialsByCategoryAndSupplier?.[category]?.[selectedSupplierId]) {
                materials = this.formData.data.materialsByCategoryAndSupplier[category][selectedSupplierId];
                console.log('✅ Using materialsByCategoryAndSupplier structure');
            } else if (this.formData?.data?.materials?.[category]) {
                materials = this.formData.data.materials[category].filter(m => m.supplierId === selectedSupplierId);
                console.log('⚠️ Using fallback materials filtering');
            } else {
                console.log('❌ No materials found for category:', category);
                materials = [];
            }
            
            if (subcategory) {
                const beforeFilter = materials.length;
                materials = materials.filter(m => m.subcategory === subcategory);
                console.log(`📁 Filtered by subcategory: ${beforeFilter} → ${materials.length} materials`);
            }

            this.filteredMaterials = materials;
            
            if (materialSearch) {
                materialSearch.disabled = false;
                materialSearch.placeholder = `Search from ${materials.length} materials...`;
            }
            
            if (materialsContainer) {
                materialsContainer.style.display = 'block';
            }

            this.renderMaterialsList();
            
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

            if (searchTerm) {
                materialsToShow = this.filteredMaterials.filter(material => 
                    material.name.toLowerCase().includes(searchTerm) ||
                    (material.code && material.code.toLowerCase().includes(searchTerm)) ||
                    (material.subcategory && material.subcategory.toLowerCase().includes(searchTerm))
                );
            }

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

            // Add event listeners to material cards
            materialsList.querySelectorAll('.material-card').forEach(card => {
                const materialId = card.dataset.materialId;
                const checkbox = card.querySelector('.material-checkbox');
                
                card.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return;
                    
                    checkbox.checked = !checkbox.checked;
                    
                    if (checkbox.checked) {
                        this.addMaterialById(materialId, 1);
                        card.classList.add('selected');
                    } else {
                        this.removeMaterialById(materialId);
                        card.classList.remove('selected');
                    }
                    
                    const statusBadge = card.querySelector('.material-status');
                    if (checkbox.checked) {
                        statusBadge.innerHTML = '<span class="selected-badge">✓ Selected</span>';
                    } else {
                        statusBadge.innerHTML = '<span class="select-badge">Click to Select</span>';
                    }
                });

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

            const existingIndex = this.selectedMaterials.findIndex(m => m.id === materialId);
            if (existingIndex !== -1) return;

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
            console.log(`✅ Added material: ${material.name}`);

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
                            ${material.subcategory} • 
                            Supplier: ${material.supplierName}
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

            const totalItems = this.selectedMaterials.length;
            const totalQuantity = this.selectedMaterials.reduce((sum, m) => sum + m.quantity, 0);
            
            const summary = document.getElementById('materialsSummary');
            if (summary) {
                summary.innerHTML = `<strong>${totalItems} unique materials, ${totalQuantity} total items</strong>`;
            }
        } catch (error) {
            console.error('❌ Error rendering selected materials:', error);
        }
    }

    updateQuantity(index, change) {
        try {
            if (index >= 0 && index < this.selectedMaterials.length) {
                const newQuantity = this.selectedMaterials[index].quantity + change;
                if (newQuantity >= 1) {
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
                
                const checkbox = document.querySelector(`.material-checkbox[data-material-id="${removed.id}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                    const card = checkbox.closest('.material-card');
                    if (card) {
                        card.classList.remove('selected');
                        card.querySelector('.material-status').innerHTML = '<span class="select-badge">Click to Select</span>';
                    }
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
            
            const subcategoryGroup = document.getElementById('subcategoryGroup');
            if (subcategoryGroup) subcategoryGroup.style.display = 'none';
            if (subcategorySelect) subcategorySelect.innerHTML = '<option value="">All subcategories</option>';
            
            if (materialSearch) {
                materialSearch.value = '';
                materialSearch.disabled = true;
                materialSearch.placeholder = 'Select category and supplier first...';
            }
            
            if (materialsContainer) materialsContainer.style.display = 'none';

            this.filteredMaterials = [];
            this.selectedMaterials = [];
            this.selectedSubcategory = '';
            
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
            if (supplierInfo) supplierInfo.style.display = 'none';
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

            for (const fieldName of requiredFields) {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    isValid = false;
                    break;
                }
            }

            const pdfSendMode = document.querySelector('input[name="pdfSendMode"]:checked')?.value;
            const hasPdf = this.uploadedFile !== null;
            const hasMaterials = this.selectedMaterials.length > 0;

            if (pdfSendMode === 'pdf-only') {
                if (!hasPdf) isValid = false;
            } else {
                if (!hasMaterials) isValid = false;
            }

            const emailField = form.querySelector('[name="requestorEmail"]');
            if (emailField && emailField.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailField.value)) isValid = false;
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
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            data.materials = this.selectedMaterials;
            
            if (this.uploadedFile) {
                data.pdfFile = {
                    name: this.uploadedFile.name,
                    size: this.uploadedFile.size,
                    type: this.uploadedFile.type
                };
                data.pdfSendMode = document.querySelector('input[name="pdfSendMode"]:checked')?.value || 'with-order';
            }
            
            const supplierSelect = document.getElementById('supplier');
            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                data.supplierEmail = selectedOption.dataset.email || '';
                data.supplierPhone = selectedOption.dataset.phone || '';
                data.supplierId = selectedOption.dataset.id || '';
            }
            
            console.log('📋 Form data prepared for confirmation:', data);
            this.pendingSubmissionData = data;
            this.showConfirmationPage(data);
            
        } catch (error) {
            console.error('❌ Form preparation error:', error);
            this.showError(`Error preparing form: ${error.message}`);
        }
    }

    showConfirmationPage(data) {
        try {
            console.log('📋 Displaying confirmation page');
            
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            
            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'block';
            
            const requestType = data.requestType;
            const confirmationTitle = document.getElementById('confirmationTitle');
            const confirmationSubtitle = document.getElementById('confirmationSubtitle');
            const confirmSubmitText = document.getElementById('confirmSubmitText');
            
            if (requestType === 'order') {
                if (confirmationTitle) confirmationTitle.textContent = 'Review Your Order';
                if (confirmationSubtitle) confirmationSubtitle.textContent = 'Please review all details before sending to supplier';
                if (confirmSubmitText) confirmSubmitText.textContent = 'Confirm & Send Order';
            } else {
                if (confirmationTitle) confirmationTitle.textContent = 'Review Your Quote Request';
                if (confirmationSubtitle) confirmationSubtitle.textContent = 'Please review all details before sending to supplier';
                if (confirmSubmitText) confirmSubmitText.textContent = 'Confirm & Send Quote Request';
            }
            
            this.populateElement('confirmRequestType', requestType === 'order' ? 'Material Order' : 'Quote Request');
            this.populateElement('confirmCategory', data.category);
            this.populateElement('confirmUrgency', data.urgency, 'Normal');
            this.populateElement('confirmProjectRef', data.projectRef, 'Not specified');
            
            this.populateElement('confirmSupplierName', data.supplier);
            this.populateElement('confirmSupplierEmail', data.supplierEmail, 'Not available');
            this.populateElement('confirmSupplierPhone', data.supplierPhone, 'Not available');
            
            this.populateElement('confirmRequestorName', data.requestorName);
            this.populateElement('confirmRequestorEmail', data.requestorEmail);
            
            const materialsSection = document.getElementById('materialsSection');
            if (data.pdfSendMode === 'pdf-only') {
                if (materialsSection) materialsSection.style.display = 'none';
            } else {
                if (materialsSection) materialsSection.style.display = 'block';
                this.populateConfirmationMaterials(data.materials);
            }
            
            this.populateConfirmationPdf(data);
            
            const notesSection = document.getElementById('notesSection');
            if (data.notes && data.notes.trim()) {
                if (notesSection) notesSection.style.display = 'block';
                this.populateElement('confirmNotes', data.notes);
            } else {
                if (notesSection) notesSection.style.display = 'none';
            }
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing confirmation page:', error);
            this.showError('Error displaying confirmation page: ' + error.message);
        }
    }

    populateConfirmationMaterials(materials) {
        try {
            const materialsSummary = document.getElementById('confirmMaterialsSummary');
            const materialsList = document.getElementById('confirmMaterialsList');
            
            if (!materials || materials.length === 0) return;
            
            const totalItems = materials.length;
            const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
            
            if (materialsSummary) {
                materialsSummary.innerHTML = `
                    <div class="summary-stat">
                        <span class="stat-number">${totalItems}</span>
                        <span class="stat-label">Unique Materials</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-number">${totalQuantity}</span>
                        <span class="stat-label">Total Items</span>
                    </div>
                `;
            }
            
            if (materialsList) {
                materialsList.innerHTML = materials.map((material) => `
                    <div class="confirm-material-item">
                        <div class="material-details">
                            <div class="material-name">${material.name}</div>
                            <div class="material-info">
                                ${material.code ? `<span class="info-tag">Code: ${material.code}</span>` : ''}
                                <span class="info-tag">Unit: ${material.unit}</span>
                                <span class="info-tag">${material.subcategory}</span>
                                <span class="info-tag">Supplier: ${material.supplierName}</span>
                            </div>
                        </div>
                        <div class="material-quantity">
                            <span class="quantity-badge">${material.quantity} ${material.unit}</span>
                        </div>
                    </div>
                `).join('');
            }
            
        } catch (error) {
            console.error('❌ Error populating confirmation materials:', error);
        }
    }

    populateConfirmationPdf(data) {
        try {
            const pdfSection = document.getElementById('pdfSection');
            
            if (!data.pdfFile) {
                if (pdfSection) pdfSection.style.display = 'none';
                return;
            }
            
            if (pdfSection) pdfSection.style.display = 'block';
            
            this.populateElement('confirmPdfName', data.pdfFile.name);
            this.populateElement('confirmPdfSize', this.formatFileSize(data.pdfFile.size));
            
            const pdfMode = data.pdfSendMode === 'pdf-only' ? 'Send PDF Only' : 'Send with Order';
            this.populateElement('confirmPdfMode', pdfMode);
            
        } catch (error) {
            console.error('❌ Error populating confirmation PDF:', error);
        }
    }

    populateElement(elementId, value, defaultValue = '') {
        try {
            const element = document.getElementById(elementId);
            if (element) element.textContent = value || defaultValue;
        } catch (error) {
            console.error(`❌ Error populating element ${elementId}:`, error);
        }
    }

    goBackToEdit() {
        try {
            console.log('🔄 Going back to edit form');
            
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            
            if (mainForm) mainForm.style.display = 'block';
            if (confirmationPage) confirmationPage.style.display = 'none';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error going back to edit:', error);
        }
    }

    async handleConfirmedSubmission() {
        if (!this.pendingSubmissionData) {
            this.showError('No submission data found. Please go back and fill the form again.');
            return;
        }
        
        try {
            const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
            const btnText = confirmSubmitBtn?.querySelector('.btn-text');
            const btnLoading = confirmSubmitBtn?.querySelector('.btn-loading');
            
            if (confirmSubmitBtn) confirmSubmitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';

            const data = this.pendingSubmissionData;
            console.log('📤 Submitting confirmed request to supplier:', data);
            
            if (this.uploadedFile) {
                const base64 = await this.fileToBase64(this.uploadedFile);
                data.pdfFileData = base64;
            }
            
            const requestType = data.requestType;
            const endpoint = requestType === 'order' ? '/api/order/submit' : '/api/quote/submit';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('✅ Confirmed submission result:', result);

            if (result.success !== false) {
                const type = requestType === 'order' ? 'order' : 'quote';
                const id = result.orderId || result.quoteId || result.id || `${type.toUpperCase()}-${Date.now()}`;
                this.showSuccess(type, id, data.supplier);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('❌ Confirmed submission error:', error);
            this.showError(`Submission failed: ${error.message}`);
        } finally {
            const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
            const btnText = confirmSubmitBtn?.querySelector('.btn-text');
            const btnLoading = confirmSubmitBtn?.querySelector('.btn-loading');
            
            if (confirmSubmitBtn) confirmSubmitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // ORDER HISTORY FUNCTIONALITY
    async loadOrderHistory() {
        try {
            const historyLoading = document.getElementById('historyLoading');
            const historyContent = document.getElementById('historyContent');
            
            if (historyLoading) historyLoading.style.display = 'block';
            if (historyContent) historyContent.style.display = 'none';
            
            console.log('🔄 Loading order history...');
            
            const response = await fetch('/api/orders/history');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Order history loaded:', data);
            
            if (data.success !== false) {
                this.orderHistory = data.orders || [];
                this.renderOrderHistory(this.orderHistory);
            } else {
                throw new Error(data.error || 'Failed to load order history');
            }
            
        } catch (error) {
            console.error('❌ Error loading order history:', error);
            this.showOrderHistoryError('Unable to load order history: ' + error.message);
        } finally {
            const historyLoading = document.getElementById('historyLoading');
            if (historyLoading) historyLoading.style.display = 'none';
        }
    }

    filterOrderHistory() {
        try {
            const typeFilter = document.getElementById('historyType')?.value || '';
            const supplierFilter = document.getElementById('historySupplier')?.value || '';
            const categoryFilter = document.getElementById('historyCategory')?.value || '';
            
            let filteredHistory = this.orderHistory;
            
            if (typeFilter) {
                filteredHistory = filteredHistory.filter(order => order.Status === typeFilter);
            }
            
            if (supplierFilter) {
                filteredHistory = filteredHistory.filter(order => order.Supplier_Name === supplierFilter);
            }
            
            if (categoryFilter) {
                filteredHistory = filteredHistory.filter(order => order.Category === categoryFilter);
            }
            
            console.log(`🔍 Filtered history: ${filteredHistory.length} of ${this.orderHistory.length} orders`);
            this.renderOrderHistory(filteredHistory);
            
        } catch (error) {
            console.error('❌ Error filtering order history:', error);
        }
    }

    renderOrderHistory(orders) {
        try {
            const historyContent = document.getElementById('historyContent');
            if (!historyContent) return;
            
            historyContent.style.display = 'block';
            
            if (!orders || orders.length === 0) {
                historyContent.innerHTML = `
                    <div class="no-history">
                        <div class="no-history-icon">📋</div>
                        <h3>No Orders Found</h3>
                        <p>No orders match your current filters.</p>
                    </div>
                `;
                return;
            }
            
            const sortedOrders = orders.sort((a, b) => {
                const dateA = new Date(`${a.Date} ${a.Time}`);
                const dateB = new Date(`${b.Date} ${b.Time}`);
                return dateB - dateA;
            });
            
            historyContent.innerHTML = `
                <div class="history-summary">
                    <h3>Order History (${orders.length} orders)</h3>
                </div>
                <div class="history-list">
                    ${sortedOrders.map(order => this.renderOrderCard(order)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Error rendering order history:', error);
        }
    }

    renderOrderCard(order) {
        try {
            let materials = [];
            try {
                materials = order.Materials_List ? JSON.parse(order.Materials_List) : [];
            } catch (parseError) {
                console.warn('❌ Error parsing materials list for order:', order.Order_ID, parseError);
                materials = [];
            }
            
            const isOrder = order.Status === 'ORDER';
            const statusIcon = isOrder ? '📦' : '💬';
            const statusColor = isOrder ? 'var(--primary-blue)' : 'var(--warning-orange)';
            
            const escapeHtml = (text) => {
                if (!text) return '';
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            return `
                <div class="history-card">
                    <div class="history-card-header">
                        <div class="order-info">
                            <div class="order-id">
                                <span class="status-icon" style="color: ${statusColor}">${statusIcon}</span>
                                <span class="order-number">${escapeHtml(order.Order_ID || 'N/A')}</span>
                            </div>
                            <div class="order-meta">
                                <span class="order-date">${escapeHtml(order.Date || '')} ${escapeHtml(order.Time || '')}</span>
                                <span class="order-type" style="color: ${statusColor}">${escapeHtml(order.Status || '')}</span>
                            </div>
                        </div>
                        <div class="urgency-badge urgency-${(order.Urgency || 'normal').toLowerCase()}">
                            ${escapeHtml(order.Urgency || 'Normal')}
                        </div>
                    </div>
                    
                    <div class="history-card-body">
                        <div class="order-details">
                            <div class="detail-row">
                                <span class="detail-label">Category:</span>
                                <span class="detail-value">${escapeHtml(order.Category || 'N/A')}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Supplier:</span>
                                <span class="detail-value">${escapeHtml(order.Supplier_Name || 'N/A')}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Requestor:</span>
                                <span class="detail-value">${escapeHtml(order.Requestor_Name || 'N/A')}</span>
                            </div>
                            ${order.Project_Ref ? `
                            <div class="detail-row">
                                <span class="detail-label">Job #:</span>
                                <span class="detail-value">${escapeHtml(order.Project_Ref)}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <div class="materials-summary">
                            <span class="materials-count">${parseInt(order.Total_Items) || 0} items</span>
                            <span class="materials-quantity">${parseInt(order.Total_Quantity) || 0} total qty</span>
                        </div>
                        
                        ${materials.length > 0 ? `
                        <div class="materials-preview">
                            <button type="button" class="toggle-materials" onclick="window.app.toggleMaterials('${escapeHtml(order.Order_ID)}')">
                                <span>View Materials</span>
                                <span class="toggle-icon">▼</span>
                            </button>
                            <div class="materials-detail" id="materials-${escapeHtml(order.Order_ID)}" style="display: none;">
                                ${materials.map((material) => {
                                    const materialName = typeof material === 'object' ? material.name : material;
                                    const materialQuantity = typeof material === 'object' ? material.quantity : 1;
                                    const materialUnit = typeof material === 'object' ? material.unit : 'pcs';
                                    
                                    return `
                                        <div class="material-item-history">
                                            <span class="material-name">${escapeHtml(materialName || 'Unknown Material')}</span>
                                            <span class="material-quantity">${parseInt(materialQuantity) || 1} ${escapeHtml(materialUnit || 'pcs')}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${order.Notes ? `
                        <div class="order-notes">
                            <strong>Notes:</strong> ${escapeHtml(order.Notes)}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Error rendering order card:', error);
            return `<div class="history-card error">Error loading order: ${order.Order_ID || 'Unknown'}</div>`;
        }
    }

    toggleMaterials(orderId) {
        try {
            const materialsDetail = document.getElementById(`materials-${orderId}`);
            const toggleBtn = materialsDetail?.previousElementSibling;
            const toggleIcon = toggleBtn?.querySelector('.toggle-icon');
            
            if (materialsDetail) {
                const isHidden = materialsDetail.style.display === 'none';
                materialsDetail.style.display = isHidden ? 'block' : 'none';
                
                if (toggleIcon) {
                    toggleIcon.textContent = isHidden ? '▲' : '▼';
                }
                
                if (toggleBtn) {
                    const toggleText = toggleBtn.querySelector('span:first-child');
                    if (toggleText) {
                        toggleText.textContent = isHidden ? 'Hide Materials' : 'View Materials';
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error toggling materials:', error);
        }
    }

    showOrderHistoryError(message) {
        try {
            const historyContent = document.getElementById('historyContent');
            if (historyContent) {
                historyContent.style.display = 'block';
                historyContent.innerHTML = `
                    <div class="history-error">
                        <div class="error-icon">⚠️</div>
                        <h3>Error Loading History</h3>
                        <p>${message}</p>
                        <button onclick="window.app.loadOrderHistory()" class="btn btn-secondary btn-small">
                            Try Again
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error showing order history error:', error);
        }
    }

    showSuccess(type, id, supplier) {
        try {
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            const successAlert = document.getElementById('successAlert');
            const successMessage = document.getElementById('successMessage');
            const referenceId = document.getElementById('referenceId');
            const successSupplier = document.getElementById('successSupplier');

            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'none';
            if (successAlert) successAlert.style.display = 'block';
            if (successMessage) successMessage.textContent = `Your ${type} request has been submitted successfully and sent to the supplier!`;
            if (referenceId) referenceId.textContent = id;
            if (successSupplier) successSupplier.textContent = supplier;

            this.pendingSubmissionData = null;
            this.orderHistory = [];

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
                
                setTimeout(() => {
                    if (errorAlert) errorAlert.style.display = 'none';
                }, 5000);
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (error) {
            console.error('❌ Error showing error message:', error);
        }
    }
}

// Global functions
function resetForm() {
    try {
        const mainForm = document.getElementById('mainForm');
        const confirmationPage = document.getElementById('confirmationPage');
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        
        if (mainForm) mainForm.style.display = 'block';
        if (confirmationPage) confirmationPage.style.display = 'none';
        if (successAlert) successAlert.style.display = 'none';
        if (errorAlert) errorAlert.style.display = 'none';
        
        const form = document.getElementById('materialForm');
        if (form) form.reset();
        
        if (window.app) {
            window.app.selectedMaterials = [];
            window.app.filteredMaterials = [];
            window.app.selectedSubcategory = '';
            window.app.pendingSubmissionData = null;
            window.app.uploadedFile = null;
            window.app.removeFile();
            window.app.renderSelectedMaterials();
            window.app.resetMaterialSelection();
            window.app.validateForm();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting Enhanced App (PDF Upload + Order History)');
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
