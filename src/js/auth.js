// auth.js - Shared authentication system
class AuthManager {
    constructor() {
        this.checkAuthentication();
        this.updateUserInfo();
    }

    // Check if user is authenticated and has correct permissions
    checkAuthentication() {
        if (!dataAPI.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }

        const currentUser = dataAPI.getCurrentUser();
        const currentPage = window.location.pathname;

        // Check if user has access to current page
        if (currentPage.includes('admin.html') && !dataAPI.isAdmin()) {
            alert('No tienes permisos para acceder a esta página');
            this.redirectToLogin();
            return;
        }

        if (currentPage.includes('client.html') && !dataAPI.isClient()) {
            alert('No tienes permisos para acceder a esta página');
            this.redirectToLogin();
            return;
        }

        console.log('✅ User authenticated:', currentUser.name);
    }

    // Update user info in header
    updateUserInfo() {
        const userNameElement = document.getElementById('user-name');
        const currentUser = dataAPI.getCurrentUser();

        if (userNameElement && currentUser) {
            userNameElement.textContent = currentUser.name;
        }
    }

    // Redirect to login page
    redirectToLogin() {
        dataAPI.logout();
        window.location.href = '../login.html';
    }

    // Check session periodically (optional security measure)
    startSessionCheck() {
        setInterval(() => {
            if (!dataAPI.isAuthenticated()) {
                alert('Tu sesión ha expirado');
                this.redirectToLogin();
            }
        }, 30000); // Check every 30 seconds
    }
}

// Global logout function
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        dataAPI.logout();
        window.location.href = '../login.html';
    }
}

// Initialize auth manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    // Uncomment to enable periodic session checks
    // authManager.startSessionCheck();
});