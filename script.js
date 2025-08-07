// Enhanced script.js with PDF Upload, Tab Navigation, and Order History
class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        this.filteredMaterials = [];
        this.selectedSubcategory = '';
        this.pendingSubmissionData = null;
        this.currentTab = 'submit-request';
        this.uploadedPDF = null;
        this.orderHistory = [];
        this.filteredHistory = [];
    }

    init() {
        console.log('🚀 Initializing Enhanced LCMB Material Management App (PDF + History + Tabs)');
        
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
        this.setupTabNavigation();
        this.setupPDFUpload();
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

            // PDF mode change
            const pdfModeInputs = document.querySelectorAll('input[name="pdfMode"]');
            if (pdfModeInputs && pdfModeInputs.length > 0) {
                pdfModeInputs.forEach(input => {
                    if (input) {
                        input.addEventListener('change', () => this.handlePDFModeChange());
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

            // Confirmation page event listeners
            const backToEditBtn = document.getElementById('backToEditBtn');
            if (backToEditBtn) {
                backToEditBtn.addEventListener('click', () => this.goBackToEdit());
            }

            const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
            if (confirmSubmitBtn) {
                confirmSubmitBtn.addEventListener('click', () => this.handleConfirmedSubmission());
            }

            const addMoreMaterialsBtn = document.getElementById('addMoreMaterialsBtn');
            if (addMoreMaterialsBtn) {
                addMoreMaterialsBtn.addEventListener('click', () => this.goBackToEdit());
            }

            // Order history event listeners
            const historySearch = document.getElementById('historySearch');
            if (historySearch) {
                historySearch.addEventListener('input', () => this.filterOrderHistory());
            }

            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) {
                statusFilter.addEventListener('change', () => this.filterOrderHistory());
            }

            const supplierFilter = document.getElementById('supplierFilter');
            if (supplierFilter) {
                supplierFilter.addEventListener('change', () => this.filterOrderHistory());
            }

            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => this.filterOrderHistory());
            }

            const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
            if (refreshHistoryBtn) {
                refreshHistoryBtn.addEventListener('click', () => this.loadOrderHistory());
            }
            
            console.log('✅ Enhanced event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    setupTabNavigation() {
        try {
            console.log('🔗 Setting up tab navigation...');
            
            const tabButtons = document.querySelectorAll('.tab-button');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const targetTab = button.dataset.tab;
                    
                    // Update active tab button
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Update active tab content
                    tabContents.forEach(content => content.classList.remove('active'));
                    const targetContent = document.getElementById(`${targetTab}-content`);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                    
                    // Update current tab and handle tab-specific logic
                    this.currentTab = targetTab;
                    this.handleTabChange(targetTab);
                });
            });
            
            console.log('✅ Tab navigation setup complete');
        } catch (error) {
            console.error('❌ Error setting up tab navigation:', error);
        }
    }

    handleTabChange(tabName) {
        try {
            console.log('🔄 Switching to tab:', tabName);
            
            if (tabName === 'order-history') {
                // Load order history when switching to history tab
                this.loadOrderHistory();
            }
            
            // Hide any alerts when switching tabs
            this.hideAlerts();
            
        } catch (error) {
            console.error('❌ Error handling tab change:', error);
        }
    }

    setupPDFUpload() {
        try {
            console.log('📄 Setting up PDF upload functionality...');
            
            const pdfDropzone = document.getElementById('pdfDropzone');
            const pdfFileInput = document.getElementById('pdfFileInput');
            const browseButton = document.getElementById('browseButton');
            const removePdfBtn = document.getElementById('removePdfBtn');
            
            // Drag and drop events
            if (pdfDropzone) {
                pdfDropzone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    pdfDropzone.classList.add('dragover');
                });
                
                pdfDropzone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    pdfDropzone.classList.remove('dragover');
                });
                
                pdfDropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    pdfDropzone.classList.remove('dragover');
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        this.handlePDFFile(files[0]);
                    }
                });
                
                pdfDropzone.addEventListener('click', () => {
                    if (pdfFileInput) pdfFileInput.click();
                });
            }
            
            // Browse button
            if (browseButton) {
                browseButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (pdfFileInput) pdfFileInput.click();
                });
            }
            
            // File input change
            if (pdfFileInput) {
                pdfFileInput.addEventListener('change', (e) => {
                    const files = e.target.files;
                    if (files.length > 0) {
                        this.handlePDFFile(files[0]);
                    }
                });
            }
            
            // Remove PDF button
            if (removePdfBtn) {
                removePdfBtn.addEventListener('click', () => {
                    this.removePDF();
                });
            }
            
            console.log('✅ PDF upload setup complete');
        } catch (error) {
            console.error('❌ Error setting up PDF upload:', error);
        }
    }

    handlePDFFile(file) {
        try {
            console.log('📄 Processing PDF file:', {
                name: file.name,
                size: file.size,
                type: file.type
            });
            
            // Validate file type
            if (file.type !== 'application/pdf') {
                this.showError('Please select a PDF file only.');
                return;
            }
            
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (file.size > maxSize) {
                this.showError('PDF file size must be less than 10MB.');
                return;
            }
            
            // Show file preview
            this.showPDFPreview(file);
            
            // Convert to base64
            this.convertPDFToBase64(file);
            
        } catch (error) {
            console.error('❌ Error handling PDF file:', error);
            this.showError('Error processing PDF file: ' + error.message);
        }
    }

    showPDFPreview(file) {
        try {
            const pdfDropzone = document.getElementById('pdfDropzone');
            const pdfPreview = document.getElementById('pdfPreview');
            const pdfFileName = document.getElementById('pdfFileName');
            const pdfFileSize = document.getElementById('pdfFileSize');
            
            if (pdfDropzone) pdfDropzone.style.display = 'none';
            if (pdfPreview) pdfPreview.style.display = 'block';
            if (pdfFileName) pdfFileName.textContent = file.name;
            if (pdfFileSize) pdfFileSize.textContent = this.formatFileSize(file.size);
            
        } catch (error) {
            console.error('❌ Error showing PDF preview:', error);
        }
    }

    convertPDFToBase64(file) {
        try {
            const pdfProgress = document.getElementById('pdfProgress');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            if (pdfProgress) pdfProgress.style.display = 'block';
            if (progressText) progressText.textContent = 'Converting PDF...';
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const base64Data = e.target.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
                    
                    this.uploadedPDF = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        base64: base64Data,
                        originalFile: file
                    };
                    
                    if (progressFill) progressFill.style.width = '100%';
                    if (progressText) progressText.textContent = 'PDF ready!';
                    
                    setTimeout(() => {
                        if (pdfProgress) pdfProgress.style.display = 'none';
                    }, 1000);
                    
                    console.log('✅ PDF converted to base64 successfully');
                    this.validateForm();
                    
                } catch (error) {
                    console.error('❌ Error processing PDF data:', error);
                    this.showError('Error processing PDF file.');
                    this.removePDF();
                }
            };
            
            reader.onerror = () => {
                console.error('❌ Error reading PDF file');
                this.showError('Error reading PDF file.');
                this.removePDF();
            };
            
            reader.onprogress = (e) => {
                if (e.lengthComputable && progressFill) {
                    const percentLoaded = Math.round((e.loaded / e.total) * 100);
                    progressFill.style.width = percentLoaded + '%';
                }
            };
            
            reader.readAsDataURL(file);
            
        } catch (error) {
            console.error('❌ Error converting PDF to base64:', error);
            this.showError('Error converting PDF file.');
        }
    }

    removePDF() {
        try {
            const pdfDropzone = document.getElementById('pdfDropzone');
            const pdfPreview = document.getElementById('pdfPreview');
            const pdfFileInput = document.getElementById('pdfFileInput');
            const pdfProgress = document.getElementById('pdfProgress');
            
            if (pdfDropzone) pdfDropzone.style.display = 'block';
            if (pdfPreview) pdfPreview.style.display = 'none';
            if (pdfProgress) pdfProgress.style.display = 'none';
            if (pdfFileInput) pdfFileInput.value = '';
            
            this.uploadedPDF = null;
            this.validateForm();
            
            console.log('🗑️ PDF removed successfully');
            
        } catch (error) {
            console.error('❌ Error removing PDF:', error);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handlePDFModeChange() {
        try {
            const selectedMode = document.querySelector('input[name="pdfMode"]:checked')?.value;
            const pdfUploadSection = document.getElementById('pdfUploadSection');
            const materialsGroup = document.getElementById('materialsGroup');
            const categoryGroup = document.getElementById('categoryGroup');
            const supplierGroup = document.getElementById('supplierGroup');
            const materialsHelpText = document.getElementById('materialsHelpText');
            
            console.log('📄 PDF mode changed to:', selectedMode);
            
            if (selectedMode === 'no-pdf') {
                // Hide PDF upload, show materials
                if (pdfUploadSection) pdfUploadSection.style.display = 'none';
                if (materialsGroup) materialsGroup.style.display = 'block';
                if (categoryGroup) categoryGroup.style.display = 'block';
                if (supplierGroup) supplierGroup.style.display = 'block';
                if (materialsHelpText) materialsHelpText.textContent = 'Browse materials and specify the quantities you need for your order.';
                this.removePDF();
                
            } else if (selectedMode === 'with-order') {
                // Show PDF upload and materials
                if (pdfUploadSection) pdfUploadSection.style.display = 'block';
                if (materialsGroup) materialsGroup.style.display = 'block';
                if (categoryGroup) categoryGroup.style.display = 'block';
                if (supplierGroup) supplierGroup.style.display = 'block';
                if (materialsHelpText) materialsHelpText.textContent = 'Browse materials and specify quantities. Your PDF will be attached to the email.';
                
            } else if (selectedMode === 'pdf-only') {
                // Show PDF upload, hide materials
                if (pdfUploadSection) pdfUploadSection.style.display = 'block';
                if (materialsGroup) materialsGroup.style.display = 'none';
                if (categoryGroup) categoryGroup.style.display = 'block';
                if (supplierGroup) supplierGroup.style.display = 'block';
                
                // Clear selected materials
                this.selectedMaterials = [];
                this.renderSelectedMaterials();
                this.resetMaterialSelection();
            }
            
            this.validateForm();
            
        } catch (error) {
            console.error('❌ Error handling PDF mode change:', error);
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
                materials: Object.keys(data.data.materials || {}).length,
                materialsByCategoryAndSupplier: data.data.materialsByCategoryAndSupplier ? 'Available' : 'Not Available'
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
                console.log('🔍 Selected Supplier ID:', selectedOption.dataset.id);
            }

            // Only populate materials if not in PDF-only mode
            const pdfMode = document.querySelector('input[name="pdfMode"]:checked')?.value;
            if (selectedCategory && pdfMode !== 'pdf-only') {
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

            // Get selected supplier ID
            const selectedOption = supplierSelect.selectedOptions[0];
            const selectedSupplierId = selectedOption?.dataset.id;

            if (!selectedSupplierId) return;

            // Get materials for this category and supplier to extract subcategories
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

            // Show subcategory dropdown
            const subcategoryGroup = document.getElementById('subcategoryGroup');
            if (subcategoryGroup) {
                subcategoryGroup.style.display = 'block';
            }

            console.log(`📁 Found ${subcategories.length} subcategories for ${category} supplier ${selectedSupplierId}`);
            
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
            const supplierSelect = document.getElementById('supplier');
            
            if (!category || !supplierSelect.value) {
                console.log('⚠️ Missing category or supplier');
                return;
            }

            // Get selected supplier ID from the option's dataset
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

            console.log(`🔍 Loading materials for Category: ${category}, Supplier ID: ${selectedSupplierId}, Subcategory: ${subcategory || 'All'}`);

            // Get materials for this specific category and supplier ID
            let materials = [];
            
            // Check if we have the new grouped structure (preferred)
            if (this.formData?.data?.materialsByCategoryAndSupplier?.[category]?.[selectedSupplierId]) {
                materials = this.formData.data.materialsByCategoryAndSupplier[category][selectedSupplierId];
                console.log('✅ Using materialsByCategoryAndSupplier structure');
            } else if (this.formData?.data?.materials?.[category]) {
                // Fallback: filter from the flat structure
                materials = this.formData.data.materials[category].filter(m => m.supplierId === selectedSupplierId);
                console.log('⚠️ Using fallback materials filtering');
            } else {
                console.log('❌ No materials found for category:', category);
                materials = [];
            }
            
            // Filter by subcategory if selected
            if (subcategory) {
                const beforeFilter = materials.length;
                materials = materials.filter(m => m.subcategory === subcategory);
                console.log(`📁 Filtered by subcategory: ${beforeFilter} → ${materials.length} materials`);
            }

            this.filteredMaterials = materials;
            
            console.log(`📦 Final result: ${materials.length} materials for supplier ${selectedSupplierId}`);
            
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
                    (material.code && material.code.toLowerCase().includes(searchTerm)) ||
                    (material.subcategory && material.subcategory.toLowerCase().includes(searchTerm))
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
            console.log(`✅ Added material: ${material.name} (${quantity} ${material.unit}) from supplier ${material.supplierId}`);

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
                    // Also update the card appearance
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

            // Check PDF mode specific requirements
            const pdfMode = document.querySelector('input[name="pdfMode"]:checked')?.value;
            
            if (pdfMode === 'no-pdf') {
                // Need materials for no-pdf mode
                if (this.selectedMaterials.length === 0) {
                    isValid = false;
                }
            } else if (pdfMode === 'with-order') {
                // Need both PDF and materials
                if (!this.uploadedPDF || this.selectedMaterials.length === 0) {
                    isValid = false;
                }
            } else if (pdfMode === 'pdf-only') {
                // Need only PDF
                if (!this.uploadedPDF) {
                    isValid = false;
                }
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
            
            // Prepare form data for confirmation
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add selected materials with quantities (if not PDF-only mode)
            const pdfMode = data.pdfMode;
            if (pdfMode !== 'pdf-only') {
                data.materials = this.selectedMaterials;
            } else {
                data.materials = [];
            }
            
            // Add PDF data if present
            if (this.uploadedPDF) {
                data.pdfAttachment = {
                    name: this.uploadedPDF.name,
                    size: this.uploadedPDF.size,
                    type: this.uploadedPDF.type,
                    base64: this.uploadedPDF.base64
                };
            }
            
            // Get supplier details
            const supplierSelect = document.getElementById('supplier');
            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                data.supplierEmail = selectedOption.dataset.email || '';
                data.supplierPhone = selectedOption.dataset.phone || '';
                data.supplierId = selectedOption.dataset.id || '';
            }
            
            console.log('📋 Form data prepared for confirmation:', data);
            
            // Store data for later submission
            this.pendingSubmissionData = data;
            
            // Show confirmation page
            this.showConfirmationPage(data);
            
        } catch (error) {
            console.error('❌ Form preparation error:', error);
            this.showError(`Error preparing form: ${error.message}`);
        }
    }

    showConfirmationPage(data) {
        try {
            console.log('📋 Displaying confirmation page');
            
            // Hide main form and show confirmation page
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            
            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'block';
            
            // Update titles based on request type
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
            
            // Show/hide PDF attachment section
            const pdfAttachmentSection = document.getElementById('pdfAttachmentSection');
            if (data.pdfAttachment) {
                if (pdfAttachmentSection) pdfAttachmentSection.style.display = 'block';
                this.populateElement('confirmPdfFileName', data.pdfAttachment.name);
                this.populateElement('confirmPdfFileSize', this.formatFileSize(data.pdfAttachment.size));
            } else {
                if (pdfAttachmentSection) pdfAttachmentSection.style.display = 'none';
            }
            
            // Populate order summary
            this.populateElement('confirmRequestType', requestType === 'order' ? 'Material Order' : 'Quote Request');
            this.populateElement('confirmPdfMode', this.formatPdfMode(data.pdfMode));
            this.populateElement('confirmCategory', data.category);
            this.populateElement('confirmUrgency', data.urgency, 'Normal');
            this.populateElement('confirmProjectRef', data.projectRef, 'Not specified');
            
            // Populate supplier information
            this.populateElement('confirmSupplierName', data.supplier);
            this.populateElement('confirmSupplierEmail', data.supplierEmail, 'Not available');
            this.populateElement('confirmSupplierPhone', data.supplierPhone, 'Not available');
            
            // Populate requestor information
            this.populateElement('confirmRequestorName', data.requestorName);
            this.populateElement('confirmRequestorEmail', data.requestorEmail);
            
            // Show/hide materials section based on PDF mode
            const materialsConfirmSection = document.getElementById('materialsConfirmSection');
            if (data.pdfMode === 'pdf-only') {
                if (materialsConfirmSection) materialsConfirmSection.style.display = 'none';
            } else {
                if (materialsConfirmSection) materialsConfirmSection.style.display = 'block';
                this.populateConfirmationMaterials(data.materials);
            }
            
            // Handle special instructions
            const notesSection = document.getElementById('notesSection');
            const confirmNotes = document.getElementById('confirmNotes');
            if (data.notes && data.notes.trim()) {
                if (notesSection) notesSection.style.display = 'block';
                this.populateElement('confirmNotes', data.notes);
            } else {
                if (notesSection) notesSection.style.display = 'none';
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing confirmation page:', error);
            this.showError('Error displaying confirmation page: ' + error.message);
        }
    }

    formatPdfMode(mode) {
        const modes = {
            'no-pdf': 'No PDF Attachment',
            'with-order': 'PDF + Materials List',
            'pdf-only': 'PDF Only (No Materials)'
        };
        return modes[mode] || mode;
    }

    populateConfirmationMaterials(materials) {
        try {
            const materialsSummary = document.getElementById('confirmMaterialsSummary');
            const materialsList = document.getElementById('confirmMaterialsList');
            
            if (!materials || materials.length === 0) {
                if (materialsSummary) materialsSummary.innerHTML = '<div class="summary-stat"><span class="stat-number">0</span><span class="stat-label">Materials</span></div>';
                if (materialsList) materialsList.innerHTML = '<div class="no-materials">No materials specified</div>';
                return;
            }
            
            // Summary
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
            
            // Materials list
            if (materialsList) {
                materialsList.innerHTML = materials.map((material, index) => `
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

    populateElement(elementId, value, defaultValue = '') {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value || defaultValue;
            }
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
            
            // Scroll to top
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
            
            // Disable form
            if (confirmSubmitBtn) confirmSubmitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';

            const data = this.pendingSubmissionData;
            console.log('📤 Submitting confirmed request to supplier:', data);
            
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
            // Re-enable form
            const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
            const btnText = confirmSubmitBtn?.querySelector('.btn-text');
            const btnLoading = confirmSubmitBtn?.querySelector('.btn-loading');
            
            if (confirmSubmitBtn) confirmSubmitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    // Order History Functions
    async loadOrderHistory() {
        try {
            const historyLoading = document.getElementById('historyLoading');
            const historyResults = document.getElementById('historyResults');
            
            if (historyLoading) historyLoading.style.display = 'block';
            if (historyResults) historyResults.style.display = 'none';
            
            console.log('📋 Loading order history...');
            
            const response = await fetch('/api/history/load');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Order history loaded:', data);
            
            if (data.success !== false) {
                this.orderHistory = data.orders || [];
                this.populateHistoryFilters();
                this.filterOrderHistory();
            } else {
                throw new Error(data.error || 'Failed to load order history');
            }
            
        } catch (error) {
            console.error('❌ Error loading order history:', error);
            this.showError('Unable to load order history: ' + error.message);
            this.displayNoHistory();
        } finally {
            const historyLoading = document.getElementById('historyLoading');
            if (historyLoading) historyLoading.style.display = 'none';
        }
    }

    populateHistoryFilters() {
        try {
            const supplierFilter = document.getElementById('supplierFilter');
            const categoryFilter = document.getElementById('categoryFilter');
            
            // Get unique suppliers and categories from history
            const suppliers = [...new Set(this.orderHistory.map(order => order.supplierName).filter(s => s))];
            const categories = [...new Set(this.orderHistory.map(order => order.category).filter(c => c))];
            
            // Populate supplier filter
            if (supplierFilter) {
                supplierFilter.innerHTML = '<option value="">All Suppliers</option>';
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier;
                    option.textContent = supplier;
                    supplierFilter.appendChild(option);
                });
            }
            
            // Populate category filter
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">All Categories</option>';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }
            
        } catch (error) {
            console.error('❌ Error populating history filters:', error);
        }
    }

    filterOrderHistory() {
        try {
            const searchTerm = document.getElementById('historySearch')?.value?.toLowerCase() || '';
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            const supplierFilter = document.getElementById('supplierFilter')?.value || '';
            const categoryFilter = document.getElementById('categoryFilter')?.value || '';
            
            this.filteredHistory = this.orderHistory.filter(order => {
                // Text search across multiple fields
                const searchMatch = !searchTerm || 
                    order.orderId?.toLowerCase().includes(searchTerm) ||
                    order.supplierName?.toLowerCase().includes(searchTerm) ||
                    order.category?.toLowerCase().includes(searchTerm) ||
                    order.requestorName?.toLowerCase().includes(searchTerm);
                
                // Status filter
                const statusMatch = !statusFilter || order.status === statusFilter;
                
                // Supplier filter
                const supplierMatch = !supplierFilter || order.supplierName === supplierFilter;
                
                // Category filter
                const categoryMatch = !categoryFilter || order.category === categoryFilter;
                
                return searchMatch && statusMatch && supplierMatch && categoryMatch;
            });
            
            this.displayOrderHistory();
            
        } catch (error) {
            console.error('❌ Error filtering order history:', error);
        }
    }

    displayOrderHistory() {
        try {
            const historyResults = document.getElementById('historyResults');
            if (!historyResults) return;
            
            historyResults.style.display = 'block';
            
            if (this.filteredHistory.length === 0) {
                this.displayNoHistory();
                return;
            }
            
            // Sort by date (newest first)
            const sortedOrders = this.filteredHistory.sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateB - dateA;
            });
            
            historyResults.innerHTML = `
                <div class="history-header">
                    <h3>Found ${sortedOrders.length} order${sortedOrders.length !== 1 ? 's' : ''}</h3>
                </div>
                <div class="history-list">
                    ${sortedOrders.map(order => this.renderOrderCard(order)).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Error displaying order history:', error);
        }
    }

    renderOrderCard(order) {
        try {
            const materials = this.parseMaterialsList(order.materialsList);
            const hasPdf = order.pdfLink && order.pdfLink !== 'N/A';
            
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div class="order-id-section">
                            <h4 class="order-id">${order.orderId || 'N/A'}</h4>
                            <span class="order-status ${order.status?.toLowerCase()}">${order.status}</span>
                        </div>
                        <div class="order-date">
                            ${this.formatDate(order.date)} at ${order.time}
                        </div>
                    </div>
                    
                    <div class="order-details">
                        <div class="order-info-grid">
                            <div class="info-item">
                                <label>Supplier:</label>
                                <span>${order.supplierName || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Category:</label>
                                <span>${order.category || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Requestor:</label>
                                <span>${order.requestorName || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Priority:</label>
                                <span class="priority ${order.urgency?.toLowerCase()}">${order.urgency || 'Normal'}</span>
                            </div>
                            ${order.projectRef ? `
                            <div class="info-item">
                                <label>Job #:</label>
                                <span>${order.projectRef}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        ${materials.length > 0 ? `
                        <div class="materials-section">
                            <div class="materials-header">
                                <h5>Materials (${materials.length} items)</h5>
                                <button type="button" class="toggle-materials" onclick="window.app.toggleMaterials('${order.orderId}')">
                                    <span class="toggle-icon">▼</span>
                                    <span class="toggle-text">Show Details</span>
                                </button>
                            </div>
                            <div class="materials-list-history" id="materials-${order.orderId}" style="display: none;">
                                ${materials.map(material => `
                                    <div class="material-item-history">
                                        <div class="material-name">${material.name}</div>
                                        <div class="material-details">
                                            ${material.code ? `Code: ${material.code} • ` : ''}
                                            Qty: ${material.quantity} ${material.unit}
                                            ${material.subcategory ? ` • ${material.subcategory}` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        
                        ${order.notes ? `
                        <div class="notes-section">
                            <h5>Special Instructions</h5>
                            <p class="order-notes">${order.notes}</p>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-actions">
                        ${hasPdf ? `
                        <button type="button" class="btn btn-secondary" onclick="window.app.viewPDF('${order.pdfLink}')">
                            📄 View PDF
                        </button>
                        ` : ''}
                        <button type="button" class="btn btn-secondary" onclick="window.app.duplicateOrder('${order.orderId}')">
                            📋 Duplicate Order
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="window.app.contactSupplier('${order.supplierEmail}', '${order.orderId}')">
                            📧 Contact Supplier
                        </button>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Error rendering order card:', error);
            return '<div class="order-card error">Error displaying order</div>';
        }
    }

    parseMaterialsList(materialsList) {
        try {
            if (!materialsList) return [];
            
            if (typeof materialsList === 'string') {
                try {
                    return JSON.parse(materialsList);
                } catch {
                    // If not JSON, try to parse as comma-separated list
                    return materialsList.split(',').map(item => ({
                        name: item.trim(),
                        quantity: 1,
                        unit: 'pcs',
                        code: '',
                        subcategory: ''
                    }));
                }
            }
            
            if (Array.isArray(materialsList)) {
                return materialsList;
            }
            
            return [];
            
        } catch (error) {
            console.error('❌ Error parsing materials list:', error);
            return [];
        }
    }

    formatDate(dateString) {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return dateString || 'N/A';
        }
    }

    displayNoHistory() {
        try {
            const historyResults = document.getElementById('historyResults');
            if (!historyResults) return;
            
            historyResults.style.display = 'block';
            historyResults.innerHTML = `
                <div class="no-history">
                    <div class="no-history-icon">📋</div>
                    <h3>No Orders Found</h3>
                    <p>No orders match your current filters. Try adjusting your search criteria or submit your first order.</p>
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Error displaying no history:', error);
        }
    }

    toggleMaterials(orderId) {
        try {
            const materialsDiv = document.getElementById(`materials-${orderId}`);
            const toggleButton = materialsDiv?.parentElement?.querySelector('.toggle-materials');
            const toggleIcon = toggleButton?.querySelector('.toggle-icon');
            const toggleText = toggleButton?.querySelector('.toggle-text');
            
            if (!materialsDiv || !toggleButton) return;
            
            const isVisible = materialsDiv.style.display !== 'none';
            
            if (isVisible) {
                materialsDiv.style.display = 'none';
                if (toggleIcon) toggleIcon.textContent = '▼';
                if (toggleText) toggleText.textContent = 'Show Details';
            } else {
                materialsDiv.style.display = 'block';
                if (toggleIcon) toggleIcon.textContent = '▲';
                if (toggleText) toggleText.textContent = 'Hide Details';
            }
            
        } catch (error) {
            console.error('❌ Error toggling materials:', error);
        }
    }

    viewPDF(pdfLink) {
        try {
            if (!pdfLink || pdfLink === 'N/A') {
                this.showError('PDF link not available');
                return;
            }
            
            console.log('📄 Opening PDF:', pdfLink);
            window.open(pdfLink, '_blank');
            
        } catch (error) {
            console.error('❌ Error viewing PDF:', error);
            this.showError('Error opening PDF');
        }
    }

    duplicateOrder(orderId) {
        try {
            console.log('📋 Duplicating order:', orderId);
            
            // Find the order
            const order = this.orderHistory.find(o => o.orderId === orderId);
            if (!order) {
                this.showError('Order not found');
                return;
            }
            
            // Switch to submit request tab
            const submitTab = document.querySelector('.tab-button[data-tab="submit-request"]');
            if (submitTab) {
                submitTab.click();
            }
            
            // Populate form with order data
            setTimeout(() => {
                this.populateFormFromOrder(order);
            }, 100);
            
        } catch (error) {
            console.error('❌ Error duplicating order:', error);
            this.showError('Error duplicating order');
        }
    }

    populateFormFromOrder(order) {
        try {
            // Set request type
            const requestTypeRadio = document.querySelector(`input[name="requestType"][value="${order.status?.toLowerCase() === 'order' ? 'order' : 'quote'}"]`);
            if (requestTypeRadio) {
                requestTypeRadio.checked = true;
                this.handleRequestTypeChange();
            }
            
            // Set PDF mode to no-pdf (since we can't restore the original PDF)
            const noPdfRadio = document.querySelector('input[name="pdfMode"][value="no-pdf"]');
            if (noPdfRadio) {
                noPdfRadio.checked = true;
                this.handlePDFModeChange();
            }
            
            // Set category
            const categorySelect = document.getElementById('category');
            if (categorySelect && order.category) {
                categorySelect.value = order.category;
                this.handleCategoryChange();
                
                // Wait for suppliers to load, then set supplier
                setTimeout(() => {
                    const supplierSelect = document.getElementById('supplier');
                    if (supplierSelect && order.supplierName) {
                        supplierSelect.value = order.supplierName;
                        this.handleSupplierChange();
                        
                        // Wait for materials to load, then restore selected materials
                        setTimeout(() => {
                            this.restoreSelectedMaterials(order.materialsList);
                        }, 500);
                    }
                }, 300);
            }
            
            // Set other fields
            const requestorName = document.getElementById('requestorName');
            if (requestorName && order.requestorName) {
                requestorName.value = order.requestorName;
            }
            
            const requestorEmail = document.getElementById('requestorEmail');
            if (requestorEmail && order.requestorEmail) {
                requestorEmail.value = order.requestorEmail;
            }
            
            const urgency = document.getElementById('urgency');
            if (urgency && order.urgency) {
                urgency.value = order.urgency;
            }
            
            const projectRef = document.getElementById('projectRef');
            if (projectRef && order.projectRef) {
                projectRef.value = order.projectRef;
            }
            
            const notes = document.getElementById('notes');
            if (notes && order.notes) {
                notes.value = order.notes;
            }
            
            this.validateForm();
            
            // Show success message
            this.showInfo('Order duplicated successfully! Review and modify as needed.');
            
        } catch (error) {
            console.error('❌ Error populating form from order:', error);
            this.showError('Error populating form from order');
        }
    }

    restoreSelectedMaterials(materialsList) {
        try {
            const materials = this.parseMaterialsList(materialsList);
            if (materials.length === 0) return;
            
            // Clear current selection
            this.selectedMaterials = [];
            
            // Add each material if it exists in current filtered materials
            materials.forEach(orderMaterial => {
                const foundMaterial = this.filteredMaterials.find(m => 
                    m.name === orderMaterial.name || 
                    (orderMaterial.code && m.code === orderMaterial.code)
                );
                
                if (foundMaterial) {
                    const newMaterial = {
                        id: foundMaterial.id,
                        name: foundMaterial.name,
                        code: foundMaterial.code || '',
                        unit: foundMaterial.unit || 'pcs',
                        subcategory: foundMaterial.subcategory || '',
                        quantity: orderMaterial.quantity || 1,
                        supplierId: foundMaterial.supplierId,
                        supplierName: foundMaterial.supplierName
                    };
                    
                    this.selectedMaterials.push(newMaterial);
                }
            });
            
            this.renderSelectedMaterials();
            this.renderMaterialsList(); // Refresh to show selected checkboxes
            this.validateForm();
            
        } catch (error) {
            console.error('❌ Error restoring selected materials:', error);
        }
    }

    contactSupplier(supplierEmail, orderId) {
        try {
            if (!supplierEmail || supplierEmail === 'N/A') {
                this.showError('Supplier email not available');
                return;
            }
            
            const subject = encodeURIComponent(`Inquiry about Order ${orderId}`);
            const body = encodeURIComponent(`Dear Supplier,\n\nI am writing to inquire about order ${orderId}.\n\nBest regards,\nLCMB Group`);
            const mailtoLink = `mailto:${supplierEmail}?subject=${subject}&body=${body}`;
            
            console.log('📧 Opening email client for:', supplierEmail);
            window.location.href = mailtoLink;
            
        } catch (error) {
            console.error('❌ Error contacting supplier:', error);
            this.showError('Error opening email client');
        }
    }

    // Utility Functions
    showSuccess(type, id, supplier) {
        try {
            // Hide both form and confirmation page, show success
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

            // Clear pending data
            this.pendingSubmissionData = null;

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

    showInfo(message) {
        try {
            // Create a temporary info alert
            const existingInfo = document.querySelector('.alert-info');
            if (existingInfo) {
                existingInfo.remove();
            }
            
            const infoAlert = document.createElement('div');
            infoAlert.className = 'alert alert-info';
            infoAlert.style.display = 'block';
            infoAlert.innerHTML = `<strong>ℹ️ Info:</strong> ${message}`;
            
            const container = document.querySelector('.container');
            if (container && container.firstChild) {
                container.insertBefore(infoAlert, container.firstChild);
            }
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                if (infoAlert && infoAlert.parentNode) {
                    infoAlert.parentNode.removeChild(infoAlert);
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error showing info message:', error);
        }
    }

    hideAlerts() {
        try {
            const errorAlert = document.getElementById('errorAlert');
            const successAlert = document.getElementById('successAlert');
            
            if (errorAlert) errorAlert.style.display = 'none';
            if (successAlert) successAlert.style.display = 'none';
            
        } catch (error) {
            console.error('❌ Error hiding alerts:', error);
        }
    }
}

// Global function for resetting form
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
        
        // Reset form
        const form = document.getElementById('materialForm');
        if (form) form.reset();
        
        // Reset app state
        if (window.app) {
            window.app.selectedMaterials = [];
            window.app.filteredMaterials = [];
            window.app.selectedSubcategory = '';
            window.app.pendingSubmissionData = null;
            window.app.uploadedPDF = null;
            window.app.renderSelectedMaterials();
            window.app.resetMaterialSelection();
            window.app.removePDF();
            window.app.handlePDFModeChange();
            window.app.validateForm();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting Enhanced App (PDF + History + Tabs)');
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
