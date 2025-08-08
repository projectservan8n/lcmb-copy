// Enhanced script.js with Method Selection, PDF Upload, Complete Material Management + ORDER HISTORY
class MaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        this.filteredMaterials = [];
        this.selectedSubcategory = '';
        this.pendingSubmissionData = null;
        this.currentMethod = null; // 'system', 'pdf', 'both'
        this.pdfFile = null;
        this.additionalPdfFile = null;
        
        // ORDER HISTORY PROPERTIES
        this.orderHistory = [];
        this.currentHistoryView = 'recent'; // 'recent', 'all', 'orders', 'quotes'
        this.historyFilters = {
            status: '',
            supplier: '',
            urgency: '',
            search: '',
            dateFrom: '',
            dateTo: ''
        };
    }

    init() {
        console.log('🚀 Initializing Enhanced LCMB Material Management App (Method Selection + PDF Upload + Order History)');
        
        // Check if server already loaded data
        if (window.INITIAL_FORM_DATA) {
            console.log('📊 Using initial form data from server');
            this.formData = window.INITIAL_FORM_DATA;
            // Don't populate form yet - wait for method selection
        } else if (window.INITIAL_LOAD_ERROR) {
            console.error('❌ Initial data load failed:', window.INITIAL_LOAD_ERROR);
            this.showError('Failed to load initial data: ' + window.INITIAL_LOAD_ERROR);
        } else {
            console.log('🔄 No initial data found, will load from API when needed...');
        }
        
        this.setupEventListeners();
        this.showMethodSelection();
    }

    setupEventListeners() {
        try {
            console.log('⚙️ Setting up enhanced event listeners...');
            
            // Method selection event listeners
            this.setupMethodSelectionListeners();
            
            // PDF form event listeners
            this.setupPdfFormListeners();
            
            // Main form event listeners
            this.setupMainFormListeners();
            
            // Confirmation page event listeners
            this.setupConfirmationListeners();
            
            // ORDER HISTORY event listeners
            this.setupHistoryListeners();
            
            console.log('✅ Enhanced event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    setupMethodSelectionListeners() {
        // Back buttons to method selection
        const backToMethodsBtn = document.getElementById('backToMethodsBtn');
        const backToMethodsFromMain = document.getElementById('backToMethodsFromMain');
        
        if (backToMethodsBtn) {
            backToMethodsBtn.addEventListener('click', () => this.showMethodSelection());
        }
        
        if (backToMethodsFromMain) {
            backToMethodsFromMain.addEventListener('click', () => this.showMethodSelection());
        }
    }

    // ORDER HISTORY LISTENERS
    setupHistoryListeners() {
        // Navigation to order history
        const showHistoryBtn = document.getElementById('showHistoryBtn');
        const historyNavBtn = document.getElementById('historyNavBtn');
        
        if (showHistoryBtn) {
            showHistoryBtn.addEventListener('click', () => this.showOrderHistory());
        }
        
        if (historyNavBtn) {
            historyNavBtn.addEventListener('click', () => this.showOrderHistory());
        }
    }

   setupPdfFormListeners() {
    // PDF supplier dropdown change
    const pdfSupplier = document.getElementById('pdfSupplier');
    if (pdfSupplier) {
        pdfSupplier.addEventListener('change', () => this.handlePdfSupplierChange());
    }

    // MAIN PDF file upload (for PDF-only method)
    const pdfFile = document.getElementById('pdfFile');
    const pdfUploadArea = document.getElementById('pdfUploadArea');
    const removePdfBtn = document.getElementById('removePdfBtn');
    
    if (pdfFile && pdfUploadArea) {
        // Remove any existing listeners first
        const newPdfFile = pdfFile.cloneNode(true);
        pdfFile.parentNode.replaceChild(newPdfFile, pdfFile);
        
        // File input change - FIXED
        newPdfFile.addEventListener('change', (e) => {
            e.stopPropagation();
            this.handlePdfFileSelect(e);
        });
        
        // Drag and drop
        pdfUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragOver(e);
        });
        
        pdfUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDrop(e, 'main');
        });
        
        // Click handler - FIXED to prevent double triggering
        pdfUploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on the file input itself or remove button
            if (e.target === newPdfFile || e.target === removePdfBtn || e.target.closest('.remove-file-btn')) {
                return;
            }
            // Don't trigger if file info is showing (file already selected)
            const fileInfo = document.getElementById('pdfFileInfo');
            if (fileInfo && fileInfo.style.display !== 'none') {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            newPdfFile.click();
        });
    }
    
    if (removePdfBtn) {
        removePdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removePdfFile('main');
        });
    }

    // ADDITIONAL PDF file upload (for BOTH method)
    const additionalPdfFile = document.getElementById('additionalPdfFile');
    const additionalPdfUploadArea = document.getElementById('additionalPdfUploadArea');
    const removeAdditionalPdfBtn = document.getElementById('removeAdditionalPdfBtn');
    
    if (additionalPdfFile && additionalPdfUploadArea) {
        // Remove any existing listeners first
        const newAdditionalPdfFile = additionalPdfFile.cloneNode(true);
        additionalPdfFile.parentNode.replaceChild(newAdditionalPdfFile, additionalPdfFile);
        
        // File input change - FIXED
        newAdditionalPdfFile.addEventListener('change', (e) => {
            e.stopPropagation();
            this.handleAdditionalPdfFileSelect(e);
        });
        
        // Drag and drop
        additionalPdfUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragOver(e);
        });
        
        additionalPdfUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDrop(e, 'additional');
        });
        
        // Click handler - FIXED
        additionalPdfUploadArea.addEventListener('click', (e) => {
            // Don't trigger if clicking on the file input itself or remove button
            if (e.target === newAdditionalPdfFile || e.target === removeAdditionalPdfBtn || e.target.closest('.remove-file-btn')) {
                return;
            }
            // Don't trigger if file info is showing
            const fileInfo = document.getElementById('additionalPdfFileInfo');
            if (fileInfo && fileInfo.style.display !== 'none') {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            newAdditionalPdfFile.click();
        });
    }
    
    if (removeAdditionalPdfBtn) {
        removeAdditionalPdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.removePdfFile('additional');
        });
    }

    // Rest of the form listeners...
    const pdfForm = document.getElementById('pdfMaterialForm');
    if (pdfForm) {
        pdfForm.addEventListener('submit', (e) => this.handlePdfFormSubmit(e));
        
        // PDF form validation on input changes
        const pdfInputs = pdfForm.querySelectorAll('input, select, textarea');
        pdfInputs.forEach(input => {
            input.addEventListener('change', () => this.validatePdfForm());
            input.addEventListener('input', () => this.validatePdfForm());
        });
    }

    // PDF request type change
    const pdfRequestTypeInputs = document.querySelectorAll('input[name="pdfRequestType"]');
    pdfRequestTypeInputs.forEach(input => {
        input.addEventListener('change', () => this.handlePdfRequestTypeChange());
    });
}

    setupMainFormListeners() {
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

        // Main form submission
        const form = document.getElementById('materialForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
            
            // Form validation on input changes
            const formInputs = form.querySelectorAll('input, select, textarea');
            formInputs.forEach(input => {
                input.addEventListener('change', () => this.validateForm());
                input.addEventListener('input', () => this.validateForm());
            });
        }
    }

    setupConfirmationListeners() {
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

    // ===============================================
    // METHOD SELECTION FUNCTIONALITY
    // ===============================================

    showMethodSelection() {
        console.log('📋 Showing method selection');
        
        // Hide all other sections
        this.hideAllSections();
        
        // Show method selection
        const methodSelection = document.getElementById('methodSelection');
        if (methodSelection) {
            methodSelection.style.display = 'block';
        }
        
        // Reset current method
        this.currentMethod = null;
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    hideAllSections() {
        const sections = [
            'methodSelection',
            'pdfForm', 
            'mainForm',
            'confirmationPage',
            'orderHistorySection',
            'loading',
            'errorAlert',
            'successAlert'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    // Global method selection function (called from HTML onclick)
    selectMethod(method) {
        console.log('🔄 Method selected:', method);
        this.currentMethod = method;
        
        switch (method) {
            case 'system':
                this.showSystemMethod();
                break;
            case 'pdf':
                this.showPdfMethod();
                break;
            case 'both':
                this.showBothMethod();
                break;
            default:
                console.error('❌ Unknown method:', method);
        }
    }

    async showSystemMethod() {
        console.log('🖥️ Showing system method');
        
        // Load form data if not already loaded
        if (!this.formData) {
            await this.loadFormData();
        }
        
        // Hide method selection, show main form
        this.hideAllSections();
        const mainForm = document.getElementById('mainForm');
        if (mainForm) {
            mainForm.style.display = 'block';
        }
        
        // Update form titles
        const mainFormTitle = document.getElementById('mainFormTitle');
        const mainFormSubtitle = document.getElementById('mainFormSubtitle');
        if (mainFormTitle) mainFormTitle.textContent = 'System Material Request';
        if (mainFormSubtitle) mainFormSubtitle.textContent = 'Select materials from our catalog and specify quantities';
        
        // Hide additional PDF section
        const additionalPdfSection = document.getElementById('additionalPdfSection');
        if (additionalPdfSection) {
            additionalPdfSection.style.display = 'none';
        }
        
        // Populate form if data is available
        if (this.formData) {
            this.populateForm(this.formData);
        }
        
        this.validateForm();
    }

    showPdfMethod() {
        console.log('📄 Showing PDF method');
        
        // Load form data if not already loaded (for supplier dropdown and categories)
        if (!this.formData) {
            this.loadFormData().then(() => {
                this.populatePdfSuppliers();
                this.populatePdfCategories();
            });
        } else {
            this.populatePdfSuppliers();
            this.populatePdfCategories();
        }
        
        // Hide method selection, show PDF form
        this.hideAllSections();
        const pdfForm = document.getElementById('pdfForm');
        if (pdfForm) {
            pdfForm.style.display = 'block';
        }
        
        this.validatePdfForm();
    }

    populatePdfSuppliers() {
        try {
            const pdfSupplierSelect = document.getElementById('pdfSupplier');
            
            if (!pdfSupplierSelect || !this.formData?.data?.suppliers) {
                console.warn('⚠️ PDF supplier dropdown not found or no supplier data available');
                return;
            }

            // Clear existing options except the first one
            pdfSupplierSelect.innerHTML = '<option value="">Select a supplier...</option>';
            
            // Add all suppliers to dropdown
            this.formData.data.suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.name;
                option.dataset.email = supplier.email || '';
                option.dataset.phone = supplier.phone || '';
                option.dataset.id = supplier.id || '';
                option.textContent = supplier.name;
                pdfSupplierSelect.appendChild(option);
            });

            console.log(`✅ Populated PDF supplier dropdown with ${this.formData.data.suppliers.length} suppliers`);

        } catch (error) {
            console.error('❌ Error populating PDF suppliers:', error);
        }
    }

    populatePdfCategories() {
        try {
            const pdfCategoriesContainer = document.getElementById('pdfCategoriesContainer');
            
            if (!pdfCategoriesContainer || !this.formData?.data?.categories) {
                console.warn('⚠️ PDF categories container not found or no category data available');
                return;
            }

            // Clear loading message
            pdfCategoriesContainer.innerHTML = '';
            
            // Add category checkboxes
            this.formData.data.categories.forEach(category => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'checkbox-option';
                
                checkboxWrapper.innerHTML = `
                    <input type="checkbox" id="pdfCategory_${category.id}" name="pdfCategories" value="${category.name}" class="checkbox-input">
                    <label for="pdfCategory_${category.id}" class="checkbox-label">
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">${category.name}</span>
                    </label>
                `;
                
                pdfCategoriesContainer.appendChild(checkboxWrapper);
            });

            // Add event listeners for validation
            const categoryCheckboxes = pdfCategoriesContainer.querySelectorAll('input[name="pdfCategories"]');
            categoryCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => this.validatePdfForm());
            });

            console.log(`✅ Populated PDF categories with ${this.formData.data.categories.length} options`);

        } catch (error) {
            console.error('❌ Error populating PDF categories:', error);
        }
    }

    handlePdfSupplierChange() {
        try {
            const pdfSupplierSelect = document.getElementById('pdfSupplier');
            const pdfSupplierInfo = document.getElementById('pdfSupplierInfo');
            const pdfSupplierEmail = document.getElementById('pdfSupplierEmail');
            const pdfSupplierPhone = document.getElementById('pdfSupplierPhone');
            
            if (!pdfSupplierSelect) return;
            
            const selectedSupplier = pdfSupplierSelect.value;
            console.log('🏢 PDF Supplier changed to:', selectedSupplier);
            
            if (!selectedSupplier) {
                if (pdfSupplierInfo) pdfSupplierInfo.style.display = 'none';
                this.validatePdfForm();
                return;
            }

            // Show supplier info
            const selectedOption = pdfSupplierSelect.selectedOptions[0];
            if (selectedOption && pdfSupplierInfo && pdfSupplierEmail && pdfSupplierPhone) {
                pdfSupplierEmail.textContent = `📧 ${selectedOption.dataset.email || 'N/A'}`;
                pdfSupplierPhone.textContent = `📞 ${selectedOption.dataset.phone || 'N/A'}`;
                pdfSupplierInfo.style.display = 'block';
            }

            this.validatePdfForm();
        } catch (error) {
            console.error('❌ Error handling PDF supplier change:', error);
        }
    }

    getSelectedPdfCategories() {
        const categoryCheckboxes = document.querySelectorAll('input[name="pdfCategories"]:checked');
        return Array.from(categoryCheckboxes).map(cb => cb.value);
    }

    async showBothMethod() {
    console.log('🔄 Showing both methods');
    
    // Load form data if not already loaded
    if (!this.formData) {
        await this.loadFormData();
    }
    
    // Hide method selection, show main form
    this.hideAllSections();
    const mainForm = document.getElementById('mainForm');
    if (mainForm) {
        mainForm.style.display = 'block';
    }
    
    // Update form titles
    const mainFormTitle = document.getElementById('mainFormTitle');
    const mainFormSubtitle = document.getElementById('mainFormSubtitle');
    if (mainFormTitle) mainFormTitle.textContent = 'System + PDF Material Request';
    if (mainFormSubtitle) mainFormSubtitle.textContent = 'Select materials from our catalog AND upload additional PDF specifications';
    
    // Show additional PDF section
    const additionalPdfSection = document.getElementById('additionalPdfSection');
    if (additionalPdfSection) {
        additionalPdfSection.style.display = 'block';
        
        // Update the label to show it's required
        const pdfLabel = additionalPdfSection.querySelector('.form-label');
        if (pdfLabel && !pdfLabel.textContent.includes('*')) {
            pdfLabel.innerHTML = 'Additional Specifications PDF <span style="color: red;">*</span>';
        }
        
        // Update help text
        const helpText = additionalPdfSection.querySelector('.form-help-text');
        if (helpText) {
            helpText.textContent = 'Required: Upload a PDF with additional material specifications beyond your system selection';
            helpText.style.color = '#dc2626';
            helpText.style.fontWeight = '500';
        }
    }
    
    // Populate form if data is available
    if (this.formData) {
        this.populateForm(this.formData);
    }
    
    this.validateForm();
}

    // ===============================================
    // ORDER HISTORY FUNCTIONALITY 
    // ===============================================

    async loadOrderHistory() {
        try {
            this.showLoading(true);
            console.log('📋 Loading order history...');
            
            const response = await fetch('/api/history/load');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to load order history');
            }
            
            this.orderHistory = data.orders || [];
            this.renderOrderHistory(data);
            
            console.log(`✅ Loaded ${this.orderHistory.length} order history records`);
            
        } catch (error) {
            console.error('❌ Failed to load order history:', error);
            this.showError(`Failed to load order history: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    showOrderHistory() {
        console.log('📋 Showing order history');
        
        // Hide all other sections
        this.hideAllSections();
        
        // Show order history section
        const historySection = document.getElementById('orderHistorySection');
        if (historySection) {
            historySection.style.display = 'block';
        }
        
        // Load history data if not already loaded
        if (this.orderHistory.length === 0) {
            this.loadOrderHistory();
        } else {
            this.renderOrderHistory({ orders: this.orderHistory, summary: this.generateHistorySummary() });
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderOrderHistory(data) {
        try {
            // Render stats
            this.renderHistoryStats(data.summary);
            
            // Render filters
            this.renderHistoryFilters();
            
            // Render orders
            const historyContainer = document.getElementById('historyContainer');
            if (!historyContainer) {
                console.warn('⚠️ History container not found');
                return;
            }
            
            if (this.orderHistory.length === 0) {
                historyContainer.innerHTML = `
                    <div class="no-history">
                        <div class="no-history-icon">📋</div>
                        <h3>No Order History</h3>
                        <p>No orders or quotes have been submitted yet.</p>
                        <button type="button" class="btn-primary" onclick="window.app.showMethodSelection()">
                            Create Your First Order
                        </button>
                    </div>
                `;
                return;
            }
            
            historyContainer.innerHTML = `
                <div class="history-list">
                    ${this.orderHistory.map(order => this.createOrderHistoryCard(order)).join('')}
                </div>
            `;
            
            // Setup dynamic event listeners for order cards
            this.setupHistoryEventListeners();
            
            // Fix notes display after rendering
            setTimeout(() => {
                if (window.fixNotesDisplay) {
                    window.fixNotesDisplay();
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ Error rendering order history:', error);
        }
    }

    renderHistoryStats(summary) {
        const historyStats = document.getElementById('historyStats');
        if (!historyStats || !summary) return;
        
        historyStats.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${summary.totalOrders || 0}</div>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-card orders">
                    <div class="stat-icon">📦</div>
                    <div class="stat-value">${summary.orderCount || 0}</div>
                    <div class="stat-label">Orders</div>
                </div>
                <div class="stat-card quotes">
                    <div class="stat-icon">💬</div>
                    <div class="stat-value">${summary.quoteCount || 0}</div>
                    <div class="stat-label">Quotes</div>
                </div>
                <div class="stat-card suppliers">
                    <div class="stat-icon">🏢</div>
                    <div class="stat-value">${summary.uniqueSuppliers || 0}</div>
                    <div class="stat-label">Suppliers</div>
                </div>
                <div class="stat-card urgent">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-value">${summary.urgentCount || 0}</div>
                    <div class="stat-label">Urgent</div>
                </div>
                <div class="stat-card pdf">
                    <div class="stat-icon">📄</div>
                    <div class="stat-value">${summary.withPdfCount || 0}</div>
                    <div class="stat-label">With PDF</div>
                </div>
            </div>
        `;
    }

    renderHistoryFilters() {
        const historyFilters = document.getElementById('historyFilters');
        if (!historyFilters) return;
        
        const statuses = [...new Set(this.orderHistory.map(o => o.status))].filter(s => s);
        const suppliers = [...new Set(this.orderHistory.map(o => o.supplierName))].filter(s => s);
        const urgencies = [...new Set(this.orderHistory.map(o => o.urgency))].filter(u => u);
        
        historyFilters.innerHTML = `
            <div class="filters-header">
                <h4>Filter Orders</h4>
                <button type="button" class="btn-link" onclick="window.app.clearHistoryFilters()">Clear All</button>
            </div>
            <div class="filters-grid">
                <div class="filter-group">
                    <label>Status</label>
                    <select id="filter-status" class="filter-select">
                        <option value="">All Statuses</option>
                        ${statuses.map(status => `<option value="${status}">${status}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Supplier</label>
                    <select id="filter-supplier" class="filter-select">
                        <option value="">All Suppliers</option>
                        ${suppliers.map(supplier => `<option value="${supplier}">${supplier}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Priority</label>
                    <select id="filter-urgency" class="filter-select">
                        <option value="">All Priorities</option>
                        ${urgencies.map(urgency => `<option value="${urgency}">${urgency}</option>`).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label>Search</label>
                    <input type="text" id="filter-search" class="filter-input" placeholder="Search orders, materials, notes...">
                </div>
            </div>
            <div class="filters-actions">
                <button type="button" class="btn-secondary" onclick="window.app.refreshOrderHistory()">
                    <span class="btn-icon">🔄</span>
                    Refresh
                </button>
                <button type="button" class="btn-secondary" onclick="window.app.exportOrderHistory()">
                    <span class="btn-icon">📥</span>
                    Export
                </button>
            </div>
        `;
    }

    setupHistoryEventListeners() {
        // Filter change events
        const filterElements = ['filter-status', 'filter-supplier', 'filter-urgency', 'filter-search'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => this.applyHistoryFilters());
                element.addEventListener('input', () => this.applyHistoryFilters());
            }
        });
    }

    applyHistoryFilters() {
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const supplierFilter = document.getElementById('filter-supplier')?.value || '';
        const urgencyFilter = document.getElementById('filter-urgency')?.value || '';
        const searchFilter = document.getElementById('filter-search')?.value.toLowerCase() || '';
        
        const filteredOrders = this.orderHistory.filter(order => {
            const matchesStatus = !statusFilter || order.status === statusFilter;
            const matchesSupplier = !supplierFilter || order.supplierName === supplierFilter;
            const matchesUrgency = !urgencyFilter || order.urgency === urgencyFilter;
            const matchesSearch = !searchFilter || 
                order.orderId.toLowerCase().includes(searchFilter) ||
                order.requestorName.toLowerCase().includes(searchFilter) ||
                order.notes.toLowerCase().includes(searchFilter) ||
                order.category.toLowerCase().includes(searchFilter) ||
                (order.materialsList && order.materialsList.some(m => 
                    m.name.toLowerCase().includes(searchFilter) ||
                    (m.code && m.code.toLowerCase().includes(searchFilter))
                ));
            
            return matchesStatus && matchesSupplier && matchesUrgency && matchesSearch;
        });
        
        this.renderFilteredHistory(filteredOrders);
    }

    renderFilteredHistory(orders) {
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer) return;
        
        if (orders.length === 0) {
            historyContainer.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">🔍</div>
                    <h3>No matching orders found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                    <button type="button" class="btn-secondary" onclick="window.app.clearHistoryFilters()">
                        Clear Filters
                    </button>
                </div>
            `;
            return;
        }
        
        historyContainer.innerHTML = `
            <div class="results-summary">
                <span class="results-count">Showing ${orders.length} of ${this.orderHistory.length} orders</span>
            </div>
            <div class="history-list">
                ${orders.map(order => this.createOrderHistoryCard(order)).join('')}
            </div>
        `;
        
        this.setupHistoryEventListeners();
        
        // Fix notes display after rendering
        setTimeout(() => {
            if (window.fixNotesDisplay) {
                window.fixNotesDisplay();
            }
        }, 100);
    }

    // Helper function to safely escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createOrderHistoryCard(order) {
        const statusClass = order.status === 'ORDER' ? 'status-order' : 'status-quote';
        const urgencyClass = order.urgency === 'Urgent' ? 'urgency-urgent' : 
                            order.urgency === 'High' ? 'urgency-high' : 'urgency-normal';
        
        // Format date nicely
        const orderDate = new Date(order.date + ' ' + order.time);
        const formattedDate = orderDate.toLocaleDateString() + ' at ' + orderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return `
            <div class="order-card" data-order-id="${order.orderId}">
                <div class="order-header">
                    <div class="order-id-section">
                        <span class="order-number">#${order.orderId}</span>
                        <div class="order-badges">
                            <span class="order-status ${statusClass}">${order.status}</span>
                            <span class="order-urgency ${urgencyClass}">${order.urgency}</span>
                            ${order.hasPdf ? '<span class="pdf-badge">📄 PDF</span>' : ''}
                        </div>
                    </div>
                    <div class="order-date">
                        <span class="date-label">Submitted</span>
                        <span class="date-value">${formattedDate}</span>
                    </div>
                </div>
                
                <div class="order-body">
                    <div class="order-details-grid">
                        <div class="detail-item">
                            <span class="detail-label">👤 Requestor</span>
                            <span class="detail-value">${order.requestorName}</span>
                            <span class="detail-sub">${order.requestorEmail}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">🏢 Supplier</span>
                            <span class="detail-value">${order.supplierName}</span>
                            <span class="detail-sub">${order.supplierEmail || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📂 Category</span>
                            <span class="detail-value">${order.category}</span>
                        </div>
                        ${order.projectRef ? `
                            <div class="detail-item">
                                <span class="detail-label">🎯 Project</span>
                                <span class="detail-value">${order.projectRef}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="order-materials-summary">
                        <div class="materials-stats">
                            <span class="stat">
                                <span class="stat-number">${order.totalItems || 0}</span>
                                <span class="stat-label">Items</span>
                            </span>
                            <span class="stat">
                                <span class="stat-number">${order.totalQuantity || 0}</span>
                                <span class="stat-label">Quantity</span>
                            </span>
                            ${order.hasPdf ? '<span class="stat pdf-stat"><span class="stat-icon">📄</span><span class="stat-label">PDF Specs</span></span>' : ''}
                        </div>
                        
                        ${order.materialsList && order.materialsList.length > 0 ? `
                            <div class="materials-preview collapsed" id="materials-${order.orderId}">
                                <div class="materials-list">
                                    ${order.materialsList.slice(0, 3).map(material => `
                                        <div class="material-preview-item">
                                            <span class="material-name">${material.name}</span>
                                            ${material.code ? `<span class="material-code">(${material.code})</span>` : ''}
                                            <span class="material-quantity">${material.quantity} ${material.unit}</span>
                                        </div>
                                    `).join('')}
                                    ${order.materialsList.length > 3 ? `
                                        <div class="material-preview-item more-items">
                                            <span class="more-text">+ ${order.materialsList.length - 3} more items</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <button type="button" class="toggle-materials-btn" onclick="window.app.toggleOrderMaterials('${order.orderId}')">
                                <span class="btn-text">Show All Materials</span>
                                <span class="btn-icon">▼</span>
                            </button>
                        ` : ''}
                    </div>
                    
                    ${order.notes ? `
                        <div class="order-notes">
                            <span class="notes-label">📝 NOTES:</span>
                            <div class="notes-content" data-notes="${this.escapeHtml(order.notes)}"></div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-actions">
                    ${order.hasPdf && order.pdfLink && order.pdfLink !== 'N/A' ? `
                        <a href="${order.pdfLink}" target="_blank" class="btn-action btn-pdf">
                            <span class="btn-icon">📄</span>
                            View PDF
                        </a>
                    ` : ''}
                    <button type="button" class="btn-action btn-duplicate" onclick="window.app.duplicateOrder('${order.orderId}')">
                        <span class="btn-icon">📋</span>
                        Duplicate
                    </button>
                    <button type="button" class="btn-action btn-details" onclick="window.app.showOrderDetails('${order.orderId}')">
                        <span class="btn-icon">👁️</span>
                        Details
                    </button>
                </div>
            </div>
        `;
    }

    toggleOrderMaterials(orderId) {
        const materialsDiv = document.getElementById(`materials-${orderId}`);
        const toggleBtn = document.querySelector(`[onclick="window.app.toggleOrderMaterials('${orderId}')"]`);
        
        if (materialsDiv && toggleBtn) {
            const isExpanded = !materialsDiv.classList.contains('collapsed');
            const btnText = toggleBtn.querySelector('.btn-text');
            const btnIcon = toggleBtn.querySelector('.btn-icon');
            
            if (isExpanded) {
                materialsDiv.classList.add('collapsed');
                if (btnText) btnText.textContent = 'Show All Materials';
                if (btnIcon) btnIcon.textContent = '▼';
            } else {
                materialsDiv.classList.remove('collapsed');
                if (btnText) btnText.textContent = 'Hide Materials';
                if (btnIcon) btnIcon.textContent = '▲';
            }
        }
    }

    duplicateOrder(orderId) {
        const order = this.orderHistory.find(o => o.orderId === orderId);
        if (!order) {
            this.showError('Order not found');
            return;
        }
        
        console.log('📋 Duplicating order:', orderId);
        
        // Determine method based on order data
        let method = 'system';
        if (order.hasPdf && order.totalItems > 0) {
            method = 'both';
        } else if (order.hasPdf) {
            method = 'pdf';
        }
        
        // Switch to appropriate method
        this.selectMethod(method);
        
        // Pre-fill form with order data
        setTimeout(() => {
            this.prefillFromOrder(order);
            this.showMessage('Order duplicated! Please review and modify as needed.', 'info');
        }, 500);
    }

    prefillFromOrder(order) {
        try {
            // Basic requestor info
            const requestorName = document.getElementById('requestorName') || document.getElementById('pdfRequestorName');
            const requestorEmail = document.getElementById('requestorEmail') || document.getElementById('pdfRequestorEmail');
            const urgency = document.getElementById('urgency') || document.getElementById('pdfUrgency');
            const projectRef = document.getElementById('projectRef') || document.getElementById('pdfProjectRef');
            const notes = document.getElementById('notes') || document.getElementById('pdfNotes');
            
            if (requestorName) requestorName.value = order.requestorName || '';
            if (requestorEmail) requestorEmail.value = order.requestorEmail || '';
            if (urgency) urgency.value = order.urgency || 'Normal';
            if (projectRef) projectRef.value = order.projectRef || '';
            if (notes) notes.value = order.notes || '';
            
            // Set request type
            const requestType = order.status === 'ORDER' ? 'order' : 'quote';
            const requestTypeInputs = document.querySelectorAll('input[name="requestType"], input[name="pdfRequestType"]');
            requestTypeInputs.forEach(input => {
                if (input.value === requestType) {
                    input.checked = true;
                }
            });
            
            // For system or both methods
            if (this.currentMethod === 'system' || this.currentMethod === 'both') {
                setTimeout(() => {
                    // Category and supplier
                    const categorySelect = document.getElementById('category');
                    const supplierSelect = document.getElementById('supplier');
                    
                    if (categorySelect && order.category) {
                        categorySelect.value = order.category;
                        this.handleCategoryChange();
                        
                        setTimeout(() => {
                            if (supplierSelect && order.supplierName) {
                                supplierSelect.value = order.supplierName;
                                this.handleSupplierChange();
                                
                                // Pre-select materials
                                if (order.materialsList && order.materialsList.length > 0) {
                                    setTimeout(() => {
                                        order.materialsList.forEach(material => {
                                            this.addMaterialById(material.id, material.quantity);
                                        });
                                    }, 200);
                                }
                            }
                        }, 100);
                    }
                }, 100);
            }
            
            // For PDF method
            if (this.currentMethod === 'pdf') {
                const pdfSupplier = document.getElementById('pdfSupplier');
                if (pdfSupplier && order.supplierName) {
                    pdfSupplier.value = order.supplierName;
                    this.handlePdfSupplierChange();
                }
            }
            
        } catch (error) {
            console.error('❌ Error prefilling from order:', error);
        }
    }

    showOrderDetails(orderId) {
        const order = this.orderHistory.find(o => o.orderId === orderId);
        if (!order) {
            this.showError('Order not found');
            return;
        }
        
        // Create and show order details modal
        const modal = this.createOrderDetailsModal(order);
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    createOrderDetailsModal(order) {
        const modal = document.createElement('div');
        modal.className = 'order-details-modal';
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeOrderDetailsModal(modal);
            }
        };
        
        const formattedDate = new Date(order.date + ' ' + order.time).toLocaleString();
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Order Details - #${order.orderId}</h3>
                    <button type="button" class="modal-close" onclick="window.app.closeOrderDetailsModal(this.closest('.order-details-modal'))">×</button>
                </div>
                <div class="modal-body">
                    <div class="details-grid">
                        <div class="detail-section">
                            <h4>📋 Order Information</h4>
                            <div class="detail-row">
                                <span class="label">Order ID:</span>
                                <span class="value">#${order.orderId}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Type:</span>
                                <span class="value badge ${order.status === 'ORDER' ? 'badge-order' : 'badge-quote'}">${order.status}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Priority:</span>
                                <span class="value badge badge-${order.urgency.toLowerCase()}">${order.urgency}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Submitted:</span>
                                <span class="value">${formattedDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Category:</span>
                                <span class="value">${order.category}</span>
                            </div>
                            ${order.projectRef ? `
                                <div class="detail-row">
                                    <span class="label">Project Reference:</span>
                                    <span class="value">${order.projectRef}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="detail-section">
                            <h4>👤 Requestor</h4>
                            <div class="detail-row">
                                <span class="label">Name:</span>
                                <span class="value">${order.requestorName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Email:</span>
                                <span class="value">${order.requestorEmail}</span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>🏢 Supplier</h4>
                            <div class="detail-row">
                                <span class="label">Company:</span>
                                <span class="value">${order.supplierName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Email:</span>
                                <span class="value">${order.supplierEmail || 'N/A'}</span>
                            </div>
                            ${order.supplierPhone ? `
                                <div class="detail-row">
                                    <span class="label">Phone:</span>
                                    <span class="value">${order.supplierPhone}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${order.materialsList && order.materialsList.length > 0 ? `
                        <div class="detail-section materials-section">
                            <h4>📦 Materials (${order.totalItems} items, ${order.totalQuantity} total quantity)</h4>
                            <div class="materials-detail-list">
                                ${order.materialsList.map(material => `
                                    <div class="material-detail-item">
                                        <div class="material-info">
                                            <span class="material-name">${material.name}</span>
                                            ${material.code ? `<span class="material-code">Code: ${material.code}</span>` : ''}
                                            <span class="material-category">${material.subcategory || 'N/A'}</span>
                                        </div>
                                        <div class="material-quantity">
                                            <span class="quantity-badge">${material.quantity} ${material.unit}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${order.hasPdf ? `
                        <div class="detail-section">
                            <h4>📄 PDF Specifications</h4>
                            <div class="pdf-info">
                                <span class="pdf-indicator">PDF specifications included</span>
                                ${order.pdfLink && order.pdfLink !== 'N/A' ? `
                                    <a href="${order.pdfLink}" target="_blank" class="btn-pdf">View PDF</a>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${order.notes ? `
                        <div class="detail-section">
                            <h4>📝 Notes</h4>
                            <div class="notes-content" data-modal-notes="${this.escapeHtml(order.notes)}"></div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="window.app.closeOrderDetailsModal(this.closest('.order-details-modal'))">Close</button>
                    <button type="button" class="btn-primary" onclick="window.app.duplicateOrder('${order.orderId}'); window.app.closeOrderDetailsModal(this.closest('.order-details-modal'));">Duplicate Order</button>
                </div>
            </div>
        `;
        
        // Fix notes display in modal
        setTimeout(() => {
            const modalNotesElement = modal.querySelector('.notes-content[data-modal-notes]');
            if (modalNotesElement) {
                const notesText = modalNotesElement.getAttribute('data-modal-notes');
                if (notesText && window.renderSafeNotesContent) {
                    window.renderSafeNotesContent(modalNotesElement, notesText);
                    modalNotesElement.removeAttribute('data-modal-notes');
                }
            }
        }, 10);
        
        return modal;
    }

    closeOrderDetailsModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    clearHistoryFilters() {
        const filterElements = ['filter-status', 'filter-supplier', 'filter-urgency', 'filter-search'];
        filterElements.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.value = '';
            }
        });
        
        this.renderFilteredHistory(this.orderHistory);
    }

    refreshOrderHistory() {
        console.log('🔄 Refreshing order history...');
        this.orderHistory = [];
        this.loadOrderHistory();
    }

    exportOrderHistory() {
        try {
            const csvContent = this.generateHistoryCSV();
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `LCMB_Order_History_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            console.log('📥 Order history exported to CSV');
        } catch (error) {
            console.error('❌ Error exporting order history:', error);
            this.showError('Failed to export order history');
        }
    }

    generateHistoryCSV() {
        const headers = [
            'Order ID', 'Date', 'Time', 'Status', 'Category', 'Requestor Name', 'Requestor Email',
            'Supplier Name', 'Supplier Email', 'Total Items', 'Total Quantity', 'Urgency',
            'Project Reference', 'Notes', 'Has PDF'
        ];
        
        const csvRows = [headers.join(',')];
        
        this.orderHistory.forEach(order => {
            const row = [
                `"${order.orderId}"`,
                `"${order.date}"`,
                `"${order.time}"`,
                `"${order.status}"`,
                `"${order.category}"`,
                `"${order.requestorName}"`,
                `"${order.requestorEmail}"`,
                `"${order.supplierName}"`,
                `"${order.supplierEmail || ''}"`,
                order.totalItems || 0,
                order.totalQuantity || 0,
                `"${order.urgency}"`,
                `"${order.projectRef || ''}"`,
                `"${(order.notes || '').replace(/"/g, '""')}"`,
                order.hasPdf ? 'Yes' : 'No'
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    generateHistorySummary() {
        if (this.orderHistory.length === 0) {
            return {
                totalOrders: 0,
                orderCount: 0,
                quoteCount: 0,
                uniqueSuppliers: 0,
                urgentCount: 0,
                withPdfCount: 0
            };
        }
        
        return {
            totalOrders: this.orderHistory.length,
            orderCount: this.orderHistory.filter(o => o.status === 'ORDER').length,
            quoteCount: this.orderHistory.filter(o => o.status === 'QUOTE').length,
            uniqueSuppliers: [...new Set(this.orderHistory.map(o => o.supplierName))].filter(s => s).length,
            urgentCount: this.orderHistory.filter(o => o.urgency === 'Urgent').length,
            withPdfCount: this.orderHistory.filter(o => o.hasPdf).length
        };
    }

    // ===============================================
    // PDF UPLOAD FUNCTIONALITY
    // ===============================================

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e, type = 'main') {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                if (type === 'main') {
                    this.setPdfFile(file);
                } else {
                    this.setAdditionalPdfFile(file);
                }
            } else {
                this.showError('Please upload a PDF file only.');
            }
        }
    }

    handlePdfFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.setPdfFile(file);
        }
    }

    handleAdditionalPdfFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.setAdditionalPdfFile(file);
        }
    }

    setPdfFile(file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('PDF file size must be less than 10MB.');
            return;
        }
        
        this.pdfFile = file;
        this.displayPdfFileInfo(file, 'main');
        this.validatePdfForm();
        
        console.log('📄 PDF file selected:', file.name, this.formatFileSize(file.size));
    }

    setAdditionalPdfFile(file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            this.showError('PDF file size must be less than 10MB.');
            return;
        }
        
        this.additionalPdfFile = file;
        this.displayPdfFileInfo(file, 'additional');
        this.validateForm();
        
        console.log('📎 Additional PDF file selected:', file.name, this.formatFileSize(file.size));
    }

    displayPdfFileInfo(file, type) {
        const prefix = type === 'main' ? 'pdf' : 'additionalPdf';
        const fileInfo = document.getElementById(prefix + 'FileInfo');
        const fileName = document.getElementById(prefix + 'FileName');
        const fileSize = document.getElementById(prefix + 'FileSize');
        const uploadArea = document.getElementById(prefix === 'pdf' ? 'pdfUploadArea' : 'additionalPdfUploadArea');
        
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = this.formatFileSize(file.size);
            fileInfo.style.display = 'flex';
            
            if (uploadArea) {
                uploadArea.classList.add('has-file');
            }
        }
    }

    removePdfFile(type) {
        if (type === 'main') {
            this.pdfFile = null;
            const pdfFile = document.getElementById('pdfFile');
            const pdfFileInfo = document.getElementById('pdfFileInfo');
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            
            if (pdfFile) pdfFile.value = '';
            if (pdfFileInfo) pdfFileInfo.style.display = 'none';
            if (pdfUploadArea) pdfUploadArea.classList.remove('has-file');
            
            this.validatePdfForm();
        } else {
            this.additionalPdfFile = null;
            const additionalPdfFile = document.getElementById('additionalPdfFile');
            const additionalPdfFileInfo = document.getElementById('additionalPdfFileInfo');
            const additionalPdfUploadArea = document.getElementById('additionalPdfUploadArea');
            
            if (additionalPdfFile) additionalPdfFile.value = '';
            if (additionalPdfFileInfo) additionalPdfFileInfo.style.display = 'none';
            if (additionalPdfUploadArea) additionalPdfUploadArea.classList.remove('has-file');
            
            this.validateForm();
        }
        
        console.log('🗑️ PDF file removed:', type);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ===============================================
    // PDF FORM HANDLING
    // ===============================================

    handlePdfRequestTypeChange() {
        const selectedType = document.querySelector('input[name="pdfRequestType"]:checked')?.value;
        const submitBtn = document.getElementById('pdfSubmitBtn');
        const btnText = submitBtn?.querySelector('.btn-text');
        
        if (selectedType === 'order') {
            if (btnText) btnText.textContent = 'Upload PDF & Send Order';
        } else {
            if (btnText) btnText.textContent = 'Upload PDF & Request Quote';
        }
    }

    validatePdfForm() {
        const form = document.getElementById('pdfMaterialForm');
        const submitBtn = document.getElementById('pdfSubmitBtn');
        
        if (!form || !submitBtn) return;

        let isValid = true;

        // Check supplier selection (dropdown only now)
        const pdfSupplier = document.getElementById('pdfSupplier');
        if (!pdfSupplier?.value.trim()) {
            isValid = false;
        }

        // Check other required fields
        const requiredFields = ['pdfRequestorName', 'pdfRequestorEmail'];
        for (const fieldName of requiredFields) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field || !field.value.trim()) {
                isValid = false;
                break;
            }
        }

        // Check requestor email format
        const requestorEmail = form.querySelector('[name="pdfRequestorEmail"]');
        if (requestorEmail && requestorEmail.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(requestorEmail.value)) {
                isValid = false;
            }
        }

        // Check PDF file
        if (!this.pdfFile) {
            isValid = false;
        }

        submitBtn.disabled = !isValid;
    }

    async handlePdfFormSubmit(e) {
        e.preventDefault();
        
        if (!this.pdfFile) {
            this.showError('Please select a PDF file.');
            return;
        }
        
        try {
            const form = e.target;
            const submitBtn = document.getElementById('pdfSubmitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoading = submitBtn?.querySelector('.btn-loading');
            
            // Disable form
            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'flex';

            console.log('📤 Submitting PDF form with binary data...');

            // Prepare form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Get supplier info from dropdown
            const pdfSupplierSelect = document.getElementById('pdfSupplier');
            const selectedOption = pdfSupplierSelect?.selectedOptions[0];
            
            const supplierName = data.pdfSupplier || '';
            const supplierEmail = selectedOption?.dataset.email || '';
            
            if (!supplierName || !supplierEmail) {
                throw new Error('Please select a supplier from the dropdown');
            }
            
            // Get selected categories
            const selectedCategories = this.getSelectedPdfCategories();
            const categoryString = selectedCategories.length > 0 ? selectedCategories.join(', ') : 'PDF Upload';
            
            // Create FormData for binary upload
            const uploadFormData = new FormData();
            
            // Add PDF file as binary
            uploadFormData.append('pdfFile', this.pdfFile, this.pdfFile.name);
            
            // Add other form data
            uploadFormData.append('requestType', data.pdfRequestType);
            uploadFormData.append('supplierName', supplierName);
            uploadFormData.append('supplierEmail', supplierEmail);
            uploadFormData.append('requestorName', data.pdfRequestorName);
            uploadFormData.append('requestorEmail', data.pdfRequestorEmail);
            uploadFormData.append('urgency', data.pdfUrgency || 'Normal');
            uploadFormData.append('projectRef', data.pdfProjectRef || '');
            uploadFormData.append('notes', data.pdfNotes || '');
            uploadFormData.append('category', categoryString);
            uploadFormData.append('categories', JSON.stringify(selectedCategories));
            uploadFormData.append('filename', this.pdfFile.name);
            
            console.log('📦 PDF submission with binary data:', {
                requestType: data.pdfRequestType,
                supplierName: supplierName,
                filename: this.pdfFile.name,
                pdfSize: this.formatFileSize(this.pdfFile.size),
                categories: selectedCategories,
                uploadMethod: 'multipart/form-data binary'
            });

            // Submit to PDF upload endpoint with binary data
            const response = await fetch('/api/pdf/upload', {
                method: 'POST',
                body: uploadFormData // No Content-Type header - let browser set it for multipart
            });

            console.log('📡 Response status:', response.status, response.statusText);
            
            // Check if response is ok first
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Server error response:', errorText);
                throw new Error(`Server error (${response.status}): ${response.statusText}`);
            }

            // Try to parse JSON response
            let result;
            const responseText = await response.text();
            console.log('📋 Raw response:', responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
            
            try {
                result = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ JSON parse error:', parseError);
                console.error('❌ Response was not valid JSON:', responseText);
                throw new Error('Server returned invalid response format');
            }
            
            console.log('✅ PDF binary submission result:', result);

            // Check for success (handle different success indicators)
            const isSuccess = result && (
                result.success === true || 
                result.success !== false || 
                result.orderId || 
                result.quoteId || 
                result.message
            );

            if (isSuccess) {
                this.showPdfSuccess(result, data.pdfRequestType);
            } else {
                const errorMessage = result?.error || result?.message || 'PDF submission failed';
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('❌ PDF binary submission error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'PDF submission failed';
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error - please check your connection and try again';
            } else if (error.message.includes('invalid response format')) {
                errorMessage = 'Server configuration error - please contact support';
            } else if (error.message.includes('Server error')) {
                errorMessage = error.message;
            } else {
                errorMessage = `PDF submission failed: ${error.message}`;
            }
            
            this.showError(errorMessage);
        } finally {
            // Re-enable form
            const submitBtn = document.getElementById('pdfSubmitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            const btnLoading = submitBtn?.querySelector('.btn-loading');
            
            if (submitBtn) submitBtn.disabled = false;
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
        }
    }

    showPdfSuccess(result, requestType) {
        try {
            // Hide all sections, show success
            this.hideAllSections();
            const successAlert = document.getElementById('successAlert');
            const successMessage = document.getElementById('successMessage');
            const referenceId = document.getElementById('referenceId');
            const successSupplier = document.getElementById('successSupplier');
            const pdfSuccessInfo = document.getElementById('pdfSuccessInfo');
            const successPdfFile = document.getElementById('successPdfFile');
            const successDriveLink = document.getElementById('successDriveLink');

            if (successAlert) successAlert.style.display = 'block';
            if (successMessage) {
                const type = requestType === 'order' ? 'order' : 'quote request';
                successMessage.textContent = `Your PDF ${type} has been submitted successfully and sent to the supplier!`;
            }
            if (referenceId) referenceId.textContent = result.orderId || result.quoteId || 'PDF-' + Date.now();
            if (successSupplier) successSupplier.textContent = result.supplier || 'Supplier';
            
            // Show PDF-specific success info
            if (pdfSuccessInfo) {
                pdfSuccessInfo.style.display = 'block';
                if (successPdfFile) successPdfFile.textContent = result.pdfFileName || this.pdfFile?.name || 'Document';
                if (successDriveLink && result.driveLink) {
                    successDriveLink.href = result.driveLink;
                    successDriveLink.style.display = 'inline';
                }
            }

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('❌ Error showing PDF success:', error);
        }
    }

    // ===============================================
    // DATA LOADING & FORM POPULATION
    // ===============================================

    async loadFormData() {
        if (this.formData) {
            console.log('📊 Form data already loaded');
            return;
        }

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
            } else {
                throw new Error('Failed to load form data: ' + (data.error || 'Unknown error'));
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

    // ===============================================
    // SYSTEM FORM FUNCTIONALITY (from original script.js)
    // ===============================================

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

            // Populate subcategories and materials for selected category and supplier
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

        // Check materials (only if using system method)
        if (this.currentMethod === 'system' && this.selectedMaterials.length === 0) {
            isValid = false;
        }

        // FIXED: For "both" method, require BOTH materials AND PDF
        if (this.currentMethod === 'both') {
            if (this.selectedMaterials.length === 0) {
                isValid = false;
            }
            // REQUIRE PDF for BOTH method
            if (!this.additionalPdfFile) {
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
        
        // Update button text to indicate PDF is required for BOTH
        const btnText = submitBtn?.querySelector('.btn-text');
        if (btnText && this.currentMethod === 'both' && !this.additionalPdfFile) {
            btnText.textContent = 'Add PDF to Continue';
        } else if (btnText) {
            const requestType = form.querySelector('input[name="requestType"]:checked')?.value;
            btnText.textContent = requestType === 'order' ? 'Review Order' : 'Review Quote Request';
        }
        
    } catch (error) {
        console.error('❌ Error validating form:', error);
    }
}

    // ===============================================
    // FORM SUBMISSION & CONFIRMATION
    // ===============================================

    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            
            // Prepare form data for confirmation
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add selected materials with quantities
            data.materials = this.selectedMaterials;
            
            // Get supplier details
            const supplierSelect = document.getElementById('supplier');
            const selectedOption = supplierSelect.selectedOptions[0];
            if (selectedOption) {
                data.supplierEmail = selectedOption.dataset.email || '';
                data.supplierPhone = selectedOption.dataset.phone || '';
                data.supplierId = selectedOption.dataset.id || '';
            }

            // Add PDF data if using "both" method
            if (this.currentMethod === 'both' && this.additionalPdfFile) {
                data.additionalPdfFile = this.additionalPdfFile;
                data.additionalPdfFileName = this.additionalPdfFile.name;
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
            
            // Populate order summary
            this.populateElement('confirmRequestType', requestType === 'order' ? 'Material Order' : 'Quote Request');
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
            
            // Populate materials
            this.populateConfirmationMaterials(data.materials);
            
// Handle PDF section for "both" method
            const confirmPdfSection = document.getElementById('confirmPdfSection');
            if (this.currentMethod === 'both' && this.additionalPdfFile && confirmPdfSection) {
                confirmPdfSection.style.display = 'block';
                this.populateElement('confirmPdfFileName', this.additionalPdfFile.name);
                this.populateElement('confirmPdfFileSize', this.formatFileSize(this.additionalPdfFile.size));
            } else if (confirmPdfSection) {
                confirmPdfSection.style.display = 'none';
            }
            
            // Handle special instructions
            const notesSection = document.getElementById('notesSection');
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

    populateConfirmationMaterials(materials) {
        try {
            const materialsSummary = document.getElementById('confirmMaterialsSummary');
            const materialsList = document.getElementById('confirmMaterialsList');
            
            if (!materials || materials.length === 0) {
                if (materialsSummary) {
                    materialsSummary.innerHTML = '<div class="summary-stat"><span class="stat-number">0</span><span class="stat-label">Materials</span></div>';
                }
                if (materialsList) {
                    materialsList.innerHTML = '<p class="no-materials">No system materials selected</p>';
                }
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
        console.log('📤 Submitting confirmed request:', data);
        console.log('🔍 Current method:', this.currentMethod);
        console.log('📦 Materials count:', data.materials?.length || 0);
        
        // FIXED: Route based on method type
        let response;
        let result;
        
        if (this.currentMethod === 'both' && this.additionalPdfFile) {
            // BOTH METHOD: Send everything through PDF Upload API
            console.log('📄 BOTH method detected - sending materials + PDF through PDF Upload API');
            console.log('📦 Materials being sent:', data.materials);
            
            try {
                // Create FormData for PDF upload with materials
                const pdfFormData = new FormData();
                
                // Add PDF file as binary
                pdfFormData.append('pdfFile', this.additionalPdfFile, this.additionalPdfFile.name);
                
                // Add all form data including materials
                pdfFormData.append('requestType', data.requestType);
                pdfFormData.append('supplierName', data.supplier);
                pdfFormData.append('supplierEmail', data.supplierEmail || '');
                pdfFormData.append('supplierId', data.supplierId || '');
                pdfFormData.append('requestorName', data.requestorName);
                pdfFormData.append('requestorEmail', data.requestorEmail);
                pdfFormData.append('urgency', data.urgency || 'Normal');
                pdfFormData.append('projectRef', data.projectRef || '');
                pdfFormData.append('notes', data.notes || '');
                pdfFormData.append('category', data.category);
                pdfFormData.append('filename', this.additionalPdfFile.name);
                
                // CRITICAL: Add materials as JSON string for BOTH method
                // Ensure materials have all required fields
                const materialsToSend = data.materials.map(m => ({
                    id: m.id,
                    name: m.name,
                    code: m.code || '',
                    unit: m.unit || 'pcs',
                    quantity: m.quantity || 1,
                    subcategory: m.subcategory || '',
                    supplierId: m.supplierId || '',
                    supplierName: m.supplierName || ''
                }));
                
                pdfFormData.append('materials', JSON.stringify(materialsToSend));
                
                console.log('📤 Sending BOTH method data to PDF Upload API:', {
                    requestType: data.requestType,
                    supplier: data.supplier,
                    materialsCount: materialsToSend.length,
                    pdfFile: this.additionalPdfFile.name,
                    method: 'BOTH_WORLDS',
                    materialsPreview: materialsToSend.slice(0, 2)
                });
                
                // Send to PDF Upload API (this will handle everything)
                response = await fetch('/api/pdf/upload', {
                    method: 'POST',
                    body: pdfFormData
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.statusText}`);
                }
                
                result = await response.json();
                console.log('✅ BOTH method submission successful:', result);
                
                // Show success with PDF info
                this.showBothMethodSuccess(
                    data.requestType === 'order' ? 'order' : 'quote',
                    result.orderId || result.quoteId || `${data.requestType.toUpperCase()}-${Date.now()}`,
                    data.supplier,
                    result
                );
                
            } catch (error) {
                console.error('❌ BOTH method submission failed:', error);
                throw error;
            }
            
        } else if (this.currentMethod === 'system') {
            // SYSTEM ONLY: Use regular order/quote endpoints
            console.log('🖥️ System method - using regular order/quote endpoints');
            
            const requestType = data.requestType;
            const endpoint = requestType === 'order' ? '/api/order/submit' : '/api/quote/submit';
            
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }
            
            result = await response.json();
            console.log('✅ System submission result:', result);
            
            if (result.success !== false) {
                const type = requestType === 'order' ? 'order' : 'quote';
                const id = result.orderId || result.quoteId || result.id || `${type.toUpperCase()}-${Date.now()}`;
                this.showSuccess(type, id, data.supplier);
            } else {
                throw new Error(result.error || 'Submission failed');
            }
            
        } else {
            // This shouldn't happen as PDF-only goes through different flow
            throw new Error('Invalid submission method');
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
    // ===============================================
    // UI HELPER FUNCTIONS
    // ===============================================

    showSuccess(type, id, supplier) {
        try {
            // Hide all sections, show success
            this.hideAllSections();
            const successAlert = document.getElementById('successAlert');
            const successMessage = document.getElementById('successMessage');
            const referenceId = document.getElementById('referenceId');
            const successSupplier = document.getElementById('successSupplier');

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

showBothMethodSuccess(type, id, supplier, pdfResult) {
    try {
        // Hide all sections, show success
        this.hideAllSections();
        const successAlert = document.getElementById('successAlert');
        const successMessage = document.getElementById('successMessage');
        const referenceId = document.getElementById('referenceId');
        const successSupplier = document.getElementById('successSupplier');
        const pdfSuccessInfo = document.getElementById('pdfSuccessInfo');
        const successPdfFile = document.getElementById('successPdfFile');
        const successDriveLink = document.getElementById('successDriveLink');

        if (successAlert) successAlert.style.display = 'block';
        if (successMessage) {
            successMessage.textContent = `Your ${type} request with system materials and PDF specifications has been submitted successfully!`;
        }
        if (referenceId) referenceId.textContent = id;
        if (successSupplier) successSupplier.textContent = supplier;
        
        // Show PDF info
        if (pdfSuccessInfo) {
            pdfSuccessInfo.style.display = 'block';
            if (successPdfFile) successPdfFile.textContent = pdfResult.pdfFileName || 'Additional specifications';
            if (successDriveLink && pdfResult.driveLink) {
                successDriveLink.href = pdfResult.driveLink;
                successDriveLink.style.display = 'inline';
            }
        }

        // Clear pending data
        this.pendingSubmissionData = null;
        this.additionalPdfFile = null;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error showing both method success:', error);
    }
}

    showLoading(show) {
        try {
            const loading = document.getElementById('loading');
            const methodSelection = document.getElementById('methodSelection');
            const mainForm = document.getElementById('mainForm');
            
            if (loading) {
                loading.style.display = show ? 'block' : 'none';
            }
            
            // Hide current visible section when loading
            if (show) {
                if (methodSelection && methodSelection.style.display !== 'none') {
                    methodSelection.style.display = 'none';
                }
                if (mainForm && mainForm.style.display !== 'none') {
                    mainForm.style.display = 'none';
                }
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

    showMessage(message, type = 'info') {
        try {
            // Create a message alert similar to success/error
            const messageAlert = document.createElement('div');
            messageAlert.className = `alert alert-${type}`;
            messageAlert.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'info' ? '#3b82f6' : '#10b981'};
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 400px;
            `;
            messageAlert.textContent = message;
            
            document.body.appendChild(messageAlert);
            
            // Auto-remove after 3 seconds
            setTimeout(() => {
                messageAlert.remove();
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error showing message:', error);
        }
    }
}

// ===============================================
// GLOBAL FUNCTIONS & EVENT HANDLERS
// ===============================================

// Global method selection function (called from HTML onclick)
function selectMethod(method) {
    if (window.app) {
        window.app.selectMethod(method);
    } else {
        console.error('❌ App not initialized');
    }
}

// Global function for resetting form
function resetForm() {
    try {
        // Hide all sections first
        const sections = [
            'mainForm',
            'pdfForm', 
            'confirmationPage',
            'orderHistorySection',
            'successAlert',
            'errorAlert'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) section.style.display = 'none';
        });
        
        // Show method selection
        const methodSelection = document.getElementById('methodSelection');
        if (methodSelection) methodSelection.style.display = 'block';
        
        // Reset forms
        const mainForm = document.getElementById('materialForm');
        const pdfForm = document.getElementById('pdfMaterialForm');
        if (mainForm) mainForm.reset();
        if (pdfForm) pdfForm.reset();
        
        // Reset app state
        if (window.app) {
            window.app.currentMethod = null;
            window.app.selectedMaterials = [];
            window.app.filteredMaterials = [];
            window.app.selectedSubcategory = '';
            window.app.pendingSubmissionData = null;
            window.app.pdfFile = null;
            window.app.additionalPdfFile = null;
            window.app.renderSelectedMaterials();
            window.app.resetMaterialSelection();
            
            // Reset PDF file displays
            const pdfFileInfo = document.getElementById('pdfFileInfo');
            const additionalPdfFileInfo = document.getElementById('additionalPdfFileInfo');
            if (pdfFileInfo) pdfFileInfo.style.display = 'none';
            if (additionalPdfFileInfo) additionalPdfFileInfo.style.display = 'none';
            
            // Reset upload areas
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            const additionalPdfUploadArea = document.getElementById('additionalPdfUploadArea');
            if (pdfUploadArea) pdfUploadArea.classList.remove('has-file');
            if (additionalPdfUploadArea) additionalPdfUploadArea.classList.remove('has-file');
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('🔄 Form reset complete');
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// GLOBAL ORDER HISTORY FUNCTIONS
function showOrderHistory() {
    if (window.app) {
        window.app.showOrderHistory();
    } else {
        console.error('❌ App not initialized');
    }
}

// ===============================================
// API INTEGRATION FUNCTIONS
// ===============================================

// Function to handle server API calls with proper error handling
async function callAPI(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        console.log(`🌐 API Call: ${method} ${endpoint}`);
        
        const response = await fetch(endpoint, config);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ API Response: ${endpoint}`, result);
        
        return result;
    } catch (error) {
        console.error(`❌ API Error: ${endpoint}`, error);
        throw error;
    }
}

// ===============================================
// INITIALIZATION & EVENT SETUP
// ===============================================

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting Enhanced LCMB Material Management App with Order History');
        console.log('🔧 Features: Method Selection + PDF Upload + System Integration + Confirmation Flow + ORDER HISTORY');
        
        window.app = new MaterialManagementApp();
        window.app.init();
        
        // Set up global error handling
        window.addEventListener('error', (e) => {
            console.error('🚨 Global JavaScript Error:', e.error);
            if (window.app) {
                window.app.showError('An unexpected error occurred. Please refresh the page and try again.');
            }
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Unhandled Promise Rejection:', e.reason);
            if (window.app) {
                window.app.showError('An unexpected error occurred. Please refresh the page and try again.');
            }
        });
        
        console.log('✅ Enhanced Material Management App with Order History initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        
        // Fallback error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.style.margin = '2rem';
        errorDiv.innerHTML = `
            <strong>⚠️ Initialization Error:</strong> 
            Failed to start the application. Please refresh the page and try again.
            <br><small>Error: ${error.message}</small>
        `;
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    console.log('🔄 Browser navigation detected - reloading page');
    location.reload();
});

// Handle page visibility changes (for cleanup)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📴 Page hidden - pausing any ongoing operations');
        // Could pause uploads, timers, etc.
    } else {
        console.log('📱 Page visible - resuming operations');
        // Could resume operations, refresh data, etc.
    }
});

// Export functions for testing/debugging (development mode)
if (typeof window !== 'undefined') {
    window.LCMB_DEBUG = {
        app: () => window.app,
        resetForm: resetForm,
        selectMethod: selectMethod,
        showOrderHistory: showOrderHistory,
        callAPI: callAPI,
        version: '2.1.0-enhanced-with-history'
    };
}

console.log('📜 Enhanced LCMB Material Management Script with Order History Loaded Successfully');
console.log('🔧 Version: 2.1.0 - Method Selection + PDF Upload + Complete Integration + ORDER HISTORY');
console.log('📚 Features: System Orders, PDF Upload, Both Methods, Confirmation Flow, Order History, Export, Filters');
console.log('🎯 Ready for user interaction!');
