class LoginManager {
    constructor() {
        this.initializeEventListeners();
        this.checkAuthState();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Clear any existing messages
        this.clearMessages();
    }

    checkAuthState() {
        // Check if user is already logged in
        window.onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                // User is already logged in, redirect to appropriate page
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                window.location.href = redirectUrl;
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        // Clear previous messages
        this.clearMessages();

        // Validate input
        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        try {
            // Sign in with Firebase
            const userCredential = await window.signInWithEmailAndPassword(window.firebaseAuth, email, password);
            
            // Login successful
            this.showMessage('Login successful! Redirecting...', 'success');
            
            // Store login session in sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify({
                email: userCredential.user.email,
                uid: userCredential.user.uid,
                loginTime: new Date().toISOString()
            }));

            // Get the redirect URL if it exists
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
            
            // Clear the redirect URL from storage
            sessionStorage.removeItem('redirectAfterLogin');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific Firebase auth errors
            switch (error.code) {
                case 'auth/user-not-found':
                    this.showMessage('No account found with this email address', 'error');
                    break;
                case 'auth/wrong-password':
                    this.showMessage('Incorrect password', 'error');
                    break;
                case 'auth/invalid-email':
                    this.showMessage('Invalid email address', 'error');
                    break;
                case 'auth/user-disabled':
                    this.showMessage('This account has been disabled', 'error');
                    break;
                case 'auth/too-many-requests':
                    this.showMessage('Too many failed attempts. Please try again later', 'error');
                    break;
                default:
                    this.showMessage('Login failed. Please try again', 'error');
            }
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Clear previous messages
        this.clearMessages();

        // Validate input
        if (!email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        // Validate password
        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters long', 'error');
            return;
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error');
            return;
        }

        try {
            // Create user with Firebase
            const userCredential = await window.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            
            // Registration successful
            this.showMessage('Account created successfully! Redirecting...', 'success');

            // Store login session in sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify({
                email: userCredential.user.email,
                uid: userCredential.user.uid,
                loginTime: new Date().toISOString()
            }));

            // Get the redirect URL if it exists
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
            
            // Clear the redirect URL from storage
            sessionStorage.removeItem('redirectAfterLogin');
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);

        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific Firebase auth errors
            switch (error.code) {
                case 'auth/email-already-in-use':
                    this.showMessage('An account with this email already exists', 'error');
                    break;
                case 'auth/invalid-email':
                    this.showMessage('Please enter a valid email address', 'error');
                    break;
                case 'auth/operation-not-allowed':
                    this.showMessage('Email/password accounts are not enabled', 'error');
                    break;
                case 'auth/weak-password':
                    this.showMessage('Password is too weak. Please choose a stronger password', 'error');
                    break;
                default:
                    this.showMessage('Registration failed. Please try again', 'error');
            }
        }
    }

    showMessage(message, type) {
        // Remove any existing messages
        this.clearMessages();

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;

        // Insert before the tab container
        const tabContainer = document.querySelector('.tab-container');
        tabContainer.parentNode.insertBefore(messageDiv, tabContainer);

        // Auto-remove after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    clearMessages() {
        // Remove any existing messages
        document.querySelectorAll('.error-message, .success-message').forEach(msg => {
            msg.remove();
        });
    }
}

// Initialize login manager
document.addEventListener('DOMContentLoaded', () => {
    new LoginManager();
});
