// ==================== استيراد Firebase Functions ====================
import { auth, database, utils } from "./app.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set, update, remove, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import contentUtils from "./content.js";
import examsUtils from "./exams.js";
import { loadAttendanceSection } from "./attendance.js";
import chatUtils from "./chat.js";

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

    applyTranslationsToDynamicContent: function() {
        if (window.i18n && window.i18n.applyTranslations) {
            // إعادة تهيئة العناصر الجديدة
            window.i18n.reinitialize();
            // تطبيق الترجمات
            window.i18n.applyTranslations();
        }
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
        case 'about-section':
            sectionHTML = getAboutSectionHTML();
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
        case 'groups-section':
            sectionHTML = getGroupsSectionHTML();
            break;
        case 'lectures-section':
            sectionHTML = getLecturesSectionHTML();
            break;
        case 'subjects-section':
            sectionHTML = getSubjectsSectionHTML();
            break;
        case 'content-section':
            sectionHTML = getContentSectionHTML();
            break;
        case 'exams-section':
            sectionHTML = getExamsSectionHTML();
            break;
        case 'results-section':
            sectionHTML = getResultsSectionHTML();
            break;
        case 'attendance-section':
            sectionHTML = getAttendanceSectionHTML();
            break;
            case 'chat-section':
    sectionHTML = `
        <div class="section-title">
            <i class="fas fa-comments"></i>
            <span data-i18n="admin.chat.title">الشات العام</span>
        </div>
        <div class="section-content" id="chat-container"></div>
    `;
    break;
    }
    
    dynamicContent.innerHTML = sectionHTML;
    adminUtils.applyTranslationsToDynamicContent();
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
            case 'about-section':
                loadAboutSection();
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
            case 'groups-section':
                loadGroupsSection();
                break; 
            case 'lectures-section':
                loadLecturesSection();
                break;
            case 'subjects-section':
                loadSubjectsSection();
                break;
            case 'content-section':
                loadContentSection();
                break;
            case 'exams-section':
                loadExamsSection();
                break;
            case 'results-section':
                loadResultsSection();
                break;
            case 'attendance-section':
                loadAttendanceSection();
                break; 
            
case 'chat-section':
    if (chatUtils && chatUtils.loadChatSection) {
        chatUtils.loadChatSection();
    }
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

function getAboutSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-info-circle"></i>
            <span data-i18n="admin.about.title">إدارة محتوى من نحن</span>
        </div>
        
        <div class="section-content">
            <div class="admin-form">
                <div class="form-group">
                    <label for="about-text-ar" data-i18n="admin.about.textAr">المحتوى العربي</label>
                    <textarea id="about-text-ar" class="form-control" rows="12" 
                              placeholder="اكتب محتوى من نحن باللغة العربية..."></textarea>
                </div>
                <div class="form-group">
                    <label for="about-text-en" data-i18n="admin.about.textEn">المحتوى الإنجليزي</label>
                    <textarea id="about-text-en" class="form-control" rows="12" 
                              placeholder="Write about us content in English..."></textarea>
                </div>
                <div class="form-buttons">
                    <button id="save-about" class="btn">
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
            
            <!-- تغيير هنا: استخدام div خاص لفلاتر الرسائل -->
            <div class="messages-filters">
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

function getGroupsSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-users-cog"></i>
            <span data-i18n="admin.groups.title">إدارة المجموعات</span>
        </div>
        <div class="add-btn-container">
            <button id="add-group-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.groups.add">إنشاء مجموعة جديدة</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-groups" class="form-control" 
                       placeholder="ابحث في المجموعات..." data-i18n-placeholder="admin.groups.search">
            </div>
            
            <div id="groups-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-users-cog"></i>
                    <span data-i18n="admin.groups.noData">جاري تحميل المجموعات...</span>
                </div>
            </div>
        </div>
    `;
}

function getLecturesSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-chalkboard-teacher"></i>
            <span data-i18n="admin.lectures.title">إدارة المحاضرات القادمة</span>
        </div>
        <div class="add-btn-container">
            <button id="add-lecture-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.lectures.add">إضافة محاضرة جديدة</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-lectures" class="form-control" 
                       placeholder="ابحث في المحاضرات..." data-i18n-placeholder="admin.lectures.search">
            </div>
            
            <div id="lectures-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span data-i18n="admin.lectures.noData">جاري تحميل المحاضرات...</span>
                </div>
            </div>
        </div>
    `;
}

function getSubjectsSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-book"></i>
            <span data-i18n="admin.subjects.title">إدارة المواد الدراسية</span>
        </div>
        <div class="add-btn-container">
            <button id="add-subject-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.subjects.add">إضافة مادة جديدة</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-subjects" class="form-control" 
                       placeholder="ابحث في المواد..." data-i18n-placeholder="admin.subjects.search">
            </div>
            
            <div id="subjects-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <span data-i18n="admin.subjects.noData">جاري تحميل المواد...</span>
                </div>
            </div>
        </div>
    `;
}

function getContentSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-book-open"></i>
            <span data-i18n="admin.content.title">إدارة المحتوى الدراسي</span>
        </div>
        
        <div class="section-content">
            <!-- تبويبات المواد الدراسية -->
            <div class="english-tabs" id="subjects-tabs">
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <span data-i18n="admin.content.noSubjects">جاري تحميل المواد الدراسية...</span>
                </div>
            </div>
            
            <!-- محتوى المادة الدراسية المحددة -->
            <div id="subject-content-container">
                <div class="no-data">
                    <i class="fas fa-book-open"></i>
                    <span data-i18n="admin.content.selectSubject">اختر مادة دراسية لعرض محتواها</span>
                </div>
            </div>
        </div>
    `;
}

function getExamsSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-file-alt"></i>
            <span data-i18n="admin.exams.title">إدارة الاختبارات</span>
        </div>
        <div class="add-btn-container">
            <button id="add-exam-btn" class="add-btn">
                <i class="fas fa-plus"></i> 
                <span data-i18n="admin.exams.add">إضافة اختبار جديد</span>
            </button>
        </div>
        <div class="section-content">
            <div class="search-box">
                <input type="text" id="search-exams" class="form-control" 
                       placeholder="ابحث في الاختبارات..." data-i18n-placeholder="admin.exams.search">
            </div>
            
            <div class="exams-filters-combo">
                <div class="combo-filters-wrapper">
                    <select id="exam-status-filter" class="combo-filter-select combo-filter-right">
                        <option value="">جميع الحالات</option>
                        <option value="published" data-i18n="admin.exams.status.published">نشط</option>
                        <option value="draft" data-i18n="admin.exams.status.draft">مسودة</option>
                    </select>
                                
                    <select id="exam-subject-filter" class="combo-filter-select combo-filter-left">
                        <option value="">جميع المواد</option>
                        <!-- سيتم ملء المواد ديناميكياً -->
                    </select>
                </div>
            </div>
            
            <div id="exams-table-body" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-file-alt"></i>
                    <span data-i18n="admin.exams.noData">جاري تحميل الاختبارات...</span>
                </div>
            </div>
        </div>
    `;
}

function getResultsSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-chart-bar"></i>
            <span data-i18n="admin.results.title">نتائج الطلاب</span>
        </div>
        
        <div class="section-content">
            <!-- إحصائيات النتائج -->
            <div class="results-stats-overview">
                <div class="results-stat-card">
                    <i class="fas fa-users results-stat-icon"></i>
                    <span class="results-stat-label" data-i18n="admin.results.totalStudents">إجمالي الطلاب</span>
                    <span class="results-stat-value" id="total-students">0</span>
                </div>
                <div class="results-stat-card">
                    <i class="fas fa-file-alt results-stat-icon"></i>
                    <span class="results-stat-label" data-i18n="admin.results.totalExams">إجمالي الاختبارات</span>
                    <span class="results-stat-value" id="total-exams">0</span>
                </div>
                <div class="results-stat-card">
                    <i class="fas fa-chart-line results-stat-icon"></i>
                    <span class="results-stat-label" data-i18n="admin.results.averageScore">متوسط النتائج</span>
                    <span class="results-stat-value" id="average-score">0%</span>
                </div>
                <div class="results-stat-card">
                    <i class="fas fa-trophy results-stat-icon"></i>   
                    <span class="results-stat-label" data-i18n="admin.results.topScore">أعلى نتيجة</span>
                    <span class="results-stat-value" id="top-score">0%</span>
                </div>
            </div>
            
            <!-- شريط البحث والأزرار -->
            <div class="results-controls">
                <div class="search-box results-search">
                    <i class="fas fa-search"></i>
                    <input type="text" id="search-results" class="form-control" 
                           placeholder="ابحث في نتائج الطلاب..." data-i18n-placeholder="admin.results.search">
                </div>
                
                <!-- فلاتر البحث المدمجة -->
                <div class="results-filters">
                    <!-- صف الفلاتر الأول -->
                    <div class="filter-row combo-row">
                        <select id="results-group-filter" class="combo-filter-select combo-filter-right">
                            <option value="">جميع المجموعات</option>
                        </select>
                        <select id="results-exam-filter" class="combo-filter-select combo-filter-left">
                            <option value="">جميع الاختبارات</option>
                        </select>
                    </div>
                    
                    <!-- صف الفلاتر الثاني -->
                    <div class="filter-row combo-row">
                        <select id="results-student-filter" class="combo-filter-select combo-filter-right">
                            <option value="">جميع الطلاب</option>
                        </select>
                        <select id="results-status-filter" class="combo-filter-select combo-filter-left">
                            <option value="">جميع الحالات</option>
                            <option value="passed">ناجح</option>
                            <option value="failed">راسب</option>
                            <option value="average">متوسط</option>
                        </select>
                    </div>
                </div>
                
                <!-- زر التصدير -->
                <div class="export-btn-wrapper">
                    <button id="export-results-btn" class="export-results-btn full-width-btn">
                        <i class="fas fa-download"></i>
                        <span data-i18n="admin.results.export">تصدير النتائج</span>
                    </button>
                </div>
            </div>
            
            <!-- محتوى النتائج حسب المجموعات -->
            <div id="results-groups-container" class="results-grid-container">
                <div class="no-data">
                    <i class="fas fa-chart-bar"></i>
                    <span data-i18n="admin.results.noData">جاري تحميل نتائج الطلاب...</span>
                </div>
            </div>
        </div>
    `;
}

function getAttendanceSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-clipboard-check"></i>
            <span data-i18n="admin.attendance.title">إدارة حضور وغياب الطلاب</span>
        </div>
        
        <div class="section-content">
            <!-- إحصائيات سريعة -->
            <div class="attendance-stats-overview">
                <div class="attendance-stat-card">
                    <i class="fas fa-chalkboard-teacher attendance-stat-icon"></i>
                    <span class="attendance-stat-value" id="total-lectures">0</span>
                    <span class="attendance-stat-label" data-i18n="admin.attendance.totalLectures">إجمالي المحاضرات</span>
                </div>
                <div class="attendance-stat-card">
                    <i class="fas fa-user-check attendance-stat-icon"></i>
                    <span class="attendance-stat-value" id="total-present">0</span>
                    <span class="attendance-stat-label" data-i18n="admin.attendance.totalPresent">حضور إجمالي</span>
                </div>
                <div class="attendance-stat-card">
                    <i class="fas fa-user-times attendance-stat-icon"></i>
                    <span class="attendance-stat-value" id="total-absent">0</span>
                    <span class="attendance-stat-label" data-i18n="admin.attendance.totalAbsent">غياب إجمالي</span>
                </div>
                <div class="attendance-stat-card">
                    <i class="fas fa-percentage attendance-stat-icon"></i>
                    <span class="attendance-stat-value" id="attendance-rate">0%</span>
                    <span class="attendance-stat-label" data-i18n="admin.attendance.attendanceRate">نسبة الحضور</span>
                </div>
            </div>
            
            <!-- فلاتر البحث -->
            <div class="attendance-filters">
                <select id="attendance-group-filter" class="form-control">
                    <option value="">جميع المجموعات</option>
                </select>
                <select id="attendance-lecture-filter" class="form-control">
                    <option value="">جميع المحاضرات</option>
                </select>
                <select id="attendance-student-filter" class="form-control">
                    <option value="">جميع الطلاب</option>
                </select>
                <select id="attendance-status-filter" class="form-control">
                    <option value="">جميع الحالات</option>
                    <option value="present">حاضر</option>
                    <option value="absent">غائب</option>
                    <option value="excused">معذور</option>
                    <option value="late">متأخر</option>
                </select>
            </div>
            
            <!-- زر التصدير -->
            <div class="add-btn-container">
                <button id="export-attendance-btn" class="export-attendance-btn">
                    <i class="fas fa-download"></i>
                    <span data-i18n="admin.attendance.export">تصدير سجلات الحضور</span>
                </button>
            </div>
            
            <!-- قائمة المحاضرات مع سجلات الحضور -->
            <div class="attendance-lectures-list">
                <div id="attendance-lectures-container">
                    <div class="no-data">
                        <i class="fas fa-clipboard-check"></i>
                        <span data-i18n="admin.attendance.noData">جاري تحميل سجلات الحضور...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getChatSectionHTML() {
    return `
        <div class="section-title">
            <i class="fas fa-comments"></i>
            <span data-i18n="admin.chat.title">الشات العام</span>
        </div>
        <div class="section-content" id="chat-section-container">
            <div class="loading-chat">
                <i class="fas fa-spinner fa-spin"></i>
                <span>جاري تحميل الشات...</span>
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

// دالة مساعدة لإنشاء بطاقة اختبار متسقة مع التصميم
function createExamCardForGrid(key, exam) {
    const card = document.createElement('div');
    card.className = 'exam-card';
    card.dataset.id = key;
    
    let title = exam.name || 'بدون اسم';
    if (title.length > 20) title = title.substring(0, 20) + '...';
    
    let groupBadge = '';
    if (exam.groups && Object.keys(exam.groups).length > 0) {
        const groupsCount = Object.keys(exam.groups).length;
        groupBadge = `<div class="groups-badge" title="مخصص لـ ${groupsCount} مجموعة">${groupsCount}</div>`;
    }
    
    // عد الأسئلة
    const questionsCount = exam.questions ? Object.keys(exam.questions).length : 0;
    const points = exam.totalPoints || 0;
    
    // شارة النشاط - دائرة خضراء أو حمراء
    let statusBadge = '';
    if (exam.isPublished) {
        statusBadge = `<div class="active-status-badge" title="نشط"><i class="fas fa-check"></i></div>`;
    } else {
        statusBadge = `<div class="inactive-status-badge" title="غير نشط"><i class="fas fa-times"></i></div>`;
    }
    
    card.innerHTML = `
        ${groupBadge}
        ${statusBadge}
        <i class="fas fa-file-alt"></i>
        <h4>${title}</h4>
        <div class="exam-stats">
            <span class="question-count">${questionsCount} سؤال</span>
            <span class="total-points">${points} درجة</span>
        </div>
    `;
    
    card.onclick = () => {
        editExam(key);
    };
    
    return card;
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
            case 'group':
                icon = 'fas fa-users';
                title = item.name ? (typeof item.name === 'object' ? 
                    (item.name.ar || item.name.en || 'بدون اسم') : 
                    item.name) : 'بدون اسم';
                if (title.length > 20) title = title.substring(0, 20) + '...';
                    
                // إضافة عدد الطلاب كبادئة
                const studentCount = item.students ? Object.keys(item.students).length : 0;
                badge = `<div class="role-badge" style="background: #3498db">${studentCount}</div>`;
                break;
            case 'lecture':
                icon = 'fas fa-chalkboard-teacher';
                title = item.title || 'بدون عنوان';
                if (title.length > 20) title = title.substring(0, 20) + '...';
                // إضافة تاريخ المحاضرة كبادئة
                const lectureDate = item.date ? new Date(item.date).toLocaleDateString('ar-SA') : 'غير محدد';
                badge = `<div class="role-badge" style="background: #9b59b6">${lectureDate}</div>`;
                break;
            case 'subject':
                icon = item.icon || 'fas fa-book';
                title = item.name ? (typeof item.name === 'object' ? 
                    (item.name.ar || item.name.en || 'بدون اسم') : 
                    item.name) : 'بدون اسم';
                if (title.length > 20) title = title.substring(0, 20) + '...';
    
                // إضافة عدد المجموعات كبادئة
                const groupsCount = item.groups ? Object.keys(item.groups).length : 0;
                badge = `<div class="role-badge" style="background: #9b59b6" title="مخصص لـ ${groupsCount} مجموعة">${groupsCount}</div>`;
                break;
            case 'exam':
                // استخدام الدالة المخصصة لإنشاء بطاقة اختبار
                const examCard = createExamCardForGrid(key, item);
                container.appendChild(examCard);
                return; 
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
        case 'group':
            editGroup(key);
            break;
        case 'lecture':
            editLecture(key);
            break;  
        case 'subject':
            editSubject(key);
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
        adminUtils.applyTranslationsToDynamicContent();
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

// ==================== قسم من نحن ====================
function loadAboutSection() {
    const arabicText = document.getElementById('about-text-ar');
    const englishText = document.getElementById('about-text-en');
    const saveBtn = document.getElementById('save-about');

    if (!arabicText || !englishText || !saveBtn) return;

    // تحميل البيانات الحالية
    onValue(ref(database, 'storeAboutUs'), (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            // البحث عن أول مفتاح في البيانات (لأن البيانات مخزنة ككائن بمفتاح فريد)
            const firstKey = Object.keys(data)[0];
            if (firstKey) {
                const aboutData = data[firstKey];
                
                if (aboutData.content) {
                    if (typeof aboutData.content === 'object') {
                        // النموذج الجديد: {ar: "...", en: "..."}
                        arabicText.value = aboutData.content.ar || '';
                        englishText.value = aboutData.content.en || '';
                    } else if (typeof aboutData.content === 'string') {
                        // نص مباشر
                        arabicText.value = aboutData.content;
                        englishText.value = aboutData.content;
                    }
                }
            }
        }
    });

    // حفظ التغييرات
    saveBtn.addEventListener('click', async () => {
        const aboutData = {
            content: {
                ar: arabicText.value.trim(),
                en: englishText.value.trim()
            },
            updatedAt: Date.now(),
            updatedBy: auth.currentUser?.email || 'admin'
        };

        try {
            // الحصول على المفتاح الحالي أو إنشاء مفتاح جديد
            const aboutRef = ref(database, 'storeAboutUs');
            const snapshot = await get(aboutRef);
            const existingData = snapshot.val();
            
            let keyToUpdate;
            if (existingData && Object.keys(existingData).length > 0) {
                // استخدام المفتاح الموجود
                keyToUpdate = Object.keys(existingData)[0];
                await update(ref(database, `storeAboutUs/${keyToUpdate}`), aboutData);
            } else {
                // إنشاء مفتاح جديد
                const newRef = push(ref(database, 'storeAboutUs'));
                aboutData.createdAt = Date.now();
                await set(newRef, aboutData);
            }
            
            adminUtils.showToast('تم حفظ محتوى من نحن بنجاح', 'success');
            
            // تحديث العرض في الصفحة الرئيسية
            if (typeof window.loadAboutContent === 'function') {
                // تحميل البيانات المحدثة
                onValue(ref(database, 'storeAboutUs'), (snap) => {
                    window.currentAbout = snap.val() || {};
                    window.loadAboutContent(window.currentAbout);
                });
            }
        } catch (error) {
            console.error('❌ خطأ في حفظ محتوى من نحن:', error);
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
        adminUtils.applyTranslationsToDynamicContent();
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

                adminUtils.applyTranslationsToDynamicContent();
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
        adminUtils.applyTranslationsToDynamicContent();
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
        adminUtils.applyTranslationsToDynamicContent();
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
        adminUtils.applyTranslationsToDynamicContent();
    });
}

// ==================== قسم المجموعات ====================
function loadGroupsSection() {
    const container = document.getElementById('groups-table-body');
    const searchInput = document.getElementById('search-groups');
    const addGroupBtn = document.getElementById('add-group-btn');

    if (!container) return;

    let groupsData = {};
    let searchQuery = '';

    function renderGroups() {
        let filteredData = groupsData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(groupsData).forEach(([key, group]) => {
                if (!group) return;
                const name = typeof group.name === 'object' ? 
                    (group.name.ar || group.name.en || '') : 
                    group.name || '';
                const description = typeof group.description === 'object' ? 
                    (group.description.ar || group.description.en || '') : 
                    group.description || '';
                const searchText = `${name} ${description}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = group;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'groups-table-body', 'group');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderGroups();
        });
    }

    // زر الإضافة
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
            openGroupModal();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'groups'), (snapshot) => {
        groupsData = snapshot.val() || {};
        window.groupsData = groupsData;
        renderGroups();
        adminUtils.applyTranslationsToDynamicContent();
    }, (error) => {
        console.error('❌ خطأ في تحميل المجموعات:', error);
        adminUtils.showToast('خطأ في تحميل المجموعات', 'error');
    });
}

function loadLecturesSection() {
    const container = document.getElementById('lectures-table-body');
    const searchInput = document.getElementById('search-lectures');
    const addBtn = document.getElementById('add-lecture-btn');

    if (!container) return;

    let lecturesData = {};
    let searchQuery = '';

    function renderLectures() {
        let filteredData = lecturesData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(lecturesData).forEach(([key, lecture]) => {
                if (!lecture) return;
                const searchText = `${lecture.title || ''} ${lecture.description || ''} ${lecture.date || ''}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = lecture;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'lectures-table-body', 'lecture');
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderLectures();
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openLectureModal();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'lectures'), (snapshot) => {
        lecturesData = snapshot.val() || {};
        window.lecturesData = lecturesData;
        renderLectures();
        adminUtils.applyTranslationsToDynamicContent();
    }, (error) => {
        console.error('❌ خطأ في تحميل المحاضرات:', error);
        adminUtils.showToast('خطأ في تحميل المحاضرات', 'error');
    });
}

function loadSubjectsSection() {
    const container = document.getElementById('subjects-table-body');
    const searchInput = document.getElementById('search-subjects');
    const addBtn = document.getElementById('add-subject-btn');

    if (!container) return;

    let subjectsData = {};
    let searchQuery = '';

    function renderSubjects() {
        let filteredData = subjectsData;
        
        if (searchQuery) {
            filteredData = {};
            Object.entries(subjectsData).forEach(([key, subject]) => {
                if (!subject) return;
                const name = typeof subject.name === 'object' ? 
                    (subject.name.ar || subject.name.en || '') : 
                    subject.name || '';
                const description = typeof subject.description === 'object' ? 
                    (subject.description.ar || subject.description.en || '') : 
                    subject.description || '';
                const searchText = `${name} ${description}`.toLowerCase();
                if (searchText.includes(searchQuery.toLowerCase())) {
                    filteredData[key] = subject;
                }
            });
        }
        
        renderDataAsCards(filteredData, 'subjects-table-body', 'subject');
    }

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchQuery = this.value.trim();
            renderSubjects();
        });
    }

    // زر الإضافة
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openSubjectModal();
        });
    }

    // تحميل البيانات
    onValue(ref(database, 'subjects'), (snapshot) => {
        subjectsData = snapshot.val() || {};
        window.subjectsData = subjectsData;
        renderSubjects();
        adminUtils.applyTranslationsToDynamicContent();
    }, (error) => {
        console.error('❌ خطأ في تحميل المواد:', error);
        adminUtils.showToast('خطأ في تحميل المواد', 'error');
    });
}

// ==================== قسم المحتوى الدراسي ====================
function loadContentSection() {
    const dynamicContent = document.getElementById('dynamic-section-content');
    if (!dynamicContent) return;
    
    dynamicContent.innerHTML = `
        <div class="section-title">
            <i class="fas fa-book-open"></i>
            <span id="content-main-title" data-i18n="admin.content.title">إدارة المحتوى الدراسي</span>
        </div>
        
        <div class="section-content">
            <!-- تبويبات المواد الدراسية -->
            <div class="subjects-tabs-wrapper">
                <div id="subjects-tabs" class="subjects-tabs-scroll">
                    <!-- سيتم إضافة أزرار المواد هنا ديناميكياً -->
                </div>
            </div>
            
            <!-- رسالة عدم اختيار مادة -->
            <div id="no-subject-selected" class="content-placeholder">
                <i class="fas fa-book-open"></i>
                <h3 data-i18n="admin.content.selectSubject">اختر مادة دراسية</h3>
                <p data-i18n="admin.content.noSubjects">لا توجد مواد دراسية بعد. قم بإنشاء مواد من قسم المواد الدراسية.</p>
            </div>
            
            <!-- منطقة محتوى المادة المحددة -->
            <div id="subject-content-area" style="display: none;">
                <!-- تبويبات أنواع المحتوى -->
                <div id="content-tabs-container" class="content-type-tabs">
                    <button class="content-type-tab active" data-type="pdfs">
                        <i class="fas fa-file-pdf"></i>
                        <span data-i18n="admin.content.tabPdf">PDF</span>
                    </button>
                    <button class="content-type-tab" data-type="images">
                        <i class="fas fa-image"></i>
                        <span data-i18n="admin.content.tabImages">صور</span>
                    </button>
                    <button class="content-type-tab" data-type="audios">
                        <i class="fas fa-volume-up"></i>
                        <span data-i18n="admin.content.tabAudio">صوت</span>
                    </button>
                </div>
                
                <!-- زر الإضافة -->
                <div class="add-content-btn-wrapper">
                    <button id="add-content-btn" class="add-content-btn">
                        <i class="fas fa-plus"></i>
                        <span data-i18n="admin.content.addPdf">إضافة ملف PDF جديد</span>
                    </button>
                </div>
                
                <!-- لوحات المحتوى -->
                <div class="content-tabs-container">
                    <!-- لوحة PDF -->
                    <div id="pdfs-panel" class="content-tab-panel active">
                        <div class="search-box">
                            <input type="text" id="search-pdfs" class="form-control" 
                                   placeholder="ابحث في ملفات PDF..." data-i18n-placeholder="admin.content.searchPdf">
                        </div>
                        <div class="data-grid" id="pdfs-list"></div>
                    </div>
                    
                    <!-- لوحة الصور -->
                    <div id="images-panel" class="content-tab-panel">
                        <div class="search-box">
                            <input type="text" id="search-images" class="form-control" 
                                   placeholder="ابحث في الصور..." data-i18n-placeholder="admin.content.searchImages">
                        </div>
                        <div class="data-grid" id="images-list"></div>
                    </div>
                    
                    <!-- لوحة الصوتيات -->
                    <div id="audios-panel" class="content-tab-panel">
                        <div class="search-box">
                            <input type="text" id="search-audios" class="form-control" 
                                   placeholder="ابحث في ملفات الصوت..." data-i18n-placeholder="admin.content.searchAudio">
                        </div>
                        <div class="data-grid" id="audios-list"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    adminUtils.applyTranslationsToDynamicContent();
    // تهيئة قسم المحتوى الدراسي
    if (window.contentUtils) {
        window.contentUtils.initContentSection();
    }

    setTimeout(() => {
        setupContentTabsEvents();
    }, 300);
    
    // تحميل المواد الدراسية
    onValue(ref(database, 'subjects'), (snapshot) => {
        const subjectsData = snapshot.val() || {};
        window.subjectsData = subjectsData;
        renderSubjectsTabs(subjectsData);
        
        // إعادة تطبيق الترجمات
        if (window.i18n && window.i18n.applyTranslations) {
            setTimeout(() => {
                window.i18n.applyTranslations();
            }, 100);
        }
    }, (error) => {
        console.error('❌ خطأ في تحميل المواد:', error);
        
        // إظهار رسالة خطأ
        const tabsContainer = document.getElementById('subjects-tabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = `
                <div class="content-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>خطأ في تحميل المواد</h3>
                    <p>تعذر تحميل المواد الدراسية. يرجى المحاولة مرة أخرى.</p>
                </div>
            `;
        }
    });
}

function loadExamsSection() {
    const container = document.getElementById('exams-table-body');
    const searchInput = document.getElementById('search-exams');
    const addBtn = document.getElementById('add-exam-btn');
    const statusFilter = document.getElementById('exam-status-filter');
    const subjectFilter = document.getElementById('exam-subject-filter');

    if (!container) return;

    // تحميل المواد الدراسية للتحديد
    function populateSubjectFilter(subjects) {
        if (!subjectFilter || !subjects) return;
        
        subjectFilter.innerHTML = '<option value="">جميع المواد</option>';
        Object.entries(subjects).forEach(([subjectId, subject]) => {
            const subjectName = subject.name ? 
                (typeof subject.name === 'object' ? subject.name.ar || subject.name.en : subject.name) : 
                'بدون اسم';
            subjectFilter.innerHTML += `<option value="${subjectId}">${subjectName}</option>`;
        });
    }

    // تحميل المواد الدراسية
    onValue(ref(database, 'subjects'), (snapshot) => {
        const subjectsData = snapshot.val() || {};
        window.subjectsData = subjectsData;
        populateSubjectFilter(subjectsData);
        
        // تهيئة قسم الاختبارات
        if (window.examsUtils) {
            window.examsUtils.subjectsData = subjectsData;
        }
    }, (error) => {
        console.error('❌ خطأ في تحميل المواد:', error);
        adminUtils.showToast('خطأ في تحميل المواد الدراسية', 'error');
    });

    // تحميل المجموعات
    onValue(ref(database, 'groups'), (snapshot) => {
        const groupsData = snapshot.val() || {};
        window.groupsData = groupsData;
        
        // تهيئة قسم الاختبارات
        if (window.examsUtils) {
            window.examsUtils.groupsData = groupsData;
        }
    }, (error) => {
        console.error('❌ خطأ في تحميل المجموعات:', error);
        adminUtils.showToast('خطأ في تحميل المجموعات', 'error');
    });

    // تحميل الاختبارات
    refreshExamsGrid();

    adminUtils.applyTranslationsToDynamicContent();
    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            const cards = container.querySelectorAll('.exam-card');
            
            cards.forEach(card => {
                const title = card.querySelector('h4').textContent.toLowerCase();
                card.style.display = title.includes(query) ? '' : 'none';
            });
        });
    }

    // فلتر الحالة
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const status = this.value;
            const cards = container.querySelectorAll('.exam-card');
            
            cards.forEach(card => {
                const examId = card.dataset.id;
                const exam = window.examsData ? window.examsData[examId] : null;
                
                if (!exam) {
                    card.style.display = 'none';
                    return;
                }
                
                if (!status) {
                    card.style.display = '';
                } else if (status === 'published') {
                    card.style.display = exam.isPublished ? '' : 'none';
                } else if (status === 'draft') {
                    card.style.display = !exam.isPublished ? '' : 'none';
                }
            });
        });
    }

    // فلتر المادة الدراسية
    if (subjectFilter) {
        subjectFilter.addEventListener('change', function() {
            const subjectId = this.value;
            const cards = container.querySelectorAll('.exam-card');
            
            cards.forEach(card => {
                const examId = card.dataset.id;
                const exam = window.examsData ? window.examsData[examId] : null;
                
                if (!exam) {
                    card.style.display = 'none';
                    return;
                }
                
                if (!subjectId) {
                    card.style.display = '';
                } else {
                    card.style.display = exam.subjectId === subjectId ? '' : 'none';
                }
            });
        });
    }

    // زر الإضافة
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (window.examsUtils) {
                window.examsUtils.openExamModal();
            } else {
                adminUtils.showToast('لم يتم تحميل أدوات الاختبارات', 'error');
            }
        });
    }
}

// ==================== قسم نتائج الطلاب ====================
function loadResultsSection() {
    const container = document.getElementById('results-groups-container');
    if (!container) return;

    // متغيرات للبيانات
    let allResults = {};
    let allStudents = {};
    let allExams = {};
    let allGroups = {};

     // ✅ تخزين البيانات في النطاق العالمي
    window.allResults = allResults;
    window.usersData = allStudents;
    window.examsData = allExams;

    // متغيرات الفلاتر
    let selectedGroup = '';
    let selectedExam = '';
    let selectedStudent = '';
    let selectedStatus = '';

    // تحميل جميع البيانات
    loadAllResultsData();

    function loadAllResultsData() {
        // تحميل النتائج
        const resultsRef = ref(database, 'examResults');
        onValue(resultsRef, (snapshot) => {
            allResults = snapshot.val() || {};
            
            // تحميل الطلاب
            const usersRef = ref(database, 'users');
            onValue(usersRef, (usersSnapshot) => {
                allStudents = usersSnapshot.val() || {};
                
                // تحميل الامتحانات
                const examsRef = ref(database, 'exams');
                onValue(examsRef, (examsSnapshot) => {
                    allExams = examsSnapshot.val() || {};
                    
                    // تحميل المجموعات
                    const groupsRef = ref(database, 'groups');
                    onValue(groupsRef, (groupsSnapshot) => {
                        allGroups = groupsSnapshot.val() || {};
                        
                        // تهيئة الفلاتر
                        initializeFilters();
                        
                        // عرض النتائج
                        renderResults();
                        
                        // تحديث الإحصائيات
                        updateStats();

                        adminUtils.applyTranslationsToDynamicContent();
                        // ======== إضافة مهمة: تفعيل البحث ========
                        setTimeout(() => {
                            setupSearch();
                        }, 500);
                    });
                });
            });
        }, (error) => {
            console.error('❌ خطأ في تحميل النتائج:', error);
            adminUtils.showToast('خطأ في تحميل نتائج الطلاب', 'error');
        });
    }

    function initializeFilters() {
        // فلتر المجموعات
        const groupFilter = document.getElementById('results-group-filter');
        if (groupFilter) {
            groupFilter.innerHTML = '<option value="">جميع المجموعات</option>';
            Object.entries(allGroups).forEach(([groupId, group]) => {
                const groupName = group.name ? (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 'بدون اسم';
                groupFilter.innerHTML += `<option value="${groupId}">${groupName}</option>`;
            });
            
            groupFilter.addEventListener('change', function() {
                selectedGroup = this.value;
                renderResults();
            });
        }
    
        // فلتر الامتحانات
        const examFilter = document.getElementById('results-exam-filter');
        if (examFilter) {
            examFilter.innerHTML = '<option value="">جميع الاختبارات</option>';
            Object.entries(allExams).forEach(([examId, exam]) => {
                const examName = exam.name || 'بدون اسم';
                examFilter.innerHTML += `<option value="${examId}">${examName}</option>`;
            });
            
            examFilter.addEventListener('change', function() {
                selectedExam = this.value;
                renderResults();
            });
        }
    
        // فلتر الطلاب
        const studentFilter = document.getElementById('results-student-filter');
        if (studentFilter) {
            studentFilter.innerHTML = '<option value="">جميع الطلاب</option>';
            Object.entries(allStudents).forEach(([userId, user]) => {
                if (user.role === 'student') {
                    const studentName = user.name || user.email || 'طالب غير معروف';
                    studentFilter.innerHTML += `<option value="${userId}">${studentName}</option>`;
                }
            });
            
            studentFilter.addEventListener('change', function() {
                selectedStudent = this.value;
                renderResults();
            });
        }
    
        // فلتر الحالة
        const statusFilter = document.getElementById('results-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                selectedStatus = this.value;
                renderResults();
            });
        }
    
        // زر التصدير
        const exportBtn = document.getElementById('export-results-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportResults);
        }
    }

    function renderResults() {
        const container = document.getElementById('results-groups-container');
        if (!container) return;

        // جمع النتائج حسب المجموعات
        const resultsByGroup = {};

        Object.entries(allResults).forEach(([userId, userExams]) => {
            // التحقق مما إذا كان المستخدم طالباً
            if (!allStudents[userId] || allStudents[userId].role !== 'student') return;

            // تطبيق فلتر الطالب
            if (selectedStudent && userId !== selectedStudent) return;

            // الحصول على مجموعة الطالب
            const userGroups = Object.entries(allGroups).filter(([groupId, group]) => 
                group.students && group.students[userId]
            );

            // إذا لم يكن الطالب في أي مجموعة، نضعه في "بدون مجموعة"
            const groupId = userGroups.length > 0 ? userGroups[0][0] : 'no-group';
            
            // تطبيق فلتر المجموعة
            if (selectedGroup && groupId !== selectedGroup) return;

            if (!resultsByGroup[groupId]) {
                resultsByGroup[groupId] = [];
            }

            // معالجة كل امتحان للطالب
            Object.entries(userExams).forEach(([examId, result]) => {
                // تطبيق فلتر الامتحان
                if (selectedExam && examId !== selectedExam) return;

                // التحقق من وجود بيانات الامتحان
                if (!allExams[examId]) return;

                // تحديد حالة النتيجة
                const score = result.score || 0;
                let status = 'average';
                if (score >= 75) status = 'passed';
                else if (score < 50) status = 'failed';

                // تطبيق فلتر الحالة
                if (selectedStatus && status !== selectedStatus) return;

                // إضافة النتيجة
                resultsByGroup[groupId].push({
                    userId,
                    studentName: allStudents[userId].name || allStudents[userId].email || 'طالب غير معروف',
                    studentEmail: allStudents[userId].email || '',
                    examId,
                    examName: allExams[examId].name || 'اختبار غير معروف',
                    examTotalPoints: allExams[examId].totalPoints || 100,
                    score: result.score || 0,
                    status: status,
                    timestamp: result.timestamp || Date.now(),
                    answers: result.answers || {},
                    groupId: groupId,
                    groupName: groupId === 'no-group' ? 'بدون مجموعة' : 
                        (allGroups[groupId].name ? 
                            (typeof allGroups[groupId].name === 'object' ? 
                                allGroups[groupId].name.ar || allGroups[groupId].name.en : 
                                allGroups[groupId].name) : 'بدون اسم')
                });
            });
        });

        // عرض النتائج
        displayResultsByGroup(resultsByGroup);
    }

    function displayResultsByGroup(resultsByGroup) {
        const container = document.getElementById('results-groups-container');
        if (!container) return;
    
        if (Object.keys(resultsByGroup).length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-bar"></i>
                    <span data-i18n="admin.results.noResults">لا توجد نتائج تطابق معايير البحث</span>
                </div>
            `;
            return;
        }
    
        let html = '';
        
        Object.entries(resultsByGroup).forEach(([groupId, groupResults]) => {
            if (groupResults.length === 0) return;
    
            const groupName = groupId === 'no-group' ? 'بدون مجموعة' : 
                (allGroups[groupId].name ? 
                    (typeof allGroups[groupId].name === 'object' ? 
                        allGroups[groupId].name.ar || allGroups[groupId].name.en : 
                        allGroups[groupId].name) : 'بدون اسم');
    
            html += `
                <div class="results-group-container">
                    <div class="results-group-header">
                        <div class="results-group-title">
                            <i class="fas fa-users"></i>
                            <span>${groupName}</span>
                        </div>
                        <div class="results-group-count">${groupResults.length} نتيجة</div>
                    </div>
                    <div class="results-cards-grid">
            `;
    
            groupResults.forEach(result => {
                // تحديد أيقونة الحالة
                let statusIcon = 'fas fa-chart-line';
                let statusClass = 'average';
                let statusText = 'متوسط';
                
                if (result.status === 'passed') {
                    statusIcon = 'fas fa-check-circle';
                    statusClass = 'passed';
                    statusText = 'ناجح';
                } else if (result.status === 'failed') {
                    statusIcon = 'fas fa-times-circle';
                    statusClass = 'failed';
                    statusText = 'راسب';
                }
    
                // تنسيق النتيجة مع اللون المناسب
                let scoreColor = '#f39c12'; // برتقالي للمتوسط
                if (result.score >= 75) scoreColor = '#2ecc71'; // أخضر للناجح
                else if (result.score < 50) scoreColor = '#e74c3c'; // أحمر للراسب
                
                // تقصير النصوص الطويلة
                const studentName = result.studentName.length > 20 ? 
                    result.studentName.substring(0, 20) + '...' : result.studentName;
                const examName = result.examName.length > 25 ? 
                    result.examName.substring(0, 25) + '...' : result.examName;
    
                html += `
                    <div class="result-card" data-user-id="${result.userId}" data-exam-id="${result.examId}" data-student-email="${result.studentEmail}">
                        <div class="result-card-header">
                            <div class="student-avatar">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="result-status-badge ${statusClass}">
                                <i class="${statusIcon}"></i>
                                <span>${statusText}</span>
                            </div>
                        </div>
                        
                        <div class="result-card-body">
                            <h4 class="student-name">${studentName}</h4>
                            <!-- تم إزالة عرض الإيميل هنا -->
                            
                            <div class="exam-info">
                                <i class="fas fa-file-alt"></i>
                                <span class="exam-name">${examName}</span>
                            </div>
                            
                            <div class="result-date">
                                <i class="fas fa-calendar"></i>
                                <span>${new Date(result.timestamp).toLocaleDateString('ar-SA')}</span>
                            </div>
                        </div>
                        
                        <div class="result-card-footer">
                            <div class="score-display" style="color: ${scoreColor}">
                                <span class="score-percentage">${result.score}%</span>
                                <span class="score-label">النتيجة</span>
                            </div>
                            
                            <div class="result-actions">
                                <button class="result-action-btn view-btn" title="عرض التفاصيل">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
    
            html += `
                    </div>
                </div>
            `;
        });
    
        container.innerHTML = html;
    
        // إضافة أحداث النقر على البطاقات
        document.querySelectorAll('.result-card').forEach(card => {
            const viewBtn = card.querySelector('.view-btn');
            const userId = card.dataset.userId;
            const examId = card.dataset.examId;
            
            // حدث النقر على زر العرض
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewResultDetails(userId, examId);
                });
            }
            
            // حدث النقر على البطاقة نفسها
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.result-action-btn')) {
                    viewResultDetails(userId, examId);
                }
            });
        });
    }

    function updateStats() {
        let totalStudents = 0;
        let totalExams = 0;
        let totalScore = 0;
        let resultCount = 0;
        let topScore = 0;

        // عد الطلاب الذين لديهم نتائج
        const studentsWithResults = new Set();
        
        Object.entries(allResults).forEach(([userId, userExams]) => {
            if (allStudents[userId] && allStudents[userId].role === 'student') {
                studentsWithResults.add(userId);
                totalStudents++;
                
                Object.entries(userExams).forEach(([examId, result]) => {
                    totalExams++;
                    const score = result.score || 0;
                    totalScore += score;
                    resultCount++;
                    
                    if (score > topScore) {
                        topScore = score;
                    }
                });
            }
        });

        // تحديث الإحصائيات
        document.getElementById('total-students').textContent = totalStudents;
        document.getElementById('total-exams').textContent = totalExams;
        
        const average = resultCount > 0 ? Math.round(totalScore / resultCount) : 0;
        document.getElementById('average-score').textContent = average + '%';
        document.getElementById('top-score').textContent = topScore + '%';
    }

    function exportResults() {
        // جمع جميع النتائج المرشحة
        const exportData = [];
        
        Object.entries(allResults).forEach(([userId, userExams]) => {
            if (!allStudents[userId] || allStudents[userId].role !== 'student') return;

            Object.entries(userExams).forEach(([examId, result]) => {
                if (!allExams[examId]) return;

                // تطبيق نفس الفلاتر
                if (selectedStudent && userId !== selectedStudent) return;
                if (selectedExam && examId !== selectedExam) return;
                
                const score = result.score || 0;
                let status = 'average';
                if (score >= 75) status = 'passed';
                else if (score < 50) status = 'failed';
                
                if (selectedStatus && status !== selectedStatus) return;

                exportData.push({
                    الطالب: allStudents[userId].name || allStudents[userId].email || 'طالب غير معروف',
                    البريد_الإلكتروني: allStudents[userId].email || '',
                    الاختبار: allExams[examId].name || 'اختبار غير معروف',
                    النتيجة: score + '%',
                    الحالة: status === 'passed' ? 'ناجح' : status === 'failed' ? 'راسب' : 'متوسط',
                    التاريخ: adminUtils.formatDate(result.timestamp),
                    الدرجة_الكاملة: allExams[examId].totalPoints || 100
                });
            });
        });

        if (exportData.length === 0) {
            adminUtils.showToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }

        // تحويل إلى CSV
        const csvContent = convertToCSV(exportData);
        
        // تنزيل الملف
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `نتائج_الطلاب_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        adminUtils.showToast('تم تصدير النتائج بنجاح', 'success');
    }

    function convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvRows = [];
        
        // إضافة رأسيات بالعربية
        csvRows.push(headers.join(','));
        
        // إضافة البيانات
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }

    // ==================== دالة البحث ====================
    function filterResultsBySearch(query) {
        const resultCards = document.querySelectorAll('.result-card');
        
        if (!resultCards || resultCards.length === 0) {
            console.log('⚠️ لا توجد بطاقات نتائج لعرضها');
            return;
        }
        
        console.log(`🔍 البحث عن: "${query}" في ${resultCards.length} بطاقة`);
        
        let visibleCards = 0;
        
        resultCards.forEach(card => {
            const studentName = card.querySelector('.student-name')?.textContent.toLowerCase() || '';
            const studentEmail = card.querySelector('.student-email')?.textContent.toLowerCase() || '';
            const examName = card.querySelector('.exam-name')?.textContent.toLowerCase() || '';
            
            const cardText = `${studentName} ${studentEmail} ${examName}`;
            
            if (query === '' || cardText.includes(query)) {
                card.style.display = 'block';
                visibleCards++;
                
                // إظهار المجموعة الأم
                const groupContainer = card.closest('.results-group-container');
                if (groupContainer) {
                    groupContainer.style.display = 'block';
                }
            } else {
                card.style.display = 'none';
            }
        });
        
        // إخفاء المجموعات الفارغة
        document.querySelectorAll('.results-group-container').forEach(group => {
            const cardsInGroup = group.querySelectorAll('.result-card');
            const visibleInGroup = group.querySelectorAll('.result-card[style="display: block"]').length;
            
            if (visibleInGroup === 0 && cardsInGroup.length > 0) {
                group.style.display = 'none';
            }
        });
        
        console.log(`✅ عرض ${visibleCards} من ${resultCards.length} بطاقة`);
    }
    
    // ==================== تهيئة البحث ====================
    function setupSearch() {
        const searchInput = document.getElementById('search-results');
        
        if (!searchInput) {
            console.error('❌ لم يتم العثور على حقل البحث');
            return;
        }
        
        console.log('✅ تهيئة حقل البحث...');
        
        // إزالة أي مستمعات سابقة
        searchInput.removeEventListener('input', handleSearch);
        
        function handleSearch() {
            const query = this.value.trim().toLowerCase();
            console.log(`🔍 بحث: ${query}`);
            filterResultsBySearch(query);
        }
        
        searchInput.addEventListener('input', handleSearch);
    }
}

// ==================== عرض تفاصيل النتيجة مع الإجابات ====================
function viewResultDetails(userId, examId) {
    console.log('📋 عرض تفاصيل النتيجة:', { userId, examId });
    
    // البحث في البيانات المحملة
    let result, student, exam;
    
    // البحث في النتائج
    const resultsRef = ref(database, `examResults/${userId}/${examId}`);
    
    get(resultsRef).then((snapshot) => {
        result = snapshot.val();
        if (!result) {
            adminUtils.showToast('النتيجة غير موجودة', 'error');
            return;
        }
        
        // البحث في بيانات المستخدم
        const userRef = ref(database, `users/${userId}`);
        return get(userRef);
        
    }).then((userSnapshot) => {
        student = userSnapshot.val();
        if (!student) {
            adminUtils.showToast('بيانات الطالب غير موجودة', 'error');
            return;
        }
        
        // البحث في بيانات الامتحان
        const examRef = ref(database, `exams/${examId}`);
        return get(examRef);
        
    }).then((examSnapshot) => {
        exam = examSnapshot.val();
        if (!exam) {
            adminUtils.showToast('بيانات الاختبار غير موجودة', 'error');
            return;
        }
        
        // الآن لدينا كل البيانات، يمكننا عرض المودال
        showResultDetailsModal(userId, examId, result, student, exam);
        
    }).catch((error) => {
        console.error('❌ خطأ في تحميل تفاصيل النتيجة:', error);
        adminUtils.showToast('خطأ في تحميل تفاصيل النتيجة', 'error');
    });
}

// دالة حذف النتيجة
async function deleteResult(userId, examId, modal, modalRoot) {
    try {
        await remove(ref(database, `examResults/${userId}/${examId}`));
        adminUtils.showToast('تم حذف النتيجة بنجاح', 'success');
        
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
        }, 300);
        
        // تحديث العرض
        if (typeof loadResultsSection === 'function') {
            loadResultsSection();
        }
    } catch (error) {
        console.error('❌ خطأ في حذف النتيجة:', error);
        adminUtils.showToast('خطأ في حذف النتيجة', 'error');
    }
}

// دالة حفظ التصحيح اليدوي
async function saveManualCorrection(userId, examId, exam, originalResult, modal, modalRoot) {
    try {
        // جمع جميع حالات التصحيح اليدوي من الواجهة
        const manualCorrections = {};
        const checkboxes = modal.querySelectorAll('.manual-correction-checkbox');
        
        checkboxes.forEach(checkbox => {
            const questionId = checkbox.dataset.questionId;
            manualCorrections[questionId] = checkbox.checked;
        });
        
        // حساب النتيجة الجديدة
        let newScore = 0;
        const totalQuestions = Object.keys(exam.questions || {}).length;
        
        Object.entries(exam.questions || {}).forEach(([questionId, question]) => {
            const isManuallyCorrected = manualCorrections[questionId];
            const wasCorrect = checkAnswerCorrectness(question, originalResult.answers ? originalResult.answers[questionId] : null);
            const finalCorrect = isManuallyCorrected ? true : wasCorrect;
            
            if (finalCorrect) {
                newScore += question.points || 1;
            }
        });
        
        // تحويل النتيجة إلى نسبة مئوية
        const totalPoints = exam.totalPoints || 100;
        const percentage = totalPoints > 0 ? Math.round((newScore / totalPoints) * 100) : 0;
        
        // تحديث البيانات في قاعدة البيانات
        const updates = {
            score: percentage,
            manuallyCorrected: manualCorrections,
            lastManualCorrection: Date.now(),
            correctedBy: auth.currentUser?.email || 'admin'
        };
        
        await update(ref(database, `examResults/${userId}/${examId}`), updates);
        adminUtils.showToast('تم حفظ التصحيح اليدوي بنجاح', 'success');
        
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
        }, 300);
        
        // تحديث العرض
        if (typeof loadResultsSection === 'function') {
            loadResultsSection();
        }
    } catch (error) {
        console.error('❌ خطأ في حفظ التصحيح اليدوي:', error);
        adminUtils.showToast('خطأ في حفظ التصحيح اليدوي', 'error');
    }
}

// ==================== عرض المودال مع تفاصيل النتيجة ====================
function showResultDetailsModal(userId, examId, result, student, exam) {
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const studentName = student.name || student.email || 'طالب غير معروف';
    const studentEmail = student.email || '';
    const examName = exam.name || 'اختبار غير معروف';
    const totalPoints = exam.totalPoints || 100;
    const score = result.score || 0;
    const date = adminUtils.formatDate(result.timestamp);
    
    // تحديد حالة النتيجة
    let statusText = 'متوسط';
    let statusColor = '#f39c12';
    let statusIcon = 'fas fa-chart-line';
    
    if (score >= 75) {
        statusText = 'ناجح';
        statusColor = '#2ecc71';
        statusIcon = 'fas fa-check-circle';
    } else if (score < 50) {
        statusText = 'راسب';
        statusColor = '#e74c3c';
        statusIcon = 'fas fa-times-circle';
    }
    
    // نسخ إجابات الطالب وحالة التصحيح اليدوي
    const userAnswers = JSON.parse(JSON.stringify(result.answers || {}));
    const manuallyCorrected = result.manuallyCorrected || {};
    
    // بناء HTML للأسئلة والإجابات مع خيار التصحيح اليدوي
    let questionsHTML = '';
    let questionNumber = 1;
    
    if (exam.questions && userAnswers) {
        Object.entries(exam.questions).forEach(([questionId, question]) => {
            const userAnswer = userAnswers[questionId];
            const isCorrect = checkAnswerCorrectness(question, userAnswer);
            const isManuallyCorrected = manuallyCorrected[questionId] || false;
            const finalIsCorrect = isManuallyCorrected ? true : isCorrect;
            
            questionsHTML += createQuestionReviewHTML(
                question, 
                userAnswer, 
                finalIsCorrect, 
                isCorrect,
                questionNumber, 
                questionId,
                isManuallyCorrected
            );
            questionNumber++;
        });
    }
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 700px;">
            <div class="modal-header">
                <h2><i class="fas fa-file-alt"></i> مراجعة اختبار الطالب</h2>
                <button class="modal-close-unified">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <!-- معلومات الاختبار والطالب -->
                <div class="exam-review-header">
                    <div class="exam-info-card">
                        <div class="exam-info-content">
                            <h3><i class="${statusIcon}" style="color: ${statusColor}"></i>${examName}</h3>
                            <div class="exam-info-details">
                                <span><i class="fas fa-user"></i> ${studentName}</span>
                                <span><i class="fas fa-envelope"></i> ${studentEmail}</span>
                                <span><i class="fas fa-calendar"></i> ${date}</span>
                                <span style="color: ${statusColor}"><i class="fas fa-flag"></i> ${statusText}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- ملخص النتيجة (تم إزالة النسبة المئوية) -->
                <div class="exam-summary">
                    <div class="summary-item">
                        <div class="summary-label">الدرجة</div>
                        <div class="summary-value">${score}/${totalPoints}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">عدد الأسئلة</div>
                        <div class="summary-value">${exam.questions ? Object.keys(exam.questions).length : 0}</div>
                    </div>
                </div>
                
                <!-- الأسئلة والإجابات -->
                <div class="exam-questions-review">
                    <h3 class="section-title"><i class="fas fa-question-circle"></i> الأسئلة والإجابات</h3>
                    <div class="manual-correction-note">
                        <i class="fas fa-info-circle"></i>
                        <span>يمكنك التصحيح اليدوي بواسطة تحديد "احتساب الإجابة صحيحة"</span>
                    </div>
                    
                    <div class="questions-container">
                        ${questionsHTML || '<div class="no-questions">لا توجد بيانات للإجابات</div>'}
                    </div>
                </div>
            </div>
            
            <!-- الفوتر مع أزرار الحفظ والحذف -->
            <div class="modal-footer">
                <div class="footer-actions">
                    <button type="button" class="grid-btn save" id="save-manual-correction">
                        <i class="fas fa-save"></i> حفظ 
                    </button>
                    <button type="button" class="grid-btn danger" id="delete-result-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `;

    adminUtils.applyTranslationsToDynamicContent();
    adminUtils.setupModalClose(modal, modalRoot);
    
    // إضافة أحداث لأزرار الفوتر
    // زر الحذف
    modal.querySelector('#delete-result-btn').addEventListener('click', () => {
        if (confirm('هل أنت متأكد من حذف هذه النتيجة؟ سيتم حذف جميع بيانات الإجابات.')) {
            deleteResult(userId, examId, modal, modalRoot);
        }
    });
    
    // زر حفظ التصحيح اليدوي
    modal.querySelector('#save-manual-correction').addEventListener('click', () => {
        saveManualCorrection(userId, examId, exam, result, modal, modalRoot);
    });
    
    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

// ==================== دوال مساعدة ====================
function checkAnswerCorrectness(question, userAnswer) {
    if (!question) return false;
    
    switch(question.type) {
        case 'mc':
            return userAnswer === question.correctIndex;
        case 'tf':
            return userAnswer === question.correctAnswer;
        case 'fb':
            if (!Array.isArray(userAnswer) || !question.blanks) return false;
            for (let i = 0; i < question.blanks.length; i++) {
                if (userAnswer[i] !== question.blanks[i].correctAnswer) {
                    return false;
                }
            }
            return true;
        default:
            return false;
    }
}

function createQuestionReviewHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected = false) {
    let questionHTML = '';
    
    switch(question.type) {
        case 'mc':
            questionHTML = createMCQuestionHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected);
            break;
        case 'tf':
            questionHTML = createTFQuestionHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected);
            break;
        case 'fb':
            questionHTML = createFBQuestionHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected);
            break;
        default:
            questionHTML = `<div class="question-item">نوع السؤال غير معروف</div>`;
    }
    
    return questionHTML;
}

function createMCQuestionHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected = false) {
    let optionsHTML = '';
    
    if (question.options && Array.isArray(question.options)) {
        question.options.forEach((option, index) => {
            const isUserChoice = userAnswer === index;
            const isCorrectOption = index === question.correctIndex;
            
            let optionClass = 'option';
            if (isUserChoice && isCorrectOption) {
                optionClass += ' correct-selected';
            } else if (isUserChoice && !isCorrectOption) {
                optionClass += ' wrong-selected';
            } else if (!isUserChoice && isCorrectOption) {
                optionClass += ' correct-not-selected';
            }
            
            // إزالة العلامات والشارات تماماً
            optionsHTML += `
                <div class="${optionClass}">
                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${option}</span>
                </div>
            `;
        });
    }
    
    // الحصول على الإجابة المختارة والإجابة الصحيحة
    const userAnswerIndex = parseInt(userAnswer);
    const correctIndex = question.correctIndex;
    
    const userAnswerText = !isNaN(userAnswerIndex) && question.options && question.options[userAnswerIndex] 
        ? question.options[userAnswerIndex] 
        : 'لم يجب';
    
    const correctAnswerText = question.options && question.options[correctIndex] 
        ? question.options[correctIndex] 
        : 'غير متاح';
    
    return `
        <div class="question-item mc-question ${finalIsCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <div class="question-number">سؤال ${questionNumber}</div>
                <div class="question-points">${question.points || 1} نقطة</div>
                <div class="question-status ${finalIsCorrect ? 'correct' : 'incorrect'}">
                    ${finalIsCorrect ? '✓ صحيح' : '✗ خطأ'}
                    ${isManuallyCorrected ? ' <i class="fas fa-user-edit" title="مصحح يدوياً"></i>' : ''}
                </div>
            </div>
            
            <div class="question-text">${question.text || 'سؤال بدون نص'}</div>
            
            <div class="question-options">
                ${optionsHTML}
            </div>
            
            <!-- قسم التصحيح - نفس نمط TF وFB -->
            <div class="tf-answers">
                <div class="answer-row">
                    <div class="answer-label">إجابتك:</div>
                    <div class="answer-value ${userAnswerIndex === correctIndex ? 'correct' : 'wrong'}">
                        ${userAnswerText}
                        ${userAnswerIndex === correctIndex ? 
                            '<i class="fas fa-check-circle"></i>' : 
                            '<i class="fas fa-times-circle"></i>'
                        }
                    </div>
                </div>
                
                <div class="answer-row">
                    <div class="answer-label">الإجابة الصحيحة:</div>
                    <div class="answer-value correct-answer">
                        ${correctAnswerText}
                        <i class="fas fa-star"></i>
                    </div>
                </div>
            </div>
            
            ${!originalIsCorrect ? `
                <div class="question-explanation">
                    <strong>التوضيح:</strong> 
                    الإجابة الصحيحة هي: ${question.options && question.options[question.correctIndex] ? 
                        question.options[question.correctIndex] : 'غير متاحة'}
                </div>
            ` : ''}
            
            <div class="manual-correction-control">
                <label class="manual-correction-label">
                    <input type="checkbox" class="manual-correction-checkbox" 
                           data-question-id="${questionId}" ${finalIsCorrect ? 'checked' : ''}>
                    <span>احتساب الإجابة صحيحة</span>
                </label>
            </div>
        </div>
    `;
}

function createTFQuestionHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected = false) {
    const correctAnswerText = question.correctAnswer === true ? 'صح' : 'خطأ';
    const userAnswerText = userAnswer === true ? 'صح' : userAnswer === false ? 'خطأ' : 'لم يجب';
    
    return `
        <div class="question-item tf-question ${finalIsCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <div class="question-number">سؤال ${questionNumber}</div>
                <div class="question-points">${question.points || 1} نقطة</div>
                <div class="question-status ${finalIsCorrect ? 'correct' : 'incorrect'}">
                    ${finalIsCorrect ? '✓ صحيح' : '✗ خطأ'}
                    ${isManuallyCorrected ? ' <i class="fas fa-user-edit" title="مصحح يدوياً"></i>' : ''}
                </div>
            </div>
            
            <div class="question-text">${question.text || 'سؤال بدون نص'}</div>
            
            <div class="tf-answers">
                <div class="answer-row">
                    <div class="answer-label">إجابتك:</div>
                    <div class="answer-value ${userAnswer === question.correctAnswer ? 'correct' : 'wrong'}">
                        ${userAnswerText}
                        ${userAnswer === question.correctAnswer ? 
                            '<i class="fas fa-check-circle"></i>' : 
                            '<i class="fas fa-times-circle"></i>'
                        }
                    </div>
                </div>
                
                <div class="answer-row">
                    <div class="answer-label">الإجابة الصحيحة:</div>
                    <div class="answer-value correct-answer">
                        ${correctAnswerText}
                        <i class="fas fa-star"></i>
                    </div>
                </div>
            </div>
            
            <div class="manual-correction-control">
                <label class="manual-correction-label">
                    <input type="checkbox" class="manual-correction-checkbox" 
                           data-question-id="${questionId}" ${finalIsCorrect ? 'checked' : ''}>
                    <span>احتساب الإجابة صحيحة</span>
                </label>
            </div>
        </div>
    `;
}

function createFBQuestionHTML(question, userAnswer, finalIsCorrect, originalIsCorrect, questionNumber, questionId, isManuallyCorrected = false) {
    let blanksHTML = '';
    
    if (question.blanks && Array.isArray(question.blanks)) {
        question.blanks.forEach((blank, index) => {
            const userBlankAnswer = Array.isArray(userAnswer) ? userAnswer[index] : '';
            const isBlankCorrect = userBlankAnswer === blank.correctAnswer;
            
            blanksHTML += `
                <div class="blank-item ${isBlankCorrect ? 'correct' : 'incorrect'}">
                    <div class="blank-text">${blank.text || `الفراغ ${index + 1}`}</div>
                    <div class="blank-answers">
                        <div class="user-blank">
                            <span class="label">إجابتك:</span>
                            <span class="value ${isBlankCorrect ? 'correct' : 'wrong'}">
                                ${userBlankAnswer || 'فارغ'}
                                ${isBlankCorrect ? 
                                    '<i class="fas fa-check-circle"></i>' : 
                                    '<i class="fas fa-times-circle"></i>'
                                }
                            </span>
                        </div>
                        
                        <div class="correct-blank">
                            <span class="label">الإجابة الصحيحة:</span>
                            <span class="value correct">
                                ${blank.correctAnswer}
                                <i class="fas fa-star"></i>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // التحقق من صحة جميع الفراغات
    const allBlanksCorrect = question.blanks && Array.isArray(question.blanks) && 
        question.blanks.every((blank, index) => {
            const userBlankAnswer = Array.isArray(userAnswer) ? userAnswer[index] : '';
            return userBlankAnswer === blank.correctAnswer;
        });
    
    return `
        <div class="question-item fb-question ${finalIsCorrect ? 'correct' : 'incorrect'}">
            <div class="question-header">
                <div class="question-number">سؤال ${questionNumber}</div>
                <div class="question-points">${question.points || 1} نقطة</div>
                <div class="question-status ${finalIsCorrect ? 'correct' : 'incorrect'}">
                    ${finalIsCorrect ? '✓ صحيح' : '✗ خطأ'}
                    ${isManuallyCorrected ? ' <i class="fas fa-user-edit" title="مصحح يدوياً"></i>' : ''}
                </div>
            </div>
            
            <div class="question-text">${question.text || 'سؤال بدون نص'}</div>
            
            <div class="blanks-container">
                ${blanksHTML}
            </div>
            
            <div class="manual-correction-control">
                <label class="manual-correction-label">
                    <input type="checkbox" class="manual-correction-checkbox" 
                           data-question-id="${questionId}" ${finalIsCorrect ? 'checked' : ''}>
                    <span>احتساب الإجابة صحيحة</span>
                </label>
            </div>
        </div>
    `;
}

function renderSubjectsTabs(subjects) {
    const tabsContainer = document.getElementById('subjects-tabs');
    const noSubjectMsg = document.getElementById('no-subject-selected');
    const subjectContentArea = document.getElementById('subject-content-area');
    
    if (!tabsContainer) return;
    
    tabsContainer.innerHTML = '';
    
    if (!subjects || Object.keys(subjects).length === 0) {
        if (noSubjectMsg) noSubjectMsg.style.display = 'block';
        if (subjectContentArea) subjectContentArea.style.display = 'none';
        return;
    }
    
    // إخفاء الرسالة الافتراضية
    if (noSubjectMsg) noSubjectMsg.style.display = 'none';
    
    // إنشاء أزرار المواد الدراسية
    Object.entries(subjects).forEach(([subjectId, subject]) => {
        const tabButton = document.createElement('button');
        tabButton.className = 'subject-tab-btn';
        tabButton.dataset.subjectId = subjectId;
        
        // الحصول على اسم المادة
        let subjectName = 'بدون اسم';
        if (subject.name) {
            subjectName = typeof subject.name === 'object' ? 
                subject.name.ar || subject.name.en || 'بدون اسم' : 
                subject.name;
        }
        
        // قص الاسم إذا كان طويلاً
        if (subjectName.length > 20) {
            subjectName = subjectName.substring(0, 20) + '...';
        }
        
        tabButton.innerHTML = `
            <i class="${subject.icon || 'fas fa-book'}"></i>
            <span>${subjectName}</span>
        `;
        
        tabButton.addEventListener('click', () => {
            // إزالة النشط من جميع التبويبات
            document.querySelectorAll('.subject-tab-btn').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // إضافة النشط للتبويب المحدد
            tabButton.classList.add('active');
            
            // تحديث عنوان القسم الرئيسي
            const mainTitle = document.getElementById('content-main-title');
            if (mainTitle) {
                mainTitle.innerHTML = `
                    <i class="${subject.icon || 'fas fa-book'}"></i>
                    إدارة مادة: ${subjectName}
                `;
            }
            
            // تمرير بيانات المادة لـ contentUtils
            if (window.contentUtils) {
                window.contentUtils.currentSubjectId = subjectId;
                window.contentUtils.currentSubjectName = subjectName;
                window.contentUtils.currentSubjectIcon = subject.icon || 'fas fa-book';
                
                // تحديث زر الإضافة ليكون للتبويب النشط
                window.contentUtils.updateAddButton('pdfs');
                
                // تحميل محتوى المادة
                window.contentUtils.loadSubjectContent(subjectId, 'pdfs');
            }
            
            // إظهار منطقة محتوى المادة وإخفاء الرسالة
            if (subjectContentArea) {
                subjectContentArea.style.display = 'block';
                subjectContentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            if (noSubjectMsg) {
                noSubjectMsg.style.display = 'none';
            }
            
            // تفعيل تبويب PDF افتراضياً
            setTimeout(() => {
                const pdfTab = document.querySelector('.content-type-tab[data-type="pdfs"]');
                if (pdfTab) {
                    pdfTab.click();
                }
            }, 100);
        });
        
        tabsContainer.appendChild(tabButton);
    });

    adminUtils.applyTranslationsToDynamicContent();
    // لا نقوم بتفعيل أي مادة افتراضياً - نترك المستخدم يختار
    // إخفاء منطقة المحتوى في البداية
    if (subjectContentArea) {
        subjectContentArea.style.display = 'none';
    }
    
    // إظهار رسالة اختيار مادة
    if (noSubjectMsg) {
        noSubjectMsg.style.display = 'block';
    }
}

function setupContentTabsEvents() {
    const contentTabsContainer = document.getElementById('content-tabs-container');
    if (!contentTabsContainer) return;
    
    contentTabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.content-type-tab');
        if (!tab) return;
        
        const type = tab.dataset.type;
        
        // إزالة النشط من جميع التبويبات
        document.querySelectorAll('.content-type-tab').forEach(t => {
            t.classList.remove('active');
        });
        
        // إضافة النشط للتبويب المحدد
        tab.classList.add('active');
        
        // إخفاء جميع الألواح
        document.querySelectorAll('.content-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // إظهار اللوحة المحددة
        const panel = document.getElementById(`${type}-panel`);
        if (panel) {
            panel.classList.add('active');
            
            // تحديث زر الإضافة
            if (window.contentUtils) {
                window.contentUtils.updateAddButton(type);
            }
            
            // تحميل المحتوى إذا كان هناك مادة محددة
            const activeSubjectTab = document.querySelector('.subject-tab-btn.active');
            if (activeSubjectTab && window.contentUtils && window.contentUtils.currentSubjectId) {
                window.contentUtils.loadSubjectContent(window.contentUtils.currentSubjectId, type);
            }
        }
    });
    
    // إعداد زر الإضافة
    const addButton = document.getElementById('add-content-btn');
    if (addButton) {
        addButton.addEventListener('click', () => {
            const activeTab = document.querySelector('.content-type-tab.active');
            if (!activeTab) return;
            
            const type = activeTab.dataset.type;
            if (window.contentUtils) {
                window.contentUtils.openAddModal(type);
            }
        });
    }
    
    // إعداد حقول البحث
    ['pdfs', 'images', 'audios'].forEach(type => {
        const searchInput = document.getElementById(`search-${type}`);
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (window.contentUtils) {
                    window.contentUtils.handleSearch(query, type);
                }
            });
        }
    });

    adminUtils.applyTranslationsToDynamicContent();
}

async function loadSubjectContent(subjectId, subject) {
    const container = document.getElementById('subject-content-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="subject-content-header">
            <h3><i class="${subject.icon || 'fas fa-book'}"></i> ${subject.name?.ar || subject.name || 'بدون اسم'}</h3>
            <p>${subject.description?.ar || subject.description || ''}</p>
        </div>
        
        <div class="content-tabs">
            <button class="content-tab active" data-content-tab="pdf">
                <i class="fas fa-file-pdf"></i>
                <span data-i18n="admin.content.tabPdf">ملفات PDF</span>
            </button>
            <button class="content-tab" data-content-tab="images">
                <i class="fas fa-image"></i>
                <span data-i18n="admin.content.tabImages">الصور</span>
            </button>
            <button class="content-tab" data-content-tab="audio">
                <i class="fas fa-volume-up"></i>
                <span data-i18n="admin.content.tabAudio">النطق</span>
            </button>
        </div>
        
        <!-- محتوى تبويب PDF -->
        <div class="content-tab-content active" id="pdf-tab">
            <div class="add-btn-container">
                <button class="add-btn" onclick="window.contentUtils.openAddModal('${subjectId}', 'pdf')">
                    <i class="fas fa-plus"></i> 
                    <span data-i18n="admin.content.addPdf">إضافة ملف PDF جديد</span>
                </button>
            </div>
            
            <div class="search-box">
                <input type="text" id="search-pdf-${subjectId}" class="form-control" 
                       placeholder="ابحث في ملفات PDF..." data-i18n-placeholder="admin.content.searchPdf">
            </div>
            
            <div id="pdf-list-${subjectId}" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-file-pdf"></i>
                    <span data-i18n="admin.content.noPdf">جاري تحميل ملفات PDF...</span>
                </div>
            </div>
        </div>
        
        <!-- محتوى تبويب الصور -->
        <div class="content-tab-content" id="images-tab">
            <div class="add-btn-container">
                <button class="add-btn" onclick="window.contentUtils.openAddModal('${subjectId}', 'image')">
                    <i class="fas fa-plus"></i> 
                    <span data-i18n="admin.content.addImage">إضافة صورة جديدة</span>
                </button>
            </div>
            
            <div class="search-box">
                <input type="text" id="search-images-${subjectId}" class="form-control" 
                       placeholder="ابحث في الصور..." data-i18n-placeholder="admin.content.searchImages">
            </div>
            
            <div id="images-list-${subjectId}" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-image"></i>
                    <span data-i18n="admin.content.noImages">جاري تحميل الصور...</span>
                </div>
            </div>
        </div>
        
        <!-- محتوى تبويب النطق -->
        <div class="content-tab-content" id="audio-tab">
            <div class="add-btn-container">
                <button class="add-btn" onclick="window.contentUtils.openAddModal('${subjectId}', 'audio')">
                    <i class="fas fa-plus"></i> 
                    <span data-i18n="admin.content.addAudio">إضافة ملف نطق جديد</span>
                </button>
            </div>
            
            <div class="search-box">
                <input type="text" id="search-audio-${subjectId}" class="form-control" 
                       placeholder="ابحث في ملفات النطق..." data-i18n-placeholder="admin.content.searchAudio">
            </div>
            
            <div id="audio-list-${subjectId}" class="data-grid">
                <div class="no-data">
                    <i class="fas fa-volume-up"></i>
                    <span data-i18n="admin.content.noAudio">جاري تحميل ملفات النطق...</span>
                </div>
            </div>
        </div>
    `;
    
    // إضافة أحداث للتبويبات
    container.querySelectorAll('[data-content-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.contentTab;
            container.querySelectorAll('.content-tab-content').forEach(content => content.classList.remove('active'));
            container.querySelectorAll('[data-content-tab]').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // تحميل محتوى المادة
    if (window.contentUtils) {
        window.contentUtils.loadSubjectContent(subjectId);
    }
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

    adminUtils.applyTranslationsToDynamicContent();
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

    adminUtils.applyTranslationsToDynamicContent();
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
        <div class="modal-content-new" style="max-width: 700px;">
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

    adminUtils.applyTranslationsToDynamicContent();
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

// ==================== مودال إنشاء/تعديل مجموعة ====================
function openGroupModal(key = null, item = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // الحصول على قائمة الطلاب (المستخدمين بدور 'student')
    const students = window.usersData ? Object.entries(window.usersData).filter(([uid, user]) => user.role === 'student') : [];
    
    // بناء خيارات الطلاب
    let studentOptions = '';
    if (students.length > 0) {
        students.forEach(([uid, student]) => {
            const studentName = student.name || student.email;
            const isSelected = item && item.students && item.students[uid];
            studentOptions += `
                <label class="select-option">
                    <input type="checkbox" name="students" value="${uid}" ${isSelected ? 'checked' : ''}>
                    <span>${studentName}</span>
                </label>
            `;
        });
    } else {
        studentOptions = `<p class="no-students" data-i18n="admin.groups.modal.noStudents">لا يوجد طلاب مسجلين بعد</p>`;
    }
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 700px;">
            ${adminUtils.createModalHeader(isNew ? 'إنشاء مجموعة جديدة' : 'تعديل المجموعة')}
            
            <form id="groupForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label data-i18n="admin.groups.modal.nameAr">اسم المجموعة (عربي)</label>
                        <input type="text" id="group-name-ar" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.name === 'object' ? item.name.ar || '' : item.name || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.groups.modal.nameEn">اسم المجموعة (إنجليزي)</label>
                        <input type="text" id="group-name-en" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.name === 'object' ? item.name.en || '' : '')}">
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.groups.modal.descriptionAr">الوصف (عربي)</label>
                        <textarea id="group-description-ar" rows="4">${isNew ? '' : adminUtils.escapeHtml(typeof item.description === 'object' ? item.description.ar || '' : item.description || '')}</textarea>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.groups.modal.descriptionEn">الوصف (إنجليزي)</label>
                        <textarea id="group-description-en" rows="4">${isNew ? '' : adminUtils.escapeHtml(typeof item.description === 'object' ? item.description.en || '' : '')}</textarea>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.groups.modal.selectStudents">اختر الطلاب</label>
                        <div class="multi-select-grid">
                            ${studentOptions}
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save" id="save-group">
                        <i class="fas fa-save"></i> ${isNew ? 'إنشاء' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-group-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.applyTranslationsToDynamicContent();
    adminUtils.setupModalClose(modal, modalRoot);

    // حفظ التعديلات
    modal.querySelector('#save-group').addEventListener('click', async () => {
        const name_ar = modal.querySelector('#group-name-ar').value;
        const name_en = modal.querySelector('#group-name-en').value;
        const description_ar = modal.querySelector('#group-description-ar').value;
        const description_en = modal.querySelector('#group-description-en').value;
        
        // جمع الطلاب المحددين
        const selectedStudents = {};
        modal.querySelectorAll('input[name="students"]:checked').forEach(checkbox => {
            selectedStudents[checkbox.value] = true;
        });

        if (!name_ar) {
            adminUtils.showToast('يرجى ملء اسم المجموعة بالعربية', 'error');
            return;
        }

        try {
            const groupData = {
                name: {
                    ar: name_ar,
                    en: name_en || name_ar
                },
                description: {
                    ar: description_ar,
                    en: description_en || description_ar
                },
                students: selectedStudents,
                updatedAt: Date.now(),
                updatedBy: auth.currentUser?.email || 'admin'
            };

            if (isNew) {
                groupData.createdAt = Date.now();
                groupData.createdBy = auth.currentUser?.email || 'admin';
                const newRef = push(ref(database, 'groups'));
                await set(newRef, groupData);
                adminUtils.showToast('تم إنشاء المجموعة بنجاح', 'success');
            } else {
                await update(ref(database, `groups/${key}`), groupData);
                adminUtils.showToast('تم تحديث المجموعة بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
            
        } catch (error) {
            console.error('خطأ في حفظ المجموعة:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-group-btn').addEventListener('click', async () => {
            const name = typeof item.name === 'object' ? 
                (item.name.ar || item.name.en || 'هذه المجموعة') : 
                item.name || 'هذه المجموعة';
            
            if (!confirm(`هل أنت متأكد من حذف المجموعة "${name}"؟`)) return;
            
            try {
                await remove(ref(database, `groups/${key}`));
                adminUtils.showToast('تم حذف المجموعة بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف المجموعة:', error);
                adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        });
    }

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

function openLectureModal(key = null, item = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // الحصول على قائمة المجموعات
    const groups = window.groupsData || {};
    
    // بناء خيارات المجموعات
    let groupOptions = '';
    if (Object.keys(groups).length > 0) {
        Object.entries(groups).forEach(([groupId, group]) => {
            const groupName = group.name ? (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 'بدون اسم';
            const isSelected = item && item.groups && item.groups[groupId];
            groupOptions += `
                <label class="select-option">
                    <input type="checkbox" name="groups" value="${groupId}" ${isSelected ? 'checked' : ''}>
                    <span>${groupName}</span>
                </label>
            `;
        });
    } else {
        groupOptions = `<p class="no-students" data-i18n="admin.lectures.modal.noGroups">لا يوجد مجموعات مسجلة بعد</p>`;
    }
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 700px;">
            ${adminUtils.createModalHeader(isNew ? 'إضافة محاضرة جديدة' : 'تعديل المحاضرة')}
            
            <form id="lectureForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label data-i18n="admin.lectures.modal.title">عنوان المحاضرة</label>
                        <input type="text" id="lecture-title" value="${isNew ? '' : adminUtils.escapeHtml(item.title || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.lectures.modal.description">وصف المحاضرة</label>
                        <textarea id="lecture-description" rows="4">${isNew ? '' : adminUtils.escapeHtml(item.description || '')}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="half">
                            <label data-i18n="admin.lectures.modal.date">تاريخ المحاضرة</label>
                            <input type="date" id="lecture-date" value="${isNew ? '' : (item.date ? new Date(item.date).toISOString().split('T')[0] : '')}" required>
                        </div>
                        <div class="half">
                            <label data-i18n="admin.lectures.modal.time">وقت المحاضرة</label>
                            <input type="time" id="lecture-time" value="${isNew ? '' : (item.time || '')}" required>
                        </div>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.lectures.modal.selectGroups">اختر المجموعات</label>
                        <div class="multi-select-grid">
                            ${groupOptions}
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save" id="save-lecture">
                        <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-lecture-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.applyTranslationsToDynamicContent();
    adminUtils.setupModalClose(modal, modalRoot);

    // حفظ التعديلات
    modal.querySelector('#save-lecture').addEventListener('click', async () => {
        const title = modal.querySelector('#lecture-title').value;
        const description = modal.querySelector('#lecture-description').value;
        const date = modal.querySelector('#lecture-date').value;
        const time = modal.querySelector('#lecture-time').value;
        
        // جمع المجموعات المحددة
        const selectedGroups = {};
        modal.querySelectorAll('input[name="groups"]:checked').forEach(checkbox => {
            selectedGroups[checkbox.value] = true;
        });

        if (!title || !date || !time) {
            adminUtils.showToast('يرجى ملء الحقول المطلوبة', 'error');
            return;
        }

        try {
            // دمج التاريخ والوقت في طابع زمني
            const dateTime = new Date(`${date}T${time}`);
            
            const lectureData = {
                title: title,
                description: description,
                date: dateTime.getTime(), // حفظ كملي ثانية
                dateString: dateTime.toLocaleString('ar-SA'),
                time: time,
                groups: selectedGroups,
                updatedAt: Date.now(),
                updatedBy: auth.currentUser?.email || 'admin'
            };

            if (isNew) {
                lectureData.createdAt = Date.now();
                lectureData.createdBy = auth.currentUser?.email || 'admin';
                const newRef = push(ref(database, 'lectures'));
                await set(newRef, lectureData);
                adminUtils.showToast('تم إضافة المحاضرة بنجاح', 'success');
            } else {
                await update(ref(database, `lectures/${key}`), lectureData);
                adminUtils.showToast('تم تحديث المحاضرة بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
            
        } catch (error) {
            console.error('خطأ في حفظ المحاضرة:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-lecture-btn').addEventListener('click', async () => {
            if (!confirm(`هل أنت متأكد من حذف المحاضرة "${item.title}"؟`)) return;
            
            try {
                await remove(ref(database, `lectures/${key}`));
                adminUtils.showToast('تم حذف المحاضرة بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف المحاضرة:', error);
                adminUtils.showToast('حدث خطأ أثناء الحذف', 'error');
            }
        });
    }

    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
}

function openSubjectModal(key = null, item = null) {
    const isNew = key === null;
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    // الحصول على قائمة المجموعات
    const groups = window.groupsData || {};
    
    // قائمة الأيقونات المقترحة للمواد الدراسية
    const subjectIcons = [
        'fas fa-book', 'fas fa-pen', 'fas fa-calculator', 'fas fa-flask',
        'fas fa-globe', 'fas fa-atom', 'fas fa-dna', 'fas fa-laptop-code',
        'fas fa-paint-brush', 'fas fa-music', 'fas fa-dumbbell', 'fas fa-language',
        'fas fa-history', 'fas fa-map', 'fas fa-microscope', 'fas fa-vial'
    ];
    
    const iconGrid = subjectIcons.map(icon => 
        `<div class="icon-option ${item?.icon === icon ? 'selected' : ''}" data-icon="${icon}">
            <i class="${icon}"></i>
        </div>`
    ).join('');
    
    // بناء خيارات المجموعات
    let groupOptions = '';
    if (Object.keys(groups).length > 0) {
        groupOptions = '';
        Object.entries(groups).forEach(([groupId, group]) => {
            const groupName = group.name ? (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 'بدون اسم';
            const isSelected = item && item.groups && item.groups[groupId];
            groupOptions += `
                <label class="select-option">
                    <input type="checkbox" name="groups" value="${groupId}" ${isSelected ? 'checked' : ''}>
                    <span>${groupName}</span>
                </label>
            `;
        });
    } else {
        groupOptions = `<p class="no-students" data-i18n="admin.subjects.modal.noGroups">لا يوجد مجموعات مسجلة بعد</p>`;
    }
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 700px;">
            ${adminUtils.createModalHeader(isNew ? 'إضافة مادة جديدة' : 'تعديل المادة')}
            
            <form id="subjectForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label data-i18n="admin.subjects.modal.nameAr">اسم المادة (عربي)</label>
                        <input type="text" id="subject-name-ar" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.name === 'object' ? item.name.ar || '' : item.name || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.subjects.modal.nameEn">اسم المادة (إنجليزي)</label>
                        <input type="text" id="subject-name-en" value="${isNew ? '' : adminUtils.escapeHtml(typeof item.name === 'object' ? item.name.en || '' : '')}">
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.subjects.modal.descriptionAr">الوصف (عربي)</label>
                        <textarea id="subject-description-ar" rows="4">${isNew ? '' : adminUtils.escapeHtml(typeof item.description === 'object' ? item.description.ar || '' : item.description || '')}</textarea>
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.subjects.modal.descriptionEn">الوصف (إنجليزي)</label>
                        <textarea id="subject-description-en" rows="4">${isNew ? '' : adminUtils.escapeHtml(typeof item.description === 'object' ? item.description.en || '' : '')}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label data-i18n="admin.subjects.modal.icon">الأيقونة</label>
                        <div class="icon-grid" id="subject-icon-grid">
                            ${iconGrid}
                        </div>
                        <input type="hidden" id="selected-subject-icon" value="${item?.icon || 'fas fa-book'}">
                    </div>
                    
                    <div class="full">
                        <label data-i18n="admin.subjects.modal.selectGroups">اختر المجموعات</label>
                        <p class="field-description" data-i18n="admin.subjects.modal.groupsDescription">اختر المجموعات التي يمكنها الوصول إلى هذه المادة</p>
                        <div class="multi-select-grid">
                            ${groupOptions}
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="grid-btn save" id="save-subject">
                        <i class="fas fa-save"></i> ${isNew ? 'إضافة' : 'حفظ'}
                    </button>
                    ${!isNew ? `
                    <button type="button" class="grid-btn danger" id="delete-subject-btn">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    ` : ''}
                </div>
            </form>
        </div>
    `;

    adminUtils.applyTranslationsToDynamicContent();
    adminUtils.setupModalClose(modal, modalRoot);

    // اختيار الأيقونة
    const iconOptions = modal.querySelectorAll('.icon-option');
    const selectedIconInput = modal.querySelector('#selected-subject-icon');
    iconOptions.forEach(option => {
        option.addEventListener('click', () => {
            iconOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedIconInput.value = option.dataset.icon;
        });
    });

    // حفظ التعديلات
    modal.querySelector('#save-subject').addEventListener('click', async () => {
        const name_ar = modal.querySelector('#subject-name-ar').value;
        const name_en = modal.querySelector('#subject-name-en').value;
        const description_ar = modal.querySelector('#subject-description-ar').value;
        const description_en = modal.querySelector('#subject-description-en').value;
        const icon = selectedIconInput.value;
        
        // جمع المجموعات المحددة
        const selectedGroups = {};
        modal.querySelectorAll('input[name="groups"]:checked').forEach(checkbox => {
            selectedGroups[checkbox.value] = true;
        });

        if (!name_ar) {
            adminUtils.showToast('يرجى ملء اسم المادة بالعربية', 'error');
            return;
        }

        if (Object.keys(selectedGroups).length === 0) {
            adminUtils.showToast('يرجى اختيار مجموعة واحدة على الأقل', 'error');
            return;
        }

        try {
            const subjectData = {
                name: {
                    ar: name_ar,
                    en: name_en || name_ar
                },
                description: {
                    ar: description_ar,
                    en: description_en || description_ar
                },
                icon: icon,
                groups: selectedGroups,
                updatedAt: Date.now(),
                updatedBy: auth.currentUser?.email || 'admin'
            };

            if (isNew) {
                subjectData.createdAt = Date.now();
                subjectData.createdBy = auth.currentUser?.email || 'admin';
                const newRef = push(ref(database, 'subjects'));
                await set(newRef, subjectData);
                adminUtils.showToast('تم إضافة المادة بنجاح', 'success');
            } else {
                await update(ref(database, `subjects/${key}`), subjectData);
                adminUtils.showToast('تم تحديث المادة بنجاح', 'success');
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
            
        } catch (error) {
            console.error('خطأ في حفظ المادة:', error);
            adminUtils.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
        }
    });

    // زر الحذف
    if (!isNew) {
        modal.querySelector('#delete-subject-btn').addEventListener('click', async () => {
            const name = typeof item.name === 'object' ? 
                (item.name.ar || item.name.en || 'هذه المادة') : 
                item.name || 'هذه المادة';
            
            if (!confirm(`⚠️ هل أنت متأكد من حذف المادة "${name}"؟\n\nسيتم حذف كل المحتوى المرتبط بهذه المادة أيضاً.`)) return;
            
            try {
                // حذف محتوى المادة أولاً
                if (window.contentUtils && window.contentUtils.deleteSubjectAllContent) {
                    await window.contentUtils.deleteSubjectAllContent(key);
                }
                
                // حذف المادة نفسها
                await remove(ref(database, `subjects/${key}`));
                adminUtils.showToast('تم حذف المادة بنجاح', 'success');
                
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            } catch (error) {
                console.error('❌ خطأ في حذف المادة:', error);
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
    
    // تحديد نوع الاتصال والبيانات المعروضة
    const isWhatsApp = message.isWhatsApp;
    const contactType = isWhatsApp ? 'رقم الهاتف' : 'البريد الإلكتروني';
    const contactValue = message.contact || 'غير محدد';
    const contactIcon = isWhatsApp ? 'fas fa-phone' : 'fas fa-envelope';
    
    // تنسيق التاريخ
    const messageDate = adminUtils.formatDate(message.timestamp);
    
   modal.innerHTML = `
    <div class="modal-content-new" style="max-width: 800px;">
        ${adminUtils.createModalHeader('تفاصيل الرسالة')}
        
        <!-- حاوية المحتوى مع التمرير -->
        <div class="message-details-container">
            <!-- معلومات المرسل - قسم الاسم فقط -->
            <div class="message-sender-info">
                <div class="sender-avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="sender-details">
                    <h3 class="sender-name">${message.name || 'غير محدد'}</h3>
                </div>
            </div>
            
            <!-- قسم طريقة التواصل -->
            <div class="message-sender-info contact-section">
                <div class="sender-avatar">
                    <i class="${contactIcon}"></i>
                </div>
                <div class="sender-details">
                    <h3 class="sender-name">${isWhatsApp ? 'الهاتف' : 'البريد'}</h3>
                    <div class="contact-value">${contactValue}</div>
                </div>
            </div>
            
            <!-- قسم التاريخ -->
            <div class="message-sender-info date-section">
                <div class="sender-avatar">
                    <i class="fas fa-calendar"></i>
                </div>
                <div class="sender-details">
                    <h3 class="sender-name">التاريخ</h3>
                    <div class="contact-value">${messageDate}</div>
                </div>
            </div>
            
            <!-- قسم الحالة -->
            <div class="message-sender-info status-section">
                <div class="sender-avatar">
                    <i class="fas fa-flag"></i>
                </div>
                <div class="sender-details">
                    <h3 class="sender-name">الحالة</h3>
                    <div class="contact-value">
                        <span class="message-status-badge" style="background: ${statusColors[message.status] || '#95a5a6'}; color: white;">
                            ${statusTexts[message.status] || message.status || 'غير معروف'}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- نص الرسالة -->
            <div class="message-content-container">
                <div class="message-content-title">
                    <i class="fas fa-comment-dots"></i>
                    <h4>نص الرسالة</h4>
                </div>
                <div class="message-text-large">
                    ${adminUtils.escapeHtml(message.message || 'لا توجد رسالة').replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>
        
        <!-- أزرار التحكم -->
        <div class="form-actions">
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

    adminUtils.applyTranslationsToDynamicContent();
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
                
                // تحديث شارة الحالة في الواجهة
                const statusBadge = modal.querySelector('.message-status-badge');
                if (statusBadge) {
                    statusBadge.style.background = statusColors['read'];
                    statusBadge.textContent = statusTexts['read'];
                }
            } catch (error) {
                console.error('❌ خطأ في تحديث حالة الرسالة:', error);
                adminUtils.showToast('حدث خطأ في تحديث الحالة', 'error');
            }
        });
    }

    // زر الرد
    modal.querySelector('#reply-btn').addEventListener('click', () => {
        if (isWhatsApp) {
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
            
            // تحديث شارة الحالة في الواجهة
            const statusBadge = modal.querySelector('.message-status-badge');
            if (statusBadge) {
                statusBadge.style.background = statusColors['replied'];
                statusBadge.textContent = statusTexts['replied'];
            }
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
            
            // تحديث شارة الحالة في الواجهة
            const statusBadge = modal.querySelector('.message-status-badge');
            if (statusBadge) {
                statusBadge.style.background = statusColors['replied'];
                statusBadge.textContent = statusTexts['replied'];
            }
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

function editGroup(key) {
    const group = window.groupsData ? window.groupsData[key] : null;
    if (!group) {
        adminUtils.showToast('المجموعة غير موجودة', 'error');
        return;
    }
    
    openGroupModal(key, group);
}

function editLecture(key) {
    const lecture = window.lecturesData ? window.lecturesData[key] : null;
    if (!lecture) {
        adminUtils.showToast('المحاضرة غير موجودة', 'error');
        return;
    }
    
    openLectureModal(key, lecture);
}

function editSubject(key) {
    const subject = window.subjectsData ? window.subjectsData[key] : null;
    if (!subject) {
        adminUtils.showToast('المادة غير موجودة', 'error');
        return;
    }
    
    openSubjectModal(key, subject);
}

function editExam(key) {
    const exam = window.examsData ? window.examsData[key] : null;
    if (!exam) {
        adminUtils.showToast('الاختبار غير موجود', 'error');
        return;
    }
    
    // ✅ استخدام examsUtils بشكل صحيح
    if (window.examsUtils && window.examsUtils.openExamModal) {
        // تمرير البيانات الحالية للمواد والمجموعات
        window.examsUtils.subjectsData = window.subjectsData || {};
        window.examsUtils.groupsData = window.groupsData || {};
        window.examsUtils.openExamModal(key, exam);
    } else {
        console.error('❌ examsUtils غير متوفر');
        adminUtils.showToast('خطأ في تحميل أدوات الاختبارات', 'error');
    }
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
    
    // بناء خيارات الدور - الإصدار الصحيح
    let roleOptions = '';
    let roleSelectAttributes = '';
    
    if (user?.role === 'admin') {
        // إذا كان أدمن: نعرض فقط "أدمن" بدون خيارات أخرى
        roleOptions = '<option value="admin" selected>أدمن</option>';
        roleSelectAttributes = 'disabled style="cursor: not-allowed; opacity: 0.7;"';
    } else {
        // إذا كان ليس أدمن: نعرض خيارات الطالب وولي الأمر
        roleOptions = `
            <option value="student" ${user?.role === 'student' ? 'selected' : ''}>طالب</option>
            <option value="parent" ${user?.role === 'parent' ? 'selected' : ''}>ولي أمر</option>
        `;
        roleSelectAttributes = '';
    }
    
    // البناء الشرطي لحقل تعيين الطالب
    const studentAssignmentFieldHTML = `
        <div class="full" id="student-assignment-field" style="display: ${user?.role === 'parent' ? 'block' : 'none'};">
            <label>تعيين طالب</label>
            <div class="student-assignment-wrapper">
                <select name="assignedStudent" id="assigned-student" class="student-select">
                    <option value="">اختر طالباً...</option>
                </select>
                <div class="student-selection-info" id="student-selection-info" style="display: none;">
                    <div class="selected-student-preview">
                        <i class="fas fa-user-graduate"></i>
                        <div>
                            <strong id="selected-student-name">اسم الطالب</strong>
                            <small id="selected-student-email">البريد الإلكتروني</small>
                        </div>
                    </div>
                    <button type="button" class="clear-student-btn" id="clear-student-btn">
                        <i class="fas fa-times"></i> إلغاء الاختيار
                    </button>
                </div>
            </div>
            <small class="field-description">اختر الطالب المرتبط بهذا ولي الأمر</small>
        </div>
    `;
    
    // HTML لحقل كلمة المرور مع زر العين - كما كان في الأصل
    const passwordFieldHTML = isNew 
        ? `
            <div class="full">
                <label>كلمة المرور</label>
                <div class="password-input-group">
                    <input type="password" name="password" id="user-password" required placeholder="كلمة المرور الجديدة">
                    <button type="button" class="toggle-password-btn" id="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <small class="field-description">أدخل كلمة مرور جديدة للمستخدم</small>
            </div>
        `
        : `
            <div class="full">
                <label>كلمة المرور</label>
                <div class="password-input-group">
                    <input type="password" name="password" id="user-password" readonly placeholder="**********" value="**********">
                    <button type="button" class="toggle-password-btn" id="toggle-password">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <small class="field-description">
                    <i class="fas fa-info-circle"></i> لا يمكن عرض كلمة المرور الحالية لأسباب أمنية
                </small>
            </div>
        `;
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 500px;">
            <div class="modal-header">
                <h2>${isNew ? 'إضافة مستخدم' : 'تعديل مستخدم'}</h2>
                <button class="modal-close-unified" aria-label="إغلاق">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="editUserForm">
                <div class="form-compact-new">
                    <div class="full">
                        <label>الاسم</label>
                        <input type="text" name="name" value="${isNew ? '' : adminUtils.escapeHtml(user?.name || '')}" required>
                    </div>
                    
                    <div class="full">
                        <label>البريد الإلكتروني</label>
                        <input type="email" name="email" value="${isNew ? '' : adminUtils.escapeHtml(user?.email || '')}" ${isNew ? '' : 'readonly'}>
                    </div>
                    
                    ${passwordFieldHTML}
                    
                    <div class="full">
                        <label>الدور</label>
                        <select name="role" id="user-role" ${roleSelectAttributes}>
                            ${roleOptions}
                        </select>
                        ${user?.role === 'admin' ? '<small class="field-description" style="color:#e74c3c;"><i class="fas fa-lock"></i> لا يمكن تغيير دور الأدمن</small>' : ''}
                    </div>

                    ${studentAssignmentFieldHTML}
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

    adminUtils.applyTranslationsToDynamicContent();

    adminUtils.setupModalClose(modal, modalRoot);
    
    // وظيفة تبديل إظهار/إخفاء كلمة المرور - كما كانت
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
        
        togglePasswordBtn.setAttribute('title', 'إظهار/إخفاء كلمة المرور');
    }

    // تهيئة حقل تعيين الطالب
    const roleSelect = modal.querySelector('#user-role');
    const studentAssignmentField = modal.querySelector('#student-assignment-field');

    if (roleSelect && studentAssignmentField) {
        // إذا كان مستخدم حالي وولي أمر، ظهر الحقل
        if (user?.role === 'parent') {
            studentAssignmentField.style.display = 'block';
            loadStudentOptions(modal, user?.assignedStudent || '');
        }
        
        // عند تغيير الدور
        roleSelect.addEventListener('change', function() {
            if (this.value === 'parent') {
                studentAssignmentField.style.display = 'block';
                // تحميل خيارات الطلاب
                if (!modal.querySelector('#assigned-student') || modal.querySelector('#assigned-student').options.length <= 1) {
                    loadStudentOptions(modal, '');
                }
            } else {
                studentAssignmentField.style.display = 'none';
            }
        });
        
        // إذا كان إنشاء مستخدم جديد واختر ولي أمر، نحمي الخيارات فوراً
        if (isNew) {
            const checkRole = () => {
                if (roleSelect.value === 'parent') {
                    studentAssignmentField.style.display = 'block';
                    setTimeout(() => {
                        loadStudentOptions(modal, '');
                    }, 100);
                }
            };
            
            roleSelect.addEventListener('change', checkRole);
        }
    }

    // حفظ التعديلات
    modal.querySelector('.save').addEventListener('click', async () => {
        const form = modal.querySelector('#editUserForm');
        const fd = new FormData(form);

        const name = fd.get('name');
        const email = fd.get('email');
        const password = fd.get('password');
        let role = fd.get('role');
        const assignedStudent = fd.get('assignedStudent') || '';

        // تأكيد أن الأدمن يبقى أدمن
        if (user?.role === 'admin') {
            role = 'admin';
        }

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

            // إضافة تعيين الطالب إذا كان ولي أمر
            if (role === 'parent') {
                userData.assignedStudent = assignedStudent;
                
                // تحديث الطالب ليرتبط بولي الأمر
                if (assignedStudent) {
                    await update(ref(database, `users/${assignedStudent}`), {
                        parentId: key || '',
                        updatedAt: Date.now()
                    });
                }
            }

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
            
            if (!confirm(`هل أنت متأكد من حذف المستخدم ${user?.name || user?.email}؟`)) return;
            
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

// ==================== دالة تحميل خيارات الطلاب ====================
function loadStudentOptions(modal, selectedStudentId = '') {
    const studentSelect = modal.querySelector('#assigned-student');
    const studentInfo = modal.querySelector('#student-selection-info');
    const studentName = modal.querySelector('#selected-student-name');
    const studentEmail = modal.querySelector('#selected-student-email');
    
    if (!studentSelect) return;
    
    studentSelect.innerHTML = '<option value="">اختر طالباً...</option>';
    
    // تحميل الطلاب من قاعدة البيانات
    const usersRef = ref(database, 'users');
    get(usersRef).then((snapshot) => {
        const users = snapshot.val() || {};
        let hasStudents = false;
        
        Object.entries(users).forEach(([userId, user]) => {
            if (user && user.role === 'student') {
                hasStudents = true;
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = user.name || user.email || `طالب (${userId.substring(0, 8)}...)`;
                
                if (userId === selectedStudentId) {
                    option.selected = true;
                    // عرض معلومات الطالب المختار
                    if (studentInfo) {
                        studentInfo.style.display = 'block';
                        studentName.textContent = user.name || user.email || 'طالب غير معروف';
                        studentEmail.textContent = user.email || '';
                    }
                }
                
                studentSelect.appendChild(option);
            }
        });
        
        if (!hasStudents) {
            studentSelect.innerHTML = '<option value="">لا يوجد طلاب مسجلين</option>';
            studentSelect.disabled = true;
        }
    }).catch((error) => {
        console.error('❌ خطأ في تحميل الطلاب:', error);
        studentSelect.innerHTML = '<option value="">خطأ في تحميل الطلاب</option>';
        studentSelect.disabled = true;
    });
    
    // حدث تغيير اختيار الطالب
    studentSelect.addEventListener('change', function() {
        const selectedId = this.value;
        
        if (selectedId) {
            // الحصول على بيانات الطالب المختار
            const studentRef = ref(database, `users/${selectedId}`);
            get(studentRef).then((snapshot) => {
                const student = snapshot.val();
                if (student && studentInfo) {
                    studentInfo.style.display = 'block';
                    studentName.textContent = student.name || student.email || 'طالب غير معروف';
                    studentEmail.textContent = student.email || '';
                }
            });
        } else {
            if (studentInfo) {
                studentInfo.style.display = 'none';
            }
        }
    });
    
    // زر إلغاء الاختيار
    const clearBtn = modal.querySelector('#clear-student-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            studentSelect.value = '';
            if (studentInfo) {
                studentInfo.style.display = 'none';
            }
        });
    }
}

// ==================== دالة تهيئة البيانات العالمية ====================
function initGlobalData() {
    console.log('📊 تهيئة البيانات العالمية...');
    
    // تحميل جميع أنواع البيانات
    const refs = {
        'users': ref(database, 'users'),
        'groups': ref(database, 'groups'),
        'subjects': ref(database, 'subjects'),
        'lectures': ref(database, 'lectures'),
        'storeBotResponses': ref(database, 'storeBotResponses'),
        'storeFaqs': ref(database, 'storeFaqs'),
        'storeContactInfo': ref(database, 'storeContactInfo'),
        'customerMessages': ref(database, 'customerMessages'),
        'exams': ref(database, 'exams')
    };
    
    Object.entries(refs).forEach(([key, refPath]) => {
        onValue(refPath, (snapshot) => {
            const data = snapshot.val() || {};
            window[`${key}Data`] = data;
            console.log(`✅ تم تحميل ${key}: ${Object.keys(data).length} عنصر`);
            
            // تحديث العرض إذا كان القسم نشط
            const currentSection = document.querySelector('.section-card.active');
            if (currentSection) {
                const sectionId = currentSection.dataset.section;
                if (sectionId === `${key}-section`) {
                    setTimeout(() => loadSectionContent(sectionId), 100);
                }
            }
        }, (error) => {
            console.error(`❌ خطأ في تحميل ${key}:`, error);
        });
    });
}

// ==================== تهيئة صفحة الأدمن ====================
function initAdminPage() {
    
    console.log('👑 تهيئة صفحة الأدمن الجديدة...');
    
    window.contentUtils = contentUtils;
    window.examsUtils = examsUtils;
    
    // 1. تهيئة البيانات العالمية أولاً
    initGlobalData();
    
    // 2. تهيئة عرض الأقسام كبطاقات
    setTimeout(() => {
        initAdminSections();
        console.log('✅ تم تهيئة صفحة الأدمن بنجاح');
    }, 500);
    
    // 3. إضافة مستمع حدث للضغط على البطاقات 
    document.addEventListener('click', function(e) {
        const card = e.target.closest('.data-card');
        if (card) {
            const type = card.dataset.type;
            const key = card.dataset.id;
            const item = JSON.parse(card.dataset.item || '{}');
            
            console.log(`🎯 النقر المباشر على بطاقة ${type}:`, key);
            openItemModal(key, item, type);
        }
    });
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
                    const availableHeight = window.innerHeight * 0.90;
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
                        formContent.style.paddingBottom = '120px';
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
// ==================== تحديث شبكة الاختبارات ====================
function refreshExamsGrid() {
    const container = document.getElementById('exams-table-body');
    if (!container) return;
    
    const examsRef = ref(database, 'exams');
    
    onValue(examsRef, (snapshot) => {
        const examsData = snapshot.val() || {};
        window.examsData = examsData;
        renderExams();
        adminUtils.applyTranslationsToDynamicContent();
    }, (error) => {
        console.error('❌ خطأ في تحديث الاختبارات:', error);
        adminUtils.showToast('خطأ في تحديث الاختبارات', 'error');
    });
}

// دالة لعرض الاختبارات
function renderExams() {
    const container = document.getElementById('exams-table-body');
    if (!container || !window.examsData) return;
    
    container.innerHTML = '';
    
    if (Object.keys(window.examsData).length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-file-alt"></i>
                <span>لا توجد اختبارات</span>
            </div>
        `;
        return;
    }
    
    Object.entries(window.examsData).forEach(([key, exam]) => {
        if (!exam) return;
        const card = createExamCardForGrid(key, exam);
        container.appendChild(card);
    });
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

    // مستمع لتغيير اللغة
    document.addEventListener('languageChanged', function(e) {
        console.log('🌐 حدث تغيير اللغة:', e.detail.lang);
        adminUtils.applyTranslationsToDynamicContent();
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
window.editGroup = editGroup;
window.openGroupModal = openGroupModal;
window.editSubject = editSubject;
window.openSubjectModal = openSubjectModal;
window.editExam = editExam;
window.openExamModal = openExamModal;
window.refreshExamsGrid = refreshExamsGrid;
window.renderExams = renderExams;
window.loadAttendanceSection = loadAttendanceSection;

window.openAttendanceModal = function(lectureId) {
    if (window.attendanceUtils && window.attendanceUtils.openAttendanceModal) {
        window.attendanceUtils.openAttendanceModal(lectureId);
    } else {
        console.error('❌ دالة openAttendanceModal غير متوفرة');
        adminUtils.showToast('خطأ في فتح مودال الحضور', 'error');
    }
};
 
window.refreshAttendanceView = function() {
    if (window.loadAttendanceSection) {
        loadAttendanceSection();
    }
};

window.openAttendanceModal = openAttendanceModal;
window.openAttendanceModalNow = openAttendanceModalNow;
window.saveAttendanceNow = saveAttendanceNow;
window.setAllStatus = setAllStatus;
window.closeAttendanceModal = closeAttendanceModal;
window.refreshAttendanceView = refreshAttendanceView;