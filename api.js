// API.js - Data management for Abarrotería CRUD with JSON Server
class DataAPI {
    constructor() {
        this.data = {
            categories: [],
            products: [],
            metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                created: new Date().toISOString()
            }
        };
        this.isInitialized = false;
        
        // JSON Server endpoints
        this.baseURL = 'http://localhost:3000';
        this.endpoints = {
            categories: `${this.baseURL}/categories`,
            products: `${this.baseURL}/products`,
            metadata: `${this.baseURL}/metadata`
        };
    }

    // Initialize data - load from JSON Server
    async initialize() {
        if (this.isInitialized) return;
        
        try {
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
            const [categoriesResponse, productsResponse, metadataResponse] = await Promise.all([
                fetch(this.endpoints.categories),
                fetch(this.endpoints.products),
                fetch(this.endpoints.metadata)
            ]);

            if (!categoriesResponse.ok || !productsResponse.ok) {
                throw new Error('Failed to fetch from JSON Server');
            }

            this.data.categories = await categoriesResponse.json();
            this.data.products = await productsResponse.json();
            
            // Metadata might not exist initially
            if (metadataResponse.ok) {
                this.data.metadata = await metadataResponse.json();
            }
            
            console.log('📂 Data loaded from JSON Server successfully');
        } catch (error) {
            throw new Error(`JSON Server connection failed: ${error.message}`);
        }
    }

    // Initialize with default data
    initializeDefaults() {
        this.data = {
            categories: this.getDefaultCategories(),
            products: [],
            metadata: {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                created: new Date().toISOString()
            }
        };
        console.log('🔧 Initialized with default database');
    }

    // Update metadata on server
    async updateMetadata() {
        this.data.metadata.lastUpdated = new Date().toISOString();
        try {
            await fetch(this.endpoints.metadata, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCategory)
            });

            if (response.ok) {
                const savedCategory = await response.json();
                this.data.categories.push(savedCategory);
                await this.updateMetadata();
                console.log('➕ Category added:', savedCategory.name);
                return savedCategory;
            } else {
                throw new Error('Failed to save category to server');
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedCategory)
            });

            if (response.ok) {
                this.data.categories[index] = updatedCategory;
                await this.updateMetadata();
                console.log('✏️ Category updated:', updatedCategory.name);
                return updatedCategory;
            } else {
                throw new Error('Failed to update category on server');
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
                method: 'DELETE'
            });

            if (response.ok) {
                const deleted = this.data.categories.splice(index, 1)[0];
                await this.updateMetadata();
                console.log('🗑️ Category deleted:', deleted.name);
                return true;
            } else {
                throw new Error('Failed to delete category from server');
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });

            if (response.ok) {
                const savedProduct = await response.json();
                this.data.products.push(savedProduct);
                await this.updateMetadata();
                console.log('➕ Product added:', savedProduct.name);
                return savedProduct;
            } else {
                throw new Error('Failed to save product to server');
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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProduct)
            });

            if (response.ok) {
                this.data.products[index] = updatedProduct;
                await this.updateMetadata();
                console.log('✏️ Product updated:', updatedProduct.name);
                return updatedProduct;
            } else {
                throw new Error('Failed to update product on server');
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
                method: 'DELETE'
            });

            if (response.ok) {
                const deleted = this.data.products.splice(index, 1)[0];
                await this.updateMetadata();
                console.log('🗑️ Product deleted:', deleted.name);
                return true;
            } else {
                throw new Error('Failed to delete product from server');
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
            metadata: newData.metadata || {
                version: '1.0',
                lastUpdated: new Date().toISOString(),
                created: newData.created || new Date().toISOString()
            }
        };
        
        console.log('📥 Database updated successfully');
        return true;
    }

    // ========== EXPORT/IMPORT METHODS ==========

    // Export all data (for backup)
    exportData() {
        return this.getDatabase();
    }

    // Import data (for restore)
    importData(data) {
        return this.setDatabase(data);
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

    // Download JSON file
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Save database to file
    saveDatabaseToFile() {
        const timestamp = new Date().toISOString().split('T')[0];
        this.downloadJSON(this.getDatabase(), `db_${timestamp}.json`);
        console.log('💾 Database saved to file');
    }

    // Save backup
    saveBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.downloadJSON(this.exportData(), `abarroteria_backup_${timestamp}.json`);
        console.log('💾 Backup created');
    }

    // Get database info
    getDatabaseInfo() {
        return {
            categories: this.data.categories.length,
            products: this.data.products.length,
            lastUpdated: this.data.metadata.lastUpdated,
            version: this.data.metadata.version,
            created: this.data.metadata.created
        };
    }

    // Check server status
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.baseURL}/categories`, {
                method: 'HEAD'
            });
            return response.ok;
        } catch (error) {
            // Try a simple GET request as fallback
            try {
                const response = await fetch(this.endpoints.categories);
                return response.ok;
            } catch (secondError) {
                return false;
            }
        }
    }
}

// Create global instance
const dataAPI = new DataAPI();