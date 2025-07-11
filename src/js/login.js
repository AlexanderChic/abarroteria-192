// Login.js - Authentication logic
class LoginManager {
    constructor() {
        this.isInitialized = false;
        this.loginForm = null;
        this.messageDiv = null;
        this.loginBtn = null;
        this.serverStatus = null;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLoginPage());
        } else {
            this.setupLoginPage();
        }
    }

    async setupLoginPage() {
        try {
            // Get DOM elements
            this.loginForm = document.getElementById('user-login-form');
            this.messageDiv = document.getElementById('login-message');
            this.loginBtn = document.getElementById('login-btn');
            this.serverStatus = document.getElementById('server-status');
            
            // Check if user is already logged in
            if (dataAPI.isAuthenticated()) {
                this.redirectToApp();
                return;
            }
            
            // Initialize API
            await dataAPI.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check server status
            await this.checkServerStatus();
            
            this.isInitialized = true;
            console.log('✅ Login Manager initialized');
            
        } catch (error) {
            console.error('❌ Error initializing login:', error);
            this.showMessage('Error al inicializar el sistema', 'error');
        }
    }

    setupEventListeners() {
        // Login form submission
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Demo credential buttons (optional enhancement)
        this.setupDemoButtons();
        
        // Enter key support
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.loginBtn.disabled) {
                this.handleLogin(e);
            }
        });
    }

    setupDemoButtons() {
        // Add click handler to admin demo card for easy login
        const demoCard = document.querySelector('.demo-card');
        if (demoCard) {
            demoCard.style.cursor = 'pointer';
            demoCard.addEventListener('click', () => {
                this.fillDemoCredentials('admin', 'admin123', 'admin');
            });
        }
    }

    fillDemoCredentials(username, password, userType) {
        document.getElementById('username').value = username;
        document.getElementById('password').value = password;
        document.getElementById(`${userType}-type`).checked = true;
        
        // Add visual feedback
        this.showMessage('Credenciales cargadas. Haz clic en "Iniciar Sesión"', 'success');
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const userType = document.querySelector('input[name="userType"]:checked')?.value;
        
        // Validate form
        if (!this.validateLoginForm(username, password, userType)) {
            return;
        }
        
        // Show loading state
        this.setLoading(true);
        this.showMessage('Verificando credenciales...', 'success');
        
        try {
            // Attempt login
            const user = await dataAPI.login(username, password, userType);
            
            if (user) {
                this.showMessage(`¡Bienvenido, ${user.name}!`, 'success');
                
                // Redirect after short delay
                setTimeout(() => {
                    this.redirectToApp();
                }, 1000);
            }
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            this.showMessage('Credenciales incorrectas. Verifica tu usuario, contraseña y tipo de usuario.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    validateLoginForm(username, password, userType) {
        if (!username) {
            this.showMessage('Por favor ingresa tu usuario', 'error');
            document.getElementById('username').focus();
            return false;
        }
        
        if (!password) {
            this.showMessage('Por favor ingresa tu contraseña', 'error');
            document.getElementById('password').focus();
            return false;
        }
        
        if (!userType) {
            this.showMessage('Por favor selecciona el tipo de usuario', 'error');
            return false;
        }
        
        return true;
    }

    redirectToApp() {
        const user = dataAPI.getCurrentUser();
        
        if (!user) {
            this.showMessage('Error en la sesión', 'error');
            return;
        }
        
        // Redirect based on user type
        if (user.type === 'admin') {
            window.location.href = 'public/admin.html'; // Admin dashboard
        } else {
            this.showMessage('Tipo de usuario no válido', 'error');
        }
    }

    showMessage(text, type = 'success') {
        this.messageDiv.textContent = text;
        this.messageDiv.className = `message ${type}`;
        this.messageDiv.style.display = 'block';
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                this.messageDiv.style.display = 'none';
            }, 3000);
        }
    }

    setLoading(isLoading) {
        this.loginBtn.disabled = isLoading;
        
        if (isLoading) {
            this.loginBtn.classList.add('loading');
            this.loginBtn.textContent = 'Verificando...';
        } else {
            this.loginBtn.classList.remove('loading');
            this.loginBtn.textContent = '🔐 Iniciar Sesión';
        }
    }

    async checkServerStatus() {
        try {
            const statusDot = this.serverStatus.querySelector('.status-dot');
            const statusText = this.serverStatus.querySelector('.status-text');
            
            statusText.textContent = 'Verificando servidor...';
            
            const isOnline = await dataAPI.checkServerStatus();
            
            if (isOnline) {
                statusDot.classList.add('online');
                statusText.textContent = 'Servidor conectado';
                console.log('✅ Server is online');
            } else {
                statusDot.classList.add('offline');
                statusText.textContent = 'Servidor desconectado (modo local)';
                console.log('⚠️ Server is offline, using local mode');
            }
        } catch (error) {
            console.error('❌ Error checking server status:', error);
            const statusDot = this.serverStatus.querySelector('.status-dot');
            const statusText = this.serverStatus.querySelector('.status-text');
            
            statusDot.classList.add('offline');
            statusText.textContent = 'Error de conexión';
        }
    }

    // Utility method to clear form
    clearForm() {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.querySelectorAll('input[name="userType"]').forEach(radio => {
            radio.checked = false;
        });
        this.messageDiv.style.display = 'none';
    }

    // Logout (can be called from other pages)
    static logout() {
        dataAPI.logout();
        window.location.href = 'login.html';
    }
}

// Enter as guest function
function enterAsGuest() {
    // Create guest user session
    const guestUser = {
        id: "guest",
        username: "invitado",
        type: "guest",
        name: "Invitado",
        email: "invitado@local.com"
    };
    
    // Set guest session
    sessionStorage.setItem('currentUser', JSON.stringify(guestUser));
    dataAPI.currentUser = guestUser;
    
    // Redirect to guest view
    window.location.href = 'public/guest.html';
}

// Initialize login manager when script loads
const loginManager = new LoginManager();