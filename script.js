// Enhanced script.js with PDF Upload, Tab Navigation, Order History, and Container Expansion
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
        console.log('🚀 Initializing Enhanced LCMB Material Management App (PDF + History + Tabs + Container Expansion)');
        
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

            // Event delegation for dynamic buttons
            const self = this;
            document.addEventListener('click', function(e) {
                // Handle toggle materials buttons
                if (e.target.closest('.toggle-materials')) {
                    const button = e.target.closest('.toggle-materials');
                    const materialsSection = button.closest('.materials-section');
                    const materialsDiv = materialsSection?.querySelector('.materials-list-history');
                    
                    if (materialsDiv) {
                        const orderId = materialsDiv.id.replace('materials-', '');
                        self.toggleMaterials(orderId);
                    }
                    return;
                }
                
                // Handle quantity buttons (+ and - buttons)
                if (e.target.classList.contains('qty-btn')) {
                    const index = parseInt(e.target.dataset.index);
                    const change = parseInt(e.target.dataset.change);
                    if (!isNaN(index) && !isNaN(change)) {
                        self.updateQuantity(index, change);
                    }
                    return;
                }
                
                // Handle remove material buttons
                if (e.target.classList.contains('remove-material')) {
                    const index = parseInt(e.target.dataset.index);
                    if (!isNaN(index)) {
                        self.removeMaterial(index);
                    }
                    return;
                }
                
                // Handle order action buttons (PDF, Duplicate, Contact)
                if (e.target.closest('[data-action]')) {
                    const button = e.target.closest('[data-action]');
                    const action = button.dataset.action;
                    const orderId = button.dataset.orderId;
                    const email = button.dataset.email;
                    const pdfLink = button.dataset.pdfLink;
                    
                    switch (action) {
                        case 'viewPDF':
                            self.viewPDF(pdfLink);
                            break;
                        case 'duplicateOrder':
                            self.duplicateOrder(orderId);
                            break;
                        case 'contactSupplier':
                            self.contactSupplier(email, orderId);
                            break;
                    }
                    return;
                }
            });
            
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
            
            // Contract container when switching away from submit-request tab
            if (tabName !== 'submit-request') {
                this.expandContainerForMaterials();
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
                
                // Clear selected materials and contract container
                this.selectedMaterials = [];
                this.renderSelectedMaterials();
                this.resetMaterialSelection();
                this.expandContainerForMaterials();
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

    // NEW: Container expansion function
    expandContainerForMaterials() {
        try {
            const formContainer = document.querySelector('.form-container');
            const materialsContainer = document.getElementById('materialsContainer');
            
            if (formContainer && materialsContainer) {
                // Check if materials are being displayed
                const isDisplayed = materialsContainer.style.display !== 'none' && 
                                   this.filteredMaterials && 
                                   this.filteredMaterials.length > 0;
                
                if (isDisplayed) {
                    formContainer.classList.add('expanded-for-materials');
                    console.log('📏 Container expanded for materials display');
                } else {
                    formContainer.classList.remove('expanded-for-materials');
                    console.log('📏 Container returned to normal width');
                }
            }
        } catch (error) {
            console.error('❌ Error expanding container:', error);
        }
    }

    // UPDATED: handleSupplierChange with container expansion
    handleSupplierChange() {
        try {
            const supplierSelect = document.getElementById('supplier');
            const categorySelect = document.getElementById('category');
            const materialsContainer = document.getElementById('materialsContainer');
            
            if (!supplierSelect) return;
            
            const selectedSupplier = supplierSelect.value;
            const selectedCategory = categorySelect?.value;
            console.log('🏢 Supplier changed to:', selectedSupplier);
            
            // Reset material selection
            this.resetMaterialSelection();

            if (!selectedSupplier) {
                this.hideSupplierInfo();
                if (materialsContainer) {
                    materialsContainer.style.display = 'none';
                }
                // Contract the container back to normal
                this.expandContainerForMaterials();
                this.validateForm();
                return;
            }

            // Show supplier info
            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                this.showSupplierInfo(selectedOption);
                console.log('🔍 Selected Supplier ID:', selectedOption.dataset.id);
            }

            // Show materials container
            if (materialsContainer) {
                materialsContainer.style.display = 'block';
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

    // UPDATED: populateMaterials function with container expansion
    populateMaterials(category, subcategory = '') {
        try {
            const materialSearch = document.getElementById('materialSearch');
            const materialsContainer = document.getElementById('materialsContainer');
            const materialsList = document.getElementById('materialsList');
            const supplierSelect = document.getElementById('supplier');
            
            console.log('🔍 populateMaterials called:', { category, subcategory });
            console.log('📋 Elements found:', {
                materialSearch: !!materialSearch,
                materialsContainer: !!materialsContainer,
                materialsList: !!materialsList,
                supplierSelect: !!supplierSelect
            });
            
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
            
            // FORCE SHOW the materials container
            if (materialsContainer) {
                materialsContainer.style.display = 'block';
                materialsContainer.style.visibility = 'visible';
                materialsContainer.style.opacity = '1';
                console.log('👁️ Materials container made visible');
            }
            
            // EXPAND THE FORM CONTAINER FOR MATERIALS
            this.expandContainerForMaterials();
            
            // Enable search and update placeholder
            if (materialSearch) {
                materialSearch.disabled = false;
                materialSearch.placeholder = materials.length > 0 
                    ? `Search from ${materials.length} materials...`
                    : 'No materials available for this supplier...';
            }

            // Render materials with container-aware sizing
            console.log('🎨 About to render materials list...');
            this.renderMaterialsList();
            
        } catch (error) {
            console.error('❌ Error populating materials:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    // UPDATED: renderMaterialsList with container-aware sizing
    renderMaterialsList(searchTerm = '') {
        try {
            const materialsList = document.getElementById('materialsList');
            if (!materialsList) {
                console.error('❌ materialsList element not found!');
                return;
            }

            console.log('🎨 renderMaterialsList called with:', {
                searchTerm,
                filteredMaterialsCount: this.filteredMaterials?.length || 0,
                materialsListElement: !!materialsList
            });

            let materialsToShow = this.filteredMaterials || [];

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

            console.log('📊 Materials to display:', {
                totalAvailable: materialsToShow.length,
                displaying: displayMaterials.length,
                maxResults
            });

            if (displayMaterials.length === 0) {
                console.log('⚠️ No materials to display');
                materialsList.innerHTML = `
                    <div class="no-materials" style="grid-column: 1 / -1; text-align: center; padding: 3rem 2rem; color: var(--gray-500); background: var(--white); border-radius: var(--radius-md); border: 2px dashed var(--gray-300);">
                        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">🔍</div>
                        <p>No materials found${searchTerm ? ` for "${searchTerm}"` : ''}.</p>
                        ${searchTerm ? '<p>Try a different search term.</p>' : '<p>Try selecting a different category or supplier.</p>'}
                    </div>
                `;
                return;
            }

            // RESPONSIVE GRID based on container size
            const formContainer = document.querySelector('.form-container');
            const isExpanded = formContainer?.classList.contains('expanded-for-materials');
            
            const gridColumns = isExpanded 
                ? 'repeat(auto-fill, minmax(280px, 1fr))' // Wider container
                : 'repeat(auto-fill, minmax(220px, 1fr))'; // Narrow container
            
            // FORCE the grid layout with responsive sizing
            materialsList.style.cssText = `
                display: grid !important;
                grid-template-columns: ${gridColumns} !important;
                gap: 1rem !important;
                padding: 1.25rem !important;
                max-height: 500px !important;
                overflow-y: auto !important;
                border: 2px solid var(--gray-200) !important;
                border-radius: var(--radius-lg) !important;
                background: var(--white) !important;
                width: 100% !important;
                box-sizing: border-box !important;
            `;

            // Generate cards with adaptive sizing
            const cardMinWidth = isExpanded ? '260px' : '200px';
            const cardMinHeight = isExpanded ? '160px' : '140px';
            
            const cardsHTML = displayMaterials.map(material => {
                const isSelected = this.selectedMaterials.some(m => m.id === material.id);
                return `
                    <div class="material-card ${isSelected ? 'selected' : ''}" 
                         data-material-id="${material.id}"
                         style="
                             background: ${isSelected ? 'var(--accent-blue)' : 'var(--white)'} !important;
                             border: 2px solid ${isSelected ? 'var(--primary-blue)' : 'var(--gray-200)'} !important;
                             border-radius: var(--radius-lg) !important;
                             padding: 1rem !important;
                             min-width: ${cardMinWidth} !important;
                             min-height: ${cardMinHeight} !important;
                             width: 100% !important;
                             display: flex !important;
                             flex-direction: column !important;
                             justify-content: space-between !important;
                             cursor: pointer !important;
                             transition: var(--transition) !important;
                             box-shadow: var(--shadow-sm) !important;
                             box-sizing: border-box !important;
                         ">
                        <div class="material-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                            <div class="material-checkbox-section">
                                <input type="checkbox" 
                                       class="material-checkbox" 
                                       data-material-id="${material.id}"
                                       style="display: none;"
                                       ${isSelected ? 'checked' : ''}>
                                <span class="checkbox-custom" style="
                                    width: 18px; 
                                    height: 18px; 
                                    border: 2px solid ${isSelected ? 'var(--primary-blue)' : 'var(--gray-300)'}; 
                                    border-radius: var(--radius-sm); 
                                    background: ${isSelected ? 'var(--primary-blue)' : 'var(--white)'};
                                    display: block;
                                    position: relative;
                                    cursor: pointer;
                                ">${isSelected ? '<span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--white); font-weight: bold; font-size: 10px;">✓</span>' : ''}</span>
                            </div>
                            <div class="material-status">
                                ${isSelected ? 
                                    '<span class="selected-badge" style="background: var(--success-green); color: var(--white); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500;">✓ Selected</span>' : 
                                    '<span class="select-badge" style="background: var(--gray-100); color: var(--gray-600); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500; border: 1px solid var(--gray-200);">Select</span>'
                                }
                            </div>
                        </div>
                        <div class="material-card-body" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                            <div class="material-name" style="font-weight: 600; color: var(--gray-800); margin-bottom: 0.5rem; font-size: 0.95rem; line-height: 1.3; min-height: 2rem; word-break: break-word; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${material.name}</div>
                            <div class="material-meta" style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: auto;">
                                ${material.code ? `<span class="material-code" style="background: var(--gray-100); color: var(--gray-700); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500; border: 1px solid var(--gray-200); display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis;">Code: ${material.code}</span>` : ''}
                                <span class="material-unit" style="background: var(--accent-blue); color: var(--primary-blue); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500; border: 1px solid var(--primary-blue); display: inline-block;">Unit: ${material.unit}</span>
                                <span class="material-category" style="background: var(--gray-50); color: var(--gray-600); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500; border: 1px solid var(--gray-300); display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis;">${material.subcategory}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            materialsList.innerHTML = cardsHTML;
            
            console.log(`✅ Rendered ${displayMaterials.length} material cards in ${isExpanded ? 'expanded' : 'normal'} container`);

            // Add click event listeners
            this.addMaterialCardListeners(materialsList);

            // Show result count
            const resultInfo = document.getElementById('materialsResultInfo');
            if (resultInfo) {
                resultInfo.textContent = `Showing ${displayMaterials.length}${materialsToShow.length > maxResults ? ` of ${materialsToShow.length}` : ''} materials`;
            }

        } catch (error) {
            console.error('❌ Error rendering materials list:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    // NEW: Separate function for adding event listeners
    addMaterialCardListeners(materialsList) {
        try {
            materialsList.querySelectorAll('.material-card').forEach(card => {
                const materialId = card.dataset.materialId;
                const checkbox = card.querySelector('.material-checkbox');
                
                console.log('🔗 Adding listeners to card:', materialId);
                
                // Make entire card clickable
                card.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return;
                    
                    checkbox.checked = !checkbox.checked;
                    this.handleMaterialCardToggle(card, materialId, checkbox.checked);
                });

                // Handle direct checkbox clicks
                checkbox.addEventListener('change', (e) => {
                    this.handleMaterialCardToggle(card, materialId, e.target.checked);
                });
            });
        } catch (error) {
            console.error('❌ Error adding material card listeners:', error);
        }
    }

    // NEW: Handle material card toggle with visual updates
    handleMaterialCardToggle(card, materialId, isChecked) {
        try {
            const checkboxCustom = card.querySelector('.checkbox-custom');
            const statusBadge = card.querySelector('.material-status');
            
            if (isChecked) {
                this.addMaterialById(materialId, 1);
                card.classList.add('selected');
                card.style.background = 'var(--accent-blue)';
                card.style.borderColor = 'var(--primary-blue)';
                
                // Update checkbox visual
                checkboxCustom.style.background = 'var(--primary-blue)';
                checkboxCustom.style.borderColor = 'var(--primary-blue)';
                checkboxCustom.innerHTML = '<span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--white); font-weight: bold; font-size: 10px;">✓</span>';
                
                // Update badge
                statusBadge.innerHTML = '<span class="selected-badge" style="background: var(--success-green); color: var(--white); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500;">✓ Selected</span>';
            } else {
                this.removeMaterialById(materialId);
                card.classList.remove('selected');
                card.style.background = 'var(--white)';
                card.style.borderColor = 'var(--gray-200)';
                
                // Update checkbox visual
                checkboxCustom.style.background = 'var(--white)';
                checkboxCustom.style.borderColor = 'var(--gray-300)';
                checkboxCustom.innerHTML = '';
                
                // Update badge
                statusBadge.innerHTML = '<span class="select-badge" style="background: var(--gray-100); color: var(--gray-600); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500; border: 1px solid var(--gray-200);">Select</span>';
            }
        } catch (error) {
            console.error('❌ Error handling material card toggle:', error);
        }
    }

    handleMaterialSearch() {
        try {
            const materialSearch = document.getElementById('materialSearch');
            if (!materialSearch) return;
            
            const searchTerm = materialSearch.value.toLowerCase().trim();
            console.log('🔍 Material search:', searchTerm);
            
            this.renderMaterialsList(searchTerm);
        } catch (error) {
            console.error('❌ Error handling material search:', error);
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
                            <button type="button" class="qty-btn minus" data-index="${index}" data-change="-1" ${material.quantity <= 1 ? 'disabled' : ''}>−</button>
                            <span class="quantity-display">${material.quantity} ${material.unit}</span>
                            <button type="button" class="qty-btn plus" data-index="${index}" data-change="1">+</button>
                        </div>
                        <button type="button" class="remove-material" data-index="${index}">
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
                        card.style.background = 'var(--white)';
                        card.style.borderColor = 'var(--gray-200)';
                        
                        // Update checkbox visual
                        const checkboxCustom = card.querySelector('.checkbox-custom');
                        if (checkboxCustom) {
                            checkboxCustom.style.background = 'var(--white)';
                            checkboxCustom.style.borderColor = 'var(--gray-300)';
                            checkboxCustom.innerHTML = '';
                        }
                        
                        // Update badge
                        const statusBadge = card.querySelector('.material-status');
                        if (statusBadge) {
                            statusBadge.innerHTML = '<span class="select-badge" style="background: var(--gray-100); color: var(--gray-600); padding: 0.2rem 0.4rem; border-radius: var(--radius-sm); font-size: 0.7rem; font-weight: 500; border: 1px solid var(--gray-200);">Select</span>';
                        }
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
            
            // Contract container back to normal
            this.expandContainerForMaterials();
            
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

    // Utility Functions for reduced file size...
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

            // Contract container
            this.expandContainerForMaterials();

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
       console.log('🌐 DOM Content Loaded - Starting Enhanced App (PDF + History + Tabs + Container Expansion)');
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
