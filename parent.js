// ==================== نظام صفحة ولي الأمر ====================
console.log('👪 تحميل نظام ولي الأمر...');

// ==================== تهيئة صفحة ولي الأمر ====================
function initParentPage() {
    console.log('👪 تهيئة صفحة ولي الأمر...');
    
    // إضافة محتوى إضافي هنا لصفحة ولي الأمر
    const parentContent = document.querySelector('.parent-content');
    if (parentContent) {
        parentContent.innerHTML += `
            <div class="coming-soon">
                <i class="fas fa-cogs"></i>
                <h3 data-i18n="parent.comingSoon.title">قيد التطوير</h3>
                <p data-i18n="parent.comingSoon.message">هذه الصفحة قيد التطوير، وسيتم إضافة الميزات قريباً</p>
            </div>
        `;
    }
    
    console.log('✅ تم تهيئة صفحة ولي الأمر بنجاح');
}

// ==================== تهيئة النظام عند التحميل ====================
document.addEventListener('DOMContentLoaded', function() {
    // إذا كنا في صفحة ولي الأمر، نبدأ التهيئة
    if (window.location.pathname.includes('parent.html')) {
        setTimeout(() => {
            initParentPage();
        }, 1000);
    }
});