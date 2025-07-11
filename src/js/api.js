// API.js - Data management for Abarrotería CRUD with JSON Server
class DataAPI {
    constructor() {
        this.data = {
            categories: [],
            products: [],
            users: [],
            metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                created: new Date().toISOString()
            }
        };
        this.isInitialized = false;
        this.currentUser = null;
        
        // JSON Server endpoints - RAILWAY CORRECTED
        // Railway URLs ya incluyen https://, AGREGAR /api/ prefix
        this.baseURL = 'https://abarroteria-192-production.up.railway.app/api';
        this.endpoints = {
            categories: `${this.baseURL}/categories`,
            products: `${this.baseURL}/products`,
            users: `${this.baseURL}/users`,
            metadata: `${this.baseURL}/metadata`,
            orders: `${this.baseURL}/orders`
        };
        
        // Agregar headers para CORS si es necesario
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // ========== AUTHENTICATION METHODS ==========

    // Login user
    async login(username, password, userType) {
        try {
            console.log('🔐 Attempting login to:', this.endpoints.users);
            
            const response = await fetch(this.endpoints.users, {
                method: 'GET',
                headers: this.defaultHeaders
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const users = await response.json();
            console.log('Users loaded:', users.length);
            
            const user = users.find(u => 
                u.username === username && 
                u.password === password && 
                u.type === userType
            );
            
            if (user) {
                this.currentUser = { ...user };
                delete this.currentUser.password; // Remove password from memory
                sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                console.log('✅ Login successful:', this.currentUser.username);
                return this.currentUser;
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            throw error;
        }
    }

    // Logout user
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        console.log('👋 User logged out');
    }

    // Check if user is authenticated
    isAuthenticated() {
        if (this.currentUser) return true;
        
        // Check session storage
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            return true;
        }
        
        return false;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if current user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.type === 'admin';
    }

    // Check if current user is client
    isClient() {
        return this.currentUser && this.currentUser.type === 'client';
    }

    // Check if current user is guest
    isGuest() {
        return this.currentUser && this.currentUser.type === 'guest';
    }

    // ========== ORDERS METHODS ==========

    // Get all orders (admin only)
    async getOrders() {
        try {
            const response = await fetch(this.endpoints.orders, {
                headers: this.defaultHeaders
            });
            if (response.ok) {
                return await response.json();
            }
            console.warn('Failed to fetch orders:', response.status);
            return [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
    }

    // Create new order
    async createOrder(orderData) {
        const newOrder = {
            id: this.generateId(),
            ...orderData,
            status: 'pendiente',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            const response = await fetch(this.endpoints.orders, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify(newOrder)
            });

            if (response.ok) {
                const savedOrder = await response.json();
                console.log('➕ Order created:', savedOrder.id);
                return savedOrder;
            } else {
                throw new Error(`Failed to save order: ${response.status}`);
            }
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    // Update order status
    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`${this.endpoints.orders}/${orderId}`, {
                method: 'PATCH',
                headers: this.defaultHeaders,
                body: JSON.stringify({ 
                    status: status,
                    updatedAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('✏️ Order status updated:', orderId, status);
                return await response.json();
            } else {
                throw new Error(`Failed to update order: ${response.status}`);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    }

    // Delete order
    async deleteOrder(orderId) {
        try {
            const response = await fetch(`${this.endpoints.orders}/${orderId}`, {
                method: 'DELETE',
                headers: this.defaultHeaders
            });

            if (response.ok) {
                console.log('🗑️ Order deleted:', orderId);
                return true;
            } else {
                throw new Error(`Failed to delete order: ${response.status}`);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    }

    // Initialize data - load from JSON Server
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            console.log('🚀 Initializing API connection...');
            console.log('Base URL:', this.baseURL);
            
            await this.loadFromServer();
            this.isInitialized = true;
            console.log('✅ Data API initialized successfully with JSON Server');
            console.log(`📊 Loaded: ${this.data.categories.length} categories, ${this.data.products.length} products`);
        } catch (error) {
            console.warn('⚠️ Could not connect to JSON Server, using defaults');
            console.error('Error details:', error);
            this.initializeDefaults();
            this.isInitialized = true;
        }
    }

    // Load data from JSON Server
    async loadFromServer() {
        try {
            console.log('📡 Fetching data from server...');
            
            // Test server connection first
            const testResponse = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
                method: 'GET',
                headers: this.defaultHeaders
            });
            
            console.log('Server test response:', testResponse.status);
            
            const [categoriesResponse, productsResponse, usersResponse, metadataResponse] = await Promise.all([
                fetch(this.endpoints.categories, { headers: this.defaultHeaders }),
                fetch(this.endpoints.products, { headers: this.defaultHeaders }),
                fetch(this.endpoints.users, { headers: this.defaultHeaders }),
                fetch(this.endpoints.metadata, { headers: this.defaultHeaders })
            ]);

            console.log('Categories response:', categoriesResponse.status);
            console.log('Products response:', productsResponse.status);
            console.log('Users response:', usersResponse.status);
            console.log('Metadata response:', metadataResponse.status);

            if (!categoriesResponse.ok || !productsResponse.ok) {
                throw new Error(`Failed to fetch from JSON Server: Categories(${categoriesResponse.status}), Products(${productsResponse.status})`);
            }

            this.data.categories = await categoriesResponse.json();
            this.data.products = await productsResponse.json();
            
            // Users might not exist initially
            if (usersResponse.ok) {
                this.data.users = await usersResponse.json();
            } else {
                console.log('Users endpoint not available, using defaults');
                this.data.users = this.getDefaultUsers();
            }
            
            // Metadata might not exist initially
            if (metadataResponse.ok) {
                this.data.metadata = await metadataResponse.json();
            } else {
                console.log('Metadata endpoint not available, using defaults');
            }
            
            console.log('📂 Data loaded from JSON Server successfully');
        } catch (error) {
            console.error('❌ JSON Server connection failed:', error);
            throw new Error(`JSON Server connection failed: ${error.message}`);
        }
    }

    // Initialize with default data
    initializeDefaults() {
        this.data = {
            categories: this.getDefaultCategories(),
            products: [],
            users: this.getDefaultUsers(),
            metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                created: new Date().toISOString()
            }
        };
        console.log('🔧 Initialized with default database');
    }

    // Get default users
    getDefaultUsers() {
        return [
            {
                id: "1",
                username: "admin",
                password: "admin123",
                type: "admin",
                name: "Administrador",
                email: "admin@abarroteria.com",
                createdAt: new Date().toISOString()
            },
            {
                id: "2",
                username: "cliente",
                password: "cliente123",
                type: "client",
                name: "Cliente Demo",
                email: "cliente@email.com",
                createdAt: new Date().toISOString()
            },
            {
                id: "3",
                username: "pedidos",
                password: "pedidos12345",
                type: "client",
                name: "Usuario Pedidos",
                email: "pedidos@email.com",
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Update metadata on server
    async updateMetadata() {
        this.data.metadata.lastUpdated = new Date().toISOString();
        try {
            await fetch(this.endpoints.metadata, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: JSON.stringify(this.data.metadata)
            });
        } catch (error) {
            console.warn('Could not update metadata on server:', error);
        }
    }

    // Get default categories
    getDefaultCategories() {
        return [
            {
                id: "1",
                name: 'Abarrotes',
                description: 'Productos básicos de despensa',
                subcategories: ['Cereales', 'Enlatados', 'Condimentos', 'Pastas'],
                createdAt: new Date().toISOString()
            },
            {
                id: "2",
                name: 'Bebidas',
                description: 'Bebidas refrescantes y alcohólicas',
                subcategories: ['Refrescos', 'Jugos', 'Agua', 'Cervezas'],
                createdAt: new Date().toISOString()
            },
            {
                id: "3",
                name: 'Lácteos',
                description: 'Productos lácteos y derivados',
                subcategories: ['Leche', 'Yogurt', 'Quesos', 'Mantequilla'],
                createdAt: new Date().toISOString()
            },
            {
                id: "4",
                name: 'Limpieza',
                description: 'Productos de limpieza para el hogar',
                subcategories: ['Detergentes', 'Jabones', 'Desinfectantes', 'Papel'],
                createdAt: new Date().toISOString()
            }
        ];
    }

    // ========== CATEGORIES METHODS ==========

    // Get all categories
    getCategories() {
        return [...this.data.categories];
    }

    // Get category by ID
    getCategoryById(id) {
        return this.data.categories.find(cat => cat.id == id);
    }

    // Add new category
    async addCategory(categoryData) {
        const newCategory = {
            id: this.generateId(),
            ...categoryData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            const response = await fetch(this.endpoints.categories, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify(newCategory)
            });

            if (response.ok) {
                const savedCategory = await response.json();
                this.data.categories.push(savedCategory);
                await this.updateMetadata();
                console.log('➕ Category added:', savedCategory.name);
                return savedCategory;
            } else {
                throw new Error(`Failed to save category: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local storage
            this.data.categories.push(newCategory);
            console.log('➕ Category added locally:', newCategory.name);
            return newCategory;
        }
    }

    // Update category
    async updateCategory(id, categoryData) {
        const index = this.data.categories.findIndex(cat => cat.id == id);
        if (index === -1) return null;
        
        const updatedCategory = {
            ...this.data.categories[index],
            ...categoryData,
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.endpoints.categories}/${id}`, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: JSON.stringify(updatedCategory)
            });

            if (response.ok) {
                this.data.categories[index] = updatedCategory;
                await this.updateMetadata();
                console.log('✏️ Category updated:', updatedCategory.name);
                return updatedCategory;
            } else {
                throw new Error(`Failed to update category: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local update
            this.data.categories[index] = updatedCategory;
            console.log('✏️ Category updated locally:', updatedCategory.name);
            return updatedCategory;
        }
    }

    // Delete category
    async deleteCategory(id) {
        // Check if category is being used
        const productsUsingCategory = this.data.products.filter(p => p.category == id);
        if (productsUsingCategory.length > 0) {
            throw new Error(`Cannot delete category. It's being used by ${productsUsingCategory.length} product(s).`);
        }
        
        const index = this.data.categories.findIndex(cat => cat.id == id);
        if (index === -1) return false;
        
        try {
            const response = await fetch(`${this.endpoints.categories}/${id}`, {
                method: 'DELETE',
                headers: this.defaultHeaders
            });

            if (response.ok) {
                const deleted = this.data.categories.splice(index, 1)[0];
                await this.updateMetadata();
                console.log('🗑️ Category deleted:', deleted.name);
                return true;
            } else {
                throw new Error(`Failed to delete category: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local deletion
            const deleted = this.data.categories.splice(index, 1)[0];
            console.log('🗑️ Category deleted locally:', deleted.name);
            return true;
        }
    }

    // Validate category name uniqueness
    isCategoryNameUnique(name, excludeId = null) {
        return !this.data.categories.some(cat => 
            cat.name.toLowerCase() === name.toLowerCase() && 
            cat.id != excludeId
        );
    }

    // ========== PRODUCTS METHODS ==========

    // Get all products
    getProducts() {
        return [...this.data.products];
    }

    // Get product by ID
    getProductById(id) {
        return this.data.products.find(prod => prod.id == id);
    }

    // Add new product
    async addProduct(productData) {
        const newProduct = {
            id: this.generateId(),
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            const response = await fetch(this.endpoints.products, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify(newProduct)
            });

            if (response.ok) {
                const savedProduct = await response.json();
                this.data.products.push(savedProduct);
                await this.updateMetadata();
                console.log('➕ Product added:', savedProduct.name);
                return savedProduct;
            } else {
                throw new Error(`Failed to save product: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local storage
            this.data.products.push(newProduct);
            console.log('➕ Product added locally:', newProduct.name);
            return newProduct;
        }
    }

    // Update product
    async updateProduct(id, productData) {
        const index = this.data.products.findIndex(prod => prod.id == id);
        if (index === -1) return null;
        
        const updatedProduct = {
            ...this.data.products[index],
            ...productData,
            updatedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${this.endpoints.products}/${id}`, {
                method: 'PUT',
                headers: this.defaultHeaders,
                body: JSON.stringify(updatedProduct)
            });

            if (response.ok) {
                this.data.products[index] = updatedProduct;
                await this.updateMetadata();
                console.log('✏️ Product updated:', updatedProduct.name);
                return updatedProduct;
            } else {
                throw new Error(`Failed to update product: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local update
            this.data.products[index] = updatedProduct;
            console.log('✏️ Product updated locally:', updatedProduct.name);
            return updatedProduct;
        }
    }

    // Delete product
    async deleteProduct(id) {
        const index = this.data.products.findIndex(prod => prod.id == id);
        if (index === -1) return false;
        
        try {
            const response = await fetch(`${this.endpoints.products}/${id}`, {
                method: 'DELETE',
                headers: this.defaultHeaders
            });

            if (response.ok) {
                const deleted = this.data.products.splice(index, 1)[0];
                await this.updateMetadata();
                console.log('🗑️ Product deleted:', deleted.name);
                return true;
            } else {
                throw new Error(`Failed to delete product: ${response.status}`);
            }
        } catch (error) {
            // Fallback to local deletion
            const deleted = this.data.products.splice(index, 1)[0];
            console.log('🗑️ Product deleted locally:', deleted.name);
            return true;
        }
    }

    // Search products
    searchProducts(searchTerm, categoryId = null) {
        let filtered = this.data.products;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(term) ||
                product.description.toLowerCase().includes(term) ||
                product.supplier.toLowerCase().includes(term)
            );
        }
        
        if (categoryId) {
            filtered = filtered.filter(product => product.category == categoryId);
        }
        
        return filtered;
    }

    // Get products by category
    getProductsByCategory(categoryId) {
        return this.data.products.filter(product => product.category == categoryId);
    }

    // Get low stock products
    getLowStockProducts(threshold = 10) {
        return this.data.products.filter(product => product.stock < threshold);
    }

    // Get recent products
    getRecentProducts(limit = 6) {
        return this.data.products
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // ========== STATISTICS METHODS ==========

    // Get dashboard statistics
    getStatistics() {
        const totalProducts = this.data.products.length;
        const totalCategories = this.data.categories.length;
        const totalValue = this.data.products.reduce((sum, product) => 
            sum + (product.sellPrice * product.stock), 0
        );
        const lowStock = this.getLowStockProducts().length;
        
        return {
            totalProducts,
            totalCategories,
            totalValue,
            lowStock
        };
    }

    // Get category statistics
    getCategoryStatistics() {
        return this.data.categories.map(category => ({
            ...category,
            productCount: this.getProductsByCategory(category.id).length
        }));
    }

    // ========== DATABASE METHODS ==========

    // Get complete database
    getDatabase() {
        return {
            ...this.data,
            metadata: {
                ...this.data.metadata,
                exportDate: new Date().toISOString()
            }
        };
    }

    // Set complete database
    setDatabase(newData) {
        if (!newData.categories || !newData.products) {
            throw new Error('Invalid database format. Must contain categories and products.');
        }
        
        this.data = {
            categories: newData.categories,
            products: newData.products,
            users: newData.users || this.getDefaultUsers(),
            metadata: newData.metadata || {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                created: newData.created || new Date().toISOString()
            }
        };
        
        console.log('📥 Database updated successfully');
        return true;
    }

    // ========== UTILITY METHODS ==========

    // Generate unique ID
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 5);
    }

    // Validate product data
    validateProduct(productData) {
        const errors = [];
        
        if (!productData.name?.trim()) {
            errors.push('El nombre del producto es obligatorio');
        }
        
        if (!productData.category) {
            errors.push('La categoría es obligatoria');
        }
        
        if (!productData.supplier?.trim()) {
            errors.push('El proveedor es obligatorio');
        }
        
        if (!productData.buyPrice || productData.buyPrice <= 0) {
            errors.push('El precio de compra debe ser mayor a 0');
        }
        
        if (!productData.sellPrice || productData.sellPrice <= 0) {
            errors.push('El precio de venta debe ser mayor a 0');
        }
        
        if (productData.sellPrice <= productData.buyPrice) {
            errors.push('El precio de venta debe ser mayor al precio de compra');
        }
        
        return errors;
    }

    // Validate category data
    validateCategory(categoryData) {
        const errors = [];
        
        if (!categoryData.name?.trim()) {
            errors.push('El nombre de la categoría es obligatorio');
        }
        
        return errors;
    }

    // Check server status
    async checkServerStatus() {
        try {
            console.log('🔍 Checking server status...');
            const response = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
                method: 'GET',
                headers: this.defaultHeaders
            });
            console.log('Server status check:', response.status);
            return response.ok;
        } catch (error) {
            console.error('Server status check failed:', error);
            return false;
        }
    }

    // Test connection with detailed logging
    async testConnection() {
        console.log('🧪 Testing API connection...');
        console.log('Base URL:', this.baseURL);
        
        try {
            // Test health endpoint
            const healthResponse = await fetch(`${this.baseURL.replace('/api', '')}/health`, {
                method: 'GET',
                headers: this.defaultHeaders
            });
            
            console.log('Health check result:', {
                status: healthResponse.status,
                statusText: healthResponse.statusText,
                ok: healthResponse.ok,
                url: healthResponse.url
            });

            // Test categories endpoint
            const categoriesResponse = await fetch(this.endpoints.categories, {
                method: 'GET',
                headers: this.defaultHeaders
            });
            
            console.log('Categories endpoint result:', {
                status: categoriesResponse.status,
                statusText: categoriesResponse.statusText,
                ok: categoriesResponse.ok,
                url: categoriesResponse.url
            });
            
            if (categoriesResponse.ok) {
                const data = await categoriesResponse.json();
                console.log('Categories data:', data);
            }
            
            return categoriesResponse.ok;
        } catch (error) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
}

// Create global instance
const dataAPI = new DataAPI();