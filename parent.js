
// ==================== استيراد Firebase Functions ====================
import { auth, database } from "./app.js";
import { ref, onValue, get, push, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== إعدادات Cloudinary ====================
const CLOUDINARY_CONFIG = {
    cloudName: 'dwgelhfe8',
    uploadPreset: 'ml_default',
    uploadUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/upload'
};

// ==================== التطبيق الرئيسي لولي الأمر ====================
const parentApp = {
    currentUser: null,
    parentData: null,
    linkedStudent: null,
    assignedStudentIds: [],
    studentsData: {},
    groupsData: {},
    subjectsData: {},
    lecturesData: {},
    resultsData: {},
    examsData: {},
    attendanceData: {},
    lecturesAttendance: {},
    currentActiveSection: null,

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
    
    // ==================== دوال مساعدة ====================
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

    // تحميل بيانات الاختبارات
    loadExamsData: function() {
        const examsRef = ref(database, 'exams');
    
        onValue(examsRef, (snapshot) => {
            this.examsData = snapshot.val() || {};
            console.log('✅ تم تحميل بيانات', Object.keys(this.examsData).length, 'اختبار');
        });
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
        if (window.i18n && window.i18n.getTranslatedText) {
            return window.i18n.getTranslatedText(key);
        }
        return key;
    },
    
    getRemainingTime: function(targetTimestamp) {
        const now = Date.now();
        const diff = targetTimestamp - now;
        
        if (diff <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, status: 'منتهي' };
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        let status = 'قادم';
        if (days === 0 && hours < 24) status = 'قريباً';
        if (days === 0 && hours < 1) status = 'يبدأ قريباً';
        
        return { days, hours, minutes, seconds, status };
    },
    
    // ==================== إدارة الحالة والتحديثات ====================
    updateBadges: function() {
        const lecturesBadge = document.getElementById('lectures-badge');
        const resultsBadge = document.getElementById('results-badge');
        const groupsBadge = document.getElementById('groups-badge');
        const subjectsBadge = document.getElementById('subjects-badge');
        const attendanceBadge = document.getElementById('attendance-badge');
        
        if (lecturesBadge) lecturesBadge.textContent = Object.keys(this.lecturesData).length;
        if (resultsBadge) resultsBadge.textContent = this.getTotalResultsCount();
        if (groupsBadge) groupsBadge.textContent = Object.keys(this.groupsData).length;
        if (subjectsBadge) subjectsBadge.textContent = Object.keys(this.subjectsData).length;
        if (attendanceBadge) {
            // حساب إجمالي سجلات الحضور
            let totalAttendanceRecords = 0;
            Object.values(this.attendanceData).forEach(records => {
                totalAttendanceRecords += records.length;
            });
            attendanceBadge.textContent = totalAttendanceRecords;
        }
    },
    
    getTotalResultsCount: function() {
        let total = 0;
        Object.values(this.resultsData).forEach(studentResults => {
            total += Object.keys(studentResults || {}).length;
        });
        return total;
    },
    
    // ==================== قسم المواد الدراسية ====================
    subjectsContentHandler: {
        currentSubjectId: null,
        currentSubjectName: null,
        currentSubjectIcon: null,
        currentContentType: 'pdfs',
        currentData: {},
        
        init: function() {
            this.setupContentTabs();
        },
        
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
        
        switchContentType: function(type) {
            this.currentContentType = type;
            
            document.querySelectorAll('.content-type-tab').forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.type === type) {
                    tab.classList.add('active');
                }
            });
            
            document.querySelectorAll('.content-tab-panel').forEach(panel => {
                panel.classList.remove('active');
                panel.style.display = 'none';
            });
            
            const activePanel = document.getElementById(`${type}-panel`);
            if (activePanel) {
                activePanel.classList.add('active');
                activePanel.style.display = 'block';
            }
            
            if (this.currentSubjectId) {
                this.loadSubjectContent(this.currentSubjectId, type);
            }
        },
        
        renderSubjectsButtons: function() {
            const container = document.getElementById('subjects-buttons-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            const subjectsArray = Object.entries(parentApp.subjectsData);
            
            if (subjectsArray.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-book"></i>
                        <span data-i18n="parent.subjects.noSubjects">${parentApp.translate('parent.subjects.noSubjects') || 'لا توجد مواد دراسية متاحة'}</span>
                    </div>
                `;
                return;
            }
            
            subjectsArray.forEach(([subjectId, subject]) => {
                const button = this.createSubjectButton(subjectId, subject);
                if (button) {
                    container.appendChild(button);
                }
            });
        },
        
        createSubjectButton: function(subjectId, subject) {
            const subjectName = parentApp.getLocalizedText(subject.name);
            const button = document.createElement('button');
            button.className = 'subject-tab-btn';
            button.innerHTML = `
                <i class="${subject.icon || 'fas fa-book'}"></i>
                <span>${subjectName || 'بدون اسم'}</span>
            `;
            button.dataset.subjectId = subjectId;
            button.dataset.subjectName = subjectName;
            button.dataset.subjectIcon = subject.icon;
            
            button.addEventListener('click', () => {
                document.querySelectorAll('.subject-tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                this.currentSubjectId = subjectId;
                this.currentSubjectName = subjectName;
                this.currentSubjectIcon = subject.icon;
                
                this.showContentTypes();
                this.loadSubjectContent(subjectId, 'pdfs');
            });
            
            return button;
        },
        
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

            this.switchContentType('pdfs');
        },
        
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
                    <span data-i18n="parent.content.loading">${parentApp.translate('parent.content.loading') || 'جاري تحميل المحتوى...'}</span>
                </div>
            `;
            
            const contentRef = ref(database, `subjectsContent/${subjectId}/${type}`);
            
            onValue(contentRef, (snapshot) => {
                const items = snapshot.val() || {};
                this.currentData[type] = items;
                this.renderContentItems(items, type);
            });
        },
        
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
                const typeName = typeNames[type] || 'بيانات';
                
                gridContainer.innerHTML = `
                    <div class="no-data">
                        <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                        <span data-i18n="parent.content.noData">${parentApp.translate('parent.content.noData') || `لا توجد ${typeName} بعد`}</span>
                    </div>
                `;
                return;
            }
            
            Object.entries(items).forEach(([key, item]) => {
                const card = this.createContentCard(key, item, type);
                if (card) {
                    gridContainer.appendChild(card);
                }
            });
        },
        
        createContentCard: function(key, item, type) {
            const card = document.createElement('div');
            card.className = `content-card-new`;
            card.dataset.id = key;
            card.dataset.type = type;
        
            let title = item.name || item.fileName || 'بدون اسم';
            const iconClass = type === 'pdfs' ? 'fa-file-pdf' : type === 'images' ? 'fa-image' : 'fa-volume-up';
            let contentBody = '';
        
            if (type === 'images' && item.url) {
                contentBody = `
                    <div class="image-preview-container">
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
        
            card.innerHTML = `
                <div class="content-card-header">
                   
                </div>
            
                <div class="content-card-body">
                    ${contentBody}
                </div>
            
                <div class="content-card-footer">
                    <div>
                        <div class="content-card-title">${title}</div>
                        ${item.size ? `<div class="content-card-size">${parentApp.formatFileSize(item.size)}</div>` : ''}
                    </div>
                </div>
            `;
        
            card.onclick = () => {
                this.openContentItemModal(key, item, type);
            };
        
            return card;
        },
        
        openContentItemModal: function(key, item, type) {
            const modalRoot = document.getElementById('contentModalRoot');
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
                            <i class="fas fa-download"></i> ${parentApp.translate('parent.content.download') || 'تحميل الملف'}
                        </button>
                    </div>
                </div>
            `;
    
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
            
                    parentApp.showToast(parentApp.translate('parent.content.downloadStarted') || `تم بدء تحميل ${typeName.ar}`, 'success');
                });
            } else if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + (parentApp.translate('parent.content.noDownloadLink') || 'لا يوجد رابط للتحميل');
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
                                ${item.size ? `<span style="margin-left: 15px;">الحجم: ${parentApp.formatFileSize(item.size)}</span>` : ''}
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
                                    ${parentApp.translate('parent.content.audioNotSupported') || 'متصفحك لا يدعم تشغيل الصوتيات.'}
                                </audio>
                            </div>
                            <div class="audio-info" style="margin-top: 15px; color: var(--bg-text); opacity: 0.8; font-size: 0.9rem;">
                                ${item.duration ? `<span>المدة: ${this.formatDuration(item.duration)}</span>` : ''}
                                ${item.size ? `<span style="margin-left: 15px;">الحجم: ${parentApp.formatFileSize(item.size)}</span>` : ''}
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
                                        ${item.size ? `حجم الملف: ${parentApp.formatFileSize(item.size)}` : ''}
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
                            ${item.size ? `<p>الحجم: ${parentApp.formatFileSize(item.size)}</p>` : ''}
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
    initParentSections: function() {
        const sectionCards = document.querySelectorAll('.section-card');
        const resultContainer = document.getElementById('parent-result-container');
        const dynamicContent = document.getElementById('dynamic-section-content');
        const placeholder = resultContainer ? resultContainer.querySelector('.result-placeholder') : null;

        sectionCards.forEach(card => {
            card.classList.remove('active');
        });

        if (placeholder) {
            placeholder.classList.add('active');
            placeholder.style.display = 'block';
        }

        if (dynamicContent) {
            dynamicContent.style.display = 'none';
        }

        sectionCards.forEach(card => {
            card.addEventListener('click', () => {
                const sectionId = card.dataset.section;
                
                if (this.currentActiveSection === sectionId) return;
                
                sectionCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentActiveSection = sectionId;
                
                if (placeholder) {
                    placeholder.classList.remove('active');
                    placeholder.style.display = 'none';
                }
                
                if (dynamicContent) {
                    dynamicContent.style.display = 'block';
                }
                
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
            case 'lectures-section':
                sectionHTML = this.getLecturesSectionHTML();
                break;
            case 'results-section':
                sectionHTML = this.getResultsSectionHTML();
                break;
            case 'groups-section':
                sectionHTML = this.getGroupsSectionHTML();
                break;
            case 'subjects-section':
                sectionHTML = this.getSubjectsSectionHTML();
                break;
            case 'attendance-section':
                sectionHTML = this.getAttendanceSectionHTML();
                break;
            case 'chat-section':
                sectionHTML = this.getChatSectionHTML();
                break;
        }
        
        dynamicContent.innerHTML = sectionHTML;
        
        setTimeout(() => {
            switch(sectionId) {
                case 'lectures-section':
                    this.renderLecturesSection();
                    break;
                case 'results-section':
                    this.renderResultsSection();
                    break;
                case 'groups-section':
                    this.renderGroupsSection();
                    break;
                case 'subjects-section':
                    this.subjectsContentHandler.init();
                    this.subjectsContentHandler.renderSubjectsButtons();
                    break;
                case 'attendance-section':
                    this.renderAttendanceSection();
                    break;
                case 'chat-section':
                    this.initChatSection();
                    break;
            }
        }, 100);
    },
    
    // ==================== دوال بناء HTML للأقسام ====================
    getLecturesSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-chalkboard-teacher"></i>
                <span data-i18n="parent.lectures.title">${this.translate('parent.lectures.title') || 'محاضرات الطلاب القادمة'}</span>
            </div>
            
            <div class="section-content">
                <div class="data-grid" id="lectures-grid">
                    <div class="no-data">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span data-i18n="parent.lectures.loading">${this.translate('parent.lectures.loading') || 'جاري تحميل المحاضرات القادمة...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getResultsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-chart-line"></i>
                <span data-i18n="parent.results.title">${this.translate('parent.results.title') || 'نتائج الطلاب'}</span>
            </div>
            
            <div class="section-content">
                <div class="results-stats">
                    <div class="stat-card">
                        <i class="fas fa-trophy"></i>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="parent.results.average">${this.translate('parent.results.average') || 'المعدل العام'}</span>
                            <span class="stat-value" id="average-score">${this.calculateOverallAverage()}%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-file-alt"></i>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="parent.results.totalExams">${this.translate('parent.results.totalExams') || 'عدد الاختبارات'}</span>
                            <span class="stat-value" id="total-exams">${this.getTotalResultsCount()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="data-grid" id="results-grid">
                    <div class="no-data">
                        <i class="fas fa-chart-line"></i>
                        <span data-i18n="parent.results.loading">${this.translate('parent.results.loading') || 'جاري تحميل النتائج...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getGroupsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-users"></i>
                <span data-i18n="parent.groups.title">${this.translate('parent.groups.title') || 'مجموعات الطلاب'}</span>
            </div>
            
            <div class="section-content">
                <div class="data-grid" id="groups-grid">
                    <div class="no-data">
                        <i class="fas fa-users"></i>
                        <span data-i18n="parent.groups.loading">${this.translate('parent.groups.loading') || 'جاري تحميل المجموعات...'}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getSubjectsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-book"></i>
                <span data-i18n="parent.subjects.title">${this.translate('parent.subjects.title') || 'مواد الطلاب الدراسية'}</span>
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
                    <h3 data-i18n="parent.content.selectSubject">${this.translate('parent.content.selectSubject') || 'اختر مادة دراسية'}</h3>
                    <p data-i18n="parent.content.selectSubjectMessage">${this.translate('parent.content.selectSubjectMessage') || 'من القائمة أعلاه لعرض المحتوى الخاص بها'}</p>
                </div>
                
                <!-- تبويبات أنواع المحتوى (تظهر بعد اختيار مادة) -->
                <div class="content-type-tabs" id="content-type-tabs" style="display: none;">
                    <button class="content-type-tab active" data-type="pdfs">
                        <i class="fas fa-file-pdf"></i>
                        <span data-i18n="parent.content.pdf">${this.translate('parent.content.pdf') || 'PDF'}</span>
                    </button>
                    <button class="content-type-tab" data-type="images">
                        <i class="fas fa-image"></i>
                        <span data-i18n="parent.content.images">${this.translate('parent.content.images') || 'صور'}</span>
                    </button>
                    <button class="content-type-tab" data-type="audios">
                        <i class="fas fa-volume-up"></i>
                        <span data-i18n="parent.content.audio">${this.translate('parent.content.audio') || 'صوت'}</span>
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
    
    getChatSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-comments"></i>
                <span data-i18n="parent.tabs.chat">${this.translate('parent.tabs.chat') || 'الشات العام'}</span>
            </div>
            
            <div class="section-content">
                <div class="parent-chat-container">
                    <!-- منطقة الرسائل -->
                    <div class="chat-messages-parent" id="chat-messages-parent">
                        <div class="chat-loading">
                            <div class="spinner"></div>
                            <p data-i18n="parent.chat.loading">${this.translate('parent.chat.loading') || 'جاري تحميل الرسائل...'}</p>
                        </div>
                    </div>
                    
                    <!-- منطقة الإرسال -->
                    <div class="chat-input-parent">
                        <!-- معاينة الملف -->
                        <div class="file-preview-container" id="file-preview-container" style="display: none;">
                            <div class="file-preview-header">
                                <span id="file-preview-title" data-i18n="parent.chat.filePreview">${this.translate('parent.chat.filePreview') || 'معاينة الملف'}</span>
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
                                <span class="recording-text" data-i18n="parent.chat.recording">${this.translate('parent.chat.recording') || 'جاري التسجيل...'}</span>
                                <span class="recording-timer" id="recording-timer">00:00</span>
                            </div>
                            <div class="recording-actions">
                                <button id="send-recording-btn" class="recording-action-btn success">
                                    <i class="fas fa-check"></i> ${this.translate('parent.chat.send') || 'إرسال'}
                                </button>
                                <button id="cancel-recording-btn" class="recording-action-btn danger">
                                    <i class="fas fa-times"></i> ${this.translate('parent.chat.cancel') || 'إلغاء'}
                                </button>
                            </div>
                        </div>
                        
                        <!-- حاوية الإدخال -->
                        <div class="message-input-container">
                            <textarea 
                                id="parent-chat-input" 
                                class="parent-chat-input" 
                                placeholder="${this.translate('parent.chat.inputPlaceholder') || 'اكتب رسالتك هنا...'}" 
                                rows="1"
                            ></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==================== دوال العرض ====================
    renderLecturesSection: function() {
        const container = document.getElementById('lectures-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const lecturesArray = Object.entries(this.lecturesData);
        
        if (lecturesArray.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span data-i18n="parent.lectures.noData">${this.translate('parent.lectures.noData') || 'لا توجد محاضرات قادمة للطلاب'}</span>
                </div>
            `;
            return;
        }
        
        lecturesArray.forEach(([lectureId, lecture]) => {
            const card = this.createLectureCard(lectureId, lecture);
            container.appendChild(card);
        });
    },
    
    createLectureCard: function(lectureId, lecture) {
        const card = document.createElement('div');
        card.className = 'data-card lecture-card';
        card.dataset.id = lectureId;
        
        const lectureTitle = this.getLocalizedText(lecture.title);
        const displayTitle = lectureTitle || this.translate('parent.lectures.noTitle') || 'بدون عنوان';
        const timeInfo = this.getRemainingTime(lecture.date);
        
        let badgeText = '';
        if (timeInfo.days > 0) {
            badgeText = `${timeInfo.days} ${this.translate('parent.lectures.days') || 'أيام'}`;
        } else if (timeInfo.hours > 0) {
            badgeText = `${timeInfo.hours} ${this.translate('parent.lectures.hours') || 'ساعات'}`;
        } else {
            badgeText = `${timeInfo.minutes} ${this.translate('parent.lectures.minutes') || 'دقائق'}`;
        }
        
        card.innerHTML = `
            <div class="lecture-time-badge ${timeInfo.days === 0 ? 'soon' : ''}">
                <i class="fas fa-clock"></i>
                <span>${badgeText}</span>
            </div>
            <i class="fas fa-chalkboard-teacher"></i>
            <h4>${displayTitle.length > 25 ? displayTitle.substring(0, 25) + '...' : displayTitle}</h4>
        `;
        
        card.addEventListener('click', () => this.openLectureModal(lectureId, lecture));
        
        return card;
    },
    
    renderResultsSection: function() {
        const container = document.getElementById('results-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (Object.keys(this.resultsData).length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chart-line"></i>
                    <span data-i18n="parent.results.noData">${this.translate('parent.results.noData') || 'لا توجد نتائج للطلاب بعد'}</span>
                </div>
            `;
            return;
        }
        
        // عرض نتائج جميع الطلاب
        Object.entries(this.resultsData).forEach(([studentId, studentResults]) => {
            const student = this.studentsData[studentId];
            if (!student || !studentResults) return;
            
            Object.entries(studentResults).forEach(([examId, result]) => {
                const card = this.createResultCard(studentId, student, examId, result);
                container.appendChild(card);
            });
        });
    },
    
    
    createResultCard: function(studentId, student, examId, result) {
        const card = document.createElement('div');
        card.className = 'data-card result-card';
    
        const studentName = student.name || student.email || this.translate('parent.student.unknown') || 'طالب غير معروف';
        const date = this.formatDate(result.timestamp);
        const score = result.score || 0;
    
        const exam = this.examsData[examId];
        let examName = this.translate('parent.exams.unknown') || 'اختبار غير معروف';
    
        if (exam && exam.name) {
            examName = this.getLocalizedText(exam.name);
        } else if (result.examName) {
            examName = result.examName;
        }
    
        const totalPoints = exam ? (exam.totalPoints || 100) : 100;
        const percentage = Math.round((score / totalPoints) * 100);
    
        let displayName = `${studentName} - ${examName}`;
        if (displayName.length > 25) {
            displayName = displayName.substring(0, 25) + '...';
        }
    
        card.innerHTML = `
            <div class="result-score ${percentage >= 50 ? 'good' : 'bad'}">
                ${percentage}%
            </div>
            <i class="fas fa-chart-line"></i>
            <h4>${displayName}</h4>
            <div class="result-date">${date}</div>
            <small>${score}/${totalPoints} ${this.translate('parent.results.points') || 'درجة'}</small>
        `;
    
        card.addEventListener('click', () => this.openResultDetailsModal(studentId, student, examId, result));
    
        return card;
    },

    renderGroupsSection: function() {
        const container = document.getElementById('groups-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const groupsArray = Object.entries(this.groupsData);
        
        if (groupsArray.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-users"></i>
                    <span data-i18n="parent.groups.noData">${this.translate('parent.groups.noData') || 'لا توجد مجموعات للطلاب'}</span>
                </div>
            `;
            return;
        }
        
        groupsArray.forEach(([groupId, group]) => {
            const card = this.createGroupCard(groupId, group);
            container.appendChild(card);
        });
    },
    
    createGroupCard: function(groupId, group) {
        const card = document.createElement('div');
        card.className = 'data-card group-card';
        
        const groupName = this.getLocalizedText(group.name);
        const studentCount = group.students ? Object.keys(group.students).length : 0;
        const myStudentsInGroup = this.assignedStudentIds.filter(id => group.students && group.students[id]).length;
        
        let displayName = groupName || this.translate('parent.groups.noName') || 'بدون اسم';
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        
        card.innerHTML = `
            <div class="group-count">
                ${myStudentsInGroup}
            </div>
            <i class="fas fa-users"></i>
            <h4>${displayName}</h4>
            <div class="group-stats">
                <span class="group-stat">
                    <i class="fas fa-user-graduate"></i>
                    ${myStudentsInGroup} ${this.translate('parent.groups.studentsCount') || 'من طلابك'}
                </span>
            </div>
        `;
        
        card.addEventListener('click', () => this.openGroupModal(groupId, group));
        
        return card;
    },
    
    // ==================== دوال الحسابات ====================
    calculateStudentAverageScore: function(studentId) {
        const studentResults = this.resultsData[studentId];
        if (!studentResults || Object.keys(studentResults).length === 0) {
            return 0;
        }
        
        let totalScore = 0;
        let count = 0;
        
        Object.values(studentResults).forEach(result => {
            totalScore += result.score || 0;
            count++;
        });
        
        return count > 0 ? Math.round(totalScore / count) : 0;
    },
    
    calculateOverallAverage: function() {
        let totalScore = 0;
        let totalCount = 0;
        
        this.assignedStudentIds.forEach(studentId => {
            const studentResults = this.resultsData[studentId];
            if (studentResults) {
                Object.values(studentResults).forEach(result => {
                    totalScore += result.score || 0;
                    totalCount++;
                });
            }
        });
        
        return totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
    },
    
    countStudentGroups: function(studentId) {
        let count = 0;
        Object.values(this.groupsData).forEach(group => {
            if (group.students && group.students[studentId]) {
                count++;
            }
        });
        return count;
    },
    
    countStudentSubjects: function(studentId) {
        let count = 0;
        Object.values(this.subjectsData).forEach(subject => {
            if (subject.groups) {
                Object.values(this.groupsData).forEach(group => {
                    if (group.students && group.students[studentId] && subject.groups[Object.keys(this.groupsData)[0]]) {
                        count++;
                    }
                });
            }
        });
        return count;
    },
    
    // ==================== قسم الشات المتكامل ====================
    initChatSection: function() {
        console.log('💬 تهيئة قسم الشات لولي الأمر');
        this.loadParentMessages();
        this.createChatInputTools();
        this.setupChatEventListeners();
    },
    
    loadParentMessages: function() {
        const messagesRef = ref(database, 'globalChat');
        
        onValue(messagesRef, (snapshot) => {
            this.chatData = snapshot.val() || {};
            this.renderParentMessages(this.chatData);
        }, (error) => {
            console.error('❌ خطأ في تحميل الرسائل:', error);
            this.showToast(this.translate('parent.chat.loadError') || 'خطأ في تحميل الرسائل', 'error');
        });
    },
    
    renderParentMessages: function(messages) {
        const container = document.getElementById('chat-messages-parent');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!messages || Object.keys(messages).length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-comments"></i>
                    <h3 data-i18n="parent.chat.noMessages">${this.translate('parent.chat.noMessages') || 'لا توجد رسائل بعد'}</h3>
                    <p data-i18n="parent.chat.beFirst">${this.translate('parent.chat.beFirst') || 'كن أول من يبدأ المحادثة!'}</p>
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
        
        let userName = this.translate('parent.chat.unknownUser') || 'مستخدم غير معروف';
        if (user) {
            userName = user.name || user.email || userName;
        }

        if (isCurrentUser) {
            userName = `${userName} (${this.translate('parent.chat.you') || 'أنت'})`;
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
        messageDiv.className = `message-parent ${isCurrentUser ? 'current-user' : 'other-user'}`;
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
                        <span class="voice-duration">${msg.voiceDuration || 0} ${this.translate('parent.chat.seconds') || 'ثانية'}</span>
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
                            <div class="file-name">${msg.fileName || this.translate('parent.chat.file') || 'ملف'}</div>
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
                        <img src="${msg.imageUrl}" alt="${this.translate('parent.chat.image') || 'صورة'}" class="chat-image">
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
            <button id="voice-record-btn" class="tool-btn voice-btn" title="${this.translate('parent.chat.recordVoice') || 'تسجيل رسالة صوتية'}">
                <i class="fas fa-microphone"></i>
            </button>
            <button id="attach-file-btn" class="tool-btn" title="${this.translate('parent.chat.attachFile') || 'إرفاق ملف'}">
                <i class="fas fa-paperclip"></i>
            </button>
            <button id="attach-image-btn" class="tool-btn" title="${this.translate('parent.chat.attachImage') || 'إرفاق صورة'}">
                <i class="fas fa-image"></i>
            </button>
        `;
        
        const leftTools = document.createElement('div');
        leftTools.className = 'input-tools left';
        leftTools.innerHTML = `
            <button id="send-message-btn" class="send-message-btn" title="${this.translate('parent.chat.send') || 'إرسال'}">
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
        
        const input = document.getElementById('parent-chat-input');
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
                    voiceBtn.title = this.translate('parent.chat.stopRecording') || 'إيقاف التسجيل';
                } else {
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceBtn.style.background = '';
                    voiceBtn.title = this.translate('parent.chat.recordVoice') || 'تسجيل رسالة صوتية';
                }
            }
        }, 100);
    },
    
    handleFileUpload: function(file, type) {
        if (!file) return;
        
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showToast(this.translate('parent.chat.fileTooLarge') || 'حجم الملف كبير جداً (الحد الأقصى 10MB)', 'error');
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
                        <img src="${e.target.result}" alt="${this.translate('parent.chat.imagePreview') || 'معاينة الصورة'}">
                    </div>
                    <div class="file-info-preview">
                        <div class="file-name-preview">${file.name}</div>
                        <div class="file-details-preview">
                            <span><i class="fas fa-image"></i> ${this.translate('parent.chat.image') || 'صورة'}</span>
                            <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                        </div>
                    </div>
                `;
                previewBody.innerHTML = previewHTML;
            };
            reader.readAsDataURL(file);
            previewTitle.textContent = this.translate('parent.chat.imagePreview') || 'معاينة الصورة';
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
                                    <span><i class="fas fa-file-audio"></i> ${this.translate('parent.chat.audioFile') || 'ملف صوتي'}</span>
                                    <span><i class="fas fa-clock"></i> ${duration} ${this.translate('parent.chat.seconds') || 'ثانية'}</span>
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
            previewTitle.textContent = this.translate('parent.chat.filePreview') || 'معاينة الملف';
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
            this.showToast(this.translate('parent.chat.loginRequired') || 'يجب تسجيل الدخول لإرسال الرسائل', 'error');
            return;
        }
        
        if (this.currentFile) {
            this.showToast(this.translate('parent.chat.uploadingFile') || 'جاري رفع الملف...', 'info');
            
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
                    
                    this.showToast(this.translate('parent.chat.fileSent') || 'تم إرسال الملف بنجاح', 'success');
                    this.clearFilePreview();
                    input.value = '';
                    input.style.height = 'auto';
                }
                
            } catch (error) {
                console.error('❌ خطأ في رفع الملف:', error);
                this.showToast(`${this.translate('parent.chat.uploadError') || 'خطأ في رفع الملف'}: ${error.message}`, 'error');
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
                
                this.showToast(this.translate('parent.chat.messageSent') || 'تم إرسال الرسالة', 'success');
            } catch (error) {
                console.error('❌ خطأ في إرسال الرسالة:', error);
                this.showToast(this.translate('parent.chat.sendError') || 'خطأ في إرسال الرسالة', 'error');
            }
        } else {
            this.showToast(this.translate('parent.chat.writeMessage') || 'اكتب رسالة أو أرفق ملفًا', 'warning');
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
                throw new Error(`${this.translate('parent.chat.uploadFailed') || 'فشل رفع الملف'}: ${response.status} - ${errorText}`);
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
                throw new Error(this.translate('parent.chat.recordingNotSupported') || 'المتصفح لا يدعم التسجيل الصوتي');
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
            this.showToast(`${this.translate('parent.chat.microphoneError') || 'تعذر الوصول إلى الميكروفون'}: ${error.message}`, 'error');
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
            
            this.showToast(this.translate('parent.chat.uploadingVoice') || 'جاري رفع الرسالة الصوتية...', 'info');
            
            try {
                const voiceUrl = await this.uploadToCloudinary(audioFile, 'video');
                
                if (voiceUrl) {
                    await this.saveVoiceMessage(voiceUrl, this.recordingTime);
                }
            } catch (error) {
                console.error('❌ خطأ في رفع الرسالة الصوتية:', error);
                this.showToast(`${this.translate('parent.chat.voiceUploadFailed') || 'فشل رفع الرسالة الصوتية'}: ${error.message}`, 'error');
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
            
            this.showToast(this.translate('parent.chat.voiceSent') || 'تم إرسال الرسالة الصوتية بنجاح', 'success');
        } catch (error) {
            console.error('❌ خطأ في حفظ الرسالة الصوتية:', error);
            this.showToast(this.translate('parent.chat.voiceSendError') || 'خطأ في إرسال الرسالة الصوتية', 'error');
        }
    },
    
    showRecordingUI: function() {
        const container = document.getElementById('recording-container');
        const input = document.getElementById('parent-chat-input');
        
        if (container) container.style.display = 'block';
        if (input) input.style.display = 'none';
    },
    
    hideRecordingUI: function() {
        const container = document.getElementById('recording-container');
        const input = document.getElementById('parent-chat-input');
        
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
            this.showToast(this.translate('parent.chat.playbackError') || 'تعذر تشغيل الرسالة الصوتية', 'error');
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
        if (!fileType) return this.translate('parent.chat.file') || 'ملف';
        
        if (fileType.includes('image')) return this.translate('parent.chat.image') || 'صورة';
        if (fileType.includes('pdf')) return 'PDF';
        if (fileType.includes('word') || fileType.includes('doc')) return 'Word';
        if (fileType.includes('audio') || fileType.includes('sound') || fileType.includes('mp3') || fileType.includes('wav') || fileType.includes('ogg') || fileType.includes('m4a')) {
            return this.translate('parent.chat.audio') || 'صوت';
        }
        
        return this.translate('parent.chat.file') || 'ملف';
    },
    
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // ==================== المودالات (النوافذ المنبثقة) ====================
getStudentResultsHTML: function(studentId) {
    const studentResults = this.resultsData[studentId];
    if (!studentResults || Object.keys(studentResults).length === 0) {
        return '<p class="no-results" data-i18n="parent.results.noData">' + (this.translate('parent.results.noData') || 'لا توجد نتائج بعد') + '</p>';
    }
    
    let html = '<div class="results-list">';
    let count = 0;
    
    Object.entries(studentResults).forEach(([examId, result]) => {
        if (count >= 5) return;
        
        const exam = this.examsData[examId];
        let examName = this.translate('parent.exams.unknown') || 'اختبار غير معروف';
        
        if (exam && exam.name) {
            examName = this.getLocalizedText(exam.name);
        } else if (result.examName) {
            examName = result.examName;
        }
        
        const date = this.formatDate(result.timestamp);
        const score = result.score || 0;
        const totalPoints = exam ? (exam.totalPoints || 100) : 100;
        const percentage = Math.round((score / totalPoints) * 100);
        
        html += `
            <div class="result-item">
                <span class="result-exam">${examName}</span>
                <span class="result-score ${percentage >= 50 ? 'excellent' : 'poor'}">
                    ${percentage}%
                </span>
                <span class="result-date">
                    ${date}
                </span>
            </div>
        `;
        count++;
    });
    
    html += '</div>';
    return html;
},
  
    openLectureModal: function(lectureId, lecture) {
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
                                <strong><i class="fas fa-calendar"></i> ${this.translate('parent.lectures.dateTime') || 'التاريخ'}</strong>
                                <span>${lectureDate}</span>
                            </div>
                        </div>
                        ${lectureDescription ? `
                        <div class="info-item">
                            <div>
                                <strong><i class="fas fa-align-left"></i> ${this.translate('parent.lectures.description') || 'الوصف'}</strong>
                                <p>${lectureDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>

                    <div class="countdown-section">
                        <h3><i class="fas fa-hourglass-half"></i> ${this.translate('parent.lectures.remainingTime') || 'الوقت المتبقي'}</h3>
                        <div class="countdown-display">
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-days">${timeInfo.days.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('parent.lectures.days') || 'أيام'}</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-hours">${timeInfo.hours.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('parent.lectures.hours') || 'ساعات'}</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-minutes">${timeInfo.minutes.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('parent.lectures.minutes') || 'دقائق'}</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-seconds">${timeInfo.seconds.toString().padStart(2, '0')}</span>
                                <span class="countdown-label">${this.translate('parent.lectures.seconds') || 'ثواني'}</span>
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
    
openResultDetailsModal: function(studentId, student, examId, result) {
    const modalRoot = document.getElementById('resultModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const studentName = student.name || student.email || this.translate('parent.student.unknown') || 'طالب غير معروف';
    
    const exam = this.examsData[examId];
    
    if (!exam) {
        console.warn(`⚠️ لم يتم العثور على بيانات الاختبار: ${examId}`);
        this.showToast(this.translate('parent.results.loadExamError') || 'تعذر تحميل بيانات الاختبار بالكامل', 'warning');
    }
    
    const examName = exam ? this.getLocalizedText(exam.name) : this.translate('parent.exams.unknown') || 'اختبار غير معروف';
    const totalPoints = exam ? (exam.totalPoints || 100) : 100;
    const duration = exam ? (exam.duration || 60) : 60;
    
    const percentage = Math.round((result.score / totalPoints) * 100);
    
    // إنشاء كوام الاختبار للمودال
    const examForModal = {
        name: examName,
        totalPoints: totalPoints,
        duration: duration,
        questions: exam ? exam.questions : null
    };
    
    modal.innerHTML = `
        <div class="modal-content-new result-modal" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h2><i class="fas fa-chart-line"></i> ${this.translate('parent.results.examResult') || 'نتيجة الاختبار'}</h2>
                <button class="modal-close-unified">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="result-student-info">
                    <i class="fas fa-user-graduate"></i>
                    <span>${studentName}</span>
                </div>
                
                ${this.generateResultModalContent(examForModal, result, percentage)}
            </div>
            
            <div class="modal-footer">
                <div class="form-actions">
                    <button class="modal-btn close-result-btn grid-btn" id="close-result-btn">
                        <i class="fas fa-check"></i> ${this.translate('parent.general.ok') || 'موافق'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
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
    
    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
    
    setTimeout(() => {
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
        
        const scoreColor = percentage >= 50 ? 
            getComputedStyle(document.documentElement).getPropertyValue('--bg-text').trim() : '#e74c3c';
        
        if (modalContent) {
            modalContent.style.setProperty('--score-color', scoreColor);
        }
        
        const pointsEarned = modal.querySelector('.points-earned');
        if (pointsEarned) {
            const finalScore = result.score || 0;
            this.animateValue(pointsEarned, 0, finalScore, 1500);
        }
    }, 100);
},

    generateResultModalContent: function(exam, result, percentage = null) {
        if (!percentage) {
            const totalPoints = exam.totalPoints || 100;
            percentage = Math.round((result.score / totalPoints) * 100);
        }
        
        const examName = exam.name || this.translate('parent.exams.unknown') || 'اختبار غير معروف';
        const displayExamName = this.getLocalizedText(examName);
        const date = this.formatDateTime(result.timestamp);
        const score = result.score || 0;
        const totalPoints = exam.totalPoints || 100;
        const questionsCount = exam.questions ? Object.keys(exam.questions).length : 0;
    
        const starsBurst = this.createStarBurst(percentage);
        
        return `
            <div class="result-modal-container" data-percentage="${percentage}">
                ${starsBurst}
                
                <div class="result-modal-header">
                    <div class="result-exam-title">
                        <h3><i class="fas fa-file-alt"></i> ${displayExamName}</h3>
                    </div>
                    <div class="result-date-badge">
                        <i class="fas fa-calendar"></i>
                        <span>${date}</span>
                    </div>
                </div>
                
                <div class="result-modal-content">
                    <div class="result-main-score">
                        <div class="score-circle-container">
                            <div class="score-circle ${percentage >= 50 ? 'success' : 'fail'}" data-percentage="${percentage}">
                                <div class="score-percentage">${percentage}%</div>
                                <div class="score-label">${this.translate('parent.results.score') || 'النتيجة'}</div>
                            </div>
                            <div class="score-details">
                                <div class="score-points">
                                    <span class="points-earned">${score}</span>
                                    <span class="points-separator">/</span>
                                    <span class="points-total">${totalPoints}</span>
                                    <span class="points-text">${this.translate('parent.results.points') || 'نقطة'}</span>
                                </div>
                                <div class="score-status ${percentage >= 50 ? 'passed' : 'failed'}">
                                    <i class="fas ${percentage >= 50 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    <span>${percentage >= 50 ? (this.translate('parent.results.passed') || 'ناجح') : (this.translate('parent.results.failed') || 'راسب')}</span>
                                </div>
                            </div>
                        </div>
                        
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
                    
                    <div class="result-additional-info">
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-clock"></i> ${this.translate('parent.exams.duration') || 'المدة'}</div>
                                    <div class="info-value">${exam.duration || 60} ${this.translate('parent.exams.minutes') || 'دقيقة'}</div>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-star"></i> ${this.translate('parent.exams.totalPoints') || 'الدرجة الكلية'}</div>
                                    <div class="info-value">${totalPoints} ${this.translate('parent.exams.points') || 'نقطة'}</div>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-chart-bar"></i> ${this.translate('parent.results.percentage') || 'النسبة المئوية'}</div>
                                    <div class="info-value">${percentage}%</div>
                                </div>
                            </div>
                            <div class="info-item">
                                <div class="info-content">
                                    <div class="info-label"><i class="fas fa-question-circle"></i> ${this.translate('parent.exams.questionsCount') || 'عدد الأسئلة'}</div>
                                    <div class="info-value">${questionsCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="result-performance">
                        <h4><i class="fas fa-tachometer-alt"></i> ${this.translate('parent.results.performance') || 'تقييم الأداء'}</h4>
                        <div class="performance-feedback">
                            ${this.getPerformanceFeedback(percentage)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
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
    
    getPerformanceFeedback: function(percentage) {
        if (percentage >= 90) {
            return `
                <div class="feedback excellent">
                    <div class="feedback-header">
                        <h5><i class="fas fa-crown"></i> ${this.translate('parent.results.excellent') || 'ممتاز'}</h5>
                    </div>
                    <p>${this.translate('parent.results.excellentMessage') || 'أداء استثنائي! احتفظ بهذا المستوى الرائع.'}</p>
                </div>
            `;
        } else if (percentage >= 75) {
            return `
                <div class="feedback very-good">
                    <div class="feedback-header">
                        <h5><i class="fas fa-star"></i> ${this.translate('parent.results.veryGood') || 'جيد جداً'}</h5>
                    </div>
                    <p>${this.translate('parent.results.veryGoodMessage') || 'أداء ممتاز، الطالب على الطريق الصحيح.'}</p>
                </div>
            `;
        } else if (percentage >= 50) {
            return `
                <div class="feedback good">
                    <div class="feedback-header">
                        <h5><i class="fas fa-thumbs-up"></i> ${this.translate('parent.results.good') || 'جيد'}</h5>
                    </div>
                    <p>${this.translate('parent.results.goodMessage') || 'أداء مقبول، يمكنه التحسين أكثر بالمزيد من الممارسة.'}</p>
                </div>
            `;
        } else {
            return `
                <div class="feedback poor">
                    <div class="feedback-header">
                        <h5><i class="fas fa-lightbulb"></i> ${this.translate('parent.results.needsImprovement') || 'يحتاج تحسين'}</h5>
                    </div>
                    <p>${this.translate('parent.results.poorMessage') || 'يجب مراجعة المادة جيداً والمحاولة مرة أخرى.'}</p>
                </div>
            `;
        }
    },
    
    openGroupModal: function(groupId, group) {
        const modalRoot = document.getElementById('groupModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const groupName = this.getLocalizedText(group.name);
        const groupDescription = this.getLocalizedText(group.description);
        const studentCount = group.students ? Object.keys(group.students).length : 0;
        const myStudentsInGroup = this.assignedStudentIds.filter(id => group.students && group.students[id]).length;
        
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
                                <strong><i class="fas fa-users"></i> ${this.translate('parent.groups.totalStudents') || 'عدد الطلاب الإجمالي'}</strong>
                                <span>${studentCount} ${studentCount === 1 ? 
                                    (this.translate('parent.groups.student') || 'طالب') : 
                                    (this.translate('parent.groups.students') || 'طالب')}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div>
                                <strong><i class="fas fa-user-graduate"></i> ${this.translate('parent.groups.yourStudents') || 'طلابك في المجموعة'}</strong>
                                <span>${myStudentsInGroup} ${myStudentsInGroup === 1 ? 
                                    (this.translate('parent.groups.student') || 'طالب') : 
                                    (this.translate('parent.groups.students') || 'طالب')}</span>
                            </div>
                        </div>
                        ${groupDescription ? `
                        <div class="info-item">
                            <div>
                                <strong><i class="fas fa-align-left"></i> ${this.translate('parent.groups.description') || 'الوصف'}</strong>
                                <p>${groupDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="form-actions">
                        <button class="modal-btn close-group-btn grid-btn">
                            <i class="fas fa-check"></i> ${this.translate('parent.general.ok') || 'موافق'}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
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
    
getAttendanceSectionHTML: function() {
    return `
        <div class="section-title">
            <i class="fas fa-clipboard-check"></i>
            <span data-i18n="parent.attendance.title">${this.translate('parent.attendance.title') || 'حضور وغياب الطلاب'}</span>
        </div>
        
        <div class="section-content">
            <!-- إحصائيات الحضور -->
            <div class="attendance-summary-stats">
                <div class="stat-card attendance-stat">
                    <i class="fas fa-user-check"></i>
                    <div class="stat-info">
                        <span class="stat-label" data-i18n="parent.attendance.rate">${this.translate('parent.attendance.rate') || 'نسبة الحضور'}</span>
                        <span class="stat-value" id="attendance-rate">0%</span>
                    </div>
                </div>
                <div class="stat-card attendance-stat">
                    <i class="fas fa-calendar-alt"></i>
                    <div class="stat-info">
                        <span class="stat-label" data-i18n="parent.attendance.totalLectures">${this.translate('parent.attendance.totalLectures') || 'إجمالي المحاضرات'}</span>
                        <span class="stat-value" id="total-attendance-lectures">0</span>
                    </div>
                </div>
            </div>
            
            <!-- جدول الحضور -->
            <div class="data-grid" id="attendance-grid">
                <div class="no-data">
                    <i class="fas fa-clipboard-check"></i>
                    <span data-i18n="parent.attendance.loading">${this.translate('parent.attendance.loading') || 'جاري تحميل سجلات الحضور...'}</span>
                </div>
            </div>
        </div>
    `;
},

loadStudentAttendance: function() {
    // تحميل بيانات الحضور
    const attendanceRef = ref(database, 'attendance');
    
    onValue(attendanceRef, (snapshot) => {
        this.lecturesAttendance = snapshot.val() || {};
        this.processAttendanceData();
        
        // تحديث العداد
        this.updateBadges();
        
        // إذا كان قسم الحضور نشط، قم بالتحديث
        if (this.currentActiveSection === 'attendance-section') {
            this.renderAttendanceSection();
        }
    });
},

processAttendanceData: function() {
    this.attendanceData = {};
    
    // معالجة بيانات الحضور للطلاب المعينين فقط
    Object.entries(this.lecturesAttendance).forEach(([lectureId, attendance]) => {
        if (!attendance) return;
        
        // الحصول على بيانات المحاضرة
        const lecture = this.lecturesData[lectureId];
        if (!lecture) return;
        
        // التحقق من أن المحاضرة تخص مجموعات الطلاب المعينين
        const lectureGroups = lecture.groups || {};
        const studentGroupIds = Object.keys(this.groupsData);
        
        let isRelevantLecture = false;
        studentGroupIds.forEach(groupId => {
            if (lectureGroups[groupId]) {
                isRelevantLecture = true;
            }
        });
        
        if (!isRelevantLecture) return;
        
        // جمع بيانات الحضور للطلاب المعينين
        this.assignedStudentIds.forEach(studentId => {
            if (attendance[studentId]) {
                if (!this.attendanceData[studentId]) {
                    this.attendanceData[studentId] = [];
                }
                
                this.attendanceData[studentId].push({
                    lectureId,
                    status: attendance[studentId],
                    lectureTitle: lecture.title,
                    lectureDate: lecture.date,
                    timestamp: attendance._timestamp || lecture.date
                });
            }
        });
    });
},

renderAttendanceSection: function() {
    const container = document.getElementById('attendance-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    // التحقق من وجود بيانات
    if (Object.keys(this.attendanceData).length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clipboard-check"></i>
                <span data-i18n="parent.attendance.noData">${this.translate('parent.attendance.noData') || 'لا توجد سجلات حضور للطلاب بعد'}</span>
            </div>
        `;
        return;
    }
    
    // تحديث الإحصائيات
    this.updateAttendanceStats();
    
    // عرض كروت الحضور
    this.renderAttendanceCards();
},

updateAttendanceStats: function() {
    let totalLectures = 0;
    let totalPresent = 0;
    
    Object.values(this.attendanceData).forEach(studentAttendance => {
        studentAttendance.forEach(record => {
            totalLectures++;
            if (record.status === 'present') {
                totalPresent++;
            }
        });
    });
    
    const attendanceRate = totalLectures > 0 ? Math.round((totalPresent / totalLectures) * 100) : 0;
    
    const rateElement = document.getElementById('attendance-rate');
    const lecturesElement = document.getElementById('total-attendance-lectures');
    
    if (rateElement) rateElement.textContent = attendanceRate + '%';
    if (lecturesElement) lecturesElement.textContent = totalLectures;
},

renderAttendanceCards: function() {
    const container = document.getElementById('attendance-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    let hasRecords = false;
    
    // عرض كروت الحضور
    Object.entries(this.attendanceData).forEach(([studentId, attendanceRecords]) => {
        const student = this.studentsData[studentId];
        if (!student) return;
        
        attendanceRecords.forEach((record, index) => {
            hasRecords = true;
            const card = this.createAttendanceCard(studentId, student, record);
            container.appendChild(card);
        });
    });
    
    if (!hasRecords) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-clipboard-check"></i>
                <span data-i18n="parent.attendance.noRecords">${this.translate('parent.attendance.noRecords') || 'لا توجد سجلات حضور'}</span>
            </div>
        `;
    }
},

createAttendanceCard: function(studentId, student, record) {
    const card = document.createElement('div');
    card.className = 'data-card attendance-card';
    card.dataset.id = record.lectureId;
    card.dataset.studentId = studentId;
    
    const studentName = student.name || student.email || this.translate('parent.student.unknown') || 'طالب غير معروف';
    const lectureTitle = this.getLocalizedText(record.lectureTitle);
    const displayTitle = lectureTitle || this.translate('parent.attendance.noTitle') || 'بدون عنوان';
    const statusText = this.getAttendanceStatusText(record.status);
    const statusClass = record.status;
    
    card.innerHTML = `
        <div class="attendance-badge ${statusClass}">
            ${statusText}
        </div>
        <i class="fas fa-chalkboard-teacher"></i>
        <h4>${displayTitle.length > 25 ? displayTitle.substring(0, 25) + '...' : displayTitle}</h4>
        <div class="student-name">${studentName}</div>
    `;
    
    card.addEventListener('click', () => this.openAttendanceModal(studentId, student, record));
    
    return card;
},

getAttendanceStatusText: function(status) {
    switch(status) {
        case 'present': return this.translate('parent.attendance.present') || 'حاضر';
        case 'absent': return this.translate('parent.attendance.absent') || 'غائب';
        case 'late': return this.translate('parent.attendance.late') || 'متأخر';
        case 'excused': return this.translate('parent.attendance.excused') || 'معذور';
        default: return this.translate('parent.attendance.unknown') || 'غير محدد';
    }
},

openAttendanceModal: function(studentId, student, record) {
    const modalRoot = document.getElementById('attendanceModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const studentName = student.name || student.email || this.translate('parent.student.unknown') || 'طالب غير معروف';
    const lectureTitle = this.getLocalizedText(record.lectureTitle);
    const lectureDate = this.formatDateTime(record.timestamp);
    const statusText = this.getAttendanceStatusText(record.status);
    const statusClass = record.status;
    
    modal.innerHTML = `
        <div class="modal-content-new" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <div class="modal-header">
                <h2><i class="fas fa-clipboard-check"></i> ${this.translate('parent.attendance.details') || 'تفاصيل الحضور'}</h2>
                <button class="modal-close-unified">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="attendance-info">
                    <div class="info-item">
                        <div>
                            <strong><i class="fas fa-user-graduate"></i> ${this.translate('parent.attendance.studentName') || 'اسم الطالب'}</strong>
                            <span>${studentName}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <strong><i class="fas fa-chalkboard-teacher"></i> ${this.translate('parent.attendance.lecture') || 'المحاضرة'}</strong>
                            <span>${lectureTitle}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <strong><i class="fas fa-calendar"></i> ${this.translate('parent.attendance.date') || 'التاريخ'}</strong>
                            <span>${lectureDate}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <div>
                            <strong><i class="fas fa-clipboard-check"></i> ${this.translate('parent.attendance.status') || 'الحالة'}</strong>
                            <div class="attendance-status-badge ${statusClass}">
                                ${statusText}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <div class="form-actions">
                    <button class="modal-btn close-attendance-btn">
                        <i class="fas fa-check"></i> ${this.translate('parent.general.ok') || 'موافق'}
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const closeBtn = modal.querySelector('.modal-close-unified');
    const okBtn = modal.querySelector('.close-attendance-btn');
    
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
        
        this.updateParentUI();
        if (this.currentActiveSection) {
            this.loadSectionContent(this.currentActiveSection);
        }
    },
    
    // ==================== تحميل بيانات ولي الأمر والطلاب المعينين ====================
    loadParentData: function() {
        if (!this.currentUser) return;
        
        const userId = this.currentUser.uid;
        const userRef = ref(database, `users/${userId}`);
        
        onValue(userRef, (snapshot) => {
            this.parentData = snapshot.val();
            if (this.parentData) {
                this.updateParentUI();
                this.loadAssignedStudents();
            }
        }, (error) => {
            console.error('❌ خطأ في تحميل بيانات ولي الأمر:', error);
            this.showToast(this.translate('parent.loadError') || 'خطأ في تحميل البيانات', 'error');
        });
    },
    
    loadAssignedStudents: function() {
        if (!this.parentData) {
            this.assignedStudentIds = [];
            this.updateBadges();
            return;
        }
        
        // جلب الطلاب المعينين
        if (this.parentData.assignedStudent) {
            // إذا كان assignedStudent هو معرف واحد
            this.assignedStudentIds = [this.parentData.assignedStudent];
        } else if (this.parentData.students && typeof this.parentData.students === 'object') {
            // إذا كان students كائن يحتوي معرفات الطلاب
            this.assignedStudentIds = Object.keys(this.parentData.students);
        } else if (Array.isArray(this.parentData.students)) {
            // إذا كان students مصفوفة
            this.assignedStudentIds = this.parentData.students;
        } else {
            this.assignedStudentIds = [];
        }
        
        console.log('🎓 الطلاب المعينين:', this.assignedStudentIds);
        
        this.updateBadges();
        
        // تحميل بيانات الطلاب
        if (this.assignedStudentIds.length > 0) {
            this.loadStudentsData();
            this.loadStudentResults();
            this.loadStudentGroups();
            this.loadStudentSubjects();
            this.loadStudentLectures();
            this.loadStudentAttendance();
        } else {
            console.log('⚠️ لا يوجد طلاب معينين لهذا ولي الأمر');
        }
    },
    
    loadStudentsData: function() {
        this.studentsData = {};
        
        this.assignedStudentIds.forEach(studentId => {
            const studentRef = ref(database, `users/${studentId}`);
            
            onValue(studentRef, (snapshot) => {
                const studentData = snapshot.val();
                if (studentData) {
                    this.studentsData[studentId] = studentData;
                    console.log(`✅ تم تحميل بيانات الطالب: ${studentData.name || studentData.email}`);
                    
                    // تحديث عرض الطلاب إذا كان القسم نشط
                    if (this.currentActiveSection === 'students-section') {
                        this.renderStudentsSection();
                    }
                }
            }, (error) => {
                console.error(`❌ خطأ في تحميل بيانات الطالب ${studentId}:`, error);
            });
        });
    },
    
    loadStudentResults: function() {
        this.resultsData = {};
        
        this.assignedStudentIds.forEach(studentId => {
            const resultsRef = ref(database, `examResults/${studentId}`);
            
            onValue(resultsRef, (snapshot) => {
                const studentResults = snapshot.val() || {};
                this.resultsData[studentId] = studentResults;
                
                // تحديث العداد
                this.updateBadges();
                
                // إذا كان قسم النتائج نشط، قم بالتحديث
                if (this.currentActiveSection === 'results-section') {
                    this.renderResultsSection();
                }
                
                // إذا كان قسم الطلاب نشط، قم بتحديث الإحصائيات
                if (this.currentActiveSection === 'students-section') {
                    this.renderStudentsSection();
                }
            });
        });
    },
    
    loadStudentGroups: function() {
        const groupsRef = ref(database, 'groups');
        
        onValue(groupsRef, (snapshot) => {
            const allGroups = snapshot.val() || {};
            this.groupsData = {};
            
            // فلترة المجموعات التي تحتوي على الطلاب المعينين
            Object.entries(allGroups).forEach(([groupId, group]) => {
                if (group.students) {
                    this.assignedStudentIds.forEach(studentId => {
                        if (group.students[studentId]) {
                            if (!this.groupsData[groupId]) {
                                this.groupsData[groupId] = group;
                            }
                        }
                    });
                }
            });
            
            // تحديث العداد
            this.updateBadges();
            
            // إذا كان قسم المجموعات نشط، قم بالتحديث
            if (this.currentActiveSection === 'groups-section') {
                this.renderGroupsSection();
            }
        });
    },
    
    loadStudentSubjects: function() {
        const subjectsRef = ref(database, 'subjects');
        
        onValue(subjectsRef, (snapshot) => {
            const allSubjects = snapshot.val() || {};
            this.subjectsData = {};
            
            // الحصول على مجموعات الطلاب
            const studentGroupIds = Object.keys(this.groupsData);
            
            // فلترة المواد التي تخص مجموعات الطلاب
            Object.entries(allSubjects).forEach(([subjectId, subject]) => {
                if (subject.groups) {
                    studentGroupIds.forEach(groupId => {
                        if (subject.groups[groupId]) {
                            if (!this.subjectsData[subjectId]) {
                                this.subjectsData[subjectId] = subject;
                            }
                        }
                    });
                }
            });
            
            // تحديث العداد
            this.updateBadges();
            
            // إذا كان قسم المواد نشط، قم بالتحديث
            if (this.currentActiveSection === 'subjects-section') {
                this.subjectsContentHandler.renderSubjectsButtons();
            }
        });
    },
    
    loadStudentLectures: function() {
        const lecturesRef = ref(database, 'lectures');
        
        onValue(lecturesRef, (snapshot) => {
            const allLectures = snapshot.val() || {};
            this.lecturesData = {};
            const now = Date.now();
            
            // الحصول على مجموعات الطلاب
            const studentGroupIds = Object.keys(this.groupsData);
            
            // فلترة المحاضرات القادمة فقط
            Object.entries(allLectures).forEach(([lectureId, lecture]) => {
                if (lecture.date && lecture.date > now) {
                    if (lecture.groups) {
                        studentGroupIds.forEach(groupId => {
                            if (lecture.groups[groupId]) {
                                if (!this.lecturesData[lectureId]) {
                                    this.lecturesData[lectureId] = lecture;
                                }
                            }
                        });
                    }
                }
            });
            
            // تحديث العداد
            this.updateBadges();
            
            // إذا كان قسم المحاضرات نشط، قم بالتحديث
            if (this.currentActiveSection === 'lectures-section') {
                this.renderLecturesSection();
            }
        });
    },
    updateParentUI: function() {
    const parentName = document.getElementById('parent-name-display');
    const studentMessage = document.getElementById('student-relationship-message');
    
    if (parentName && this.parentData) {
        const name = this.parentData.name || this.parentData.email;
        const welcomeText = this.translate('parent.welcome') || 'مرحبا';
        parentName.textContent = `${welcomeText} ${name}`;
    }
    
    if (studentMessage) {
        // الحصول على اسم الطالب الأول المرتبط
        let studentName = this.translate('parent.student.unknown') || 'غير محدد';
        if (this.assignedStudentIds.length > 0) {
            const firstStudentId = this.assignedStudentIds[0];
            const student = this.studentsData[firstStudentId];
            if (student) {
                studentName = student.name || student.email || studentName;
            }
        }
        
        const guardianText = this.translate('parent.guardianOf') || 'ولي أمر';
        studentMessage.textContent = `${guardianText}: ${studentName}`;
    }
    
    document.title = this.translate('parent.title') || 'لوحة ولي الأمر - نظام إدارة الدروس';
},
    
    // ==================== تحميل بيانات المستخدمين للشات ====================
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
    
    // ==================== إعداد الأحداث ====================
    setupEventListeners: function() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.replaceWith(logoutBtn.cloneNode(true));
            
            const newLogoutBtn = document.getElementById('logout-btn');
            
            newLogoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const confirmMessage = this.translate('logout.confirm') || 'هل أنت متأكد من تسجيل الخروج؟';
                if (confirm(confirmMessage)) {
                    try {
                        await auth.signOut();
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 500);
                    } catch (error) {
                        console.error('❌ خطأ في تسجيل الخروج:', error);
                        this.showToast(this.translate('logout.error') || 'حدث خطأ في تسجيل الخروج', 'error');
                    }
                }
            });
        }
        
        const homeBtn = document.getElementById('toggle-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        document.addEventListener('languageChanged', (event) => {
            this.updateTranslations();
        });
        
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
        console.log('👨‍👦 تهيئة لوحة ولي الأمر المتكاملة مع الشات...');
    
        this.currentUser = auth.currentUser;
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
    
        this.loadUsersData().then(() => {
            this.loadParentData();
            this.setupEventListeners();
            this.initParentSections();
            this.loadExamsData();
        
            setTimeout(() => {
                this.updateTranslations();
            }, 500);
        });
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
                        if (userData && userData.role === 'parent') {
                            window.parentApp = parentApp;
                            parentApp.init();
                        } else {
                            if (userData && userData.role === 'admin') {
                                window.location.href = 'admin.html';
                            } else if (userData && userData.role === 'student') {
                                window.location.href = 'student.html';
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

window.parentApp = parentApp;