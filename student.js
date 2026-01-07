// ==================== نظام صفحة الطالب ====================
console.log('🎓 تحميل نظام الطالب...');

// ==================== تهيئة صفحة الطالب ====================
function initStudentPage() {
    console.log('🎓 تهيئة صفحة الطالب...');
    
    // إضافة محتوى إضافي هنا لصفحة الطالب
    const studentContent = document.querySelector('.student-content');
    if (studentContent) {
        studentContent.innerHTML += `
            <div class="coming-soon">
                <i class="fas fa-cogs"></i>
                <h3 data-i18n="student.comingSoon.title">قيد التطوير</h3>
                <p data-i18n="student.comingSoon.message">هذه الصفحة قيد التطوير، وسيتم إضافة الميزات قريباً</p>
            </div>
        `;
    }
    
    console.log('✅ تم تهيئة صفحة الطالب بنجاح');
}

// ==================== تهيئة النظام عند التحميل ====================
document.addEventListener('DOMContentLoaded', function() {
    // إذا كنا في صفحة الطالب، نبدأ التهيئة
    if (window.location.pathname.includes('student.html')) {
        setTimeout(() => {
            initStudentPage();
        }, 1000);
    }
});