// ==================== استيراد Firebase Functions ====================
import { auth, database } from "./app.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, update, remove, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== المتغيرات العامة ====================
let currentData = {
    users: {},
    welcome: {},
    botResponses: {},
    faqs: {},
    contacts: {},
    messages: {}
};

// ==================== دوال مساعدة للأدمن ====================
const adminUtils = {
    showToast: function(message, type = 'success') {
        const toast = document.getElementById('global-toast');
        if (!toast) {
            const newToast = document.createElement('div');
            newToast.id = 'global-toast';
            newToast.className = 'qc-toast';
            document.body.appendChild(newToast);
        }
        
        const toastElement = document.getElementById('global-toast');
        let bgColor, textColor;
        switch(type) {
            case 'success':
                bgColor = '#4CAF50';
                textColor = 'white';
                break;
            case 'error':
                bgColor = '#f44336';
                textColor = 'white';
                break;
            case 'info':
                bgColor = '#2196F3';
                textColor = 'white';
                break;
            case 'warning':
                bgColor = '#ff9800';
                textColor = 'white';
                break;
            default:
                bgColor = '#9C27B0';
                textColor = 'white';
        }
        
        toastElement.textContent = message;
        toastElement.style.backgroundColor = bgColor;
        toastElement.style.color = textColor;
        toastElement.classList.add('visible');
        
        setTimeout(() => {
            toastElement.classList.remove('visible');
        }, 4000);
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    createModalHeader: function(title) {
        return `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close-unified" aria-label="إغلاق">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    },
    
    setupModalClose: function(modal, modalRoot) {
        const closeBtn = modal.querySelector('.modal-close-unified');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalRoot.style.display === 'block') {
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            }
        });
    },
    
    formatDate: function(timestamp) {
        if (!timestamp) return 'غير معروف';
        const date = new Date(timestamp);
        return date.toLocaleString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    getIconList: function() {
        return [
            'fas fa-question', 'fas fa-info', 'fas fa-book', 'fas fa-graduation-cap',
            'fas fa-user', 'fas fa-users', 'fas fa-chalkboard-teacher', 'fas fa-calendar',
            'fas fa-clock', 'fas fa-money-bill', 'fas fa-credit-card', 'fas fa-envelope',
            'fas fa-phone', 'fas fa-map-marker', 'fas fa-globe', 'fas fa-lock',
            'fas fa-unlock', 'fas fa-wifi', 'fas fa-download', 'fas fa-upload',
            'fas fa-cloud', 'fas fa-database', 'fas fa-server', 'fas fa-code',
            'fas fa-cogs', 'fas fa-tools', 'fas fa-wrench', 'fas fa-cog',
            'fas fa-star', 'fas fa-heart', 'fas fa-thumbs-up', 'fas fa-flag',
            'fas fa-bell', 'fas fa-comment', 'fas fa-comments', 'fas fa-paper-plane',
            'fas fa-home', 'fas fa-building', 'fas fa-school', 'fas fa-university',
            'fas fa-briefcase', 'fas fa-laptop', 'fas fa-mobile', 'fas fa-tablet',
            'fas fa-tv', 'fas fa-camera', 'fas fa-music', 'fas fa-gamepad',
            'fas fa-football-ball', 'fas fa-basketball-ball', 'fas fa-baseball-ball',
            'fas fa-car', 'fas fa-bus', 'fas fa-train', 'fas fa-plane',
            'fas fa-ship', 'fas fa-bicycle', 'fas fa-motorcycle', 'fas fa-walking',
            'fas fa-bed', 'fas fa-bath', 'fas fa-utensils', 'fas fa-coffee',
            'fas fa-beer', 'fas fa-wine-glass', 'fas fa-cocktail', 'fas fa-hamburger',
            'fas fa-pizza', 'fas fa-ice-cream', 'fas fa-cake', 'fas fa-cookie'
        ];
    }
};

// ==================== إدارة عرض الأقسام كبطاقات ====================
function initAdminSections() {
    const sectionCards = document.querySelectorAll('.section-card');
    const resultContainer = document.getElementById('admin-result-container');
    const dynamicContent = document.getElementById('dynamic-section-content');
    const placeholder = resultContainer.querySelector('.result-placeholder');
    
    // تأكد من إظهار الرسالة الافتراضية في البداية
    if (placeholder) {
        placeholder.classList.add('active');
        placeholder.style.display = 'block';
    }
    
    // إخفاء المحتوى الديناميكي في البداية
    if (dynamicContent) {
        dynamicContent.classList.remove('active');
        dynamicContent.style.display = 'none';
    }
    
    sectionCards.forEach(card => {
        card.addEventListener('click', () => {
            // إزالة النشط من جميع البطاقات
            sectionCards.forEach(c => c.classList.remove('active'));
            // إضافة النشط للبطاقة المختارة
            card.classList.add('active');
            
            const sectionId = card.dataset.section;
            loadSectionContent(sectionId);
            
            // إخفاء الرسالة الافتراضية
            if (placeholder) {
                placeholder.classList.remove('active');
                placeholder.style.display = 'none';
            }
            
            // إظهار المحتوى الديناميكي
            if (dynamicContent) {
                dynamicContent.classList.add('active');
                dynamicContent.style.display = 'block';
            }
        });
    });
    
    // لا يتم تحميل أي قسم تلقائياً - يبقى فارغاً حتى الضغط على قسم
}

// ==================== تحميل محتوى القسم ====================
function loadSectionContent(sectionId) {
    const dynamicContent = document.getElementById('dynamic-section-content');
    const placeholder = document.querySelector('.result-placeholder');
    
    if (!dynamicContent) return;
    
    // إخفاء الرسالة الافتراضية إذا كانت مرئية
    if (placeholder && placeholder.classList.contains('active')) {
        placeholder.classList.remove('active');
        placeholder.style.display = 'none';
    }
    
    // مسح المحتوى السابق
    dynamicContent.innerHTML = '';
    
    // بناء محتوى القسم
    let sectionHTML = '';
    
    switch(sectionId) {
        case 'users-section':
            sectionHTML = getUsersSectionHTML();
            break;
        case 'welcome-section':
            sectionHTML = getWelcomeSectionHTML();
            break;
        case 'bot-section':
            sectionHTML = getBotSectionHTML();
            break;
        case 'faq-section':
            sectionHTML = getFaqSectionHTML();
            break;
        case 'contact-section':
            sectionHTML = getContactSectionHTML();
            break;
        case 'messages-section':
            sectionHTML = getMessagesSectionHTML();
            break;
    }
    
    dynamicContent.innerHTML = sectionHTML;
    
    // إظهار المحتوى الديناميكي
    dynamicContent.classList.add('active');
    dynamicContent.style.display = 'block';
    
    // تهيئة القسم بعد تحميل HTML
    setTimeout(() => {
        switch(sectionId) {
            case 'users-section':
                loadUsersSection();
                break;
            case 'welcome-section':
                loadWelcomeSection();
                break;
            case 'bot-section':
                loadBotSection();
                break;
            case 'faq-section':
                loadFaqSection();
                break;
            case 'contact-section':
                loadContactSection();
                break;
            case 'messages-section':
                loadMessagesSection();
                break;
        }
    }, 100);
}

// ==================== دوال بناء HTML للأقسام ====================
function getUsersSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-users"></i>
            <span data-i18n="admin.users.title">إدارة المستخدمين</span>
        </div>
        <div class="add-btn-container">
            <button id="add-user-btn" class="add-btn">
                <i class="fas fa-user-plus"></i> 
                <span data-i18n="admin.users.add">إضافة مستخدم جديد</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-users" class="form-control" 
                       placeholder="ابحث في المستخدمين..." data-i18n-placeholder="admin.users.search">
            </div>
            
            <div id="users-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <span data-i18n="admin.users.noData">جاري تحميل بيانات المستخدمين...</span>
                </div>
            </div>
        </div>
    `;
}

function getWelcomeSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-home"></i>
            <span data-i18n="admin.welcome.title">إدارة رسالة الترحيب</span>
        </div>
        
        <div class="section-content">
            <div class="admin-form">
                <div class="form-group">
                    <label for="welcome-text-ar" data-i18n="admin.welcome.textAr">النص العربي</label>
                    <textarea id="welcome-text-ar" class="form-control" rows="6" 
                              placeholder="اكتب رسالة الترحيب باللغة العربية..."></textarea>
                </div>
                <div class="form-group">
                    <label for="welcome-text-en" data-i18n="admin.welcome.textEn">النص الإنجليزي</label>
                    <textarea id="welcome-text-en" class="form-control" rows="6" 
                              placeholder="Write welcome message in English..."></textarea>
                </div>
                <div class="form-buttons">
                    <button id="save-welcome" class="btn">
                        <i class="fas fa-save"></i>
                        <span data-i18n="admin.common.save">حفظ</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getBotSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-robot"></i>
            <span data-i18n="admin.bot.title">إدارة ردود البوت</span>
        </div>
        <div class="add-btn-container">
            <button id="add-bot-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.bot.add">إضافة رد جديد</span>
            </button>
            <button id="import-bot-json" class="add-btn">
                <i class="fas fa-file-import"></i> 
                <span data-i18n="admin.bot.import">استيراد من JSON</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-bot" class="form-control" 
                       placeholder="ابحث في ردود البوت..." data-i18n-placeholder="admin.bot.search">
            </div>
            
            <div id="bot-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-robot"></i>
                    <span data-i18n="admin.bot.noData">جاري تحميل ردود البوت...</span>
                </div>
            </div>
        </div>
    `;
}

function getFaqSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-question-circle"></i>
            <span data-i18n="admin.faq.title">إدارة الأسئلة الشائعة</span>
        </div>
        <div class="add-btn-container">
            <button id="add-faq-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.faq.add">إضافة سؤال جديد</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-faq" class="form-control" 
                       placeholder="ابحث في الأسئلة..." data-i18n-placeholder="admin.faq.search">
            </div>
            
            <div id="faq-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-question-circle"></i>
                    <span data-i18n="admin.faq.noData">جاري تحميل الأسئلة الشائعة...</span>
                </div>
            </div>
        </div>
    `;
}

function getContactSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-address-book"></i>
            <span data-i18n="admin.contact.title">إدارة معلومات التواصل</span>
        </div>
        <div class="add-btn-container">
            <button id="add-contact-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.contact.add">إضافة وسيلة تواصل</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-contact" class="form-control" 
                       placeholder="ابحث في معلومات التواصل..." data-i18n-placeholder="admin.contact.search">
            </div>
            
            <div id="contact-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-address-book"></i>
                    <span data-i18n="admin.contact.noData">جاري تحميل معلومات التواصل...</span>
                </div>
            </div>
        </div>
    `;
}

function getMessagesSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-envelope"></i>
            <span data-i18n="admin.messages.title">الرسائل الواردة</span>
        </div>
        
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-messages" class="form-control" 
                       placeholder="ابحث في الرسائل..." data-i18n-placeholder="admin.messages.search">
            </div>
            
            <div class="filters">
                <select id="message-status-filter" class="form-control">
                    <option value="">جميع الحالات</option>
                    <option value="new">جديد</option>
                    <option value="read">مقروء</option>
                    <option value="replied">تم الرد</option>
                </select>
            </div>
            
            <div id="messages-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-envelope"></i>
                    <span data-i18n="admin.messages.noData">جاري تحميل الرسائل...</span>
                </div>
            </div>
        </div>
    `;
}

// ==================== دوال مساعدة للبطاقات ====================
function getUserIcon(role) {
    switch(role) {
        case 'admin': return 'fas fa-crown';
        case 'student': return 'fas fa-user-graduate';
        case 'parent': return 'fas fa-user-friends';
        default: return 'fas fa-user';
    }
}

function getRoleBadge(role) {
    let color = '#95a5a6';
    let text = '?';
    
    switch(role) {
        case 'admin': 
            color = '#e74c3c';
            text = 'A';
            break;
        case 'student': 
            color = '#3498db';
            text = 'S';
            break;
        case 'parent': 
            color = '#2ecc71';
            text = 'P';
            break;
    }
    
    return `<div class="role-badge" style="background: ${color}">${text}</div>`;
}

function getMessageBadge(status) {
    let color = '#95a5a6';
    let text = '?';
    
    switch(status) {
        case 'new': 
            color = '#3498db';
            text = 'N';
            break;
        case 'read': 
            color = '#2ecc71';
            text = 'R';
            break;
        case 'replied': 
            color = '#9b59b6';
            text = 'D';
            break;
    }
    
    return `<div class="role-badge" style="background: ${color}">${text}</div>`;
}

// ==================== دالة لعرض البيانات كبطاقات ====================
function renderDataAsCards(data, containerId, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <span>لا توجد بيانات</span>
            </div>
        `;
        return;
    }
    
    Object.entries(data).forEach(([key, item]) => {
        if (!item) return;
        
        const card = document.createElement('div');
        card.className = 'data-card';
        card.onclick = () => openItemModal(key, item, type);
        
        let icon = 'fas fa-question';
        let title = 'بدون عنوان';
        let badge = '';
        
        switch(type) {
            case 'user':
                icon = getUserIcon(item.role);
                // عرض اسم المستخدم بدلاً من البريد
                title = item.name || item.email || 'بدون اسم';
                if (title.length > 20) title = title.substring(0, 20) + '...';
                badge = getRoleBadge(item.role);
                break;
            case 'bot':
                icon = 'fas fa-robot';
                const question = typeof item.question === 'object' ? 
                    (item.question.ar || item.question.en || 'بدون سؤال') : 
                    item.question || 'بدون سؤال';
                title = question.length > 25 ? question.substring(0, 25) + '...' : question;
                break;
            case 'faq':
                icon = item.icon || 'fas fa-question';
                const faqQuestion = typeof item.question === 'object' ? 
                    (item.question.ar || item.question.en || 'بدون سؤال') : 
                    item.question || 'بدون سؤال';
                title = faqQuestion.length > 25 ? faqQuestion.substring(0, 25) + '...' : faqQuestion;
                break;
            case 'contact':
                icon = item.icon || 'fas fa-link';
                const name = typeof item.name === 'object' ? 
                    (item.name.ar || item.name.en || 'بدون اسم') : 
                    item.name || 'بدون اسم';
                title = name.length > 25 ? name.substring(0, 25) + '...' : name;
                break;
            case 'message':
                icon = 'fas fa-envelope';
                title = item.name || 'بدون اسم';
                if (title.length > 20) title = title.substring(0, 20) + '...';
                badge = getMessageBadge(item.status);
                break;
        }
        
        card.innerHTML = `
            ${badge}
            <i class="${icon}"></i>
            <h4>${title}</h4>
        `;
        
        container.appendChild(card);
    });
}

// ==================== دالة فتح المودال ====================
function openItemModal(key, item, type) {
    switch(type) {
        case 'user':
            editUser(key);
            break;
        case 'bot':
            editBotResponse(key);
            break;
        case 'faq':
            editFaq(key);
            break;
        case 'contact':
            editContact(key);
            break;
        case 'message':
            viewMessage(key);
            break;
    }
}

// ==================== قسم إدارة المستخدمين ====================
function loadUsersSection() {
    const container = document.getElementById('users-table-body');
    const searchInput = document.getElementById('search-users');
    const addUserBtn = document.getElementById('add-user-btn');

    if (!container) return;

    let usersData = {};
    let searchQuery = '';

    function renderUsers() {
        let filteredData = usersData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(usersData).forEach(([key, user]) => {
                if (!user) return;
                const searchText = `${user.email || ''} ${user.name || ''} ${user.role || ''}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = user;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'users-table-body', 'user');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderUsers();
        });
    }

    // زر الإضافة
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            openUserModal();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'users'), (snapshot) => {
        usersData = snapshot.val() || {};
        window.usersData = usersData;
        renderUsers();
    }, (error) => {
        console.error('❌ خطأ في تحميل المستخدمين:', error);
        adminUtils.showToast('خطأ في تحميل المستخدمين', 'error');
    });
}

// ==================== قسم رسالة الترحيب ====================
function loadWelcomeSection() {
    const arabicText = document.getElementById('welcome-text-ar');
    const englishText = document.getElementById('welcome-text-en');
    const saveBtn = document.getElementById('save-welcome');

    if (!arabicText || !englishText || !saveBtn) return;

    // تحميل البيانات الحالية
    onValue(ref(database, 'storeWelcomeMessage'), (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            if (data.ar && data.en) {
                arabicText.value = data.ar;
                englishText.value = data.en;
                welcomeMessage = data;
            } else if (data.text && (data.text.ar || data.text.en)) {
                arabicText.value = data.text.ar || '';
                englishText.value = data.text.en || '';
                welcomeMessage = data.text;
            } else if (typeof data === 'string') {
                arabicText.value = data;
                englishText.value = data;
                welcomeMessage = {ar: data, en: data};
            }
            
            window.welcomeMessageData = welcomeMessage;
        }
    });

    // حفظ التغييرات
    saveBtn.addEventListener('click', async () => {
        const welcomeData = {
            ar: arabicText.value.trim(),
            en: englishText.value.trim(),
            updatedAt: Date.now(),
            updatedBy: auth.currentUser?.email || 'admin'
        };

        try {
            await set(ref(database, 'storeWelcomeMessage'), welcomeData);
            adminUtils.showToast('تم حفظ رسالة الترحيب بنجاح', 'success');
            
            if (typeof window.renderWelcome === 'function') {
                window.renderWelcome(welcomeData);
            }
        } catch (error) {
            console.error('❌ خطأ في حفظ رسالة الترحيب:', error);
            adminUtils.showToast('خطأ في الحفظ: ' + error.message, 'error');
        }
    });
}

// ==================== قسم ردود البوت ====================
function loadBotSection() {
    const container = document.getElementById('bot-table-body');
    const searchInput = document.getElementById('search-bot');
    const addBtn = document.getElementById('add-bot-btn');
    const importJsonBtn = document.getElementById('import-bot-json');

    if (!container) return;

    let botData = {};
    let searchQuery = '';

    function renderBotResponses() {
        let filteredData = botData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(botData).forEach(([key, item]) => {
                if (!item) return false;
                const question = typeof item.question === 'object' ? 
                    (item.question.ar || item.question.en || '') : 
                    item.question || '';
                const response = typeof item.response === 'object' ? 
                    (item.response.ar || item.response.en || '') : 
                    item.response || '';
                const searchText = `${question} ${response} ${item.category || ''}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = item;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'bot-table-body', 'bot');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderBotResponses();
        });
    }

    // زر الإضافة
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openBotResponseModal();
        });
    }

    // زر استيراد JSON
    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', () => {
            importBotFromJson();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'storeBotResponses'), (snapshot) => {
        botData = snapshot.val() || {};
        window.botData = botData;
        renderBotResponses();
    });
}

// ==================== استيراد البوت من ملف JSON ====================
function importBotFromJson() {
    // إنشاء عنصر input للرفع
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // التحقق من صحة هيكل البيانات
                if (!jsonData || typeof jsonData !== 'object') {
                    adminUtils.showToast('ملف JSON غير صالح', 'error');
                    return;
                }
                
                // التحقق من وجود ردود في الملف
                const responses = jsonData.responses || jsonData;
                
                if (!Array.isArray(responses) && typeof responses !== 'object') {
                    adminUtils.showToast('هيكل بيانات البوت غير صالح', 'error');
                    return;
                }
                
                // عرض تأكيد للمستخدم
                const confirmMessage = `هل تريد استيراد ${Array.isArray(responses) ? responses.length : Object.keys(responses).length} رد للبوت؟`;
                if (!confirm(confirmMessage)) {
                    adminUtils.showToast('تم إلغاء الاستيراد', 'info');
                    return;
                }
                
                adminUtils.showToast('جاري استيراد البيانات...', 'info');
                
                let importedCount = 0;
                let errorCount = 0;
                
                // معالجة الردود
                const responsesToImport = Array.isArray(responses) ? responses : Object.values(responses);
                
                for (const response of responsesToImport) {
                    try {
                        // التحقق من الهيكل الأساسي
                        if (!response.question && !response.ar && !response.question_ar) {
                            console.warn('رد بدون سؤال:', response);
                            errorCount++;
                            continue;
                        }
                        
                        // تنظيم بيانات الرد
                        const botData = {
                            question: {
                                ar: response.question?.ar || response.question_ar || response.question || '',
                                en: response.question?.en || response.question_en || response.question || ''
                            },
                            response: {
                                ar: response.response?.ar || response.response_ar || response.response || '',
                                en: response.response?.en || response.response_en || response.response || ''
                            },
                            category: response.category || 'general',
                            order: response.order || 0,
                            keywords: response.keywords || [],
                            createdAt: Date.now(),
                            updatedAt: Date.now()
                        };
                        
                        // إضافة إلى قاعدة البيانات
                        const newRef = push(ref(database, 'storeBotResponses'));
                        await set(newRef, botData);
                        importedCount++;
                        
                    } catch (error) {
                        console.error('خطأ في استيراد رد:', error);
                        errorCount++;
                    }
                }
                
                // عرض النتيجة
                let message = `تم استيراد ${importedCount} رد بنجاح`;
                if (errorCount > 0) {
                    message += `، مع ${errorCount} أخطاء`;
                }
                
                adminUtils.showToast(message, importedCount > 0 ? 'success' : 'warning');
                
                // تحديث عرض البوت
                if (typeof window.setupChatBot === 'function') {
                    window.setupChatBot(window.botData);
                }
                
            } catch (error) {
                console.error('❌ خطأ في تحليل ملف JSON:', error);
                adminUtils.showToast('خطأ في قراءة ملف JSON', 'error');
            }
        };
        
        reader.readAsText(file);
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// ==================== قسم الأسئلة الشائعة ====================
function loadFaqSection() {
    const container = document.getElementById('faq-table-body');
    const searchInput = document.getElementById('search-faq');
    const addBtn = document.getElementById('add-faq-btn');

    if (!container) return;

    let faqData = {};
    let searchQuery = '';

    function renderFaqs() {
        let filteredData = faqData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(faqData).forEach(([key, item]) => {
                if (!item) return false;
                const question = typeof item.question === 'object' ? 
                    (item.question.ar || item.question.en || '') : 
                    item.question || '';
                const answer = typeof item.answer === 'object' ? 
                    (item.answer.ar || item.answer.en || '') : 
                    item.answer || '';
                const searchText = `${question} ${answer}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = item;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'faq-table-body', 'faq');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderFaqs();
        });
    }

    // زر الإضافة
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openFaqModal();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'storeFaqs'), (snapshot) => {
        faqData = snapshot.val() || {};
        window.faqData = faqData;
        renderFaqs();
    });
}

// ==================== قسم معلومات التواصل ====================
function loadContactSection() {
    const container = document.getElementById('contact-table-body');
    const searchInput = document.getElementById('search-contact');
    const addBtn = document.getElementById('add-contact-btn');

    if (!container) return;

    let contactData = {};
    let searchQuery = '';

    function renderContacts() {
        let filteredData = contactData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(contactData).forEach(([key, item]) => {
                if (!item) return false;
                const name = typeof item.name === 'object' ? 
                    (item.name.ar || item.name.en || '') : 
                    item.name || '';
                const searchText = `${name} ${item.link || ''} ${item.icon || ''}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = item;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'contact-table-body', 'contact');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderContacts();
        });
    }

    // زر الإضافة
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openContactModal();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'storeContactInfo'), (snapshot) => {
        contactData = snapshot.val() || {};
        window.contactData = contactData;
        renderContacts();
    });
}

// ==================== قسم الرسائل الواردة ====================
function loadMessagesSection() {
    const container = document.getElementById('messages-table-body');
    const searchInput = document.getElementById('search-messages');
    const statusFilter = document.getElementById('message-status-filter');

    if (!container) return;

    let messagesData = {};
    let searchQuery = '';
    let statusFilterValue = '';

    function renderMessages() {
        let filteredData = messagesData;
        
        if (searchQuery || statusFilterValue) {
            filteredData = {};
            Object.entries(messagesData).forEach(([key, item]) => {
                if (!item) return false;
                
                let matchesSearch = true;
                let matchesStatus = true;
                
                if (searchQuery) {
                    const searchText = `${item.name || ''} ${item.contact || ''} ${item.message || ''}`.toLowerCase();
                    matchesSearch = searchText.includes(searchQuery.toLowerCase());
                }
                
                if (statusFilterValue) {
                    matchesStatus = item.status === statusFilterValue;
                }
                
                if (matchesSearch && matchesStatus) {
                    filteredData[key] = item;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'messages-table-body', 'message');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderMessages();
        });
    }

    // فلتر الحالة
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            statusFilterValue = this.value;
            renderMessages();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'customerMessages'), (snapshot) => {
        messagesData = snapshot.val() || {};
        window.messagesData = messagesData;
        renderMessages();
    });
}

// ==================== مودال إضافة/تعديل رد البوت ====================
function openBotResponseModal(key = null, item = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const categoryOptions = `
        <option value="welcome" ${item?.category === 'welcome' ? 'selected' : ''}>ترحيب</option>
        <option value="general" ${item?.category === 'general' ? 'selected' : ''}>عام</option>
    `;
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 600px;">
            ${adminUtils.createModalHeader(isNew ? 'إضافة رد للبوت' : 'تعديل رد البوت')}
            
            <form id="botResponseForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label>السؤال (عربي)</label>
                        <input type="text" name="question_ar" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.question === 'object' ? item.question.ar || '' : item.question || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label>السؤال (إنجليزي)</label>
                        <input type="text" name="question_en" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.question === 'object' ? item.question.en || '' : '')}">
                    </div>
                    
                    <div class="full">
                        <label>الرد (عربي)</label>
                        <textarea name="response_ar" rows="4" required>${isNew ? '' : adminUtils.escapeHtml(typeof item.response === 'object' ? item.response.ar || '' : item.response || '')}</textarea>
                    </div>
                    
                    <div class="full">
                        <label>الرد (إنجليزي)</label>
                        <textarea name="response_en" rows="4">${isNew ? '' : adminUtils.escapeHtml(typeof item.response === 'object' ? item.response.en || '' : '')}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="half">
                            <label>الفئة</label>
                            <select name="category">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="half">
                            <label>الترتيب</label>
                            <input type="number" name="order" value="${isNew ? '0' : item.order || 0}" min="0">
                        </div>
                    </div>
                    
                    <div class="full">
                        <label>الكلمات المفتاحية (مفصولة بفاصلة)</label>
                        <input type="text" name="keywords" value="${isNew ? '' : (item.keywords ? item.keywords.join(', ') : '')}" placeholder="كلمة1, كلمة2, كلمة3">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save">
                        <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-bot-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.setupModalClose(modal, modalRoot);

    // حفظ التعديلات
    modal.querySelector('.save').addEventListener('click', async () => {
        const form = modal.querySelector('#botResponseForm');
        const fd = new FormData(form);

        const question_ar = fd.get('question_ar');
        const question_en = fd.get('question_en');
        const response_ar = fd.get('response_ar');
        const response_en = fd.get('response_en');
        const category = fd.get('category');
        const order = parseInt(fd.get('order')) || 0;
        const keywords = fd.get('keywords').split(',').map(k => k.trim()).filter(k => k);

        if (!question_ar || !response_ar) {
            adminUtils.showToast('يرجى ملء الحقول المطلوبة', 'error');
            return;
        }

        try {
            const botData = {
                question: {
                    ar: question_ar,
                    en: question_en || question_ar
                },
                response: {
                    ar: response_ar,
                    en: response_en || response_ar
                },
                category: category,
                order: order,
                keywords: keywords,
                updatedAt: Date.now()
            };

            if (isNew) {
                botData.createdAt = Date.now();
                const newRef = push(ref(database, 'storeBotResponses'));
                await set(newRef, botData);
                adminUtils.showToast('تم إضافة رد البوت بنجاح', 'success');
            } else {
                await update(ref(database, `storeBotResponses/${key}`), botData);
                adminUtils.showToast('تم تحديث رد البوت بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
            
            if (typeof window.setupChatBot === 'function' && window.botData) {
                window.setupChatBot(window.botData);
            }
        } catch (error) {
            console.error('خطأ في حفظ رد البوت:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-bot-btn').addEventListener('click', async () => {
            const question = typeof item.question === 'object' ? 
                (item.question.ar || item.question.en || 'هذا الرد') : 
                item.question || 'هذا الرد';
            
            if (!confirm(`هل أنت متأكد من حذف رد البوت "${question.substring(0, 50)}..."؟`)) return;
            
            try {
                await remove(ref(database, `storeBotResponses/${key}`));
                adminUtils.showToast('تم حذف رد البوت بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف رد البوت:', error);
                adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        });
    }

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

// ==================== مودال إضافة/تعديل سؤال شائع ====================
function openFaqModal(key = null, item = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // إنشاء شبكة الأيقونات
    const icons = adminUtils.getIconList();
    const iconGrid = icons.map(icon => 
        `<div class="icon-option ${item?.icon === icon ? 'selected' : ''}" data-icon="${icon}">
            <i class="${icon}"></i>
        </div>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 700px;">
            ${adminUtils.createModalHeader(isNew ? 'إضافة سؤال شائع' : 'تعديل سؤال شائع')}
            
            <form id="faqForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label>السؤال (عربي)</label>
                        <input type="text" id="faq-question-ar" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.question === 'object' ? item.question.ar || '' : item.question || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label>السؤال (إنجليزي)</label>
                        <input type="text" id="faq-question-en" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.question === 'object' ? item.question.en || '' : '')}">
                    </div>
                    
                    <div class="full">
                        <label>الإجابة (عربي)</label>
                        <textarea id="faq-answer-ar" rows="4" required>${isNew ? '' : adminUtils.escapeHtml(typeof item.answer === 'object' ? item.answer.ar || '' : item.answer || '')}</textarea>
                    </div>
                    
                    <div class="full">
                        <label>الإجابة (إنجليزي)</label>
                        <textarea id="faq-answer-en" rows="4">${isNew ? '' : adminUtils.escapeHtml(typeof item.answer === 'object' ? item.answer.en || '' : '')}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>الأيقونة</label>
                        <div class="icon-grid" id="icon-grid">
                            ${iconGrid}
                        </div>
                        <input type="hidden" id="selected-icon" value="${item?.icon || 'fas fa-question'}">
                    </div>
                    
                    <div class="form-group">
                        <label>اللون</label>
                        <input type="color" id="faq-color" value="${item?.color || '#9e9e9e'}" style="width: 100%; height: 40px;">
                    </div>
                    
                    <div class="form-group">
                        <label>الترتيب</label>
                        <input type="number" id="faq-order" value="${isNew ? '0' : item.order || 0}" min="0">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save" id="save-faq">
                        <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-faq-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.setupModalClose(modal, modalRoot);

    // اختيار الأيقونة
    const iconOptions = modal.querySelectorAll('.icon-option');
    const selectedIconInput = modal.querySelector('#selected-icon');
    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedIconInput.value = option.dataset.icon;
        });
    });

    // حفظ التعديلات
    modal.querySelector('#save-faq').addEventListener('click', async () => {
        const question_ar = modal.querySelector('#faq-question-ar').value;
        const question_en = modal.querySelector('#faq-question-en').value;
        const answer_ar = modal.querySelector('#faq-answer-ar').value;
        const answer_en = modal.querySelector('#faq-answer-en').value;
        const icon = selectedIconInput.value;
        const color = modal.querySelector('#faq-color').value;
        const order = parseInt(modal.querySelector('#faq-order').value) || 0;

        if (!question_ar || !answer_ar) {
            adminUtils.showToast('يرجى ملء الحقول المطلوبة', 'error');
            return;
        }

        try {
            const faqData = {
                question: {
                    ar: question_ar,
                    en: question_en || question_ar
                },
                answer: {
                    ar: answer_ar,
                    en: answer_en || answer_ar
                },
                icon: icon,
                color: color,
                order: order,
                updatedAt: Date.now()
            };

            if (isNew) {
                faqData.createdAt = Date.now();
                const newRef = push(ref(database, 'storeFaqs'));
                await set(newRef, faqData);
                adminUtils.showToast('تم إضافة السؤال بنجاح', 'success');
            } else {
                await update(ref(database, `storeFaqs/${key}`), faqData);
                adminUtils.showToast('تم تحديث السؤال بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
            
            if (typeof window.renderPublicFAQs === 'function' && window.faqData) {
                window.renderPublicFAQs(window.faqData);
            }
        } catch (error) {
            console.error('خطأ في حفظ السؤال:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-faq-btn').addEventListener('click', async () => {
            const question = typeof item.question === 'object' ? 
                (item.question.ar || item.question.en || 'هذا السؤال') : 
                item.question || 'هذا السؤال';
            
            if (!confirm(`هل أنت متأكد من حذف السؤال "${question.substring(0, 50)}..."؟`)) return;
            
            try {
                await remove(ref(database, `storeFaqs/${key}`));
                adminUtils.showToast('تم حذف السؤال بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف السؤال:', error);
                adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        });
    }

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

// ==================== مودال إضافة/تعديل وسيلة تواصل ====================
function openContactModal(key = null, item = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // قائمة الأيقونات الشائعة للتواصل
    const commonIcons = [
        'fab fa-whatsapp', 'fab fa-facebook', 'fab fa-twitter', 'fab fa-instagram',
        'fab fa-linkedin', 'fab fa-youtube', 'fab fa-telegram', 'fab fa-tiktok',
        'fab fa-github', 'fab fa-paypal', 'fab fa-microsoft', 'fas fa-envelope',
        'fas fa-phone', 'fas fa-map-marker', 'fas fa-globe', 'fas fa-link'
    ];
    
    const iconGrid = commonIcons.map(icon => 
        `<div class="icon-option ${item?.icon === icon ? 'selected' : ''}" data-icon="${icon}">
            <i class="${icon}"></i>
        </div>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 600px;">
            ${adminUtils.createModalHeader(isNew ? 'إضافة وسيلة تواصل' : 'تعديل وسيلة تواصل')}
            
            <form id="contactForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label>الاسم (عربي)</label>
                        <input type="text" id="contact-name-ar" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.name === 'object' ? item.name.ar || '' : item.name || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label>الاسم (إنجليزي)</label>
                        <input type="text" id="contact-name-en" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.name === 'object' ? item.name.en || '' : '')}">
                    </div>
                    
                    <div class="full">
                        <label>الرابط</label>
                        <input type="url" id="contact-link" value="${isNew ? '' : adminUtils.escapeHtml(item.link || '')}" required placeholder="https://example.com">
                    </div>
                    
                    <div class="form-group">
                        <label>الأيقونة</label>
                        <div class="icon-grid" id="contact-icon-grid">
                            ${iconGrid}
                        </div>
                        <input type="hidden" id="selected-contact-icon" value="${item?.icon || 'fas fa-link'}">
                    </div>
                    
                    <div class="form-group">
                        <label>الترتيب</label>
                        <input type="number" id="contact-order" value="${isNew ? '0' : item.order || 0}" min="0">
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save" id="save-contact">
                        <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-contact-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.setupModalClose(modal, modalRoot);

    // اختيار الأيقونة
    const iconOptions = modal.querySelectorAll('.icon-option');
    const selectedIconInput = modal.querySelector('#selected-contact-icon');
    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedIconInput.value = option.dataset.icon;
        });
    });

    // حفظ التعديلات
    modal.querySelector('#save-contact').addEventListener('click', async () => {
        const name_ar = modal.querySelector('#contact-name-ar').value;
        const name_en = modal.querySelector('#contact-name-en').value;
        const link = modal.querySelector('#contact-link').value;
        const icon = selectedIconInput.value;
        const order = parseInt(modal.querySelector('#contact-order').value) || 0;

        if (!name_ar || !link) {
            adminUtils.showToast('يرجى ملء الحقول المطلوبة', 'error');
            return;
        }

        try {
            const contactData = {
                name: {
                    ar: name_ar,
                    en: name_en || name_ar
                },
                link: link,
                icon: icon,
                order: order,
                updatedAt: Date.now()
            };

            if (isNew) {
                contactData.createdAt = Date.now();
                const newRef = push(ref(database, 'storeContactInfo'));
                await set(newRef, contactData);
                adminUtils.showToast('تم إضافة وسيلة التواصل بنجاح', 'success');
            } else {
                await update(ref(database, `storeContactInfo/${key}`), contactData);
                adminUtils.showToast('تم تحديث وسيلة التواصل بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
            
            if (typeof window.renderContactCards === 'function' && window.contactData) {
                window.renderContactCards(window.contactData);
            }
        } catch (error) {
            console.error('خطأ في حفظ وسيلة التواصل:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-contact-btn').addEventListener('click', async () => {
            const name = typeof item.name === 'object' ? 
                (item.name.ar || item.name.en || 'هذه الوسيلة') : 
                item.name || 'هذه الوسيلة';
            
            if (!confirm(`هل أنت متأكد من حذف وسيلة التواصل "${name}"؟`)) return;
            
            try {
                await remove(ref(database, `storeContactInfo/${key}`));
                adminUtils.showToast('تم حذف وسيلة التواصل بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف وسيلة التواصل:', error);
                adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        });
    }

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

// ==================== عرض تفاصيل الرسالة ====================
function viewMessage(key) {
    const message = window.messagesData ? window.messagesData[key] : null;
    if (!message) {
        adminUtils.showToast('الرسالة غير موجودة', 'error');
        return;
    }
    
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const statusColors = {
        new: '#3498db',
        read: '#2ecc71',
        replied: '#9b59b6'
    };
    
    const statusTexts = {
        new: 'جديد',
        read: 'مقروء',
        replied: 'تم الرد'
    };
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 700px;">
            ${adminUtils.createModalHeader('تفاصيل الرسالة')}
            
            <div class="message-details" style="padding: 20px;">
                <div class="detail-row">
                    <strong>الاسم:</strong>
                    <span>${message.name || 'غير محدد'}</span>
                </div>
                <div class="detail-row">
                    <strong>طريقة التواصل:</strong>
                    <span>${message.isWhatsApp ? 'واتساب' : 'بريد إلكتروني'}</span>
                </div>
                <div class="detail-row">
                    <strong>التواصل:</strong>
                    <span>${message.contact || 'غير محدد'}</span>
                </div>
                ${message.countryCode ? `
                    <div class="detail-row">
                        <strong>رمز الدولة:</strong>
                        <span>+${message.countryCode}</span>
                    </div>
                ` : ''}
                ${message.fullPhone ? `
                    <div class="detail-row">
                        <strong>رقم الهاتف الكامل:</strong>
                        <span>+${message.fullPhone}</span>
                    </div>
                ` : ''}
                <div class="detail-row">
                    <strong>التاريخ:</strong>
                    <span>${adminUtils.formatDate(message.timestamp)}</span>
                </div>
                <div class="detail-row">
                    <strong>الحالة:</strong>
                    <span class="badge" style="background: ${statusColors[message.status] || '#95a5a6'}">
                        ${statusTexts[message.status] || message.status || 'غير معروف'}
                    </span>
                </div>
                <div class="detail-row">
                    <strong>الرسالة:</strong>
                    <div class="full-message">
                        ${adminUtils.escapeHtml(message.message || 'لا توجد رسالة').replace(/\n/g, '<br>')}
                    </div>
                </div>
            </div>
            
            <div class="form-actions" style="padding: 20px; border-top: 1px solid var(--bg-text);">
                ${message.status === 'new' ? `
                    <button type="button" class="grid-btn success" id="mark-read-btn">
                        <i class="fas fa-check"></i> تحديد كمقروء
                    </button>
                ` : ''}
                <button type="button" class="grid-btn" id="reply-btn">
                    <i class="fas fa-reply"></i> الرد
                </button>
                <button type="button" class="grid-btn danger" id="delete-message-btn">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `;

    adminUtils.setupModalClose(modal, modalRoot);

    // زر تحديد كمقروء
    if (message.status === 'new') {
        modal.querySelector('#mark-read-btn').addEventListener('click', async () => {
            try {
                await update(ref(database, `customerMessages/${key}`), {
                    status: 'read',
                    read: true,
                    readAt: Date.now(),
                    readBy: auth.currentUser?.email || 'admin'
                });
                adminUtils.showToast('تم تحديد الرسالة كمقروءة', 'success');
                
                // تحديث الواجهة
                const markReadBtn = modal.querySelector('#mark-read-btn');
                markReadBtn.style.display = 'none';
            } catch (error) {
                console.error('❌ خطأ في تحديث حالة الرسالة:', error);
                adminUtils.showToast('حدث خطأ في تحديث الحالة', 'error');
            }
        });
    }

    // زر الرد
    modal.querySelector('#reply-btn').addEventListener('click', () => {
        if (message.isWhatsApp) {
            // فتح واتساب للرد
            const phone = message.fullPhone || (message.countryCode ? message.countryCode + message.contact : message.contact);
            const whatsappLink = `https://wa.me/${phone}`;
            window.open(whatsappLink, '_blank');
            
            // تحديث الحالة
            update(ref(database, `customerMessages/${key}`), {
                status: 'replied',
                repliedAt: Date.now(),
                repliedBy: auth.currentUser?.email || 'admin'
            });
            
            adminUtils.showToast('تم فتح واتساب للرد', 'success');
        } else {
            // فتح البريد الإلكتروني للرد
            const mailtoLink = `mailto:${message.contact}?subject=رد على رسالتك&body=مرحباً ${message.name}،%0D%0A%0D%0A`;
            window.open(mailtoLink);
            
            // تحديث الحالة
            update(ref(database, `customerMessages/${key}`), {
                status: 'replied',
                repliedAt: Date.now(),
                repliedBy: auth.currentUser?.email || 'admin'
            });
            
            adminUtils.showToast('تم فتح البريد الإلكتروني للرد', 'success');
        }
    });

    // زر حذف الرسالة
    modal.querySelector('#delete-message-btn').addEventListener('click', async () => {
        if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
        
        try {
            await remove(ref(database, `customerMessages/${key}`));
            adminUtils.showToast('تم حذف الرسالة بنجاح', 'success');
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        } catch (error) {
            console.error('❌ خطأ في حذف الرسالة:', error);
            adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
        }
    });

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

// ==================== دوال النظام الأساسية ====================
function editUser(key) {
    const user = window.usersData ? window.usersData[key] : null;
    if (!user) {
        adminUtils.showToast('المستخدم غير موجود', 'error');
        return;
    }
    
    openUserModal(key, user);
}
// ==================== مودال إضافة/تعديل مستخدم ====================
function openUserModal(key = null, user = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) {
        console.error('❌ عنصر userModalRoot غير موجود');
        return;
    }
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // بناء خيارات الدور - بدون خيار الأدمن
    const roleOptions = `
        <option value="student" ${user?.role === 'student' ? 'selected' : ''}>طالب</option>
        <option value="parent" ${user?.role === 'parent' ? 'selected' : ''}>ولي أمر</option>
    `;
    
    // HTML لحقل كلمة المرور مع زر العين
    const passwordFieldHTML = isNew 
        ? `
            <div class="password-field-wrapper">
                <label>كلمة المرور</label>
                <div class="password-input-group">
                    <input type="password" name="password" id="user-password" required placeholder="كلمة المرور الجديدة">
                    <button type="button" class="toggle-password-btn" id="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <small class="password-hint">أدخل كلمة مرور جديدة للمستخدم</small>
            </div>
        `
        : `
            <div class="password-field-wrapper">
                <label>كلمة المرور</label>
                <div class="password-input-group">
                    <input type="password" name="password" id="user-password" readonly placeholder="**********" value="**********">
                    <button type="button" class="toggle-password-btn" id="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <small class="password-hint">
                    <i class="fas fa-info-circle"></i> لا يمكن عرض كلمة المرور الحالية لأسباب أمنية
                </small>
            </div>
        `;
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 500px;">
            ${adminUtils.createModalHeader(isNew ? 'إضافة مستخدم' : 'تعديل مستخدم')}
            
            <form id="editUserForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label>الاسم</label>
                        <input type="text" name="name" value="${isNew ? '' : adminUtils.escapeHtml(user.name || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label>البريد الإلكتروني</label>
                        <input type="email" name="email" value="${isNew ? '' : adminUtils.escapeHtml(user.email || '')}" ${isNew ? '' : 'readonly'}>
                    </div>
                    
                    ${passwordFieldHTML}
                    
                    <div class="full">
                        <label>الدور</label>
                        <select name="role">
                            ${roleOptions}
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save">
                        <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-user-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.setupModalClose(modal, modalRoot);
    
    // إضافة CSS لتصميم حقل كلمة المرور وزر العين
    const style = document.createElement('style');
    style.textContent = `
        .password-field-wrapper {
            margin-bottom: 1.5rem;
        }
        
        .password-input-group {
            position: relative;
            display: flex;
            align-items: center;
        }
        
        .password-input-group input {
            padding-right: 45px;
            width: 100%;
            background: ${isNew ? 'transparent' : 'rgba(var(--bg-text-rgb), 0.05)'};
            cursor: ${isNew ? 'text' : 'not-allowed'};
        }
        
        .password-input-group input:read-only {
            background: rgba(var(--bg-text-rgb), 0.05);
            color: var(--bg-text);
            opacity: 0.8;
            border-color: rgba(var(--bg-text-rgb), 0.3);
        }
        
        .toggle-password-btn {
            position: absolute;
            right: 10px;
            background: transparent;
            border: none;
            color: var(--bg-text);
            cursor: pointer;
            padding: 8px;
            border-radius: 4px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .toggle-password-btn:hover {
            background: rgba(var(--bg-text-rgb), 0.1);
        }
        
        .toggle-password-btn:active {
            transform: scale(0.95);
        }
        
        .password-hint {
            display: block;
            margin-top: 5px;
            font-size: 0.85rem;
            color: var(--bg-text);
            opacity: 0.7;
            line-height: 1.4;
        }
        
        .password-hint i {
            margin-right: 5px;
            color: #3498db;
        }
        
        .password-input-group input[type="text"] {
            letter-spacing: 1px;
        }
    `;
    modal.appendChild(style);

    // وظيفة تبديل إظهار/إخفاء كلمة المرور
    const togglePasswordBtn = modal.querySelector('#toggle-password');
    const passwordInput = modal.querySelector('#user-password');
    
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // تغيير أيقونة العين
            const icon = this.querySelector('i');
            if (type === 'text') {
                icon.className = 'fas fa-eye-slash';
                this.setAttribute('title', 'إخفاء كلمة المرور');
            } else {
                icon.className = 'fas fa-eye';
                this.setAttribute('title', 'إظهار كلمة المرور');
            }
        });
        
        // تعيين عنوان للزر
        togglePasswordBtn.setAttribute('title', 'إظهار/إخفاء كلمة المرور');
    }

    // حفظ التعديلات
    modal.querySelector('.save').addEventListener('click', async () => {
        const form = modal.querySelector('#editUserForm');
        const fd = new FormData(form);

        const name = fd.get('name');
        const email = fd.get('email');
        const password = fd.get('password');
        const role = fd.get('role');

        if (!name || !email || (isNew && !password)) {
            adminUtils.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            const userData = {
                name: name,
                email: email,
                role: role,
                updatedAt: Date.now()
            };

            if (isNew) {
                // إنشاء مستخدم جديد في Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const newUserId = userCredential.user.uid;
                
                userData.createdAt = Date.now();
                await set(ref(database, `users/${newUserId}`), userData);
                
                adminUtils.showToast('تم إنشاء المستخدم بنجاح', 'success');
            } else {
                // تحديث مستخدم موجود
                if (user?.role === 'admin' && role !== 'admin') {
                    adminUtils.showToast('لا يمكن تغيير دور الأدمن', 'error');
                    return;
                }
                
                // تحديث البيانات الأساسية
                await update(ref(database, `users/${key}`), userData);
                
                // إذا تم إدخال كلمة مرور جديدة، قم بتحديثها
                if (password && password !== '**********') {
                    try {
                        // للحصول على المستخدم الحالي وتحديث كلمة المرور
                        const currentUser = auth.currentUser;
                        if (currentUser && currentUser.email === email) {
                            // يمكننا تحديث كلمة المرور إذا كان المستخدم الحالي
                            // ولكن هذا يتطلب إعادة المصادقة
                            adminUtils.showToast('لاحظ: لتغيير كلمة مرور المستخدم، يجب أن يسجل الدخول بنفسه أو استخدام Firebase Admin SDK', 'warning');
                        }
                    } catch (error) {
                        console.error('❌ خطأ في تحديث كلمة المرور:', error);
                        adminUtils.showToast('تم تحديث بيانات المستخدم، لكن هناك مشكلة في تحديث كلمة المرور', 'warning');
                    }
                }
                
                adminUtils.showToast('تم تحديث المستخدم بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        } catch (error) {
            console.error('خطأ في حفظ المستخدم:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-user-btn').addEventListener('click', async () => {
            // منع حذف الأدمن نفسه
            if (user?.role === 'admin' && auth.currentUser.uid === key) {
                adminUtils.showToast('لا يمكن حذف حساب الأدمن الحالي', 'error');
                return;
            }
            
            if (!confirm(`هل أنت متأكد من حذف المستخدم ${user.name || user.email}؟`)) return;
            
            try {
                await remove(ref(database, `users/${key}`));
                adminUtils.showToast('تم حذف المستخدم بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف المستخدم:', error);
                adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        });
    }

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

// ==================== تهيئة صفحة الأدمن ====================
function initAdminPage() {
    console.log('👑 تهيئة صفحة الأدمن الجديدة...');
    
    // تهيئة عرض الأقسام كبطاقات
    initAdminSections();
    
    console.log('✅ تم تهيئة صفحة الأدمن بنجاح');
}

// ==================== تحسينات المودال للجوال ====================
function optimizeModalForMobile() {
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    // إضافة حدث عند فتح المودال
    const observer = new MutationObserver(() => {
        if (modalRoot.children.length > 0) {
            // عند فتح المودال
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            
            // ضبط ارتفاع محدد للمحتوى
            setTimeout(() => {
                const modalContent = modalRoot.querySelector('.modal-content-new');
                if (modalContent) {
                    // حساب الارتفاع المتاح
                    const availableHeight = window.innerHeight * 0.75;
                    modalContent.style.maxHeight = `${availableHeight}px`;
                    modalContent.style.height = `${availableHeight}px`;
                    
                    // ضبط محتوى شبكة الأيقونات
                    const iconGrid = modalContent.querySelector('.icon-grid');
                    if (iconGrid) {
                        iconGrid.style.maxHeight = '140px';
                        iconGrid.style.height = '140px';
                    }
                    
                    // ضمان ظهور نهاية المحتوي
                    const formContent = modalContent.querySelector('.form-compact-new, .message-details, .admin-form');
                    if (formContent) {
                        const formHeight = availableHeight - 120; // ناقص الهيدر والفوتر
                        formContent.style.maxHeight = `${formHeight}px`;
                        formContent.style.overflowY = 'auto';
                        
                        // إضافة padding سفلي للأزرار
                        formContent.style.paddingBottom = '80px';
                    }
                }
            }, 10);
        } else {
            // عند إغلاق المودال
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    });
    
    observer.observe(modalRoot, { childList: true });
}

// ==================== تهيئة النظام عند التحميل ====================
document.addEventListener('DOMContentLoaded', function() {
    optimizeModalForMobile();
        
    // أيضًا تحسين عند تغيير حجم النافذة
    window.addEventListener('resize', () => {
        const modalRoot = document.getElementById('userModalRoot');
        if (modalRoot && modalRoot.children.length > 0) {
            optimizeModalForMobile();
        }
    });

    // إذا كنا في صفحة الأدمن، نبدأ التهيئة
    if (window.location.pathname.includes('admin.html')) {
        // انتظار تحميل Firebase
        const checkFirebase = setInterval(() => {
            if (database) {
                clearInterval(checkFirebase);
                
                // تأخير بسيط لضمان تحميل كل شيء
                setTimeout(() => {
                    initAdminPage();
                }, 500);
            }
        }, 100);
    }
});

// جعل الدوال متاحة عالمياً للاستدعاء من HTML
window.editUser = editUser;
window.openUserModal = openUserModal;
window.editBotResponse = (key) => {
    const item = window.botData ? window.botData[key] : null;
    if (item) openBotResponseModal(key, item);
};
window.editFaq = (key) => {
    const item = window.faqData ? window.faqData[key] : null;
    if (item) openFaqModal(key, item);
};
window.editContact = (key) => {
    const item = window.contactData ? window.contactData[key] : null;
    if (item) openContactModal(key, item);
};
window.viewMessage = viewMessage;
window.importBotFromJson = importBotFromJson;
window.optimizeModalForMobile = optimizeModalForMobile;