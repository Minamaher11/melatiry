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
 * Validate Egyptian phone number (basic)
 */
function validatePhone(phone) {
    const normalized = phone.replace(/\s+/g, '');
    return /^(\+?20)?1[0-25]\d{8}$/.test(normalized);
}

/**
 * Calculate age from date string
 */
function calculateAge(dateString) {
    if (!dateString) return null;
    const today = new Date();
    const birthDate = new Date(dateString);
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Governorate codes extracted from national ID digits 8-9
 */
const governorateMap = {
    '01': 'القاهرة',
    '02': 'الإسكندرية',
    '03': 'بورسعيد',
    '04': 'السويس',
    '11': 'دمياط',
    '12': 'الدقهلية',
    '13': 'الشرقية',
    '14': 'القليوبية',
    '15': 'كفر الشيخ',
    '16': 'الغربية',
    '17': 'المنوفية',
    '18': 'البحيرة',
    '19': 'الإسماعيلية',
    '21': 'الجيزة',
    '22': 'بني سويف',
    '23': 'الفيوم',
    '24': 'المنيا',
    '25': 'أسيوط',
    '26': 'سوهاج',
    '27': 'قنا',
    '28': 'أسوان',
    '29': 'الأقصر',
    '31': 'البحر الأحمر',
    '32': 'الوادي الجديد',
    '33': 'مطروح',
    '34': 'شمال سيناء',
    '35': 'جنوب سيناء',
    '88': 'المصريين بالخارج'
};

/**
 * Extract gender from national ID (13th digit: odd=male, even=female)
 */
function getGenderFromNationalId(id) {
    if (!validateNationalId(id)) return null;
    const genderDigit = parseInt(id.charAt(12), 10);
    if (Number.isNaN(genderDigit)) return null;
    return genderDigit % 2 === 0 ? 'female' : 'male';
}

/**
 * Extract governorate name from national ID
 */
function getGovernorateFromNationalId(id) {
    if (!validateNationalId(id)) return null;
    const code = id.slice(7, 9);
    return governorateMap[code] || null;
}

/**
 * Extract birth date from national ID
 * Structure: C YY MM DD ... (C: century 1=1800s,2=1900s,3=2000s)
 */
function getBirthDateFromNationalId(id) {
    if (!validateNationalId(id)) return null;
    const centuryDigit = id.charAt(0);
    const yearPart = id.substr(1, 2);
    const monthPart = id.substr(3, 2);
    const dayPart = id.substr(5, 2);

    const centuryOffsets = {
        '1': 1800,
        '2': 1900,
        '3': 2000,
        '4': 2100
    };

    const baseYear = centuryOffsets[centuryDigit];
    if (baseYear === undefined) return null;

    const year = baseYear + parseInt(yearPart, 10);
    const month = parseInt(monthPart, 10);
    const day = parseInt(dayPart, 10);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;

    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
}

/**
 * Update derived info card and related UI chips
 */
function updateNationalIdInsights({ gender = null, governorate = null, birthDate = null } = {}) {
    const genderEl = document.getElementById('derivedGender');
    const governorateEl = document.getElementById('derivedGovernorate');
    const dobEl = document.getElementById('derivedDob');

    const genderLabel = gender === 'male' ? 'ذكر' : gender === 'female' ? 'أنثى' : '-';
    const governorateLabel = governorate || '-';
    const dobLabel = birthDate ? new Date(birthDate).toLocaleDateString('ar-EG') : '-';

    if (genderEl) genderEl.textContent = genderLabel;
    if (governorateEl) governorateEl.textContent = governorateLabel;
    if (dobEl) dobEl.textContent = dobLabel;
}

/**
 * Auto update derived info based on national ID
 */
function setupNationalIdAutoFill() {
    const nationalIdInput = document.getElementById('nationalId');
    if (!nationalIdInput) {
        return;
    }

    const applyAutofill = () => {
        const idValue = nationalIdInput.value.trim();
        const birthDate = getBirthDateFromNationalId(idValue);
        const gender = getGenderFromNationalId(idValue);
        const governorate = getGovernorateFromNationalId(idValue);

        updateNationalIdInsights({ gender, governorate, birthDate });
    };

    nationalIdInput.addEventListener('input', applyAutofill);
    applyAutofill();
}

/**
 * Get the currently authenticated user object
 */
function getCurrentUser() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) return null;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find(u => u.id === currentUserId) || null;
}

/**
 * Render user summary card (requests page)
 */
function renderUserSummary() {
    const card = document.getElementById('userSummaryCard');
    if (!card) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        card.style.display = 'none';
        return;
    }

    card.style.display = 'block';

    const genderLabel = currentUser.gender === 'male' ? 'ذكر' : currentUser.gender === 'female' ? 'أنثى' : '-';

    const fieldMap = {
        summaryName: currentUser.fullName || '-',
        summaryNationalId: currentUser.nationalId || '-',
        summaryGovernorate: currentUser.governorate || getGovernorateFromNationalId(currentUser.nationalId || '') || '-',
        summaryDob: currentUser.dob ? new Date(currentUser.dob).toLocaleDateString('ar-EG') : '-',
        summaryPhone: currentUser.phone || '-',
        summaryEmail: currentUser.email || '-'
    };

    Object.entries(fieldMap).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    const genderChip = document.getElementById('summaryGenderChip');
    if (genderChip) {
        genderChip.textContent = genderLabel !== '-' ? `الجنس: ${genderLabel}` : 'الجنس غير محدد';
    }
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
    } else if (fullName.split(' ').filter(Boolean).length < 2) {
        document.getElementById('fullNameError').textContent = 'يرجى كتابة الاسم الثلاثي كما في البطاقة';
        isValid = false;
    }

    let dob = null;

    if (!validateNationalId(nationalId)) {
        document.getElementById('nationalIdError').textContent = 'يجب أن يكون رقم البطاقة الوطنية 14 رقماً بالضبط';
        isValid = false;
    } else {
        const gender = getGenderFromNationalId(nationalId);
        const governorate = getGovernorateFromNationalId(nationalId);
        dob = getBirthDateFromNationalId(nationalId);

        if (gender !== 'male') {
            document.getElementById('nationalIdError').textContent = 'المنصة مخصصة للذكور فقط حسب بيانات الرقم القومي';
            isValid = false;
        }
        if (!governorate) {
            document.getElementById('nationalIdError').textContent = 'رمز المحافظة غير معروف في الرقم القومي';
            isValid = false;
        }
        if (!dob) {
            document.getElementById('nationalIdError').textContent = 'لا يمكن استخراج تاريخ الميلاد من الرقم القومي';
            isValid = false;
        }
    }

    const age = calculateAge(dob);
    if (!dob) {
        // Error already shown in nationalId validation
        isValid = false;
    } else if (age === null || age < 18 || age > 35) {
        document.getElementById('nationalIdError').textContent = 'يجب أن يتراوح العمر بين 18 و35 عاماً حسب تاريخ الميلاد في الرقم القومي';
        isValid = false;
    }

    if (!address) {
        document.getElementById('addressError').textContent = 'العنوان مطلوب';
        isValid = false;
    } else if (address.length < 10) {
        document.getElementById('addressError').textContent = 'يرجى إدخال عنوان تفصيلي (10 أحرف على الأقل)';
        isValid = false;
    }

    if (!phone) {
        document.getElementById('phoneError').textContent = 'رقم الهاتف مطلوب';
        isValid = false;
    } else if (!validatePhone(phone)) {
        document.getElementById('phoneError').textContent = 'يرجى إدخال رقم هاتف مصري صحيح';
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

    const gender = getGenderFromNationalId(nationalId);
    const governorate = getGovernorateFromNationalId(nationalId);

    // Create new user object
    const newUser = {
        id: generateId(),
        fullName,
        nationalId,
        gender,
        governorate,
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
    messageDiv.textContent = `تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول. تم ربط حسابك بمحافظة ${governorate}.`;
    messageDiv.className = 'message success';

    // Reset form
    document.getElementById('registerForm').reset();
    updateNationalIdInsights();

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
    } else if (getGenderFromNationalId(nationalId) !== 'male') {
        document.getElementById('loginNationalIdError').textContent = 'الخدمة متاحة للذكور فقط طبقاً للرقم القومي';
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
        if (window.location.pathname.includes('requests.html') || window.location.pathname.includes('profile.html')) {
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
    const profileLink = document.getElementById('profileLink');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUserId) {
        if (requestsLink) requestsLink.style.display = 'inline';
        if (profileLink) profileLink.style.display = 'inline';
        if (logoutBtn) logoutBtn.style.display = 'inline';
    } else {
        if (requestsLink) requestsLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

/**
 * Submit recruitment request
 */
function submitRequest(event) {
    event.preventDefault();
    clearErrors();

    const requestType = document.getElementById('requestType').value;
    const requestedGovernorate = document.getElementById('requestedGovernorate').value;
    const message = document.getElementById('message').value.trim();
    const fileUpload = document.getElementById('fileUpload').files[0];

    let isValid = true;

    if (!requestType) {
        document.getElementById('requestTypeError').textContent = 'يرجى اختيار نوع الطلب';
        isValid = false;
    }

    if (!requestedGovernorate) {
        document.getElementById('requestedGovernorateError').textContent = 'يرجى اختيار المحافظة المطلوبة';
        isValid = false;
    }

    if (!fileUpload) {
        document.getElementById('fileError').textContent = 'يرجى رفع ملف';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('يجب تسجيل الدخول لتقديم طلب');
        return;
    }

    // Create new request
    const newRequest = {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.fullName || 'غير معروف',
        type: requestType,
        message: message || 'لا توجد ملاحظات إضافية',
        filename: fileUpload.name,
        governorate: currentUser.governorate || getGovernorateFromNationalId(currentUser.nationalId || '') || 'غير محدد',
        requestedGovernorate: requestedGovernorate,
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
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const userRequests = requests.filter(r => r.userId === currentUser.id);

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
                <p><strong>محافظة الميلاد:</strong> ${request.governorate || 'غير محدد'}</p>
                <p><strong>المحافظة المطلوبة:</strong> ${request.requestedGovernorate || 'غير محدد'}</p>
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
 * Load and display user profile
 */
function loadProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    const genderLabel = currentUser.gender === 'male' ? 'ذكر' : currentUser.gender === 'female' ? 'أنثى' : '-';
    const dobDisplay = currentUser.dob ? new Date(currentUser.dob).toLocaleDateString('ar-EG') : '-';
    const createdAtDisplay = currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('ar-EG') : '-';

    const fieldMap = {
        profileName: currentUser.fullName || '-',
        profileNationalId: currentUser.nationalId || '-',
        profileGender: genderLabel,
        profileGovernorate: currentUser.governorate || getGovernorateFromNationalId(currentUser.nationalId || '') || '-',
        profileDob: dobDisplay,
        profileAddress: currentUser.address || '-',
        profilePhone: currentUser.phone || '-',
        profileEmail: currentUser.email || '-',
        profileCreatedAt: createdAtDisplay
    };

    Object.entries(fieldMap).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });

    const genderChip = document.getElementById('profileGenderChip');
    if (genderChip) {
        genderChip.textContent = genderLabel !== '-' ? `الجنس: ${genderLabel}` : 'الجنس غير محدد';
    }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
    setupNationalIdAutoFill();
    renderUserSummary();
});

