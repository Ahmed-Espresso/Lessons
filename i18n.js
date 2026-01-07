// ==================== استيراد Firebase من app.js ====================
import { database } from './app.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== دوال الترجمة ====================
let translations = {
    // ============= الترجمات الأساسية =============
    'nav.home': { ar: 'الرئيسية', en: 'Home' },
    'nav.login': { ar: 'الدخول', en: 'Login' },
    'nav.logout': { ar: 'الخروج', en: 'Logout' },
    'nav.language': { ar: 'اللغه', en: 'En' },
    'nav.theme': { ar: 'الثيم', en: 'Theme' },
    
    // ============= صفحة تسجيل الدخول =============
    'login.title': { ar: 'تسجيل الدخول', en: 'Login' },
    'login.email': { ar: 'البريد الإلكتروني', en: 'Email' },
    'login.password': { ar: 'كلمة المرور', en: 'Password' },
    'login.alert': { ar: 'بيانات الدخول غير صحيحة', en: 'Invalid login credentials' },
    'login.button': { ar: 'تسجيل الدخول', en: 'Login' },
    
    // ============= رسائل عامة =============
    'logout.confirm': { ar: 'هل أنت متأكد من تسجيل الخروج؟', en: 'Are you sure you want to logout?' },
    'logout.success': { ar: 'تم تسجيل الخروج بنجاح', en: 'Logout successful' },
    'logout.error': { ar: 'فشل تسجيل الخروج', en: 'Logout failed' },
    'login.success': { ar: 'تم تسجيل الدخول بنجاح', en: 'Login successful' },
    'login.error': { ar: 'فشل تسجيل الدخول', en: 'Login failed' },
    'logging_in': { ar: 'جاري تسجيل الدخول...', en: 'Logging in...' },
    'login_no_role': { ar: 'المستخدم لا يملك صلاحية محددة', en: 'User has no specific role' },
    
    // ============= صفحة الأدمن =============
    'admin.title': { ar: 'لوحة التحكم - نظام إدارة الدروس', en: 'Dashboard - Management System' },
    'admin.header.title': { ar: 'لوحة تحكم الأدمن', en: 'Admin Dashboard' },
    'admin.header.subtitle': { ar: 'مرحباً بك في لوحة التحكم الخاصة بنظام إدارة الدروس', en: 'Welcome to the management system control panel' },
    
    // تبويبات الأدمن
    'admin.tabs.users': { ar: 'المستخدمين', en: 'Users' },
    'admin.tabs.welcome': { ar: 'رسالة الترحيب', en: 'Welcome Message' },
    'admin.tabs.bot': { ar: 'ردود البوت', en: 'Bot Responses' },
    'admin.tabs.faq': { ar: 'الأسئلة الشائعة', en: 'FAQ' },
    'admin.tabs.contact': { ar: 'معلومات التواصل', en: 'Contact Info' },
    'admin.tabs.messages': { ar: 'الرسائل الواردة', en: 'Messages' },
    'admin.tabs.quickcontact': { ar: 'التواصل السريع', en: 'Quick Contact' },
    
    // إدارة المستخدمين
    'admin.users.title': { ar: 'إدارة المستخدمين', en: 'User Management' },
    'admin.users.search': { ar: 'ابحث في المستخدمين...', en: 'Search users...' },
    'admin.users.add': { ar: 'إضافة مستخدم جديد', en: 'Add New User' },
    'admin.users.table.email': { ar: 'البريد الإلكتروني', en: 'Email' },
    'admin.users.table.role': { ar: 'الدور', en: 'Role' },
    'admin.users.table.regDate': { ar: 'تاريخ التسجيل', en: 'Registration Date' },
    'admin.users.table.actions': { ar: 'الإجراءات', en: 'Actions' },
    'admin.users.noData': { ar: 'جاري تحميل بيانات المستخدمين...', en: 'Loading user data...' },
    'admin.users.empty': { ar: 'لا يوجد مستخدمين مسجلين', en: 'No registered users' },
    'admin.result.defaultTitle': { ar: 'مرحبا', en: 'Welcome' },
    'admin.result.defaultMessage': { ar: 'اختر أحد الأقسام من الأعلى لبدء الإدارة', en: 'Select a section above to start managing' },


    // رسالة الترحيب
    'admin.welcome.title': { ar: 'إدارة رسالة الترحيب', en: 'Welcome Message Management' },
    'admin.welcome.textAr': { ar: 'النص العربي', en: 'Arabic Text' },
    'admin.welcome.textEn': { ar: 'النص الإنجليزي', en: 'English Text' },
    'admin.welcome.saved': { ar: 'تم حفظ رسالة الترحيب بنجاح', en: 'Welcome message saved successfully' },
    
    // ردود البوت
    'admin.bot.title': { ar: 'إدارة ردود البوت', en: 'Bot Responses Management' },
    'admin.bot.search': { ar: 'ابحث في ردود البوت...', en: 'Search bot responses...' },
    'admin.bot.add': { ar: 'إضافة رد جديد', en: 'Add New Response' },
    'admin.bot.table.question': { ar: 'السؤال', en: 'Question' },
    'admin.bot.table.category': { ar: 'الفئة', en: 'Category' },
    'admin.bot.table.order': { ar: 'الترتيب', en: 'Order' },
    'admin.bot.table.actions': { ar: 'الإجراءات', en: 'Actions' },
    'admin.bot.noData': { ar: 'جاري تحميل ردود البوت...', en: 'Loading bot responses...' },
    'admin.bot.category.welcome': { ar: 'ترحيب', en: 'Welcome' },
    'admin.bot.category.general': { ar: 'عام', en: 'General' },
    'admin.bot.category.support': { ar: 'دعم', en: 'Support' },
    'admin.bot.category.lessons': { ar: 'دروس', en: 'Lessons' },
    'admin.bot.import': { ar: 'استيراد من JSON', en: 'Import from JSON' },
    
    // الأسئلة الشائعة
    'admin.faq.title': { ar: 'إدارة الأسئلة الشائعة', en: 'FAQ Management' },
    'admin.faq.search': { ar: 'ابحث في الأسئلة...', en: 'Search questions...' },
    'admin.faq.add': { ar: 'إضافة سؤال جديد', en: 'Add New Question' },
    'admin.faq.table.question': { ar: 'السؤال', en: 'Question' },
    'admin.faq.table.icon': { ar: 'الأيقونة', en: 'Icon' },
    'admin.faq.table.color': { ar: 'اللون', en: 'Color' },
    'admin.faq.table.order': { ar: 'الترتيب', en: 'Order' },
    'admin.faq.table.actions': { ar: 'الإجراءات', en: 'Actions' },
    'admin.faq.noData': { ar: 'جاري تحميل الأسئلة الشائعة...', en: 'Loading FAQ...' },
    
    // معلومات التواصل
    'admin.contact.title': { ar: 'إدارة معلومات التواصل', en: 'Contact Information Management' },
    'admin.contact.search': { ar: 'ابحث في معلومات التواصل...', en: 'Search contact info...' },
    'admin.contact.add': { ar: 'إضافة وسيلة تواصل', en: 'Add Contact Method' },
    'admin.contact.table.name': { ar: 'الاسم', en: 'Name' },
    'admin.contact.table.icon': { ar: 'الأيقونة', en: 'Icon' },
    'admin.contact.table.link': { ar: 'الرابط', en: 'Link' },
    'admin.contact.table.order': { ar: 'الترتيب', en: 'Order' },
    'admin.contact.table.actions': { ar: 'الإجراءات', en: 'Actions' },
    'admin.contact.noData': { ar: 'جاري تحميل معلومات التواصل...', en: 'Loading contact info...' },
    
    // الرسائل الواردة
    'admin.messages.title': { ar: 'الرسائل الواردة', en: 'Incoming Messages' },
    'admin.messages.search': { ar: 'ابحث في الرسائل...', en: 'Search messages...' },
    'admin.messages.table.name': { ar: 'الاسم', en: 'Name' },
    'admin.messages.table.contact': { ar: 'التواصل', en: 'Contact' },
    'admin.messages.table.message': { ar: 'الرسالة', en: 'Message' },
    'admin.messages.table.date': { ar: 'التاريخ', en: 'Date' },
    'admin.messages.table.status': { ar: 'الحالة', en: 'Status' },
    'admin.messages.table.actions': { ar: 'الإجراءات', en: 'Actions' },
    'admin.messages.noData': { ar: 'جاري تحميل الرسائل...', en: 'Loading messages...' },
    'admin.messages.status.new': { ar: 'جديد', en: 'New' },
    'admin.messages.status.read': { ar: 'مقروء', en: 'Read' },
    'admin.messages.status.replied': { ar: 'تم الرد', en: 'Replied' },
    'admin.messages.markRead': { ar: 'تحديد كمقروء', en: 'Mark as Read' },
    'admin.messages.markReplied': { ar: 'تحديد كتم الرد', en: 'Mark as Replied' },
    'admin.messages.delete': { ar: 'حذف', en: 'Delete' },
    'admin.messages.view': { ar: 'عرض', en: 'View' },
    'admin.messages.empty': { ar: 'لا توجد رسائل', en: 'No messages' },
    
    // التواصل السريع
    'admin.quickcontact.title': { ar: 'إعدادات التواصل السريع', en: 'Quick Contact Settings' },
    'admin.quickcontact.successMessage': { ar: 'رسالة النجاح', en: 'Success Message' },
    'admin.quickcontact.errorMessage': { ar: 'رسالة الخطأ', en: 'Error Message' },
    'admin.quickcontact.enableWhatsApp': { ar: 'تفعيل واتساب', en: 'Enable WhatsApp' },
    'admin.quickcontact.saved': { ar: 'تم حفظ الإعدادات بنجاح', en: 'Settings saved successfully' },

    'contactForm.countryCode': { ar: 'رمز الدوله', en: 'country' },
    'contactForm.countryCodePlaceholder': { ar: 'رمز الدوله', en: 'country' },
    // أزرار عامة
    'admin.common.save': { ar: 'حفظ', en: 'Save' },
    'admin.common.preview': { ar: 'معاينة', en: 'Preview' },
    'admin.common.edit': { ar: 'تعديل', en: 'Edit' },
    'admin.common.delete': { ar: 'حذف', en: 'Delete' },
    'admin.common.close': { ar: 'إغلاق', en: 'Close' },
    'admin.common.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'admin.common.confirmDelete': { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
    
    // ============= صفحة الطالب =============
    'student.title': { ar: 'لوحة الطالب - نظام إدارة الدروس', en: 'Student Dashboard - Management System' },
    'student.header.title': { ar: 'لوحة الطالب', en: 'Student Dashboard' },
    'student.header.subtitle': { ar: 'مرحباً بك في لوحة الطالب - نظام إدارة الدروس', en: 'Welcome to the student dashboard - Management System' },
    'student.comingSoon.title': { ar: 'قيد التطوير', en: 'Under Development' },
    'student.comingSoon.message': { ar: 'هذه الصفحة قيد التطوير، وسيتم إضافة الميزات قريباً', en: 'This page is under development, features will be added soon' },
    
    // ============= صفحة ولي الأمر =============
    'parent.title': { ar: 'لوحة ولي الأمر - نظام إدارة الدروس', en: 'Parent Dashboard - Management System' },
    'parent.header.title': { ar: 'لوحة ولي الأمر', en: 'Parent Dashboard' },
    'parent.header.subtitle': { ar: 'مرحباً بك في لوحة متابعة الطالب - نظام إدارة الدروس', en: 'Welcome to the student tracking panel - Management System' },
    'parent.comingSoon.title': { ar: 'قيد التطوير', en: 'Under Development' },
    'parent.comingSoon.message': { ar: 'هذه الصفحة قيد التطوير، وسيتم إضافة الميزات قريباً', en: 'This page is under development, features will be added soon' },
    
    // ============= البوت والمحتوى =============
    'bot.title': { ar: 'ريبيكا', en: 'Rebecca' },
    'bot.name': { ar: 'ريبيكا', en: 'Rebecca' },
    'bot.status': { ar: 'متصل الآن', en: 'Online now' },
    'bot.welcome': { ar: 'مرحباً!', en: 'Welcome!' },
    'bot.prompt': { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
    'bot.reply.welcome': { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
    'bot.reply.notUnderstand': { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." },
    'bot.inputPlaceholder': { ar: 'كلمني . . .', en: 'Talk to me . . .' },
    
    // ============= الأقسام الأخرى =============
    'site.title': { ar: 'نظام إدارة الدروس', en: 'Lesson Management System' },
    'about.title': { ar: 'من نحن', en: 'About Us' },
    'faq.title': { ar: 'سؤال و جواب', en: 'FAQ' },
    'contact.title': { ar: 'التواصل', en: 'Contact' },
    'contactForm.title': { ar: 'تواصل معنا', en: 'Contact Us' },
    'contactForm.name': { ar: 'الاسم', en: 'Name' },
    'contactForm.countryCode': { ar: 'رمز الدولة', en: 'Country Code' },
    'contactForm.contact': { ar: 'الرقم/الإيميل', en: 'Phone/Email' },
    'contactForm.message': { ar: 'الرسالة', en: 'Message' },
    'contactForm.submit': { ar: 'إرسال الرسالة', en: 'Send Message' },
    'contactForm.namePlaceholder': { ar: 'أدخل اسمك', en: 'Enter your name' },
    'contactForm.countryCodePlaceholder': { ar: 'اختر الدولة', en: 'Select Country' },
    'contactForm.contactPlaceholder': { ar: 'أدخل رقم الهاتف أو الإيميل', en: 'Enter your phone or email' },
    'contactForm.messagePlaceholder': { ar: 'اكتب رسالتك هنا...', en: 'Write your message here...' },
    
    // ============= التواصل السريع =============
    'qc.warn.name': { ar: 'الرجاء إدخال الاسم', en: 'Please enter your name' },
    'qc.warn.contact': { ar: 'الرجاء إدخال رقم الهاتف أو الإيميل', en: 'Please enter your phone number or email' },
    'qc.success': { ar: 'تم إرسال الرسالة بنجاح', en: 'Message sent successfully' },
    'qc.failed': { ar: 'فشل في إرسال الرسالة', en: 'Failed to send message' },
    'phone.example': { ar: 'مثال', en: 'Example' },
    'phone.invalid': { ar: 'رقم الهاتف غير صحيح', en: 'Invalid phone number' },
    
    // ============= رسائل التحميل =============
    'loading.message': { ar: 'جاري التحميل...', en: 'Loading...' },
    'botwelcm': { ar: 'مرحباً!', en: 'Welcome!' },
    'botwelcm2': { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
    'bot_reply_rewelcome': { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
    'bot_reply_not_understand': { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." }
};

let currentLang = localStorage.getItem('lang') || 'ar';
const elementsMap = {};

// ==================== الدوال الرئيسية ====================
function initI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!elementsMap[key]) elementsMap[key] = [];
    el.dataset.fallback = el.innerHTML.trim();
    elementsMap[key].push(el);
  });
  
  // معالجة placeholders الخاصة
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (!elementsMap[key]) elementsMap[key] = [];
    el.dataset.fallback = el.placeholder;
    elementsMap[key].push(el);
  });
  
  updateLanguageButton();
  applyTranslations();

  onValue(ref(database, 'translate'),
    snap => {
      const dbTrans = snap.val() || {};
      Object.assign(translations, dbTrans);
      applyTranslations();
    },
    err => console.error('i18n Firebase error:', err)
  );
}

function applyTranslations() {
    Object.entries(elementsMap).forEach(([key, els]) => {
        const txt = translations[key]?.[currentLang] || els[0].dataset.fallback || '';
        els.forEach(el => {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = txt;
            } else {
                el.innerHTML = txt;
            }
        });
    });
    
    updatePageTitle();
    updateAdditionalTexts();
    updateSelectOptions();
}

function setLanguage(lang) {
    if (!['ar', 'en'].includes(lang)) return;
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    updateLanguageButton();
    applyTranslations();
    
    // إرسال حدث لتحديث جميع العناصر فوراً
    const event = new CustomEvent('languageChanged', {
        detail: { lang: lang }
    });
    document.dispatchEvent(event);
    
    console.log('🌐 تم تغيير اللغة إلى:', lang);
}

function toggleLanguage() {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
}

function getTranslatedText(key) {
  return translations[key]?.[currentLang] || translations[key]?.ar || key;
}

// ==================== الدوال المساعدة ====================
function updateLanguageButton() {
    const lbl = document.getElementById('language-label');
    if (lbl) {
        lbl.textContent = currentLang === 'ar' ? 'English' : 'العربية';
    }
}

function updatePageTitle() {
    const path = window.location.pathname;
    let titleKey = 'site.title';
    
    if (path.includes('admin.html')) {
        titleKey = 'admin.title';
    } else if (path.includes('student.html')) {
        titleKey = 'student.title';
    } else if (path.includes('parent.html')) {
        titleKey = 'parent.title';
    }
    
    const pageTitle = getTranslatedText(titleKey);
    if (pageTitle) {
        document.title = pageTitle;
    }
}

function updateAdditionalTexts() {
    const themeLabel = document.getElementById('theme-label');
    if (themeLabel) {
        themeLabel.textContent = getTranslatedText('nav.theme');
    }
}

function updateSelectOptions() {
    // تحديث خيارات حالة الرسائل
    const statusFilter = document.getElementById('message-status-filter');
    if (statusFilter) {
        const options = statusFilter.querySelectorAll('option');
        options[0].textContent = getTranslatedText('admin.common.all');
        options[1].textContent = getTranslatedText('admin.messages.status.new');
        options[2].textContent = getTranslatedText('admin.messages.status.read');
        options[3].textContent = getTranslatedText('admin.messages.status.replied');
    }
    
    // تحديث خيارات تفعيل واتساب
    const whatsappSelect = document.getElementById('qc-enable-whatsapp');
    if (whatsappSelect) {
        const options = whatsappSelect.querySelectorAll('option');
        options[0].textContent = getTranslatedText('admin.quickcontact.enabled');
        options[1].textContent = getTranslatedText('admin.quickcontact.disabled');
    }
}

// ==================== كائن i18n للاستخدام العام ====================
const i18n = {
    get currentLang() {
        return currentLang;
    },
    translations,
    init: initI18n,
    toggleLanguage,
    setLanguage,
    applyTranslations,
    translate: getTranslatedText,
    getTranslatedText
};

// ==================== التهيئة والتصدير ====================
document.addEventListener('DOMContentLoaded', function() {
    initI18n();
});

window.i18n = i18n;

export { initI18n, setLanguage, applyTranslations, translations, currentLang, getTranslatedText, i18n, toggleLanguage };