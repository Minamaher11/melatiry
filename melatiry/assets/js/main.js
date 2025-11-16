// =====================================================
// Egyptian Military Recruitment System - JavaScript
// =====================================================

/**
 * Initialize localStorage structure if it doesn't exist
 */
function initializeStorage() {
    // Initialize users array
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    // Initialize requests array
    if (!localStorage.getItem('requests')) {
        localStorage.setItem('requests', JSON.stringify([]));
    }
    // Initialize current user session
    if (!localStorage.getItem('currentUserId')) {
        localStorage.setItem('currentUserId', '');
    }
}

/**
 * Generate unique ID using timestamp and random number
 */
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate National ID (14 digits)
 */
function validateNationalId(id) {
    return /^\d{14}$/.test(id);
}

/**
 * Clear all error messages
 */
function clearErrors(formPrefix = '') {
    const errors = document.querySelectorAll(`.error${formPrefix ? '.' + formPrefix : ''}`);
    errors.forEach(error => {
        error.textContent = '';
    });
}

/**
 * Switch between Registration and Login tabs
 */
function switchTab(tabName, event) {
    // Hide all tabs
    document.getElementById('register-tab').classList.remove('active');
    document.getElementById('login-tab').classList.remove('active');

    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Fallback: find the button that corresponds to this tab
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach((btn, index) => {
            if ((tabName === 'register' && index === 0) || (tabName === 'login' && index === 1)) {
                btn.classList.add('active');
            }
        });
    }

    // Clear messages and errors
    clearErrors();
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');
    if (registerMessage) registerMessage.textContent = '';
    if (loginMessage) loginMessage.textContent = '';
}

/**
 * Register new user
 */
function registerUser(event) {
    event.preventDefault();
    clearErrors();

    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const nationalId = document.getElementById('nationalId').value.trim();
    const dob = document.getElementById('dob').value;
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    let isValid = true;

    // Validation
    if (!fullName) {
        document.getElementById('fullNameError').textContent = 'الاسم الكامل مطلوب';
        isValid = false;
    }

    if (!validateNationalId(nationalId)) {
        document.getElementById('nationalIdError').textContent = 'يجب أن يكون رقم البطاقة الوطنية 14 رقماً بالضبط';
        isValid = false;
    }

    if (!dob) {
        document.getElementById('dobError').textContent = 'تاريخ الميلاد مطلوب';
        isValid = false;
    }

    if (!address) {
        document.getElementById('addressError').textContent = 'العنوان مطلوب';
        isValid = false;
    }

    if (!phone) {
        document.getElementById('phoneError').textContent = 'رقم الهاتف مطلوب';
        isValid = false;
    }

    if (!validateEmail(email)) {
        document.getElementById('emailError').textContent = 'يرجى إدخال عنوان بريد إلكتروني صحيح';
        isValid = false;
    }

    if (password.length < 8) {
        document.getElementById('passwordError').textContent = 'يجب أن تكون كلمة المرور 8 أحرف على الأقل';
        isValid = false;
    }

    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'كلمات المرور غير متطابقة';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(u => u.nationalId === nationalId)) {
        document.getElementById('registerMessage').textContent = 'يوجد مستخدم بهذا الرقم القومي بالفعل';
        document.getElementById('registerMessage').className = 'message error';
        return;
    }

    // Create new user object
    const newUser = {
        id: generateId(),
        fullName,
        nationalId,
        dob,
        address,
        phone,
        email,
        password, // In real app, this would be hashed
        createdAt: new Date().toISOString()
    };

    // Save to localStorage
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Show success message
    const messageDiv = document.getElementById('registerMessage');
    messageDiv.textContent = 'تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول باستخدام رقم البطاقة الوطنية وكلمة المرور.';
    messageDiv.className = 'message success';

    // Reset form
    document.getElementById('registerForm').reset();

    // Redirect to login after 2 seconds
    setTimeout(() => {
        switchTab('login');
    }, 2000);
}

/**
 * Login user
 */
function loginUser(event) {
    event.preventDefault();
    clearErrors();

    const nationalId = document.getElementById('loginNationalId').value.trim();
    const password = document.getElementById('loginPassword').value;

    let isValid = true;

    if (!validateNationalId(nationalId)) {
        document.getElementById('loginNationalIdError').textContent = 'يجب أن يكون رقم البطاقة الوطنية 14 رقماً بالضبط';
        isValid = false;
    }

    if (!password) {
        document.getElementById('loginPasswordError').textContent = 'كلمة المرور مطلوبة';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Find user
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.nationalId === nationalId && u.password === password);

    if (!user) {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.textContent = 'رقم البطاقة الوطنية أو كلمة المرور غير صحيحة';
        messageDiv.className = 'message error';
        return;
    }

    // Save current user session
    localStorage.setItem('currentUserId', user.id);

    // Show success message
    const messageDiv = document.getElementById('loginMessage');
    messageDiv.textContent = `مرحباً بعودتك، ${user.fullName}! جارٍ التوجيه إلى طلباتك...`;
    messageDiv.className = 'message success';

    // Redirect to requests page
    setTimeout(() => {
        window.location.href = 'requests.html';
    }, 1500);
}

/**
 * Logout user
 */
function logoutUser(event) {
    event.preventDefault();
    localStorage.setItem('currentUserId', '');
    window.location.href = 'index.html';
}

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        // Redirect to auth page if not logged in
        if (window.location.pathname.includes('requests.html')) {
            window.location.href = 'auth.html';
        }
    }
}

/**
 * Update navigation based on auth status
 */
function updateNavigation() {
    const currentUserId = localStorage.getItem('currentUserId');
    const requestsLink = document.getElementById('requestsLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUserId && requestsLink && logoutBtn) {
        requestsLink.style.display = 'inline';
        logoutBtn.style.display = 'inline';
    } else if (requestsLink && logoutBtn) {
        requestsLink.style.display = 'none';
        logoutBtn.style.display = 'none';
    }
}

/**
 * Submit recruitment request
 */
function submitRequest(event) {
    event.preventDefault();
    clearErrors();

    const requestType = document.getElementById('requestType').value;
    const message = document.getElementById('message').value.trim();
    const fileUpload = document.getElementById('fileUpload').files[0];

    let isValid = true;

    if (!requestType) {
        document.getElementById('requestTypeError').textContent = 'يرجى اختيار نوع الطلب';
        isValid = false;
    }

    if (!fileUpload) {
        document.getElementById('fileError').textContent = 'يرجى رفع ملف';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    // Get current user ID
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        alert('يجب تسجيل الدخول لتقديم طلب');
        return;
    }

    // Get current user name
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === currentUserId);

    // Create new request
    const newRequest = {
        id: generateId(),
        userId: currentUserId,
        userName: currentUser?.fullName || 'غير معروف',
        type: requestType,
        message: message || 'لا توجد ملاحظات إضافية',
        filename: fileUpload.name,
        status: 'قيد المراجعة',
        createdAt: new Date().toISOString(),
        createdAtDisplay: new Date().toLocaleDateString('ar-EG')
    };

    // Save to localStorage
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    requests.push(newRequest);
    localStorage.setItem('requests', JSON.stringify(requests));

    // Show success message
    const messageDiv = document.getElementById('submitMessage');
    messageDiv.textContent = 'تم تقديم طلبك بنجاح! رقم المرجع: ' + newRequest.id.substring(0, 8);
    messageDiv.className = 'message success';

    // Reset form
    document.getElementById('requestForm').reset();

    // Reload requests display
    loadUserRequests();
}

/**
 * Load user requests
 */
function loadUserRequests() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        return;
    }

    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const userRequests = requests.filter(r => r.userId === currentUserId);

    const container = document.getElementById('requestsContainer');
    if (!container) {
        return;
    }

    if (userRequests.length === 0) {
        container.innerHTML = '<p class="no-requests">لم يتم تقديم أي طلبات بعد. قدم طلبك الأول أعلاه!</p>';
        return;
    }

    // Create request cards
    container.innerHTML = userRequests
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(request => `
        <div class="request-card">
            <h4>${request.type}</h4>
            <div class="request-info">
                <p><strong>الحالة:</strong> <span class="status-badge status-under-review">${request.status}</span></p>
                <p><strong>التاريخ:</strong> ${request.createdAtDisplay || new Date(request.createdAt).toLocaleDateString('ar-EG')}</p>
                <p><strong>الملف:</strong> ${request.filename}</p>
                <p><strong>الملاحظات:</strong> ${request.message}</p>
                <p><strong>رقم المرجع:</strong> ${request.id.substring(0, 8)}</p>
            </div>
            <div class="request-actions">
                <button class="btn btn-primary btn-small" onclick="viewRequestDetails('${request.id}')">عرض التفاصيل</button>
                <button class="btn btn-danger btn-small" onclick="deleteRequest('${request.id}')">حذف</button>
            </div>
        </div>
    `).join('');
}

/**
 * Delete request
 */
function deleteRequest(requestId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        return;
    }

    let requests = JSON.parse(localStorage.getItem('requests') || '[]');
    requests = requests.filter(r => r.id !== requestId);
    localStorage.setItem('requests', JSON.stringify(requests));

    loadUserRequests();
    alert('تم حذف الطلب بنجاح');
}

/**
 * View request details (placeholder for future expansion)
 */
function viewRequestDetails(requestId) {
    alert('رقم المرجع: ' + requestId.substring(0, 8) + '\n\nفي التطبيق الكامل، سيتم عرض معلومات مفصلة عن طلبك وأي تحديثات من فريق التجنيد.');
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
});

