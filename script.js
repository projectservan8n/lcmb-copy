// Enhanced script.js with PDF Upload and Order History Features
class EnhancedMaterialManagementApp {
    constructor() {
        this.formData = null;
        this.selectedMaterials = [];
        this.filteredMaterials = [];
        this.selectedSubcategory = '';
        this.pendingSubmissionData = null;
        this.orderHistory = [];
        this.currentPdfFile = null;
        this.currentPdfMode = 'with-order';
        this.activeTab = 'submit-request';
    }

    init() {
        console.log('🚀 Initializing Enhanced LCMB Material Management App with PDF & History');
        
        // Initialize tabs
        this.initializeTabs();
        
        // Load initial form data
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

    // ===============================================
    // TAB MANAGEMENT
    // ===============================================

    initializeTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        console.log('📂 Switching to tab:', tabName);
        
        // Update active states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        this.activeTab = tabName;
        
        // Load order history when switching to history tab
        if (tabName === 'order-history') {
            this.loadOrderHistory();
        }
    }

    // ===============================================
    // PDF UPLOAD FUNCTIONALITY
    // ===============================================

    setupPdfUpload() {
        const pdfDropzone = document.getElementById('pdfDropzone');
        const pdfFileInput = document.getElementById('pdfFileInput');
        const pdfRemoveBtn = document.getElementById('pdfRemoveBtn');

        // Click to upload
        if (pdfDropzone) {
            pdfDropzone.addEventListener('click', () => {
                if (pdfFileInput) pdfFileInput.click();
            });
        }

        // File input change
        if (pdfFileInput) {
            pdfFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this.handlePdfFile(file);
            });
        }

        // Drag and drop
        if (pdfDropzone) {
            pdfDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                pdfDropzone.classList.add('dragover');
            });

            pdfDropzone.addEventListener('dragleave', () => {
                pdfDropzone.classList.remove('dragover');
            });

            pdfDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                pdfDropzone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handlePdfFile(files[0]);
                }
            });
        }

        // Remove PDF
        if (pdfRemoveBtn) {
            pdfRemoveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePdfFile();
            });
        }
    }

    handlePdfFile(file) {
        console.log('📄 Processing PDF file:', file.name);

        // Validate file type
        if (file.type !== 'application/pdf') {
            this.showError('Please select a PDF file only.');
            return;
        }

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.showError('PDF file must be smaller than 10MB. Current size: ' + this.formatFileSize(file.size));
            return;
        }

        // Convert to base64 for transfer
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentPdfFile = {
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result // base64 string
            };
            
            this.showPdfPreview();
            this.validateForm();
            console.log('✅ PDF file processed successfully');
        };

        reader.onerror = () => {
            this.showError('Failed to read PDF file. Please try again.');
        };

        reader.readAsDataURL(file);
    }

    showPdfPreview() {
        const pdfDropzone = document.getElementById('pdfDropzone');
        const pdfPreview = document.getElementById('pdfPreview');
        const pdfFileName = document.getElementById('pdfFileName');
        const pdfFileSize = document.getElementById('pdfFileSize');

        if (this.currentPdfFile) {
            if (pdfDropzone) pdfDropzone.style.display = 'none';
            if (pdfPreview) pdfPreview.style.display = 'block';
            if (pdfFileName) pdfFileName.textContent = this.currentPdfFile.name;
            if (pdfFileSize) pdfFileSize.textContent = this.formatFileSize(this.currentPdfFile.size);
        }
    }

    removePdfFile() {
        console.log('🗑️ Removing PDF file');
        
        this.currentPdfFile = null;
        
        const pdfDropzone = document.getElementById('pdfDropzone');
        const pdfPreview = document.getElementById('pdfPreview');
        const pdfFileInput = document.getElementById('pdfFileInput');

        if (pdfDropzone) pdfDropzone.style.display = 'flex';
        if (pdfPreview) pdfPreview.style.display = 'none';
        if (pdfFileInput) pdfFileInput.value = '';

        this.validateForm();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ===============================================
    // PDF MODE HANDLING
    // ===============================================

    setupPdfModeHandling() {
        const pdfModeInputs = document.querySelectorAll('input[name="pdfMode"]');
        
        pdfModeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.currentPdfMode = input.value;
                this.handlePdfModeChange();
            });
        });
    }

    handlePdfModeChange() {
        console.log('🔄 PDF Mode changed to:', this.currentPdfMode);
        
        const body = document.body;
        const materialsSection = document.getElementById('materialsSection');
        const pdfUploadSection = document.getElementById('pdfUploadSection');
        
        // Remove existing mode classes
        body.classList.remove('pdf-mode-with-order', 'pdf-mode-pdf-only', 'pdf-mode-no-pdf');
        
        // Add current mode class
        body.classList.add(`pdf-mode-${this.currentPdfMode}`);
        
        // Handle section visibility
        switch(this.currentPdfMode) {
            case 'with-order':
                if (materialsSection) materialsSection.style.display = 'block';
                if (pdfUploadSection) pdfUploadSection.style.display = 'block';
                break;
            case 'pdf-only':
                if (materialsSection) materialsSection.style.display = 'none';
                if (pdfUploadSection) pdfUploadSection.style.display = 'block';
                break;
            case 'no-pdf':
                if (materialsSection) materialsSection.style.display = 'block';
                if (pdfUploadSection) pdfUploadSection.style.display = 'none';
                this.removePdfFile(); // Clear any uploaded PDF
                break;
        }
        
        this.validateForm();
    }

    // ===============================================
    // ORDER HISTORY FUNCTIONALITY
    // ===============================================

    async loadOrderHistory() {
        console.log('📋 Loading order history...');
        
        const historyLoading = document.getElementById('historyLoading');
        const historyList = document.getElementById('historyList');
        
        try {
            if (historyLoading) historyLoading.style.display = 'block';
            if (historyList) historyList.style.display = 'none';
            
            const response = await fetch('/api/order/history');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📊 Order history loaded:', data);
            
            if (data.success !== false) {
                this.orderHistory = data.orders || [];
                this.populateOrderHistory();
                this.populateHistoryFilters();
                this.updateHistorySummary();
            } else {
                throw new Error(data.error || 'Failed to load order history');
            }
            
        } catch (error) {
            console.error('❌ Error loading order history:', error);
            this.showHistoryError('Unable to load order history: ' + error.message);
        } finally {
            if (historyLoading) historyLoading.style.display = 'none';
            if (historyList) historyList.style.display = 'block';
        }
    }

    populateOrderHistory(filteredOrders = null) {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        const orders = filteredOrders || this.orderHistory;
        
        if (orders.length === 0) {
            historyList.innerHTML = `
                <div class="no-history">
                    <div class="no-history-icon">📋</div>
                    <p>No order history found.</p>
                    <p class="no-history-hint">Submit your first request to see it here!</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = orders.map(order => this.createHistoryItemHTML(order)).join('');
        
        // Add event listeners for expand/collapse
        this.setupHistoryInteractions();
    }

    createHistoryItemHTML(order) {
        const materials = this.parseMaterialsList(order.Materials_List);
        const totalItems = materials.length;
        const totalQuantity = materials.reduce((sum, m) => sum + (m.quantity || 1), 0);
        
        return `
            <div class="history-item" data-order-id="${order.Order_ID}">
                <div class="history-header">
                    <div class="history-main-info">
                        <div class="history-status">
                            <span class="status-badge ${order.Status.toLowerCase()}">${order.Status}</span>
                        </div>
                        <div class="history-title">
                            <div class="history-order-id">${order.Order_ID}</div>
                            <div class="history-meta">
                                <span>📅 ${order.Date} ${order.Time}</span>
                                <span>🏢 ${order.Supplier_Name}</span>
                                <span>📂 ${order.Category}</span>
                                <span>⚡ ${order.Urgency}</span>
                            </div>
                        </div>
                        <div class="history-stats">
                            <span class="history-stats-number">${totalItems}</span>
                            <span>Materials</span>
                        </div>
                        <div class="history-stats">
                            <span class="history-stats-number">${totalQuantity}</span>
                            <span>Total Qty</span>
                        </div>
                    </div>
                    <div class="history-actions">
                        ${order.PDF_Link ? `<a href="${order.PDF_Link}" target="_blank" class="pdf-view-btn">📄 View PDF</a>` : ''}
                        <button class="history-expand" data-order-id="${order.Order_ID}">
                            ⬇️
                        </button>
                    </div>
                </div>
                <div class="history-details" id="details-${order.Order_ID}">
                    ${this.createHistoryDetailsHTML(order, materials)}
                </div>
            </div>
        `;
    }

    createHistoryDetailsHTML(order, materials) {
        return `
            <div class="details-grid">
                <div class="details-section">
                    <h4>📋 Order Information</h4>
                    <ul class="details-list">
                        <li><strong>Order ID:</strong> <span>${order.Order_ID}</span></li>
                        <li><strong>Status:</strong> <span>${order.Status}</span></li>
                        <li><strong>Date & Time:</strong> <span>${order.Date} at ${order.Time}</span></li>
                        <li><strong>Category:</strong> <span>${order.Category}</span></li>
                        <li><strong>Priority:</strong> <span>${order.Urgency}</span></li>
                        ${order.Project_Ref ? `<li><strong>ServiceM8 Job #:</strong> <span>${order.Project_Ref}</span></li>` : ''}
                    </ul>
                </div>
                
                <div class="details-section">
                    <h4>🏢 Supplier Details</h4>
                    <ul class="details-list">
                        <li><strong>Name:</strong> <span>${order.Supplier_Name}</span></li>
                        <li><strong>Email:</strong> <span>${order.Supplier_Email}</span></li>
                        <li><strong>Total Items:</strong> <span>${order.Total_Items || materials.length}</span></li>
                        <li><strong>Total Quantity:</strong> <span>${order.Total_Quantity || 'N/A'}</span></li>
                    </ul>
                </div>
                
                <div class="details-section">
                    <h4>👤 Requestor</h4>
                    <ul class="details-list">
                        <li><strong>Name:</strong> <span>${order.Requestor_Name}</span></li>
                        <li><strong>Email:</strong> <span>${order.Requestor_Email}</span></li>
                    </ul>
                    ${order.Notes ? `
                        <h4 style="margin-top: 1rem;">📝 Notes</h4>
                        <p style="color: var(--gray-600); font-style: italic;">${order.Notes}</p>
                    ` : ''}
                </div>
            </div>
            
            <div class="details-section">
                <h4>📦 Materials List (${materials.length} items)</h4>
                <div class="history-materials">
                    ${materials.map(material => `
                        <div class="material-history-item">
                            <div class="material-history-info">
                                <div class="material-history-name">${material.name}</div>
                                <div class="material-history-meta">
                                    ${material.code ? `Code: ${material.code} • ` : ''}
                                    Unit: ${material.unit || 'pcs'}
                                    ${material.subcategory ? ` • ${material.subcategory}` : ''}
                                </div>
                            </div>
                            <div class="material-history-qty">${material.quantity || 1} ${material.unit || 'pcs'}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${order.PDF_Link ? `
                <div class="pdf-actions">
                    <a href="${order.PDF_Link}" target="_blank" class="pdf-view-btn">
                        📄 View PDF Document
                    </a>
                </div>
            ` : ''}
        `;
    }

    setupHistoryInteractions() {
        const expandBtns = document.querySelectorAll('.history-expand');
        
        expandBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const orderId = btn.dataset.orderId;
                this.toggleHistoryDetails(orderId);
            });
        });
    }

    toggleHistoryDetails(orderId) {
        const details = document.getElementById(`details-${orderId}`);
        const expandBtn = document.querySelector(`[data-order-id="${orderId}"].history-expand`);
        
        if (details && expandBtn) {
            const isExpanded = details.classList.contains('expanded');
            
            if (isExpanded) {
                details.classList.remove('expanded');
                expandBtn.classList.remove('expanded');
                details.style.display = 'none';
            } else {
                details.classList.add('expanded');
                expandBtn.classList.add('expanded');
                details.style.display = 'block';
            }
        }
    }

    populateHistoryFilters() {
        const historySupplier = document.getElementById('historySupplier');
        const historyCategory = document.getElementById('historyCategory');
        
        if (this.orderHistory.length === 0) return;
        
        // Populate supplier filter
        if (historySupplier) {
            const suppliers = [...new Set(this.orderHistory.map(order => order.Supplier_Name))].sort();
            historySupplier.innerHTML = '<option value="">All Suppliers</option>' + 
                suppliers.map(supplier => `<option value="${supplier}">${supplier}</option>`).join('');
        }
        
        // Populate category filter
        if (historyCategory) {
            const categories = [...new Set(this.orderHistory.map(order => order.Category))].sort();
            historyCategory.innerHTML = '<option value="">All Categories</option>' + 
                categories.map(category => `<option value="${category}">${category}</option>`).join('');
        }
    }

    updateHistorySummary() {
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalQuotesEl = document.getElementById('totalQuotes');
        const totalItemsEl = document.getElementById('totalItems');
        
        const orders = this.orderHistory.filter(order => order.Status === 'ORDER');
        const quotes = this.orderHistory.filter(order => order.Status === 'QUOTE');
        const totalItems = this.orderHistory.reduce((sum, order) => sum + (parseInt(order.Total_Items) || 0), 0);
        
        if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
        if (totalQuotesEl) totalQuotesEl.textContent = quotes.length;
        if (totalItemsEl) totalItemsEl.textContent = totalItems;
    }

    setupHistoryFilters() {
        const statusFilter = document.getElementById('historyStatus');
        const supplierFilter = document.getElementById('historySupplier');
        const categoryFilter = document.getElementById('historyCategory');
        const refreshBtn = document.getElementById('refreshHistoryBtn');
        
        [statusFilter, supplierFilter, categoryFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => this.applyHistoryFilters());
            }
        });
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadOrderHistory());
        }
    }

    applyHistoryFilters() {
        const statusFilter = document.getElementById('historyStatus')?.value || '';
        const supplierFilter = document.getElementById('historySupplier')?.value || '';
        const categoryFilter = document.getElementById('historyCategory')?.value || '';
        
        let filteredOrders = this.orderHistory;
        
        if (statusFilter) {
            filteredOrders = filteredOrders.filter(order => order.Status === statusFilter);
        }
        
        if (supplierFilter) {
            filteredOrders = filteredOrders.filter(order => order.Supplier_Name === supplierFilter);
        }
        
        if (categoryFilter) {
            filteredOrders = filteredOrders.filter(order => order.Category === categoryFilter);
        }
        
        console.log(`🔍 Applied filters: ${filteredOrders.length} of ${this.orderHistory.length} orders`);
        this.populateOrderHistory(filteredOrders);
    }

    parseMaterialsList(materialsListString) {
        try {
            if (!materialsListString) return [];
            
            // Try to parse as JSON first
            if (materialsListString.startsWith('[') || materialsListString.startsWith('{')) {
                return JSON.parse(materialsListString);
            }
            
            // Fallback: split by comma and create simple objects
            return materialsListString.split(',').map(item => ({
                name: item.trim(),
                quantity: 1,
                unit: 'pcs'
            }));
        } catch (error) {
            console.warn('⚠️ Failed to parse materials list:', error);
            return [];
        }
    }

    showHistoryError(message) {
        const historyList = document.getElementById('historyList');
        if (historyList) {
            historyList.innerHTML = `
                <div class="no-history">
                    <div class="no-history-icon">❌</div>
                    <p style="color: var(--error-red);">Error loading history</p>
                    <p class="no-history-hint">${message}</p>
                    <button onclick="window.app.loadOrderHistory()" class="btn btn-primary" style="margin-top: 1rem;">
                        🔄 Try Again
                    </button>
                </div>
            `;
        }
    }

    // ===============================================
    // ENHANCED EVENT LISTENERS
    // ===============================================

    setupEventListeners() {
        try {
            console.log('⚙️ Setting up enhanced event listeners...');
            
            // PDF upload setup
            this.setupPdfUpload();
            
            // PDF mode handling
            this.setupPdfModeHandling();
            
            // History filters
            this.setupHistoryFilters();
            
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

            // Form submission
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
            
            console.log('✅ Enhanced event listeners setup complete');
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    // ===============================================
    // EXISTING METHODS WITH PDF SUPPORT
    // ===============================================

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

            console.log('📋 Populating enhanced form with data');

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

    validateForm() {
        try {
            const form = document.getElementById('materialForm');
            const submitBtn = document.getElementById('submitBtn');
            
            if (!form || !submitBtn) return;

            let isValid = true;
            const requiredFields = ['requestorName', 'requestorEmail'];

            // Check basic required fields
            for (const fieldName of requiredFields) {
                const field = form.querySelector(`[name="${fieldName}"]`);
                if (!field || !field.value.trim()) {
                    isValid = false;
                    break;
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

            // Mode-specific validation
            switch (this.currentPdfMode) {
                case 'with-order':
                    // Need both materials and PDF
                    if (this.selectedMaterials.length === 0) isValid = false;
                    if (!this.currentPdfFile) isValid = false;
                    // Need category and supplier
                    if (!form.querySelector('[name="category"]')?.value) isValid = false;
                    if (!form.querySelector('[name="supplier"]')?.value) isValid = false;
                    break;
                
                case 'pdf-only':
                    // Need only PDF and supplier info
                    if (!this.currentPdfFile) isValid = false;
                    // Still need category and supplier for email routing
                    if (!form.querySelector('[name="category"]')?.value) isValid = false;
                    if (!form.querySelector('[name="supplier"]')?.value) isValid = false;
                    break;
                
                case 'no-pdf':
                    // Traditional validation - need materials, category, supplier
                    if (this.selectedMaterials.length === 0) isValid = false;
                    if (!form.querySelector('[name="category"]')?.value) isValid = false;
                    if (!form.querySelector('[name="supplier"]')?.value) isValid = false;
                    break;
            }

            submitBtn.disabled = !isValid;
            
            // Update button text based on mode
            const btnText = submitBtn.querySelector('.btn-text');
            if (btnText) {
                const requestType = form.querySelector('input[name="requestType"]:checked')?.value || 'order';
                if (this.currentPdfMode === 'pdf-only') {
                    btnText.textContent = requestType === 'order' ? 'Review PDF Order' : 'Review PDF Quote';
                } else {
                    btnText.textContent = requestType === 'order' ? 'Review Order' : 'Review Quote Request';
                }
            }
            
        } catch (error) {
            console.error('❌ Error validating form:', error);
        }
    }

    // Enhanced form submission with PDF support
    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            
            // Prepare form data for confirmation
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add PDF mode and file data
            data.pdfMode = this.currentPdfMode;
            if (this.currentPdfFile) {
                data.pdfFile = this.currentPdfFile;
            }
            
            // Add selected materials (if applicable)
            if (this.currentPdfMode !== 'pdf-only') {
                data.materials = this.selectedMaterials;
            }
            
            // Get supplier details
            const supplierSelect = document.getElementById('supplier');
            const selectedOption = supplierSelect?.selectedOptions[0];
            if (selectedOption) {
                data.supplierEmail = selectedOption.dataset.email || '';
                data.supplierPhone = selectedOption.dataset.phone || '';
                data.supplierId = selectedOption.dataset.id || '';
            }
            
            console.log('📋 Enhanced form data prepared for confirmation:', data);
            
            // Store data for later submission
            this.pendingSubmissionData = data;
            
            // Show confirmation page
            this.showConfirmationPage(data);
            
        } catch (error) {
            console.error('❌ Form preparation error:', error);
            this.showError(`Error preparing form: ${error.message}`);
        }
    }

    // Enhanced confirmation page with PDF support
    showConfirmationPage(data) {
        try {
            console.log('📋 Displaying enhanced confirmation page');
            
            // Hide main form and show confirmation page
            const mainForm = document.getElementById('mainForm');
            const confirmationPage = document.getElementById('confirmationPage');
            
            if (mainForm) mainForm.style.display = 'none';
            if (confirmationPage) confirmationPage.style.display = 'block';
            
            // Update titles based on request type and mode
            const requestType = data.requestType;
            const confirmationTitle = document.getElementById('confirmationTitle');
            const confirmationSubtitle = document.getElementById('confirmationSubtitle');
            const confirmSubmitText = document.getElementById('confirmSubmitText');
            
            let titleText = 'Review Your Request';
            let subtitleText = 'Please review all details before sending to supplier';
            let submitText = 'Confirm & Send to Supplier';
            
            if (data.pdfMode === 'pdf-only') {
                titleText = requestType === 'order' ? 'Review Your PDF Order' : 'Review Your PDF Quote Request';
                subtitleText = 'PDF document will be sent to supplier for processing';
                submitText = requestType === 'order' ? 'Confirm & Send PDF Order' : 'Confirm & Send PDF Quote';
            } else if (requestType === 'order') {
                titleText = 'Review Your Order';
                submitText = 'Confirm & Send Order';
            } else {
                titleText = 'Review Your Quote Request';
                submitText = 'Confirm & Send Quote Request';
            }
            
            if (confirmationTitle) confirmationTitle.textContent = titleText;
            if (confirmationSubtitle) confirmationSubtitle.textContent = subtitleText;
            if (confirmSubmitText) confirmSubmitText.textContent = submitText;
            
            // Populate request summary
            this.populateElement('confirmRequestType', requestType === 'order' ? 'Material Order' : 'Quote Request');
            this.populateElement('confirmPdfMode', this.getPdfModeDisplay(data.pdfMode));
            this.populateElement('confirmCategory', data.category);
            this.populateElement('confirmUrgency', data.urgency, 'Normal');
            this.populateElement('confirmProjectRef', data.projectRef, 'Not specified');
            
            // Handle PDF information section
            const pdfInfoSection = document.getElementById('pdfInfoSection');
            if (data.pdfFile && pdfInfoSection) {
                pdfInfoSection.style.display = 'block';
                this.populateElement('confirmPdfName', data.pdfFile.name);
                this.populateElement('confirmPdfSize', this.formatFileSize(data.pdfFile.size));
            } else if (pdfInfoSection) {
                pdfInfoSection.style.display = 'none';
            }
            
            // Handle supplier information
            const supplierInfoSection = document.getElementById('supplierInfoSection');
            if (data.pdfMode === 'pdf-only' || data.supplier) {
                if (supplierInfoSection) supplierInfoSection.style.display = 'block';
                this.populateElement('confirmSupplierName', data.supplier);
                this.populateElement('confirmSupplierEmail', data.supplierEmail, 'Not available');
                this.populateElement('confirmSupplierPhone', data.supplierPhone, 'Not available');
            } else if (supplierInfoSection) {
                supplierInfoSection.style.display = 'none';
            }
            
            // Handle materials section
            const materialsConfirmSection = document.getElementById('materialsConfirmSection');
            if (data.pdfMode === 'pdf-only') {
                if (materialsConfirmSection) materialsConfirmSection.style.display = 'none';
            } else {
                if (materialsConfirmSection) materialsConfirmSection.style.display = 'block';
                this.populateConfirmationMaterials(data.materials);
            }
            
            // Populate requestor information
            this.populateElement('confirmRequestorName', data.requestorName);
            this.populateElement('confirmRequestorEmail', data.requestorEmail);
            
            // Handle special instructions
            const notesSection = document.getElementById('notesSection');
            if (data.notes && data.notes.trim()) {
                if (notesSection) notesSection.style.display = 'block';
                this.populateElement('confirmNotes', data.notes);
            } else if (notesSection) {
                notesSection.style.display = 'none';
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error showing enhanced confirmation page:', error);
            this.showError('Error displaying confirmation page: ' + error.message);
        }
    }

    getPdfModeDisplay(mode) {
        switch (mode) {
            case 'with-order': return '📦 Materials + PDF';
            case 'pdf-only': return '📄 PDF Only';
            case 'no-pdf': return '📋 Materials Only';
            default: return mode;
        }
    }

    // Enhanced submission with PDF support
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
            console.log('📤 Submitting enhanced request with PDF support:', data);
            
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
            console.log('✅ Enhanced submission result:', result);

            if (result.success !== false) {
                const type = requestType === 'order' ? 'order' : 'quote';
                const id = result.orderId || result.quoteId || result.id || `${type.toUpperCase()}-${Date.now()}`;
                this.showSuccess(type, id, data.supplier);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('❌ Enhanced submission error:', error);
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
    // EXISTING METHODS (MATERIALS HANDLING)
    // ===============================================

    handleRequestTypeChange() {
        try {
            const selectedType = document.querySelector('input[name="requestType"]:checked')?.value;
            const submitBtn = document.getElementById('submitBtn');
            const btnText = submitBtn?.querySelector('.btn-text');
            
            if (!selectedType || !submitBtn || !btnText) return;
            
            // Update button text based on both request type and PDF mode
            let buttonText = 'Review Request';
            if (this.currentPdfMode === 'pdf-only') {
                buttonText = selectedType === 'order' ? 'Review PDF Order' : 'Review PDF Quote';
            } else {
                buttonText = selectedType === 'order' ? 'Review Order' : 'Review Quote Request';
            }
            
            btnText.textContent = buttonText;
            
            if (selectedType === 'order') {
                submitBtn.style.background = 'linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-light) 100%)';
            } else {
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

            // Populate materials only if not in PDF-only mode
            if (selectedCategory && this.currentPdfMode !== 'pdf-only') {
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
            if (subcategoryGroup) {
                subcategoryGroup.style.display = 'block';
            }

            console.log(`📁 Found ${subcategories.length} subcategories for ${category}`);
            
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

            console.log(`🔍 Loading materials for Category: ${category}, Supplier ID: ${selectedSupplierId}, Subcategory: ${subcategory || 'All'}`);

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
            
            console.log(`📦 Final result: ${materials.length} materials for supplier ${selectedSupplierId}`);
            
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

            // Add event listeners
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
            if (existingIndex !== -1) {
                return;
            }

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
            if (subcategoryGroup) {
                subcategoryGroup.style.display = 'none';
            }
            if (subcategorySelect) {
                subcategorySelect.innerHTML = '<option value="">All subcategories</option>';
            }
            
            if (materialSearch) {
                materialSearch.value = '';
                materialSearch.disabled = true;
                materialSearch.placeholder = 'Select category and supplier first...';
            }
            
            if (materialsContainer) {
                materialsContainer.style.display = 'none';
            }

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
            if (supplierInfo) {
                supplierInfo.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Error hiding supplier info:', error);
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
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Error going back to edit:', error);
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
        
        const form = document.getElementById('materialForm');
        if (form) form.reset();
        
        if (window.app) {
            window.app.selectedMaterials = [];
            window.app.filteredMaterials = [];
            window.app.selectedSubcategory = '';
            window.app.pendingSubmissionData = null;
            window.app.currentPdfFile = null;
            window.app.currentPdfMode = 'with-order';
            window.app.renderSelectedMaterials();
            window.app.resetMaterialSelection();
            window.app.removePdfFile();
            window.app.validateForm();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('❌ Error resetting form:', error);
    }
}

// Initialize enhanced app
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌐 DOM Content Loaded - Starting Enhanced App with PDF & History');
        window.app = new EnhancedMaterialManagementApp();
        window.app.init();
    } catch (error) {
        console.error('❌ Error initializing enhanced app:', error);
    }
});

window.addEventListener('popstate', () => {
    location.reload();
});
