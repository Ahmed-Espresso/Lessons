// attendance.js - الإصدار المحسن للتصميم
import { auth, database } from "./app.js";
import { ref, set, update, remove, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== دوال مساعدة ====================
const attendanceUtils = {
    showToast: function(message, type = 'success') {
        // استخدام نظام الإشعارات الموحد من admin.js فقط
        if (typeof window.showAdminToast === 'function') {
            window.showAdminToast(message, type);
        } else if (window.adminUtils && typeof window.adminUtils.showToast === 'function') {
            window.adminUtils.showToast(message, type);
        } else {
            console.log(`${type}: ${message}`);
            // استخدام نظام الإشعارات من admin.js إذا كان متاحاً
            const toast = document.getElementById('global-toast');
            if (toast) {
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
                
                toast.textContent = message;
                toast.style.backgroundColor = bgColor;
                toast.style.color = textColor;
                toast.classList.add('visible');
                
                setTimeout(() => {
                    toast.classList.remove('visible');
                }, 4000);
            }
        }
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
    
    formatDateShort: function(timestamp) {
        if (!timestamp) return 'غير محدد';
        const date = new Date(timestamp);
        return date.toLocaleDateString('ar-SA');
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==================== قسم حضور وغياب الطلاب ====================
export function loadAttendanceSection() {
    const dynamicContent = document.getElementById('dynamic-section-content');
    if (!dynamicContent) return;
    
    dynamicContent.innerHTML = `
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
            
            <!-- فلاتر البحث - مصممة بحيث تكون كل اثنين في سطر -->
            <div class="attendance-filters-combo">
                <div class="combo-filters-wrapper">
                    <select id="attendance-group-filter" class="combo-filter-select combo-filter-right">
                        <option value="">جميع المجموعات</option>
                    </select>
                    <select id="attendance-lecture-filter" class="combo-filter-select combo-filter-left">
                        <option value="">جميع المحاضرات</option>
                    </select>
                </div>
                <div class="combo-filters-wrapper">
                    <select id="attendance-student-filter" class="combo-filter-select combo-filter-right">
                        <option value="">جميع الطلاب</option>
                    </select>
                    <select id="attendance-status-filter" class="combo-filter-select combo-filter-left">
                        <option value="">جميع الحالات</option>
                        <option value="present">حاضر</option>
                        <option value="absent">غائب</option>
                        <option value="excused">معذور</option>
                        <option value="late">متأخر</option>
                    </select>
                </div>
            </div>
            
            <!-- شبكة المحاضرات - تم تغيير ID -->
            <div id="attendance-lectures-grid" class="attendance-lectures-grid">
                <!-- ستظهر البطاقات هنا -->
            </div>
        </div>
    `;
    
    // تحميل CSS الخاص بالقسم
    loadAttendanceCSS();
    
    // تهيئة قسم الحضور والغياب
    initAttendanceSection();
}

// ==================== تحميل CSS الخاص بالقسم ====================
function loadAttendanceCSS() {
    // إذا كان هناك رابط CSS موجود بالفعل، لا نضيفه مرة أخرى
    if (document.querySelector('link[href*="attendance.css"]')) {
        return;
    }
    
    // إنشاء رابط لملف CSS منفصل
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'attendance.css';
    document.head.appendChild(link);
}

// ==================== تهيئة قسم الحضور والغياب ====================
function initAttendanceSection() {
    // متغيرات للبيانات
    let allLectures = {};
    let allGroups = {};
    let allStudents = {};
    let allAttendance = {};
    
    // تحميل جميع البيانات
    loadAllAttendanceData();
    
    function loadAllAttendanceData() {
        // تحميل المحاضرات
        const lecturesRef = ref(database, 'lectures');
        onValue(lecturesRef, (snapshot) => {
            allLectures = snapshot.val() || {};
            
            // تحميل المجموعات
            const groupsRef = ref(database, 'groups');
            onValue(groupsRef, (groupsSnapshot) => {
                allGroups = groupsSnapshot.val() || {};
                
                // تحميل الطلاب
                const usersRef = ref(database, 'users');
                onValue(usersRef, (usersSnapshot) => {
                    allStudents = usersSnapshot.val() || {};
                    
                    // تحميل سجلات الحضور
                    const attendanceRef = ref(database, 'attendance');
                    onValue(attendanceRef, (attendanceSnapshot) => {
                        allAttendance = attendanceSnapshot.val() || {};
                        
                        // تهيئة الفلاتر
                        initializeAttendanceFilters();
                        
                        // عرض المحاضرات
                        renderAttendanceLectures();
                        
                        // تحديث الإحصائيات
                        updateAttendanceStats();
                    });
                });
            });
        }, (error) => {
            console.error('❌ خطأ في تحميل بيانات الحضور:', error);
            attendanceUtils.showToast('خطأ في تحميل بيانات الحضور', 'error');
        });
    }
    
    function initializeAttendanceFilters() {
        // فلتر المجموعات
        const groupFilter = document.getElementById('attendance-group-filter');
        if (groupFilter) {
            groupFilter.innerHTML = '<option value="">جميع المجموعات</option>';
            Object.entries(allGroups).forEach(([groupId, group]) => {
                const groupName = group.name ? 
                    (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 
                    'بدون اسم';
                groupFilter.innerHTML += `<option value="${groupId}">${groupName}</option>`;
            });
            
            groupFilter.addEventListener('change', function() {
                renderAttendanceLectures();
            });
        }
        
        // فلتر المحاضرات
        const lectureFilter = document.getElementById('attendance-lecture-filter');
        if (lectureFilter) {
            lectureFilter.innerHTML = '<option value="">جميع المحاضرات</option>';
            Object.entries(allLectures).forEach(([lectureId, lecture]) => {
                const lectureTitle = lecture.title || 'بدون عنوان';
                lectureFilter.innerHTML += `<option value="${lectureId}">${lectureTitle}</option>`;
            });
            
            lectureFilter.addEventListener('change', function() {
                renderAttendanceLectures();
            });
        }
        
        // فلتر الطلاب
        const studentFilter = document.getElementById('attendance-student-filter');
        if (studentFilter) {
            studentFilter.innerHTML = '<option value="">جميع الطلاب</option>';
            Object.entries(allStudents).forEach(([userId, user]) => {
                if (user.role === 'student') {
                    const studentName = user.name || user.email || 'طالب غير معروف';
                    studentFilter.innerHTML += `<option value="${userId}">${studentName}</option>`;
                }
            });
            
            studentFilter.addEventListener('change', function() {
                renderAttendanceLectures();
            });
        }
        
        // فلتر الحالة
        const statusFilter = document.getElementById('attendance-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                renderAttendanceLectures();
            });
        }
    }
    
    function renderAttendanceLectures() {
        const container = document.getElementById('attendance-lectures-grid');
        if (!container) return;
        
        // تطبيق الفلاتر
        const selectedGroup = document.getElementById('attendance-group-filter')?.value || '';
        const selectedLecture = document.getElementById('attendance-lecture-filter')?.value || '';
        const selectedStudent = document.getElementById('attendance-student-filter')?.value || '';
        const selectedStatus = document.getElementById('attendance-status-filter')?.value || '';
        
        let filteredLectures = {};
        
        Object.entries(allLectures).forEach(([lectureId, lecture]) => {
            // فلتر المحاضرة المحددة
            if (selectedLecture && lectureId !== selectedLecture) return;
            
            // فلتر المجموعات
            if (selectedGroup && (!lecture.groups || !lecture.groups[selectedGroup])) return;
            
            filteredLectures[lectureId] = lecture;
        });
        
        // إذا لم توجد محاضرات
        if (Object.keys(filteredLectures).length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-clipboard-check"></i>
                    <span data-i18n="admin.attendance.noLectures">لا توجد محاضرات تطابق معايير البحث</span>
                </div>
            `;
            return;
        }
        
        // عرض المحاضرات
        displayAttendanceLectures(filteredLectures, selectedStudent, selectedStatus);
    }
    
    function displayAttendanceLectures(lectures, selectedStudent, selectedStatus) {
        const container = document.getElementById('attendance-lectures-grid');
        if (!container) return;
        
        let html = '';
        let lectureCount = 0;
        
        Object.entries(lectures).forEach(([lectureId, lecture]) => {
            const lectureDate = attendanceUtils.formatDateShort(lecture.date);
            const lectureTime = lecture.time || '';
            const lectureGroups = lecture.groups || {};
            
            // جمع الطلاب من المجموعات المخصصة للمحاضرة
            const lectureStudents = getLectureStudents(lectureId, lecture);
            
            // فلتر الطلاب المحدد
            let filteredStudents = lectureStudents;
            if (selectedStudent) {
                filteredStudents = lectureStudents.filter(student => student.userId === selectedStudent);
            }
            
            // الحصول على سجلات الحضور لهذه المحاضرة
            const lectureAttendance = allAttendance[lectureId] || {};
            
            // فلتر حالة الحضور
            if (selectedStatus) {
                filteredStudents = filteredStudents.filter(student => {
                    return lectureAttendance[student.userId] === selectedStatus;
                });
            }
            
            if (filteredStudents.length === 0 && selectedStudent) return;
            
            // حساب إحصائيات المحاضرة
            const stats = calculateLectureAttendanceStats(lectureId, lectureStudents);
            
            // تحديد فئة الصف (زوجي أو فردي) للتصميم
            const isEven = lectureCount % 2 === 0;
            
            html += `
                <div class="attendance-lecture-card ${isEven ? 'even' : 'odd'}" data-lecture-id="${lectureId}">
                    <div class="attendance-lecture-header">
                        <div class="attendance-lecture-title">
                            <i class="fas fa-chalkboard-teacher"></i>
                            ${lecture.title || 'بدون عنوان'}
                        </div>
                        <div class="attendance-lecture-meta">
                            <span class="attendance-lecture-date">
                                <i class="fas fa-calendar"></i> ${lectureDate}
                            </span>
                            ${lectureTime ? `
                                <span class="attendance-lecture-time">
                                    <i class="fas fa-clock"></i> ${lectureTime}
                                </span>
                            ` : ''}
                            <span class="attendance-lecture-groups">
                                <i class="fas fa-users"></i> ${Object.keys(lectureGroups).length} مجموعة
                            </span>
                            <span class="attendance-lecture-students">
                                <i class="fas fa-user-graduate"></i> ${lectureStudents.length} طالب
                            </span>
                        </div>
                    </div>
                    
                    <div class="attendance-lecture-stats">
                        <div class="attendance-stat-item">
                            <span class="attendance-stat-label">الحاضرون:</span>
                            <span class="attendance-stat-value present">${stats.present}</span>
                        </div>
                        <div class="attendance-stat-item">
                            <span class="attendance-stat-label">الغائبون:</span>
                            <span class="attendance-stat-value absent">${stats.absent}</span>
                        </div>
                        <div class="attendance-stat-item">
                            <span class="attendance-stat-label">المتأخرون:</span>
                            <span class="attendance-stat-value late">${stats.late}</span>
                        </div>
                        <div class="attendance-stat-item">
                            <span class="attendance-stat-label">المعذورون:</span>
                            <span class="attendance-stat-value excused">${stats.excused}</span>
                        </div>
                        <div class="attendance-stat-item total">
                            <span class="attendance-stat-label">الكل:</span>
                            <span class="attendance-stat-value">${stats.total}</span>
                        </div>
                        <div class="attendance-stat-item rate">
                            <span class="attendance-stat-label">النسبه:</span>
                            <span class="attendance-stat-value">${stats.rate}%</span>
                        </div>
                    </div>
                    
                    <div class="attendance-lecture-actions">
                        <button class="attendance-action-btn take-attendance" onclick="openAttendanceModalNow('${lectureId}')">
                            <i class="fas fa-edit"></i>
                            <span>تسجيل الحضور</span>
                        </button>
                    </div>
                </div>
            `;
            
            lectureCount++;
        });
        
        container.innerHTML = html || `
            <div class="no-data">
                <i class="fas fa-clipboard-check"></i>
                <span data-i18n="admin.attendance.noRecords">لا توجد سجلات حضور تطابق معايير البحث</span>
            </div>
        `;
    }
    
    function calculateLectureAttendanceStats(lectureId, students) {
        const lectureAttendance = allAttendance[lectureId] || {};
        let present = 0, absent = 0, late = 0, excused = 0;
        
        students.forEach(student => {
            const status = lectureAttendance[student.userId];
            switch(status) {
                case 'present': present++; break;
                case 'absent': absent++; break;
                case 'late': late++; break;
                case 'excused': excused++; break;
                default: absent++; break;
            }
        });
        
        return {
            present,
            absent,
            late,
            excused,
            total: students.length,
            rate: students.length > 0 ? Math.round((present / students.length) * 100) : 0
        };
    }
    
    function getLectureStudents(lectureId, lecture) {
        const students = [];
        const lectureGroups = lecture.groups || {};
        
        Object.keys(lectureGroups).forEach(groupId => {
            const group = allGroups[groupId];
            if (!group || !group.students) return;
            
            Object.keys(group.students).forEach(userId => {
                const student = allStudents[userId];
                if (!student || student.role !== 'student') return;
                
                students.push({
                    userId,
                    name: student.name || student.email || 'طالب غير معروف',
                    email: student.email || '',
                    groupId,
                    groupName: group.name ? 
                        (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 
                        'بدون اسم'
                });
            });
        });
        
        return students;
    }
    
    function updateAttendanceStats() {
        let totalLectures = Object.keys(allLectures).length;
        let totalPresent = 0, totalAbsent = 0, totalRecords = 0;
        
        // حساب الإحصائيات الإجمالية
        Object.entries(allAttendance).forEach(([lectureId, attendance]) => {
            const lecture = allLectures[lectureId];
            if (!lecture) return;
            
            const students = getLectureStudents(lectureId, lecture);
            students.forEach(student => {
                const status = attendance[student.userId];
                if (status === 'present') totalPresent++;
                else if (status === 'absent') totalAbsent++;
                if (status) totalRecords++;
            });
        });
        
        // تحديث الإحصائيات
        document.getElementById('total-lectures').textContent = totalLectures;
        document.getElementById('total-present').textContent = totalPresent;
        document.getElementById('total-absent').textContent = totalAbsent;
        
        const attendanceRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
        document.getElementById('attendance-rate').textContent = attendanceRate + '%';
    }
}

// ==================== فتح مودال تسجيل الحضور ====================
export function openAttendanceModal(lectureId) {
    console.log('📝 تسجيل حضور للمحاضرة:', lectureId);
    
    // البحث في البيانات المحملة
    get(ref(database, `lectures/${lectureId}`)).then((lectureSnapshot) => {
        const lecture = lectureSnapshot.val();
        if (!lecture) {
            attendanceUtils.showToast('المحاضرة غير موجودة', 'error');
            return;
        }
        
        // تحميل بيانات المجموعات
        return get(ref(database, 'groups')).then((groupsSnapshot) => {
            const groups = groupsSnapshot.val() || {};
            
            // تحميل بيانات المستخدمين
            return get(ref(database, 'users')).then((usersSnapshot) => {
                const users = usersSnapshot.val() || {};
                
                // تحميل سجلات الحضور الحالية (بما في ذلك الملاحظات)
                return get(ref(database, `attendance/${lectureId}`)).then((attendanceSnapshot) => {
                    const attendanceData = attendanceSnapshot.val() || {};
                    
                    // فصل بيانات الحضور عن الملاحظات
                    const attendance = {};
                    let savedNotes = '';
                    
                    Object.keys(attendanceData).forEach(key => {
                        if (key === '_notes') {
                            savedNotes = attendanceData[key] || '';
                        } else if (key !== '_lectureId' && key !== '_timestamp' && key !== '_updatedBy') {
                            attendance[key] = attendanceData[key];
                        } else if (key === '_timestamp' || key === '_updatedBy') {
                            // تجاهل الحقول الوصفية
                        }
                    });
                    
                    // عرض مودال تسجيل الحضور مع الملاحظات المحفوظة
                    showAttendanceModal(lectureId, lecture, groups, users, attendance, savedNotes);
                });
            });
        });
    }).catch((error) => {
        console.error('❌ خطأ في تحميل بيانات تسجيل الحضور:', error);
        attendanceUtils.showToast('خطأ في تحميل بيانات تسجيل الحضور', 'error');
    });
}

// ==================== عرض المودال مع تفاصيل المحاضرة ====================
function showAttendanceModal(lectureId, lecture, groups, users, attendance, savedNotes = '') {
    const modalRoot = document.getElementById('userModalRoot');
    if (!modalRoot) return;
    
    modalRoot.style.display = 'block';
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    
    const lectureTitle = lecture.title || 'بدون عنوان';
    const lectureDate = attendanceUtils.formatDateShort(lecture.date);
    const lectureTime = lecture.time || '';
    const lectureGroups = lecture.groups || {};
    
    // جمع الطلاب من المجموعات المخصصة للمحاضرة
    const lectureStudents = [];
    
    Object.keys(lectureGroups).forEach(groupId => {
        const group = groups[groupId];
        if (!group || !group.students) return;
        
        Object.keys(group.students).forEach(userId => {
            const student = users[userId];
            if (!student || student.role !== 'student') return;
            
            const currentStatus = attendance[userId] || 'absent';
            
            lectureStudents.push({
                userId,
                name: student.name || student.email || 'طالب غير معروف',
                email: student.email || '',
                groupId,
                groupName: group.name ? 
                    (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 
                    'بدون اسم',
                currentStatus,
                newStatus: currentStatus
            });
        });
    });
    
    // تجميع الطلاب حسب المجموعات
    const studentsByGroup = {};
    lectureStudents.forEach(student => {
        if (!studentsByGroup[student.groupId]) {
            studentsByGroup[student.groupId] = {
                groupName: student.groupName,
                students: []
            };
        }
        studentsByGroup[student.groupId].students.push(student);
    });
    
    // بناء HTML للمجموعات والطلاب
    let groupsHTML = '';
    Object.entries(studentsByGroup).forEach(([groupId, groupData], groupIndex) => {
        let studentsHTML = '';
        
        groupData.students.forEach((student, studentIndex) => {
            const statusText = getStatusText(student.currentStatus);
            
            studentsHTML += `
                <div class="attendance-student-item" data-user-id="${student.userId}">
                    <div class="student-info">
                        <div class="student-avatar">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div class="student-details">
                            <div class="student-name">${student.name}</div>
                            <div class="student-email">${student.email}</div>
                        </div>
                    </div>
                    <div class="student-status-combo">
                        <select class="status-select combo-select-right" data-user-id="${student.userId}">
                            <option value="present" ${student.currentStatus === 'present' ? 'selected' : ''}>حاضر</option>
                            <option value="absent" ${student.currentStatus === 'absent' ? 'selected' : ''}>غائب</option>
                            <option value="late" ${student.currentStatus === 'late' ? 'selected' : ''}>متأخر</option>
                            <option value="excused" ${student.currentStatus === 'excused' ? 'selected' : ''}>معذور</option>
                        </select>
                        <div class="status-badge ${student.currentStatus}">
                            ${statusText}
                        </div>
                    </div>
                </div>
            `;
        });
        
        groupsHTML += `
            <div class="attendance-group-section">
                <div class="group-header">
                    <i class="fas fa-users"></i>
                    <h4>${groupData.groupName}</h4>
                    <span class="student-count">${groupData.students.length} طالب</span>
                </div>
                <div class="group-students">
                    ${studentsHTML}
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content-new attendance-modal" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h2><i class="fas fa-clipboard-check"></i> تسجيل حضور وغياب</h2>
                <button class="modal-close-unified">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <!-- معلومات المحاضرة -->
                <div class="attendance-lecture-info">
                    <div class="attendance-lecture-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div class="attendance-lecture-details">
                        <h3>${lectureTitle}</h3>
                        <!-- شبكة 4 في الصف دائماً -->
                        <div class="attendance-lecture-meta-details">
                            <span><i class="fas fa-calendar"></i> ${lectureDate}</span>
                            ${lectureTime ? `<span><i class="fas fa-clock"></i> ${lectureTime}</span>` : ''}
                            <span><i class="fas fa-users"></i> ${Object.keys(lectureGroups).length} مجموعة</span>
                            <span><i class="fas fa-user-graduate"></i> ${lectureStudents.length} طالب</span>
                        </div>
                    </div>
                </div>
                
                <!-- إحصائيات سريعة -->
                <div class="attendance-stats-summary">
                    <div class="stats-row">
                        <button type="button" class="stat-btn" onclick="setAllStatusTo('present')">
                            <i class="fas fa-check-circle"></i>
                            <span>تعيين الكل حاضرين</span>
                        </button>
                        <button type="button" class="stat-btn" onclick="setAllStatusTo('absent')">
                            <i class="fas fa-times-circle"></i>
                            <span>تعيين الكل غائبين</span>
                        </button>
                        <button type="button" class="stat-btn" onclick="setAllStatusTo('late')">
                            <i class="fas fa-clock"></i>
                            <span>تعيين الكل متأخرين</span>
                        </button>
                        <button type="button" class="stat-btn" onclick="setAllStatusTo('excused')">
                            <i class="fas fa-user-clock"></i>
                            <span>تعيين الكل معذورين</span>
                        </button>
                    </div>
                </div>
                
                <!-- قائمة الطلاب حسب المجموعات -->
                <div class="attendance-groups-container">
                    ${groupsHTML || `
                        <div class="no-students">
                            <i class="fas fa-user-graduate"></i>
                            <span>لا يوجد طلاب في هذه المحاضرة</span>
                        </div>
                    `}
                </div>
                
                <!-- ملاحظات -->
                <div class="attendance-notes-section">
                    <label for="attendance-notes">
                        <i class="fas fa-sticky-note"></i> ملاحظات (اختياري)
                    </label>
                    <textarea id="attendance-notes" rows="3" placeholder="اكتب ملاحظات حول الحضور والغياب...">${savedNotes}</textarea>
                </div>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="modal-btn save" id="save-attendance-btn">
                    <i class="fas fa-save"></i> حفظ الحضور
                </button>
            </div>
        </div>
    `;

    setupModalClose(modal, modalRoot);
    
    // تخزين البيانات في المودال للوصول إليها لاحقاً
    modal.dataset.lectureId = lectureId;
    modal.dataset.students = JSON.stringify(lectureStudents);
    modal.dataset.savedNotes = savedNotes;
    
    modalRoot.innerHTML = '';
    modalRoot.appendChild(modal);
    
    // إضافة حدث الحفظ إلى الزر
    setTimeout(() => {
        const saveButton = document.getElementById('save-attendance-btn');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                saveAttendanceData(lectureId);
            });
        }
        
        // إضافة أحداث لتحديث الحالة عند تغيير ال select
        const selects = modal.querySelectorAll('.status-select');
        selects.forEach(select => {
            select.addEventListener('change', function() {
                const userId = this.dataset.userId;
                const newStatus = this.value;
                
                // تحديث البيانات المخزنة
                let students = JSON.parse(modal.dataset.students || '[]');
                const studentIndex = students.findIndex(s => s.userId === userId);
                if (studentIndex !== -1) {
                    students[studentIndex].newStatus = newStatus;
                    modal.dataset.students = JSON.stringify(students);
                    
                    // تحديث عرض الحالة الحالية
                    const studentItem = this.closest('.attendance-student-item');
                    const currentStatusElement = studentItem.querySelector('.status-badge');
                    const statusText = getStatusText(newStatus);
                    
                    currentStatusElement.textContent = statusText;
                    currentStatusElement.className = `status-badge ${newStatus}`;
                }
            });
        });
    }, 100);
}

// ==================== دوال مساعدة ====================
function setupModalClose(modal, modalRoot) {
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
}

function getStatusText(status) {
    switch(status) {
        case 'present': return 'حاضر';
        case 'absent': return 'غائب';
        case 'late': return 'متأخر';
        case 'excused': return 'معذور';
        default: return 'غير محدد';
    }
}

// ==================== دالة حفظ البيانات (بما في ذلك الملاحظات) ====================
async function saveAttendanceData(lectureId) {
    console.log('💾 بدء عملية حفظ الحضور...');
    
    const modal = document.querySelector('.attendance-modal');
    if (!modal) {
        // استخدام نظام الإشعارات الموحد
        attendanceUtils.showToast('خطأ: لم يتم العثور على نافذة تسجيل الحضور', 'error');
        return;
    }
    
    // جمع البيانات مباشرة من عناصر الـselect في المودال
    const attendanceData = {};
    const selects = modal.querySelectorAll('.status-select');
    
    console.log(`👥 عدد عناصر الاختيار: ${selects.length}`);
    
    if (selects.length === 0) {
        attendanceUtils.showToast('لا توجد بيانات طلاب للحفظ', 'error');
        return;
    }
    
    // جمع بيانات كل طالب
    selects.forEach(select => {
        const userId = select.dataset.userId;
        const status = select.value;
        
        if (userId && status) {
            attendanceData[userId] = status;
            console.log(`✅ ${userId}: ${status}`);
        }
    });
    
    // التحقق من وجود بيانات
    if (Object.keys(attendanceData).length === 0) {
        attendanceUtils.showToast('لم يتم العثور على بيانات لحفظها', 'error');
        return;
    }
    
    // الحصول على الملاحظات
    const notesInput = modal.querySelector('#attendance-notes');
    const notes = notesInput ? notesInput.value.trim() : '';
    
    // إعداد البيانات النهائية
    const finalData = {
        ...attendanceData,
        _lectureId: lectureId,
        _timestamp: Date.now(),
        _updatedBy: auth.currentUser?.email || 'admin'
    };
    
    // إضافة الملاحظات إذا كانت موجودة
    if (notes) {
        finalData._notes = notes;
    } else if (modal.dataset.savedNotes) {
        // إذا كانت الملاحظات فارغة لكنها كانت محفوظة سابقاً، نترك الحقل للحفاظ على التوافق
        finalData._notes = '';
    }
    
    console.log('📊 بيانات الحضور النهائية:', finalData);
    
    try {
        console.log('🚀 جاري حفظ البيانات في قاعدة البيانات...');
        
        // حفظ في Firebase
        await set(ref(database, `attendance/${lectureId}`), finalData);
        
        console.log('🎉 تم حفظ الحضور بنجاح!');
        
        // استخدام نظام الإشعارات الموحد
        attendanceUtils.showToast('تم حفظ بيانات الحضور بنجاح!', 'success');
        
        // إغلاق المودال
        setTimeout(() => {
            const modalRoot = document.getElementById('userModalRoot');
            if (modalRoot) {
                modalRoot.innerHTML = '';
                modalRoot.style.display = 'none';
            }
            
            // تحديث قسم الحضور
            setTimeout(() => {
                if (typeof loadAttendanceSection === 'function') {
                    loadAttendanceSection();
                }
            }, 500);
            
        }, 1500);
        
    } catch (error) {
        console.error('❌ خطأ في حفظ الحضور:', error);
        
        // استخدام نظام الإشعارات الموحد
        attendanceUtils.showToast(`خطأ في الحفظ: ${error.message}`, 'error');
    }
}

// ==================== دوال عامة للاستدعاء من HTML ====================
window.openAttendanceModal = openAttendanceModal;

window.openAttendanceModalNow = function(lectureId) {
    console.log('🎯 فتح مودال الحضور للمحاضرة:', lectureId);
    openAttendanceModal(lectureId);
};

window.setAllStatusTo = function(status) {
    console.log('🎯 تعيين حالة جميع الطلاب إلى:', status);
    
    const modal = document.querySelector('.attendance-modal');
    if (!modal) return;
    
    // تحديث جميع عناصر الـselect
    const selects = modal.querySelectorAll('.status-select');
    selects.forEach(select => {
        select.value = status;
        
        // تحديث البيانات المخزنة
        const userId = select.dataset.userId;
        let students = JSON.parse(modal.dataset.students || '[]');
        const studentIndex = students.findIndex(s => s.userId === userId);
        if (studentIndex !== -1) {
            students[studentIndex].newStatus = status;
        }
        
        // تحديث عرض الحالة الحالية
        const studentItem = select.closest('.attendance-student-item');
        const currentStatusElement = studentItem.querySelector('.status-badge');
        if (currentStatusElement) {
            const statusText = getStatusText(status);
            currentStatusElement.textContent = statusText;
            currentStatusElement.className = `status-badge ${status}`;
        }
    });
    
    // تحديث البيانات المخزنة في المودال
    let students = JSON.parse(modal.dataset.students || '[]');
    students.forEach(student => {
        student.newStatus = status;
    });
    modal.dataset.students = JSON.stringify(students);
    
    // استخدام نظام الإشعارات الموحد
    attendanceUtils.showToast(`تم تعيين جميع الطلاب إلى حالة "${getStatusText(status)}"`, 'success');
};

window.closeAttendanceModal = function() {
    const modal = document.querySelector('.attendance-modal');
    const modalRoot = document.getElementById('userModalRoot');
    if (modal && modalRoot) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
            modalRoot.style.display = 'none';
        }, 300);
    }
};

// دالة تحديث قسم الحضور
window.refreshAttendanceView = function() {
    if (typeof loadAttendanceSection === 'function') {
        loadAttendanceSection();
    }
};

// تعريض الدالة للاستخدام من admin.js
window.attendanceUtils = attendanceUtils;