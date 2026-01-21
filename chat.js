// ==================== استيراد Firebase Functions ====================
import { auth, database } from "./app.js";
import { ref, set, remove, onValue, push, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ==================== إعدادات Cloudinary الحقيقية ====================
const CLOUDINARY_CONFIG = {
    cloudName: 'dwgelhfe8',
    uploadPreset: 'ml_default',
    apiKey: '947888722137512',
    apiSecret: 'thO04v3QWczqD4yS2OtsFZwYfMM',
    uploadUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/upload',
    destroyUrl: 'https://api.cloudinary.com/v1_1/dwgelhfe8/destroy'
};

// ==================== دوال الشات المتقدم ====================
const advancedChatUtils = {
    // متغيرات الحالة
    chatData: {},
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    recordingTime: 0,
    recordingTimer: null,
    currentAudio: null,
    currentFile: null,
    fileType: null,
    
    // تحميل قسم الشات
    loadChatSection: function() {
        console.log('💬 تحميل قسم الشات المتقدم مع تصميم جديد');
        
        // HTML للشات المتقدم مع التصميم الجديد
        const html = `
            <div class="advanced-chat-container">
                <!-- شريط التحكم -->
                <div class="chat-controls-bar">
                    <div class="chat-stats">
                        <span class="stat-item"><i class="fas fa-comment"></i> <span id="total-msgs">0</span></span>
                        <span class="stat-item"><i class="fas fa-users"></i> <span id="online-users">0</span></span>
                        <span class="stat-item"><i class="fas fa-file"></i> <span id="file-msgs">0</span></span>
                        <span class="stat-item"><i class="fas fa-microphone"></i> <span id="voice-msgs">0</span></span>
                        <button id="refresh-chat-btn" class="chat-action-btn" title="تحديث">
                            <i class="fas fa-sync-alt"></i> 
                        </button>
                        <button id="clear-chat-btn" class="chat-action-btn" title="مسح المحادثة">
                            <i class="fas fa-trash"></i> مسح
                        </button>
                    </div>
                </div>
                
                <!-- منطقة الرسائل -->
                <div class="chat-messages-advanced" id="chat-messages-advanced">
                    <div class="chat-loading">
                        <div class="spinner"></div>
                        <p>جاري تحميل الرسائل...</p>
                    </div>
                </div>
                
                <!-- منطقة الإرسال -->
                <div class="chat-input-advanced">
                    <!-- معاينة الملف -->
                    <div class="file-preview-container" id="file-preview-container" style="display: none;">
                        <div class="file-preview-header">
                            <span id="file-preview-title">معاينة الملف</span>
                            <button id="remove-file-btn" class="remove-file-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="file-preview-body" id="file-preview-body">
                            <!-- معاينة الملف تظهر هنا -->
                        </div>
                    </div>
                    
                    <!-- مؤشر التسجيل -->
                    <div class="recording-container" id="recording-container" style="display: none;">
                        <div class="recording-status">
                            <div class="recording-pulse"></div>
                            <span class="recording-text">جاري التسجيل...</span>
                            <span class="recording-timer" id="recording-timer">00:00</span>
                        </div>
                        <div class="recording-actions">
                            <button id="send-recording-btn" class="recording-action-btn success">
                                <i class="fas fa-check"></i> إرسال
                            </button>
                            <button id="cancel-recording-btn" class="recording-action-btn danger">
                                <i class="fas fa-times"></i> إلغاء
                            </button>
                        </div>
                    </div>
                    
                    <!-- حاوية الإدخال -->
                    <div class="message-input-container">
                        <textarea 
                            id="advanced-chat-input" 
                            class="advanced-chat-input" 
                            placeholder="اكتب رسالتك هنا..." 
                            rows="1"
                        ></textarea>
                        <!-- الأيقونات ستضاف هنا ديناميكياً -->
                    </div>
                </div>
            </div>
        `;
        
        // إضافة للصفحة
        const container = document.getElementById('dynamic-section-content');
        if (container) {
            container.innerHTML = html;
            this.initAdvancedChat();
        }
    },
    
    // تهيئة الشات المتقدم
    initAdvancedChat: function() {
        const messagesDiv = document.getElementById('chat-messages-advanced');
        const input = document.getElementById('advanced-chat-input');
        const refreshBtn = document.getElementById('refresh-chat-btn');
        const clearBtn = document.getElementById('clear-chat-btn');
        const removeFileBtn = document.getElementById('remove-file-btn');
        const sendRecordingBtn = document.getElementById('send-recording-btn');
        const cancelRecordingBtn = document.getElementById('cancel-recording-btn');
        
        if (!messagesDiv) return;
        
        // تحميل الرسائل
        this.loadAdvancedMessages(messagesDiv);
        
        // إنشاء وإضافة الأيقونات داخل حقل الإدخال
        this.createInputTools();
        
        // إضافة الأحداث للأزرار
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAdvancedMessages(messagesDiv);
                this.showNotification('تم تحديث الرسائل', 'success');
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllChat();
            });
        }
        
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
        
        // تحديث حالة زر الميكروفون
        setInterval(() => {
            const voiceBtn = document.getElementById('voice-record-btn');
            if (voiceBtn) {
                if (this.isRecording) {
                    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                    voiceBtn.style.background = 'rgba(var(--bg-text-rgb), 0.3)';
                    voiceBtn.title = 'إيقاف التسجيل';
                } else {
                    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    voiceBtn.style.background = '';
                    voiceBtn.title = 'تسجيل رسالة صوتية';
                }
            }
        }, 100);
    },
    
    // إنشاء أدوات الإدخال داخل الحقل
    createInputTools: function() {
        const messageInputContainer = document.querySelector('.message-input-container');
        if (!messageInputContainer) return;
        
        // الأيقونات على اليمين (للاتجاه العربي)
        const rightTools = document.createElement('div');
        rightTools.className = 'input-tools right';
        rightTools.innerHTML = `
            <button id="voice-record-btn" class="tool-btn voice-btn" title="تسجيل رسالة صوتية">
                <i class="fas fa-microphone"></i>
            </button>
            <button id="attach-file-btn" class="tool-btn" title="إرفاق ملف">
                <i class="fas fa-paperclip"></i>
            </button>
            <button id="attach-image-btn" class="tool-btn" title="إرفاق صورة">
                <i class="fas fa-image"></i>
            </button>
        `;
        
        // زر الإرسال على اليسار
        const leftTools = document.createElement('div');
        leftTools.className = 'input-tools left';
        leftTools.innerHTML = `
            <button id="send-message-btn" class="send-message-btn" title="إرسال">
                <i class="fas fa-paper-plane"></i>
            </button>
        `;
        
        // إضافة الأيقونات
        messageInputContainer.appendChild(rightTools);
        messageInputContainer.appendChild(leftTools);
        
        // الحصول على العناصر
        const input = document.getElementById('advanced-chat-input');
        const sendBtn = document.getElementById('send-message-btn');
        const voiceBtn = document.getElementById('voice-record-btn');
        const attachFileBtn = document.getElementById('attach-file-btn');
        const attachImageBtn = document.getElementById('attach-image-btn');
        const messagesDiv = document.getElementById('chat-messages-advanced');
        
        // إنشاء حقول الملفات المخفية
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
        
        // إضافة الأحداث
        if (sendBtn && input) {
            sendBtn.addEventListener('click', () => {
                this.sendAdvancedMessage(input, messagesDiv);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAdvancedMessage(input, messagesDiv);
                }
            });
            
            // ضبط ارتفاع الحقل تلقائياً
            input.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = Math.min(this.scrollHeight, 100) + 'px';
            });
        }
        
        // التسجيل الصوتي
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                if (this.isRecording) {
                    this.stopVoiceRecording(false);
                } else {
                    this.startVoiceRecording();
                }
            });
        }
        
        // إرفاق ملف
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
        
        // إرفاق صورة
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
    
    // تحميل الرسائل المتقدمة
    loadAdvancedMessages: function(messagesDiv) {
        onValue(ref(database, 'globalChat'), (snapshot) => {
            this.chatData = snapshot.val() || {};
            this.renderAdvancedMessages(this.chatData, messagesDiv);
            this.updateChatStats();
        });
    },
    
    // عرض الرسائل المتقدمة مع التصميم الجديد
    renderAdvancedMessages: function(messages, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!messages || Object.keys(messages).length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-comments"></i>
                    <h3>لا توجد رسائل بعد</h3>
                    <p>كن أول من يبدأ المحادثة!</p>
                </div>
            `;
            return;
        }
        
        // تحويل إلى مصفوفة وفرز
        const messagesArray = Object.entries(messages).map(([key, msg]) => ({
            key,
            ...msg
        }));
        
        messagesArray.sort((a, b) => a.timestamp - b.timestamp);
        
        // تجميع الرسائل حسب التاريخ
        let currentDate = null;
        
        messagesArray.forEach(msg => {
            const messageDate = new Date(msg.timestamp).toLocaleDateString('ar-SA');
            
            // إضافة تاريخ إذا تغير
            if (messageDate !== currentDate) {
                currentDate = messageDate;
                const dateDiv = document.createElement('div');
                dateDiv.className = 'message-date-divider';
                dateDiv.innerHTML = `<span>${messageDate}</span>`;
                container.appendChild(dateDiv);
            }
            
            // عرض الرسالة
            const messageElement = this.createMessageElement(msg);
            container.appendChild(messageElement);
        });
        
        // التمرير للأسفل
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    },
    
    // إنشاء عنصر رسالة مع التصميم الجديد
    createMessageElement: function(msg) {
        const user = window.usersData ? window.usersData[msg.userId] : null;
        const currentUser = auth.currentUser;
        const isCurrentUser = currentUser && currentUser.uid === msg.userId;
        const isAdmin = currentUser && window.usersData && 
                       window.usersData[currentUser.uid] && 
                       window.usersData[currentUser.uid].role === 'admin';
        
        const userName = user ? user.name : 'مستخدم غير معروف';
        const userRole = user ? user.role : 'unknown';
        const time = new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        
        // تحديد لون الدور
        const roleColors = {
            'admin': '#e74c3c',
            'student': '#3498db',
            'parent': '#2ecc71'
        };
        const roleColor = roleColors[userRole] || '#95a5a6';
        
        // إنشاء عنصر الرسالة
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-advanced ${isCurrentUser ? 'current-user' : 'other-user'}`;
        messageDiv.dataset.id = msg.key;
        
        let messageBody = '';
        let additionalContent = '';
        
        if (msg.type === 'voice') {
            // رسالة صوتية
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
                        <span class="voice-duration">${msg.voiceDuration || 0} ثانية</span>
                    </div>
                </div>
            `;
        } else if (msg.type === 'file') {
            // رسالة ملف
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
                            <div class="file-name">${msg.fileName || 'ملف'}</div>
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
            // رسالة صورة
            messageBody = `
                <div class="image-message-container">
                    <div class="image-message">
                        <img src="${msg.imageUrl}" alt="صورة" class="chat-image">
                        <a href="${msg.imageUrl}" target="_blank" class="view-image-btn">
                            <i class="fas fa-expand"></i>
                        </a>
                    </div>
                </div>
            `;
        }
        
        // إضافة نص الرسالة إذا كان موجوداً
        if (msg.text) {
            additionalContent = `<div class="message-text">${this.escapeHtml(msg.text).replace(/\n/g, '<br>')}</div>`;
        }
        
        // إضافة أزرار الحذف إذا كان المستخدم الحالي هو المرسل أو أدمن
        let deleteButton = '';
        if (isCurrentUser || isAdmin) {
            deleteButton = `
                <div class="message-actions">
                    <button class="delete-message-btn" data-id="${msg.key}" data-type="${msg.type}" data-url="${msg.voiceUrl || msg.imageUrl || msg.fileUrl || ''}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            `;
        }
        
        const messageContent = `
            <div class="message-inner">
                <div class="message-header">
                    <div class="message-time-bottom">${time}</div>
                    <span class="sender-name">${userName}</span>
                    <div class="message-avatar" style="border-color: ${roleColor};">
                        <i class="fas fa-user"></i>
                    </div>  
                </div>
                <div class="message-content-wrapper">
                    ${messageBody}
                    ${additionalContent}
                    ${deleteButton}
                </div>
            </div>
        `;
        
        messageDiv.innerHTML = messageContent;
        
        // إضافة الأحداث
        const deleteBtn = messageDiv.querySelector('.delete-message-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = deleteBtn.dataset.id;
                const messageType = deleteBtn.dataset.type;
                const fileUrl = deleteBtn.dataset.url;
                this.deleteMessage(messageId, messageType, fileUrl);
            });
        }
        
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
    
    // التعامل مع رفع الملف
    handleFileUpload: function(file, type) {
        if (!file) return;
        
        // التحقق من حجم الملف (10MB حد أقصى)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showNotification('حجم الملف كبير جداً (الحد الأقصى 10MB)', 'error');
            return;
        }
        
        this.currentFile = file;
        this.fileType = type;
        
        // عرض معاينة الملف
        this.showFilePreview(file, type);
    },
    
    // عرض معاينة الملف
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
                        <img src="${e.target.result}" alt="معاينة الصورة">
                    </div>
                    <div class="file-info-preview">
                        <div class="file-name-preview">${file.name}</div>
                        <div class="file-details-preview">
                            <span><i class="fas fa-image"></i> صورة</span>
                            <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                        </div>
                    </div>
                `;
                previewBody.innerHTML = previewHTML;
            };
            reader.readAsDataURL(file);
            previewTitle.textContent = 'معاينة الصورة';
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
                                    <span><i class="fas fa-file-audio"></i> ملف صوتي</span>
                                    <span><i class="fas fa-clock"></i> ${duration} ثانية</span>
                                    <span><i class="fas fa-weight-hanging"></i> ${fileSize}</span>
                                </div>
                            </div>
                            <button class="preview-audio-btn">
                                <i class="fas fa-play"></i>
                            </button>
                        </div>
                    `;
                    previewBody.innerHTML = previewHTML;
                    
                    // إضافة حدث تشغيل المعاينة
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
            previewTitle.textContent = 'معاينة الملف';
        }
    },
    
    // مسح معاينة الملف
    clearFilePreview: function() {
        const previewContainer = document.getElementById('file-preview-container');
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        
        this.currentFile = null;
        this.fileType = null;
    },
    
    // إرسال رسالة متقدمة
    sendAdvancedMessage: async function(input, messagesDiv) {
        const text = input.value.trim();
        const user = auth.currentUser;
        
        if (!user) {
            this.showNotification('يجب تسجيل الدخول لإرسال الرسائل', 'error');
            return;
        }
        
        // إذا كان هناك ملف مرفق
        if (this.currentFile) {
            this.showNotification('جاري رفع الملف...', 'info');
            
            try {
                // رفع الملف إلى Cloudinary
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
                    // حفظ في قاعدة البيانات
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
                    
                    this.showNotification('تم إرسال الملف بنجاح', 'success');
                    this.clearFilePreview();
                    input.value = '';
                    input.style.height = 'auto';
                }
                
            } catch (error) {
                console.error('❌ خطأ في رفع الملف:', error);
                this.showNotification('خطأ في رفع الملف: ' + error.message, 'error');
            }
            
        } else if (text) {
            // رسالة نصية فقط
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
                
                this.showNotification('تم إرسال الرسالة', 'success');
            } catch (error) {
                console.error('❌ خطأ في إرسال الرسالة:', error);
                this.showNotification('خطأ في إرسال الرسالة', 'error');
            }
        } else {
            this.showNotification('اكتب رسالة أو أرفق ملفًا', 'warning');
        }
    },
    
    // رفع ملف إلى Cloudinary
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
                throw new Error(`فشل رفع الملف: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ تم رفع الملف بنجاح:', data);
            return data.secure_url;
            
        } catch (error) {
            console.error('❌ خطأ في رفع الملف إلى Cloudinary:', error);
            throw error;
        }
    },
    
    // بدء التسجيل الصوتي
    startVoiceRecording: async function() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('المتصفح لا يدعم التسجيل الصوتي');
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
            
            // عرض واجهة التسجيل
            this.showRecordingUI();
            
            // بدء العد
            this.recordingTimer = setInterval(() => {
                this.recordingTime++;
                this.updateRecordingTimer();
            }, 1000);
            
            // جمع البيانات
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            // عند التوقف
            this.mediaRecorder.onstop = async () => {
                clearInterval(this.recordingTimer);
                stream.getTracks().forEach(track => track.stop());
            };
            
            // البدء
            this.mediaRecorder.start(100);
            
            console.log('🎤 بدأ التسجيل الصوتي');
            
        } catch (error) {
            console.error('❌ خطأ في بدء التسجيل الصوتي:', error);
            this.showNotification('تعذر الوصول إلى الميكروفون: ' + error.message, 'error');
        }
    },
    
    // إيقاف التسجيل الصوتي
    stopVoiceRecording: async function(send = true) {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        console.log('⏹️ إيقاف التسجيل الصوتي، الإرسال:', send);
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        clearInterval(this.recordingTimer);
        
        // انتظار حتى يتم جمع جميع البيانات
        await new Promise(resolve => {
            this.mediaRecorder.onstop = () => {
                resolve();
            };
        });
        
        if (send && this.audioChunks.length > 0) {
            // إنشاء ملف صوتي
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
                type: 'audio/webm'
            });
            
            // رفع إلى Cloudinary
            this.showNotification('جاري رفع الرسالة الصوتية...', 'info');
            
            try {
                const voiceUrl = await this.uploadToCloudinary(audioFile, 'video');
                
                if (voiceUrl) {
                    // حفظ في قاعدة البيانات
                    await this.saveVoiceMessage(voiceUrl, this.recordingTime);
                }
            } catch (error) {
                console.error('❌ خطأ في رفع الرسالة الصوتية:', error);
                this.showNotification('فشل رفع الرسالة الصوتية: ' + error.message, 'error');
            }
        } else {
            console.log('❌ لا توجد بيانات صوتية لرفعها');
        }
        
        // إعادة تعيين
        this.audioChunks = [];
        this.hideRecordingUI();
    },
    
    // حفظ الرسالة الصوتية في قاعدة البيانات
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
            
            this.showNotification('تم إرسال الرسالة الصوتية بنجاح', 'success');
        } catch (error) {
            console.error('❌ خطأ في حفظ الرسالة الصوتية:', error);
            this.showNotification('خطأ في إرسال الرسالة الصوتية', 'error');
        }
    },
    
    // عرض واجهة التسجيل
    showRecordingUI: function() {
        const container = document.getElementById('recording-container');
        const input = document.getElementById('advanced-chat-input');
        
        if (container) container.style.display = 'block';
        if (input) input.style.display = 'none';
    },
    
    // إخفاء واجهة التسجيل
    hideRecordingUI: function() {
        const container = document.getElementById('recording-container');
        const input = document.getElementById('advanced-chat-input');
        
        if (container) container.style.display = 'none';
        if (input) input.style.display = 'block';
    },
    
    // تحديث توقيت التسجيل
    updateRecordingTimer: function() {
        const timerElement = document.getElementById('recording-timer');
        if (timerElement) {
            const minutes = Math.floor(this.recordingTime / 60).toString().padStart(2, '0');
            const seconds = (this.recordingTime % 60).toString().padStart(2, '0');
            timerElement.textContent = `${minutes}:${seconds}`;
        }
    },
    
    // تشغيل رسالة صوتية
    playVoiceMessage: function(url) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
        }
        
        this.currentAudio = new Audio(url);
        this.currentAudio.play().catch(error => {
            console.error('❌ خطأ في تشغيل الرسالة الصوتية:', error);
            this.showNotification('تعذر تشغيل الرسالة الصوتية', 'error');
        });
        
        this.currentAudio.onended = () => {
            this.currentAudio = null;
        };
    },
    
    // حذف رسالة
    deleteMessage: async function(messageId, type, fileUrl = null) {
        if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
        
        try {
            // إذا كانت رسالة صوتية أو ملف، احذف من Cloudinary
            if (type !== 'text' && fileUrl) {
                const publicId = this.extractPublicId(fileUrl);
                if (publicId) {
                    await this.deleteFromCloudinary(publicId);
                }
            }
            
            // حذف من قاعدة البيانات
            await remove(ref(database, `globalChat/${messageId}`));
            this.showNotification('تم حذف الرسالة', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في حذف الرسالة:', error);
            this.showNotification('خطأ في حذف الرسالة', 'error');
        }
    },
    
    // حذف ملف من Cloudinary
    deleteFromCloudinary: async function(publicId) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureString = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
        
        // إنشاء التوقيع SHA1
        const signature = await this.generateSHA1(signatureString);
        
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        
        try {
            const response = await fetch(CLOUDINARY_CONFIG.destroyUrl, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                console.error('❌ فشل حذف الملف من Cloudinary');
            } else {
                console.log('✅ تم حذف الملف من Cloudinary');
            }
        } catch (error) {
            console.error('❌ خطأ في حذف الملف من Cloudinary:', error);
        }
    },
    
    // توليد توقيع SHA1
    generateSHA1: async function(string) {
        const encoder = new TextEncoder();
        const data = encoder.encode(string);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    
    // استخراج public_id من URL
    extractPublicId: function(url) {
        try {
            const urlParts = url.split('/');
            const fileNameWithExt = urlParts[urlParts.length - 1];
            const fileName = fileNameWithExt.split('.')[0];
            return fileName;
        } catch (error) {
            console.error('❌ خطأ في استخراج public_id:', error);
            return null;
        }
    },
    
    // مسح المحادثة بالكامل
    clearAllChat: async function() {
        if (!confirm('⚠️ هل أنت متأكد من مسح جميع الرسائل؟\n\nهذا الإجراء لا يمكن التراجع عنه!')) return;
        
        try {
            // جمع جميع الملفات للحذف من Cloudinary
            const fileMessages = Object.values(this.chatData).filter(msg => 
                msg.type === 'voice' || msg.type === 'image' || msg.type === 'file'
            );
            
            for (const msg of fileMessages) {
                let fileUrl = '';
                if (msg.type === 'voice') fileUrl = msg.voiceUrl;
                if (msg.type === 'image') fileUrl = msg.imageUrl;
                if (msg.type === 'file') fileUrl = msg.fileUrl;
                
                if (fileUrl) {
                    const publicId = this.extractPublicId(fileUrl);
                    if (publicId) {
                        await this.deleteFromCloudinary(publicId);
                    }
                }
            }
            
            // حذف جميع الرسائل من قاعدة البيانات
            await set(ref(database, 'globalChat'), {});
            this.showNotification('تم مسح جميع الرسائل', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في مسح المحادثة:', error);
            this.showNotification('خطأ في مسح المحادثة', 'error');
        }
    },
    
    // تحديث إحصائيات الشات
    updateChatStats: function() {
        const totalMsgs = document.getElementById('total-msgs');
        const voiceMsgs = document.getElementById('voice-msgs');
        const fileMsgs = document.getElementById('file-msgs');
        
        if (totalMsgs) {
            totalMsgs.textContent = Object.keys(this.chatData || {}).length;
        }
        
        if (voiceMsgs) {
            const voiceCount = Object.values(this.chatData || {}).filter(msg => msg.type === 'voice').length;
            voiceMsgs.textContent = voiceCount;
        }
        
        if (fileMsgs) {
            const fileCount = Object.values(this.chatData || {}).filter(msg => 
                msg.type === 'image' || msg.type === 'file'
            ).length;
            fileMsgs.textContent = fileCount;
        }
    },
    
    // تنسيق حجم الملف
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'ك.ب', 'م.ب', 'ج.ب'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },
    
    // الحصول على أيقونة الملف حسب النوع
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
    
    // الحصول على اسم نوع الملف
    getFileTypeName: function(fileType) {
        if (!fileType) return 'ملف';
        
        if (fileType.includes('image')) return 'صورة';
        if (fileType.includes('pdf')) return 'PDF';
        if (fileType.includes('word') || fileType.includes('doc')) return 'Word';
        if (fileType.includes('audio') || fileType.includes('sound') || fileType.includes('mp3') || fileType.includes('wav') || fileType.includes('ogg') || fileType.includes('m4a')) {
            return 'صوت';
        }
        
        return 'ملف';
    },
    
    // عرض الإشعارات
    showNotification: function(message, type = 'info') {
        const toast = document.getElementById('global-toast');
        if (!toast) return;
        
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        toast.textContent = message;
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    },
    
    // الهروب من HTML
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==================== تصدير ====================
export default advancedChatUtils;