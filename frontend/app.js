// ============================================
// CONFIGURATION
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// STATE MANAGEMENT
// ============================================
let currentUser = null;
let authToken = null;
let uploadedImages = []; // Store image filenames for display

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    // Auth
    authSection: document.getElementById('authSection'),
    appSection: document.getElementById('appSection'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    navbar: document.getElementById('navbar'),
    navUser: document.getElementById('navUser'),
    userGreeting: document.getElementById('userGreeting'),
    
    // Stats
    statUsername: document.getElementById('statUsername'),
    statEmail: document.getElementById('statEmail'),
    statTodos: document.getElementById('statTodos'),
    statImages: document.getElementById('statImages'),
    
    // Tabs
    todosTab: document.getElementById('todosTab'),
    imagesTab: document.getElementById('imagesTab'),
    tabTodos: document.getElementById('tabTodos'),
    tabImages: document.getElementById('tabImages'),
    profileTab: document.getElementById('profileTab'),
    tabProfile: document.getElementById('tabProfile'),
    
    // Todos
    todoInput: document.getElementById('todoInput'),
    todosList: document.getElementById('todosList'),
    
    // Images
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    previewContainer: document.getElementById('previewContainer'),
    fileName: document.getElementById('fileName'),
    imagesList: document.getElementById('imagesList'),

    // Profile
    profileUsername: document.getElementById('profileUsername'),
    profileEmail: document.getElementById('profileEmail'),
    profileCurrentPassword: document.getElementById('profileCurrentPassword'),
    profileNewPassword: document.getElementById('profileNewPassword'),
    profileConfirmPassword: document.getElementById('profileConfirmPassword'),
    
    // Modals
    editModal: document.getElementById('editModal'),
    editTodoId: document.getElementById('editTodoId'),
    editTodoTitle: document.getElementById('editTodoTitle'),
    editTodoCompleted: document.getElementById('editTodoCompleted'),
    imageModal: document.getElementById('imageModal'),
    modalImage: document.getElementById('modalImage'),
    
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // Enter key for login
    document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Enter key for register
    document.getElementById('regPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
    
    // Enter key for todo
    elements.todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createTodo();
    });

    // Enter key for profile update
    elements.profileConfirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') updateProfile();
    });
    
    // Close modals on outside click
    elements.editModal.addEventListener('click', (e) => {
        if (e.target === elements.editModal) closeEditModal();
    });
    
    elements.imageModal.addEventListener('click', (e) => {
        if (e.target === elements.imageModal) closeImageModal();
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEditModal();
            closeImageModal();
        }
    });
}

// ============================================
// AUTH FUNCTIONS
// ============================================
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    elements.authSection.classList.remove('hidden');
    elements.appSection.classList.add('hidden');
    elements.navUser.classList.add('hidden');
}

function showApp() {
    elements.authSection.classList.add('hidden');
    elements.appSection.classList.remove('hidden');
    elements.navUser.classList.remove('hidden');
    
    updateUserStats();
    fetchTodos();
    fetchImages();
    loadProfileForm();
    
    elements.userGreeting.textContent = `Hello, ${currentUser.username}!`;
}

function showLogin() {
    elements.loginForm.classList.remove('hidden');
    elements.registerForm.classList.add('hidden');
}

function showRegister() {
    elements.loginForm.classList.add('hidden');
    elements.registerForm.classList.remove('hidden');
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showToast('Login successful!', 'success');
            showApp();
            
            // Clear form
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Connection error. Is the server running?', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    if (!username || !email || !password) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            showLogin();
            
            // Pre-fill email
            document.getElementById('loginEmail').value = email;
            
            // Clear register form
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Connection error. Is the server running?', 'error');
    } finally {
        hideLoading();
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('uploadedImages');
    authToken = null;
    currentUser = null;
    uploadedImages = [];
    
    showToast('Logged out successfully', 'info');
    showAuth();
}

// ============================================
// USER STATS
// ============================================
function updateUserStats() {
    if (currentUser) {
        elements.statUsername.textContent = currentUser.username;
        elements.statEmail.textContent = currentUser.email;
        elements.statTodos.textContent = currentUser.todo_count || 0;
        elements.statImages.textContent = currentUser.image_count || 0;
    }
}

function updateLocalUserStats(field, value) {
    if (field === 'todo_count') {
        currentUser.todo_count = value;
        elements.statTodos.textContent = value;
    } else if (field === 'image_count') {
        currentUser.image_count = value;
        elements.statImages.textContent = value;
    }
    localStorage.setItem('user', JSON.stringify(currentUser));
}

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tab) {
    const isTodos = tab === 'todos';
    const isImages = tab === 'images';
    const isProfile = tab === 'profile';

    elements.todosTab.classList.toggle('hidden', !isTodos);
    elements.imagesTab.classList.toggle('hidden', !isImages);
    elements.profileTab.classList.toggle('hidden', !isProfile);

    elements.tabTodos.classList.toggle('active', isTodos);
    elements.tabImages.classList.toggle('active', isImages);
    elements.tabProfile.classList.toggle('active', isProfile);

    if (isProfile) {
        loadProfileForm();
    }
}

// ============================================
// TODO FUNCTIONS
// ============================================
async function fetchTodos() {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            renderTodos(data.todos);
            updateLocalUserStats('todo_count', data.count);
        } else {
            showToast(data.message || 'Failed to fetch todos', 'error');
        }
    } catch (error) {
        console.error('Fetch todos error:', error);
        showToast('Failed to load todos', 'error');
    }
}

function renderTodos(todos) {
    if (todos.length === 0) {
        elements.todosList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>No todos yet. Create your first one!</p>
            </div>
        `;
        return;
    }
    
    elements.todosList.innerHTML = todos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''} 
                onchange="toggleTodo(${todo.id}, ${!todo.completed}, '${escapeHtml(todo.title)}')"
            >
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                <div class="todo-meta">ID: ${todo.id}</div>
            </div>
            <div class="todo-actions">
                <button class="btn btn-primary btn-icon" onclick="openEditModal(${todo.id}, '${escapeHtml(todo.title)}', ${todo.completed})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-icon" onclick="deleteTodo(${todo.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function createTodo() {
    const title = elements.todoInput.value.trim();
    
    if (!title) {
        showToast('Please enter a todo title', 'warning');
        elements.todoInput.focus();
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Todo created!', 'success');
            elements.todoInput.value = '';
            fetchTodos();
        } else {
            showToast(data.message || 'Failed to create todo', 'error');
        }
    } catch (error) {
        console.error('Create todo error:', error);
        showToast('Failed to create todo', 'error');
    } finally {
        hideLoading();
    }
}

async function toggleTodo(id, completed, title) {
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, completed })
        });
        
        const data = await response.json();
        
        if (data.success) {
            fetchTodos();
        } else {
            showToast(data.message || 'Failed to update todo', 'error');
        }
    } catch (error) {
        console.error('Toggle todo error:', error);
        showToast('Failed to update todo', 'error');
    }
}

async function deleteTodo(id) {
    if (!confirm('Are you sure you want to delete this todo?')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Todo deleted!', 'success');
            fetchTodos();
        } else {
            showToast(data.message || 'Failed to delete todo', 'error');
        }
    } catch (error) {
        console.error('Delete todo error:', error);
        showToast('Failed to delete todo', 'error');
    } finally {
        hideLoading();
    }
}

// Edit Modal
function openEditModal(id, title, completed) {
    elements.editTodoId.value = id;
    elements.editTodoTitle.value = title;
    elements.editTodoCompleted.checked = completed;
    elements.editModal.classList.remove('hidden');
    elements.editTodoTitle.focus();
}

function closeEditModal() {
    elements.editModal.classList.add('hidden');
}

async function updateTodo() {
    const id = elements.editTodoId.value;
    const title = elements.editTodoTitle.value.trim();
    const completed = elements.editTodoCompleted.checked;
    
    if (!title) {
        showToast('Title cannot be empty', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, completed })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Todo updated!', 'success');
            closeEditModal();
            fetchTodos();
        } else {
            showToast(data.message || 'Failed to update todo', 'error');
        }
    } catch (error) {
        console.error('Update todo error:', error);
        showToast('Failed to update todo', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// IMAGE FUNCTIONS
// ============================================
function previewImage(event) {
    const file = event.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            elements.imagePreview.src = e.target.result;
            elements.fileName.textContent = file.name;
            elements.previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        elements.previewContainer.classList.add('hidden');
    }
}

async function uploadImage() {
    const fileInput = elements.imageInput;
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('Please select an image first', 'warning');
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Image uploaded successfully!', 'success');

            await fetchImages();
            
            // Clear input
            fileInput.value = '';
            elements.previewContainer.classList.add('hidden');
        } else {
            showToast(data.message || 'Failed to upload image', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Failed to upload image', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteImage(filename) {
    if (!confirm('Are you sure you want to delete this image?')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/upload/${filename}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Image deleted!', 'success');

            await fetchImages();
        } else {
            showToast(data.message || 'Failed to delete image', 'error');
        }
    } catch (error) {
        console.error('Delete image error:', error);
        showToast('Failed to delete image', 'error');
    } finally {
        hideLoading();
    }
}

function renderImages() {
    if (uploadedImages.length === 0) {
        elements.imagesList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-image"></i>
                <p>No images uploaded yet.</p>
            </div>
        `;
        return;
    }
    
    elements.imagesList.innerHTML = uploadedImages.map(img => `
        <div class="image-card" onclick="viewImage('${img.filename}')">
            <img src="http://localhost:5000${img.path}" alt="${img.originalName || img.filename}" 
                 onerror="this.src='https://via.placeholder.com/150?text=Image+Not+Found'">
            <div class="image-overlay">
                <button class="btn-delete-img" onclick="event.stopPropagation(); deleteImage('${img.filename}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function fetchImages() {
    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (data.success) {
            uploadedImages = data.images;
            renderImages();
            updateLocalUserStats('image_count', data.count);
        } else {
            showToast(data.message || 'Failed to fetch images', 'error');
        }
    } catch (error) {
        console.error('Fetch images error:', error);
        showToast('Failed to load images', 'error');
    }
}

function viewImage(filename) {
    const img = uploadedImages.find(i => i.filename === filename);
    if (img) {
        elements.modalImage.src = `http://localhost:5000${img.path}`;
        elements.imageModal.classList.remove('hidden');
    }
}

function closeImageModal() {
    elements.imageModal.classList.add('hidden');
}

function saveImagesToStorage() {
    localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));
}

// ============================================
// PROFILE FUNCTIONS
// ============================================
function loadProfileForm() {
    if (!currentUser) return;
    elements.profileUsername.value = currentUser.username || '';
    elements.profileEmail.value = currentUser.email || '';
    elements.profileCurrentPassword.value = '';
    elements.profileNewPassword.value = '';
    elements.profileConfirmPassword.value = '';
}

function resetProfileForm() {
    loadProfileForm();
    showToast('Profile form reset', 'info');
}

async function updateProfile() {
    const username = elements.profileUsername.value.trim();
    const currentPassword = elements.profileCurrentPassword.value;
    const newPassword = elements.profileNewPassword.value;
    const confirmPassword = elements.profileConfirmPassword.value;

    if (!username) {
        showToast('Username cannot be empty', 'warning');
        elements.profileUsername.focus();
        return;
    }

    if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) {
            showToast('Enter current password to change password', 'warning');
            elements.profileCurrentPassword.focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New password and confirm password do not match', 'error');
            elements.profileConfirmPassword.focus();
            return;
        }
    }

    const payload = { username };
    if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
    }

    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUserStats();
            elements.userGreeting.textContent = `Hello, ${currentUser.username}!`;
            loadProfileForm();
            showToast('Profile updated successfully', 'success');
        } else {
            showToast(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Failed to update profile', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function showLoading() {
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'");
}
