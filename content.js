// content.js 
// ==================== استيراد Firebase Functions ====================
import { database } from "./app.js";
import { ref, set, update, remove, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== تكوين Cloudinary المحدث ====================
const CLOUDINARY_CONFIG = {
    cloudName: 'dwgelhfe8',
    // استخدم upload_preset غير موقعة (unsigned) لتبسيط العملية
    uploadPreset: 'ml_default', // تأكد أن هذا الـ preset موجود ومفعل في Cloudinary
    apiKey: '947888722137512',
    apiSecret: 'thO04v3QWczqD4yS2OtsFZwYfMM',
    // روابط API
    uploadUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/upload',
    destroyUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/destroy',
    // إعدادات الملفات المقبولة
    allowedFormats: {
        pdf: ['pdf'],
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
        audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']
    },
    maxFileSize: 100 * 1024 * 1024, // 100MB
    // إعدادات افتراضية للرفع
    uploadOptions: {
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        resource_type: 'auto'
    }
};

// ==================== دوال مساعدة للمحتوى الدراسي ====================
const contentUtils = {
    currentSubjectId: null,
    currentSubjectName: null,
    currentSubjectIcon: null,
    currentType: 'pdfs',
    currentData: {},
    groupsData: {},
    // لحفظ حالات الرفع مؤقتاً
    uploadStates: new Map(),
    
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
    
    // ==================== ✅ دالة رفع محسنة إلى Cloudinary ====================
    uploadToCloudinary: async function(file, fileType, subjectId) {
        console.log(`☁️ رفع ${file.name} (${this.formatFileSize(file.size)}) إلى Cloudinary...`);
        
        return new Promise((resolve, reject) => {
            // إنشاء FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
            formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
            
            // إضافة معلمات إضافية لتحسين التنظيم
            const timestamp = Date.now();
            const uniqueId = Math.random().toString(36).substring(2, 9);
            const fileName = file.name.replace(/\.[^/.]+$/, "");
            
            formData.append('public_id', `subject_${subjectId}_${fileType}_${fileName}_${timestamp}_${uniqueId}`);
            formData.append('tags', `subject_${subjectId},${fileType},educational_content`);
            formData.append('context', `subject=${subjectId}|type=${fileType}|timestamp=${timestamp}`);
            
            // تحديد نوع المورد بناءً على نوع الملف
            let resourceType = 'auto';
            if (fileType === 'pdf') resourceType = 'raw';
            else if (fileType === 'audio') resourceType = 'video'; // Cloudinary يعامل الصوتيات كفيديو
            
            console.log('📤 تفاصيل الرفع:', {
                cloudName: CLOUDINARY_CONFIG.cloudName,
                uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
                resourceType: resourceType,
                fileSize: this.formatFileSize(file.size),
                fileType: file.type
            });
            
            // إرسال الطلب
            fetch(CLOUDINARY_CONFIG.uploadUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log(`📡 استجابة Cloudinary: ${response.status}`);
                
                if (!response.ok) {
                    return response.json().then(errData => {
                        console.error('❌ خطأ Cloudinary:', errData);
                        reject(new Error(`Cloudinary رفض الملف: ${errData.error?.message || response.statusText}`));
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.secure_url) {
                    console.log('✅ تم الرفع بنجاح:', {
                        publicId: data.public_id,
                        url: data.secure_url,
                        format: data.format,
                        size: this.formatFileSize(data.bytes),
                        resourceType: data.resource_type
                    });
                    
                    resolve({
                        url: data.secure_url,
                        publicId: data.public_id,
                        format: data.format,
                        bytes: data.bytes,
                        width: data.width,
                        height: data.height,
                        duration: data.duration,
                        created_at: data.created_at,
                        original_filename: data.original_filename,
                        resource_type: data.resource_type
                    });
                } else {
                    reject(new Error('Cloudinary لم يرجع رابطاً آمناً'));
                }
            })
            .catch(error => {
                console.error('❌ خطأ في اتصال Cloudinary:', error);
                reject(new Error(`فشل الاتصال بـ Cloudinary: ${error.message}`));
            });
        });
    },
    
    // ==================== ✅ دالة رفع رئيسية محسنة ====================
    uploadFile: async function(file, type) {
        console.log(`🚀 بدء عملية رفع الملف: ${file.name}`);
        
        // التحقق من وجود المادة الدراسية
        if (!this.currentSubjectId) {
            throw new Error('لم يتم اختيار مادة دراسية. يرجى اختيار مادة أولاً.');
        }
        
        // التحقق من حجم الملف
        if (file.size > CLOUDINARY_CONFIG.maxFileSize) {
            throw new Error(`حجم الملف كبير جداً (${this.formatFileSize(file.size)}). الحد الأقصى: ${this.formatFileSize(CLOUDINARY_CONFIG.maxFileSize)}`);
        }
        
        // تحديد نوع الملف
        const fileTypeMap = {
            'pdfs': 'pdf',
            'images': 'image',
            'audios': 'audio'
        };
        
        const fileType = fileTypeMap[type];
        if (!fileType) {
            throw new Error(`نوع المحتوى غير معروف: ${type}`);
        }
        
        // التحقق من صيغة الملف
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedFormats = CLOUDINARY_CONFIG.allowedFormats[fileType];
        
        if (!allowedFormats.includes(fileExtension)) {
            throw new Error(`نوع الملف غير مدعوم. المسموح: ${allowedFormats.join(', ')}`);
        }
        
        // محاولة الرفع مع إعادة المحاولة
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 المحاولة ${attempt} من ${maxRetries}...`);
                const result = await this.uploadToCloudinary(file, fileType, this.currentSubjectId);
                console.log(`✅ النجاح في المحاولة ${attempt}`);
                return result;
            } catch (error) {
                console.error(`❌ فشلت المحاولة ${attempt}:`, error.message);
                lastError = error;
                
                if (attempt === maxRetries) {
                    break;
                }
                
                // انتظر قبل إعادة المحاولة (زيادة الانتظار مع كل محاولة)
                await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
            }
        }
        
        throw new Error(`فشل الرفع إلى Cloudinary بعد ${maxRetries} محاولات: ${lastError?.message || 'خطأ غير معروف'}`);
    },
    
    // ==================== ✅ دالة الحذف المحسنة من Cloudinary ====================
    deleteFromCloudinary: async function(publicId, resourceType = 'image') {
        console.log(`🗑️ محاولة حذف ${publicId} من Cloudinary...`);
        
        if (!publicId || publicId.trim() === '') {
            console.warn('⚠️ publicId فارغ - تخطي الحذف من Cloudinary');
            return true; // نعود بنجاح لأن الملف قد يكون محذوفاً بالفعل
        }
        
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
            const signature = this.simpleSHA1(stringToSign);
            
            console.log('🔐 تفاصيل الحذف:', {
                publicId: publicId,
                resourceType: resourceType,
                timestamp: timestamp
            });
            
            const formData = new FormData();
            formData.append('public_id', publicId);
            formData.append('signature', signature);
            formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
            formData.append('timestamp', timestamp.toString());
            
            const response = await fetch(CLOUDINARY_CONFIG.destroyUrl, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('📋 رد Cloudinary:', result);
            
            if (result.result === 'ok') {
                console.log('✅ تم الحذف بنجاح من Cloudinary');
                return true;
            } else {
                console.warn('⚠️ Cloudinary لم يحذف الملف، قد يكون غير موجود:', result);
                return false;
            }
            
        } catch (error) {
            console.error('❌ خطأ في حذف الملف من Cloudinary:', error);
            return false; // نعود بـ false لكن لا نوقف العملية
        }
    },
    
    // ==================== ✅ SHA1 مبسط ومحسن ====================
    simpleSHA1: function(message) {
        // دالة SHA1 مبسطة للتوقيع
        // في بيئة الإنتاج، استخدم مكتبة مثل crypto-js
        function rotateLeft(n, b) {
            return (n << b) | (n >>> (32 - b));
        }
        
        function cvtHex(val) {
            let str = "";
            for (let i = 7; i >= 0; i--) {
                str += ((val >>> (i * 4)) & 0x0f).toString(16);
            }
            return str;
        }
        
        let blockstart;
        let i, j;
        let W = new Array(80);
        let H0 = 0x67452301;
        let H1 = 0xEFCDAB89;
        let H2 = 0x98BADCFE;
        let H3 = 0x10325476;
        let H4 = 0xC3D2E1F0;
        let A, B, C, D, E;
        let temp;
        
        // تحويل النص إلى بايتات
        let utf8Encode = new TextEncoder();
        let msg = utf8Encode.encode(message);
        
        // إضافة البايتات اللازمة
        let msgLen = msg.length;
        let totalLen = msgLen + 9;
        let numBlocks = Math.ceil(totalLen / 64);
        let M = new Uint8Array(numBlocks * 64);
        
        M.set(msg);
        M[msgLen] = 0x80;
        
        for (i = msgLen + 1; i < numBlocks * 64; i++) {
            M[i] = 0;
        }
        
        // إضافة الطول
        let bitLen = msgLen * 8;
        for (i = numBlocks * 64 - 1; i >= numBlocks * 64 - 8; i--) {
            M[i] = bitLen & 0xff;
            bitLen >>>= 8;
        }
        
        // معالجة كل كتلة
        for (blockstart = 0; blockstart < M.length; blockstart += 64) {
            for (i = 0; i < 16; i++) {
                W[i] = 0;
                for (j = 0; j < 4; j++) {
                    W[i] += M[blockstart + i * 4 + j] << (24 - j * 8);
                }
            }
            
            for (i = 16; i < 80; i++) {
                W[i] = rotateLeft(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
            }
            
            A = H0;
            B = H1;
            C = H2;
            D = H3;
            E = H4;
            
            for (i = 0; i < 80; i++) {
                let f, k;
                
                if (i < 20) {
                    f = (B & C) | ((~B) & D);
                    k = 0x5A827999;
                } else if (i < 40) {
                    f = B ^ C ^ D;
                    k = 0x6ED9EBA1;
                } else if (i < 60) {
                    f = (B & C) | (B & D) | (C & D);
                    k = 0x8F1BBCDC;
                } else {
                    f = B ^ C ^ D;
                    k = 0xCA62C1D6;
                }
                
                temp = (rotateLeft(A, 5) + f + E + k + W[i]) >>> 0;
                E = D;
                D = C;
                C = rotateLeft(B, 30) >>> 0;
                B = A;
                A = temp;
            }
            
            H0 = (H0 + A) >>> 0;
            H1 = (H1 + B) >>> 0;
            H2 = (H2 + C) >>> 0;
            H3 = (H3 + D) >>> 0;
            H4 = (H4 + E) >>> 0;
        }
        
        return cvtHex(H0) + cvtHex(H1) + cvtHex(H2) + cvtHex(H3) + cvtHex(H4);
    },
    
    // ==================== دوال المساعدة الأساسية ====================
    formatFileSize: function(bytes) {
        if (!bytes || bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    formatDuration: function(seconds) {
        if (!seconds) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // ==================== تهيئة قسم المحتوى ====================
    initContentSection: function() {
        console.log('📚 تهيئة قسم المحتوى الدراسي...');
        this.loadGroupsData();
        
        setTimeout(() => {
            this.initContentTabs();

            if (window.adminUtils && window.adminUtils.applyTranslationsToDynamicContent) {
                window.adminUtils.applyTranslationsToDynamicContent();
            }
            
        }, 300);
    },
    
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
    
    // ==================== إدارة تبويبات المحتوى ====================
    initContentTabs: function() {
        const container = document.getElementById('content-tabs-container');
        if (!container) return;
        
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.content-type-tab');
            if (!tab) return;
            
            const type = tab.dataset.type;
            this.switchContentType(type);
        });
    },
    
    switchContentType: function(type) {
        this.currentType = type;
        
        // تحديث التبويبات النشطة
        document.querySelectorAll('.content-type-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.content-type-tab[data-type="${type}"]`)?.classList.add('active');
        
        // تحديث اللوحات النشطة
        document.querySelectorAll('.content-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${type}-panel`)?.classList.add('active');
        
        // تحديث زر الإضافة
        this.updateAddButton(type);
        
        // تحميل المحتوى إذا كانت هناك مادة محددة
        if (this.currentSubjectId) {
            this.loadContentType(this.currentSubjectId, type);
        }
    },
    
    updateAddButton: function(type) {
        const addButton = document.getElementById('add-content-btn');
        if (!addButton) return;
        
        const typeNames = {
            'pdfs': { ar: 'ملف PDF', en: 'PDF File' },
            'images': { ar: 'صورة', en: 'Image' },
            'audios': { ar: 'ملف صوتي', en: 'Audio File' }
        };
        
        const typeName = typeNames[type]?.ar || 'ملف';
        addButton.innerHTML = `<i class="fas fa-plus"></i> إضافة ${typeName}`;
        addButton.onclick = () => this.openAddModal(type);
    },
    
    loadSubjectContent: function(subjectId, type = null) {
        if (!subjectId) return;
        
        this.currentSubjectId = subjectId;
        const contentType = type || this.currentType;
        
        this.updateContentTitle();
        this.loadContentType(subjectId, contentType);
        this.setupSearch(subjectId, contentType);
    },
    
    updateContentTitle: function() {
        const titleElement = document.getElementById('content-main-title');
        if (!titleElement || !this.currentSubjectName) return;
        
        titleElement.innerHTML = `<i class="${this.currentSubjectIcon || 'fas fa-book'}"></i> إدارة مادة: ${this.currentSubjectName}`;
    },
    
    loadContentType: function(subjectId, type) {
        const containerId = `${type}-panel`;
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = `
            <div class="no-data">
                <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                <span>جاري تحميل المحتوى...</span>
            </div>
        `;
        
        const itemsRef = ref(database, `subjectsContent/${subjectId}/${type}`);
        
        onValue(itemsRef, (snapshot) => {
            const items = snapshot.val() || {};
            this.currentData[type] = items;
            this.renderContentItems(items, type, containerId);
        }, (error) => {
            console.error(`❌ خطأ في تحميل ${type}:`, error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>خطأ في تحميل المحتوى</span>
                </div>
            `;
            this.showToast(`خطأ في تحميل ${type}`, 'error');
        });
    },
    
    // ==================== عرض العناصر ====================
    renderContentItems: function(items, type, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const dataGrid = container.querySelector('.data-grid');
        if (!dataGrid) {
            container.innerHTML = `<div class="data-grid"></div>`;
        }
        
        const gridContainer = container.querySelector('.data-grid');
        gridContainer.innerHTML = '';
        
        if (!items || Object.keys(items).length === 0) {
            const typeNames = {
                'pdfs': 'ملفات PDF',
                'images': 'صور',
                'audios': 'ملفات صوتية'
            };
            
            gridContainer.innerHTML = `
                <div class="no-data">
                    <i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i>
                    <span>لا توجد ${typeNames[type] || 'بيانات'} بعد</span>
                </div>
            `;
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        Object.entries(items).forEach(([key, item]) => {
            if (!item) return;
            
            const card = this.createContentCard(key, item, type);
            if (card) {
                fragment.appendChild(card);
            }
        });
        
        gridContainer.appendChild(fragment);
    },
    
    createContentCard: function(key, item, type) {
        const card = document.createElement('div');
        card.className = `content-card-new`;
        card.dataset.id = key;
        card.dataset.type = type;
    
        let title = item.name || item.fileName || 'بدون اسم';
    
        // ✅ شارات الهيدر
        let groupsBadge = '';
        let cloudinaryBadge = '';
    
        // شارة المجموعات (على اليسار)
        if (item.groups && Object.keys(item.groups).length > 0) {
            const groupsCount = Object.keys(item.groups).length;
            groupsBadge = `<div class="content-badge-groups" title="مرفوع لـ ${groupsCount} مجموعة">${groupsCount}</div>`;
        } else {
            groupsBadge = `<div class="content-badge-groups" style="visibility: hidden;">0</div>`;
        }
    
        // شارة Cloudinary (على اليمين)
        if (item.storage === 'cloudinary' || item.publicId) {
            cloudinaryBadge = `<div class="content-badge-cloudinary" title="مخزن في Cloudinary"><i class="fas fa-cloud"></i></div>`;
        } else {
            cloudinaryBadge = `<div class="content-badge-cloudinary" style="visibility: hidden;"><i class="fas fa-cloud"></i></div>`;
        }
    
        // ✅ محتوى الكارت
        const iconClass = type === 'pdfs' ? 'fa-file-pdf' : type === 'images' ? 'fa-image' : 'fa-volume-up';
        let contentBody = '';
    
        if (type === 'images' && item.url) {
            contentBody = `
                <div class="image-preview-container">
                    <img src="${item.url}" 
                     alt="${title}" 
                     loading="lazy"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size:1.5rem;\\'></i>';">
                </div>
            `;
        } else {
        contentBody = `<i class="fas ${iconClass}"></i>`;
        }
    
        // ✅ بناء الكارت الجديد
        card.innerHTML = `
            <div class="content-card-header">
                <div class="content-card-badges">
                    ${groupsBadge}
                </div>
                <div class="content-card-badges">
                    ${cloudinaryBadge}
                </div>
            </div>
        
            <div class="content-card-body">
                ${contentBody}
            </div>
        
            <div class="content-card-footer">
                <div>
                    <div class="content-card-title">${title}</div>
                    ${item.size ? `<div class="content-card-size">${this.formatFileSize(item.size)}</div>` : ''}
                </div>
            </div>
        `;
    
        card.onclick = () => {
            this.openContentItemModal(key, item, type);
        };
    
        return card;
    },
    
    setupSearch: function(subjectId, type) {
        const searchInput = document.getElementById(`search-${type}`);
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.handleSearch(query, type);
        });
    },
    
    handleSearch: function(query, type) {
        const container = document.getElementById(`${type}-panel`);
        if (!container) return;
        
        const cards = container.querySelectorAll('.content-card');
        const searchTerm = query.toLowerCase();
        
        cards.forEach(card => {
            const title = card.querySelector('h4').textContent.toLowerCase();
            card.style.display = title.includes(searchTerm) ? '' : 'none';
        });
    },
    
    // ==================== مودال إضافة محتوى جديد ====================
    openAddModal: function(type) {
        if (!this.currentSubjectId) {
            this.showToast('يرجى اختيار مادة دراسية أولاً', 'error');
            return;
        }
        
        const modalRoot = document.getElementById('userModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const typeNames = {
            'pdfs': { ar: 'ملف PDF', en: 'PDF File' },
            'images': { ar: 'صورة', en: 'Image' },
            'audios': { ar: 'ملف صوتي', en: 'Audio File' }
        };
        
        const typeName = typeNames[type];
        const acceptTypes = {
            'pdfs': '.pdf',
            'images': 'image/*',
            'audios': 'audio/*'
        };
        
        // بناء خيارات المجموعات
        let groupOptions = '<div class="no-students">لا يوجد مجموعات مسجلة بعد</div>';
        if (Object.keys(this.groupsData).length > 0) {
            groupOptions = '';
            Object.entries(this.groupsData).forEach(([groupId, group]) => {
                const groupName = group.name ? (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 'بدون اسم';
                groupOptions += `
                    <label class="select-option">
                        <input type="checkbox" name="groups" value="${groupId}">
                        <span>${groupName}</span>
                    </label>
                `;
            });
        }
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 500px;">
                <div class="modal-header">
                    <h2><i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i> إضافة ${typeName.ar}</h2>
                    <button class="modal-close-unified" aria-label="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="addContentItemForm">
                    <div class="form-compact-new">
                        <div class="full">
                            <label><i class="fas fa-font"></i> اسم ${typeName.ar}</label>
                            <input type="text" id="content-item-name" placeholder="أدخل اسم الملف..." required>
                        </div>
                        
                        <div class="full">
                            <label><i class="fas fa-file-upload"></i> اختر ملف</label>
                            <input type="file" id="content-item-file" accept="${acceptTypes[type]}" required style="display: none;">
                            <label for="content-item-file" class="file-upload-label">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <span id="file-name-text">اختر ملف...</span>
                            </label>
                            <small class="file-hint">${this.getFileHint(type)}</small>
                        </div>
                        
                        <div class="full">
                            <label><i class="fas fa-users"></i> المجموعات المستهدفة</label>
                            <div class="multi-select-grid">
                                ${groupOptions}
                            </div>
                        </div>
                        
                        <div class="full" id="preview-container" style="display: none; margin-top: 15px;">
                            <label><i class="fas fa-eye"></i> معاينة</label>
                            <div id="file-preview"></div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="grid-btn save" id="save-content-item">
                            <i class="fas fa-cloud-upload-alt"></i> رفع إلى Cloudinary
                        </button>
                    </div>
                </form>
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
        
        // معاينة الملف
        const fileInput = modal.querySelector('#content-item-file');
        const fileNameText = modal.querySelector('#file-name-text');
        const previewContainer = modal.querySelector('#preview-container');
        const filePreview = modal.querySelector('#file-preview');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileNameText.textContent = file.name;
                previewContainer.style.display = 'block';
                
                if (type === 'images') {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        filePreview.innerHTML = `
                            <img src="${e.target.result}" alt="معاينة">
                            <div style="text-align: center; margin-top: 10px; color: var(--bg-text);">
                                ${file.name} - ${this.formatFileSize(file.size)}
                            </div>
                        `;
                    };
                    reader.readAsDataURL(file);
                } else {
                    const icon = type === 'pdfs' ? 'fa-file-pdf' : 'fa-volume-up';
                    const color = type === 'pdfs' ? '#e74c3c' : '#2ecc71';
                    
                    filePreview.innerHTML = `
                        <div style="text-align: center;">
                            <i class="fas ${icon}" style="font-size: 4rem; color: ${color};"></i>
                            <div style="margin-top: 15px;">
                                <div><strong>${file.name}</strong></div>
                                <div style="color: var(--bg-text); opacity: 0.8; margin-top: 5px;">
                                    ${this.formatFileSize(file.size)}
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                previewContainer.style.display = 'none';
                fileNameText.textContent = 'اختر ملف...';
            }
        });
        
        // حفظ الملف في Cloudinary
        const saveBtn = modal.querySelector('#save-content-item');
        saveBtn.addEventListener('click', async () => {
            const nameInput = modal.querySelector('#content-item-name');
            const name = nameInput.value.trim();
            const file = fileInput.files[0];
            
            // جمع المجموعات المحددة
            const selectedGroups = {};
            modal.querySelectorAll('input[name="groups"]:checked').forEach(checkbox => {
                selectedGroups[checkbox.value] = true;
            });
            
            if (!name) {
                this.showToast('يرجى إدخال اسم الملف', 'error');
                nameInput.focus();
                return;
            }
            
            if (!file) {
                this.showToast('يرجى اختيار ملف', 'error');
                return;
            }
            
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفع إلى Cloudinary...';
            
            try {
                this.showToast('جاري رفع الملف إلى Cloudinary...', 'info');
                
                const uploadResult = await this.uploadFile(file, type);
                
                const fileType = type.slice(0, -1); // pdfs -> pdf
                const itemData = {
                    name: name,
                    fileName: file.name,
                    url: uploadResult.url,
                    secure_url: uploadResult.url,
                    publicId: uploadResult.publicId,
                    type: fileType,
                    size: file.size,
                    format: uploadResult.format || file.type.split('/').pop(),
                    subjectId: this.currentSubjectId,
                    groups: selectedGroups,
                    uploadedAt: Date.now(),
                    uploadedBy: 'admin',
                    resource_type: uploadResult.resource_type,
                    storage: 'cloudinary',
                    status: 'active'
                };
                
                if (type === 'images' && uploadResult.width && uploadResult.height) {
                    itemData.width = uploadResult.width;
                    itemData.height = uploadResult.height;
                    itemData.dimensions = `${uploadResult.width}x${uploadResult.height}`;
                }
                
                if (type === 'audios' && uploadResult.duration) {
                    itemData.duration = uploadResult.duration;
                    itemData.durationFormatted = this.formatDuration(uploadResult.duration);
                }
                
                const newRef = push(ref(database, `subjectsContent/${this.currentSubjectId}/${type}`));
                await set(newRef, itemData);
                
                this.showToast(`✅ تم رفع ${typeName.ar} بنجاح إلى Cloudinary!`, 'success');
                
                setTimeout(() => {
                    closeModal();
                    this.loadContentType(this.currentSubjectId, type);
                }, 1500);
                
            } catch (error) {
                console.error(`❌ خطأ في رفع ${typeName.ar}:`, error);
                
                let errorMessage = 'حدث خطأ غير معروف';
                if (error.message.includes('مادة دراسية')) {
                    errorMessage = error.message;
                } else if (error.message.includes('حجم')) {
                    errorMessage = error.message;
                } else if (error.message.includes('نوع')) {
                    errorMessage = error.message;
                } else if (error.message.includes('Cloudinary')) {
                    errorMessage = `فشل الرفع إلى Cloudinary: ${error.message}`;
                } else {
                    errorMessage = error.message;
                }
                
                this.showToast(`❌ فشل الرفع: ${errorMessage}`, 'error');
                
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> رفع إلى Cloudinary';
            }
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    getFileHint: function(type) {
        switch(type) {
            case 'pdfs': return 'يمكنك رفع ملفات PDF بحجم يصل إلى 100MB - سيتم رفعه إلى Cloudinary';
            case 'images': return 'يمكنك رفع صور JPG, PNG, GIF, WEBP, BMP, SVG - سيتم رفعه إلى Cloudinary';
            case 'audios': return 'يمكنك رفع ملفات MP3, WAV, OGG, M4A, AAC, FLAC - سيتم رفعه إلى Cloudinary';
            default: return 'الحد الأقصى لحجم الملف: 100MB - سيتم رفعه إلى Cloudinary';
        }
    },
    
    // ==================== مودال عرض/تعديل/حذف المحتوى ====================
    openContentItemModal: function(key, item, type) {
        const modalRoot = document.getElementById('userModalRoot');
        if (!modalRoot) return;
        
        modalRoot.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        
        const typeNames = {
            'pdfs': { ar: 'ملف PDF', en: 'PDF File' },
            'images': { ar: 'صورة', en: 'Image' },
            'audios': { ar: 'ملف صوتي', en: 'Audio File' }
        };
        
        const typeName = typeNames[type];
        const fileType = type.slice(0, -1);
        
        // بناء خيارات المجموعات
        let groupOptions = '<div class="no-students">لا يوجد مجموعات مسجلة بعد</div>';
        if (Object.keys(this.groupsData).length > 0) {
            groupOptions = '';
            Object.entries(this.groupsData).forEach(([groupId, group]) => {
                const groupName = group.name ? (typeof group.name === 'object' ? group.name.ar || group.name.en : group.name) : 'بدون اسم';
                const isSelected = item.groups && item.groups[groupId];
                groupOptions += `
                    <label class="select-option">
                        <input type="checkbox" name="groups" value="${groupId}" ${isSelected ? 'checked' : ''}>
                        <span>${groupName}</span>
                    </label>
                `;
            });
        }
        
        modal.innerHTML = `
            <div class="modal-content-new" style="max-width: 700px;">
                <div class="modal-header">
                    <h2><i class="${type === 'pdfs' ? 'fas fa-file-pdf' : type === 'images' ? 'fas fa-image' : 'fas fa-volume-up'}"></i> ${item.name || typeName.ar}</h2>
                    <button class="modal-close-unified" aria-label="إغلاق">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="editContentItemForm">
                    <div class="form-compact-new">
                        
                        <div class="full">
                            <label><i class="fas fa-font"></i> اسم ${typeName.ar}</label>
                            <input type="text" id="edit-content-name" value="${item.name || ''}" required>
                        </div>
                        
                        <div class="full">
                            <label><i class="fas fa-file-upload"></i> استبدال الملف (اختياري)</label>
                            <input type="file" id="edit-content-file" accept="${this.getFileAccept(fileType)}" style="display: none;">
                            <label for="edit-content-file" class="file-upload-label">
                                <i class="fas fa-sync-alt"></i>
                                <span id="edit-file-name-text">اختر ملف جديد...</span>
                            </label>
                            <small class="file-hint">سيتم حذف الملف القديم من Cloudinary واستبداله</small>
                        </div>
                        
                        <div class="full">
                            <label><i class="fas fa-users"></i> المجموعات المستهدفة</label>
                            <div class="multi-select-grid">
                                ${groupOptions}
                            </div>
                        </div>
                        
                        ${item.url ? `
                        <div class="full">
                            <label><i class="fas fa-link"></i> رابط الملف في Cloudinary</label>
                            <div class="file-link-container">
                                <a href="${item.url}" 
                                   target="_blank" 
                                   class="file-link">
                                    ${item.fileName || 'الملف الحالي'} (${this.formatFileSize(item.size)})
                                </a>
                                <div class="file-id">
                                    <i class="fas fa-hashtag"></i> Cloudinary ID: ${item.publicId || 'غير متوفر'}
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="full preview-section">
                            ${this.getPreviewHTML(item, fileType)}
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="grid-btn save" id="update-content-item">
                            <i class="fas fa-save"></i> حفظ التغييرات
                        </button>
                        <button type="button" class="grid-btn danger" id="delete-content-item">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </form>
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
        
        // إعداد حقل استبدال الملف
        const fileInput = modal.querySelector('#edit-content-file');
        const fileNameText = modal.querySelector('#edit-file-name-text');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileNameText.textContent = file.name;
            } else {
                fileNameText.textContent = 'اختر ملف جديد...';
            }
        });
        
        // تحديث العنصر
        modal.querySelector('#update-content-item').addEventListener('click', async () => {
            const name = modal.querySelector('#edit-content-name').value.trim();
            const file = fileInput.files[0];
            
            // جمع المجموعات المحددة
            const selectedGroups = {};
            modal.querySelectorAll('input[name="groups"]:checked').forEach(checkbox => {
                selectedGroups[checkbox.value] = true;
            });
            
            if (!name) {
                this.showToast('يرجى إدخال اسم الملف', 'error');
                return;
            }
            
            const saveBtn = modal.querySelector('#update-content-item');
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            
            try {
                const updates = {
                    name: name,
                    groups: selectedGroups,
                    updatedAt: Date.now()
                };
                
                if (file) {
                    this.showToast('جاري استبدال الملف في Cloudinary...', 'info');
                    
                    // حذف الملف القديم من Cloudinary
                    if (item.publicId) {
                        try {
                            await this.deleteFromCloudinary(item.publicId, fileType);
                        } catch (error) {
                            console.warn('⚠️ خطأ في حذف الملف القديم:', error);
                        }
                    }
                    
                    // رفع الملف الجديد إلى Cloudinary
                    const uploadResult = await this.uploadFile(file, type);
                    
                    updates.url = uploadResult.url;
                    updates.secure_url = uploadResult.url;
                    updates.publicId = uploadResult.publicId;
                    updates.size = file.size;
                    updates.format = uploadResult.format || file.type.split('/').pop();
                    updates.fileName = file.name;
                    updates.resource_type = uploadResult.resource_type;
                    updates.storage = 'cloudinary';
                    
                    if (type === 'images' && uploadResult.width && uploadResult.height) {
                        updates.width = uploadResult.width;
                        updates.height = uploadResult.height;
                        updates.dimensions = `${uploadResult.width}x${uploadResult.height}`;
                    }
                    
                    if (type === 'audios' && uploadResult.duration) {
                        updates.duration = uploadResult.duration;
                        updates.durationFormatted = this.formatDuration(uploadResult.duration);
                    }
                }
                
                await update(ref(database, `subjectsContent/${this.currentSubjectId}/${type}/${key}`), updates);
                
                this.showToast(`✅ تم تحديث ${typeName.ar} بنجاح`, 'success');
                
                setTimeout(() => {
                    closeModal();
                    this.loadContentType(this.currentSubjectId, type);
                }, 1500);
                
            } catch (error) {
                console.error(`❌ خطأ في تحديث ${typeName.ar}:`, error);
                this.showToast(`❌ حدث خطأ في التحديث: ${error.message}`, 'error');
                
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التغييرات';
            }
        });
        
        // حذف العنصر من Cloudinary
        modal.querySelector('#delete-content-item').addEventListener('click', async () => {
            const itemName = item.name || item.fileName || typeName.ar;
            
            if (!confirm(`⚠️ **حذف نهائي من Cloudinary**\n\nهل أنت متأكد من حذف ${typeName.ar} "${itemName}"؟\n\n• هذا الإجراء لا يمكن التراجع عنه\n• ✅ سيتم حذفه من قاعدة البيانات\n• ✅ سيتم حذفه من Cloudinary`)) return;
            
            const deleteBtn = modal.querySelector('#delete-content-item');
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحذف...';
            
            try {
                // حذف من Cloudinary أولاً
                if (item.publicId) {
                    await this.deleteFromCloudinary(item.publicId, fileType);
                }
                
                // حذف من Firebase
                await remove(ref(database, `subjectsContent/${this.currentSubjectId}/${type}/${key}`));
                
                this.showToast(`✅ تم حذف ${typeName.ar} بنجاح من Cloudinary`, 'success');
                
                setTimeout(() => {
                    closeModal();
                    this.loadContentType(this.currentSubjectId, type);
                }, 1500);
                
            } catch (error) {
                console.error(`❌ خطأ في حذف ${typeName.ar}:`, error);
                this.showToast(`❌ حدث خطأ في الحذف: ${error.message}`, 'error');
                
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> حذف من Cloudinary';
            }
        });
        
        modalRoot.innerHTML = '';
        modalRoot.appendChild(modal);
    },
    
    getFileAccept: function(fileType) {
        switch(fileType) {
            case 'pdf': return '.pdf';
            case 'image': return 'image/*';
            case 'audio': return 'audio/*';
            default: return '*';
        }
    },
    
    getPreviewHTML: function(item, fileType) {
        const fileUrl = item.url || item.secure_url;
        const fileName = item.name || item.fileName || 'document';
        
        switch(fileType) {
            case 'image':
                return `
                    <div class="image-preview-modal">
                        <img src="${fileUrl}" 
                             alt="${fileName}" 
                             class="preview-image"
                             onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'text-align:center;padding:2rem;\\'><i class=\\'fas fa-image\\' style=\\'font-size:4rem;color:#ccc;\\'></i><p style=\\'margin-top:1rem;color:var(--bg-text);\\'>تعذر تحميل الصورة</p></div>';">
                        <div class="image-info">
                            <span>${item.dimensions || 'أبعاد غير معروفة'} - ${this.formatFileSize(item.size)}</span>
                        </div>
                    </div>
                `;
            case 'audio':
                return `
                    <div class="audio-preview-modal">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <i class="fas fa-volume-up" style="font-size: 3rem; color: var(--bg-text);"></i>
                        </div>
                        <audio controls class="audio-player">
                            <source src="${fileUrl}" type="audio/mpeg">
                            <source src="${fileUrl}" type="audio/wav">
                            <source src="${fileUrl}" type="audio/ogg">
                            متصفحك لا يدعم تشغيل الصوتيات.
                        </audio>
                        <div class="audio-info">
                            ${item.duration ? `<span>المدة: ${item.durationFormatted || this.formatDuration(item.duration)}</span>` : ''}
                            <span>الحجم: ${this.formatFileSize(item.size)}</span>
                        </div>
                    </div>
                `;
            case 'pdf':
                return `
                    <div class="pdf-preview-modal">
                        <div style="text-align: center;">
                            <i class="fas fa-file-pdf" style="font-size: 3rem; color: var(--bg-text);"></i>
                            <div style="margin-top: 15px;">
                                <p style="color: var(--bg-text); margin-bottom: 15px;">يمكنك تحميل ملف PDF</p>
                                <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                                    <a href="${fileUrl}" 
                                        download="${fileName}.pdf" 
                                        class="pdf-action-btn">
                                        <i class="fas fa-download"></i> تحميل الملف
                                    </a>
                                </div>
                                <div style="color: var(--bg-text); opacity: 0.7; margin-top: 15px; font-size: 0.9rem;">
                                    <i class="fas fa-info-circle"></i> حجم الملف: ${this.formatFileSize(item.size)}<br>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    },
    
    // ✅ حذف كل محتوى المادة من Cloudinary
    deleteSubjectAllContent: async function(subjectId) {
        const confirmMessage = `⚠️ **حذف كامل من Cloudinary**\n\nهل أنت متأكد من حذف كل محتوى هذه المادة؟\n\n• هذا الإجراء لا يمكن التراجع عنه\n• ✅ سيتم حذف جميع الملفات من قاعدة البيانات\n• ✅ سيتم حذف جميع الملفات من Cloudinary`;
        
        if (!confirm(confirmMessage)) {
            return false;
        }
        
        try {
            console.log(`🗑️ بدء حذف كل محتوى المادة ${subjectId}...`);
            
            const contentRef = ref(database, `subjectsContent/${subjectId}`);
            const snapshot = await get(contentRef);
            const content = snapshot.val();
            
            if (!content) {
                console.log('ℹ️ لا يوجد محتوى لحذفه');
                return true;
            }
            
            // حذف كل الملفات من Cloudinary
            const deletePromises = [];
            
            ['pdfs', 'images', 'audios'].forEach(type => {
                if (content[type]) {
                    Object.values(content[type]).forEach(item => {
                        if (item && item.publicId) {
                            const fileType = type.slice(0, -1);
                            deletePromises.push(
                                this.deleteFromCloudinary(item.publicId, fileType)
                            );
                        }
                    });
                }
            });
            
            // تنفيذ الحذف من Cloudinary
            if (deletePromises.length > 0) {
                console.log(`🗑️ جاري حذف ${deletePromises.length} ملف من Cloudinary...`);
                await Promise.allSettled(deletePromises);
            }
            
            // حذف كل شيء من Firebase
            await remove(contentRef);
            
            console.log(`✅ تم حذف كل محتوى المادة ${subjectId} بنجاح`);
            this.showToast('✅ تم حذف كل محتوى المادة بنجاح', 'success');
            return true;
            
        } catch (error) {
            console.error(`❌ خطأ في حذف محتوى المادة ${subjectId}:`, error);
            this.showToast(`❌ فشل في حذف محتوى المادة: ${error.message}`, 'error');
            throw error;
        }
    }
    
};

// ==================== تصدير الدوال ====================
export default contentUtils;

// جعل الدوال متاحة عالمياً
window.contentUtils = contentUtils;

console.log('✅ تم تحميل content.js المحسن بنجاح - Cloudinary جاهز!');