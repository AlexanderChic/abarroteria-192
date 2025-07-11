// admin-orders.js - Orders management for admin panel
class AdminOrdersManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.selectedOrder = null;
        this.allOrdersData = [];
        
        this.init();
    }

    async init() {
        try {
            // Wait for API to be initialized
            if (!dataAPI.isInitialized) {
                await dataAPI.initialize();
            }
            
            await this.loadOrders();
            this.updateOrdersStats();
            this.displayOrders();
            
            console.log('✅ Admin Orders Manager initialized');
        } catch (error) {
            console.error('❌ Error initializing admin orders manager:', error);
        }
    }

    async loadOrders() {
        try {
            this.orders = await dataAPI.getOrders();
            this.filteredOrders = [...this.orders];
            this.allOrdersData = [...this.orders];
            console.log(`📋 Loaded ${this.orders.length} orders`);
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            this.orders = [];
            this.filteredOrders = [];
        }
    }

    updateOrdersStats() {
        const totalOrders = this.orders.length;
        const pendingOrders = this.orders.filter(order => order.status === 'pendiente').length;
        const sentOrders = this.orders.filter(order => order.status === 'enviado').length;
        const deliveredOrders = this.orders.filter(order => order.status === 'entregado').length;

        // Update main dashboard
        const pendingOrdersElement = document.getElementById('pending-orders');
        if (pendingOrdersElement) {
            pendingOrdersElement.textContent = pendingOrders;
        }

        // Update orders view stats
        this.updateElement('total-orders', totalOrders);
        this.updateElement('pending-orders-count', pendingOrders);
        this.updateElement('sent-orders-count', sentOrders);
        this.updateElement('delivered-orders-count', deliveredOrders);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    displayOrders() {
        const ordersGrid = document.getElementById('orders-grid');
        const noOrdersDiv = document.getElementById('no-orders');
        
        if (!ordersGrid) return;

        if (this.filteredOrders.length === 0) {
            ordersGrid.style.display = 'none';
            if (noOrdersDiv) {
                noOrdersDiv.style.display = 'block';
                // Show different message based on total orders vs filtered orders
                if (this.orders.length === 0) {
                    noOrdersDiv.innerHTML = `
                        <h3>📋 No hay pedidos aún</h3>
                        <p>Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
                        <div style="margin-top: 20px;">
                            <p><strong>Tip:</strong> Comparte el enlace de la tienda con tus clientes:</p>
                            <code style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px;">
                                ${window.location.origin}/login.html
                            </code>
                        </div>
                    `;
                } else {
                    noOrdersDiv.innerHTML = `
                        <h3>🔍 No se encontraron pedidos</h3>
                        <p>Intenta cambiar los filtros de búsqueda</p>
                        <button class="btn btn-primary" onclick="clearOrderFilters()">🔄 Limpiar Filtros</button>
                    `;
                }
            }
            return;
        }

        if (noOrdersDiv) noOrdersDiv.style.display = 'none';
        ordersGrid.style.display = 'grid';

        ordersGrid.innerHTML = this.filteredOrders.map(order => this.createOrderCard(order)).join('');
    }

    createOrderCard(order) {
        const statusClass = this.getStatusClass(order.status);
        const statusIcon = this.getStatusIcon(order.status);
        const createdDate = new Date(order.createdAt).toLocaleDateString('es-ES');
        const createdTime = new Date(order.createdAt).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // Create products list with better formatting
        const productsList = order.items.map(item => 
            `<div class="order-product-item">
                <span class="product-name">${item.productName}</span>
                <span class="product-quantity">x${item.quantity}</span>
                <span class="product-price">Q${item.totalPrice.toFixed(2)}</span>
            </div>`
        ).join('');

        return `
            <div class="order-card ${statusClass}" onclick="showOrderDetails('${order.id}')">
                <div class="order-header">
                    <div class="order-id">
                        <strong>Pedido #${order.id.substring(0, 8)}</strong>
                        <span class="order-status ${statusClass}">
                            ${statusIcon} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                    </div>
                    <div class="order-date">
                        <div class="date">${createdDate}</div>
                        <div class="time">${createdTime}</div>
                    </div>
                </div>
                
                <div class="order-customer">
                    <div class="customer-name">
                        <strong>👤 ${order.customer.fullName}</strong>
                    </div>
                    <div class="customer-phone">
                        📞 ${order.customer.phone}
                    </div>
                </div>
                
                <div class="order-delivery">
                    <div class="delivery-location">
                        📍 <strong>${order.delivery.cluster}</strong>, ${order.delivery.colony}
                    </div>
                    <div class="delivery-address">
                        🏠 ${order.delivery.address}
                    </div>
                </div>
                
                <div class="order-products">
                    <div class="products-header">
                        <strong>📦 Productos del pedido:</strong>
                    </div>
                    <div class="products-list">
                        ${productsList}
                    </div>
                </div>
                
                <div class="order-total-section">
                    <div class="total-amount">
                        <strong>💰 Total: Q${order.total.toFixed(2)}</strong>
                    </div>
                    <div class="payment-method">
                        💳 Contra entrega
                    </div>
                </div>
                
                <div class="order-actions" onclick="event.stopPropagation()">
                    ${this.getOrderActionButtons(order)}
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        switch (status) {
            case 'pendiente': return 'status-pending';
            case 'enviado': return 'status-sent';
            case 'entregado': return 'status-delivered';
            default: return 'status-pending';
        }
    }

    getStatusIcon(status) {
        switch (status) {
            case 'pendiente': return '⏳';
            case 'enviado': return '🚚';
            case 'entregado': return '✅';
            default: return '❓';
        }
    }

    getOrderActionButtons(order) {
        let buttons = '';
        
        if (order.status === 'pendiente') {
            buttons += `<button class="btn btn-sm btn-success" onclick="quickUpdateStatus('${order.id}', 'enviado')">🚚 Enviar</button>`;
        }
        
        if (order.status === 'enviado') {
            buttons += `<button class="btn btn-sm btn-warning" onclick="quickUpdateStatus('${order.id}', 'entregado')">✅ Entregar</button>`;
        }
        
        buttons += `<button class="btn btn-sm btn-danger" onclick="quickDeleteOrder('${order.id}')">🗑️</button>`;
        
        return buttons;
    }

    async showOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.selectedOrder = order;
        
        const content = document.getElementById('order-details-content');
        content.innerHTML = this.createOrderDetailsHTML(order);

        // Update modal buttons
        this.updateModalButtons(order);

        document.getElementById('order-details-modal').style.display = 'block';
    }

    createOrderDetailsHTML(order) {
        const createdDate = new Date(order.createdAt).toLocaleString('es-ES');
        const statusClass = this.getStatusClass(order.status);
        const statusIcon = this.getStatusIcon(order.status);

        return `
            <div class="order-details">
                <div class="order-info-grid">
                    <div class="info-section">
                        <h4>📋 Información del Pedido</h4>
                        <p><strong>ID:</strong> ${order.id}</p>
                        <p><strong>Fecha:</strong> ${createdDate}</p>
                        <p><strong>Estado:</strong> <span class="status-badge ${statusClass}">${statusIcon} ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                        <p><strong>Total:</strong> Q${order.total.toFixed(2)}</p>
                        <p><strong>Método de pago:</strong> Contra entrega</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>👤 Información del Cliente</h4>
                        <p><strong>Nombre:</strong> ${order.customer.fullName}</p>
                        <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
                        <p><strong>Tipo:</strong> ${order.customerType === 'guest' ? 'Invitado' : 'Cliente registrado'}</p>
                    </div>
                    
                    <div class="info-section">
                        <h4>📍 Información de Entrega</h4>
                        <p><strong>Cluster:</strong> ${order.delivery.cluster}</p>
                        <p><strong>Colonia:</strong> ${order.delivery.colony}</p>
                        <p><strong>Dirección:</strong> ${order.delivery.address}</p>
                        ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
                    </div>
                </div>
                
                <div class="order-items">
                    <h4>📦 Productos del Pedido</h4>
                    <div class="items-table">
                        <div class="items-header">
                            <span>Producto</span>
                            <span>Cantidad</span>
                            <span>Precio Unit.</span>
                            <span>Total</span>
                        </div>
                        ${order.items.map(item => `
                            <div class="item-row">
                                <span>${item.productName}</span>
                                <span>${item.quantity}</span>
                                <span>Q${item.unitPrice.toFixed(2)}</span>
                                <span>Q${item.totalPrice.toFixed(2)}</span>
                            </div>
                        `).join('')}
                        <div class="items-total">
                            <span><strong>Total del Pedido: Q${order.total.toFixed(2)}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateModalButtons(order) {
        const markSentBtn = document.getElementById('mark-sent-btn');
        const markDeliveredBtn = document.getElementById('mark-delivered-btn');
        
        // Show/hide buttons based on status
        if (markSentBtn) {
            markSentBtn.style.display = order.status === 'pendiente' ? 'inline-block' : 'none';
        }
        
        if (markDeliveredBtn) {
            markDeliveredBtn.style.display = order.status === 'enviado' ? 'inline-block' : 'none';
        }
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            await dataAPI.updateOrderStatus(orderId, newStatus);
            
            // Update local data
            const orderIndex = this.orders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                this.orders[orderIndex].status = newStatus;
                this.orders[orderIndex].updatedAt = new Date().toISOString();
            }
            
            // Refresh display
            this.filteredOrders = [...this.orders];
            this.updateOrdersStats();
            this.displayOrders();
            
            this.showMessage(`Pedido marcado como ${newStatus}`, 'success');
            
        } catch (error) {
            console.error('❌ Error updating order status:', error);
            this.showMessage('Error al actualizar el estado del pedido', 'error');
        }
    }

    async deleteOrderById(orderId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
            return;
        }

        try {
            await dataAPI.deleteOrder(orderId);
            
            // Remove from local data
            this.orders = this.orders.filter(o => o.id !== orderId);
            this.filteredOrders = this.filteredOrders.filter(o => o.id !== orderId);
            
            // Refresh display
            this.updateOrdersStats();
            this.displayOrders();
            
            this.showMessage('Pedido eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('❌ Error deleting order:', error);
            this.showMessage('Error al eliminar el pedido', 'error');
        }
    }

    // Filter and search functions
    filterOrders() {
        const statusFilter = document.getElementById('filter-order-status').value;
        const dateFilter = document.getElementById('filter-order-date').value;
        const searchTerm = document.getElementById('search-orders')?.value.toLowerCase() || '';

        this.filteredOrders = this.orders.filter(order => {
            const matchesStatus = !statusFilter || order.status === statusFilter;
            const matchesDate = !dateFilter || order.createdAt.startsWith(dateFilter);
            const matchesSearch = !searchTerm || 
                order.customer.fullName.toLowerCase().includes(searchTerm) ||
                order.customer.phone.includes(searchTerm) ||
                order.id.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesDate && matchesSearch;
        });

        this.displayOrders();
    }

    searchOrders() {
        this.filterOrders();
    }

    async refreshOrders() {
        await this.loadOrders();
        this.updateOrdersStats();
        this.displayOrders();
        this.showMessage('Pedidos actualizados', 'success');
    }

    // All orders modal functions
    showAllOrders() {
        this.allOrdersData = [...this.orders];
        this.updateAllOrdersModal();
        document.getElementById('all-orders-modal').style.display = 'block';
    }

    updateAllOrdersModal() {
        const tableContainer = document.getElementById('all-orders-table');
        if (!tableContainer) return;

        if (this.allOrdersData.length === 0) {
            tableContainer.innerHTML = '<div class="empty-state"><h3>No hay pedidos para mostrar</h3></div>';
            return;
        }

        tableContainer.innerHTML = `
            <div class="orders-table">
                <div class="table-header">
                    <span>ID</span>
                    <span>Cliente</span>
                    <span>Fecha</span>
                    <span>Estado</span>
                    <span>Total</span>
                    <span>Acciones</span>
                </div>
                ${this.allOrdersData.map(order => this.createOrderRow(order)).join('')}
            </div>
        `;
    }

    createOrderRow(order) {
        const statusClass = this.getStatusClass(order.status);
        const statusIcon = this.getStatusIcon(order.status);
        const date = new Date(order.createdAt).toLocaleDateString('es-ES');

        return `
            <div class="table-row">
                <span class="order-id-cell">#${order.id.substring(0, 8)}</span>
                <span>${order.customer.fullName}</span>
                <span>${date}</span>
                <span class="status-cell">
                    <span class="status-badge ${statusClass}">${statusIcon} ${order.status}</span>
                </span>
                <span class="total-cell">Q${order.total.toFixed(2)}</span>
                <span class="actions-cell">
                    <button class="btn btn-sm btn-primary" onclick="showOrderDetailsFromTable('${order.id}')">Ver</button>
                    ${this.getTableActionButtons(order)}
                </span>
            </div>
        `;
    }

    getTableActionButtons(order) {
        let buttons = '';
        
        if (order.status === 'pendiente') {
            buttons += `<button class="btn btn-sm btn-success" onclick="quickUpdateStatus('${order.id}', 'enviado')">Enviar</button>`;
        }
        
        if (order.status === 'enviado') {
            buttons += `<button class="btn btn-sm btn-warning" onclick="quickUpdateStatus('${order.id}', 'entregado')">Entregar</button>`;
        }
        
        return buttons;
    }

    filterAllOrdersModal() {
        const statusFilter = document.getElementById('modal-filter-status').value;
        const searchTerm = document.getElementById('modal-search-orders').value.toLowerCase();

        this.allOrdersData = this.orders.filter(order => {
            const matchesStatus = !statusFilter || order.status === statusFilter;
            const matchesSearch = !searchTerm || 
                order.customer.fullName.toLowerCase().includes(searchTerm) ||
                order.customer.phone.includes(searchTerm) ||
                order.id.toLowerCase().includes(searchTerm);

            return matchesStatus && matchesSearch;
        });

        this.updateAllOrdersModal();
    }

    exportOrders() {
        if (this.orders.length === 0) {
            this.showMessage('No hay pedidos para exportar', 'error');
            return;
        }

        const csvContent = this.generateCSV();
        this.downloadCSV(csvContent);
    }

    generateCSV() {
        const headers = ['ID', 'Cliente', 'Teléfono', 'Fecha', 'Estado', 'Cluster', 'Dirección', 'Total', 'Productos'];
        const rows = this.orders.map(order => [
            order.id,
            order.customer.fullName,
            order.customer.phone,
            new Date(order.createdAt).toLocaleString('es-ES'),
            order.status,
            order.delivery.cluster,
            order.delivery.address,
            order.total.toFixed(2),
            order.items.map(item => `${item.productName} (${item.quantity})`).join('; ')
        ]);

        return [headers, ...rows].map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
    }

    downloadCSV(csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    closeOrderModal() {
        document.getElementById('order-details-modal').style.display = 'none';
        this.selectedOrder = null;
    }

    closeAllOrdersModal() {
        document.getElementById('all-orders-modal').style.display = 'none';
    }

    showMessage(text, type = 'success') {
        // Reuse the same toast system from guest.js
        const message = document.createElement('div');
        message.className = `toast toast-${type}`;
        message.textContent = text;
        
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

        setTimeout(() => {
            message.style.transform = 'translateX(0)';
        }, 100);

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

// Global functions for HTML onclick events
function showOrderDetails(orderId) {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.showOrderDetails(orderId);
    }
}

function showOrderDetailsFromTable(orderId) {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.closeAllOrdersModal();
        window.adminOrdersManager.showOrderDetails(orderId);
    }
}

function closeOrderModal() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.closeOrderModal();
    }
}

function markAsSent() {
    if (window.adminOrdersManager && window.adminOrdersManager.selectedOrder) {
        window.adminOrdersManager.updateOrderStatus(window.adminOrdersManager.selectedOrder.id, 'enviado');
        window.adminOrdersManager.closeOrderModal();
    }
}

function markAsDelivered() {
    if (window.adminOrdersManager && window.adminOrdersManager.selectedOrder) {
        window.adminOrdersManager.updateOrderStatus(window.adminOrdersManager.selectedOrder.id, 'entregado');
        window.adminOrdersManager.closeOrderModal();
    }
}

function deleteOrder() {
    if (window.adminOrdersManager && window.adminOrdersManager.selectedOrder) {
        window.adminOrdersManager.deleteOrderById(window.adminOrdersManager.selectedOrder.id);
        window.adminOrdersManager.closeOrderModal();
    }
}

function quickUpdateStatus(orderId, newStatus) {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.updateOrderStatus(orderId, newStatus);
    }
}

function quickDeleteOrder(orderId) {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.deleteOrderById(orderId);
    }
}

function filterOrders() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.filterOrders();
    }
}

function searchOrders() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.searchOrders();
    }
}

function refreshOrders() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.refreshOrders();
    }
}

function showAllOrders() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.showAllOrders();
    }
}

function closeAllOrdersModal() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.closeAllOrdersModal();
    }
}

function filterAllOrdersModal() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.filterAllOrdersModal();
    }
}

function exportOrders() {
    if (window.adminOrdersManager) {
        window.adminOrdersManager.exportOrders();
    }
}

function clearOrderFilters() {
    // Clear all filters
    const statusFilter = document.getElementById('filter-order-status');
    const dateFilter = document.getElementById('filter-order-date');
    const searchFilter = document.getElementById('search-orders');
    
    if (statusFilter) statusFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    if (searchFilter) searchFilter.value = '';
    
    // Refresh orders display
    if (window.adminOrdersManager) {
        window.adminOrdersManager.filterOrders();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the admin page
    if (document.getElementById('orders-grid')) {
        window.adminOrdersManager = new AdminOrdersManager();
    }
});