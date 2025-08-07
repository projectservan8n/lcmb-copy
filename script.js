// Enhanced script.js with Method Selection and PDF Upload Support
class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        this.filteredMaterials = [];
        this.selectedSubcategory = '';
        this.pendingSubmissionData = null;
        this.uploadedFile = null;
        this.currentMethod = null;
    }

    init() {
        console.log('🚀 Initializing Enhanced LCMB Material Management App');
        
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
        this.showMethodSelection();
    }

    setupEventListeners() {
        try {
            console.log('⚙️ Setting up enhanced event listeners...');
            
            // Method selection listeners
            this.setupMethodSelectionListeners();
            
            // PDF upload listeners
            this.setupPdfUploadListeners();
            
            // Form listeners
            this.setupFormListeners();
            
            // Navigation listeners
            this.setupNavigationListeners();
            
            console.log('✅ Enhanced event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    setupMethodSelectionListeners() {
        // Method selection cards
        const systemCard = document.getElementById('systemMethodCard');
        const pdfCard = document.getElementById('pdfMethodCard');
        const bothCard = document.getElementById('bothMethodCard');

        if (systemCard) {
            systemCard.addEventListener('click', () => this.selectMethod('system'));
        }
        if (pdfCard) {
            pdfCard.addEventListener('click', () => this.selectMethod('pdf'));
        }
        if (bothCard) {
            bothCard.addEventListener('click', () => this.selectMethod('both'));
        }
    }

    setupPdfUploadListeners() {
        // PDF file upload for PDF method
        const pdfFile = document.getElementById('pdfFile');
        const pdfUploadArea = document.getElementById('pdfUploadArea');
        const removePdfBtn = document.getElementById('removePdfBtn');

        if (pdfFile) {
            pdfFile.addEventListener('change', (e) => this.handlePdfFileUpload(e));
        }

        if (pdfUploadArea) {
            pdfUploadArea.addEventListener('click', () => pdfFile?.click());
            pdfUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            pdfUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
        }

        if (removePdfBtn) {
            removePdfBtn.addEventListener('click', () => this.removePdfFile());
        }

        // Additional PDF file upload for Both method
        const additionalPdfFile = document.getElementById('additionalPdfFile');
        const additionalPdfUploadArea = document.getElementById('additionalPdfUploadArea');
        const removeAdditionalPdfBtn = document.getElementById('removeAdditionalPdfBtn');

        if (additionalPdfFile) {
            additionalPdfFile.addEventListener('change', (e) => this.handleAdditionalPdfFileUpload(e));
        }

        if (additionalPdfUploadArea) {
            additionalPdfUploadArea.addEventListener('click', () => additionalPdfFile?.click());
            additionalPdfUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            additionalPdfUploadArea.addEventListener('drop', (e) => this.handleAdditionalFileDrop(e));
        }

        if (removeAdditionalPdfBtn) {
            removeAdditionalPdfBtn.addEventListener('click', () => this.removeAdditionalPdfFile());
        }
    }

    setupFormListeners() {
        // Request type changes
        const requestTypeInputs = document.querySelectorAll('input[name="requestType"], input[name="pdfRequestType"]');
        requestTypeInputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => this.handleRequestTypeChange());
            }
        });

        // Form field changes
        const categorySelect = document.getElementById('category');
        const supplierSelect = document.getElementById('supplier');
        const subcategorySelect = document.getElementById('subcategory');
        const materialSearch = document.getElementById('materialSearch');

        if (categorySelect) {
            categorySelect.addEventListener('change', () => this.handleCategoryChange());
        }
        if (supplierSelect) {
            supplierSelect.addEventListener('change', () => this.handleSupplierChange());
        }
        if (subcategorySelect) {
            subcategorySelect.addEventListener('change', () => this.handleSubcategoryChange());
        }
        if (materialSearch) {
            materialSearch.addEventListener('input', () => this.handleMaterialSearch());
        }

        // Form submissions
        const pdfForm = document.getElementById('pdfMaterialForm');
        const mainForm = document.getElementById('materialForm');

        if (pdfForm) {
            pdfForm.addEventListener('submit', (e) => this.handlePdfFormSubmit(e));
        }
        if (mainForm) {
            mainForm.addEventListener('submit', (e) => this.handleMainFormSubmit(e));
        }

        // Form validation on input changes
        const allInputs = document.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => this.validateCurrentForm());
                input.addEventListener('input', () => this.validateCurrentForm());
            }
        });
    }

    setupNavigationListeners() {
        // Back to methods buttons
        const backToMethodsBtn = document.getElementById('backToMethodsBtn');
        const backToMethodsFromMain = document.getElementById('backToMethodsFromMain');

        if (backToMethodsBtn) {
            backToMethodsBtn.addEventListener('click', () => this.showMethodSelection());
        }
        if (backToMethodsFromMain) {
            backToMethodsFromMain.addEventListener('click', () => this.showMethodSelection());
        }

        // Confirmation page listeners
        const backToEditBtn = document.getElementById('backToEditBtn');
        const confirmSubmitBtn = document.getElementById('confirmSubmitBtn');
        const addMoreMaterialsBtn = document.getElementById('addMoreMaterialsBtn');

        if (backToEditBtn) {
            backToEditBtn.addEventListener('click', () => this.goBackToEdit());
        }
        if (confirmSubmitBtn) {
            confirmSubmitBtn.addEventListener('click', () => this.handleConfirmedSubmission());
        }
        if (addMoreMaterialsBtn) {
            addMoreMaterialsBtn.addEventListener('click', () => this.goBackToEdit());
        }
    }

    selectMethod(method) {
        try {
            console.log('📋 Method selected:', method);
            this.currentMethod = method;
            
            // Reset form state
            this.resetFormState();
            
            // Hide method selection
            const methodSelection = document.getElementById('methodSelection');
            if (methodSelection) methodSelection.style.display = 'none';
            
            // Show appropriate form
            switch (method) {
                case 'system':
                    this.showSystemForm();
                    break;
                case 'pdf':
                    this.showPdfForm();
                    break;
                case 'both':
                    this.showBothForm();
                    break;
                default:
                    console.error('❌ Unknown method:', method);
            }
            
        } catch (error) {
            console.error('❌ Error selecting method:', error);
        }
    }

    showMethodSelection() {
        try {
            console.log('🔄 Showing method selection');
            
            // Hide all forms
            const methodSelection = document.getElementById('methodSelection');
            const pdfForm = document.getElementById('pdfForm');
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            
            if (methodSelection) methodSelection.style.display = 'block';
            if (pdfForm) pdfForm.style.display = 'none';
            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'none';
            
            // Reset current method
            this.currentMethod = null;
            this.resetFormState();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing method selection:', error);
        }
    }

    showSystemForm() {
        try {
            console.log('📋 Showing system form');
            
            const mainForm = document.getElementById('mainForm');
            const mainFormTitle = document.getElementById('mainFormTitle');
            const mainFormSubtitle = document.getElementById('mainFormSubtitle');
            const additionalPdfSection = document.getElementById('additionalPdfSection');
            
            if (mainForm) mainForm.style.display = 'block';
            if (mainFormTitle) mainFormTitle.textContent = '🖥️ System Material Order';
            if (mainFormSubtitle) mainFormSubtitle.textContent = 'Select materials from our system catalog';
            if (additionalPdfSection) additionalPdfSection.style.display = 'none';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing system form:', error);
        }
    }

    showPdfForm() {
        try {
            console.log('📄 Showing PDF form');
            
            const pdfForm = document.getElementById('pdfForm');
            if (pdfForm) pdfForm.style.display = 'block';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing PDF form:', error);
        }
    }

    showBothForm() {
        try {
            console.log('🔄 Showing both methods form');
            
            const mainForm = document.getElementById('mainForm');
            const mainFormTitle = document.getElementById('mainFormTitle');
            const mainFormSubtitle = document.getElementById('mainFormSubtitle');
            const additionalPdfSection = document.getElementById('additionalPdfSection');
            
            if (mainForm) mainForm.style.display = 'block';
            if (mainFormTitle) mainFormTitle.textContent = '🔄 Combined Material Request';
            if (mainFormSubtitle) mainFormSubtitle.textContent = 'Select system materials and attach PDF specifications';
            if (additionalPdfSection) additionalPdfSection.style.display = 'block';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing both form:', error);
        }
    }

    handlePdfFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processPdfFile(file, 'main');
        }
    }

    handleAdditionalPdfFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processPdfFile(file, 'additional');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const area = e.currentTarget;
        area.classList.add('drag-over');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const area = e.currentTarget;
        area.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processPdfFile(files[0], 'main');
        }
    }

    handleAdditionalFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const area = e.currentTarget;
        area.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processPdfFile(files[0], 'additional');
        }
    }

    processPdfFile(file, type = 'main') {
        try {
            console.log(`📄 Processing ${type} PDF file:`, file.name);
            
            // Validate file type
            if (file.type !== 'application/pdf') {
                this.showError('Please upload a PDF file only.');
                return;
            }
            
            // Validate file size (10MB max)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                this.showError('File size must be less than 10MB.');
                return;
            }
            
            // Store the file
            if (type === 'main') {
                this.uploadedFile = file;
                this.showPdfPreview(file);
            } else {
                this.additionalFile = file;
                this.showAdditionalPdfPreview(file);
            }
            
            // Validate current form
            this.validateCurrentForm();
            
            console.log(`✅ ${type} PDF file processed successfully:`, {
                name: file.name,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                type: file.type
            });
            
        } catch (error) {
            console.error('❌ Error processing PDF file:', error);
            this.showError('Error processing PDF file: ' + error.message);
        }
    }

    showPdfPreview(file) {
        try {
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            const pdfFileInfo = document.getElementById('pdfFileInfo');
            const pdfFileName = document.getElementById('pdfFileName');
            const pdfFileSize = document.getElementById('pdfFileSize');
            
            if (pdfUploadArea) pdfUploadArea.style.display = 'none';
            if (pdfFileInfo) pdfFileInfo.style.display = 'flex';
            if (pdfFileName) pdfFileName.textContent = file.name;
            if (pdfFileSize) pdfFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
            
        } catch (error) {
            console.error('❌ Error showing PDF preview:', error);
        }
    }

    showAdditionalPdfPreview(file) {
        try {
            const additionalPdfUploadArea = document.getElementById('additionalPdfUploadArea');
            const additionalPdfFileInfo = document.getElementById('additionalPdfFileInfo');
            const additionalPdfFileName = document.getElementById('additionalPdfFileName');
            const additionalPdfFileSize = document.getElementById('additionalPdfFileSize');
            
            if (additionalPdfUploadArea) additionalPdfUploadArea.style.display = 'none';
            if (additionalPdfFileInfo) additionalPdfFileInfo.style.display = 'flex';
            if (additionalPdfFileName) additionalPdfFileName.textContent = file.name;
            if (additionalPdfFileSize) additionalPdfFileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
            
        } catch (error) {
            console.error('❌ Error showing additional PDF preview:', error);
        }
    }

    removePdfFile() {
        try {
            console.log('🗑️ Removing PDF file');
            
            this.uploadedFile = null;
            
            const pdfFile = document.getElementById('pdfFile');
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            const pdfFileInfo = document.getElementById('pdfFileInfo');
            
            if (pdfFile) pdfFile.value = '';
            if (pdfUploadArea) pdfUploadArea.style.display = 'block';
            if (pdfFileInfo) pdfFileInfo.style.display = 'none';
            
            this.validateCurrentForm();
            
        } catch (error) {
            console.error('❌ Error removing PDF file:', error);
        }
    }

    removeAdditionalPdfFile() {
        try {
            console.log('🗑️ Removing additional PDF file');
            
            this.additionalFile = null;
            
            const additionalPdfFile = document.getElementById('additionalPdfFile');
            const additionalPdfUploadArea = document.getElementById('additionalPdfUploadArea');
            const additionalPdfFileInfo = document.getElementById('additionalPdfFileInfo');
            
            if (additionalPdfFile) additionalPdfFile.value = '';
            if (additionalPdfUploadArea) additionalPdfUploadArea.style.display = 'block';
            if (additionalPdfFileInfo) additionalPdfFileInfo.style.display = 'none';
            
            this.validateCurrentForm();
            
        } catch (error) {
            console.error('❌ Error removing additional PDF file:', error);
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
            }

            this.showLoading(false);
        } catch (error) {
            console.error('❌ Error populating form:', error);
            this.showError('Error setting up form: ' + error.message);
        }
    }

    handleRequestTypeChange() {
        try {
            const requestType = this.getSelectedRequestType();
            const submitBtn = this.getCurrentSubmitButton();
            const btnText = submitBtn?.querySelector('.btn-text');
            
            if (!requestType || !submitBtn || !btnText) return;
            
            if (requestType === 'order') {
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

    getSelectedRequestType() {
        const mainRequestType = document.querySelector('input[name="requestType"]:checked')?.value;
        const pdfRequestType = document.querySelector('input[name="pdfRequestType"]:checked')?.value;
        return mainRequestType || pdfRequestType;
    }

    getCurrentSubmitButton() {
        if (this.currentMethod === 'pdf') {
            return document.getElementById('pdfSubmitBtn');
        }
        return document.getElementById('submitBtn');
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
                this.validateCurrentForm();
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

            this.validateCurrentForm();
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
                this.validateCurrentForm();
                return;
            }

            // Show supplier info
            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                this.showSupplierInfo(selectedOption);
            }

            // Populate subcategories and materials for selected category and supplier
            if (selectedCategory) {
                this.populateSubcategories(selectedCategory);
                this.populateMaterials(selectedCategory, '');
            }

            this.validateCurrentForm();
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
            
            if (!category || !supplierSelect?.value) {
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
            this.validateCurrentForm();
            
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
                this.validateCurrentForm();
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
                container.innerHTML = '<div class="no-selection">No materials added to your order yet...</div>';
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
                    this.validateCurrentForm();
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
                this.validateCurrentForm();
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

    validateCurrentForm() {
        try {
            const method = this.currentMethod;
            let isValid = true;
            let submitBtn = null;

            if (method === 'pdf') {
                isValid = this.validatePdfForm();
                submitBtn = document.getElementById('pdfSubmitBtn');
            } else if (method === 'system' || method === 'both') {
                isValid = this.validateMainForm();
                submitBtn = document.getElementById('submitBtn');
            }

            if (submitBtn) {
                submitBtn.disabled = !isValid;
            }

            return isValid;
            
        } catch (error) {
            console.error('❌ Error validating current form:', error);
            return false;
        }
    }

    validatePdfForm() {
        try {
            const form = document.getElementById('pdfMaterialForm');
            if (!form) return false;

            const requiredFields = ['pdfRequestorName', 'pdfRequestorEmail', 'pdfSupplierName', 'pdfSupplierEmail'];
            
            // Check required fields
            for (const fieldName of requiredFields) {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    return false;
                }
            }

            // Check email format
            const emailField = form.querySelector('[name="pdfRequestorEmail"]');
            const supplierEmailField = form.querySelector('[name="pdfSupplierEmail"]');
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailField && emailField.value && !emailRegex.test(emailField.value)) {
                return false;
            }
            if (supplierEmailField && supplierEmailField.value && !emailRegex.test(supplierEmailField.value)) {
                return false;
            }

            // Check PDF file
            if (!this.uploadedFile) {
                return false;
            }

            return true;
            
        } catch (error) {
            console.error('❌ Error validating PDF form:', error);
            return false;
        }
    }

    validateMainForm() {
        try {
            const form = document.getElementById('materialForm');
            if (!form) return false;

            const requiredFields = ['requestorName', 'requestorEmail'];
            
            // Check basic required fields
            for (const fieldName of requiredFields) {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    return false;
                }
            }

            // Check email format
            const emailField = form.querySelector('[name="requestorEmail"]');
            if (emailField && emailField.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailField.value)) {
                    return false;
                }
            }

            // For system method, require category, supplier, and materials
            if (this.currentMethod === 'system') {
                const categoryField = form.querySelector('[name="category"]');
                const supplierField = form.querySelector('[name="supplier"]');
                
                if (!categoryField || !categoryField.value.trim()) {
                    return false;
                }
                if (!supplierField || !supplierField.value.trim()) {
                    return false;
                }
                if (this.selectedMaterials.length === 0) {
                    return false;
                }
            }

            // For both method, require category, supplier, materials, AND check for PDF
            if (this.currentMethod === 'both') {
                const categoryField = form.querySelector('[name="category"]');
                const supplierField = form.querySelector('[name="supplier"]');
                
                if (!categoryField || !categoryField.value.trim()) {
                    return false;
                }
                if (!supplierField || !supplierField.value.trim()) {
                    return false;
                }
                if (this.selectedMaterials.length === 0) {
                    return false;
                }
                // Additional PDF is optional for both method
            }

            return true;
            
        } catch (error) {
            console.error('❌ Error validating main form:', error);
            return false;
        }
    }

    handlePdfFormSubmit(e) {
        e.preventDefault();
        
        try {
            console.log('📄 Handling PDF form submission');
            
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add PDF file
            if (this.uploadedFile) {
                data.uploadedFile = {
                    name: this.uploadedFile.name,
                    size: this.uploadedFile.size,
                    type: this.uploadedFile.type
                };
            }
            
            data.requestMethod = 'pdf';
            
            console.log('📋 PDF form data prepared:', data);
            
            // Store data for submission
            this.pendingSubmissionData = data;
            
            // Show confirmation page
            this.showConfirmationPage(data);
            
        } catch (error) {
            console.error('❌ PDF form submission error:', error);
            this.showError(`Error preparing PDF form: ${error.message}`);
        }
    }

    handleMainFormSubmit(e) {
        e.preventDefault();
        
        try {
            console.log('📋 Handling main form submission');
            
            const form = e.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add selected materials
            data.materials = this.selectedMaterials;
            
            // Add request method
            data.requestMethod = this.currentMethod;
            
            // Add additional PDF file if present (for both method)
            if (this.additionalFile) {
                data.additionalFile = {
                    name: this.additionalFile.name,
                    size: this.additionalFile.size,
                    type: this.additionalFile.type
                };
            }
            
            // Get supplier details
            const supplierSelect = document.getElementById('supplier');
            const selectedOption = supplierSelect?.selectedOptions[0];
            if (selectedOption) {
                data.supplierEmail = selectedOption.dataset.email || '';
                data.supplierPhone = selectedOption.dataset.phone || '';
                data.supplierId = selectedOption.dataset.id || '';
            }
            
            console.log('📋 Main form data prepared:', data);
            
            // Store data for submission
            this.pendingSubmissionData = data;
            
            // Show confirmation page
            this.showConfirmationPage(data);
            
        } catch (error) {
            console.error('❌ Main form submission error:', error);
            this.showError(`Error preparing main form: ${error.message}`);
        }
    }

    showConfirmationPage(data) {
        try {
            console.log('📋 Displaying confirmation page');
            
            // Hide current form and show confirmation page
            const pdfForm = document.getElementById('pdfForm');
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            
            if (pdfForm) pdfForm.style.display = 'none';
            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'block';
            
            // Update titles based on request type and method
            const requestType = data.requestType || data.pdfRequestType;
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
            
            // Populate confirmation details
            this.populateConfirmationDetails(data);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing confirmation page:', error);
            this.showError('Error displaying confirmation page: ' + error.message);
        }
    }

    populateConfirmationDetails(data) {
        try {
            const requestType = data.requestType || data.pdfRequestType;
            
            // Basic details
            this.populateElement('confirmRequestType', requestType === 'order' ? 'Material Order' : 'Quote Request');
            this.populateElement('confirmCategory', data.category || 'PDF Upload');
            this.populateElement('confirmUrgency', data.urgency || data.pdfUrgency || 'Normal');
            this.populateElement('confirmProjectRef', data.projectRef || data.pdfProjectRef || 'Not specified');
            
            // Supplier information
            const supplierName = data.supplier || data.pdfSupplierName;
            const supplierEmail = data.supplierEmail || data.pdfSupplierEmail;
            this.populateElement('confirmSupplierName', supplierName);
            this.populateElement('confirmSupplierEmail', supplierEmail);
            this.populateElement('confirmSupplierPhone', data.supplierPhone || 'Not available');
            
            // Requestor information
            const requestorName = data.requestorName || data.pdfRequestorName;
            const requestorEmail = data.requestorEmail || data.pdfRequestorEmail;
            this.populateElement('confirmRequestorName', requestorName);
            this.populateElement('confirmRequestorEmail', requestorEmail);
            
            // Materials section
            const materialsSection = document.getElementById('materialsSection');
            if (data.requestMethod === 'pdf') {
                if (materialsSection) materialsSection.style.display = 'none';
            } else {
                if (materialsSection) materialsSection.style.display = 'block';
                this.populateConfirmationMaterials(data.materials);
            }
            
            // PDF section
            const confirmPdfSection = document.getElementById('confirmPdfSection');
            if (data.requestMethod === 'pdf' || (data.requestMethod === 'both' && data.additionalFile)) {
                if (confirmPdfSection) {
                    confirmPdfSection.style.display = 'block';
                    const file = data.uploadedFile || data.additionalFile;
                    if (file) {
                        this.populateElement('confirmPdfFileName', file.name);
                        this.populateElement('confirmPdfFileSize', `${(file.size / 1024 / 1024).toFixed(2)} MB`);
                    }
                }
            } else {
                if (confirmPdfSection) confirmPdfSection.style.display = 'none';
            }
            
            // Special instructions
            const notes = data.notes || data.pdfNotes;
            const notesSection = document.getElementById('notesSection');
            if (notes && notes.trim()) {
                if (notesSection) notesSection.style.display = 'block';
                this.populateElement('confirmNotes', notes);
            } else {
                if (notesSection) notesSection.style.display = 'none';
            }
            
        } catch (error) {
            console.error('❌ Error populating confirmation details:', error);
        }
    }

    populateConfirmationMaterials(materials) {
        try {
            const materialsSummary = document.getElementById('confirmMaterialsSummary');
            const materialsList = document.getElementById('confirmMaterialsList');
            
            if (!materials || materials.length === 0) return;
            
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
                materialsList.innerHTML = materials.map(material => `
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
            
            const confirmationPage = document.getElementById('confirmationPage');
            if (confirmationPage) confirmationPage.style.display = 'none';
            
            // Show appropriate form based on current method
            if (this.currentMethod === 'pdf') {
                const pdfForm = document.getElementById('pdfForm');
                if (pdfForm) pdfForm.style.display = 'block';
            } else {
                const mainForm = document.getElementById('mainForm');
                if (mainForm) mainForm.style.display = 'block';
            }
            
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
            console.log('📤 Submitting confirmed request:', {
                requestMethod: data.requestMethod,
                hasUploadedFile: !!(data.uploadedFile || data.additionalFile),
                requestType: data.requestType || data.pdfRequestType,
                materials: data.materials?.length || 0
            });
            
            // Determine endpoint based on request type
            const requestType = data.requestType || data.pdfRequestType;
            let endpoint;
            
            if (data.requestMethod === 'pdf') {
                // PDF upload method - needs special handling
                endpoint = requestType === 'order' ? '/api/order/submit' : '/api/quote/submit';
            } else {
                // System or both methods
                endpoint = requestType === 'order' ? '/api/order/submit' : '/api/quote/submit';
            }
            
            // Prepare FormData for submission
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(data).forEach(key => {
                if (key === 'materials' || key === 'uploadedFile' || key === 'additionalFile') {
                    if (data[key] && typeof data[key] === 'object') {
                        formData.append(key, JSON.stringify(data[key]));
                    }
                } else if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            
            // Add PDF file if present
            if (this.uploadedFile) {
                console.log('📄 Adding main PDF file to submission');
                formData.append('pdfFile', this.uploadedFile, this.uploadedFile.name);
            } else if (this.additionalFile) {
                console.log('📄 Adding additional PDF file to submission');
                formData.append('pdfFile', this.additionalFile, this.additionalFile.name);
            }
            
            console.log(`🚀 Submitting to endpoint: ${endpoint}`);
            
            // Submit form
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorResult = await response.json();
                    errorMessage = errorResult.error || errorResult.message || errorMessage;
                } catch (e) {
                    console.warn('Could not parse error response as JSON');
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('✅ Submission result:', result);

            if (result.success !== false) {
                const type = requestType === 'order' ? 'order' : 'quote';
                const id = result.orderId || result.quoteId || result.id || `${type.toUpperCase()}-${Date.now()}`;
                this.showSuccess(type, id, data.supplier || data.pdfSupplierName, result);
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

    showSuccess(type, id, supplier, result) {
        try {
            // Hide all forms, show success
            const pdfForm = document.getElementById('pdfForm');
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            const successAlert = document.getElementById('successAlert');
            const successMessage = document.getElementById('successMessage');
            const referenceId = document.getElementById('referenceId');
            const successSupplier = document.getElementById('successSupplier');
            const pdfSuccessInfo = document.getElementById('pdfSuccessInfo');
            const successPdfFile = document.getElementById('successPdfFile');
            const successDriveLink = document.getElementById('successDriveLink');

            if (pdfForm) pdfForm.style.display = 'none';
            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'none';
            if (successAlert) successAlert.style.display = 'block';
            if (successMessage) successMessage.textContent = `Your ${type} request has been submitted successfully and sent to the supplier!`;
            if (referenceId) referenceId.textContent = id;
            if (successSupplier) successSupplier.textContent = supplier;

            // Show PDF info if available
            if (result.pdfFileName && pdfSuccessInfo) {
                pdfSuccessInfo.style.display = 'block';
                if (successPdfFile) successPdfFile.textContent = result.pdfFileName;
                if (successDriveLink) {
                    successDriveLink.href = result.driveLink || '#';
                    successDriveLink.textContent = 'View PDF Document';
                }
            }

            // Clear pending data and files
            this.pendingSubmissionData = null;
            this.uploadedFile = null;
            this.additionalFile = null;

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('❌ Error showing success:', error);
        }
    }

    resetFormState() {
        try {
            console.log('🔄 Resetting form state');
            
            this.selectedMaterials = [];
            this.filteredMaterials = [];
            this.selectedSubcategory = '';
            this.pendingSubmissionData = null;
            this.uploadedFile = null;
            this.additionalFile = null;
            
            // Reset material displays
            this.renderSelectedMaterials();
            this.resetMaterialSelection();
            
            // Reset file displays
            this.removePdfFile();
            this.removeAdditionalPdfFile();
            
        } catch (error) {
            console.error('❌ Error resetting form state:', error);
        }
    }

    showLoading(show) {
        try {
            const loading = document.getElementById('loading');
            const methodSelection = document.getElementById('methodSelection');
            const pdfForm = document.getElementById('pdfForm');
            const mainForm = document.getElementById('mainForm');
            
            if (loading) {
                loading.style.display = show ? 'block' : 'none';
            }
            
            if (show) {
                if (methodSelection) methodSelection.style.display = 'none';
                if (pdfForm) pdfForm.style.display = 'none';
                if (mainForm) mainForm.style.display = 'none';
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
        const successAlert = document.getElementById('successAlert');
        const errorAlert = document.getElementById('errorAlert');
        
        if (successAlert) successAlert.style.display = 'none';
        if (errorAlert) errorAlert.style.display = 'none';
        
        // Reset app state and show method selection
        if (window.app) {
            window.app.resetFormState();
            window.app.showMethodSelection();
        }
        
        // Reset all forms
        const pdfForm = document.getElementById('pdfMaterialForm');
        const mainForm = document.getElementById('materialForm');
        
        if (pdfForm) pdfForm.reset();
        if (mainForm) mainForm.reset();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting Enhanced Material Management App');
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
