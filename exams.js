// exams.js 
// ==================== استيراد Firebase Functions ====================
import { database } from "./app.js";
import { ref, set, update, remove, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== دوال مساعدة للاختبارات ====================
const examsUtils = {
    currentExamId: null,
    currentExamData: null,
    groupsData: {},
    subjectsData: {},
    examsData: {},
    
    showToast: function(message, type = 'success') {
        let toast = document.getElementById('global-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.className = 'qc-toast';
            document.body.appendChild(toast);
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
    
    // تهيئة قسم الاختبارات
    initExamsSection: function() {
        console.log('📝 تهيئة قسم الاختبارات...');
        this.loadGroupsData();
        this.loadSubjectsData();
        setTimeout(() => {
            if (window.adminUtils && window.adminUtils.applyTranslationsToDynamicContent) {
                window.adminUtils.applyTranslationsToDynamicContent();
            }
        }, 300);
    },
    
    // تحميل المجموعات
    loadGroupsData: function() {
        const groupsRef = ref(database, 'groups');
        
        onValue(groupsRef, (snapshot) => {
            this.groupsData = snapshot.val() || {};
            console.log('📊 المجموعات المحملة:', Object.keys(this.groupsData).length);
        }, (error) => {
            console.error('❌ خطأ في تحميل المجموعات:', error);
            this.showToast('خطأ في تحميل المجموعات', 'error');
        });
    },
    
    // تحميل المواد الدراسية
    loadSubjectsData: function() {
        const subjectsRef = ref(database, 'subjects');
        
        onValue(subjectsRef, (snapshot) => {
            this.subjectsData = snapshot.val() || {};
            console.log('📚 المواد الدراسية المحملة:', Object.keys(this.subjectsData).length);
        }, (error) => {
            console.error('❌ خطأ في تحميل المواد الدراسية:', error);
            this.showToast('خطأ في تحميل المواد الدراسية', 'error');
        });
    },
    
    // فتح نموذج إنشاء/تعديل اختبار
    openExamModal: function(key = null, exam = null) {
        const isNew = key === null;
        const modalRoot = document.getElementById('userModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        // بناء خيارات المجموعات
        let groupOptions = '<div class="no-students">لا يوجد مجموعات مسجلة بعد</div>';
        if (Object.keys(this.groupsData).length > 0) {
            groupOptions = '';
            Object.entries(this.groupsData).forEach(([groupId, group]) => {
                const groupName = group.name ? (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 'بدون اسم';
                const isSelected = exam && exam.groups && exam.groups[groupId];
                groupOptions += `
                    <label class="select-option">
                        <input type="checkbox" name="groups" value="${groupId}" ${isSelected ? 'checked' : ''}>
                        <span>${groupName}</span>
                    </label>
                `;
            });
        }
        
        // بناء خيارات المواد الدراسية
        let subjectOptions = '<option value="">اختر المادة الدراسية (اختياري)</option>';
        if (Object.keys(this.subjectsData).length > 0) {
            Object.entries(this.subjectsData).forEach(([subjectId, subject]) => {
                const subjectName = subject.name ? (typeof subject.name === 'object' ? subject.name.ar || subject.name.en : subject.name) : 'بدون اسم';
                const isSelected = exam && exam.subjectId === subjectId;
                subjectOptions += `<option value="${subjectId}" ${isSelected ? 'selected' : ''}>${subjectName}</option>`;
            });
        }
        
        // بناء الأسئلة الموجودة
        let existingQuestionsHTML = '';
        if (exam && exam.questions) {
            const questionsArray = Object.entries(exam.questions);
            questionsArray.forEach(([qId, question], index) => {
                existingQuestionsHTML += this.renderQuestionHTML(qId, question, index);
            });
        }
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2><i class="fas fa-file-alt"></i> ${isNew ? 'إنشاء اختبار جديد' : 'تعديل الاختبار'}</h2>
                    <button class="modal-close-unified" aria-label="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="examForm">
                    <div class="form-compact-new">
                        <div class="form-row">
                            <div class="half">
                                <label><i class="fas fa-font"></i> اسم الاختبار</label>
                                <input type="text" id="exam-name" value="${exam ? exam.name : ''}" required>
                            </div>
                            <div class="half">
                                <label><i class="fas fa-book"></i> المادة الدراسية</label>
                                <select id="exam-subject">
                                    ${subjectOptions}
                                </select>
                            </div>
                        </div>
                        
                        <div class="full">
                            <label><i class="fas fa-align-left"></i> وصف الاختبار</label>
                            <textarea id="exam-description" rows="3">${exam ? exam.description || '' : ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="half">
                                <label><i class="fas fa-clock"></i> مدة الاختبار (دقيقة)</label>
                                <input type="number" id="exam-duration" value="${exam ? exam.duration || 60 : 60}" min="1">
                            </div>
                            <div class="half">
                                <label><i class="fas fa-star"></i> الدرجة الكلية</label>
                                <input type="number" id="exam-total-points" value="${exam ? exam.totalPoints || 100 : 100}" min="1" step="1">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="half">
                                <label><i class="fas fa-eye"></i> حالة الاختبار</label>
                                <select id="exam-status">
                                    <option value="draft" ${exam && !exam.isPublished ? 'selected' : ''}>مسودة</option>
                                    <option value="published" ${exam && exam.isPublished ? 'selected' : ''}>نشط</option>
                                </select>
                            </div>
                            <div class="half">
                                <label><i class="fas fa-calendar"></i> تاريخ النشر</label>
                                <input type="date" id="exam-publish-date" value="${exam && exam.publishDate ? new Date(exam.publishDate).toISOString().split('T')[0] : ''}">
                            </div>
                        </div>
                        
                        <div class="full">
                            <label><i class="fas fa-users"></i> المجموعات المستهدفة</label>
                            <div class="multi-select-grid">
                                ${groupOptions}
                            </div>
                        </div>
                        
                        <hr style="border: none; border-top: 2px solid var(--bg-text); margin: 20px 0;">
                        
                        <div class="full">
                            <div class="exam-questions-buttons-container">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <h3 style="margin: 0;"><i class="fas fa-question-circle"></i> الأسئلة</h3>
                                </div>
                                
                                <div class="exam-questions-buttons-grid" id="questions-buttons-grid">
                                    <button type="button" class="exam-question-btn-small" id="add-mc-question">
                                        <i class="fas fa-list-ol"></i> اختيارات
                                    </button>
                                    <button type="button" class="exam-question-btn-small" id="add-tf-question">
                                        <i class="fas fa-check-circle"></i> صح/خطأ
                                    </button>
                                    <button type="button" class="exam-question-btn-small" id="add-fb-question">
                                        <i class="fas fa-edit"></i> أكمل
                                    </button>
                                </div>
                                
                                <div id="questions-container">
                                    ${existingQuestionsHTML || '<p style="text-align: center; color: var(--bg-text); opacity: 0.7; padding: 20px;" id="no-questions-message">لا توجد أسئلة بعد. إضغط على أحد الأزرار أعلاه لإضافة سؤال</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="grid-btn save" id="save-exam">
                            <i class="fas fa-save"></i> ${isNew ? 'إنشاء' : 'حفظ'}
                        </button>
                        ${!isNew ? `
                        <button type="button" class="grid-btn danger" id="delete-exam-btn">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                        ` : ''}
                    </div>
                </form>
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
        
        // إضافة أحداث لأزرار إضافة الأسئلة
        const questionsContainer = modal.querySelector('#questions-container');
        
        modal.querySelector('#add-mc-question').addEventListener('click', () => {
            this.addMultipleChoiceQuestion(questionsContainer);
        });
        
        modal.querySelector('#add-tf-question').addEventListener('click', () => {
            this.addTrueFalseQuestion(questionsContainer);
        });
        
        modal.querySelector('#add-fb-question').addEventListener('click', () => {
            this.addFillBlankQuestion(questionsContainer);
        });
        
        // إضافة أحداث لحذف الأسئلة الموجودة
        modal.querySelectorAll('.delete-question').forEach(btn => {
            btn.addEventListener('click', function() {
                const questionItem = this.closest('.question-item');
                if (questionItem) {
                    questionItem.remove();
                    examsUtils.renumberAllQuestions(questionsContainer);
                    examsUtils.toggleNoQuestionsMessage(questionsContainer);
                }
            });
        });
        
        // تثبيت أزرار الأسئلة عند التمرير
        setTimeout(() => {
            const buttonsGrid = modal.querySelector('#questions-buttons-grid');
            const modalContent = modal.querySelector('.modal-content-new');
            
            if (buttonsGrid && modalContent) {
                const handleScroll = () => {
                    const scrollTop = modalContent.scrollTop;
                    const shouldStick = scrollTop > 50;
                    
                    if (shouldStick) {
                        buttonsGrid.classList.add('sticky');
                    } else {
                        buttonsGrid.classList.remove('sticky');
                    }
                };
                
                modalContent.addEventListener('scroll', handleScroll);
                
                // تنظيف عند إغلاق المودال
                closeBtn.addEventListener('click', () => {
                    modalContent.removeEventListener('scroll', handleScroll);
                });
                
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modalContent.removeEventListener('scroll', handleScroll);
                    }
                });
            }
        }, 100);

        // حفظ الاختبار
        modal.querySelector('#save-exam').addEventListener('click', async () => {
            const name = modal.querySelector('#exam-name').value.trim();
            const description = modal.querySelector('#exam-description').value.trim();
            const subjectId = modal.querySelector('#exam-subject').value;
            const duration = parseInt(modal.querySelector('#exam-duration').value) || 60;
            const totalPoints = parseInt(modal.querySelector('#exam-total-points').value) || 100;
            const status = modal.querySelector('#exam-status').value;
            const publishDate = modal.querySelector('#exam-publish-date').value;
            const isPublished = status === 'published';
            
            // جمع المجموعات المحددة
            const selectedGroups = {};
            modal.querySelectorAll('input[name="groups"]:checked').forEach(checkbox => {
                selectedGroups[checkbox.value] = true;
            });
            
            // جمع الأسئلة
            const questions = this.collectQuestions(questionsContainer);
            
            if (!name) {
                this.showToast('يرجى إدخال اسم الاختبار', 'error');
                return;
            }
            
            if (Object.keys(questions).length === 0) {
                this.showToast('يرجى إضافة سؤال واحد على الأقل', 'error');
                return;
            }
            
            const saveBtn = modal.querySelector('#save-exam');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            
            try {
                const examData = {
                    name: name,
                    description: description,
                    subjectId: subjectId || null,
                    duration: duration,
                    totalPoints: totalPoints,
                    isPublished: isPublished,
                    publishDate: publishDate ? new Date(publishDate).getTime() : null,
                    groups: selectedGroups,
                    questions: questions,
                    updatedAt: Date.now(),
                    updatedBy: 'admin'
                };
                
                if (isNew) {
                    examData.createdAt = Date.now();
                    examData.createdBy = 'admin';
                    const newRef = push(ref(database, 'exams'));
                    await set(newRef, examData);
                    this.showToast('تم إنشاء الاختبار بنجاح', 'success');
                } else {
                    await update(ref(database, `exams/${key}`), examData);
                    this.showToast('تم تحديث الاختبار بنجاح', 'success');
                }
                
                // إعادة تحميل العرض
                setTimeout(() => {
                    closeModal();
                    if (window.refreshExamsGrid) {
                        window.refreshExamsGrid();
                    }
                }, 1000);
                
            } catch (error) {
                console.error('❌ خطأ في حفظ الاختبار:', error);
                this.showToast('حدث خطأ أثناء الحفظ: ' + error.message, 'error');
                
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> ' + (isNew ? 'إنشاء' : 'حفظ');
            }
        });
        
        // حذف الاختبار
        if (!isNew) {
            modal.querySelector('#delete-exam-btn').addEventListener('click', async () => {
                if (!confirm(`هل أنت متأكد من حذف الاختبار "${exam.name}"؟`)) return;
                
                try {
                    await remove(ref(database, `exams/${key}`));
                    this.showToast('تم حذف الاختبار بنجاح', 'success');
                    
                    setTimeout(() => {
                        closeModal();
                        if (window.refreshExamsGrid) {
                            window.refreshExamsGrid();
                        }
                    }, 1000);
                } catch (error) {
                    console.error('❌ خطأ في حذف الاختبار:', error);
                    this.showToast('حدث خطأ أثناء الحذف', 'error');
                }
            });
        }
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    // ==================== دوال الأسئلة ====================
    addMultipleChoiceQuestion: function(container) {
        const questionId = 'q' + Date.now();
        const questionHTML = `
    <div class="question-item mc-question" data-id="${questionId}" data-type="mc">
        <div class="question-header">
            <span class="question-number">0</span>
            <i class="fas fa-list-ol question-type-icon"></i>
            <h4>سؤال اختيارات</h4>
            <button type="button" class="btn danger delete-question">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
        
        <input type="hidden" class="question-order" value="0">
        
        <div class="form-group">
            <label>نص السؤال</label>
            <textarea class="question-text" rows="2" placeholder="اكتب نص السؤال هنا..."></textarea>
        </div>
        
        <div class="form-row">
            <div class="half">
                <label>الدرجة</label>
                <input type="number" class="question-points" value="1" min="0.5" step="0.5">
            </div>
            <div class="half">
                <label>عدد الخيارات</label>
                <select class="options-count" onchange="examsUtils.updateOptionsCount('${questionId}', this.value)">
                    <option value="4" selected>4 خيارات</option>
                    <option value="3">3 خيارات</option>
                    <option value="5">5 خيارات</option>
                </select>
            </div>
        </div>
        
        <div class="options-container" id="options-${questionId}">
            <div class="option-row">
                <label class="option-label">
                    <input type="radio" name="correct-${questionId}" value="0" checked>
                    <span>الخيار الصحيح</span>
                </label>
                <input type="text" class="option-text" placeholder="النص الأول">
            </div>
            <div class="option-row">
                <label class="option-label">
                    <input type="radio" name="correct-${questionId}" value="1">
                    <span>خيار</span>
                </label>
                <input type="text" class="option-text" placeholder="النص الثاني">
            </div>
            <div class="option-row">
                <label class="option-label">
                    <input type="radio" name="correct-${questionId}" value="2">
                    <span>خيار</span>
                </label>
                <input type="text" class="option-text" placeholder="النص الثالث">
            </div>
            <div class="option-row">
                <label class="option-label">
                    <input type="radio" name="correct-${questionId}" value="3">
                    <span>خيار</span>
                </label>
                <input type="text" class="option-text" placeholder="النص الرابع">
                </div>
        </div>
    </div>`;

        container.insertAdjacentHTML('beforeend', questionHTML);
        
        // إخفاء رسالة عدم وجود أسئلة
        this.toggleNoQuestionsMessage(container);
        
        // إعادة ترقيم الأسئلة
        this.renumberAllQuestions(container);
        
        // إضافة حدث لحذف السؤال
        const questionElement = container.querySelector(`[data-id="${questionId}"]`);
        questionElement.querySelector('.delete-question').addEventListener('click', () => {
            questionElement.remove();
            this.renumberAllQuestions(container);
            this.toggleNoQuestionsMessage(container);
        });
        
        // إضافة حدث لتحديث عدد الخيارات
        const optionsCountSelect = questionElement.querySelector('.options-count');
        optionsCountSelect.addEventListener('change', () => {
            this.updateOptionsCount(questionId, optionsCountSelect.value);
        });
    },
    
    addTrueFalseQuestion: function(container) {
        const questionId = 'q' + Date.now();
        const questionHTML = `
            <div class="question-item tf-question" data-id="${questionId}" data-type="tf">
                <div class="question-header">
                    <span class="question-number">0</span>
                    <i class="fas fa-check-circle question-type-icon"></i>
                    <h4>سؤال صح/خطأ</h4>
                    <button type="button" class="btn danger delete-question">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
                
                <input type="hidden" class="question-order" value="0">
                
                <div class="form-group">
                    <label>نص السؤال</label>
                    <textarea class="question-text" rows="2" placeholder="اكتب الجملة هنا..."></textarea>
                </div>
                
                <div class="form-row">
                    <div class="half">
                        <label>الدرجة</label>
                        <input type="number" class="question-points" value="1" min="0.5" step="0.5">
                    </div>
                    <div class="half">
                        <label>الإجابة الصحيحة</label>
                        <select class="correct-answer">
                            <option value="true">صح</option>
                            <option value="false">خطأ</option>
                        </select>
                    </div>
                </div>
            </div>`;
        
        container.insertAdjacentHTML('beforeend', questionHTML);
        
        // إخفاء رسالة عدم وجود أسئلة
        this.toggleNoQuestionsMessage(container);
        
        // إعادة ترقيم الأسئلة
        this.renumberAllQuestions(container);
        
        // إضافة حدث لحذف السؤال
        const questionElement = container.querySelector(`[data-id="${questionId}"]`);
        questionElement.querySelector('.delete-question').addEventListener('click', () => {
            questionElement.remove();
            this.renumberAllQuestions(container);
            this.toggleNoQuestionsMessage(container);
        });
    },
    
    addFillBlankQuestion: function(container) {
        const questionId = 'q' + Date.now();
        const questionHTML = `
    <div class="question-item fb-question" data-id="${questionId}" data-type="fb">
        <div class="question-header">
            <span class="question-number">0</span>
            <i class="fas fa-edit question-type-icon"></i>
            <h4>سؤال أكمل</h4>
            <button type="button" class="btn danger delete-question">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
        
        <input type="hidden" class="question-order" value="0">
        
        <div class="form-group">
            <label>نص السؤال (استخدم _____ للفراغ)</label>
            <textarea class="question-text" rows="2" placeholder="مثال: عاصمة مصر هي _____"></textarea>
        </div>
        
        <div class="form-row">
            <div class="half">
                <label>الدرجة</label>
                <input type="number" class="question-points" value="1" min="0.5" step="0.5">
            </div>
            <div class="half">
                <label>عدد الفراغات</label>
                <input type="number" class="blanks-count" value="1" min="1" max="5">
            </div>
        </div>
        
        <div class="blanks-container" id="blanks-${questionId}">
            <div class="blank-row">
                <label>الإجابة الصحيحة للفراغ 1</label>
                <input type="text" class="blank-answer" placeholder="أدخل الإجابة الصحيحة">
            </div>
        </div>
    </div>`;
        
        container.insertAdjacentHTML('beforeend', questionHTML);
        
        // إخفاء رسالة عدم وجود أسئلة
        this.toggleNoQuestionsMessage(container);
        
        // إعادة ترقيم الأسئلة
        this.renumberAllQuestions(container);
        
        // إضافة حدث لحذف السؤال
        const questionElement = container.querySelector(`[data-id="${questionId}"]`);
        questionElement.querySelector('.delete-question').addEventListener('click', () => {
            questionElement.remove();
            this.renumberAllQuestions(container);
            this.toggleNoQuestionsMessage(container);
        });
        
        // تحديث عدد الفراغات
        const blanksCountInput = questionElement.querySelector('.blanks-count');
        blanksCountInput.addEventListener('change', () => {
            this.updateBlanksCount(questionId, blanksCountInput.value);
        });
    },
    
    updateOptionsCount: function(questionId, count) {
        const container = document.getElementById(`options-${questionId}`);
        if (!container) return;
        
        const currentCount = container.querySelectorAll('.option-row').length;
        count = parseInt(count);
        
        if (count > currentCount) {
            // إضافة خيارات جديدة
            for (let i = currentCount; i < count; i++) {
                const optionHTML = `
                    <div class="option-row">
                        <label class="option-label">
                            <input type="radio" name="correct-${questionId}" value="${i}">
                            <span>خيار</span>
                        </label>
                        <input type="text" class="option-text" placeholder="النص ${i + 1}">
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', optionHTML);
            }
        } else if (count < currentCount) {
            // حذف الخيارات الزائدة
            const rows = container.querySelectorAll('.option-row');
            for (let i = currentCount - 1; i >= count; i--) {
                rows[i].remove();
            }
        }
    },
    
    updateBlanksCount: function(questionId, count) {
        const container = document.getElementById(`blanks-${questionId}`);
        if (!container) return;
        
        const currentCount = container.querySelectorAll('.blank-row').length;
        count = parseInt(count);
        
        if (count > currentCount) {
            // إضافة فراغات جديدة
            for (let i = currentCount; i < count; i++) {
                const blankHTML = `
                    <div class="blank-row">
                        <label>الإجابة الصحيحة للفراغ ${i + 1}</label>
                        <input type="text" class="blank-answer" placeholder="أدخل الإجابة الصحيحة">
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', blankHTML);
            }
        } else if (count < currentCount) {
            // حذف الفراغات الزائدة
            const rows = container.querySelectorAll('.blank-row');
            for (let i = currentCount - 1; i >= count; i--) {
                rows[i].remove();
            }
        }
    },
    
    collectQuestions: function(container) {
        const questions = {};
        const questionElements = container.querySelectorAll('.question-item');
        
        questionElements.forEach((questionEl, index) => {
            const questionId = questionEl.dataset.id || `q${Date.now()}_${index}`;
            const type = questionEl.dataset.type;
            const text = questionEl.querySelector('.question-text').value.trim();
            const points = parseFloat(questionEl.querySelector('.question-points').value) || 1;
            const order = index + 1;
            
            if (!text) return;
            
            const question = {
                text: text,
                type: type,
                points: points,
                order: order
            };
            
            switch(type) {
                case 'mc':
                    const options = [];
                    let correctIndex = 0;
                    questionEl.querySelectorAll('.option-row').forEach((row, optIndex) => {
                        const optionText = row.querySelector('.option-text').value.trim();
                        if (optionText) {
                            options.push(optionText);
                            if (row.querySelector('input[type="radio"]').checked) {
                                correctIndex = optIndex;
                            }
                        }
                    });
                    question.options = options;
                    question.correctIndex = correctIndex;
                    break;
                    
                case 'tf':
                    const correctAnswer = questionEl.querySelector('.correct-answer').value;
                    question.correctAnswer = correctAnswer === 'true';
                    break;
                    
                case 'fb':
                    const blanks = [];
                    questionEl.querySelectorAll('.blank-answer').forEach((input, blankIndex) => {
                        const answer = input.value.trim();
                        if (answer) {
                            blanks.push({
                                index: blankIndex,
                                correctAnswer: answer
                            });
                        }
                    });
                    question.blanks = blanks;
                    break;
            }
            
            questions[questionId] = question;
        });
        
        return questions;
    },
    
    renderQuestionHTML: function(questionId, question, index) {
        let html = '';
        
        switch(question.type) {
            case 'mc':
                let optionsHTML = '';
                question.options.forEach((option, optIndex) => {
                    optionsHTML += `
                        <div class="option-row">
                            <label class="option-label">
                                <input type="radio" name="correct-${questionId}" value="${optIndex}" ${optIndex === question.correctIndex ? 'checked' : ''}>
                                <span>${optIndex === question.correctIndex ? 'الخيار الصحيح' : 'خيار'}</span>
                            </label>
                            <input type="text" class="option-text" value="${option}">
                        </div>
                    `;
                });
                
                html = `
                    <div class="question-item mc-question" data-id="${questionId}" data-type="mc">
                        <div class="question-header">
                            <span class="question-number">${index + 1}</span>
                            <i class="fas fa-list-ol question-type-icon"></i>
                            <h4>سؤال اختيارات</h4>
                            <button type="button" class="btn danger delete-question">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                        
                        <input type="hidden" class="question-order" value="${index + 1}">
                        
                        <div class="form-group">
                            <label>نص السؤال</label>
                            <textarea class="question-text" rows="2">${question.text}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="half">
                                <label>الدرجة</label>
                                <input type="number" class="question-points" value="${question.points}">
                            </div>
                            <div class="half">
                                <label>عدد الخيارات</label>
                                <select class="options-count" onchange="examsUtils.updateOptionsCount('${questionId}', this.value)">
                                    <option value="3" ${question.options.length === 3 ? 'selected' : ''}>3 خيارات</option>
                                    <option value="4" ${question.options.length === 4 ? 'selected' : ''}>4 خيارات</option>
                                    <option value="5" ${question.options.length === 5 ? 'selected' : ''}>5 خيارات</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="options-container" id="options-${questionId}">
                            ${optionsHTML}
                        </div>
                    </div>
                `;
                break;
                
            case 'tf':
                html = `
                    <div class="question-item tf-question" data-id="${questionId}" data-type="tf">
                        <div class="question-header">
                            <span class="question-number">${index + 1}</span>
                            <i class="fas fa-check-circle question-type-icon"></i>
                            <h4>سؤال صح/خطأ</h4>
                            <button type="button" class="btn danger delete-question">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                        
                        <input type="hidden" class="question-order" value="${index + 1}">
                        
                        <div class="form-group">
                            <label>نص السؤال</label>
                            <textarea class="question-text" rows="2">${question.text}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="half">
                                <label>الدرجة</label>
                                <input type="number" class="question-points" value="${question.points}">
                            </div>
                            <div class="half">
                                <label>الإجابة الصحيحة</label>
                                <select class="correct-answer">
                                    <option value="true" ${question.correctAnswer === true ? 'selected' : ''}>صح</option>
                                    <option value="false" ${question.correctAnswer === false ? 'selected' : ''}>خطأ</option>
                                </select>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'fb':
                let blanksHTML = '';
                question.blanks.forEach((blank, blankIndex) => {
                    blanksHTML += `
                        <div class="blank-row">
                            <label>الإجابة الصحيحة للفراغ ${blankIndex + 1}</label>
                            <input type="text" class="blank-answer" value="${blank.correctAnswer}">
                        </div>
                    `;
                });
                
                html = `
                    <div class="question-item fb-question" data-id="${questionId}" data-type="fb">
                        <div class="question-header">
                            <span class="question-number">${index + 1}</span>
                            <i class="fas fa-edit question-type-icon"></i>
                            <h4>سؤال أكمل</h4>
                            <button type="button" class="btn danger delete-question">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                        
                        <input type="hidden" class="question-order" value="${index + 1}">
                        
                        <div class="form-group">
                            <label>نص السؤال (استخدم _____ للفراغ)</label>
                            <textarea class="question-text" rows="2">${question.text}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="half">
                                <label>الدرجة</label>
                                <input type="number" class="question-points" value="${question.points}">
                            </div>
                            <div class="half">
                                <label>عدد الفراغات</label>
                                <input type="number" class="blanks-count" value="${question.blanks.length}">
                            </div>
                        </div>
                        
                        <div class="blanks-container" id="blanks-${questionId}">
                            ${blanksHTML}
                        </div>
                    </div>
                `;
                break;
        }
        
        return html;
    },
    
    renumberAllQuestions: function(container) {
        const questions = container.querySelectorAll('.question-item');
        questions.forEach((item, index) => {
            const numberElement = item.querySelector('.question-number');
            if (numberElement) {
                numberElement.textContent = index + 1;
            }
            
            const orderInput = item.querySelector('.question-order');
            if (orderInput) {
                orderInput.value = index + 1;
            }
        });
    },
    
    toggleNoQuestionsMessage: function(container) {
        const noQuestionsMessage = container.querySelector('#no-questions-message');
        if (!noQuestionsMessage) return;
        
        const hasQuestions = container.querySelectorAll('.question-item').length > 0;
        
        if (hasQuestions) {
            noQuestionsMessage.style.display = 'none';
        } else {
            noQuestionsMessage.style.display = 'block';
        }
    }
};

// تصدير الدوال
export default examsUtils;

// جعل الدوال متاحة عالمياً
window.examsUtils = examsUtils;

console.log('✅ تم تحميل exams.js بنجاح');