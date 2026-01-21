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
    // قسم المحتوى الدراسي
    'admin.tabs.content': { ar: 'المحتوى الدراسي', en: 'Study Content' },
    'admin.content.title': { ar: 'إدارة المحتوى الدراسي', en: 'Study Content Management' },
    'admin.content.selectSubject': { ar: 'اختر مادة دراسية لعرض محتواها', en: 'Select a subject to view its content' },
    'admin.content.noSubjects': { ar: 'لا توجد مواد دراسية بعد', en: 'No subjects available' },
    'admin.content.tabPdf': { ar: 'PDF', en: 'PDF' },
    'admin.content.tabImages': { ar: 'صور', en: 'Images' },
    'admin.content.tabAudio': { ar: 'صوت', en: 'Audio' },
    'admin.content.addPdf': { ar: 'إضافة ملف PDF جديد', en: 'Add New PDF' },
    'admin.content.addImage': { ar: 'إضافة صورة جديدة', en: 'Add New Image' },
    'admin.content.addAudio': { ar: 'إضافة ملف صوتي جديد', en: 'Add New Audio' },
    'admin.content.searchPdf': { ar: 'ابحث في ملفات PDF...', en: 'Search PDF files...' },
    'admin.content.searchImages': { ar: 'ابحث في الصور...', en: 'Search images...' },
    'admin.content.searchAudio': { ar: 'ابحث في ملفات الصوت...', en: 'Search audio files...' },
    'admin.content.noPdf': { ar: 'لا توجد ملفات PDF بعد', en: 'No PDF files yet' },
    'admin.content.noImages': { ar: 'لا توجد صور بعد', en: 'No images yet' },
    'admin.content.noAudio': { ar: 'لا توجد ملفات صوتية بعد', en: 'No audio files yet' },
    'admin.content.chooseGroups': { ar: 'اختر المجموعات', en: 'Select Groups' },
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
    
    'admin.tabs.about': { ar: 'من نحن', en: 'About Us' },
    'admin.about.title': { ar: 'إدارة محتوى من نحن', en: 'About Us Management' },
    'admin.about.textAr': { ar: 'المحتوى العربي', en: 'Arabic Content' },
    'admin.about.textEn': { ar: 'المحتوى الإنجليزي', en: 'English Content' },
    'admin.about.saved': { ar: 'تم حفظ محتوى من نحن بنجاح', en: 'About Us content saved successfully' },
    
    
    // قسم المحاضرات القادمة
    'admin.tabs.lectures': { ar: 'المحاضرات القادمة', en: 'Upcoming Lectures' },
    'admin.lectures.title': { ar: 'إدارة المحاضرات القادمة', en: 'Upcoming Lectures Management' },
    'admin.lectures.add': { ar: 'إضافة محاضرة جديدة', en: 'Add New Lecture' },
    'admin.lectures.search': { ar: 'ابحث في المحاضرات...', en: 'Search lectures...' },
    'admin.lectures.noData': { ar: 'جاري تحميل المحاضرات...', en: 'Loading lectures...' },
    'admin.lectures.modal.title': { ar: 'عنوان المحاضرة', en: 'Lecture Title' },
    'admin.lectures.modal.description': { ar: 'وصف المحاضرة', en: 'Lecture Description' },
    'admin.lectures.modal.date': { ar: 'تاريخ المحاضرة', en: 'Lecture Date' },
    'admin.lectures.modal.time': { ar: 'وقت المحاضرة', en: 'Lecture Time' },
    'admin.lectures.modal.selectGroups': { ar: 'اختر المجموعات', en: 'Select Groups' },
    'admin.lectures.modal.noGroups': { ar: 'لا يوجد مجموعات مسجلة بعد', en: 'No registered groups yet' },
    
    // تحديث ترجمات قسم اللغة الإنجليزية للمجموعات
    'admin.english.modal.selectGroups': { ar: 'اختر المجموعات المستهدفة', en: 'Select Target Groups' },
    
    'admin.tabs.groups': { ar: 'المجموعات', en: 'Groups' },
    'admin.groups.title': { ar: 'إدارة المجموعات', en: 'Groups Management' },
    'admin.groups.search': { ar: 'ابحث في المجموعات...', en: 'Search groups...' },
    'admin.groups.add': { ar: 'إنشاء مجموعة جديدة', en: 'Create New Group' },
    'admin.groups.table.name': { ar: 'اسم المجموعة', en: 'Group Name' },
    'admin.groups.table.description': { ar: 'الوصف', en: 'Description' },
    'admin.groups.table.studentsCount': { ar: 'عدد الطلاب', en: 'Students Count' },
    'admin.groups.table.actions': { ar: 'الإجراءات', en: 'Actions' },
    'admin.groups.noData': { ar: 'جاري تحميل المجموعات...', en: 'Loading groups...' },
    'admin.groups.empty': { ar: 'لا توجد مجموعات', en: 'No groups' },
    'admin.groups.modal.addTitle': { ar: 'إنشاء مجموعة جديدة', en: 'Create New Group' },
    'admin.groups.modal.editTitle': { ar: 'تعديل المجموعة', en: 'Edit Group' },
    'admin.groups.modal.nameAr': { ar: 'اسم المجموعة (عربي)', en: 'Group Name (Arabic)' },
    'admin.groups.modal.nameEn': { ar: 'اسم المجموعة (إنجليزي)', en: 'Group Name (English)' },
    'admin.groups.modal.descriptionAr': { ar: 'الوصف (عربي)', en: 'Description (Arabic)' },
    'admin.groups.modal.descriptionEn': { ar: 'الوصف (إنجليزي)', en: 'Description (English)' },
    'admin.groups.modal.selectStudents': { ar: 'اختر الطلاب', en: 'Select Students' },
    'admin.groups.modal.noStudents': { ar: 'لا يوجد طلاب مسجلين بعد', en: 'No registered students yet' },

    // قسم المواد الدراسية
    'admin.tabs.subjects': { ar: 'المواد الدراسية', en: 'Subjects' },
    'admin.subjects.title': { ar: 'إدارة المواد الدراسية', en: 'Subjects Management' },
    'admin.subjects.add': { ar: 'إضافة مادة جديدة', en: 'Add New Subject' },
    'admin.subjects.search': { ar: 'ابحث في المواد...', en: 'Search subjects...' },
    'admin.subjects.noData': { ar: 'جاري تحميل المواد...', en: 'Loading subjects...' },
    'admin.subjects.modal.nameAr': { ar: 'اسم المادة (عربي)', en: 'Subject Name (Arabic)' },
    'admin.subjects.modal.nameEn': { ar: 'اسم المادة (إنجليزي)', en: 'Subject Name (English)' },
    'admin.subjects.modal.descriptionAr': { ar: 'الوصف (عربي)', en: 'Description (Arabic)' },
    'admin.subjects.modal.descriptionEn': { ar: 'الوصف (إنجليزي)', en: 'Description (English)' },
    'admin.subjects.modal.icon': { ar: 'الأيقونة', en: 'Icon' },

    // ============= رسائل التحميل =============
    'loading.message': { ar: 'جاري التحميل...', en: 'Loading...' },
    'botwelcm': { ar: 'مرحباً!', en: 'Welcome!' },
    'botwelcm2': { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
    'bot_reply_rewelcome': { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
    'bot_reply_not_understand': { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." },


    'admin.tabs.exams': { ar: 'الاختبارات', en: 'Exams' },
        'admin.exams.title': { ar: 'إدارة الاختبارات', en: 'Exams Management' },
        'admin.exams.search': { ar: 'ابحث في الاختبارات...', en: 'Search exams...' },
        'admin.exams.add': { ar: 'إضافة اختبار جديد', en: 'Add New Exam' },
        'admin.exams.noData': { ar: 'جاري تحميل الاختبارات...', en: 'Loading exams...' },
        
        // نموذج الاختبار
        'admin.exams.modal.title': { ar: 'عنوان الاختبار', en: 'Exam Title' },
        'admin.exams.modal.description': { ar: 'وصف الاختبار', en: 'Exam Description' },
        'admin.exams.modal.duration': { ar: 'مدة الاختبار (دقيقة)', en: 'Exam Duration (minutes)' },
        'admin.exams.modal.totalPoints': { ar: 'الدرجة الكلية', en: 'Total Points' },
        'admin.exams.modal.publishDate': { ar: 'تاريخ النشر', en: 'Publish Date' },
        'admin.exams.modal.status': { ar: 'حالة الاختبار', en: 'Exam Status' },
        'admin.exams.modal.status.draft': { ar: 'مسودة', en: 'Draft' },
        'admin.exams.modal.status.published': { ar: 'نشط', en: 'Published' },
        'admin.exams.modal.selectGroups': { ar: 'اختر المجموعات', en: 'Select Groups' },
        'admin.exams.modal.noGroups': { ar: 'لا يوجد مجموعات مسجلة بعد', en: 'No groups registered yet' },
        'admin.exams.modal.selectSubject': { ar: 'اختر المادة الدراسية', en: 'Select Subject' },
        'admin.exams.modal.subjectPlaceholder': { ar: 'اختر المادة الدراسية (اختياري)', en: 'Select subject (optional)' },
        
        // الأسئلة
        'admin.exams.modal.questions': { ar: 'الأسئلة', en: 'Questions' },
        'admin.exams.modal.addQuestion': { ar: 'إضافة سؤال', en: 'Add Question' },
        'admin.exams.modal.addMCQuestion': { ar: 'إضافة سؤال اختيار من متعدد', en: 'Add Multiple Choice Question' },
        'admin.exams.modal.addTFQuestion': { ar: 'إضافة سؤال صح/خطأ', en: 'Add True/False Question' },
        'admin.exams.modal.addFBQuestion': { ar: 'إضافة سؤال أكمل الفراغ', en: 'Add Fill in the Blank Question' },
        'admin.exams.modal.questionText': { ar: 'نص السؤال', en: 'Question Text' },
        'admin.exams.modal.points': { ar: 'الدرجة', en: 'Points' },
        'admin.exams.modal.optionsCount': { ar: 'عدد الخيارات', en: 'Number of Options' },
        'admin.exams.modal.correctAnswer': { ar: 'الإجابة الصحيحة', en: 'Correct Answer' },
        'admin.exams.modal.correctAnswer.tf.true': { ar: 'صح', en: 'True' },
        'admin.exams.modal.correctAnswer.tf.false': { ar: 'خطأ', en: 'False' },
        'admin.exams.modal.blanksCount': { ar: 'عدد الفراغات', en: 'Number of Blanks' },
        'admin.exams.modal.blankAnswer': { ar: 'الإجابة الصحيحة للفراغ', en: 'Correct Answer for Blank' },
        'admin.exams.modal.deleteQuestion': { ar: 'حذف السؤال', en: 'Delete Question' },
        'admin.exams.modal.options': { ar: 'خيارات', en: 'Options' },
        'admin.exams.modal.optionLabel': { ar: 'خيار', en: 'Option' },
        'admin.exams.modal.correctOptionLabel': { ar: 'الخيار الصحيح', en: 'Correct Option' },
        'admin.exams.modal.blanks': { ar: 'فراغات', en: 'Blanks' },
        
        // رسائل التحقق
        'admin.exams.validation.noName': { ar: 'يرجى إدخال اسم الاختبار', en: 'Please enter exam name' },
        'admin.exams.validation.noQuestions': { ar: 'يرجى إضافة سؤال واحد على الأقل', en: 'Please add at least one question' },
        'admin.exams.validation.questionNoText': { ar: 'يرجى إدخال نص السؤال', en: 'Please enter question text' },
        'admin.exams.validation.optionNoText': { ar: 'يرجى إدخال نص الخيار', en: 'Please enter option text' },
        'admin.exams.validation.blankNoAnswer': { ar: 'يرجى إدخال الإجابة الصحيحة للفراغ', en: 'Please enter correct answer for blank' },
        
        // حالات الاختبار
        'admin.exams.status.draft': { ar: 'مسودة', en: 'Draft' },
        'admin.exams.status.published': { ar: 'نشط', en: 'Published' },
        'admin.exams.status.closed': { ar: 'مغلق', en: 'Closed' },
        
        // إجراءات الاختبار
        'admin.exams.action.create': { ar: 'إنشاء', en: 'Create' },
        'admin.exams.action.save': { ar: 'حفظ', en: 'Save' },
        'admin.exams.action.edit': { ar: 'تعديل', en: 'Edit' },
        'admin.exams.action.delete': { ar: 'حذف', en: 'Delete' },
        'admin.exams.action.preview': { ar: 'معاينة', en: 'Preview' },
        'admin.exams.action.publish': { ar: 'نشر', en: 'Publish' },
        'admin.exams.action.unpublish': { ar: 'إلغاء النشر', en: 'Unpublish' },
        
        // رسائل النجاح/الخطأ
        'admin.exams.success.created': { ar: 'تم إنشاء الاختبار بنجاح', en: 'Exam created successfully' },
        'admin.exams.success.updated': { ar: 'تم تحديث الاختبار بنجاح', en: 'Exam updated successfully' },
        'admin.exams.success.deleted': { ar: 'تم حذف الاختبار بنجاح', en: 'Exam deleted successfully' },
        'admin.exams.success.published': { ar: 'تم نشر الاختبار بنجاح', en: 'Exam published successfully' },
        'admin.exams.error.loading': { ar: 'خطأ في تحميل الاختبارات', en: 'Error loading exams' },
        'admin.exams.error.saving': { ar: 'خطأ في حفظ الاختبار', en: 'Error saving exam' },
        'admin.exams.error.deleting': { ar: 'خطأ في حذف الاختبار', en: 'Error deleting exam' },
        
        // إحصائيات الاختبار
        'admin.exams.stats.questions': { ar: 'سؤال', en: 'Questions' },
        'admin.exams.stats.points': { ar: 'درجة', en: 'Points' },
        'admin.exams.stats.duration': { ar: 'دقيقة', en: 'Minutes' },
        'admin.exams.stats.groups': { ar: 'مجموعة', en: 'Groups' },
        
        // أنواع الأسئلة
        'admin.exams.types.mc': { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
        'admin.exams.types.tf': { ar: 'صح/خطأ', en: 'True/False' },
        'admin.exams.types.fb': { ar: 'أكمل الفراغ', en: 'Fill in the Blank' },
        
        // أوصاف الأنواع
        'admin.exams.description.mc': { ar: 'أسئلة ذات 4 خيارات مع إجابة واحدة صحيحة', en: 'Questions with 4 options and one correct answer' },
        'admin.exams.description.tf': { ar: 'أسئلة تحدد إذا كانت الجملة صحيحة أم خاطئة', en: 'Questions to determine if statement is true or false' },
        'admin.exams.description.fb': { ar: 'أسئلة تكملة الفراغات بإجابات محددة', en: 'Questions to fill blanks with specific answers' },

'student.header.title': { ar: 'لوحة الطالب', en: 'Student Dashboard' },
'student.header.subtitle': { ar: 'مرحباً بك في لوحة الطالب - نظام إدارة الدروس', en: 'Welcome to the student dashboard - Management System' },
'student.tabs.subjects': { ar: 'المواد الدراسية', en: 'Subjects' },
'student.tabs.lectures': { ar: 'محاضراتي القادمة', en: 'My Upcoming Lectures' },
'student.tabs.exams': { ar: 'اختباراتي', en: 'My Exams' },
'student.tabs.results': { ar: 'نتائجي', en: 'My Results' },
'student.tabs.content': { ar: 'المحتوى الدراسي', en: 'Study Content' },
'student.tabs.groups': { ar: 'مجموعاتي', en: 'My Groups' },
'student.result.defaultTitle': { ar: 'مرحباً', en: 'Welcome' },
'student.result.defaultMessage': { ar: 'اختر أحد الأقسام من الأعلى لعرض محتواك', en: 'Select a section above to view your content' },
'student.subjects.title': { ar: 'المواد الدراسية', en: 'Subjects' },
'student.subjects.search': { ar: 'ابحث في المواد الدراسية...', en: 'Search subjects...' },
'student.subjects.noData': { ar: 'جاري تحميل المواد الدراسية...', en: 'Loading subjects...' },
'student.subjects.empty': { ar: 'لا توجد مواد دراسية متاحة', en: 'No subjects available' },
'student.lectures.title': { ar: 'محاضراتي القادمة', en: 'My Upcoming Lectures' },
'student.lectures.search': { ar: 'ابحث في المحاضرات...', en: 'Search lectures...' },
'student.lectures.noData': { ar: 'جاري تحميل المحاضرات القادمة...', en: 'Loading upcoming lectures...' },
'student.lectures.empty': { ar: 'لا توجد محاضرات قادمة', en: 'No upcoming lectures' },
'student.exams.title': { ar: 'اختباراتي', en: 'My Exams' },
'student.exams.search': { ar: 'ابحث في الاختبارات...', en: 'Search exams...' },
'student.exams.noData': { ar: 'جاري تحميل الاختبارات...', en: 'Loading exams...' },
'student.exams.empty': { ar: 'لا توجد اختبارات', en: 'No exams' },
'student.results.title': { ar: 'نتائجي', en: 'My Results' },
'student.results.average': { ar: 'المعدل العام', en: 'Average Score' },
'student.results.totalExams': { ar: 'عدد الاختبارات', en: 'Total Exams' },
'student.results.search': { ar: 'ابحث في النتائج...', en: 'Search results...' },
'student.results.noData': { ar: 'جاري تحميل النتائج...', en: 'Loading results...' },
'student.results.empty': { ar: 'لا توجد نتائج بعد', en: 'No results yet' },
'student.content.title': { ar: 'المحتوى الدراسي', en: 'Study Content' },
'student.content.pdf': { ar: 'PDF', en: 'PDF' },
'student.content.images': { ar: 'صور', en: 'Images' },
'student.content.audio': { ar: 'صوتيات', en: 'Audio' },
'student.content.search': { ar: 'ابحث في المحتوى...', en: 'Search content...' },
'student.content.noData': { ar: 'جاري تحميل المحتوى الدراسي...', en: 'Loading study content...' },
'student.content.empty': { ar: 'لا توجد محتويات دراسية', en: 'No study content' },
'student.groups.title': { ar: 'مجموعاتي', en: 'My Groups' },
'student.groups.noData': { ar: 'جاري تحميل المجموعات...', en: 'Loading groups...' },
'student.groups.empty': { ar: 'لا توجد مجموعات', en: 'No groups' },
// ============= صفحة ولي الأمر =============
'parent.title': { ar: 'لوحة ولي الأمر - نظام إدارة الدروس', en: 'Parent Dashboard - Management System' },
'parent.header.title': { ar: 'لوحة ولي الأمر', en: 'Parent Dashboard' },
'parent.header.subtitle': { ar: 'مرحباً بك في لوحة متابعة الطالب - نظام إدارة الدروس', en: 'Welcome to the student tracking panel - Management System' },

// تبويبات ولي الأمر
'parent.tabs.students': { ar: 'متابعة الطلاب', en: 'Students Tracking' },
'parent.tabs.lectures': { ar: 'محاضرات الطلاب', en: 'Students Lectures' },
'parent.tabs.results': { ar: 'نتائج الطلاب', en: 'Students Results' },
'parent.tabs.groups': { ar: 'مجموعات الطلاب', en: 'Students Groups' },
'parent.tabs.subjects': { ar: 'مواد الطلاب', en: 'Students Subjects' },
'parent.tabs.content': { ar: 'محتوى الطلاب', en: 'Students Content' },

// نتائج ولي الأمر
'parent.result.defaultTitle': { ar: 'مرحباً', en: 'Welcome' },
'parent.result.defaultMessage': { ar: 'اختر أحد الأقسام من الأعلى لمتابعة الطلاب', en: 'Select a section above to track students' },

// أقسام ولي الأمر
'parent.students.title': { ar: 'متابعة الطلاب', en: 'Students Tracking' },
'parent.students.search': { ar: 'ابحث في الطلاب...', en: 'Search students...' },
'parent.students.noData': { ar: 'جاري تحميل بيانات الطلاب...', en: 'Loading students data...' },
'parent.students.empty': { ar: 'لا توجد طلاب مسجلين', en: 'No registered students' },

'parent.lectures.title': { ar: 'محاضرات الطلاب', en: 'Students Lectures' },
'parent.lectures.search': { ar: 'ابحث في المحاضرات...', en: 'Search lectures...' },
'parent.lectures.noData': { ar: 'جاري تحميل المحاضرات...', en: 'Loading lectures...' },
'parent.lectures.empty': { ar: 'لا توجد محاضرات قادمة', en: 'No upcoming lectures' },

'parent.results.title': { ar: 'نتائج الطلاب', en: 'Students Results' },
'parent.results.average': { ar: 'متوسط الدرجات', en: 'Average Score' },
'parent.results.totalStudents': { ar: 'عدد الطلاب', en: 'Total Students' },
'parent.results.search': { ar: 'ابحث في النتائج...', en: 'Search results...' },
'parent.results.noData': { ar: 'جاري تحميل النتائج...', en: 'Loading results...' },
'parent.results.empty': { ar: 'لا توجد نتائج', en: 'No results' },

'parent.groups.title': { ar: 'مجموعات الطلاب', en: 'Students Groups' },
'parent.groups.search': { ar: 'ابحث في المجموعات...', en: 'Search groups...' },
'parent.groups.noData': { ar: 'جاري تحميل المجموعات...', en: 'Loading groups...' },
'parent.groups.empty': { ar: 'لا توجد مجموعات', en: 'No groups' },

'parent.subjects.title': { ar: 'مواد الطلاب', en: 'Students Subjects' },
'parent.subjects.search': { ar: 'ابحث في المواد...', en: 'Search subjects...' },
'parent.subjects.noData': { ar: 'جاري تحميل المواد الدراسية...', en: 'Loading subjects...' },
'parent.subjects.empty': { ar: 'لا توجد مواد دراسية', en: 'No subjects' },

'parent.content.title': { ar: 'محتوى الطلاب', en: 'Students Content' },
'parent.content.pdf': { ar: 'PDF', en: 'PDF' },
'parent.content.images': { ar: 'صور', en: 'Images' },
'parent.content.audio': { ar: 'صوتيات', en: 'Audio' },
'parent.content.search': { ar: 'ابحث في المحتوى...', en: 'Search content...' },
'parent.content.noData': { ar: 'جاري تحميل المحتوى الدراسي...', en: 'Loading study content...' },
'parent.content.empty': { ar: 'لا توجد محتويات', en: 'No content' }
    
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