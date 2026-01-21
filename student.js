
// student.js - نظام صفحة الطالب المحدث
// ==================== استيراد Firebase Functions ====================
import { auth, database } from "./app.js";
import { ref, onValue, get, set, push, remove, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== التطبيق الرئيسي للطالب ====================
const studentApp = {
    currentUser: null,
    studentData: null,
    studentGroups: [],
    studentSubjects: [],
    studentLectures: [],
    studentExams: [],
    studentResults: [],
    studentContent: { pdfs: [], images: [], audios: [] },
    currentActiveSection: 'subjects-section',
    currentContentType: 'pdfs',
    
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
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
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
    
    // ==================== إدارة عرض الأقسام كبطاقات ====================
    initStudentSections: function() {
        const sectionCards = document.querySelectorAll('.section-card');
        const resultContainer = document.getElementById('student-result-container');
        const dynamicContent = document.getElementById('dynamic-section-content');
        const placeholder = resultContainer.querySelector('.result-placeholder');
        
        if (placeholder) {
            placeholder.classList.add('active');
            placeholder.style.display = 'block';
        }
        
        if (dynamicContent) {
            dynamicContent.classList.remove('active');
            dynamicContent.style.display = 'none';
        }
        
        const firstCard = sectionCards[0];
        if (firstCard) {
            firstCard.classList.add('active');
            this.currentActiveSection = firstCard.dataset.section;
            this.loadSectionContent(this.currentActiveSection);
        }
        
        sectionCards.forEach(card => {
            card.addEventListener('click', () => {
                const sectionId = card.dataset.section;
                
                if (this.currentActiveSection === sectionId) return;
                
                sectionCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                this.currentActiveSection = sectionId;
                this.loadSectionContent(sectionId);
                
                if (placeholder) {
                    placeholder.classList.remove('active');
                    placeholder.style.display = 'none';
                }
                
                if (dynamicContent) {
                    dynamicContent.classList.add('active');
                    dynamicContent.style.display = 'block';
                }
            });
        });
    },
    
    // ==================== تحميل محتوى القسم ====================
    loadSectionContent: function(sectionId) {
        const dynamicContent = document.getElementById('dynamic-section-content');
        const placeholder = document.querySelector('.result-placeholder');
        
        if (!dynamicContent) return;
        
        if (placeholder && placeholder.classList.contains('active')) {
            placeholder.classList.remove('active');
            placeholder.style.display = 'none';
        }
        
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
            case 'content-section':
                sectionHTML = this.getContentSectionHTML();
                break;
            case 'groups-section':
                sectionHTML = this.getGroupsSectionHTML();
                break;
        }
        
        dynamicContent.innerHTML = sectionHTML;
        dynamicContent.classList.add('active');
        dynamicContent.style.display = 'block';
        
        setTimeout(() => {
            switch(sectionId) {
                case 'subjects-section':
                    this.renderSubjectsGrid();
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
                case 'content-section':
                    this.renderContentGrid();
                    break;
                case 'groups-section':
                    this.renderGroupsGrid();
                    break;
            }
        }, 100);
    },
    
    // ==================== دوال بناء HTML للأقسام ====================
    getSubjectsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-book"></i>
                <span data-i18n="student.subjects.title">المواد الدراسية</span>
            </div>
            
            <div class="section-content">
                <div class="search-box">
                    <input type="text" id="search-subjects" placeholder="ابحث في المواد الدراسية..." data-i18n-placeholder="student.subjects.search">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="data-grid" id="subjects-grid">
                    <div class="no-data">
                        <i class="fas fa-book"></i>
                        <span data-i18n="student.subjects.noData">جاري تحميل المواد الدراسية...</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getLecturesSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-chalkboard-teacher"></i>
                <span data-i18n="student.lectures.title">محاضراتي القادمة</span>
            </div>
            
            <div class="section-content">
                <div class="search-box">
                    <input type="text" id="search-lectures" placeholder="ابحث في المحاضرات..." data-i18n-placeholder="student.lectures.search">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="data-grid" id="lectures-grid">
                    <div class="no-data">
                        <i class="fas fa-chalkboard-teacher"></i>
                        <span data-i18n="student.lectures.noData">جاري تحميل المحاضرات القادمة...</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getExamsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-file-alt"></i>
                <span data-i18n="student.exams.title">اختباراتي</span>
            </div>
            
            <div class="section-content">
                <div class="search-box">
                    <input type="text" id="search-exams" placeholder="ابحث في الاختبارات..." data-i18n-placeholder="student.exams.search">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="data-grid" id="exams-grid">
                    <div class="no-data">
                        <i class="fas fa-file-alt"></i>
                        <span data-i18n="student.exams.noData">جاري تحميل الاختبارات...</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getResultsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-chart-line"></i>
                <span data-i18n="student.results.title">نتائجي</span>
            </div>
            
            <div class="section-content">
                <div class="results-stats">
                    <div class="stat-card">
                        <i class="fas fa-trophy"></i>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="student.results.average">المعدل العام</span>
                            <span class="stat-value" id="average-score">0%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <i class="fas fa-file-alt"></i>
                        <div class="stat-info">
                            <span class="stat-label" data-i18n="student.results.totalExams">عدد الاختبارات</span>
                            <span class="stat-value" id="total-exams">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="search-box">
                    <input type="text" id="search-results" placeholder="ابحث في النتائج..." data-i18n-placeholder="student.results.search">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="data-grid" id="results-grid">
                    <div class="no-data">
                        <i class="fas fa-chart-line"></i>
                        <span data-i18n="student.results.noData">جاري تحميل النتائج...</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getContentSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-book-open"></i>
                <span data-i18n="student.content.title">المحتوى الدراسي</span>
            </div>
            
            <div class="section-content">
                <div class="content-tabs">
                    <button class="content-tab active" data-type="pdfs">
                        <i class="fas fa-file-pdf"></i>
                        <span data-i18n="student.content.pdf">PDF</span>
                    </button>
                    <button class="content-tab" data-type="images">
                        <i class="fas fa-image"></i>
                        <span data-i18n="student.content.images">صور</span>
                    </button>
                    <button class="content-tab" data-type="audios">
                        <i class="fas fa-volume-up"></i>
                        <span data-i18n="student.content.audio">صوتيات</span>
                    </button>
                </div>
                
                <div class="search-box">
                    <input type="text" id="search-content" placeholder="ابحث في المحتوى..." data-i18n-placeholder="student.content.search">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="data-grid" id="content-grid">
                    <div class="no-data">
                        <i class="fas fa-book-open"></i>
                        <span data-i18n="student.content.noData">جاري تحميل المحتوى الدراسي...</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    getGroupsSectionHTML: function() {
        return `
            <div class="section-title">
                <i class="fas fa-users"></i>
                <span data-i18n="student.groups.title">مجموعاتي</span>
            </div>
            
            <div class="section-content">
                <div class="data-grid" id="groups-grid">
                    <div class="no-data">
                        <i class="fas fa-users"></i>
                        <span data-i18n="student.groups.noData">جاري تحميل المجموعات...</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // ==================== دوال العرض ====================
    renderSubjectsGrid: function() {
        const container = document.getElementById('subjects-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.studentSubjects || this.studentSubjects.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-book"></i>
                    <span data-i18n="student.subjects.empty">لا توجد مواد دراسية متاحة</span>
                </div>
            `;
            return;
        }
        
        this.studentSubjects.forEach(subject => {
            const card = this.createSubjectCard(subject);
            container.appendChild(card);
        });
        
        this.setupSearch('search-subjects', container, '.subject-card');
    },
    
    createSubjectCard: function(subject) {
        const card = document.createElement('div');
        card.className = 'data-card subject-card';
        card.dataset.id = subject.id;
        
        const subjectName = this.getLocalizedText(subject.name);
        const subjectDescription = this.getLocalizedText(subject.description);
        
        let displayName = subjectName || 'بدون اسم';
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        
        card.innerHTML = `
            <i class="${subject.icon || 'fas fa-book'}"></i>
            <h4>${displayName}</h4>
            ${subjectDescription ? `<p>${subjectDescription.substring(0, 50)}${subjectDescription.length > 50 ? '...' : ''}</p>` : ''}
        `;
        
        card.addEventListener('click', () => this.openSubjectModal(subject));
        
        return card;
    },
    
    renderLecturesGrid: function() {
        const container = document.getElementById('lectures-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.studentLectures || this.studentLectures.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <span data-i18n="student.lectures.empty">لا توجد محاضرات قادمة</span>
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
        const lectureDescription = this.getLocalizedText(lecture.description);
        const lectureDate = this.formatDate(lecture.date);
        
        let displayTitle = lectureTitle || 'بدون عنوان';
        if (displayTitle.length > 25) {
            displayTitle = displayTitle.substring(0, 25) + '...';
        }
        
        card.innerHTML = `
            <div class="lecture-icon">
                <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <h4>${displayTitle}</h4>
            <div class="lecture-date">${lectureDate}</div>
            ${lectureDescription ? `<p>${lectureDescription.substring(0, 40)}${lectureDescription.length > 40 ? '...' : ''}</p>` : ''}
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
                    <span data-i18n="student.exams.empty">لا توجد اختبارات</span>
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
        const subjectName = exam.subjectId && this.studentSubjects.find(s => s.id === exam.subjectId) ?
            this.getLocalizedText(this.studentSubjects.find(s => s.id === exam.subjectId).name) : 'عام';
        
        let displayName = this.getLocalizedText(exam.name) || 'بدون اسم';
        if (displayName.length > 25) {
            displayName = displayName.substring(0, 25) + '...';
        }
        
        card.innerHTML = `
            <div class="exam-status ${hasTaken ? 'taken' : 'available'}">
                <i class="fas ${hasTaken ? 'fa-check-circle' : 'fa-clock'}"></i>
            </div>
            <i class="fas fa-file-alt"></i>
            <h4>${displayName}</h4>
            <p>${subjectName}</p>
            <small>${exam.duration || 60} دقيقة - ${exam.totalPoints || 100} درجة</small>
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
                    <span data-i18n="student.results.empty">لا توجد نتائج بعد</span>
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
        const examName = exam ? this.getLocalizedText(exam.name) : 'اختبار غير معروف';
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
            <small>${score}/${totalPoints} درجة</small>
        `;
        
        card.addEventListener('click', () => this.openResultDetailsModal(result));
        
        return card;
    },
    
    renderContentGrid: function() {
        const container = document.getElementById('content-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        const contentType = this.currentContentType;
        const contentList = this.studentContent[contentType] || [];
        
        if (!contentList || contentList.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="${contentType === 'pdfs' ? 'fas fa-file-pdf' : contentType === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                    <span data-i18n="student.content.empty">لا توجد محتويات دراسية</span>
                </div>
            `;
            return;
        }
        
        contentList.forEach(content => {
            const card = this.createContentCard(content, contentType);
            container.appendChild(card);
        });
        
        this.setupSearch('search-content', container, '.content-card');
        this.setupContentTabs();
    },
    
    createContentCard: function(content, type) {
        const card = document.createElement('div');
        card.className = 'data-card content-card';
        card.dataset.type = type;
        
        let icon, typeName;
        
        switch(type) {
            case 'pdfs':
                icon = 'fa-file-pdf';
                typeName = 'PDF';
                break;
            case 'images':
                icon = 'fa-image';
                typeName = 'صورة';
                break;
            case 'audios':
                icon = 'fa-volume-up';
                typeName = 'صوت';
                break;
        }
        
        let displayName = content.name || 'بدون اسم';
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        
        const subjectName = content.subjectName ? this.getLocalizedText(content.subjectName) : '';
        
        card.innerHTML = `
            <div class="content-type ${type}">
                <i class="fas ${icon}"></i>
                <span>${typeName}</span>
            </div>
            <i class="fas ${icon}"></i>
            <h4>${displayName}</h4>
            ${subjectName ? `<p class="subject-name">${subjectName}</p>` : ''}
            <small>${this.formatFileSize(content.size)}</small>
        `;
        
        card.addEventListener('click', () => this.openContentModal(content, type));
        
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
                    <span data-i18n="student.groups.empty">لا توجد مجموعات</span>
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
        const groupDescription = this.getLocalizedText(group.description);
        const studentCount = group.students ? Object.keys(group.students).length : 0;
        
        let displayName = groupName || 'بدون اسم';
        if (displayName.length > 20) {
            displayName = displayName.substring(0, 20) + '...';
        }
        
        card.innerHTML = `
            <div class="group-count">
                <i class="fas fa-users"></i>
                <span>${studentCount}</span>
            </div>
            <i class="fas fa-users"></i>
            <h4>${displayName}</h4>
            ${groupDescription ? `<p>${groupDescription.substring(0, 40)}${groupDescription.length > 40 ? '...' : ''}</p>` : ''}
        `;
        
        card.addEventListener('click', () => this.openGroupModal(group));
        
        return card;
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
    
    setupContentTabs: function() {
        const tabs = document.querySelectorAll('.content-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentContentType = tab.dataset.type;
                this.renderContentGrid();
            });
        });
    },
    
    updateStats: function() {
        const totalExams = this.studentResults.length;
        document.getElementById('total-exams').textContent = totalExams;
        
        if (totalExams === 0) {
            document.getElementById('average-score').textContent = '0%';
            return;
        }
        
        const totalScore = this.studentResults.reduce((sum, result) => sum + (result.score || 0), 0);
        const average = Math.round(totalScore / totalExams);
        document.getElementById('average-score').textContent = average + '%';
    },
    
    // ==================== المودالات ====================
    openSubjectModal: function(subject) {
        const modalRoot = document.getElementById('subjectModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const subjectName = this.getLocalizedText(subject.name);
        const subjectDescription = this.getLocalizedText(subject.description);
        
        modal.innerHTML = `
            <div class="modal-content-new subject-modal">
                <div class="modal-header">
                    <h2><i class="${subject.icon || 'fas fa-book'}"></i> ${subjectName}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-tabs">
                    <button class="modal-tab active" data-type="pdfs">
                        <i class="fas fa-file-pdf"></i>
                        <span>PDF</span>
                    </button>
                    <button class="modal-tab" data-type="images">
                        <i class="fas fa-image"></i>
                        <span>صور</span>
                    </button>
                    <button class="modal-tab" data-type="audios">
                        <i class="fas fa-volume-up"></i>
                        <span>صوتيات</span>
                    </button>
                </div>
                
                <div class="modal-body">
                    ${subjectDescription ? `<div class="subject-description">${subjectDescription}</div>` : ''}
                    
                    <div class="subject-content-area">
                        <div class="content-section active" id="subject-pdfs">
                            <div class="no-data">
                                <i class="fas fa-file-pdf"></i>
                                <span>جاري تحميل ملفات PDF...</span>
                            </div>
                        </div>
                        <div class="content-section" id="subject-images">
                            <div class="no-data">
                                <i class="fas fa-image"></i>
                                <span>جاري تحميل الصور...</span>
                            </div>
                        </div>
                        <div class="content-section" id="subject-audios">
                            <div class="no-data">
                                <i class="fas fa-volume-up"></i>
                                <span>جاري تحميل الصوتيات...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        const tabs = modal.querySelectorAll('.modal-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const type = tab.dataset.type;
                modal.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                modal.querySelector(`#subject-${type}`).classList.add('active');
                
                this.loadSubjectContent(subject.id, type, modal);
            });
        });
        
        this.loadSubjectContent(subject.id, 'pdfs', modal);
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    loadSubjectContent: function(subjectId, type, modal) {
        const container = modal.querySelector(`#subject-${type}`);
        if (!container) return;
        
        container.innerHTML = '<div class="no-data">جاري تحميل المحتوى...</div>';
        
        const contentRef = ref(database, `subjectsContent/${subjectId}/${type}`);
        
        onValue(contentRef, (snapshot) => {
            const content = snapshot.val() || {};
            this.renderSubjectContent(content, type, container);
        });
    },
    
    renderSubjectContent: function(content, type, container) {
        container.innerHTML = '';
        
        if (!content || Object.keys(content).length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                    <span data-i18n="student.content.empty">لا توجد محتويات</span>
                </div>
            `;
            return;
        }
        
        Object.entries(content).forEach(([key, item]) => {
            if (!item) return;
            
            const contentItem = document.createElement('div');
            contentItem.className = 'subject-content-item';
            
            let actionHtml = '';
            
            switch(type) {
                case 'pdfs':
                    actionHtml = `
                        <a href="${item.url}" target="_blank" class="btn small">
                            <i class="fas fa-eye"></i> عرض
                        </a>
                    `;
                    break;
                case 'images':
                    actionHtml = `
                        <div class="image-preview">
                            <img src="${item.url}" alt="${item.name}" loading="lazy">
                        </div>
                        <a href="${item.url}" target="_blank" class="btn small">
                            <i class="fas fa-eye"></i> عرض
                        </a>
                    `;
                    break;
                case 'audios':
                    actionHtml = `
                        <div class="audio-player">
                            <audio controls>
                                <source src="${item.url}" type="audio/mpeg">
                            </audio>
                        </div>
                    `;
                    break;
            }
            
            contentItem.innerHTML = `
                <div class="content-item-header">
                    <i class="fas ${type === 'pdfs' ? 'fa-file-pdf' : type === 'images' ? 'fa-image' : 'fa-volume-up'}"></i>
                    <h5>${item.name || 'بدون اسم'}</h5>
                </div>
                ${actionHtml}
                <a href="${item.url}" download class="btn small download-btn">
                    <i class="fas fa-download"></i> تحميل
                </a>
                <div class="content-item-meta">
                    <span>${this.formatFileSize(item.size)}</span>
                </div>
            `;
            
            container.appendChild(contentItem);
        });
    },
    
    openLectureModal: function(lecture) {
        const modalRoot = document.getElementById('lectureModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const lectureTitle = this.getLocalizedText(lecture.title);
        const lectureDescription = this.getLocalizedText(lecture.description);
        const lectureDate = this.formatDate(lecture.date);
        const lectureTime = lecture.time || this.formatTime(lecture.date);
        
        modal.innerHTML = `
            <div class="modal-content-new lecture-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-chalkboard-teacher"></i> ${lectureTitle}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="lecture-info">
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <div>
                                <strong>التاريخ:</strong>
                                <span>${lectureDate}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <strong>الوقت:</strong>
                                <span>${lectureTime}</span>
                            </div>
                        </div>
                        ${lectureDescription ? `
                        <div class="info-item">
                            <i class="fas fa-align-left"></i>
                            <div>
                                <strong>الوصف:</strong>
                                <p>${lectureDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>
                    
                    <div class="countdown-section">
                        <h3><i class="fas fa-hourglass-half"></i> الوقت المتبقي</h3>
                        <div class="countdown-display">
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-days">00</span>
                                <span class="countdown-label">أيام</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-hours">00</span>
                                <span class="countdown-label">ساعات</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-minutes">00</span>
                                <span class="countdown-label">دقائق</span>
                            </div>
                            <div class="countdown-unit">
                                <span class="countdown-value" id="lecture-seconds">00</span>
                                <span class="countdown-label">ثواني</span>
                            </div>
                        </div>
                        <div class="countdown-status" id="lecture-status">المحاضرة لم تبدأ بعد</div>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        this.startLectureCountdown(lecture.date, modal);
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    startLectureCountdown: function(lectureTimestamp, modal) {
        const updateCountdown = () => {
            const now = Date.now();
            const distance = lectureTimestamp - now;
            
            if (distance < 0) {
                modal.querySelector('#lecture-status').textContent = 'المحاضرة بدأت';
                modal.querySelector('#lecture-status').className = 'countdown-status started';
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            modal.querySelector('#lecture-days').textContent = days.toString().padStart(2, '0');
            modal.querySelector('#lecture-hours').textContent = hours.toString().padStart(2, '0');
            modal.querySelector('#lecture-minutes').textContent = minutes.toString().padStart(2, '0');
            modal.querySelector('#lecture-seconds').textContent = seconds.toString().padStart(2, '0');
            
            let statusText = 'المحاضرة لم تبدأ بعد';
            let statusClass = 'waiting';
            
            if (days === 0 && hours < 24) {
                statusText = 'المحاضرة تبدأ قريباً';
                statusClass = 'soon';
            }
            
            if (days === 0 && hours < 1) {
                statusText = 'المحاضرة تبدأ خلال دقائق';
                statusClass = 'very-soon';
            }
            
            modal.querySelector('#lecture-status').textContent = statusText;
            modal.querySelector('#lecture-status').className = `countdown-status ${statusClass}`;
        };
        
        updateCountdown();
        const intervalId = setInterval(updateCountdown, 1000);
        modal.dataset.countdownInterval = intervalId;
    },
    
    openExamModal: function(exam) {
        const modalRoot = document.getElementById('examModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const examName = this.getLocalizedText(exam.name);
        const examDescription = this.getLocalizedText(exam.description);
        
        modal.innerHTML = `
            <div class="modal-content-new exam-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-file-alt"></i> ${examName}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="exam-info">
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <strong>المدة:</strong>
                                <span>${exam.duration || 60} دقيقة</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-star"></i>
                            <div>
                                <strong>الدرجة الكلية:</strong>
                                <span>${exam.totalPoints || 100} درجة</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-question-circle"></i>
                            <div>
                                <strong>عدد الأسئلة:</strong>
                                <span>${exam.questions ? Object.keys(exam.questions).length : 0}</span>
                            </div>
                        </div>
                        ${examDescription ? `
                        <div class="info-item">
                            <i class="fas fa-align-left"></i>
                            <div>
                                <strong>الوصف:</strong>
                                <p>${examDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>
                    
                    <div class="exam-instructions">
                        <h3><i class="fas fa-info-circle"></i> تعليمات:</h3>
                        <ul>
                            <li>سيتم احتساب الوقت بدقة</li>
                            <li>لا يمكنك الخروج من الاختبار أثناء الإجابة</li>
                            <li>سيتم تصحيح الإجابات تلقائياً</li>
                            <li>لا يمكنك إعادة الاختبار بعد الإنهاء</li>
                        </ul>
                    </div>
                    
                    <div class="exam-actions">
                        <button class="btn start-exam-btn">
                            <i class="fas fa-play"></i> بدء الاختبار
                        </button>
                        <button class="btn close-exam-btn">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.querySelector('.close-exam-btn').addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.querySelector('.start-exam-btn').addEventListener('click', () => {
            this.closeModal(modal, modalRoot);
            setTimeout(() => this.openTakeExamModal(exam), 300);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    openTakeExamModal: function(exam) {
        // سأحافظ على نظام الامتحان الحالي كما هو
        const modalRoot = document.getElementById('examTakeModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new take-exam-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-file-alt"></i> ${this.getLocalizedText(exam.name)}</h2>
                    <div class="exam-timer" id="exam-timer">${exam.duration || 60}:00</div>
                    <button class="modal-close-unified" id="close-exam-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="exam-instructions" id="exam-instructions">
                    <h3><i class="fas fa-info-circle"></i> تعليمات الاختبار:</h3>
                    <ul>
                        <li>مدة الاختبار: ${exam.duration || 60} دقيقة</li>
                        <li>الدرجة الكلية: ${exam.totalPoints || 100} درجة</li>
                        <li>عدد الأسئلة: ${exam.questions ? Object.keys(exam.questions).length : 0}</li>
                        <li>لا يمكنك إغلاق نافذة الاختبار أثناء الإجابة</li>
                        <li>سيتم تصحيح الإجابات تلقائياً بعد انتهاء الوقت</li>
                    </ul>
                    <button class="btn success" id="start-exam-btn">
                        <i class="fas fa-play"></i> بدء الاختبار
                    </button>
                </div>
                
                <div class="exam-questions-container" id="exam-questions-container" style="display: none;">
                    <form id="exam-questions-form"></form>
                    <div class="exam-actions">
                        <button class="btn" id="submit-exam-btn">
                            <i class="fas fa-check-circle"></i> إنهاء الاختبار
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('#close-exam-btn');
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast('لا يمكن إغلاق نافذة الاختبار أثناء الإجابة', 'warning');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                e.preventDefault();
                this.showToast('لا يمكن إغلاق نافذة الاختبار أثناء الإجابة', 'warning');
            }
        });
        
        const startBtn = modal.querySelector('#start-exam-btn');
        startBtn.addEventListener('click', () => {
            modal.querySelector('#exam-instructions').style.display = 'none';
            modal.querySelector('#exam-questions-container').style.display = 'block';
            
            this.loadExamQuestions(exam, modal);
            this.startExamTimer(exam, modal);
            this.preventNavigation();
        });
        
        const submitBtn = modal.querySelector('#submit-exam-btn');
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('هل أنت متأكد من إنهاء الاختبار؟')) {
                this.submitExam(exam, modal);
            }
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    openResultModal: function(examId) {
        const exam = this.studentExams.find(e => e.id === examId);
        const result = this.studentResults.find(r => r.examId === examId);
        
        if (!exam || !result) {
            this.showToast('لا توجد نتيجة لهذا الاختبار', 'error');
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
        const examName = exam ? this.getLocalizedText(exam.name) : 'اختبار غير معروف';
        const score = result.score || 0;
        const totalPoints = exam ? exam.totalPoints : 100;
        const percentage = Math.round((score / totalPoints) * 100);
        const date = this.formatDate(result.timestamp);
        
        modal.innerHTML = `
            <div class="modal-content-new result-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-chart-line"></i> نتيجة الاختبار</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="result-summary">
                        <div class="result-icon">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <h3>${examName}</h3>
                        <div class="result-score-circle">
                            <span class="score-value">${percentage}%</span>
                            <span class="score-label">${score}/${totalPoints}</span>
                        </div>
                        <div class="result-date">${date}</div>
                    </div>
                    
                    <div class="result-details">
                        <h3><i class="fas fa-list"></i> تفاصيل النتيجة</h3>
                        <div class="details-list">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    openContentModal: function(content, type) {
        const modalRoot = document.getElementById('contentModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        let contentHtml = '';
        
        switch(type) {
            case 'pdfs':
                contentHtml = `
                    <div class="pdf-viewer">
                        <iframe src="${content.url}" frameborder="0"></iframe>
                    </div>
                `;
                break;
            case 'images':
                contentHtml = `
                    <div class="image-viewer">
                        <img src="${content.url}" alt="${content.name}">
                    </div>
                `;
                break;
            case 'audios':
                contentHtml = `
                    <div class="audio-viewer">
                        <div class="audio-player">
                            <audio controls autoplay>
                                <source src="${content.url}" type="audio/mpeg">
                            </audio>
                        </div>
                    </div>
                `;
                break;
        }
        
        modal.innerHTML = `
            <div class="modal-content-new content-modal">
                <div class="modal-header">
                    <h2><i class="fas ${type === 'pdfs' ? 'fa-file-pdf' : type === 'images' ? 'fa-image' : 'fa-volume-up'}"></i> ${content.name}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    ${content.subjectName ? `<div class="content-subject">المادة: ${this.getLocalizedText(content.subjectName)}</div>` : ''}
                    ${contentHtml}
                    <div class="content-actions">
                        <a href="${content.url}" download class="btn download-btn">
                            <i class="fas fa-download"></i> تحميل الملف
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
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
            <div class="modal-content-new group-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> ${groupName}</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="group-info">
                        <div class="info-item">
                            <i class="fas fa-users"></i>
                            <div>
                                <strong>عدد الطلاب:</strong>
                                <span>${studentCount} طالب</span>
                            </div>
                        </div>
                        ${groupDescription ? `
                        <div class="info-item">
                            <i class="fas fa-align-left"></i>
                            <div>
                                <strong>الوصف:</strong>
                                <p>${groupDescription}</p>
                            </div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
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
    
    // ==================== دوال الامتحانات (موروثة) ====================
    loadExamQuestions: function(exam, modal) {
        const container = modal.querySelector('#exam-questions-form');
        if (!container || !exam.questions) return;
        
        let questionsHTML = '';
        let questionIndex = 1;
        
        Object.entries(exam.questions).forEach(([questionId, question]) => {
            questionsHTML += this.createExamQuestionHTML(questionId, question, questionIndex);
            questionIndex++;
        });
        
        container.innerHTML = questionsHTML;
    },
    
    createExamQuestionHTML: function(questionId, question, index) {
        let questionHTML = '';
        
        switch(question.type) {
            case 'mc':
                questionHTML = `
                    <div class="exam-question mc-question">
                        <div class="question-header">
                            <h3>سؤال ${index}: اختيار من متعدد</h3>
                            <span class="question-points">${question.points || 1} نقطة</span>
                        </div>
                        <p class="question-text">${question.text}</p>
                        <div class="question-options">
                            ${question.options.map((option, optIndex) => `
                                <label class="option-label">
                                    <input type="radio" name="q_${questionId}" value="${optIndex}">
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
                            <h3>سؤال ${index}: صح أو خطأ</h3>
                            <span class="question-points">${question.points || 1} نقطة</span>
                        </div>
                        <p class="question-text">${question.text}</p>
                        <div class="question-options">
                            <label class="option-label">
                                <input type="radio" name="q_${questionId}" value="true">
                                <span>صح</span>
                            </label>
                            <label class="option-label">
                                <input type="radio" name="q_${questionId}" value="false">
                                <span>خطأ</span>
                            </label>
                        </div>
                    </div>
                `;
                break;
                
            case 'fb':
                questionHTML = `
                    <div class="exam-question fb-question">
                        <div class="question-header">
                            <h3>سؤال ${index}: أكمل الفراغ</h3>
                            <span class="question-points">${question.points || 1} نقطة</span>
                        </div>
                        <p class="question-text">${question.text}</p>
                        <div class="question-blanks">
                            ${question.blanks.map((blank, blankIndex) => `
                                <div class="blank-input">
                                    <label>الإجابة ${blankIndex + 1}:</label>
                                    <input type="text" name="q_${questionId}_${blankIndex}" placeholder="أدخل الإجابة">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
        }
        
        return questionHTML;
    },
    
    startExamTimer: function(exam, modal) {
        let timeLeft = (exam.duration || 60) * 60;
        const timerElement = modal.querySelector('#exam-timer');
        
        const timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.showToast('انتهى وقت الاختبار', 'warning');
                this.submitExam(exam, modal);
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timeLeft--;
            
            if (timeLeft < 300) {
                timerElement.style.color = '#e74c3c';
                timerElement.style.animation = 'pulse 1s infinite';
            }
        }, 1000);
        
        modal.dataset.timerInterval = timerInterval;
        modal.dataset.examId = exam.id;
    },
    
    preventNavigation: function() {
        window.onbeforeunload = function(e) {
            e.preventDefault();
            e.returnValue = 'إذا قمت بتحديث الصفحة، ستفقد إجابات الاختبار. هل أنت متأكد؟';
            return 'إذا قمت بتحديث الصفحة، ستفقد إجابات الاختبار. هل أنت متأكد؟';
        };
        
        history.pushState(null, null, window.location.href);
        window.onpopstate = function() {
            history.pushState(null, null, window.location.href);
        };
    },
    
    allowNavigation: function() {
        window.onbeforeunload = null;
        window.onpopstate = null;
    },
    
    submitExam: function(exam, modal) {
        if (modal.dataset.timerInterval) {
            clearInterval(modal.dataset.timerInterval);
        }
        
        this.allowNavigation();
        
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
            .then(() => console.log('✅ تم حفظ نتيجة الاختبار'))
            .catch(error => console.error('❌ خطأ في حفظ نتيجة الاختبار:', error));
    },
    
    showExamResult: function(exam, score) {
        const modalRoot = document.getElementById('examModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        modal.innerHTML = `
            <div class="modal-content-new exam-result-modal">
                <div class="modal-header">
                    <h2><i class="fas fa-trophy"></i> نتيجة الاختبار</h2>
                    <button class="modal-close-unified">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="result-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    
                    <h3>${this.getLocalizedText(exam.name)}</h3>
                    
                    <div class="result-score-display">
                        <span class="score-value">${score}%</span>
                    </div>
                    
                    <div class="result-message">
                        <p>تم حفظ نتيجة الاختبار بنجاح</p>
                        <p>يمكنك عرض التفاصيل من قسم النتائج</p>
                    </div>
                    
                    <div class="result-actions">
                        <button class="btn close-result-btn">
                            <i class="fas fa-check"></i> موافق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close-unified');
        closeBtn.addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.querySelector('.close-result-btn').addEventListener('click', () => this.closeModal(modal, modalRoot));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal(modal, modalRoot);
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    // ==================== تحميل البيانات ====================
    loadStudentData: function() {
        const userId = this.currentUser.uid;
        const userRef = ref(database, `users/${userId}`);
        
        onValue(userRef, (snapshot) => {
            this.studentData = snapshot.val();
            if (!this.studentData) {
                console.error('❌ لا توجد بيانات للطالب');
                return;
            }
            
            this.updateUI();
            this.loadStudentGroups();
            
        }, (error) => {
            console.error('❌ خطأ في تحميل بيانات الطالب:', error);
            this.showToast('خطأ في تحميل البيانات', 'error');
        });
    },
    
    loadStudentGroups: function() {
        const groupsRef = ref(database, 'groups');
        
        onValue(groupsRef, (snapshot) => {
            const allGroups = snapshot.val() || {};
            this.studentGroups = [];
            
            Object.entries(allGroups).forEach(([groupId, group]) => {
                if (group.students && group.students[this.currentUser.uid]) {
                    this.studentGroups.push({
                        id: groupId,
                        ...group
                    });
                }
            });
            
            document.getElementById('groups-badge').textContent = this.studentGroups.length;
            this.loadStudentSubjects();
            
        }, (error) => {
            console.error('❌ خطأ في تحميل المجموعات:', error);
            this.showToast('خطأ في تحميل المجموعات', 'error');
        });
    },
    
    loadStudentSubjects: function() {
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
            
            document.getElementById('subjects-badge').textContent = this.studentSubjects.length;
            
            if (this.currentActiveSection === 'subjects-section') {
                this.renderSubjectsGrid();
            }
            
            this.loadStudentLectures();
            this.loadAllContent();
            
        }, (error) => {
            console.error('❌ خطأ في تحميل المواد الدراسية:', error);
            this.showToast('خطأ في تحميل المواد الدراسية', 'error');
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
            document.getElementById('lectures-badge').textContent = this.studentLectures.length;
            
            if (this.currentActiveSection === 'lectures-section') {
                this.renderLecturesGrid();
            }
            
            this.loadStudentExams();
            
        }, (error) => {
            console.error('❌ خطأ في تحميل المحاضرات:', error);
            this.showToast('خطأ في تحميل المحاضرات', 'error');
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
            
            document.getElementById('exams-badge').textContent = this.studentExams.length;
            
            if (this.currentActiveSection === 'exams-section') {
                this.renderExamsGrid();
            }
            
            this.loadStudentResults();
            
        }, (error) => {
            console.error('❌ خطأ في تحميل الاختبارات:', error);
            this.showToast('خطأ في تحميل الاختبارات', 'error');
        });
    },
    
    loadStudentResults: function() {
        const userId = this.currentUser.uid;
        const resultsRef = ref(database, `examResults/${userId}`);
        
        onValue(resultsRef, (snapshot) => {
            const results = snapshot.val() || {};
            this.studentResults = Object.entries(results).map(([examId, result]) => ({
                examId,
                ...result
            }));
            
            document.getElementById('results-badge').textContent = this.studentResults.length;
            
            if (this.currentActiveSection === 'results-section') {
                this.renderResultsGrid();
            }
            
        }, (error) => {
            console.error('❌ خطأ في تحميل النتائج:', error);
            this.showToast('خطأ في تحميل النتائج', 'error');
        });
    },
    
    loadAllContent: function() {
        this.studentContent = { pdfs: [], images: [], audios: [] };
        
        this.studentSubjects.forEach(subject => {
            ['pdfs', 'images', 'audios'].forEach(type => {
                const contentRef = ref(database, `subjectsContent/${subject.id}/${type}`);
                
                onValue(contentRef, (snapshot) => {
                    const content = snapshot.val() || {};
                    Object.entries(content).forEach(([contentId, item]) => {
                        if (item) {
                            this.studentContent[type].push({
                                ...item,
                                subjectId: subject.id,
                                subjectName: subject.name,
                                contentType: type
                            });
                        }
                    });
                    
                    document.getElementById('content-badge').textContent = 
                        this.studentContent.pdfs.length + 
                        this.studentContent.images.length + 
                        this.studentContent.audios.length;
                    
                    if (this.currentActiveSection === 'content-section') {
                        this.renderContentGrid();
                    }
                    
                });
            });
        });
    },
    
    updateUI: function() {
        const studentName = document.getElementById('student-name-display');
        if (studentName && this.studentData) {
            const name = this.studentData.name || this.studentData.email;
            studentName.textContent = name;
        }
        
        const welcomeText = document.getElementById('student-welcome');
        if (welcomeText && this.studentData) {
            const name = this.studentData.name || this.studentData.email;
            welcomeText.textContent = `مرحباً بك ${name} في لوحة الطالب`;
        }
    },
    
    // ==================== إعداد الأحداث ====================
    setupEventListeners: function() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('❌ خطأ في تسجيل الخروج:', error);
                    this.showToast('حدث خطأ في تسجيل الخروج', 'error');
                }
            });
        }
        
        const homeBtn = document.getElementById('toggle-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                document.querySelectorAll('.section-card').forEach(c => c.classList.remove('active'));
                this.currentActiveSection = null;
                
                const dynamicContent = document.getElementById('dynamic-section-content');
                const placeholder = document.querySelector('.result-placeholder');
                
                if (dynamicContent) {
                    dynamicContent.classList.remove('active');
                    dynamicContent.style.display = 'none';
                }
                
                if (placeholder) {
                    placeholder.classList.add('active');
                    placeholder.style.display = 'block';
                }
            });
        }
        
        if (window.i18n) {
            const languageToggle = document.getElementById('language-toggle');
            if (languageToggle) {
                languageToggle.addEventListener('click', () => {
                    if (window.i18n.toggleLanguage) {
                        window.i18n.toggleLanguage();
                    }
                });
            }
        }
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                if (window.cycleTheme) {
                    window.cycleTheme();
                }
            });
        }
    },
    
    // ==================== تهيئة النظام ====================
    init: function() {
        console.log('🎓 تهيئة لوحة الطالب...');
        
        this.currentUser = auth.currentUser;
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        this.loadStudentData();
        this.setupEventListeners();
        this.initStudentSections();
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
