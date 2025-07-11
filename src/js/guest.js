// guest.js - Guest functionality for product catalog and ordering
class GuestManager {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.currentView = 'catalog';
        this.selectedProduct = null;
        this.processingOrder = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize API
            await dataAPI.initialize();
            
            // Load data
            await this.loadData();
            
            // Setup UI
            this.setupEventListeners();
            this.loadCategoriesFilter();
            this.displayProducts();
            this.updateCartDisplay();
            
            console.log('✅ Guest Manager initialized');
        } catch (error) {
            console.error('❌ Error initializing guest manager:', error);
        }
    }

    async loadData() {
        this.products = dataAPI.getProducts();
        this.categories = dataAPI.getCategories();
        console.log(`📦 Loaded ${this.products.length} products`);
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-products');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.searchProducts());
        }

        // Category filter
        const categoryFilter = document.getElementById('filter-category');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterProducts());
        }

        // Sort functionality
        const sortSelect = document.getElementById('sort-products');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.sortProducts());
        }

        // Checkout form validation
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('input', () => this.validateCheckoutForm());
        }
    }

    // ========== PRODUCT DISPLAY ==========

    loadCategoriesFilter() {
        const filterSelect = document.getElementById('filter-category');
        if (!filterSelect) return;

        filterSelect.innerHTML = '<option value="">Todas las categorías</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterSelect.appendChild(option);
        });
    }

    displayProducts(productsToShow = null) {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        const products = productsToShow || this.products;
        
        if (products.length === 0) {
            productsGrid.innerHTML = '<div class="empty-state"><h3>No se encontraron productos</h3></div>';
            return;
        }

        productsGrid.innerHTML = products.map(product => this.createProductCard(product)).join('');
    }

    createProductCard(product) {
        const category = this.categories.find(cat => cat.id === product.category);
        const categoryName = category ? category.name : 'Sin categoría';
        const imageUrl = product.image || 'https://images.unsplash.com/photo-1586380951230-d3be9b34b8f5?w=300&h=300&fit=crop';
        const stockStatus = product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock';
        const stockClass = product.stock > 0 ? '' : 'out-of-stock';

        return `
            <div class="product-card ${stockClass}" onclick="showProductModal('${product.id}')">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1586380951230-d3be9b34b8f5?w=300&h=300&fit=crop'">
                <h4>${product.name}</h4>
                <p class="category">${categoryName}</p>
                <div class="price">Q${product.sellPrice.toFixed(2)}</div>
                <div class="stock">${stockStatus}</div>
                ${product.stock > 0 ? 
                    `<button class="add-btn" onclick="event.stopPropagation(); quickAddToCart('${product.id}')">🛒 Agregar al Carrito</button>` : 
                    '<button class="add-btn" disabled>Sin Stock</button>'
                }
            </div>
        `;
    }

    searchProducts() {
        const searchTerm = document.getElementById('search-products').value.toLowerCase();
        const categoryFilter = document.getElementById('filter-category').value;
        
        let filtered = this.products;

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }

        this.displayProducts(filtered);
    }

    filterProducts() {
        this.searchProducts(); // Reuse search logic
    }

    sortProducts() {
        const sortType = document.getElementById('sort-products').value;
        
        // Get current filtered products
        let products = [...this.products];
        const searchTerm = document.getElementById('search-products').value.toLowerCase();
        const categoryFilter = document.getElementById('filter-category').value;

        if (searchTerm) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            products = products.filter(product => product.category === categoryFilter);
        }

        // Sort products
        switch (sortType) {
            case 'name':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'price-low':
                products.sort((a, b) => a.sellPrice - b.sellPrice);
                break;
            case 'price-high':
                products.sort((a, b) => b.sellPrice - a.sellPrice);
                break;
            case 'stock':
                products.sort((a, b) => b.stock - a.stock);
                break;
        }

        this.displayProducts(products);
    }

    // ========== PRODUCT MODAL ==========

    showProductModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.selectedProduct = product;
        const imageUrl = product.image || 'https://images.unsplash.com/photo-1586380951230-d3be9b34b8f5?w=300&h=300&fit=crop';

        document.getElementById('modal-product-name').textContent = product.name;
        const modalImage = document.getElementById('modal-product-image');
        modalImage.src = imageUrl;
        modalImage.onerror = function() {
            this.src = 'https://images.unsplash.com/photo-1586380951230-d3be9b34b8f5?w=300&h=300&fit=crop';
        };
        document.getElementById('modal-product-price').textContent = product.sellPrice.toFixed(2);
        document.getElementById('modal-product-stock').textContent = product.stock;
        document.getElementById('modal-product-description').textContent = product.description || 'Sin descripción';

        // Reset quantity
        const quantityInput = document.getElementById('modal-quantity');
        quantityInput.value = 1;
        quantityInput.max = product.stock;

        // Enable/disable add button
        const addButton = document.getElementById('add-to-cart-btn');
        addButton.disabled = product.stock === 0;

        document.getElementById('product-modal').style.display = 'block';
    }

    closeProductModal() {
        document.getElementById('product-modal').style.display = 'none';
        this.selectedProduct = null;
    }

    changeQuantity(change) {
        const quantityInput = document.getElementById('modal-quantity');
        const currentValue = parseInt(quantityInput.value);
        const newValue = currentValue + change;
        
        if (newValue >= 1 && newValue <= this.selectedProduct.stock) {
            quantityInput.value = newValue;
        }
    }

    // ========== CART MANAGEMENT ==========

    quickAddToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product || product.stock === 0) return;

        this.addToCart(product, 1);
    }

    addToCartFromModal() {
        if (!this.selectedProduct) return;

        const quantity = parseInt(document.getElementById('modal-quantity').value);
        this.addToCart(this.selectedProduct, quantity);
        this.closeProductModal();
    }

    addToCart(product, quantity) {
        const existingItem = this.cart.find(item => item.id === product.id);

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity <= product.stock) {
                existingItem.quantity = newQuantity;
                this.showMessage(`${product.name} actualizado en el carrito`, 'success');
            } else {
                this.showMessage(`No hay suficiente stock disponible`, 'error');
                return;
            }
        } else {
            if (quantity <= product.stock) {
                this.cart.push({
                    ...product,
                    quantity: quantity
                });
                this.showMessage(`${product.name} agregado al carrito`, 'success');
            } else {
                this.showMessage(`No hay suficiente stock disponible`, 'error');
                return;
            }
        }

        this.updateCartDisplay();
        this.saveCartToStorage();
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartDisplay();
        this.saveCartToStorage();
        this.showMessage('Producto eliminado del carrito', 'success');
    }

    updateCartQuantity(productId, newQuantity) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        const product = this.products.find(p => p.id === productId);
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }

        if (newQuantity <= product.stock) {
            item.quantity = newQuantity;
            this.updateCartDisplay();
            this.saveCartToStorage();
        } else {
            this.showMessage(`Solo hay ${product.stock} unidades disponibles`, 'error');
        }
    }

    clearCart() {
        if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            this.cart = [];
            this.updateCartDisplay();
            this.saveCartToStorage();
            this.showMessage('Carrito vaciado', 'success');
        }
    }

    updateCartDisplay() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartSummary = document.getElementById('cart-summary');
        const emptyCart = document.getElementById('empty-cart');
        const totalAmount = document.getElementById('total-amount');

        // Update cart count
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '';
            cartSummary.style.display = 'none';
            emptyCart.style.display = 'block';
            return;
        }

        emptyCart.style.display = 'none';
        cartSummary.style.display = 'block';

        // Display cart items
        cartItems.innerHTML = this.cart.map(item => this.createCartItemHTML(item)).join('');

        // Calculate total
        const total = this.cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
        totalAmount.textContent = total.toFixed(2);
    }

    createCartItemHTML(item) {
        const imageUrl = item.image || 'https://images.unsplash.com/photo-1586380951230-d3be9b34b8f5?w=60&h=60&fit=crop';

        return `
            <div class="cart-item">
                <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1586380951230-d3be9b34b8f5?w=60&h=60&fit=crop'">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <div class="price">Q${item.sellPrice.toFixed(2)} c/u</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <input type="number" value="${item.quantity}" min="1" max="${item.stock}" 
                               onchange="updateCartQuantity('${item.id}', parseInt(this.value))">
                        <button onclick="updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            </div>
        `;
    }

    saveCartToStorage() {
        localStorage.setItem('guestCart', JSON.stringify(this.cart));
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('guestCart');
        if (savedCart) {
            this.cart = JSON.parse(savedCart);
            this.updateCartDisplay();
        }
    }

    // ========== CHECKOUT PROCESS ==========

    proceedToCheckout() {
        if (this.cart.length === 0) {
            this.showMessage('Tu carrito está vacío', 'error');
            return;
        }

        this.showView('checkout');
        this.updateOrderSummary();
        document.getElementById('checkout-nav').style.display = 'block';
    }

    updateOrderSummary() {
        const orderSummary = document.getElementById('order-summary');
        if (!orderSummary) return;

        const total = this.cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);

        const itemsHTML = this.cart.map(item => `
            <div class="summary-item">
                <span>${item.name} (x${item.quantity})</span>
                <span>Q${(item.sellPrice * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        orderSummary.innerHTML = `
            ${itemsHTML}
            <div class="summary-item">
                <span><strong>Total:</strong></span>
                <span><strong>Q${total.toFixed(2)}</strong></span>
            </div>
        `;
    }

    validateCheckoutForm() {
        const name = document.getElementById('customer-name').value.trim();
        const lastname = document.getElementById('customer-lastname').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const cluster = document.getElementById('delivery-cluster').value;
        const address = document.getElementById('delivery-address').value.trim();

        const completeButton = document.getElementById('complete-order-btn');
        const isValid = name && lastname && phone && cluster && address;

        completeButton.disabled = !isValid;
        return isValid;
    }

    // ========== COMPLETE ORDER ==========
    async completeOrder() {
        // Prevenir múltiples clics
        if (this.processingOrder) {
            return;
        }

        if (!this.validateCheckoutForm()) {
            this.showMessage('Por favor completa todos los campos requeridos', 'error');
            return;
        }

        if (this.cart.length === 0) {
            this.showMessage('El carrito está vacío', 'error');
            return;
        }

        const orderData = {
            customer: {
                name: document.getElementById('customer-name').value.trim(),
                lastname: document.getElementById('customer-lastname').value.trim(),
                phone: document.getElementById('customer-phone').value.trim(),
                fullName: `${document.getElementById('customer-name').value.trim()} ${document.getElementById('customer-lastname').value.trim()}`
            },
            delivery: {
                cluster: document.getElementById('delivery-cluster').value,
                colony: document.getElementById('delivery-colony').value,
                address: document.getElementById('delivery-address').value.trim()
            },
            items: this.cart.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                unitPrice: item.sellPrice,
                totalPrice: item.sellPrice * item.quantity
            })),
            total: this.cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0),
            paymentMethod: 'contra_entrega',
            notes: document.getElementById('order-notes').value.trim(),
            customerType: 'guest'
        };

        try {
            // Marcar como procesando
            this.processingOrder = true;

            // Deshabilitar botón y mostrar loading
            const completeButton = document.getElementById('complete-order-btn');
            completeButton.disabled = true;
            completeButton.textContent = 'Procesando...';

            // Create order
            const order = await dataAPI.createOrder(orderData);

            // Limpiar carrito INMEDIATAMENTE después de crear el pedido
            this.cart = [];
            this.saveCartToStorage();
            this.updateCartDisplay();

            // Ocultar la navegación de checkout
            document.getElementById('checkout-nav').style.display = 'none';

            // Show confirmation modal
            this.showOrderConfirmation(order);

            // Limpiar formulario
            document.getElementById('checkout-form').reset();
            document.getElementById('delivery-colony').value = 'Jardines del Edén';

            this.showMessage('¡Pedido creado exitosamente!', 'success');

        } catch (error) {
            console.error('❌ Error creating order:', error);
            this.showMessage('Error al procesar el pedido. Intenta nuevamente.', 'error');
        } finally {
            // Resetear estado SIEMPRE
            this.processingOrder = false;
            
            // Reset button
            const completeButton = document.getElementById('complete-order-btn');
            completeButton.disabled = false;
            completeButton.textContent = '✅ Completar Pedido';
        }
    }

    // ========== MOSTRAR TICKET EN MODAL ==========
    showOrderConfirmation(order) {
        // Llenar información del ticket
        document.getElementById('ticket-order-number').textContent = order.id;
        document.getElementById('ticket-date').textContent = new Date().toLocaleString('es-GT');
        document.getElementById('ticket-customer-name').textContent = order.customer.fullName;
        document.getElementById('ticket-customer-phone').textContent = order.customer.phone;
        document.getElementById('ticket-customer-address').textContent = 
            `${order.delivery.address}, ${order.delivery.cluster}, ${order.delivery.colony}`;
        document.getElementById('ticket-total').textContent = order.total.toFixed(2);

        // Llenar lista de productos
        const itemsList = document.getElementById('ticket-items-list');
        itemsList.innerHTML = order.items.map(item => `
            <div class="table-row">
                <span>${item.productName}</span>
                <span>${item.quantity}</span>
                <span>Q${item.unitPrice.toFixed(2)}</span>
                <span>Q${item.totalPrice.toFixed(2)}</span>
            </div>
        `).join('');

        // Mostrar el modal
        document.getElementById('order-confirmation-modal').style.display = 'block';
    }

    // ========== CERRAR MODAL DEL TICKET ==========
    closeTicketModal() {
        document.getElementById('order-confirmation-modal').style.display = 'none';
    }

    // ========== START NEW ORDER ==========
    startNewOrder() {
        // Cerrar modal
        this.closeTicketModal();
        
        // Ir al catálogo
        this.showView('catalog');
        
        // Asegurar que el carrito esté vacío y actualizado
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        
        // Reset form completo
        document.getElementById('checkout-form').reset();
        document.getElementById('delivery-colony').value = 'Jardines del Edén';
        
        // Ocultar navegación de checkout
        document.getElementById('checkout-nav').style.display = 'none';
        
        // Resetear estado de procesamiento
        this.processingOrder = false;
        
        this.showMessage('¡Listo para un nuevo pedido!', 'success');
    }

    // ========== DESCARGAR/GUARDAR TICKET ==========
    downloadTicket() {
        if (navigator.share) {
            // Si el dispositivo soporta Web Share API
            const ticketText = this.generateTicketText();
            navigator.share({
                title: 'Ticket de Compra - Abarrotería Jardines del Edén',
                text: ticketText
            }).catch(console.error);
        } else {
            // Fallback: abrir ventana de impresión
            window.print();
        }
    }

    // ========== GENERAR TEXTO DEL TICKET ==========
    generateTicketText() {
        const orderNumber = document.getElementById('ticket-order-number').textContent;
        const customerName = document.getElementById('ticket-customer-name').textContent;
        const customerPhone = document.getElementById('ticket-customer-phone').textContent;
        const customerAddress = document.getElementById('ticket-customer-address').textContent;
        const total = document.getElementById('ticket-total').textContent;
        const date = document.getElementById('ticket-date').textContent;

        let ticketText = `
🎫 TICKET DE COMPRA
Abarrotería Jardines del Edén

📋 Pedido #${orderNumber}
📅 Fecha: ${date}

👤 CLIENTE:
Nombre: ${customerName}
Teléfono: ${customerPhone}
Dirección: ${customerAddress}

🛒 PRODUCTOS:
`;

        // Agregar productos desde el DOM del ticket
        const ticketRows = document.querySelectorAll('#ticket-items-list .table-row');
        ticketRows.forEach(row => {
            const cells = row.querySelectorAll('span');
            if (cells.length >= 4) {
                ticketText += `${cells[0].textContent} - Cant: ${cells[1].textContent} - ${cells[3].textContent}\n`;
            }
        });

        ticketText += `
💰 TOTAL: Q${total}
Método de pago: Contra entrega
🚚 Tiempo estimado: 30-60 minutos

¡Gracias por tu compra!
        `;

        return ticketText;
    }

    // ========== NAVIGATION ==========

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show selected view
        document.getElementById(viewName).classList.add('active');

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[onclick="showView('${viewName}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        this.currentView = viewName;
    }

    // ========== UTILITY METHODS ==========

    showMessage(text, type = 'success') {
        // Create message element
        const message = document.createElement('div');
        message.className = `toast toast-${type}`;
        message.textContent = text;
        
        // Style the toast
        Object.assign(message.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            backgroundColor: type === 'success' ? '#28a745' : '#dc3545',
            color: 'white',
            borderRadius: '8px',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(message);

        // Animate in
        setTimeout(() => {
            message.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            message.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 300);
        }, 3000);
    }
}

// ========== GLOBAL FUNCTIONS ==========

function showView(viewName) {
    if (window.guestManager) {
        window.guestManager.showView(viewName);
    }
}

function showProductModal(productId) {
    if (window.guestManager) {
        window.guestManager.showProductModal(productId);
    }
}

function closeProductModal() {
    if (window.guestManager) {
        window.guestManager.closeProductModal();
    }
}

function changeQuantity(change) {
    if (window.guestManager) {
        window.guestManager.changeQuantity(change);
    }
}

function quickAddToCart(productId) {
    if (window.guestManager) {
        window.guestManager.quickAddToCart(productId);
    }
}

function addToCartFromModal() {
    if (window.guestManager) {
        window.guestManager.addToCartFromModal();
    }
}

function removeFromCart(productId) {
    if (window.guestManager) {
        window.guestManager.removeFromCart(productId);
    }
}

function updateCartQuantity(productId, quantity) {
    if (window.guestManager) {
        window.guestManager.updateCartQuantity(productId, quantity);
    }
}

function clearCart() {
    if (window.guestManager) {
        window.guestManager.clearCart();
    }
}

function proceedToCheckout() {
    if (window.guestManager) {
        window.guestManager.proceedToCheckout();
    }
}

function completeOrder() {
    if (window.guestManager) {
        window.guestManager.completeOrder();
    }
}

function startNewOrder() {
    if (window.guestManager) {
        window.guestManager.startNewOrder();
    }
}

function searchProducts() {
    if (window.guestManager) {
        window.guestManager.searchProducts();
    }
}

function filterProducts() {
    if (window.guestManager) {
        window.guestManager.filterProducts();
    }
}

function sortProducts() {
    if (window.guestManager) {
        window.guestManager.sortProducts();
    }
}

function closeTicketModal() {
    if (window.guestManager) {
        window.guestManager.closeTicketModal();
    }
}

function downloadTicket() {
    if (window.guestManager) {
        window.guestManager.downloadTicket();
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    window.guestManager = new GuestManager();
    
    // Load cart from storage
    window.guestManager.loadCartFromStorage();
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        const productModal = document.getElementById('product-modal');
        const confirmationModal = document.getElementById('order-confirmation-modal');
        
        if (event.target === productModal) {
            closeProductModal();
        }
        
        if (event.target === confirmationModal) {
            closeTicketModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const confirmationModal = document.getElementById('order-confirmation-modal');
            const productModal = document.getElementById('product-modal');
            
            if (confirmationModal.style.display === 'block') {
                closeTicketModal();
            }
            
            if (productModal.style.display === 'block') {
                closeProductModal();
            }
        }
    });
});