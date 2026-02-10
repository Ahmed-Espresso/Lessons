// ==================== استيراد Firebase من app.js ====================
import { database } from './app.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== دوال الترجمة ====================
let translations = {
    // ==================== التنقل ====================
    'nav.home': { ar: 'الرئيسية', en: 'Home' },
    'nav.login': { ar: 'الدخول', en: 'Login' },
    'nav.logout': { ar: 'الخروج', en: 'Logout' },
    'nav.language': { ar: 'اللغه', en: 'En' },
    'nav.theme': { ar: 'الثيم', en: 'Theme' },
    
    // ==================== تسجيل الدخول ====================
    'login.title': { ar: 'تسجيل الدخول', en: 'Login' },
    'login.email': { ar: 'البريد الإلكتروني', en: 'Email' },
    'login.password': { ar: 'كلمة المرور', en: 'Password' },
    'login.alert': { ar: 'بيانات الدخول غير صحيحة', en: 'Invalid login credentials' },
    'login.button': { ar: 'تسجيل الدخول', en: 'Login' },
    
    // ==================== رسائل عامة ====================
    'logout.confirm': { ar: 'هل أنت متأكد من تسجيل الخروج؟', en: 'Are you sure you want to logout?' },
    'logout.success': { ar: 'تم تسجيل الخروج بنجاح', en: 'Logout successful' },
    'logout.error': { ar: 'فشل تسجيل الخروج', en: 'Logout failed' },
    'login.success': { ar: 'تم تسجيل الدخول بنجاح', en: 'Login successful' },
    'login.error': { ar: 'فشل تسجيل الدخول', en: 'Login failed' },
    'logging_in': { ar: 'جاري تسجيل الدخول...', en: 'Logging in...' },
    'login_no_role': { ar: 'المستخدم لا يملك صلاحية محددة', en: 'User has no specific role' },
    
    // ==================== صفحة الأدمن ====================
    'admin.title': { ar: 'لوحة التحكم -مركز العبير', en: 'Dashboard - El-Abeer ' },
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
    'admin.tabs.content': { ar: 'المحتوى الدراسي', en: 'Study Content' },
    'admin.tabs.about': { ar: 'من نحن', en: 'About Us' },
    'admin.tabs.lectures': { ar: 'المحاضرات القادمة', en: 'Upcoming Lectures' },
    'admin.tabs.groups': { ar: 'المجموعات', en: 'Groups' },
    'admin.tabs.subjects': { ar: 'المواد الدراسية', en: 'Subjects' },
    'admin.tabs.exams': { ar: 'الاختبارات', en: 'Exams' },
    'admin.tabs.attendance': { ar: 'حضور وغياب', en: 'absence' },
    'admin.tabs.chat': { ar: 'الشات العام', en: 'chat' },
    'admin.tabs.results': { ar: 'نتائج الطلاب', en: 'results' },
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
    
    // قسم المحتوى الدراسي
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
    
    // من نحن
    'admin.about.title': { ar: 'إدارة محتوى من نحن', en: 'About Us Management' },
    'admin.about.textAr': { ar: 'المحتوى العربي', en: 'Arabic Content' },
    'admin.about.textEn': { ar: 'المحتوى الإنجليزي', en: 'English Content' },
    'admin.about.saved': { ar: 'تم حفظ محتوى من نحن بنجاح', en: 'About Us content saved successfully' },
    
    // قسم المحاضرات القادمة
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
    
    // المجموعات
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
    
    // المواد الدراسية
    'admin.subjects.title': { ar: 'إدارة المواد الدراسية', en: 'Subjects Management' },
    'admin.subjects.add': { ar: 'إضافة مادة جديدة', en: 'Add New Subject' },
    'admin.subjects.search': { ar: 'ابحث في المواد...', en: 'Search subjects...' },
    'admin.subjects.noData': { ar: 'جاري تحميل المواد...', en: 'Loading subjects...' },
    'admin.subjects.modal.nameAr': { ar: 'اسم المادة (عربي)', en: 'Subject Name (Arabic)' },
    'admin.subjects.modal.nameEn': { ar: 'اسم المادة (إنجليزي)', en: 'Subject Name (English)' },
    'admin.subjects.modal.descriptionAr': { ar: 'الوصف (عربي)', en: 'Description (Arabic)' },
    'admin.subjects.modal.descriptionEn': { ar: 'الوصف (إنجليزي)', en: 'Description (English)' },
    'admin.subjects.modal.icon': { ar: 'الأيقونة', en: 'Icon' },
    
    // الاختبارات
    'admin.exams.title': { ar: 'إدارة الاختبارات', en: 'Exams Management' },
    'admin.exams.search': { ar: 'ابحث في الاختبارات...', en: 'Search exams...' },
    'admin.exams.add': { ar: 'إضافة اختبار جديد', en: 'Add New Exam' },
    'admin.exams.noData': { ar: 'جاري تحميل الاختبارات...', en: 'Loading exams...' },
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
    'admin.exams.validation.noName': { ar: 'يرجى إدخال اسم الاختبار', en: 'Please enter exam name' },
    'admin.exams.validation.noQuestions': { ar: 'يرجى إضافة سؤال واحد على الأقل', en: 'Please add at least one question' },
    'admin.exams.validation.questionNoText': { ar: 'يرجى إدخال نص السؤال', en: 'Please enter question text' },
    'admin.exams.validation.optionNoText': { ar: 'يرجى إدخال نص الخيار', en: 'Please enter option text' },
    'admin.exams.validation.blankNoAnswer': { ar: 'يرجى إدخال الإجابة الصحيحة للفراغ', en: 'Please enter correct answer for blank' },
    'admin.exams.status.draft': { ar: 'مسودة', en: 'Draft' },
    'admin.exams.status.published': { ar: 'نشط', en: 'Published' },
    'admin.exams.status.closed': { ar: 'مغلق', en: 'Closed' },
    'admin.exams.action.create': { ar: 'إنشاء', en: 'Create' },
    'admin.exams.action.save': { ar: 'حفظ', en: 'Save' },
    'admin.exams.action.edit': { ar: 'تعديل', en: 'Edit' },
    'admin.exams.action.delete': { ar: 'حذف', en: 'Delete' },
    'admin.exams.action.preview': { ar: 'معاينة', en: 'Preview' },
    'admin.exams.action.publish': { ar: 'نشر', en: 'Publish' },
    'admin.exams.action.unpublish': { ar: 'إلغاء النشر', en: 'Unpublish' },
    'admin.exams.success.created': { ar: 'تم إنشاء الاختبار بنجاح', en: 'Exam created successfully' },
    'admin.exams.success.updated': { ar: 'تم تحديث الاختبار بنجاح', en: 'Exam updated successfully' },
    'admin.exams.success.deleted': { ar: 'تم حذف الاختبار بنجاح', en: 'Exam deleted successfully' },
    'admin.exams.success.published': { ar: 'تم نشر الاختبار بنجاح', en: 'Exam published successfully' },
    'admin.exams.error.loading': { ar: 'خطأ في تحميل الاختبارات', en: 'Error loading exams' },
    'admin.exams.error.saving': { ar: 'خطأ في حفظ الاختبار', en: 'Error saving exam' },
    'admin.exams.error.deleting': { ar: 'خطأ في حذف الاختبار', en: 'Error deleting exam' },
    'admin.exams.stats.questions': { ar: 'سؤال', en: 'Questions' },
    'admin.exams.stats.points': { ar: 'درجة', en: 'Points' },
    'admin.exams.stats.duration': { ar: 'دقيقة', en: 'Minutes' },
    'admin.exams.stats.groups': { ar: 'مجموعة', en: 'Groups' },
    'admin.exams.types.mc': { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
    'admin.exams.types.tf': { ar: 'صح/خطأ', en: 'True/False' },
    'admin.exams.types.fb': { ar: 'أكمل الفراغ', en: 'Fill in the Blank' },
    'admin.exams.description.mc': { ar: 'أسئلة ذات 4 خيارات مع إجابة واحدة صحيحة', en: 'Questions with 4 options and one correct answer' },
    'admin.exams.description.tf': { ar: 'أسئلة تحدد إذا كانت الجملة صحيحة أم خاطئة', en: 'Questions to determine if statement is true or false' },
    'admin.exams.description.fb': { ar: 'أسئلة تكملة الفراغات بإجابات محددة', en: 'Questions to fill blanks with specific answers' },

    // نتائج الأدمن
    'admin.result.defaultTitle': { ar: 'مرحبا', en: 'Welcome' },
    'admin.result.defaultMessage': { ar: 'اختر أحد الأقسام من الأعلى لبدء الإدارة', en: 'Select a section above to start managing' },
    
    // تحديث ترجمات قسم اللغة الإنجليزية للمجموعات
    'admin.english.modal.selectGroups': { ar: 'اختر المجموعات المستهدفة', en: 'Select Target Groups' },
    
    // ==================== صفحة الطالب ====================
    'student.title': { ar: ' الطالب - مركز العبير', en: 'Student -  El-Abeer' },
    'student.header.title': { ar: 'مرحبا الطالب', en: 'Student Dashboard' },
    'student.header.subtitle': { ar: 'مرحباً بك في لوحة الطالب - نظام إدارة الدروس', en: 'Welcome to the student dashboard - Management System' },
    
    // تبويبات الطالب
    'student.tabs.subjects': { ar: 'المواد الدراسية', en: 'Subjects' },
    'student.tabs.lectures': { ar: 'محاضراتي ', en: ' Lectures' },
    'student.tabs.exams': { ar: 'اختباراتي', en: ' Exams' },
    'student.tabs.results': { ar: 'نتائجي', en: ' Results' },
    'student.tabs.groups': { ar: 'مجموعاتي', en: ' Groups' },
    'student.tabs.chat': { ar: 'الشات العام', en: ' Chat' },
    'student.tabs.content': { ar: 'المحتوى الدراسي', en: ' Content' },
    'student.welcome': { ar: 'مرحبا', en: 'Hi' },
    
    // قسم المواد الدراسية
    'student.subjects.title': { ar: 'المواد الدراسية', en: 'Subjects' },
    'student.subjects.search': { ar: 'ابحث في المواد الدراسية...', en: 'Search subjects...' },
    'student.subjects.noData': { ar: 'جاري تحميل المواد الدراسية...', en: 'Loading subjects...' },
    'student.subjects.empty': { ar: 'لا توجد مواد دراسية متاحة', en: 'No subjects available' },
    'student.subjects.noName': { ar: 'بدون اسم', en: 'No name' },
    
    // قسم المحاضرات
    'student.lectures.title': { ar: 'محاضراتي القادمة', en: 'My Upcoming Lectures' },
    'student.lectures.search': { ar: 'ابحث في المحاضرات...', en: 'Search lectures...' },
    'student.lectures.noData': { ar: 'جاري تحميل المحاضرات القادمة...', en: 'Loading upcoming lectures...' },
    'student.lectures.empty': { ar: 'لا توجد محاضرات قادمة', en: 'No upcoming lectures' },
    'student.lectures.noTitle': { ar: 'بدون عنوان', en: 'No title' },
    'student.lectures.dateTime': { ar: 'التاريخ', en: 'Date and Time:' },
    'student.lectures.description': { ar: 'الوصف', en: 'Description:' },
    'student.lectures.remainingTime': { ar: 'الوقت المتبقي', en: 'Remaining Time' },
    'student.lectures.days': { ar: 'أيام', en: 'Days' },
    'student.lectures.hours': { ar: 'ساعات', en: 'Hours' },
    'student.lectures.minutes': { ar: 'دقائق', en: 'Minutes' },
    'student.lectures.seconds': { ar: 'ثواني', en: 'Seconds' },
    'student.lectures.soon': { ar: 'قريباً', en: 'Soon' },
    
    // قسم الاختبارات
    'student.exams.title': { ar: 'اختباراتي', en: 'My Exams' },
    'student.exams.search': { ar: 'ابحث في الاختبارات...', en: 'Search exams...' },
    'student.exams.noData': { ar: 'جاري تحميل الاختبارات...', en: 'Loading exams...' },
    'student.exams.empty': { ar: 'لا توجد اختبارات', en: 'No exams' },
    'student.exams.noName': { ar: 'بدون اسم', en: 'No name' },
    'student.exams.general': { ar: 'عام', en: 'General' },
    'student.exams.minutes': { ar: 'دقيقة', en: 'Minute' },
    'student.exams.points': { ar: 'درجة', en: 'Point' },
    'student.exams.duration': { ar: 'المدة', en: 'Duration:' },
    'student.exams.totalPoints': { ar: 'الدرجة الكلية', en: 'Total Points:' },
    'student.exams.questionsCount': { ar: 'عدد الأسئلة', en: 'Number of Questions:' },
    'student.exams.description': { ar: 'الوصف', en: 'Description:' },
    'student.exams.instructions': { ar: 'تعليمات', en: 'Instructions:' },
    'student.exams.instruction1': { ar: 'سيتم احتساب الوقت بدقة', en: 'Time will be calculated accurately' },
    'student.exams.instruction2': { ar: 'لا يمكنك الخروج من الاختبار أثناء الإجابة', en: 'You cannot exit the exam while answering' },
    'student.exams.instruction3': { ar: 'سيتم تصحيح الإجابات تلقائياً', en: 'Answers will be corrected automatically' },
    'student.exams.instruction4': { ar: 'لا يمكنك إعادة الاختبار بعد الإنهاء', en: 'You cannot retake the exam after finishing' },
    'student.exams.instruction5': { ar: 'لا يمكنك إغلاق نافذة الاختبار أثناء الإجابة', en: 'You cannot close the exam window while answering' },
    'student.exams.instruction6': { ar: 'سيتم تصحيح الإجابات تلقائياً بعد انتهاء الوقت', en: 'Answers will be corrected automatically after time ends' },
    'student.exams.viewResult': { ar: 'عرض النتيجة', en: 'View Result' },
    'student.exams.startExam': { ar: 'بدء الاختبار', en: 'Start Exam' },
    'student.exams.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'student.exams.examInstructions': { ar: 'تعليمات الاختبار', en: 'Exam Instructions:' },
    'student.exams.examDuration': { ar: 'مدة الاختبار', en: 'Exam Duration:' },
    'student.exams.finishExam': { ar: 'إنهاء الاختبار', en: 'Finish Exam' },
    'student.exams.cantClose': { ar: 'لا يمكن إغلاق نافذة الاختبار أثناء الإجابة', en: 'You cannot close the exam window while answering' },
    'student.exams.confirmSubmit': { ar: 'هل أنت متأكد من إنهاء الاختبار؟', en: 'Are you sure you want to finish the exam?' },
    'student.exams.timeEnded': { ar: 'انتهى وقت الاختبار', en: 'Exam time has ended' },
    'student.exams.resultSaved': { ar: 'تم حفظ نتيجة الاختبار بنجاح', en: 'Exam result saved successfully' },
    'student.exams.resultSaveError': { ar: 'خطأ في حفظ نتيجة الاختبار', en: 'Error saving exam result' },
    'student.exams.refreshWarning': { ar: 'إذا قمت بتحديث الصفحة، ستفقد إجابات الاختبار. هل أنت متأكد؟', en: 'If you refresh the page, you will lose your exam answers. Are you sure?' },
    'student.exams.noResult': { ar: 'لا توجد نتيجة لهذا الاختبار', en: 'No result for this exam' },
    'student.exams.examResult': { ar: 'نتيجة الاختبار', en: 'Exam Result' },
    'student.exams.resultSavedSuccess': { ar: 'تم حفظ نتيجة الاختبار بنجاح', en: 'Exam result saved successfully' },
    'student.exams.viewDetailsFromResults': { ar: 'يمكنك عرض التفاصيل من قسم النتائج', en: 'You can view details from the Results section' },
    'student.exams.ok': { ar: 'موافق', en: 'OK' },
    'student.exams.question': { ar: 'سؤال', en: 'Question' },
    'student.exams.mcQuestion': { ar: 'اختيار من متعدد', en: 'Multiple Choice' },
    'student.exams.tfQuestion': { ar: 'صح أو خطأ', en: 'True or False' },
    'student.exams.fbQuestion': { ar: 'أكمل الفراغ', en: 'Fill in the Blank' },
    'student.exams.point': { ar: 'نقطة', en: 'Point' },
    'student.exams.true': { ar: 'صح', en: 'True' },
    'student.exams.false': { ar: 'خطأ', en: 'False' },
    'student.exams.answer': { ar: 'الإجابة', en: 'Answer' },
    'student.exams.enterAnswer': { ar: 'أدخل الإجابة', en: 'Enter answer' },
    'student.exams.ended': { ar: 'منتهي', en: 'Ended' },
    'student.exams.upcoming': { ar: 'قادم', en: 'Upcoming' },
    'student.exams.soon': { ar: 'قريباً', en: 'Soon' },
    'student.exams.startingSoon': { ar: 'يبدأ قريباً', en: 'Starting Soon' },
    
    // قسم النتائج
    'student.results.title': { ar: 'نتائجي', en: 'My Results' },
    'student.results.average': { ar: 'المعدل العام', en: 'Average Score' },
    'student.results.totalExams': { ar: 'عدد الاختبارات', en: 'Total Exams' },
    'student.results.search': { ar: 'ابحث في النتائج...', en: 'Search results...' },
    'student.results.noData': { ar: 'جاري تحميل النتائج...', en: 'Loading results...' },
    'student.results.empty': { ar: 'لا توجد نتائج بعد', en: 'No results yet' },
    'student.results.unknownExam': { ar: 'اختبار غير معروف', en: 'Unknown exam' },
    'student.results.points': { ar: 'درجة', en: 'Points' },
    'student.results.examResult': { ar: 'نتيجة الاختبار', en: 'Exam Result' },
    'student.results.details': { ar: 'تفاصيل النتيجة', en: 'Result Details' },
    'student.results.score': { ar: 'النتيجة', en: 'Score' },
    'student.results.passed': { ar: 'ناجح', en: 'Passed' },
    'student.results.failed': { ar: 'راسب', en: 'Failed' },
    'student.results.excellent': { ar: 'ممتاز', en: 'Excellent' },
    'student.results.veryGood': { ar: 'جيد جداً', en: 'Very Good' },
    'student.results.good': { ar: 'جيد', en: 'Good' },
    'student.results.needsImprovement': { ar: 'يحتاج تحسين', en: 'Needs Improvement' },
    'student.results.excellentMessage': { ar: 'أداء استثنائي! احتفظ بهذا المستوى الرائع.', en: 'Exceptional performance! Keep up this excellent level.' },
    'student.results.veryGoodMessage': { ar: 'أداء ممتاز، أنت على الطريق الصحيح.', en: 'Excellent performance, you are on the right track.' },
    'student.results.goodMessage': { ar: 'أداء مقبول، يمكنك التحسين أكثر بالمزيد من الممارسة.', en: 'Acceptable performance, you can improve with more practice.' },
    'student.results.poorMessage': { ar: 'راجع المادة جيداً وحاول مرة أخرى، ستصل إلى النجاح.', en: 'Review the material well and try again, you will succeed.' },
    'student.results.excellentResult': { ar: 'نتيجة مذهلة! لقد تفوقت على التوقعات', en: 'Amazing result! You exceeded expectations' },
    'student.results.greatResult': { ar: 'أداء رائع! أنت على الطريق الصحيح', en: 'Great performance! You are on the right track' },
    'student.results.passedResult': { ar: 'تهانينا! لقد نجحت في الاختبار', en: 'Congratulations! You passed the exam' },
    'student.results.failedResult': { ar: 'تحتاج إلى المزيد من المذاكرة', en: 'You need more studying' },
    'student.results.percentage': { ar: 'النسبة المئوية', en: 'Percentage' },
    'student.results.performance': { ar: 'تقييم الأداء', en: 'Performance Evaluation' },
    
    // قسم المجموعات
    'student.groups.title': { ar: 'مجموعاتي', en: 'My Groups' },
    'student.groups.noData': { ar: 'جاري تحميل المجموعات...', en: 'Loading groups...' },
    'student.groups.empty': { ar: 'لا توجد مجموعات', en: 'No groups' },
    'student.groups.noName': { ar: 'بدون اسم', en: 'No name' },
    'student.groups.studentsCount': { ar: 'عدد الطلاب', en: 'Number of Students:' },
    'student.groups.student': { ar: 'طالب', en: 'Student' },
    'student.groups.students': { ar: 'طالب', en: 'Students' },
    'student.groups.description': { ar: 'الوصف', en: 'Description:' },
    
    // قسم المحتوى الدراسي
    'student.content.title': { ar: 'المحتوى الدراسي', en: 'Study Content' },
    'student.content.pdf': { ar: 'PDF', en: 'PDF' },
    'student.content.images': { ar: 'صور', en: 'Images' },
    'student.content.audio': { ar: 'صوتيات', en: 'Audio' },
    'student.content.search': { ar: 'ابحث في المحتوى...', en: 'Search content...' },
    'student.content.noData': { ar: 'جاري تحميل المحتوى الدراسي...', en: 'Loading study content...' },
    'student.content.empty': { ar: 'لا توجد محتويات دراسية', en: 'No study content' },
    'student.content.view': { ar: 'عرض', en: 'View' },
    'student.content.download': { ar: 'تحميل', en: 'Download' },
    
    // قسم الشات
    'student.chat.title': { ar: 'الشات العام', en: 'General Chat' },
    'student.chat.filePreview': { ar: 'معاينة الملف', en: 'File Preview' },
    'student.chat.recording': { ar: 'جاري التسجيل...', en: 'Recording...' },
    'student.chat.send': { ar: 'إرسال', en: 'Send' },
    'student.chat.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'student.chat.recordVoice': { ar: 'تسجيل رسالة صوتية', en: 'Record voice message' },
    'student.chat.attachFile': { ar: 'إرفاق ملف', en: 'Attach file' },
    'student.chat.attachImage': { ar: 'إرفاق صورة', en: 'Attach image' },
    'student.chat.stopRecording': { ar: 'إيقاف التسجيل', en: 'Stop recording' },
    'student.chat.fileTooLarge': { ar: 'حجم الملف كبير جداً (الحد الأقصى 10MB)', en: 'File size is too large (maximum 10MB)' },
    'student.chat.imagePreview': { ar: 'معاينة الصورة', en: 'Image preview' },
    'student.chat.image': { ar: 'صورة', en: 'Image' },
    'student.chat.audioFile': { ar: 'ملف صوتي', en: 'Audio file' },
    'student.chat.seconds': { ar: 'ثانية', en: 'Second' },
    'student.chat.uploadingFile': { ar: 'جاري رفع الملف...', en: 'Uploading file...' },
    'student.chat.loginRequired': { ar: 'يجب تسجيل الدخول لإرسال الرسائل', en: 'Login required to send messages' },
    'student.chat.uploadError': { ar: 'خطأ في رفع الملف', en: 'File upload error' },
    'student.chat.fileSent': { ar: 'تم إرسال الملف بنجاح', en: 'File sent successfully' },
    'student.chat.messageSent': { ar: 'تم إرسال الرسالة', en: 'Message sent' },
    'student.chat.sendError': { ar: 'خطأ في إرسال الرسالة', en: 'Error sending message' },
    'student.chat.writeMessage': { ar: 'اكتب رسالة أو أرفق ملفًا', en: 'Write a message or attach a file' },
    'student.chat.uploadFailed': { ar: 'فشل رفع الملف', en: 'File upload failed' },
    'student.chat.recordingNotSupported': { ar: 'المتصفح لا يدعم التسجيل الصوتي', en: 'Browser does not support audio recording' },
    'student.chat.microphoneError': { ar: 'تعذر الوصول إلى الميكروفون', en: 'Could not access microphone' },
    'student.chat.uploadingVoice': { ar: 'جاري رفع الرسالة الصوتية...', en: 'Uploading voice message...' },
    'student.chat.voiceUploadFailed': { ar: 'فشل رفع الرسالة الصوتية', en: 'Voice message upload failed' },
    'student.chat.voiceSent': { ar: 'تم إرسال الرسالة الصوتية بنجاح', en: 'Voice message sent successfully' },
    'student.chat.voiceSendError': { ar: 'خطأ في إرسال الرسالة الصوتية', en: 'Error sending voice message' },
    'student.chat.playbackError': { ar: 'تعذر تشغيل الرسالة الصوتية', en: 'Could not play voice message' },
    'student.chat.unknownUser': { ar: 'مستخدم غير معروف', en: 'Unknown user' },
    'student.chat.file': { ar: 'ملف', en: 'File' },
    'student.chat.audio': { ar: 'صوت', en: 'Audio' },
    'student.chat.noMessages': { ar: 'لا توجد رسائل بعد', en: 'No messages yet' },
    'student.chat.beFirst': { ar: 'كن أول من يبدأ المحادثة!', en: 'Be the first to start the conversation!' },
    'student.chat.loadError': { ar: 'خطأ في تحميل الرسائل', en: 'Error loading messages' },
    
    // نتائج الطالب
    'student.result.defaultTitle': { ar: 'مرحباً', en: 'Welcome' },
    'student.result.defaultMessage': { ar: 'اختر أحد الأقسام من الأعلى لعرض محتواك', en: 'Select a section above to view your content' },
    
    // ==================== صفحة ولي الأمر ====================
    'parent.welcome': { ar: 'مرحبا', en: 'Welcome' },
    'parent.guardianOf': { ar: 'ولي أمر', en: 'parent of' },
    'parent.student.unknown': { ar: 'غير محدد', en: 'Unknown' },
    'parent.title': { ar: ' ولي الأمر - مركز العبير<', en: 'Parent Dashboard - El-Abeer' },
    'parent.result.defaultTitle': { ar: 'مرحبا', en: 'Welcome' },
    'parent.result.defaultMessage': { ar: 'اختر أحد الأقسام من الأعلى لمتابعة الطالب', en: 'Select a section from above to follow the student' },
    'parent.tabs.groups': { ar: 'مجموعات الطالب', en: ' Groups' },
    'parent.tabs.subjects': { ar: 'مواد الطالب', en: ' Subjects' },
    'parent.tabs.lectures': { ar: 'محاضرات الطالب', en: ' Lectures' },
    'parent.tabs.attendance': { ar: 'حضور الطالب', en: ' Attendance' },
    'parent.tabs.results': { ar: 'نتائج الطالب', en: ' Results' },
    'parent.tabs.chat': { ar: 'الشات ', en: ' Chat' },
    'parent.lectures.title': { ar: 'محاضرات الطالب القادمة', en: 'Upcoming Student Lectures' },
    'parent.lectures.loading': { ar: 'جاري تحميل المحاضرات القادمة...', en: 'Loading upcoming lectures...' },
    'parent.lectures.noData': { ar: 'لا توجد محاضرات قادمة للطالب', en: 'No upcoming lectures for student' },
    'parent.lectures.noTitle': { ar: 'بدون عنوان', en: 'No title' },
    'parent.lectures.days': { ar: 'أيام', en: 'days' },
    'parent.lectures.hours': { ar: 'ساعات', en: 'hours' },
    'parent.lectures.minutes': { ar: 'دقائق', en: 'minutes' },
    'parent.lectures.seconds': { ar: 'ثواني', en: 'seconds' },
    'parent.lectures.dateTime': { ar: 'التاريخ', en: 'Date & Time' },
    'parent.lectures.description': { ar: 'الوصف', en: 'Description' },
    'parent.lectures.remainingTime': { ar: 'الوقت المتبقي', en: 'Remaining Time' },
    'parent.results.title': { ar: 'نتائج الطالب', en: 'Student Results' },
    'parent.results.loading': { ar: 'جاري تحميل النتائج...', en: 'Loading results...' },
    'parent.results.noData': { ar: 'لا توجد نتائج للطلاب بعد', en: 'No results for students yet' },
    'parent.results.average': { ar: 'المعدل العام', en: 'Overall Average' },
    'parent.results.totalExams': { ar: 'عدد الاختبارات', en: 'Total Exams' },
    'parent.results.points': { ar: 'درجة', en: 'points' },
    'parent.results.percentage': { ar: 'النسبة المئوية', en: 'Percentage' },
    'parent.results.performance': { ar: 'تقييم الأداء', en: 'Performance Evaluation' },
    'parent.results.excellent': { ar: 'ممتاز', en: 'Excellent' },
    'parent.results.veryGood': { ar: 'جيد جداً', en: 'Very Good' },
    'parent.results.good': { ar: 'جيد', en: 'Good' },
    'parent.results.needsImprovement': { ar: 'يحتاج تحسين', en: 'Needs Improvement' },
    'parent.results.excellentMessage': { ar: 'أداء استثنائي! احتفظ بهذا المستوى الرائع.', en: 'Exceptional performance! Keep up this great level.' },
    'parent.results.veryGoodMessage': { ar: 'أداء ممتاز، الطالب على الطريق الصحيح.', en: 'Excellent performance, the student is on the right track.' },
    'parent.results.goodMessage': { ar: 'أداء مقبول، يمكنه التحسين أكثر بالمزيد من الممارسة.', en: 'Acceptable performance, can improve more with more practice.' },
    'parent.results.poorMessage': { ar: 'يجب مراجعة المادة جيداً والمحاولة مرة أخرى.', en: 'The subject should be reviewed well and try again.' },
    'parent.results.excellentResult': { ar: 'نتيجة مذهلة! لقد تفوق على التوقعات', en: 'Amazing result! Exceeded expectations' },
    'parent.results.greatResult': { ar: 'أداء رائع! الطالب على الطريق الصحيح', en: 'Great performance! The student is on the right track' },
    'parent.results.passedResult': { ar: 'تهانينا! لقد نجح في الاختبار', en: 'Congratulations! Passed the exam' },
    'parent.results.failedResult': { ar: 'يحتاج إلى المزيد من المذاكرة', en: 'Needs more studying' },
    'parent.results.score': { ar: 'النتيجة', en: 'Score' },
    'parent.results.passed': { ar: 'ناجح', en: 'Passed' },
    'parent.results.failed': { ar: 'راسب', en: 'Failed' },
    'parent.results.unknownExam': { ar: 'اختبار غير معروف', en: 'Unknown exam' },
    'parent.groups.title': { ar: 'مجموعات الطلاب', en: 'Student Groups' },
    'parent.groups.loading': { ar: 'جاري تحميل المجموعات...', en: 'Loading groups...' },
    'parent.groups.noData': { ar: 'لا توجد مجموعات للطلاب', en: 'No groups for students' },
    'parent.groups.noName': { ar: 'بدون اسم', en: 'No name' },
    'parent.groups.studentsCount': { ar: 'عدد الطلاب الإجمالي', en: 'Total Students' },
    'parent.groups.student': { ar: 'طالب', en: 'student' },
    'parent.groups.students': { ar: 'طالب', en: 'students' },
    'parent.groups.description': { ar: 'الوصف', en: 'Description' },
    'parent.subjects.title': { ar: 'مواد الطلاب الدراسية', en: 'Student Subjects' },
    'parent.subjects.noData': { ar: 'لا توجد مواد دراسية متاحة', en: 'No subjects available' },
    'parent.subjects.selectSubject': { ar: 'اختر مادة دراسية', en: 'Select a subject' },
    'parent.subjects.selectSubjectMessage': { ar: 'من القائمة أعلاه لعرض المحتوى الخاص بها', en: 'From the list above to view its content' },
    'parent.content.pdf': { ar: 'PDF', en: 'PDF' },
    'parent.content.images': { ar: 'صور', en: 'Image' },
    'parent.content.audio': { ar: 'صوت', en: 'Audio' },
    'parent.content.noData': { ar: 'لا توجد بيانات بعد', en: 'No data yet' },
    'parent.attendance.title': { ar: 'حضور وغياب الطلاب', en: 'Student Attendance' },
    'parent.attendance.loading': { ar: 'جاري تحميل سجلات الحضور...', en: 'Loading attendance records...' },
    'parent.attendance.noData': { ar: 'لا توجد سجلات حضور للطلاب بعد', en: 'No attendance records for students yet' },
    'parent.attendance.rate': { ar: 'نسبة الحضور', en: 'Attendance Rate' },
    'parent.attendance.totalLectures': { ar: 'إجمالي المحاضرات', en: 'Total Lectures' },
    'parent.attendance.present': { ar: 'حاضر', en: 'Present' },
    'parent.attendance.absent': { ar: 'غائب', en: 'Absent' },
    'parent.attendance.late': { ar: 'متأخر', en: 'Late' },
    'parent.attendance.excused': { ar: 'معذور', en: 'Excused' },
    'parent.attendance.unknown': { ar: 'غير محدد', en: 'Unknown' },
    'parent.chat.title': { ar: 'الشات العام', en: 'General Chat' },
    'parent.chat.loading': { ar: 'جاري تحميل الرسائل...', en: 'Loading messages...' },
    'parent.chat.noMessages': { ar: 'لا توجد رسائل بعد', en: 'No messages yet' },
    'parent.chat.beFirst': { ar: 'كن أول من يبدأ المحادثة!', en: 'Be the first to start the conversation!' },
    'parent.chat.recordVoice': { ar: 'تسجيل رسالة صوتية', en: 'Record voice message' },
    'parent.chat.attachFile': { ar: 'إرفاق ملف', en: 'Attach file' },
    'parent.chat.attachImage': { ar: 'إرفاق صورة', en: 'Attach image' },
    'parent.chat.send': { ar: 'إرسال', en: 'Send' },
    'parent.chat.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'parent.chat.recording': { ar: 'جاري التسجيل...', en: 'Recording...' },
    'parent.chat.stopRecording': { ar: 'إيقاف التسجيل', en: 'Stop Recording' },
    'parent.chat.uploadingFile': { ar: 'جاري رفع الملف...', en: 'Uploading file...' },
    'parent.chat.uploadingVoice': { ar: 'جاري رفع الرسالة الصوتية...', en: 'Uploading voice message...' },
    'parent.chat.filePreview': { ar: 'معاينة الملف', en: 'File Preview' },
    'parent.chat.imagePreview': { ar: 'معاينة الصورة', en: 'Image Preview' },
    'parent.chat.fileSent': { ar: 'تم إرسال الملف بنجاح', en: 'File sent successfully' },
    'parent.chat.voiceSent': { ar: 'تم إرسال الرسالة الصوتية بنجاح', en: 'Voice message sent successfully' },
    'parent.chat.messageSent': { ar: 'تم إرسال الرسالة', en: 'Message sent' },
    'parent.chat.loginRequired': { ar: 'يجب تسجيل الدخول لإرسال الرسائل', en: 'Login required to send messages' },
    'parent.chat.writeMessage': { ar: 'اكتب رسالة أو أرفق ملفًا', en: 'Write a message or attach a file' },
    'parent.chat.unknownUser': { ar: 'مستخدم غير معروف', en: 'Unknown user' },
    'parent.chat.seconds': { ar: 'ثانية', en: 'seconds' },
    'parent.chat.file': { ar: 'ملف', en: 'File' },
    'parent.chat.image': { ar: 'صورة', en: 'Image' },
    'parent.chat.audio': { ar: 'صوت', en: 'Audio' },
    'parent.chat.audioFile': { ar: 'ملف صوتي', en: 'Audio file' },
    'parent.chat.playbackError': { ar: 'تعذر تشغيل الرسالة الصوتية', en: 'Could not play voice message' },
    'parent.chat.microphoneError': { ar: 'تعذر الوصول إلى الميكروفون', en: 'Could not access microphone' },
    'parent.chat.recordingNotSupported': { ar: 'المتصفح لا يدعم التسجيل الصوتي', en: 'Browser does not support audio recording' },
    'parent.chat.voiceUploadFailed': { ar: 'فشل رفع الرسالة الصوتية', en: 'Voice message upload failed' },
    'parent.chat.uploadFailed': { ar: 'فشل رفع الملف', en: 'File upload failed' },
    'parent.chat.fileTooLarge': { ar: 'حجم الملف كبير جداً (الحد الأقصى 10MB)', en: 'File is too large (maximum 10MB)' },
    'parent.chat.uploadError': { ar: 'خطأ في رفع الملف', en: 'Error uploading file' },
    'parent.chat.sendError': { ar: 'خطأ في إرسال الرسالة', en: 'Error sending message' },
    'parent.chat.voiceSendError': { ar: 'خطأ في إرسال الرسالة الصوتية', en: 'Error sending voice message' },
    'parent.chat.loadError': { ar: 'خطأ في تحميل الرسائل', en: 'Error loading messages' },
    'parent.loadError': { ar: 'خطأ في تحميل البيانات', en: 'Error loading data' },
    'parent.groups.totalStudents': { ar: 'عدد الطلاب الإجمالي', en: 'Total Students' },
    'parent.groups.yourStudents': { ar: 'طلابك في المجموعة', en: 'Your Students in Group' },
    'parent.general.ok': { ar: 'موافق', en: 'OK' },
    'parent.content.selectSubject': { ar: 'اختر مادة دراسية', en: 'Select a subject' },
    'parent.content.selectSubjectMessage': { ar: 'من القائمة أعلاه لعرض المحتوى الخاص بها', en: 'From the list above to view its content' },
    'parent.content.download': { ar: 'تحميل', en: 'Download' },
    'parent.attendance.studentName': { ar: 'اسم الطالب', en: 'Student Name' },
    'parent.attendance.details': { ar: 'تفاصيل الحضور', en: 'Attendance Details' },
    'parent.attendance.lecture': { ar: 'المحاضرة', en: 'Lecture' },
    'parent.attendance.date': { ar: 'التاريخ', en: 'Date' },
    'parent.attendance.status': { ar: 'الحالة', en: 'Status' },
    'parent.results.examResult': { ar: 'نتيجة الاختبار', en: 'Exam Result' },
    'parent.exams.duration': { ar: 'المدة', en: 'Duration' },
    'parent.exams.minutes': { ar: 'دقائق', en: 'Minutes' },
    'parent.exams.totalPoints': { ar: 'الدرجة الكلية', en: 'Total Points' },
    'parent.exams.points': { ar: 'نقاط', en: 'Points' },
    'parent.exams.questionsCount': { ar: 'عدد الأسئلة', en: 'Number of Questions' },
    'parent.chat.you': { ar: 'أنت', en: 'You' },
    'parent.chat.inputPlaceholder': { ar: 'اكتب رسالتك هنا...', en: 'Type your message here...' },
    'parent.content.loading': { ar: 'جاري تحميل المحتوى...', en: 'Loading content...' },
 
    // ==================== البوت والمحتوى ====================
    'bot.title': { ar: 'ريبيكا', en: 'Rebecca' },
    'bot.name': { ar: 'ريبيكا', en: 'Rebecca' },
    'bot.status': { ar: 'متصل الآن', en: 'Online now' },
    'bot.welcome': { ar: 'مرحباً!', en: 'Welcome!' },
    'bot.prompt': { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
    'bot.reply.welcome': { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
    'bot.reply.notUnderstand': { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." },
    'bot.inputPlaceholder': { ar: 'كلمني . . .', en: 'Talk to me . . .' },
    'botwelcm': { ar: 'مرحباً!', en: 'Welcome!' },
    'botwelcm2': { ar: 'كيف يمكنني مساعدتك؟', en: 'How can I help you?' },
    'bot_reply_rewelcome': { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊', en: 'Welcome back! How can I help? 😊' },
    'bot_reply_not_understand': { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.', en: "Sorry, I didn't understand. Please rephrase." },
    
    // ==================== الأقسام الأخرى ====================
    'site.title': { ar: 'مركز العبير', en: 'El-Abeer' },
    'about.title': { ar: 'من نحن', en: 'About Us' },
    'faq.title': { ar: 'سؤال و جواب', en: 'FAQ' },
    'contact.title': { ar: 'التواصل', en: 'Contact' },
    
    // نموذج التواصل
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
    
    // التواصل السريع
    'qc.warn.name': { ar: 'الرجاء إدخال الاسم', en: 'Please enter your name' },
    'qc.warn.contact': { ar: 'الرجاء إدخال رقم الهاتف أو الإيميل', en: 'Please enter your phone number or email' },
    'qc.success': { ar: 'تم إرسال الرسالة بنجاح', en: 'Message sent successfully' },
    'qc.failed': { ar: 'فشل في إرسال الرسالة', en: 'Failed to send message' },
    'phone.example': { ar: 'مثال', en: 'Example' },
    'phone.invalid': { ar: 'رقم الهاتف غير صحيح', en: 'Invalid phone number' },
    
    // أزرار عامة
    'admin.common.save': { ar: 'حفظ', en: 'Save' },
    'admin.common.all': { ar: 'الكل', en: 'all' },
    'admin.common.preview': { ar: 'معاينة', en: 'Preview' },
    'admin.common.edit': { ar: 'تعديل', en: 'Edit' },
    'admin.common.delete': { ar: 'حذف', en: 'Delete' },
    'admin.common.close': { ar: 'إغلاق', en: 'Close' },
    'admin.common.cancel': { ar: 'إلغاء', en: 'Cancel' },
    'admin.common.confirmDelete': { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
    
    // ==================== رسائل التحميل ====================
    'loading.message': { ar: 'جاري التحميل...', en: 'Loading...' },
    
    // رسائل الأخطاء العامة
    'student.loadError': { ar: 'خطأ في تحميل البيانات', en: 'Error loading data' },
    'student.inputPlaceholder': { ar: 'اكتب شيئآ . . .', en: 'Write something' },
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
        options[0].textContent = getTranslatedText('admin.common.all') || 'الكل';
        options[1].textContent = getTranslatedText('admin.messages.status.new');
        options[2].textContent = getTranslatedText('admin.messages.status.read');
        options[3].textContent = getTranslatedText('admin.messages.status.replied');
    }
    
    // تحديث خيارات تفعيل واتساب
    const whatsappSelect = document.getElementById('qc-enable-whatsapp');
    if (whatsappSelect) {
        const options = whatsappSelect.querySelectorAll('option');
        options[0].textContent = getTranslatedText('admin.quickcontact.enabled') || 'مفعل';
        options[1].textContent = getTranslatedText('admin.quickcontact.disabled') || 'معطل';
    }
}

// ==================== إعادة تهيئة الترجمة للصفحات الداخلية ====================
function reinitializeI18nForInternalPages() {
    console.log('🔄 إعادة تهيئة الترجمة للصفحات الداخلية...');
    
    // تنظيف خريطة العناصر القديمة
    for (const key in elementsMap) {
        delete elementsMap[key];
    }
    
    // إعادة جمع العناصر الجديدة
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (!elementsMap[key]) elementsMap[key] = [];
        el.dataset.fallback = el.innerHTML.trim();
        elementsMap[key].push(el);
    });
    
    // معالجة placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (!elementsMap[key]) elementsMap[key] = [];
        el.dataset.fallback = el.placeholder;
        elementsMap[key].push(el);
    });
    
    // تطبيق الترجمات الحالية
    applyTranslations();
    
    console.log('✅ تم إعادة تهيئة الترجمات لـ', Object.keys(elementsMap).length, 'عنصر');
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
    getTranslatedText,
    reinitialize: reinitializeI18nForInternalPages
};

// ==================== التهيئة والتصدير ====================
document.addEventListener('DOMContentLoaded', function() {
    initI18n();
});

window.i18n = i18n;

export { initI18n, setLanguage, applyTranslations, translations, currentLang, getTranslatedText, i18n, toggleLanguage };