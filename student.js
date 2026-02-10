// student.js
// ==================== استيراد المكتبات ====================
import { auth, database, utils } from "./app.js";
import { ref, onValue, get, set, push, remove, update, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== إعدادات Cloudinary الحقيقية ====================
const CLOUDINARY_CONFIG = {
    cloudName: 'dwgelhfe8',
    uploadPreset: 'ml_default',
    apiKey: '947888722137512',
    apiSecret: 'thO04v3QWczqD4yS2OtsFZwYfMM',
    uploadUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/upload',
    destroyUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/destroy'
};

// ==================== التطبيق الرئيسي للطالب ====================
const studentApp = {
    currentUser: null,
    studentData: null,
    studentGroups: [],
    studentSubjects: [],
    studentLectures: [],
    studentExams: [],
    studentResults: [],
    currentActiveSection: null, 
    examTimer: null,
    examTimeLeft: 0,
    currentExam: null,
    
    // ==================== دوال الشات المتقدم ====================
    chatData: {},
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    recordingTime: 0,
    recordingTimer: null,
    currentAudio: null,
    currentFile: null,
    fileType: null,
    
    //  التخزين المؤقت
    cache: {
        subjects: null,
        lectures: null,
        exams: null,
        results: null,
        groups: null,
        lastUpdated: {}
    },
    
    // ==================== دوال مساعدة محسنة ====================
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
            case 'success': bgColor = '#4CAF50'; textColor = 'white'; break;
            case 'error': bgColor = '#f44336'; textColor = 'white'; break;
            case 'info': bgColor = '#2196F3'; textColor = 'white'; break;
            case 'warning': bgColor = '#ff9800'; textColor = 'white'; break;
            default: bgColor = '#9C27B0'; textColor = 'white';
        }
        
        toastElement.textContent = message;
        toastElement.style.backgroundColor = bgColor;
        toastElement.style.color = textColor;
        toastElement.classList.add('visible');
        
        setTimeout(() => {
            toastElement.classList.remove('visible');
        }, 4000);
    },

    // ==================== إدارة حالة الاختبار المحلية ====================
    examStateKey: 'activeExamSession',
    examSessionData: null,

    // حفظ حالة الاختبار
    saveExamSession: function(examId, timeLeft, answers = {}) {
        const sessionData = {
            examId: examId,
            timeLeft: timeLeft,
            answers: answers,
            startTime: Date.now(),
            studentId: this.currentUser.uid
        };
        
        localStorage.setItem(this.examStateKey, JSON.stringify(sessionData));
        this.examSessionData = sessionData;
        console.log('💾 تم حفظ حالة الاختبار');
    },

    // تحميل حالة الاختبار
    loadExamSession: function() {
        const saved = localStorage.getItem(this.examStateKey);
        if (saved) {
            this.examSessionData = JSON.parse(saved);
            return this.examSessionData;
        }
        return null;
    },

    // حذف حالة الاختبار
    clearExamSession: function() {
        localStorage.removeItem(this.examStateKey);
        this.examSessionData = null;
        console.log('🧹 تم مسح حالة الاختبار');
    },

    // التحقق من وجود اختبار نشط
    hasActiveExamSession: function() {
        const session = this.loadExamSession();
        if (!session) return false;
        
        // التحقق من أن الجلسة لنفس المستخدم
        if (session.studentId !== this.currentUser.uid) {
            this.clearExamSession();
            return false;
        }
        
        // التحقق من أن الوقت لم ينتهِ
        const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
        const remaining = (this.currentExam ? (this.currentExam.duration || 60) * 60 : session.timeLeft) - elapsed;
        
        return remaining > 0;
    },

    // ==================== تحميل بيانات المستخدمين ====================
    loadUsersData: async function() {
        try {
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);
            window.usersData = snapshot.val() || {};
            console.log('✅ تم تحميل بيانات', Object.keys(window.usersData).length, 'مستخدم');
            return window.usersData;
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات المستخدمين:', error);
            return {};
        }
    },

    formatFileSize: function(bytes) {
        if (!bytes || bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatDate: function(timestamp) {
        if (!timestamp) return 'غير محدد';
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    },
    
    formatDateTime: function(timestamp) {
        if (!timestamp) return 'غير محدد';
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatTime: function(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    getLocalizedText: function(text) {
        if (!text) return '';
        if (typeof text === 'object') {
            const lang = document.documentElement.lang || 'ar';
            return text[lang] || text.ar || text.en || '';
        }
        return text;
    },
    
    translate: function(key) {
        // استدعاء نظام الترجمة إذا كان موجوداً
        if (window.i18n && window.i18n.getTranslatedText) {
            return window.i18n.getTranslatedText(key);
        }
        return key;
    },
    
    getRemainingTime: function(targetTimestamp) {
        const now = Date.now();
        const diff = targetTimestamp - now;
        
        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, status: this.translate('student.exams.ended') || 'منتهي' };
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let status = this.translate('student.exams.upcoming') || 'قادم';
        if (days === 0 && hours < 24) status = this.translate('student.exams.soon') || 'قريباً';
        if (days === 0 && hours < 1) status = this.translate('student.exams.startingSoon') || 'يبدأ قريباً';
        
        return { days, hours, minutes, seconds, status };
    },
    
    // ==================== إدارة الحالة والتحديثات ====================
    updateBadges: function() {
        const subjectsBadge = document.getElementById('subjects-badge');
        const lecturesBadge = document.getElementById('lectures-badge');
        const examsBadge = document.getElementById('exams-badge');
        const resultsBadge = document.getElementById('results-badge');
        const groupsBadge = document.getElementById('groups-badge');
        
        if (subjectsBadge) subjectsBadge.textContent = this.studentSubjects.length;
        if (lecturesBadge) lecturesBadge.textContent = this.studentLectures.length;
        if (examsBadge) examsBadge.textContent = this.studentExams.length;
        if (resultsBadge) resultsBadge.textContent = this.studentResults.length;
        if (groupsBadge) groupsBadge.textContent = this.studentGroups.length;
    },
    
    updateStats: function() {
        const totalExams = this.studentResults.length;
        const totalExamsElement = document.getElementById('total-exams');
        const averageScoreElement = document.getElementById('average-score');
        
        if (totalExamsElement) totalExamsElement.textContent = totalExams;
        
        if (totalExams === 0) {
            if (averageScoreElement) averageScoreElement.textContent = '0%';
            return;
        }
        
        let totalScore = 0;
        this.studentResults.forEach(result => {
            const exam = this.studentExams.find(e => e.id === result.examId);
            if (exam && result.score !== undefined) {
                totalScore += Math.round((result.score / exam.totalPoints) * 100);
            }
        });
        
        const average = Math.round(totalScore / totalExams);
        if (averageScoreElement) averageScoreElement.textContent = average + '%';
    },
    
    // ==================== قسم المواد الدراسية (مشابه للإدمن) ====================
    subjectsContentHandler: {
        currentSubjectId: null,
        currentSubjectName: null,
        currentSubjectIcon: null,
        currentContentType: 'pdfs',
        currentData: {},
        studentGroups: [],
        
        // تهيئة القسم
        init: function() {
            this.setupContentTabs();
        },
        
        // إعداد تبويبات أنواع المحتوى - تم الإصلاح
        setupContentTabs: function() {
            const container = document.getElementById('content-type-tabs');
            if (!container) return;
            
            container.addEventListener('click', (e) => {
                const tab = e.target.closest('.content-type-tab');
                if (!tab) return;
                
                const type = tab.dataset.type;
                this.switchContentType(type);
            });
        },
        
        // تبديل نوع المحتوى - تم التحسين
        switchContentType: function(type) {
            this.currentContentType = type;
            
            // تحديث التبويبات النشطة
            document.querySelectorAll('.content-type-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.type === type) {
                    tab.classList.add('active');
                }
            });
            
            // إخفاء كل اللوحات وإظهار اللوحة النشطة فقط
            document.querySelectorAll('.content-tab-panel').forEach(panel => {
                panel.classList.remove('active');
                panel.style.display = 'none';
            });
            
            const activePanel = document.getElementById(`${type}-panel`);
            if (activePanel) {
                activePanel.classList.add('active');
                activePanel.style.display = 'block';
            }
            
            // إعادة تحميل المحتوى إذا كانت هناك مادة محددة
            if (this.currentSubjectId) {
                this.loadSubjectContent(this.currentSubjectId, type);
            }
        },
        
        // عرض أزرار المواد
        renderSubjectsButtons: function() {
            const container = document.getElementById('subjects-buttons-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (!studentApp.studentSubjects || studentApp.studentSubjects.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-book"></i>
                        <span>لا توجد مواد دراسية متاحة</span>
                    </div>
                `;
                return;
            }
            
            studentApp.studentSubjects.forEach(subject => {
                const button = this.createSubjectButton(subject);
                if (button) {
                    container.appendChild(button);
                }
            });
        },
        
        // إنشاء زر مادة
        createSubjectButton: function(subject) {
            const subjectName = studentApp.getLocalizedText(subject.name);
            const button = document.createElement('button');
            button.className = 'subject-tab-btn';
            button.innerHTML = `
                <i class="${subject.icon || 'fas fa-book'}"></i>
                <span>${subjectName || 'بدون اسم'}</span>
            `;
            button.dataset.subjectId = subject.id;
            button.dataset.subjectName = subjectName;
            button.dataset.subjectIcon = subject.icon;
            
            button.addEventListener('click', () => {
                document.querySelectorAll('.subject-tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                this.currentSubjectId = subject.id;
                this.currentSubjectName = subjectName;
                this.currentSubjectIcon = subject.icon;
                
                this.showContentTypes();
                this.loadSubjectContent(subject.id, 'pdfs');
            });
            
            return button;
        },
        
        // إظهار أنواع المحتوى
        showContentTypes: function() {
            const placeholder = document.getElementById('content-placeholder');
            const typeTabs = document.getElementById('content-type-tabs');
            const tabsContainer = document.getElementById('content-tabs-container');

            if (placeholder) {
                placeholder.classList.remove('active');
                placeholder.style.display = 'none';
            }

            if (typeTabs) typeTabs.style.display = 'flex';
            if (tabsContainer) tabsContainer.style.display = 'block';

            // تفعيل تبويب PDF افتراضياً
            this.switchContentType('pdfs');
        },
        
        // تحميل محتوى المادة
        loadSubjectContent: function(subjectId, type) {
            const containerId = `${type}-panel`;
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const grid = container.querySelector('.data-grid');
            if (!grid) {
                container.innerHTML = `<div class="data-grid" id="${type}-grid"></div>`;
            }
            
            const gridContainer = container.querySelector('.data-grid') || document.getElementById(`${type}-grid`);
            if (!gridContainer) return;
            
            gridContainer.innerHTML = `
                <div class="no-data">
                    <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                    <span>جاري تحميل المحتوى...</span>
                </div>
            `;
            
            const contentRef = ref(database, `subjectsContent/${subjectId}/${type}`);
            
            onValue(contentRef, (snapshot) => {
                const items = snapshot.val() || {};
                this.currentData[type] = items;
                this.renderContentItems(items, type);
            });
        },
        
        // عرض عناصر المحتوى
        renderContentItems: function(items, type) {
            const gridContainer = document.getElementById(`${type}-grid`);
            if (!gridContainer) return;
            
            gridContainer.innerHTML = '';
            
            if (!items || Object.keys(items).length === 0) {
                const typeNames = {
                    'pdfs': 'PDF',
                    'images': 'صور',
                    'audios': 'صوت'
                };
                
                gridContainer.innerHTML = `
                    <div class="no-data">
                        <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                        <span>لا توجد ${typeNames[type] || 'بيانات'} بعد</span>
                    </div>
                `;
                return;
            }
            
            // فلترة العناصر حسب مجموعات الطالب
            const filteredItems = {};
            Object.entries(items).forEach(([key, item]) => {
                if (!item) return;
                
                // إذا كان الملف متاح للجميع (لا يحتوي على مجموعات)
                if (!item.groups || Object.keys(item.groups).length === 0) {
                    filteredItems[key] = item;
                }
                // إذا كان الملف محدد بمجموعات
                else {
                    const hasAccess = this.studentGroups.some(group => 
                        item.groups && item.groups[group.id]
                    );
                    
                    if (hasAccess) {
                        filteredItems[key] = item;
                    }
                }
            });
            
            if (Object.keys(filteredItems).length === 0) {
                gridContainer.innerHTML = `
                    <div class="no-data">
                        <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                        <span>لا توجد محتويات متاحة لك في هذه المادة</span>
                    </div>
                `;
                return;
            }
            
            // عرض العناصر
            Object.entries(filteredItems).forEach(([key, item]) => {
                const card = this.createContentCard(key, item, type);
                if (card) {
                    gridContainer.appendChild(card);
                }
            });
        },
        
        // إنشاء بطاقة محتوى (مشابهة للإدمن)
        createContentCard: function(key, item, type) {
            const card = document.createElement('div');
            card.className = `content-card-new`;
            card.dataset.id = key;
            card.dataset.type = type;
        
            let title = item.name || item.fileName || 'بدون اسم';
    
            // ✅ محتوى الكارت
            const iconClass = type === 'pdfs' ? 'fa-file-pdf' : type === 'images' ? 'fa-image' : 'fa-volume-up';
            let contentBody = '';
        
            if (type === 'images' && item.url) {
                contentBody = `
                    <div class="image-preview-container" style="min-height: 100px; background: rgba(var(--bg-text-rgb), 0.05);">
                        <img src="${item.url}" 
                            alt="${title}" 
                            loading="lazy"
                            decoding="async"
                            style="opacity: 0; transition: opacity 0.3s ease;"
                            onload="this.style.opacity='1';"
                            onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas ${iconClass}\\' style=\\'font-size:1.5rem; color: rgba(var(--bg-text-rgb), 0.3);\\'></i>';">
                    </div>
                `;
            } else {
                contentBody = `<i class="fas ${iconClass}"></i>`;
            }
        
            // ✅ بناء الكارت الجديد
            card.innerHTML = `
                <div class="content-card-header">
                   
                </div>
            
                <div class="content-card-body">
                    ${contentBody}
                </div>
            
                <div class="content-card-footer">
                    <div>
                        <div class="content-card-title">${title}</div>
                        ${item.size ? `<div class="content-card-size">${studentApp.formatFileSize(item.size)}</div>` : ''}
                    </div>
                </div>
            `;
        
            card.onclick = () => {
                this.openContentItemModal(key, item, type);
            };
        
            return card;
        },
        
        // فتح مودال تفاصيل الملف - تم التحسين
        openContentItemModal: function(key, item, type) {
            const modalRoot = document.getElementById('fileModalRoot');
            if (!modalRoot) {
                console.error('Modal root not found');
                return;
            }
    
            modalRoot.style.display = 'block';
    
            const modal = document.createElement('div');
            modal.className = 'modal-backdrop';
    
            const typeNames = {
                'pdfs': { ar: 'PDF', en: 'PDF' },
                'images': { ar: 'صور', en: 'Image' },
                'audios': { ar: 'صوت', en: 'Audio' }
            };
    
            const typeName = typeNames[type] || { ar: 'ملف', en: 'File' };
            const fileType = type.slice(0, -1);
    
            modal.innerHTML = `
                <div class="modal-content-new" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2><i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i> ${item.name || typeName.ar}</h2>
                        <button class="modal-close-unified" aria-label="إغلاق">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
            
                    <div class="modal-body">
                        <div class="full preview-section" style="margin-top: 20px;">
                            ${this.getPreviewHTML(item, fileType)}
                        </div>
                    </div>
            
                    <div class="modal-footer">
                        <button type="button" class="download-content-item" id="modal-download-btn">
                            <i class="fas fa-download"></i> تحميل الملف
                        </button>
                    </div>
                </div>
            `;
    
            // إغلاق المودال
            const closeBtn = modal.querySelector('.modal-close-unified');
            const closeModal = () => {
            modal.style.opacity = '0';
                setTimeout(() => {
                    modal.remove();
                    modalRoot.style.display = 'none';
                }, 300);
            };
    
            closeBtn.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
    
            // ==================== زر التحميل ====================
            const downloadBtn = modal.querySelector('#modal-download-btn');
            if (downloadBtn && item.url) {
                downloadBtn.addEventListener('click', () => {
                    const link = document.createElement('a');
                    link.href = item.url;
                    link.download = item.fileName || item.name || 'file';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
            
                    studentApp.showToast(`تم بدء تحميل ${typeName.ar}`, 'success');
                });
            } else if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> لا يوجد رابط للتحميل';
            }
    
            modalRoot.innerHTML = '';
            modalRoot.appendChild(modal);
        },

        getPreviewHTML: function(item, fileType) {
            const fileName = item.name || item.fileName || 'document';
    
            switch(fileType) {
                case 'image':
                    return `
                        <div class="image-preview-modal">
                            <div style="text-align: center; background: rgba(var(--bg-text-rgb), 0.05); padding: 20px; border-radius: 10px;">
                                <img src="${item.url}" 
                                    alt="${fileName}" 
                                    style="max-width: 100%; max-height: 300px; border-radius: 5px;"
                                    onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'text-align:center;padding:2rem;\\'><i class=\\'fas fa-image\\' style=\\'font-size:4rem;color:#ccc;\\'></i><p style=\\'margin-top:1rem;color:var(--bg-text);\\'>تعذر تحميل الصورة</p></div>';">
                            </div>
                            <div class="image-info" style="text-align: center; margin-top: 10px; color: var(--bg-text); opacity: 0.8; font-size: 0.9rem;">
                                ${item.dimensions ? `<span>الأبعاد: ${item.dimensions}</span>` : ''}
                                ${item.size ? `<span style="margin-left: 15px;">الحجم: ${studentApp.formatFileSize(item.size)}</span>` : ''}
                            </div>
                        </div>
                    `;
                case 'audio':
                    return `
                        <div class="audio-preview-modal" style="text-align: center; padding: 20px;">
                            <div style="margin-bottom: 20px;">
                                <i class="fas fa-volume-up" style="font-size: 3rem; color: var(--bg-text);"></i>
                            </div>
                            <div style="background: rgba(var(--bg-text-rgb), 0.1); padding: 15px; border-radius: 10px;">
                                <audio controls style="width: 100%;">
                                    <source src="${item.url}" type="audio/mpeg">
                                    <source src="${item.url}" type="audio/wav">
                                    <source src="${item.url}" type="audio/ogg">
                                    متصفحك لا يدعم تشغيل الصوتيات.
                                </audio>
                            </div>
                            <div class="audio-info" style="margin-top: 15px; color: var(--bg-text); opacity: 0.8; font-size: 0.9rem;">
                                ${item.duration ? `<span>المدة: ${this.formatDuration(item.duration)}</span>` : ''}
                                ${item.size ? `<span style="margin-left: 15px;">الحجم: ${studentApp.formatFileSize(item.size)}</span>` : ''}
                            </div>
                        </div>
                    `;
                case 'pdf':
                    return `
                        <div class="pdf-preview-modal" style="text-align: center; padding: 20px;">
                            <div>
                                <i class="fas fa-file-pdf" style="font-size: 3rem; color: #e74c3c;"></i>
                                <div style="margin-top: 15px;">
                                    <p style="color: var(--bg-text); margin-bottom: 15px; font-size: 1.1rem;">
                                        ${fileName}
                                    </p>
                                <div style="margin-top: 20px; color: var(--bg-text); opacity: 0.7; font-size: 0.9rem;">
                                    <i class="fas fa-info-circle"></i> 
                                    ${item.size ? `حجم الملف: ${studentApp.formatFileSize(item.size)}` : ''}
                                    ${item.pages ? `<br>عدد الصفحات: ${item.pages}` : ''}
                                </div>
                                </div>
                            </div>
                        </div>
                    `;
                default:
                    return `
                        <div style="text-align: center; padding: 40px; color: var(--bg-text);">
                            <i class="fas fa-file" style="font-size: 3rem;"></i>
                            <p style="margin-top: 15px;">نوع الملف: ${fileType}</p>
                            <p>اسم الملف: ${fileName}</p>
                            ${item.size ? `<p>الحجم: ${studentApp.formatFileSize(item.size)}</p>` : ''}
                        </div>
                    `;
            }
        },
        
        formatDuration: function(seconds) {
            if (!seconds) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    },
    
    // ==================== إدارة عرض الأقسام كبطاقات ====================
    initStudentSections: function() {
        const sectionCards = document.querySelectorAll('.section-card');
        const resultContainer = document.getElementById('student-result-container');
        const dynamicContent = document.getElementById('dynamic-section-content');
        const placeholder = resultContainer ? resultContainer.querySelector('.result-placeholder') : null;

        // جعل جميع الأقسام غير مفعلة في البداية
        sectionCards.forEach(card => {
            card.classList.remove('active');
        });

        // إظهار الرسالة الافتراضية
        if (placeholder) {
            placeholder.classList.add('active');
            placeholder.style.display = 'block';
        }

        // إخفاء المحتوى الديناميكي
        if (dynamicContent) {
            dynamicContent.style.display = 'none';
        }

        // إضافة مستمعي الأحداث لجميع الأقسام
        sectionCards.forEach(card => {
            card.addEventListener('click', () => {
                const sectionId = card.dataset.section;
                
                // إذا كان القسم نفسه النشط حالياً، لا تفعل شيئاً
                if (this.currentActiveSection === sectionId) return;
                
                // إزالة التفعيل من جميع الأقسام
                sectionCards.forEach(c => c.classList.remove('active'));
                
                // تفعيل القسم الحالي
                card.classList.add('active');
                this.currentActiveSection = sectionId;
                
                // إخفاء الرسالة الافتراضية
                if (placeholder) {
                    placeholder.classList.remove('active');
                    placeholder.style.display = 'none';
                }
                
                // إظهار المحتوى الديناميكي
                if (dynamicContent) {
                    dynamicContent.style.display = 'block';
                }
                
                // تحميل محتوى القسم
                this.loadSectionContent(sectionId);
            });
        });
    },
    
    // ==================== تحميل محتوى القسم ====================
    loadSectionContent: function(sectionId) {
        const dynamicContent = document.getElementById('dynamic-section-content');
        if (!dynamicContent) return;
        
        dynamicContent.innerHTML = '';
        
        let sectionHTML = '';
        
        switch(sectionId) {
            case 'subjects-section':
                sectionHTML = this.getSubjectsSectionHTML();
                break;
            case 'lectures-section':
                sectionHTML = this.getLecturesSectionHTML();
                break;
            case 'exams-section':
                sectionHTML = this.getExamsSectionHTML();
                break;
            case 'results-section':
                sectionHTML = this.getResultsSectionHTML();
                break;
            case 'groups-section':
                sectionHTML = this.getGroupsSectionHTML();
                break;
            case 'chat-section':
                sectionHTML = this.getChatSectionHTML();
                break;
        }
        
        dynamicContent.innerHTML = sectionHTML;
        
        setTimeout(() => {
            switch(sectionId) {
                case 'subjects-section':
                    this.subjectsContentHandler.init();
                    this.subjectsContentHandler.renderSubjectsButtons();
                    break;
                case 'lectures-section':
                    this.renderLecturesGrid();
                    break;
                case 'exams-section':
                    this.renderExamsGrid();
                    break;
                case 'results-section':
                    this.renderResultsGrid();
                    break;
                case 'groups-section':
                    this.renderGroupsGrid();
                    break;
                case 'chat-section':
                    this.initChatSection();
                    break;
            }
        }, 100);
    },
    
    // ==================== دوال بناء HTML للأقسام ====================
    getSubjectsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-book"></i>
                <span data-i18n="student.subjects.title">${this.translate('student.subjects.title') || 'المواد الدراسية'}</span>
            </div>
            
            <div class="section-content">
                <!-- تبويبات المواد -->
                <div class="subjects-tabs-wrapper">
                    <div class="subjects-tabs-scroll" id="subjects-buttons-container">
                        <!-- سيتم إضافة المواد هنا ديناميكياً -->
                    </div>
                </div>
                
                <!-- رسالة عدم اختيار مادة -->
                <div class="content-placeholder active" id="content-placeholder">
                    <i class="fas fa-book-open"></i>
                    <h3 data-i18n="student.content.selectSubject">اختر مادة دراسية</h3>
                    <p data-i18n="student.content.selectSubjectMessage">من القائمة أعلاه لعرض المحتوى الخاص بها</p>
                </div>
                
                <!-- تبويبات أنواع المحتوى (تظهر بعد اختيار مادة) -->
                <div class="content-type-tabs" id="content-type-tabs" style="display: none;">
                    <button class="content-type-tab active" data-type="pdfs">
                        <i class="fas fa-file-pdf"></i>
                        <span data-i18n="student.content.pdf">PDF</span>
                    </button>
                    <button class="content-type-tab" data-type="images">
                        <i class="fas fa-image"></i>
                        <span data-i18n="student.content.images">صور</span>
                    </button>
                    <button class="content-type-tab" data-type="audios">
                        <i class="fas fa-volume-up"></i>
                        <span data-i18n="student.content.audio">صوت</span>
                    </button>
                </div>
                
                <!-- لوحات المحتوى -->
                <div class="content-tabs-container" id="content-tabs-container" style="display: none;">
                    <div class="content-tab-panel active" id="pdfs-panel">
                        <div class="data-grid" id="pdfs-grid">
                            <!-- ملفات PDF -->
                        </div>
                    </div>
                    <div class="content-tab-panel" id="images-panel">
                        <div class="data-grid" id="images-grid">
                            <!-- صور -->
                        </div>
                    </div>
                    <div class="content-tab-panel" id="audios-panel">
                        <div class="data-grid" id="audios-grid">
                            <!-- ملفات صوتية -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    getLecturesSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-chalkboard-teacher"></i>
                <span data-i18n="student.lectures.title">${this.translate('student.lectures.title') || 'محاضراتي القادمة'}</span>
            </div>
            
            <div class="section-content">
                <div class="search-box">
                    <input type="text" id="search-lectures" placeholder="${this.translate('student.lectures.search') || 'ابحث في المحاضرات...'}" data-i18n-placeholder="student.lectures.search">
                </div>
                
                <div class="data-grid" id="lectures-grid">
                    <div class="no-data">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span data-i18n="student.lectures.noData">${this.translate('student.lectures.noData') || 'جاري تحميل المحاضرات القادمة...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getExamsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-file-alt"></i>
                <span data-i18n="student.exams.title">${this.translate('student.exams.title') || 'اختباراتي'}</span>
            </div>
            
            <div class="section-content">
                <div class="search-box">
                    <input type="text" id="search-exams" placeholder="${this.translate('student.exams.search') || 'ابحث في الاختبارات...'}" data-i18n-placeholder="student.exams.search">
                </div>
                
                <div class="data-grid" id="exams-grid">
                    <div class="no-data">
                        <i class="fas fa-file-alt"></i>
                        <span data-i18n="student.exams.noData">${this.translate('student.exams.noData') || 'جاري تحميل الاختبارات...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getResultsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-chart-line"></i>
                <span data-i18n="student.results.title">${this.translate('student.results.title') || 'نتائجي'}</span>
            </div>
            
            <div class="section-content">
                <div class="results-stats">
                    <div class="stat-card">
                        <i class="fas fa-trophy"></i>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="student.results.average">${this.translate('student.results.average') || 'المعدل العام'}</span>
                            <span class="stat-value" id="average-score">0%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-file-alt"></i>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="student.results.totalExams">${this.translate('student.results.totalExams') || 'عدد الاختبارات'}</span>
                            <span class="stat-value" id="total-exams">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="search-box">
                    <input type="text" id="search-results" placeholder="${this.translate('student.results.search') || 'ابحث في النتائج...'}" data-i18n-placeholder="student.results.search">
                </div>
                
                <div class="data-grid" id="results-grid">
                    <div class="no-data">
                        <i class="fas fa-chart-line"></i>
                        <span data-i18n="student.results.noData">${this.translate('student.results.noData') || 'جاري تحميل النتائج...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getGroupsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-users"></i>
                <span data-i18n="student.groups.title">${this.translate('student.groups.title') || 'مجموعاتي'}</span>
            </div>
            
            <div class="section-content">
                <div class="data-grid" id="groups-grid">
                    <div class="no-data">
                        <i class="fas fa-users"></i>
                        <span data-i18n="student.groups.noData">${this.translate('student.groups.noData') || 'جاري تحميل المجموعات...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getChatSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-comments"></i>
                <span data-i18n="student.chat.title">${this.translate('student.tabs.chat') || 'الشات العام'}</span>
            </div>
            
            <div class="section-content">
                <div class="student-chat-container">
                    <!-- منطقة الرسائل -->
                    <div class="chat-messages-student" id="chat-messages-student">
                        <div class="chat-loading">
                            <div class="spinner"></div>
                            <p>${this.translate('loading.message') || 'جاري تحميل الرسائل...'}</p>
                        </div>
                    </div>
                    
                    <!-- منطقة الإرسال -->
                    <div class="chat-input-student">
                        <!-- معاينة الملف -->
                        <div class="file-preview-container" id="file-preview-container" style="display: none;">
                            <div class="file-preview-header">
                                <span id="file-preview-title">${this.translate('student.chat.filePreview') || 'معاينة الملف'}</span>
                                <button id="remove-file-btn" class="remove-file-btn">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="file-preview-body" id="file-preview-body"></div>
                        </div>
                        
                        <!-- مؤشر التسجيل -->
                        <div class="recording-container" id="recording-container" style="display: none;">
                            <div class="recording-status">
                                <div class="recording-pulse"></div>
                                <span class="recording-text">${this.translate('student.chat.recording') || 'جاري التسجيل...'}</span>
                                <span class="recording-timer" id="recording-timer">00:00</span>
                            </div>
                            <div class="recording-actions">
                                <button id="send-recording-btn" class="recording-action-btn success">
                                    <i class="fas fa-check"></i> ${this.translate('student.chat.send') || 'إرسال'}
                                </button>
                                <button id="cancel-recording-btn" class="recording-action-btn danger">
                                    <i class="fas fa-times"></i> ${this.translate('student.chat.cancel') || 'إلغاء'}
                                </button>
                            </div>
                        </div>
                        
                        <!-- حاوية الإدخال -->
                        <div class="message-input-container">
                            <textarea 
                                id="student-chat-input" 
                                class="student-chat-input" 
                                placeholder="${this.translate('student.inputPlaceholder') || 'اكتب رسالتك هنا...'}" 
                                rows="1"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==================== دوال العرض المحسنة ====================
    renderLecturesGrid: function() {
        const container = document.getElementById('lectures-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.studentLectures || this.studentLectures.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span data-i18n="student.lectures.empty">${this.translate('student.lectures.empty') || 'لا توجد محاضرات قادمة'}</span>
                </div>
            `;
            return;
        }
        
        this.studentLectures.forEach(lecture => {
            const card = this.createLectureCard(lecture);
            container.appendChild(card);
        });
        
        this.setupSearch('search-lectures', container, '.lecture-card');
    },
    
    createLectureCard: function(lecture) {
        const card = document.createElement('div');
        card.className = 'data-card lecture-card';
        card.dataset.id = lecture.id;
        
        const lectureTitle = this.getLocalizedText(lecture.title);
        const displayTitle = lectureTitle || this.translate('student.lectures.noTitle') || 'بدون عنوان';
        const timeInfo = this.getRemainingTime(lecture.date);
        
        // تحديد نص الشارة بناءً على الوقت المتبقي
        let badgeText = '';
        if (timeInfo.days > 0) {
            badgeText = `${timeInfo.days} ${this.translate('student.lectures.days') || 'أيام'}`;
        } else if (timeInfo.hours > 0) {
            badgeText = `${timeInfo.hours} ${this.translate('student.lectures.hours') || 'ساعات'}`;
        } else {
            badgeText = `${timeInfo.minutes} ${this.translate('student.lectures.minutes') || 'دقائق'}`;
        }
        
        card.innerHTML = `
            <div class="lecture-time-badge ${timeInfo.days === 0 ? 'soon' : ''}">
                <i class="fas fa-clock"></i>
                <span>${badgeText}</span>
            </div>
            <i class="fas fa-chalkboard-teacher"></i>
            <h4>${displayTitle.length > 25 ? displayTitle.substring(0, 25) + '...' : displayTitle}</h4>
        `;
        
        card.addEventListener('click', () => this.openLectureModal(lecture));
        
        return card;
    },
    
    renderExamsGrid: function() {
        const container = document.getElementById('exams-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.studentExams || this.studentExams.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-file-alt"></i>
                    <span data-i18n="student.exams.empty">${this.translate('student.exams.empty') || 'لا توجد اختبارات'}</span>
                </div>
            `;
            return;
        }
        
        this.studentExams.forEach(exam => {
            const card = this.createExamCard(exam);
            container.appendChild(card);
        });
        
        this.setupSearch('search-exams', container, '.exam-card');
    },
    
    createExamCard: function(exam) {
        const card = document.createElement('div');
        card.className = 'data-card exam-card';
        card.dataset.id = exam.id;
        
        const hasTaken = this.studentResults.some(result => result.examId === exam.id);
        const examName = this.getLocalizedText(exam.name);
        const displayName = examName || this.translate('student.exams.noName') || 'بدون اسم';
        const subjectName = exam.subjectId && this.studentSubjects.find(s => s.id === exam.subjectId) ?
            this.getLocalizedText(this.studentSubjects.find(s => s.id === exam.subjectId).name) : 
            this.translate('student.exams.general') || 'عام';
        
        const minutesText = exam.duration || 60;
        const pointsText = exam.totalPoints || 100;
        
        card.innerHTML = `
            <div class="exam-status ${hasTaken ? 'taken' : 'available'}">
                <i class="fas ${hasTaken ? 'fa-check-circle' : 'fa-clock'}"></i>
            </div>
            <i class="fas fa-file-alt"></i>
            <h4>${displayName.length > 25 ? displayName.substring(0, 25) + '...' : displayName}</h4>
            <p>${subjectName}</p>
            <small>${minutesText} ${this.translate('student.exams.minutes') || 'دقيقة'} - ${pointsText} ${this.translate('student.exams.points') || 'درجة'}</small>
        `;
        
        card.addEventListener('click', () => {
            if (hasTaken) {
                this.openResultModal(exam.id);
            } else {
                this.openExamModal(exam);
            }
        });
        
        return card;
    },
    
    renderResultsGrid: function() {
        const container = document.getElementById('results-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.studentResults || this.studentResults.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-line"></i>
                    <span data-i18n="student.results.empty">${this.translate('student.results.empty') || 'لا توجد نتائج بعد'}</span>
                    </div>
            `;
            return;
        }
        
        this.studentResults.forEach(result => {
            const card = this.createResultCard(result);
            container.appendChild(card);
        });
        
        this.setupSearch('search-results', container, '.result-card');
        this.updateStats();
    },
    
    createResultCard: function(result) {
        const card = document.createElement('div');
        card.className = 'data-card result-card';
        
        const exam = this.studentExams.find(e => e.id === result.examId);
        const examName = exam ? this.getLocalizedText(exam.name) : this.translate('student.results.unknownExam') || 'اختبار غير معروف';
        const date = this.formatDate(result.timestamp);
        const score = result.score || 0;
        const totalPoints = exam ? exam.totalPoints : 100;
        const percentage = Math.round((score / totalPoints) * 100);
        
        let displayName = examName;
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        
        card.innerHTML = `
            <div class="result-score ${percentage >= 50 ? 'good' : 'bad'}">
                ${percentage}%
            </div>
            <i class="fas fa-chart-line"></i>
            <h4>${displayName}</h4>
            <div class="result-date">${date}</div>
            <small>${score}/${totalPoints} ${this.translate('student.results.points') || 'درجة'}</small>
        `;
        
        card.addEventListener('click', () => this.openResultDetailsModal(result));
        
        return card;
    },
    
    renderGroupsGrid: function() {
        const container = document.getElementById('groups-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.studentGroups || this.studentGroups.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <span data-i18n="student.groups.empty">${this.translate('student.groups.empty') || 'لا توجد مجموعات'}</span>
                </div>
            `;
            return;
        }
        
        this.studentGroups.forEach(group => {
            const card = this.createGroupCard(group);
            container.appendChild(card);
        });
    },
    
    createGroupCard: function(group) {
        const card = document.createElement('div');
        card.className = 'data-card group-card';
        
        const groupName = this.getLocalizedText(group.name);
        
        let displayName = groupName || this.translate('student.groups.noName') || 'بدون اسم';
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        
        card.innerHTML = `
            <i class="fas fa-users"></i>
            <h4>${displayName}</h4>
        `;
        
        card.addEventListener('click', () => this.openGroupModal(group));
        
        return card;
    },
    
    // ==================== قسم الشات المتكامل ====================
    initChatSection: function() {
        console.log('💬 تهيئة قسم الشات للطالب');
        this.loadStudentMessages();
        this.createChatInputTools();
        this.setupChatEventListeners();
    },
    
    loadStudentMessages: function() {
        const messagesRef = ref(database, 'globalChat');
        
        onValue(messagesRef, (snapshot) => {
            this.chatData = snapshot.val() || {};
            this.renderStudentMessages(this.chatData);
        }, (error) => {
            console.error('❌ خطأ في تحميل الرسائل:', error);
            this.showToast(this.translate('student.chat.loadError') || 'خطأ في تحميل الرسائل', 'error');
        });
    },
    
    renderStudentMessages: function(messages) {
        const container = document.getElementById('chat-messages-student');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!messages || Object.keys(messages).length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-comments"></i>
                    <h3>${this.translate('student.chat.noMessages') || 'لا توجد رسائل بعد'}</h3>
                    <p>${this.translate('student.chat.beFirst') || 'كن أول من يبدأ المحادثة!'}</p>
                </div>
            `;
            return;
        }
        
        const messagesArray = Object.entries(messages).map(([key, msg]) => ({
            key,
            ...msg
        }));
        
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        
        let currentDate = null;
        
        messagesArray.forEach(msg => {
            const messageDate = new Date(msg.timestamp).toLocaleDateString('ar-SA');
            
            if (messageDate !== currentDate) {
                currentDate = messageDate;
                const dateDiv = document.createElement('div');
                dateDiv.className = 'message-date-divider';
                dateDiv.innerHTML = `<span>${messageDate}</span>`;
                container.appendChild(dateDiv);
            }
            
            const messageElement = this.createChatMessageElement(msg);
            container.appendChild(messageElement);
        });
        
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    },
    
    
createChatMessageElement: function(msg) {
    const user = window.usersData ? window.usersData[msg.userId] : null;
    const currentUser = auth.currentUser;
    const isCurrentUser = currentUser && currentUser.uid === msg.userId;
    
    // الحصول على اسم المستخدم
    let userName = this.translate('student.chat.unknownUser') || 'مستخدم غير معروف';
    if (user) {
        userName = user.name || user.email || userName;
    }

    if (isCurrentUser) {
        userName = `${userName} (أنت)`;
    }
    
    const userRole = user ? user.role : 'unknown';
    const time = new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    
    const roleColors = {
        'admin': '#e74c3c',
        'student': '#3498db',
        'parent': '#2ecc71'
    };
    const roleColor = roleColors[userRole] || '#95a5a6';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-student ${isCurrentUser ? 'current-user' : 'other-user'}`;
    
    // إضافة أسلوب لتحديد أقصى عرض للرسالة
    messageDiv.style.cssText = 'width: 100%; display: flex;';
    
    let messageBody = '';
    let additionalContent = '';
    
    if (msg.type === 'voice') {
        messageBody = `
            <div class="voice-message-container">
                <div class="voice-message">
                    <button class="play-voice-btn" data-url="${msg.voiceUrl || ''}">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="voice-waveform">
                        <div class="wave"></div>
                        <div class="wave"></div>
                        <div class="wave"></div>
                        <div class="wave"></div>
                        <div class="wave"></div>
                    </div>
                    <span class="voice-duration">${msg.voiceDuration || 0} ${this.translate('student.chat.seconds') || 'ثانية'}</span>
                </div>
            </div>
        `;
    } else if (msg.type === 'file') {
        const fileIcon = this.getFileIcon(msg.fileType);
        const fileSize = this.formatFileSize(msg.fileSize);
        const isAudioFile = msg.fileType && (
            msg.fileType.includes('audio') || 
            msg.fileType.includes('mp3') || 
            msg.fileType.includes('wav') ||
            msg.fileType.includes('ogg') ||
            msg.fileType.includes('m4a')
        );
        
        messageBody = `
            <div class="file-message-container">
                <div class="file-message ${isAudioFile ? 'audio-file' : ''}">
                    <div class="file-icon">
                        <i class="${fileIcon}"></i>
                    </div>
                    <div class="file-info">
                        <div class="file-name">${msg.fileName || this.translate('student.chat.file') || 'ملف'}</div>
                        <div class="file-details">
                            <span class="file-type">${this.getFileTypeName(msg.fileType)}</span>
                            <span class="file-size">${fileSize}</span>
                        </div>
                    </div>
                    ${isAudioFile ? `
                        <button class="play-audio-btn" data-url="${msg.fileUrl}">
                            <i class="fas fa-play"></i>
                        </button>
                    ` : ''}
                    <a href="${msg.fileUrl}" target="_blank" class="download-file-btn" download="${msg.fileName}">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            </div>
        `;
    } else if (msg.type === 'image') {
        messageBody = `
            <div class="image-message-container">
                <div class="image-message">
                    <img src="${msg.imageUrl}" alt="${this.translate('student.chat.image') || 'صورة'}" class="chat-image">
                    <a href="${msg.imageUrl}" target="_blank" class="view-image-btn">
                        <i class="fas fa-expand"></i>
                    </a>
                </div>
            </div>
        `;
    }
    
    if (msg.text) {
        additionalContent = `<div class="message-text">${this.escapeHtml(msg.text).replace(/\n/g, '<br>')}</div>`;
    }
    
    
    if (isCurrentUser) {
       
        messageDiv.innerHTML = `
            <div class="message-inner">
                <div class="message-header">
                    <div class="message-avatar" style="border-color: ${roleColor};">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="sender-name">${userName}</span>
                    <div class="message-time">${time}</div>
                </div>
                <div class="message-content-wrapper">
                    ${messageBody}
                    ${additionalContent}
                </div>
            </div>
        `;
    } else {
        
        messageDiv.innerHTML = `
            <div class="message-inner">
                <div class="message-header">
                    <div class="message-avatar" style="border-color: ${roleColor};">
                        <i class="fas fa-user"></i>
                    </div>
                    <span class="sender-name">${userName}</span>
                    <div class="message-time">${time}</div>
                </div>
                <div class="message-content-wrapper">
                    ${messageBody}
                    ${additionalContent}
                </div>
            </div>
        `;
    }
    
    // إضافة مستمعي الأحداث للأزرار
    const playBtn = messageDiv.querySelector('.play-voice-btn, .play-audio-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const url = playBtn.dataset.url;
            this.playVoiceMessage(url);
        });
    }
    
    const viewImageBtn = messageDiv.querySelector('.view-image-btn');
    if (viewImageBtn) {
        viewImageBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = viewImageBtn.getAttribute('href');
            window.open(url, '_blank');
        });
    }
    
    return messageDiv;
},
    createChatInputTools: function() {
        const messageInputContainer = document.querySelector('.message-input-container');
        if (!messageInputContainer) return;
        
        const rightTools = document.createElement('div');
        rightTools.className = 'input-tools right';
        rightTools.innerHTML = `
            <button id="voice-record-btn" class="tool-btn voice-btn" title="${this.translate('student.chat.recordVoice') || 'تسجيل رسالة صوتية'}">
                <i class="fas fa-microphone"></i>
            </button>
            <button id="attach-file-btn" class="tool-btn" title="${this.translate('student.chat.attachFile') || 'إرفاق ملف'}">
                <i class="fas fa-paperclip"></i>
            </button>
            <button id="attach-image-btn" class="tool-btn" title="${this.translate('student.chat.attachImage') || 'إرفاق صورة'}">
                <i class="fas fa-image"></i>
            </button>
        `;
        
        const leftTools = document.createElement('div');
        leftTools.className = 'input-tools left';
        leftTools.innerHTML = `
            <button id="send-message-btn" class="send-message-btn" title="${this.translate('student.chat.send') || 'إرسال'}">
                <i class="fas fa-paper-plane"></i>
            </button>
        `;
        
        messageInputContainer.appendChild(rightTools);
        messageInputContainer.appendChild(leftTools);
        
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id = 'file-input';
        fileInput.accept = '.pdf,.doc,.docx,.txt,.mp3,.wav,.ogg,.m4a';
        fileInput.style.display = 'none';
        
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.id = 'image-input';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        
        document.body.appendChild(fileInput);
        document.body.appendChild(imageInput);
        
        const input = document.getElementById('student-chat-input');
        const sendBtn = document.getElementById('send-message-btn');
        const voiceBtn = document.getElementById('voice-record-btn');
        const attachFileBtn = document.getElementById('attach-file-btn');
        const attachImageBtn = document.getElementById('attach-image-btn');
        
        if (sendBtn && input) {
            sendBtn.addEventListener('click', () => {
                this.sendChatMessage(input);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage(input);
                }
            });
            
            input.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });
        }
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.stopVoiceRecording(false);
                } else {
                    this.startVoiceRecording();
                }
            });
        }
        
        if (attachFileBtn) {
            attachFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file, 'file');
                }
                fileInput.value = '';
            });
        }
        
        if (attachImageBtn) {
            attachImageBtn.addEventListener('click', () => {
                imageInput.click();
            });
            
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleFileUpload(file, 'image');
                }
                imageInput.value = '';
            });
        }
    },
    
    setupChatEventListeners: function() {
        const removeFileBtn = document.getElementById('remove-file-btn');
        const sendRecordingBtn = document.getElementById('send-recording-btn');
        const cancelRecordingBtn = document.getElementById('cancel-recording-btn');
        
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', () => {
                this.clearFilePreview();
            });
        }
        
        if (sendRecordingBtn) {
            sendRecordingBtn.addEventListener('click', () => {
                this.stopVoiceRecording(true);
            });
        }
        
        if (cancelRecordingBtn) {
            cancelRecordingBtn.addEventListener('click', () => {
                this.stopVoiceRecording(false);
            });
        }
        
        setInterval(() => {
            const voiceBtn = document.getElementById('voice-record-btn');
            if (voiceBtn) {
                if (this.isRecording) {
                    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                    voiceBtn.style.background = 'rgba(var(--bg-text-rgb), 0.3)';
                    voiceBtn.title = this.translate('student.chat.stopRecording') || 'إيقاف التسجيل';
                } else {
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceBtn.style.background = '';
                    voiceBtn.title = this.translate('student.chat.recordVoice') || 'تسجيل رسالة صوتية';
                }
            }
        }, 100);
    },
    
    handleFileUpload: function(file, type) {
        if (!file) return;
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast(this.translate('student.chat.fileTooLarge') || 'حجم الملف كبير جداً (الحد الأقصى 10MB)', 'error');
            return;
        }
        
        this.currentFile = file;
        this.fileType = type;
        
        this.showFilePreview(file, type);
    },
    
    showFilePreview: function(file, type) {
        const previewContainer = document.getElementById('file-preview-container');
        const previewBody = document.getElementById('file-preview-body');
        const previewTitle = document.getElementById('file-preview-title');
        
        if (!previewContainer || !previewBody) return;
        
        previewContainer.style.display = 'block';
        
        let previewHTML = '';
        const fileSize = this.formatFileSize(file.size);
        
        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewHTML = `
                    <div class="image-preview">
                        <img src="${e.target.result}" alt="${this.translate('student.chat.imagePreview') || 'معاينة الصورة'}">
                    </div>
                    <div class="file-info-preview">
                        <div class="file-name-preview">${file.name}</div>
                        <div class="file-details-preview">
                            <span><i class="fas fa-image"></i> ${this.translate('student.chat.image') || 'صورة'}</span>
                            <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                        </div>
                    </div>
                `;
                previewBody.innerHTML = previewHTML;
            };
            reader.readAsDataURL(file);
            previewTitle.textContent = this.translate('student.chat.imagePreview') || 'معاينة الصورة';
        } else {
            const fileIcon = this.getFileIcon(file.type);
            const isAudioFile = file.type && (
                file.type.includes('audio') || 
                file.type.includes('mp3') || 
                file.type.includes('wav') ||
                file.type.includes('ogg') ||
                file.type.includes('m4a')
            );
            
            if (isAudioFile) {
                const audio = new Audio();
                audio.src = URL.createObjectURL(file);
                audio.onloadedmetadata = () => {
                    const duration = Math.round(audio.duration);
                    previewHTML = `
                        <div class="file-preview audio-preview">
                            <div class="file-icon-preview">
                                <i class="${fileIcon}"></i>
                            </div>
                            <div class="file-info-preview">
                                <div class="file-name-preview">${file.name}</div>
                                <div class="file-details-preview">
                                    <span><i class="fas fa-file-audio"></i> ${this.translate('student.chat.audioFile') || 'ملف صوتي'}</span>
                                    <span><i class="fas fa-clock"></i> ${duration} ${this.translate('student.chat.seconds') || 'ثانية'}</span>
                                    <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                                </div>
                            </div>
                            <button class="preview-audio-btn">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    `;
                    previewBody.innerHTML = previewHTML;
                    
                    const playBtn = previewBody.querySelector('.preview-audio-btn');
                    if (playBtn) {
                        const previewAudio = audio;
                        playBtn.addEventListener('click', () => {
                            if (previewAudio.paused) {
                                previewAudio.play();
                                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                            } else {
                                previewAudio.pause();
                                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                            }
                        });
                        
                        previewAudio.onended = () => {
                            playBtn.innerHTML = '<i class="fas fa-play"></i>';
                        };
                    }
                };
            } else {
                previewHTML = `
                    <div class="file-preview">
                        <div class="file-icon-preview">
                            <i class="${fileIcon}"></i>
                        </div>
                        <div class="file-info-preview">
                            <div class="file-name-preview">${file.name}</div>
                            <div class="file-details-preview">
                                <span><i class="fas fa-file"></i> ${this.getFileTypeName(file.type)}</span>
                                <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                            </div>
                        </div>
                    </div>
                `;
                previewBody.innerHTML = previewHTML;
            }
            previewTitle.textContent = this.translate('student.chat.filePreview') || 'معاينة الملف';
        }
    },
    
    clearFilePreview: function() {
        const previewContainer = document.getElementById('file-preview-container');
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        this.currentFile = null;
        this.fileType = null;
    },
    
    sendChatMessage: async function(input) {
        const text = input.value.trim();
        const user = auth.currentUser;
        
        if (!user) {
            this.showToast(this.translate('student.chat.loginRequired') || 'يجب تسجيل الدخول لإرسال الرسائل', 'error');
            return;
        }
        
        if (this.currentFile) {
            this.showToast(this.translate('student.chat.uploadingFile') || 'جاري رفع الملف...', 'info');
            
            try {
                let fileUrl;
                const isAudioFile = this.currentFile.type && (
                    this.currentFile.type.includes('audio') || 
                    this.currentFile.type.includes('mp3') || 
                    this.currentFile.type.includes('wav') ||
                    this.currentFile.type.includes('ogg') ||
                    this.currentFile.type.includes('m4a')
                );
                
                if (this.fileType === 'image') {
                    fileUrl = await this.uploadToCloudinary(this.currentFile, 'image');
                } else if (isAudioFile) {
                    fileUrl = await this.uploadToCloudinary(this.currentFile, 'video');
                } else {
                    fileUrl = await this.uploadToCloudinary(this.currentFile, 'raw');
                }
                
                if (fileUrl) {
                    const messageData = {
                        type: this.fileType,
                        userId: user.uid,
                        timestamp: Date.now(),
                        text: text
                    };
                    
                    if (this.fileType === 'image') {
                        messageData.imageUrl = fileUrl;
                        messageData.fileName = this.currentFile.name;
                        messageData.fileSize = this.currentFile.size;
                        messageData.fileType = this.currentFile.type;
                    } else if (this.fileType === 'file') {
                        messageData.fileUrl = fileUrl;
                        messageData.fileName = this.currentFile.name;
                        messageData.fileSize = this.currentFile.size;
                        messageData.fileType = this.currentFile.type;
                    }
                    
                    await push(ref(database, 'globalChat'), messageData);
                    
                    this.showToast(this.translate('student.chat.fileSent') || 'تم إرسال الملف بنجاح', 'success');
                    this.clearFilePreview();
                    input.value = '';
                    input.style.height = 'auto';
                }
                
            } catch (error) {
                console.error('❌ خطأ في رفع الملف:', error);
                this.showToast(`${this.translate('student.chat.uploadError') || 'خطأ في رفع الملف'}: ${error.message}`, 'error');
            }
            
        } else if (text) {
            try {
                await push(ref(database, 'globalChat'), {
                    text: text,
                    userId: user.uid,
                    timestamp: Date.now(),
                    type: 'text'
                });
                
                input.value = '';
                input.style.height = 'auto';
                input.focus();
                
                this.showToast(this.translate('student.chat.messageSent') || 'تم إرسال الرسالة', 'success');
            } catch (error) {
                console.error('❌ خطأ في إرسال الرسالة:', error);
                this.showToast(this.translate('student.chat.sendError') || 'خطأ في إرسال الرسالة', 'error');
            }
        } else {
            this.showToast(this.translate('student.chat.writeMessage') || 'اكتب رسالة أو أرفق ملفًا', 'warning');
        }
    },
    
    uploadToCloudinary: async function(file, resourceType = 'auto') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
        formData.append('resource_type', resourceType);
        
        try {
            const response = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${this.translate('student.chat.uploadFailed') || 'فشل رفع الملف'}: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ تم رفع الملف بنجاح:', data);
            return data.secure_url;
            
        } catch (error) {
            console.error('❌ خطأ في رفع الملف إلى Cloudinary:', error);
            throw error;
        }
    },
    
    startVoiceRecording: async function() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error(this.translate('student.chat.recordingNotSupported') || 'المتصفح لا يدعم التسجيل الصوتي');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            const options = { mimeType: 'audio/webm' };
            this.mediaRecorder = new MediaRecorder(stream, options);
            this.audioChunks = [];
            this.isRecording = true;
            this.recordingTime = 0;
            
            this.showRecordingUI();
            
            this.recordingTimer = setInterval(() => {
                this.recordingTime++;
                this.updateRecordingTimer();
            }, 1000);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                clearInterval(this.recordingTimer);
                stream.getTracks().forEach(track => track.stop());
            };
            
            this.mediaRecorder.start(100);
            
            console.log('🎤 بدأ التسجيل الصوتي');
            
        } catch (error) {
            console.error('❌ خطأ في بدء التسجيل الصوتي:', error);
            this.showToast(`${this.translate('student.chat.microphoneError') || 'تعذر الوصول إلى الميكروفون'}: ${error.message}`, 'error');
        }
    },
    
    stopVoiceRecording: async function(send = true) {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        console.log('⏹️ إيقاف التسجيل الصوتي، الإرسال:', send);
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        clearInterval(this.recordingTimer);
        
        await new Promise(resolve => {
            this.mediaRecorder.onstop = () => {
                resolve();
            };
        });
        
        if (send && this.audioChunks.length > 0) {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
                type: 'audio/webm'
            });
            
            this.showToast(this.translate('student.chat.uploadingVoice') || 'جاري رفع الرسالة الصوتية...', 'info');
            
            try {
                const voiceUrl = await this.uploadToCloudinary(audioFile, 'video');
                
                if (voiceUrl) {
                    await this.saveVoiceMessage(voiceUrl, this.recordingTime);
                }
            } catch (error) {
                console.error('❌ خطأ في رفع الرسالة الصوتية:', error);
                this.showToast(`${this.translate('student.chat.voiceUploadFailed') || 'فشل رفع الرسالة الصوتية'}: ${error.message}`, 'error');
            }
        } else {
            console.log('❌ لا توجد بيانات صوتية لرفعها');
        }
        
        this.audioChunks = [];
        this.hideRecordingUI();
    },
    
    saveVoiceMessage: async function(voiceUrl, duration) {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            await push(ref(database, 'globalChat'), {
                type: 'voice',
                voiceUrl: voiceUrl,
                voiceDuration: duration,
                userId: user.uid,
                timestamp: Date.now()
            });
            
            this.showToast(this.translate('student.chat.voiceSent') || 'تم إرسال الرسالة الصوتية بنجاح', 'success');
        } catch (error) {
            console.error('❌ خطأ في حفظ الرسالة الصوتية:', error);
            this.showToast(this.translate('student.chat.voiceSendError') || 'خطأ في إرسال الرسالة الصوتية', 'error');
        }
    },
    
    showRecordingUI: function() {
        const container = document.getElementById('recording-container');
        const input = document.getElementById('student-chat-input');
        
        if (container) container.style.display = 'block';
        if (input) input.style.display = 'none';
    },
    
    hideRecordingUI: function() {
        const container = document.getElementById('recording-container');
        const input = document.getElementById('student-chat-input');
        
        if (container) container.style.display = 'none';
        if (input) input.style.display = 'block';
    },
    
    updateRecordingTimer: function() {
        const timerElement = document.getElementById('recording-timer');
        if (timerElement) {
            const minutes = Math.floor(this.recordingTime / 60).toString().padStart(2, '0');
            const seconds = (this.recordingTime % 60).toString().padStart(2, '0');
            timerElement.textContent = `${minutes}:${seconds}`;
        }
    },
    
    playVoiceMessage: function(url) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        this.currentAudio = new Audio(url);
        this.currentAudio.play().catch(error => {
            console.error('❌ خطأ في تشغيل الرسالة الصوتية:', error);
            this.showToast(this.translate('student.chat.playbackError') || 'تعذر تشغيل الرسالة الصوتية', 'error');
        });
        
        this.currentAudio.onended = () => {
            this.currentAudio = null;
        };
    },
    
    getFileIcon: function(fileType) {
        if (!fileType) return 'fas fa-file';
        
        if (fileType.includes('image')) return 'fas fa-image';
        if (fileType.includes('pdf')) return 'fas fa-file-pdf';
        if (fileType.includes('word') || fileType.includes('doc')) return 'fas fa-file-word';
        if (fileType.includes('excel') || fileType.includes('xls')) return 'fas fa-file-excel';
        if (fileType.includes('audio') || fileType.includes('sound') || fileType.includes('mp3') || fileType.includes('wav') || fileType.includes('ogg') || fileType.includes('m4a')) {
            return 'fas fa-file-audio';
        }
        if (fileType.includes('video')) return 'fas fa-file-video';
        if (fileType.includes('text') || fileType.includes('txt')) return 'fas fa-file-alt';
        
        return 'fas fa-file';
    },
    
    getFileTypeName: function(fileType) {
        if (!fileType) return this.translate('student.chat.file') || 'ملف';
        
        if (fileType.includes('image')) return this.translate('student.chat.image') || 'صورة';
        if (fileType.includes('pdf')) return 'PDF';
        if (fileType.includes('word') || fileType.includes('doc')) return 'Word';
        if (fileType.includes('audio') || fileType.includes('sound') || fileType.includes('mp3') || fileType.includes('wav') || fileType.includes('ogg') || fileType.includes('m4a')) {
            return this.translate('student.chat.audio') || 'صوت';
        }
        
        return this.translate('student.chat.file') || 'ملف';
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // ==================== دوال البحث ====================
    setupSearch: function(inputId, container, cardSelector) {
        const searchInput = document.getElementById(inputId);
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const cards = container.querySelectorAll(cardSelector);
            
            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(query) ? '' : 'none';
            });
        });
    },
    
    // ==================== المودالات (النوافذ المنبثقة) ====================
    openLectureModal: function(lecture) {
        const modalRoot = document.getElementById('lectureModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const lectureTitle = this.getLocalizedText(lecture.title);
        const lectureDescription = this.getLocalizedText(lecture.description);
        const lectureDate = this.formatDateTime(lecture.date);
        const timeInfo = this.getRemainingTime(lecture.date);
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-chalkboard-teacher"></i> ${lectureTitle}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="lecture-info">
                        <div class="info-item">
                            <div>
                                <strong><i class="fas fa-calendar"></i> ${this.translate('student.lectures.dateTime') || 'التاريخ'}</strong>
                                <span>${lectureDate}</span>
                            </div>
                        </div>
                        ${lectureDescription ? `
                        <div class="info-item">
                            <div>
                                <strong><i class="fas fa-align-left"></i> ${this.translate('student.lectures.description') || 'الوصف'}</strong>
                                <p>${lectureDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>

                    <div class="countdown-section">
                        <h3><i class="fas fa-hourglass-half"></i> ${this.translate('student.lectures.remainingTime') || 'الوقت المتبقي'}</h3>
                        <div class="countdown-display">
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-days">${timeInfo.days.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('student.lectures.days') || 'أيام'}</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-hours">${timeInfo.hours.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('student.lectures.hours') || 'ساعات'}</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-minutes">${timeInfo.minutes.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('student.lectures.minutes') || 'دقائق'}</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-seconds">${timeInfo.seconds.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('student.lectures.seconds') || 'ثواني'}</span>
                            </div>
                        </div>
                        <div class="countdown-status" id="lecture-status">${timeInfo.status}</div>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        const countdownInterval = setInterval(() => {
            const timeInfo = this.getRemainingTime(lecture.date);
            
            modal.querySelector('#lecture-days').textContent = timeInfo.days.toString().padStart(2, '0');
            modal.querySelector('#lecture-hours').textContent = timeInfo.hours.toString().padStart(2, '0');
            modal.querySelector('#lecture-minutes').textContent = timeInfo.minutes.toString().padStart(2, '0');
            modal.querySelector('#lecture-seconds').textContent = timeInfo.seconds.toString().padStart(2, '0');
            modal.querySelector('#lecture-status').textContent = timeInfo.status;
            
            if (timeInfo.days === 0 && timeInfo.hours === 0 && timeInfo.minutes === 0 && timeInfo.seconds === 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        modal.dataset.countdownInterval = countdownInterval;
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    openExamModal: function(exam) {
        const modalRoot = document.getElementById('examModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const examName = this.getLocalizedText(exam.name);
        const examDescription = this.getLocalizedText(exam.description);
        const hasTaken = this.studentResults.some(result => result.examId === exam.id);
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-file-alt"></i> ${examName}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="exam-info">

                        <div class="info-item">
                            <div>
                                <strong> <i class="fas fa-clock"></i> ${this.translate('student.exams.duration') || 'المدة'}</strong>
                                <span>${exam.duration || 60} ${this.translate('student.exams.minutes') || 'دقيقة'}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div>
                                <strong> <i class="fas fa-star"></i> ${this.translate('student.exams.totalPoints') || 'الدرجة الكلية'}</strong>
                                <span>${exam.totalPoints || 100} ${this.translate('student.exams.points') || 'درجة'}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div>
                                <strong> <i class="fas fa-question-circle"></i> ${this.translate('student.exams.questionsCount') || 'عدد الأسئلة'}</strong>
                                <span>${exam.questions ? Object.keys(exam.questions).length : 0}</span>
                            </div>
                        </div>
                        ${examDescription ? `
                        <div class="info-item">
                            <div>
                                <strong> <i class="fas fa-align-left"></i> ${this.translate('student.exams.description') || 'الوصف'}</strong>
                                <p>${examDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>
                    
                    <div class="exam-instructions">
                        <h3><i class="fas fa-info-circle"></i> ${this.translate('student.exams.instructions') || 'تعليمات'}</h3>
                        <ul>
                            <li>${this.translate('student.exams.instruction1') || 'سيتم احتساب الوقت بدقة'}</li>
                            <li>${this.translate('student.exams.instruction2') || 'لا يمكنك الخروج من الاختبار أثناء الإجابة'}</li>
                            <li>${this.translate('student.exams.instruction3') || 'سيتم تصحيح الإجابات تلقائياً'}</li>
                            <li>${this.translate('student.exams.instruction4') || 'لا يمكنك إعادة الاختبار بعد الإنهاء'}</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        ${hasTaken ? 
                            `<button class="modal-btn view-result-btn">
                                <i class="fas fa-eye"></i> ${this.translate('student.exams.viewResult') || 'عرض النتيجة'}
                            </button>` : 
                            `<button class="modal-btn start-exam-btn">
                                <i class="fas fa-play"></i> ${this.translate('student.exams.startExam') || 'بدء الاختبار'}
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        if (hasTaken) {
            modal.querySelector('.view-result-btn').addEventListener('click', () => {
                this.closeModal(modal, modalRoot);
                this.openResultModal(exam.id);
            });
        } else {
            modal.querySelector('.start-exam-btn').addEventListener('click', () => {
                this.closeModal(modal, modalRoot);
                setTimeout(() => this.openTakeExamModal(exam), 300);
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    openTakeExamModal: function(exam) {
        const modalRoot = document.getElementById('examTakeModalRoot');
        if (!modalRoot) return;
        
        // التحقق من وجود اختبار نشط مخزن
        const activeSession = this.loadExamSession();
        const shouldRestore = activeSession && activeSession.examId === exam.id;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        this.currentExam = exam;
        
        if (shouldRestore) {
            // استعادة الاختبار من الجلسة المحفوظة
            const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
            this.examTimeLeft = Math.max(activeSession.timeLeft - elapsed, 0);
            console.log('🔄 استعادة اختبار، الوقت المتبقي:', this.examTimeLeft);
        } else {
            this.examTimeLeft = (exam.duration || 60) * 60;
        }
        
        const isExamStarted = shouldRestore;
        
        modal.innerHTML = `
        <div class="modal-content-new take-exam-modal" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h2><i class="fas fa-file-alt"></i> ${this.getLocalizedText(exam.name)}</h2>
                <!-- المؤقت يظهر دائماً ولكن يكون مخفياً في البداية -->
                <div class="exam-timer" id="exam-timer" style="${isExamStarted ? '' : 'display:none;'}">${Math.floor(this.examTimeLeft / 60)}:${(this.examTimeLeft % 60).toString().padStart(2, '0')}</div>
                <button class="modal-close-unified" id="close-exam-btn" ${isExamStarted ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                ${!isExamStarted ? `
                <div class="exam-instructions" id="exam-instructions">
                    <h3><i class="fas fa-info-circle"></i> ${this.translate('student.exams.examInstructions') || 'تعليمات الاختبار'}</h3>
                    <ul>
                        <li>${this.translate('student.exams.examDuration') || 'مدة الاختبار:'} ${exam.duration || 60} ${this.translate('student.exams.minutes') || 'دقيقة'}</li>
                        <li>${this.translate('student.exams.totalPoints') || 'الدرجة الكلية:'} ${exam.totalPoints || 100} ${this.translate('student.exams.points') || 'درجة'}</li>
                        <li>${this.translate('student.exams.questionsCount') || 'عدد الأسئلة:'} ${exam.questions ? Object.keys(exam.questions).length : 0}</li>
                        <li>${this.translate('student.exams.instruction5') || 'لا يمكنك إغلاق نافذة الاختبار أثناء الإجابة'}</li>
                        <li>${this.translate('student.exams.instruction6') || 'سيتم تصحيح الإجابات تلقائياً بعد انتهاء الوقت'}</li>
                    </ul>
                </div>
                ` : ''}
                
                <div class="exam-questions-container" id="exam-questions-container" style="${isExamStarted ? 'display:block;' : 'display:none;'}">
                    <form id="exam-questions-form"></form>
                </div>
            </div>
            
            <div class="modal-footer">
                <div class="form-actions">
                    ${!isExamStarted ? `
                    <button class="modal-btn start-exam-btn" id="start-exam-btn">
                        <i class="fas fa-play"></i> ${this.translate('student.exams.startExam') || 'بدء الاختبار'}
                    </button>
                    ` : `
                    <button class="modal-btn submit-exam-btn" id="submit-exam-btn">
                        <i class="fas fa-check-circle"></i> ${this.translate('student.exams.finishExam') || 'إنهاء الاختبار'}
                    </button>
                    `}
                </div>
            </div>
        </div>
    `;
        
        // إعداد حدث الإغلاق
        const closeBtn = modal.querySelector('#close-exam-btn');
        const closeModal = () => {
            if (isExamStarted) {
                this.showToast(this.translate('student.exams.cantClose') || 'لا يمكن إغلاق نافذة الاختبار أثناء الإجابة', 'warning');
                return;
            }
            
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // إذا كان الاختبار مستأنفًا، نحمله مباشرة
        if (isExamStarted) {
            this.loadExamQuestions(exam, modal, activeSession.answers || {});
            this.startExamTimer(modal);
            this.preventNavigation();
            
            // إعداد مستمعين لتحديث الإجابات
            this.setupAnswerListeners(modal, exam);
        } else {
            
            // زر بدء الاختبار
            const startBtn = modal.querySelector('#start-exam-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    modal.querySelector('#exam-instructions').style.display = 'none';
                    modal.querySelector('#exam-questions-container').style.display = 'block';
                    
                    // تغيير زر الفوتر
                    const formActions = modal.querySelector('.form-actions');
                    formActions.innerHTML = `
                        <button class="modal-btn submit-exam-btn" id="submit-exam-btn">
                            <i class="fas fa-check-circle"></i> ${this.translate('student.exams.finishExam') || 'إنهاء الاختبار'}
                        </button>
                    `;
                    
                    // تعطيل زر الإغلاق
                    closeBtn.disabled = true;
                    closeBtn.style.opacity = '0.5';
                    closeBtn.style.cursor = 'not-allowed';
                    
                    // إظهار المؤقت في الهيدر
                    const examTimerElement = modal.querySelector('#exam-timer');
                    examTimerElement.style.display = 'block';
                    
                    this.loadExamQuestions(exam, modal);
                    this.startExamTimer(modal);
                    this.preventNavigation();
                    
                    // حفظ جلسة الاختبار
                    this.saveExamSession(exam.id, this.examTimeLeft, {});
                    
                    // إعداد مستمعين لتحديث الإجابات
                    this.setupAnswerListeners(modal, exam);
                    
                    // زر إنهاء الاختبار الجديد
                    const newSubmitBtn = modal.querySelector('#submit-exam-btn');
                    if (newSubmitBtn) {
                        newSubmitBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (confirm(this.translate('student.exams.confirmSubmit') || 'هل أنت متأكد من إنهاء الاختبار؟')) {
                                this.submitExam(exam, modal);
                            }
                        });
                    }
                    
                    // عرض رسالة تأكيد
                    this.showToast(this.translate('student.exams.examStarted') || 'تم بدء الاختبار، لا تغلق النافذة أو تعيد التحميل', 'info');
                });
            }
        }
        
        // زر إنهاء الاختبار (للمحفظة القديمة)
        const submitBtn = modal.querySelector('#submit-exam-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm(this.translate('student.exams.confirmSubmit') || 'هل أنت متأكد من إنهاء الاختبار؟')) {
                    this.submitExam(exam, modal);
                }
            });
        }
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },

// إعداد مستمعين لتحديث الإجابات
setupAnswerListeners: function(modal, exam) {
    const form = modal.querySelector('#exam-questions-form');
    if (!form) return;
    
    const updateAnswers = () => {
        const answers = this.collectExamAnswers(exam, modal);
        this.saveExamSession(exam.id, this.examTimeLeft, answers);
    };
    
    // تحديث عند تغيير أي إجابة
    form.addEventListener('change', updateAnswers);
    form.addEventListener('input', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'text') {
            updateAnswers();
        }
    });
},
    
    
startExamTimer: function(modal) {
    const timerElement = modal.querySelector('#exam-timer');
    if (!timerElement) {
        console.error('❌ عنصر المؤقت غير موجود في الهيدر');
        return;
    }
    
    // تحديث المؤقت فوراً
    const minutes = Math.floor(this.examTimeLeft / 60);
    const seconds = this.examTimeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    this.examTimer = setInterval(() => {
        if (this.examTimeLeft <= 0) {
            clearInterval(this.examTimer);
            this.showToast(this.translate('student.exams.timeEnded') || 'انتهى وقت الاختبار', 'warning');
            this.submitExam(this.currentExam, modal);
            return;
        }
        
        const minutes = Math.floor(this.examTimeLeft / 60);
        const seconds = this.examTimeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.examTimeLeft--;
        
        // تحديث جلسة الاختبار كل 10 ثوانٍ
        if (this.examTimeLeft % 10 === 0) {
            const answers = this.collectExamAnswers(this.currentExam, modal);
            this.saveExamSession(this.currentExam.id, this.examTimeLeft, answers);
        }
        
        // تغيير اللون عند اقتراب انتهاء الوقت
        if (this.examTimeLeft < 300) {
            timerElement.style.color = '#e74c3c';
            timerElement.style.animation = 'pulse 1s infinite';
        }
        
        // عند الـ 5 دقائق الأخيرة، إظهار تحذير
        if (this.examTimeLeft === 300) {
            this.showToast(this.translate('student.exams.fiveMinutesLeft') || 'تنبيه: بقي 5 دقائق فقط على انتهاء وقت الاختبار', 'warning');
        }
    }, 1000);
},
    
    loadExamQuestions: function(exam, modal, savedAnswers = {}) {
        const container = modal.querySelector('#exam-questions-form');
        if (!container || !exam.questions) return;
        
        let questionsHTML = '';
        let questionIndex = 1;
        
        Object.entries(exam.questions).forEach(([questionId, question]) => {
            questionsHTML += this.createExamQuestionHTML(questionId, question, questionIndex, savedAnswers);
            questionIndex++;
        });
        
        container.innerHTML = questionsHTML;
    },
    
    createExamQuestionHTML: function(questionId, question, index, savedAnswers = {}) {
        const savedAnswer = savedAnswers[questionId];
        let questionHTML = '';
        
        switch(question.type) {
            case 'mc':
                questionHTML = `
                    <div class="exam-question mc-question">
                        <div class="question-header">
                            <h3>${this.translate('student.exams.question') || 'سؤال'} ${index}: ${this.translate('student.exams.mcQuestion') || 'اختيار من متعدد'}</h3>
                            <span class="question-points">${question.points || 1} ${this.translate('student.exams.point') || 'نقطة'}</span>
                        </div>
                        <p class="question-text">${question.text}</p>
                        <div class="question-options">
                            ${question.options.map((option, optIndex) => `
                                <label class="option-label">
                                    <input type="radio" name="q_${questionId}" value="${optIndex}" ${savedAnswer === optIndex ? 'checked' : ''}>
                                    <span>${option}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'tf':
                questionHTML = `
                    <div class="exam-question tf-question">
                        <div class="question-header">
                            <h3>${this.translate('student.exams.question') || 'سؤال'} ${index}: ${this.translate('student.exams.tfQuestion') || 'صح أو خطأ'}</h3>
                            <span class="question-points">${question.points || 1} ${this.translate('student.exams.point') || 'نقطة'}</span>
                        </div>
                        <p class="question-text">${question.text}</p>
                        <div class="question-options">
                            <label class="option-label">
                                <input type="radio" name="q_${questionId}" value="true" ${savedAnswer === true ? 'checked' : ''}>
                                <span>${this.translate('student.exams.true') || 'صح'}</span>
                            </label>
                            <label class="option-label">
                                <input type="radio" name="q_${questionId}" value="false" ${savedAnswer === false ? 'checked' : ''}>
                                <span>${this.translate('student.exams.false') || 'خطأ'}</span>
                            </label>
                        </div>
                    </div>
                `;
                break;
                
            case 'fb':
                const blankAnswers = savedAnswer || Array(question.blanks.length).fill('');
                questionHTML = `
                    <div class="exam-question fb-question">
                        <div class="question-header">
                            <h3>${this.translate('student.exams.question') || 'سؤال'} ${index}: ${this.translate('student.exams.fbQuestion') || 'أكمل الفراغ'}</h3>
                            <span class="question-points">${question.points || 1} ${this.translate('student.exams.point') || 'نقطة'}</span>
                        </div>
                        <p class="question-text">${question.text}</p>
                        <div class="question-blanks">
                            ${question.blanks.map((blank, blankIndex) => `
                                <div class="blank-input">
                                    <label>${this.translate('student.exams.answer') || 'الإجابة'} ${blankIndex + 1}:</label>
                                    <input type="text" name="q_${questionId}_${blankIndex}" value="${blankAnswers[blankIndex] || ''}" placeholder="${this.translate('student.exams.enterAnswer') || 'أدخل الإجابة'}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
        }
        
        return questionHTML;
    },
    
    collectExamAnswers: function(exam, modal) {
        const form = modal.querySelector('#exam-questions-form');
        const answers = {};
        
        Object.keys(exam.questions).forEach(questionId => {
            const question = exam.questions[questionId];
            
            switch(question.type) {
                case 'mc':
                    const selectedOption = form.querySelector(`input[name="q_${questionId}"]:checked`);
                    answers[questionId] = selectedOption ? parseInt(selectedOption.value) : null;
                    break;
                    
                case 'tf':
                    const selectedTF = form.querySelector(`input[name="q_${questionId}"]:checked`);
                    answers[questionId] = selectedTF ? selectedTF.value === 'true' : null;
                    break;
                    
                case 'fb':
                    const blankAnswers = [];
                    question.blanks.forEach((blank, blankIndex) => {
                        const input = form.querySelector(`input[name="q_${questionId}_${blankIndex}"]`);
                        blankAnswers.push(input ? input.value.trim() : '');
                    });
                    answers[questionId] = blankAnswers;
                    break;
            }
        });
        
        return answers;
    },
    
    calculateExamScore: function(exam, answers) {
        let totalScore = 0;
        let maxScore = 0;
        
        Object.entries(exam.questions).forEach(([questionId, question]) => {
            maxScore += question.points || 1;
            
            const userAnswer = answers[questionId];
            if (userAnswer === null || userAnswer === undefined) return;
            
            switch(question.type) {
                case 'mc':
                    if (userAnswer === question.correctIndex) {
                        totalScore += question.points || 1;
                    }
                    break;
                    
                case 'tf':
                    if (userAnswer === question.correctAnswer) {
                        totalScore += question.points || 1;
                    }
                    break;
                    
                case 'fb':
                    question.blanks.forEach((blank, blankIndex) => {
                        if (userAnswer[blankIndex] && 
                            userAnswer[blankIndex].toLowerCase() === blank.correctAnswer.toLowerCase()) {
                            totalScore += (question.points || 1) / question.blanks.length;
                        }
                    });
                    break;
            }
        });
        
        return Math.round((totalScore / maxScore) * 100);
    },
    
    
submitExam: function(exam, modal) {
    if (this.examTimer) {
        clearInterval(this.examTimer);
    }
    
    this.allowNavigation();
    this.clearExamSession(); // مسح جلسة الاختبار
    
    const answers = this.collectExamAnswers(exam, modal);
    const score = this.calculateExamScore(exam, answers);
    this.saveExamResult(exam.id, score, answers);
    
    setTimeout(() => {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            document.getElementById('examTakeModalRoot').style.display = 'none';
            
            this.showExamResult(exam, score);
            this.loadStudentResults();
        }, 300);
    }, 500);
},

    
    saveExamResult: function(examId, score, answers) {
        const userId = this.currentUser.uid;
        const resultRef = ref(database, `examResults/${userId}/${examId}`);
        
        const resultData = {
            examId: examId,
            score: score,
            answers: answers,
            timestamp: Date.now(),
            studentId: userId,
            studentName: this.studentData.name || this.studentData.email
        };
        
        set(resultRef, resultData)
            .then(() => {
                console.log('✅ تم حفظ نتيجة الاختبار');
                this.showToast(this.translate('student.exams.resultSaved') || 'تم حفظ نتيجة الاختبار بنجاح', 'success');
            })
            .catch(error => {
                console.error('❌ خطأ في حفظ نتيجة الاختبار:', error);
                this.showToast(this.translate('student.exams.resultSaveError') || 'خطأ في حفظ نتيجة الاختبار', 'error');
            });
    },
    
    
preventNavigation: function() {
    const message = this.translate('student.exams.refreshWarning') || 'إذا قمت بتحديث الصفحة، ستفقد إجابات الاختبار. هل أنت متأكد؟';
    
    window.onbeforeunload = function(e) {
        // إظهار رسالة تحذير
        e.preventDefault();
        e.returnValue = message;
        return message;
    };
    
    // منع زر الرجوع
    history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        history.pushState(null, null, window.location.href);
        studentApp.showToast(message, 'warning');
    };
},

allowNavigation: function() {
    window.onbeforeunload = null;
    window.onpopstate = null;
},
    
    openResultModal: function(examId) {
        const exam = this.studentExams.find(e => e.id === examId);
        const result = this.studentResults.find(r => r.examId === examId);
        
        if (!exam || !result) {
            this.showToast(this.translate('student.exams.noResult') || 'لا توجد نتيجة لهذا الاختبار', 'error');
            return;
        }
        
        this.openResultDetailsModal(result);
    },
    
    openResultDetailsModal: function(result) {
        const modalRoot = document.getElementById('resultModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const exam = this.studentExams.find(e => e.id === result.examId);
        if (!exam) {
            this.showToast(this.translate('student.exams.noResult') || 'لا توجد نتيجة لهذا الاختبار', 'error');
            return;
        }
        
        const totalPoints = exam.totalPoints || 100;
        const percentage = Math.round((result.score / totalPoints) * 100);
        
        modal.innerHTML = `
            <div class="modal-content-new result-modal" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-line"></i> ${this.translate('student.results.examResult') || 'نتيجة الاختبار'}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    ${this.generateResultModalContent(exam, result, percentage)}
                </div>
                
                <div class="modal-footer">
                    <div class="form-actions">
                        <button class="modal-btn close-result-btn grid-btn" id="close-result-btn">
                            <i class="fas fa-check"></i> ${this.translate('student.exams.ok') || 'موافق'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // إعداد حدث إغلاق المودال
        const closeBtn = modal.querySelector('.modal-close-unified');
        const okBtn = modal.querySelector('#close-result-btn');
        
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // تنظيف المودال القديم وإضافة الجديد
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
        
        // تشغيل الأنيميشنات بعد تحميل المحتوى
        setTimeout(() => {
            // تعيين المتغيرات CSS للأنيميشن
            const modalContent = modal.querySelector('.result-modal-container');
            const scoreCircle = modal.querySelector('.score-circle');
            const progressFill = modal.querySelector('.progress-fill');
            const progressMarker = modal.querySelector('.progress-marker');
            
            if (scoreCircle) {
                scoreCircle.style.setProperty('--percentage', `${percentage}%`);
                scoreCircle.dataset.percentage = percentage;
            }
            
            if (progressFill) {
                progressFill.style.setProperty('--percentage', `${percentage}%`);
            }
            
            if (progressMarker) {
                progressMarker.style.right = `${percentage}%`;
            }
            
            // تعيين لون النتيجة
            const scoreColor = percentage >= 50 ? 
                getComputedStyle(document.documentElement).getPropertyValue('--bg-text').trim() : '#e74c3c';
            
            if (modalContent) {
                modalContent.style.setProperty('--score-color', scoreColor);
            }
            
            // تشغيل أنيميشن العد التنازلي للدرجات
            const pointsEarned = modal.querySelector('.points-earned');
            if (pointsEarned) {
                const finalScore = result.score || 0;
                this.animateValue(pointsEarned, 0, finalScore, 1500);
            }
        }, 100);
    },

    showExamResult: function(exam, score) {
        const modalRoot = document.getElementById('examModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        // حساب النقاط الفعلية
        const totalPoints = exam.totalPoints || 100;
        const actualScore = Math.round((score / 100) * totalPoints);
        
        // إنشاء كائن نتيجة مؤقت لعرضه
        const tempResult = {
            examId: exam.id,
            score: actualScore,
            timestamp: Date.now(),
            studentId: this.currentUser.uid,
            studentName: this.studentData.name || this.studentData.email
        };
        
        // عرض نفس مودال النتيجة الذي يظهر في قسم النتائج
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-line"></i> ${this.translate('student.exams.examResult') || 'نتيجة الاختبار'}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    ${this.generateResultModalContent(exam, tempResult, score)}
                </div>
                
                <div class="modal-footer">
                    <div class="form-actions">
                        <button class="modal-btn close-result-btn grid-btn">
                            <i class="fas fa-check"></i> ${this.translate('student.exams.ok') || 'موافق'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        const okBtn = modal.querySelector('.close-result-btn');
        
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },

    generateResultModalContent: function(exam, result, percentage = null) {
        if (!percentage) {
            const totalPoints = exam.totalPoints || 100;
            percentage = Math.round((result.score / totalPoints) * 100);
        }
        
        const examName = this.getLocalizedText(exam.name);
        const date = this.formatDateTime(result.timestamp);
        const score = result.score || 0;
        const totalPoints = exam.totalPoints || 100;
        
        const subject = exam.subjectId && this.studentSubjects.find(s => s.id === exam.subjectId) ?
            this.getLocalizedText(this.studentSubjects.find(s => s.id === exam.subjectId).name) : 
            this.translate('student.exams.general') || 'عام';
        
        // إنشاء النجوم لنتيجة 100%
        const starsBurst = this.createStarBurst(percentage);
        
        return `
            <div class="result-modal-container" data-percentage="${percentage}">
                ${starsBurst}
                
                <!-- رأس النتيجة -->
                <div class="result-modal-header">
                    <div class="result-exam-title">
                        <h3><i class="fas fa-file-alt"></i> ${examName}</h3>
                        <span class="result-subject">${subject}</span>
                    </div>
                    <div class="result-date-badge">
                        <i class="fas fa-calendar"></i>
                        <span>${date}</span>
                    </div>
                </div>
                
                <!-- محتوى النتيجة الرئيسي -->
                <div class="result-modal-content">
                    <!-- النتيجة الرئيسية -->
                    <div class="result-main-score">
                        <div class="score-circle-container">
                            <div class="score-circle ${percentage >= 50 ? 'success' : 'fail'}" data-percentage="${percentage}">
                                <div class="score-percentage">${percentage}%</div>
                                <div class="score-label">${this.translate('student.results.score') || 'النتيجة'}</div>
                            </div>
                            <div class="score-details">
                                <div class="score-points">
                                    <span class="points-earned">${score}</span>
                                    <span class="points-separator">/</span>
                                    <span class="points-total">${totalPoints}</span>
                                    <span class="points-text">${this.translate('student.exams.points') || 'نقطة'}</span>
                                </div>
                                <div class="score-status ${percentage >= 50 ? 'passed' : 'failed'}">
                                    <i class="fas ${percentage >= 50 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    <span>${percentage >= 50 ? this.translate('student.results.passed') || 'ناجح' : this.translate('student.results.failed') || 'راسب'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- شريط التقدم -->
                        <div class="score-progress-container">
                            <div class="progress-labels">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                            <div class="progress-marker">
                                <div class="marker-dot"></div>
                                <div class="marker-value">${percentage}%</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- معلومات إضافية -->
                    <div class="result-additional-info">
                        <div class="info-grid">

                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-clock"></i> ${this.translate('student.exams.duration') || 'المدة'}</div>
                                    <div class="info-value">${exam.duration || 60} ${this.translate('student.exams.minutes') || 'دقيقة'}</div>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-question-circle"></i> ${this.translate('student.exams.questionsCount') || 'عدد الأسئلة'}</div>
                                    <div class="info-value">${exam.questions ? Object.keys(exam.questions).length : 0}</div>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"> <i class="fas fa-star"></i> ${this.translate('student.exams.totalPoints') || 'الدرجة الكلية'}</div>
                                    <div class="info-value">${totalPoints} ${this.translate('student.exams.points') || 'نقطة'}</div>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-chart-bar"></i> ${this.translate('student.results.percentage') || 'النسبة المئوية'}</div>
                                    <div class="info-value">${percentage}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- تقييم الأداء -->
                    <div class="result-performance">
                        <h4><i class="fas fa-tachometer-alt"></i> ${this.translate('student.results.performance') || 'تقييم الأداء'}</h4>
                        <div class="performance-feedback">
                            ${this.getPerformanceFeedback(percentage)}
                        </div>
                    </div>
                    
                    <!-- رسالة النتيجة -->
                    <div class="result-message-box">
                        <div class="message-icon ${percentage >= 50 ? 'success' : 'warning'}">
                            <i class="fas ${percentage >= 50 ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                        </div>
                        <div class="message-content">
                            <h4>${this.getResultMessage(percentage)}</h4>
                            <p>${this.translate('student.exams.resultSavedSuccess') || 'تم حفظ نتيجة الاختبار بنجاح'}</p>
                            <p class="result-hint">
                                <i class="fas fa-info-circle"></i>
                                ${this.translate('student.exams.viewDetailsFromResults') || 'يمكنك عرض التفاصيل الكاملة من قسم النتائج'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // دالة مساعدة لإنشاء النجوم عند 100%
    createStarBurst: function(percentage) {
        if (percentage !== 100) return '';
        
        let stars = '';
        for (let i = 0; i < 8; i++) {
            const size = Math.random() * 15 + 10;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const delay = Math.random() * 2;
            
            stars += `<div class="star" style="
                width: ${size}px;
                height: ${size}px;
                top: ${top}%;
                left: ${left}%;
                animation-delay: ${delay}s;
            "></div>`;
        }
        
        return `<div class="stars">${stars}</div>`;
    },
    
    // دالة لعد الدرجات بشكل متحرك
    animateValue: function(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },
    
    // دالة للحصول على رسالة التقييم
    getPerformanceFeedback: function(percentage) {
        if (percentage >= 90) {
            return `
                <div class="feedback excellent">
                    <div class="feedback-header">
                        <h5><i class="fas fa-crown"></i> ${this.translate('student.results.excellent') || 'ممتاز'}</h5>
                    </div>
                    <p>${this.translate('student.results.excellentMessage') || 'أداء استثنائي! احتفظ بهذا المستوى الرائع.'}</p>
                </div>
            `;
        } else if (percentage >= 75) {
            return `
                <div class="feedback very-good">
                    <div class="feedback-header">
                        <h5><i class="fas fa-star"></i> ${this.translate('student.results.veryGood') || 'جيد جداً'}</h5>
                    </div>
                    <p>${this.translate('student.results.veryGoodMessage') || 'أداء ممتاز، أنت على الطريق الصحيح.'}</p>
                </div>
            `;
        } else if (percentage >= 50) {
            return `
                <div class="feedback good">
                    <div class="feedback-header">
                        <h5><i class="fas fa-thumbs-up"></i> ${this.translate('student.results.good') || 'جيد'}</h5>
                    </div>
                    <p>${this.translate('student.results.goodMessage') || 'أداء مقبول، يمكنك التحسين أكثر بالمزيد من الممارسة.'}</p>
                </div>
            `;
        } else {
            return `
                <div class="feedback poor">
                    <div class="feedback-header">
                        <h5><i class="fas fa-lightbulb"></i> ${this.translate('student.results.needsImprovement') || 'يحتاج تحسين'}</h5>
                    </div>
                    <p>${this.translate('student.results.poorMessage') || 'راجع المادة جيداً وحاول مرة أخرى، ستصل إلى النجاح.'}</p>
                </div>
            `;
        }
    },
    
    // دالة للحصول على رسالة النتيجة
    getResultMessage: function(percentage) {
        if (percentage >= 90) {
            return this.translate('student.results.excellentResult') || 'نتيجة مذهلة! لقد تفوقت على التوقعات';
        } else if (percentage >= 75) {
            return this.translate('student.results.greatResult') || 'أداء رائع! أنت على الطريق الصحيح';
        } else if (percentage >= 50) {
            return this.translate('student.results.passedResult') || 'تهانينا! لقد نجحت في الاختبار';
        } else {
            return this.translate('student.results.failedResult') || 'تحتاج إلى المزيد من المذاكرة';
        }
    },

    openGroupModal: function(group) {
        const modalRoot = document.getElementById('groupModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const groupName = this.getLocalizedText(group.name);
        const groupDescription = this.getLocalizedText(group.description);
        const studentCount = group.students ? Object.keys(group.students).length : 0;
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> ${groupName}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="group-info">
                        <div class="info-item">
                            <div>
                                <strong><i class="fas fa-users"></i> ${this.translate('student.groups.studentsCount') || 'عدد الطلاب'}</strong>
                                <span>${studentCount} ${studentCount === 1 ? 
                                    (this.translate('student.groups.student') || 'طالب') : 
                                    (this.translate('student.groups.students') || 'طالب')}</span>
                            </div>
                        </div>
                        ${groupDescription ? `
                        <div class="info-item">
                            <div>
                                <strong> <i class="fas fa-align-left"></i> ${this.translate('student.groups.description') || 'الوصف'}</strong>
                                <p>${groupDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-actions">
                        <button class="modal-btn close-group-btn grid-btn">
                            <i class="fas fa-check"></i> ${this.translate('student.exams.ok') || 'موافق'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // إعداد أحداث الإغلاق
        const closeBtn = modal.querySelector('.modal-close-unified');
        const okBtn = modal.querySelector('.close-group-btn');
    
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                modalRoot.style.display = 'none';
            }, 300);
        };
    
        closeBtn.addEventListener('click', closeModal);
        okBtn.addEventListener('click', closeModal);
    
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    closeModal: function(modal, modalRoot) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
            
            if (modal.dataset.countdownInterval) {
                clearInterval(modal.dataset.countdownInterval);
            }
        }, 300);
    },
    
    // ==================== تحديث النصوص عند تغيير اللغة ====================
    updateTranslations: function() {
        // تحديث النصوص في العناصر الموجودة
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const text = this.translate(key);
            if (text && text !== key) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = text;
                } else {
                    el.textContent = text;
                }
            }
        });
        
        // تحديث النصوص الديناميكية
        this.updateStudentUI();
        if (this.currentActiveSection) {
            this.loadSectionContent(this.currentActiveSection);
        }
    },
    
    // ==================== تحميل بيانات الطالب ====================
    loadStudentData: function() {
        if (!this.currentUser) return;
        
        const userId = this.currentUser.uid;
        const userRef = ref(database, `users/${userId}`);
        
        onValue(userRef, (snapshot) => {
            this.studentData = snapshot.val();
            if (this.studentData) {
                this.updateStudentUI();
                this.loadStudentGroups();
            }
        }, (error) => {
            console.error('❌ خطأ في تحميل بيانات الطالب:', error);
            this.showToast(this.translate('student.loadError') || 'خطأ في تحميل البيانات', 'error');
        });
    },
    
    loadStudentGroups: function() {
        const groupsRef = ref(database, 'groups');
        
        onValue(groupsRef, (snapshot) => {
            const allGroups = snapshot.val() || {};
            this.studentGroups = [];
            this.subjectsContentHandler.studentGroups = [];
            
            Object.entries(allGroups).forEach(([groupId, group]) => {
                if (group.students && group.students[this.currentUser.uid]) {
                    this.studentGroups.push({
                        id: groupId,
                        ...group
                    });
                    this.subjectsContentHandler.studentGroups.push({
                        id: groupId,
                        ...group
                    });
                }
            });
            
            this.loadStudentSubjects();
        });
    },
    
    loadStudentSubjects: function(forceRefresh = false) {
        const cacheKey = 'subjects';
        const cacheTime = 5 * 60 * 1000; // 5 دقائق
        
        // التحقق من وجود بيانات مخزنة حديثاً
        if (!forceRefresh && 
            this.cache[cacheKey] && 
            this.cache.lastUpdated[cacheKey] && 
            (Date.now() - this.cache.lastUpdated[cacheKey]) < cacheTime) {
            
            console.log('📦 استخدام البيانات المخزنة للمواد');
            this.studentSubjects = this.cache[cacheKey];
            this.loadStudentLectures();
            return;
        }
        
        const subjectsRef = ref(database, 'subjects');
        
        onValue(subjectsRef, (snapshot) => {
            const allSubjects = snapshot.val() || {};
            this.studentSubjects = [];
            
            Object.entries(allSubjects).forEach(([subjectId, subject]) => {
                if (!subject.groups || Object.keys(subject.groups).length === 0) {
                    this.studentSubjects.push({
                        id: subjectId,
                        ...subject
                    });
                } else {
                    const hasAccess = this.studentGroups.some(group => 
                        subject.groups && subject.groups[group.id]
                    );
                    
                    if (hasAccess) {
                        this.studentSubjects.push({
                            id: subjectId,
                            ...subject
                        });
                    }
                }
            });
            
            // تخزين في الكاش
            this.cache[cacheKey] = this.studentSubjects;
            this.cache.lastUpdated[cacheKey] = Date.now();
            
            this.loadStudentLectures();
        });
    },

    loadStudentLectures: function() {
        const lecturesRef = ref(database, 'lectures');
        
        onValue(lecturesRef, (snapshot) => {
            const allLectures = snapshot.val() || {};
            this.studentLectures = [];
            const now = Date.now();
            
            Object.entries(allLectures).forEach(([lectureId, lecture]) => {
                if (lecture.date && lecture.date > now) {
                    if (!lecture.groups || Object.keys(lecture.groups).length === 0) {
                        this.studentLectures.push({
                            id: lectureId,
                            ...lecture
                        });
                    } else {
                        const hasAccess = this.studentGroups.some(group => 
                            lecture.groups && lecture.groups[group.id]
                        );
                        
                        if (hasAccess) {
                            this.studentLectures.push({
                                id: lectureId,
                                ...lecture
                            });
                        }
                    }
                }
            });
            
            this.studentLectures.sort((a, b) => a.date - b.date);
            this.loadStudentExams();
        });
    },
    
    loadStudentExams: function() {
        const examsRef = ref(database, 'exams');
        
        onValue(examsRef, (snapshot) => {
            const allExams = snapshot.val() || {};
            this.studentExams = [];
            
            Object.entries(allExams).forEach(([examId, exam]) => {
                if (exam.isPublished) {
                    if (!exam.groups || Object.keys(exam.groups).length === 0) {
                        this.studentExams.push({
                            id: examId,
                            ...exam
                        });
                    } else {
                        const hasAccess = this.studentGroups.some(group => 
                            exam.groups && exam.groups[group.id]
                        );
                        
                        if (hasAccess) {
                            this.studentExams.push({
                                id: examId,
                                ...exam
                            });
                        }
                    }
                }
            });
            
            this.loadStudentResults();
        });
    },
    
    loadStudentResults: function() {
        if (!this.currentUser) return;
        
        const userId = this.currentUser.uid;
        const resultsRef = ref(database, `examResults/${userId}`);
        
        onValue(resultsRef, (snapshot) => {
            const results = snapshot.val() || {};
            this.studentResults = Object.entries(results).map(([examId, result]) => ({
                examId,
                ...result
            }));
            
            this.updateBadges();
            this.updateStats();
            
            if (this.currentActiveSection === 'results-section') {
                this.renderResultsGrid();
            }
        });
    },
    
    updateStudentUI: function() {
        const studentName = document.getElementById('student-name-display');
        if (studentName && this.studentData) {
            const name = this.studentData.name || this.studentData.email;
            studentName.textContent = name;
            
            // تحديث رسالة الترحيب الافتراضية
            const welcomeTitle = document.querySelector('.result-placeholder h3');
            if (welcomeTitle) {
                welcomeTitle.textContent = `مرحباً ${name}`;
            }
        }
        
        // تحديث عنوان الصفحة
        document.title = this.translate('student.title') || 'لوحة الطالب - نظام إدارة الدروس';
    },
    
    // ==================== إعداد الأحداث ====================
    setupEventListeners: function() {
    const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            // إزالة أي event listeners سابقين لمنع التكرار
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            
            // الحصول على الزر الجديد
            const newLogoutBtn = document.getElementById('logout-btn');
            
            // إضافة event listener واحد فقط
            newLogoutBtn.addEventListener('click', async (e) => {
                // منع السلوك الافتراضي
                e.preventDefault();
                
                // عرض رسالة تأكيد مرة واحدة فقط
                const confirmMessage = this.translate('logout.confirm') || 'هل أنت متأكد من تسجيل الخروج؟';
                
                if (confirm(confirmMessage)) {
                    try {
                        // تسجيل الخروج
                        await auth.signOut();
                        // إعادة التوجيه بعد 500ms للتأكد من اكتمال تسجيل الخروج
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 500);
                    } catch (error) {
                        console.error('❌ خطأ في تسجيل الخروج:', error);
                        this.showToast(this.translate('logout.error') || 'حدث خطأ في تسجيل الخروج', 'error');
                    }
                } else {
                    // المستخدم اختار الإلغاء - لا تفعل شيئاً
                    console.log('تم إلغاء تسجيل الخروج');
                    // إرجاع التركيز للزر
                    newLogoutBtn.blur();
                }
            });
        }
        
        const homeBtn = document.getElementById('toggle-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // استماع لتغيير اللغة
        document.addEventListener('languageChanged', (event) => {
            this.updateTranslations();
        });
        
        // استماع لتغيير الثيم
        document.addEventListener('themeChanged', (event) => {
            console.log('🎨 الثيم تغير:', event.detail.theme);
        });
        
        const languageToggle = document.getElementById('language-toggle');
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                if (window.i18n && window.i18n.toggleLanguage) {
                    window.i18n.toggleLanguage();
                }
            });
        }
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                if (window.themeSystem && window.themeSystem.toggleTheme) {
                    window.themeSystem.toggleTheme();
                }
            });
        }
    },
    
    // ==================== تهيئة النظام ====================
    init: function() {
        console.log('🎓 تهيئة لوحة الطالب المتكاملة مع الشات...');
    
        this.currentUser = auth.currentUser;
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
    
            // تحميل بيانات المستخدمين أولاً
            this.loadUsersData().then(() => {
            this.loadStudentData();
            this.setupEventListeners();
            this.initStudentSections();
        
            // التحقق من وجود اختبار نشط
            this.checkActiveExamSession();
        
            setTimeout(() => {
                this.updateTranslations();
            }, 500);
        });
    },

    // التحقق من وجود اختبار نشط وعرض تحذير
    checkActiveExamSession: function() {
        if (this.hasActiveExamSession()) {
            const session = this.loadExamSession();
            const exam = this.studentExams.find(e => e.id === session.examId);
        
            if (exam) {
                setTimeout(() => {
                    if (confirm(this.translate('student.exams.activeSession') || 'لديك اختبار نشط لم يكتمل. هل تريد الاستمرار؟')) {
                        this.openTakeExamModal(exam);
                    } else {
                        // إذا اختار المستخدم عدم الاستمرار، نحذف الجلسة
                        this.clearExamSession();
                    }
                }, 1000);
            }
        }
    }
};

// ==================== تهيئة الصفحة عند التحميل ====================
document.addEventListener('DOMContentLoaded', function() {
    const checkFirebase = setInterval(() => {
        if (auth && database) {
            clearInterval(checkFirebase);
            
            auth.onAuthStateChanged((user) => {
                if (user) {
                    const userRef = ref(database, `users/${user.uid}`);
                    get(userRef).then((snapshot) => {
                        const userData = snapshot.val();
                        if (userData && userData.role === 'student') {
                            window.studentApp = studentApp;
                            studentApp.init();
                        } else {
                            if (userData && userData.role === 'admin') {
                                window.location.href = 'admin.html';
                            } else {
                                window.location.href = 'index.html';
                            }
                        }
                    });
                } else {
                    window.location.href = 'index.html';
                }
            });
        }
    }, 100);
});

// جعل الدوال متاحة عالمياً
window.studentApp = studentApp;