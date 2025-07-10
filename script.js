// Global variables
let currentEditingProduct = null;
let currentEditingCategory = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        showLoadingMessage();
        await dataAPI.initialize();
        setupEventListeners();
        loadCategoriesDropdown();
        
        // Wait a bit for DOM to be ready, then update dashboard
        setTimeout(async () => {
            await updateDashboard();
        }, 100);
        
        addDataManagementButtons();
        hideLoadingMessage();
        console.log('🚀 Application initialized successfully');
        
        // Show server status
        const isServerRunning = await dataAPI.checkServerStatus();
        if (isServerRunning) {
            console.log('🟢 JSON Server is running on http://localhost:3000');
        } else {
            console.log('🟡 Working in offline mode');
        }
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        hideLoadingMessage();
        showServerConnectionInfo();
    }
});

// Show loading message
function showLoadingMessage() {
    document.body.insertAdjacentHTML('afterbegin', `
        <div id="loading-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(102, 126, 234, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            color: white;
            font-size: 1.2em;
        ">
            <div style="text-align: center;">
                <div style="font-size: 3em; margin-bottom: 20px;">🏪</div>
                <div>Cargando Abarrotería...</div>
                <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">Inicializando datos</div>
            </div>
        </div>
    `);
}

// Hide loading message
function hideLoadingMessage() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show server connection info
function showServerConnectionInfo() {
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff9800;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 350px;
        font-size: 14px;
    `;
    
    infoDiv.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 20px; margin-right: 8px;">⚠️</span>
            <strong>Servidor JSON no conectado</strong>
        </div>
        <div style="margin-bottom: 10px;">
            Para usar todas las funciones, ejecuta:
            <div style="background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; margin-top: 5px; font-family: monospace; font-size: 12px;">
                json-server --watch data/db.json --port 3000
            </div>
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
            Trabajando en modo offline con datos por defecto.
        </div>
        <button onclick="this.parentElement.remove()" style="
            position: absolute;
            top: 5px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
        ">×</button>
    `;
    
    document.body.appendChild(infoDiv);
    
    // Auto hide after 10 seconds
    setTimeout(() => {
        if (infoDiv.parentElement) {
            infoDiv.remove();
        }
    }, 10000);
}

// Show specific view
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewName);
    if (targetView) {
        targetView.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find and activate the correct button
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(viewName)) {
                btn.classList.add('active');
            }
        });
    }
    
    // Load data for specific views
    setTimeout(async () => {
        switch(viewName) {
            case 'products':
                loadProductsView();
                break;
            case 'categories':
                loadCategoriesView();
                break;
            case 'dashboard':
                await updateDashboard();
                break;
            case 'add-product':
                if (!currentEditingProduct) {
                    resetProductForm();
                }
                break;
            case 'add-category':
                if (!currentEditingCategory) {
                    resetCategoryForm();
                }
                break;
        }
    }, 50);
}

// Load categories into dropdowns
function loadCategoriesDropdown() {
    const categorySelect = document.getElementById('product-category');
    const filterSelect = document.getElementById('filter-category');
    
    // Clear existing options
    categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    filterSelect.innerHTML = '<option value="">Todas las categorías</option>';
    
    const categories = dataAPI.getCategories();
    categories.forEach(category => {
        const option1 = document.createElement('option');
        option1.value = category.id;
        option1.textContent = category.name;
        categorySelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = category.id;
        option2.textContent = category.name;
        filterSelect.appendChild(option2);
    });
}

// Load subcategories based on selected category
function loadSubcategories(categoryId) {
    const subcategorySelect = document.getElementById('product-subcategory');
    subcategorySelect.innerHTML = '<option value="">Seleccionar subcategoría</option>';
    
    if (categoryId) {
        const category = dataAPI.getCategoryById(categoryId);
        if (category && category.subcategories) {
            category.subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory;
                option.textContent = subcategory;
                subcategorySelect.appendChild(option);
            });
        }
    }
}

// Setup event listeners
// Setup event listeners
function setupEventListeners() {
    // Category change listener
    document.getElementById('product-category').addEventListener('change', function() {
        loadSubcategories(this.value);
    });

    // Product form submission
    document.getElementById('product-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveProduct();
    });

    // Category form submission
    document.getElementById('category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveCategory();
    });

    // Price calculation helper
    document.getElementById('product-buy-price').addEventListener('input', calculateMargin);
    document.getElementById('product-sell-price').addEventListener('input', calculateMargin);
    
    // Search functionality - AGREGAR ESTO SI NO ESTÁ
    const searchInput = document.getElementById('search-products');
    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
        searchInput.addEventListener('keyup', searchProducts);
    }
    
    const filterSelect = document.getElementById('filter-category');
    if (filterSelect) {
        filterSelect.addEventListener('change', filterProducts);
    }
}

// Calculate profit margin
function calculateMargin() {
    const buyPrice = parseFloat(document.getElementById('product-buy-price').value) || 0;
    const sellPrice = parseFloat(document.getElementById('product-sell-price').value) || 0;
    
    if (buyPrice > 0 && sellPrice > 0) {
        const margin = ((sellPrice - buyPrice) / buyPrice * 100).toFixed(2);
        const profit = (sellPrice - buyPrice).toFixed(2);
        
        console.log(`Margen: ${margin}%, Ganancia: Q${profit}`);
    }
}

// Save product
function saveProduct() {
    const productData = {
        name: document.getElementById('product-name').value.trim(),
        category: document.getElementById('product-category').value,
        subcategory: document.getElementById('product-subcategory').value,
        buyPrice: parseFloat(document.getElementById('product-buy-price').value),
        sellPrice: parseFloat(document.getElementById('product-sell-price').value),
        supplier: document.getElementById('product-supplier').value,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        image: document.getElementById('product-image').value.trim(),
        description: document.getElementById('product-description').value.trim()
    };

    // Validate using API
    const errors = dataAPI.validateProduct(productData);
    if (errors.length > 0) {
        showMessage('product-message', errors.join('<br>'), 'error');
        return;
    }

    try {
        if (currentEditingProduct) {
            // Update existing product
            dataAPI.updateProduct(currentEditingProduct.id, productData);
            showMessage('product-message', 'Producto actualizado exitosamente', 'success');
        } else {
            // Add new product
            dataAPI.addProduct(productData);
            showMessage('product-message', 'Producto agregado exitosamente', 'success');
        }

        resetProductForm();
        updateDashboard();
        
        // Refresh products view if it's currently active
        if (document.getElementById('products').classList.contains('active')) {
            loadProductsView();
        }
    } catch (error) {
        showMessage('product-message', 'Error al guardar el producto: ' + error.message, 'error');
    }
}

// Save category
function saveCategory() {
    const categoryData = {
        name: document.getElementById('category-name').value.trim(),
        description: document.getElementById('category-description').value.trim(),
        subcategories: document.getElementById('category-subcategories').value
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
    };

    // Validate using API
    const errors = dataAPI.validateCategory(categoryData);
    if (errors.length > 0) {
        showMessage('category-message', errors.join('<br>'), 'error');
        return;
    }

    // Check uniqueness
    if (!dataAPI.isCategoryNameUnique(categoryData.name, currentEditingCategory?.id)) {
        showMessage('category-message', 'Ya existe una categoría con ese nombre', 'error');
        return;
    }

    try {
        if (currentEditingCategory) {
            // Update existing category
            dataAPI.updateCategory(currentEditingCategory.id, categoryData);
            showMessage('category-message', 'Categoría actualizada exitosamente', 'success');
        } else {
            // Add new category
            dataAPI.addCategory(categoryData);
            showMessage('category-message', 'Categoría agregada exitosamente', 'success');
        }

        loadCategoriesDropdown();
        resetCategoryForm();
        
        // Refresh categories view if it's currently active
        if (document.getElementById('categories').classList.contains('active')) {
            loadCategoriesView();
        }
    } catch (error) {
        showMessage('category-message', 'Error al guardar la categoría: ' + error.message, 'error');
    }
}

// Reset product form
function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-subcategory').innerHTML = '<option value="">Seleccionar subcategoría</option>';
    document.getElementById('product-form-title').textContent = '➕ Agregar Producto';
    document.getElementById('save-product-btn').textContent = '💾 Guardar Producto';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    currentEditingProduct = null;
    clearMessage('product-message');
}

// Reset category form
function resetCategoryForm() {
    document.getElementById('category-form').reset();
    document.getElementById('category-form-title').textContent = '➕ Agregar Categoría';
    document.getElementById('save-category-btn').textContent = '💾 Guardar Categoría';
    document.getElementById('cancel-category-edit-btn').style.display = 'none';
    currentEditingCategory = null;
    clearMessage('category-message');
}

// Cancel edit operations
function cancelEdit() {
    resetProductForm();
    showView('products');
}

function cancelCategoryEdit() {
    resetCategoryForm();
    showView('categories');
}

// Load products view
function loadProductsView() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const products = dataAPI.getProducts();
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>📦 No hay productos</h3>
                <p>Comienza agregando tu primer producto</p>
                <button class="btn btn-success" onclick="showView('add-product')">➕ Agregar Producto</button>
            </div>
        `;
        return;
    }

    displayFilteredProducts(products);
}

// Display filtered products
function displayFilteredProducts(filteredProducts) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>🔍 No se encontraron productos</h3><p>Intenta con otros términos de búsqueda</p></div>';
        return;
    }

    filteredProducts.forEach(product => {
        const categoryName = dataAPI.getCategoryById(product.category)?.name || 'Sin categoría';
        const card = createProductCard(product, categoryName);
        grid.appendChild(card);
    });
}

// Create product card
function createProductCard(product, categoryName) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const imageHtml = product.image ? 
        `<img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">` : 
        '';

    const profit = (product.sellPrice - product.buyPrice).toFixed(2);
    const margin = ((product.sellPrice - product.buyPrice) / product.buyPrice * 100).toFixed(1);
    const stockStatus = product.stock < 10 ? 'style="color: #e74c3c; font-weight: bold;"' : '';

    card.innerHTML = `
        ${imageHtml}
        <h3>${product.name}</h3>
        <p><strong>Categoría:</strong> ${categoryName}</p>
        ${product.subcategory ? `<p><strong>Subcategoría:</strong> ${product.subcategory}</p>` : ''}
        <p><strong>Proveedor:</strong> ${product.supplier}</p>
        <p ${stockStatus}><strong>Stock:</strong> ${product.stock} unidades</p>
        <p><strong>Precio Compra:</strong> Q${product.buyPrice.toFixed(2)}</p>
        <p class="price">Precio Venta: Q${product.sellPrice.toFixed(2)}</p>
        <p><strong>Ganancia:</strong> Q${profit} (${margin}%)</p>
        ${product.description ? `<p><strong>Descripción:</strong> ${product.description}</p>` : ''}
        <div class="actions">
            <button class="btn" onclick="editProduct('${product.id}')">✏️ Editar</button>
            <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">🗑️ Eliminar</button>
        </div>
    `;
    
    return card;
}

// Edit product
function editProduct(id) {
    const product = dataAPI.getProductById(id);
    if (!product) return;

    currentEditingProduct = product;
    
    // Update form title and button
    document.getElementById('product-form-title').textContent = '✏️ Editar Producto';
    document.getElementById('save-product-btn').textContent = '💾 Actualizar Producto';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';
    
    // Fill form with product data
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    loadSubcategories(product.category);
    
    // Wait for subcategories to load
    setTimeout(() => {
        document.getElementById('product-subcategory').value = product.subcategory || '';
    }, 100);
    
    document.getElementById('product-buy-price').value = product.buyPrice;
    document.getElementById('product-sell-price').value = product.sellPrice;
    document.getElementById('product-supplier').value = product.supplier;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-description').value = product.description || '';
    
    // Switch to add-product view
    showView('add-product');
}

// Delete product
function deleteProduct(id) {
    const product = dataAPI.getProductById(id);
    if (!product) return;

    if (confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) {
        try {
            dataAPI.deleteProduct(id);
            loadProductsView();
            updateDashboard();
            showMessage('product-message', 'Producto eliminado exitosamente', 'success');
        } catch (error) {
            showMessage('product-message', 'Error al eliminar el producto: ' + error.message, 'error');
        }
    }
}

// Load categories view
function loadCategoriesView() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    const categories = dataAPI.getCategories();
    if (categories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <h3>📂 No hay categorías</h3>
                <p>Comienza agregando tu primera categoría</p>
                <button class="btn btn-success" onclick="showView('add-category')">➕ Agregar Categoría</button>
            </div>
        `;
        return;
    }

    categories.forEach(category => {
        const card = createCategoryCard(category);
        grid.appendChild(card);
    });
}

// Create category card
function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const subcategoriesHtml = category.subcategories && category.subcategories.length > 0 ?
        `<p><strong>Subcategorías:</strong> ${category.subcategories.join(', ')}</p>` : '';

    const productsCount = dataAPI.getProductsByCategory(category.id).length;

    card.innerHTML = `
        <h3>${category.name}</h3>
        ${category.description ? `<p><strong>Descripción:</strong> ${category.description}</p>` : ''}
        <p><strong>Productos:</strong> ${productsCount}</p>
        ${subcategoriesHtml}
        <div class="actions">
            <button class="btn" onclick="editCategory('${category.id}')">✏️ Editar</button>
            <button class="btn btn-danger" onclick="deleteCategory('${category.id}')">🗑️ Eliminar</button>
        </div>
    `;
    
    return card;
}

// Edit category
function editCategory(id) {
    const category = dataAPI.getCategoryById(id);
    if (!category) return;

    currentEditingCategory = category;
    
    // Update form title and button
    document.getElementById('category-form-title').textContent = '✏️ Editar Categoría';
    document.getElementById('save-category-btn').textContent = '💾 Actualizar Categoría';
    document.getElementById('cancel-category-edit-btn').style.display = 'inline-block';
    
    // Fill form with category data
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';
    document.getElementById('category-subcategories').value = category.subcategories ? category.subcategories.join(', ') : '';
    
    // Switch to add-category view
    showView('add-category');
}

// Delete category
function deleteCategory(id) {
    const category = dataAPI.getCategoryById(id);
    if (!category) return;

    try {
        if (confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`)) {
            dataAPI.deleteCategory(id);
            loadCategoriesDropdown();
            loadCategoriesView();
            updateDashboard();
            showMessage('category-message', 'Categoría eliminada exitosamente', 'success');
        }
    } catch (error) {
        alert(error.message);
    }
}

// Update dashboard
async function updateDashboard() {
    try {
        console.log('🔄 Updating dashboard...');
        
        // Check if dataAPI is ready
        if (!dataAPI.isInitialized) {
            console.log('⚠️ DataAPI not initialized yet');
            return;
        }
        
        const stats = dataAPI.getStatistics();
        console.log('📊 Stats:', stats);
        
        // Update stats with error handling
        const totalProductsEl = document.getElementById('total-products');
        const totalCategoriesEl = document.getElementById('total-categories');
        const totalValueEl = document.getElementById('total-value');
        const lowStockEl = document.getElementById('low-stock');
        
        console.log('🔍 Elements found:', {
            totalProductsEl: !!totalProductsEl,
            totalCategoriesEl: !!totalCategoriesEl,
            totalValueEl: !!totalValueEl,
            lowStockEl: !!lowStockEl
        });
        
        if (totalProductsEl) {
            totalProductsEl.textContent = stats.totalProducts;
            console.log('✅ Updated total products:', stats.totalProducts);
        } else {
            console.error('❌ Element total-products not found');
        }
        
        if (totalCategoriesEl) {
            totalCategoriesEl.textContent = stats.totalCategories;
            console.log('✅ Updated total categories:', stats.totalCategories);
        } else {
            console.error('❌ Element total-categories not found');
        }
        
        if (totalValueEl) {
            const formattedValue = `Q${stats.totalValue.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`;
            totalValueEl.textContent = formattedValue;
            console.log('✅ Updated total value:', formattedValue);
        } else {
            console.error('❌ Element total-value not found');
        }
        
        if (lowStockEl) {
            lowStockEl.textContent = stats.lowStock;
            console.log('✅ Updated low stock:', stats.lowStock);
        } else {
            console.error('❌ Element low-stock not found');
        }
        
        // Add server status indicator
        await addServerStatusIndicator();
        
        // Show recent products
        const recentProducts = dataAPI.getRecentProducts();
        const recentGrid = document.getElementById('recent-products-grid');
        
        if (recentGrid) {
            recentGrid.innerHTML = '';
            
            if (recentProducts.length === 0) {
                recentGrid.innerHTML = '<div class="empty-state"><h3>📦 No hay productos recientes</h3><p>Agrega algunos productos para verlos aquí</p></div>';
                console.log('📦 No recent products to display');
                return;
            }
            
            recentProducts.forEach(product => {
                try {
                    const categoryName = dataAPI.getCategoryById(product.category)?.name || 'Sin categoría';
                    const card = createProductCard(product, categoryName);
                    recentGrid.appendChild(card);
                } catch (error) {
                    console.error('Error creating product card:', error);
                }
            });
            
            console.log('✅ Recent products displayed:', recentProducts.length);
        } else {
            console.error('❌ Element recent-products-grid not found');
        }
        
        console.log('✅ Dashboard updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating dashboard:', error);
        // Show fallback content
        const recentGrid = document.getElementById('recent-products-grid');
        if (recentGrid) {
            recentGrid.innerHTML = '<div class="empty-state"><h3>⚠️ Error cargando datos</h3><p>Intenta recargar la página</p></div>';
        }
    }
}

// Add server status indicator
async function addServerStatusIndicator() {
    const existingIndicator = document.getElementById('server-status');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const isServerRunning = await dataAPI.checkServerStatus();
    const header = document.querySelector('.header');
    
    const statusDiv = document.createElement('div');
    statusDiv.id = 'server-status';
    statusDiv.style.cssText = `
        margin-top: 10px;
        padding: 8px 15px;
        border-radius: 20px;
        font-size: 0.9em;
        display: inline-block;
    `;
    
    if (isServerRunning) {
        statusDiv.style.background = 'rgba(46, 125, 50, 0.3)';
        statusDiv.innerHTML = '🟢 Conectado a JSON Server';
    } else {
        statusDiv.style.background = 'rgba(255, 152, 0, 0.3)';
        statusDiv.innerHTML = '🟡 Modo Offline';
    }
    
    header.appendChild(statusDiv);
}

// Search products
function searchProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase().trim();
    const categoryFilter = document.getElementById('filter-category').value;
    
    console.log('🔍 Searching for:', searchTerm, 'Category:', categoryFilter); // Debug
    
    let filteredProducts = dataAPI.getProducts();
    console.log('📦 Total products before filter:', filteredProducts.length); // Debug
    
    // Apply search filter
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(searchTerm);
            const descMatch = product.description?.toLowerCase().includes(searchTerm) || false;
            const supplierMatch = product.supplier?.toLowerCase().includes(searchTerm) || false;
            const categoryName = dataAPI.getCategoryById(product.category)?.name?.toLowerCase() || '';
            const categoryMatch = categoryName.includes(searchTerm);
            
            return nameMatch || descMatch || supplierMatch || categoryMatch;
        });
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category == categoryFilter);
    }
    
    console.log('🎯 Filtered products:', filteredProducts.length); // Debug
    displayFilteredProducts(filteredProducts);
}

// Filter products by category
function filterProducts() {
    searchProducts(); // Use the same function for consistency
}

// Show message
function showMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="message ${type}">${message}</div>`;
    
    // Clear message after 5 seconds
    setTimeout(() => {
        clearMessage(containerId);
    }, 5000);
}

// Clear message
function clearMessage(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
}

// Export data to JSON
function exportData() {
    const data = dataAPI.exportData();
    dataAPI.downloadJSON(data, `abarroteria_backup_${new Date().toISOString().split('T')[0]}.json`);
    alert('Datos exportados exitosamente');
}

// Import data from JSON
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (confirm('¿Deseas importar los datos? Esto reemplazará todos los datos actuales.')) {
                        dataAPI.importData(data);
                        loadCategoriesDropdown();
                        updateDashboard();
                        alert('Datos importados exitosamente');
                        
                        // Refresh current view
                        const activeView = document.querySelector('.view.active');
                        if (activeView) {
                            const viewId = activeView.id;
                            if (viewId === 'products') loadProductsView();
                            if (viewId === 'categories') loadCategoriesView();
                        }
                    }
                } catch (error) {
                    alert('Error al leer el archivo JSON. Verifica que el formato sea correcto.');
                    console.error('Import error:', error);
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// Manual save functions
function saveDataToFiles() {
    if (confirm('¿Deseas descargar la base de datos actual?')) {
        dataAPI.saveDatabaseToFile();
    }
}

// Create backup
function createBackup() {
    if (confirm('¿Deseas crear un respaldo completo?')) {
        dataAPI.saveBackup();
    }
}

// Add data management buttons to navigation
function addDataManagementButtons() {
    const nav = document.querySelector('.nav');
    
    const exportBtn = document.createElement('button');
    exportBtn.className = 'nav-btn';
    exportBtn.innerHTML = '📤 Exportar';
    exportBtn.onclick = exportData;
    exportBtn.title = 'Exportar datos completos';
    nav.appendChild(exportBtn);
    
    const importBtn = document.createElement('button');
    importBtn.className = 'nav-btn';
    importBtn.innerHTML = '📥 Importar';
    importBtn.onclick = importData;
    importBtn.title = 'Importar datos desde archivo';
    nav.appendChild(importBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'nav-btn';
    saveBtn.innerHTML = '💾 Guardar DB';
    saveBtn.onclick = saveDataToFiles;
    saveBtn.title = 'Descargar base de datos actual';
    nav.appendChild(saveBtn);

    const backupBtn = document.createElement('button');
    backupBtn.className = 'nav-btn';
    backupBtn.innerHTML = '🔄 Backup';
    backupBtn.onclick = createBackup;
    backupBtn.title = 'Crear respaldo con timestamp';
    nav.appendChild(backupBtn);
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-GT');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save current form
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        
        const activeView = document.querySelector('.view.active');
        if (activeView) {
            const formId = activeView.querySelector('form')?.id;
            if (formId === 'product-form') {
                saveProduct();
            } else if (formId === 'category-form') {
                saveCategory();
            }
        }
    }
    
    // Escape to cancel edit
    if (e.key === 'Escape') {
        if (currentEditingProduct) {
            cancelEdit();
        } else if (currentEditingCategory) {
            cancelCategoryEdit();
        }
    }
})