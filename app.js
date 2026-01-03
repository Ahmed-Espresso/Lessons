// ==================== تهيئة النظام ====================
console.log('🎯 تهيئة النظام...');

// ==================== تهيئة Firebase ====================
const firebaseConfig = {
    apiKey: "AIzaSyCYKp5mi2gDJGg4l5sOURJXGiQQOPDWU3s",
    authDomain: "students-59f43.firebaseapp.com",
    databaseURL: "https://students-59f43-default-rtdb.firebaseio.com",
    projectId: "students-59f43",
    storageBucket: "students-59f43.firebasestorage.app",
    messagingSenderId: "248717629262",
    appId: "1:248717629262:web:a7ee2ad69da4bc6f38f01f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// ==================== المتغيرات العامة ====================
let currentUser = null;
let currentUserRole = null;
let welcomeMessage = "";
let typingTimer = null;
let currentBot = {};
let currentFAQs = {};
let currentContacts = {};
let currentQC = {};
let qcSettings = {};
let currentAbout = {};
let fuseBot;
let welcomeButtons = [];
let isListening = false;
let voiceAsked = false;
let isSubmitting = false;
let loadingProgress = 0;
let loadingInterval;
let currentLoadingStep = 0;

const loadingSteps = [
  "جاري التحميل...",
  "جاري تحميل البيانات...", 
  "جاري تهيئة النظام...",
  "جاري التهيئة النهائية...",
  "تم التحميل بنجاح!"
];

// ==================== متغيرات التعرف على الصوت ====================
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';
recognition.continuous = false;
recognition.interimResults = false;

// ==================== الترجمة ====================
const translations = {
    botwelcm: { ar: 'مرحباً!' },
    botwelcm2: { ar: 'كيف يمكنني مساعدتك؟' },
    bot_reply_rewelcome: { ar: 'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊' },
    bot_reply_not_understand: { ar: 'عذرًا، لم أفهم. حاول إعادة الصياغة.' },
    phone_example: { ar: 'مثال' },
    qc_warn_no_name: { ar: 'الرجاء إدخال الاسم' },
    qc_warn_no_contact: { ar: 'الرجاء إدخال رقم الهاتف أو الإيميل' },
    invalid_phone: { ar: 'رقم الهاتف غير صحيح' },
    qc_sent_success: { ar: 'تم إرسال الرسالة بنجاح' },
    qc_sent_failed: { ar: 'فشل في إرسال الرسالة' },
    no_data: { ar: 'لا توجد بيانات حالياً' },
    logged_in: { ar: 'مرحباً' },
    logout: { ar: 'تسجيل الخروج' }
};

function currentLang() {
    return 'ar';
}

// ==================== رموز الدول ====================
const countryCodes = [
  { 
    code: '20', 
    name: { ar: 'مصر', en: 'Egypt' }, 
    flag: '🇪🇬', 
    pattern: /^(1[0-2]\d{8}|1[5-9]\d{8}|10\d{8}|11\d{8}|12\d{8})$/,
    example: '01012345678',
    whatsapp: true
  },
  { 
    code: '966', 
    name: { ar: 'السعودية', en: 'Saudi Arabia' }, 
    flag: '🇸🇦', 
    pattern: /^5[0-9]{8}$/,
    example: '512345678',
    whatsapp: true
  },
  { 
    code: '971', 
    name: { ar: 'الإمارات', en: 'UAE' }, 
    flag: '🇦🇪', 
    pattern: /^5[0-9]{8}$/,
    example: '501234567',
    whatsapp: true
  }
];

// ==================== إدارة الأدوار والمستخدمين ====================

// الحصول على دور المستخدم من قاعدة البيانات
async function getUserRole(uid) {
  try {
    const snapshot = await database.ref('users/' + uid).once('value');
    const userData = snapshot.val();
    return userData ? userData.role : null;
  } catch (error) {
    console.error('❌ خطأ في الحصول على دور المستخدم:', error);
    return null;
  }
}

// توجيه المستخدم حسب الدور
function redirectBasedOnRole(role) {
  console.log('🔀 توجيه المستخدم حسب الدور:', role);
  
  switch(role) {
    case 'admin':
      window.location.href = 'admin.html';
      break;
    case 'student':
      window.location.href = 'student.html';
      break;
    case 'parent':
      window.location.href = 'parent.html';
      break;
    default:
      // إذا لم يكن هناك دور محدد، نبقى في الصفحة الرئيسية
      console.log('⚠️ لا يوجد دور محدد للمستخدم، البقاء في الصفحة الرئيسية');
      showHomeSection();
  }
}

// تحديث واجهة المستخدم بناءً على حالة التسجيل
function updateAuthUI() {
  const toggleLoginBtn = document.getElementById('toggle-login-btn');
  const authText = document.getElementById('auth-text');
  
  if (currentUser) {
    // المستخدم مسجل الدخول
    if (toggleLoginBtn) {
      toggleLoginBtn.innerHTML = `<i class="fas fa-user"></i><span>${currentUser.email}</span>`;
      toggleLoginBtn.title = 'تسجيل الخروج';
      toggleLoginBtn.onclick = handleLogout;
    }
    if (authText) authText.textContent = 'تسجيل الخروج';
  } else {
    // المستخدم غير مسجل الدخول
    if (toggleLoginBtn) {
      toggleLoginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>تسجيل الدخول</span>';
      toggleLoginBtn.title = 'تسجيل الدخول';
      toggleLoginBtn.onclick = showLoginSection;
    }
    if (authText) authText.textContent = 'تسجيل الدخول';
  }
}

// ==================== دوال النظام الأساسية ====================

function loadCountryCodes(selectElementId, defaultCountry = '20') {
  const selectElement = document.getElementById(selectElementId);
  if (!selectElement) return;
  
  selectElement.innerHTML = '';
  
  const lang = currentLang();
  
  // إضافة option افتراضي
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = lang === 'ar' ? 'اختر الدولة' : 'Select Country';
  defaultOption.disabled = true;
  selectElement.appendChild(defaultOption);
  
  countryCodes.forEach(country => {
    const option = document.createElement('option');
    option.value = country.code;
    option.textContent = `${country.flag} ${country.name[lang]} (+${country.code})`;
    option.dataset.flag = country.flag;
    option.dataset.name = country.name[lang];
    option.dataset.pattern = country.pattern.toString();
    option.dataset.example = country.example;
    option.dataset.whatsapp = country.whatsapp;
    
    if (country.code === defaultCountry) {
      option.selected = true;
    }
    
    selectElement.appendChild(option);
  });
}

function validatePhoneNumber(phoneNumber, countryCode) {
  if (!phoneNumber || !countryCode) return false;
  
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 5) return false;
  
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) {
    return cleanNumber.length >= 7 && cleanNumber.length <= 15;
  }
  
  let numberToValidate = cleanNumber;
  
  if (countryCode === '20' && cleanNumber.startsWith('0')) {
    numberToValidate = cleanNumber.substring(1);
  }
  
  return country.pattern.test(numberToValidate);
}

// ==================== نظام التحميل ====================
function initLoadingSystem() {
  console.log('🔧 تهيئة نظام التحميل...');
  
  // إخفاء جميع الأقسام الرئيسية
  const mainSections = document.getElementById('main-sections');
  const pandaSection = document.getElementById('panda-section');
  
  if (mainSections) mainSections.style.display = 'none';
  if (pandaSection) pandaSection.style.display = 'none';
  
  // إظهار شاشة التحميل فقط
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) loadingScreen.style.display = 'flex';
  
  startLoadingProgress();
}

function startLoadingProgress() {
  loadingProgress = 0;
  currentLoadingStep = 0;
  
  if (loadingInterval) {
    clearInterval(loadingInterval);
  }
  
  loadingInterval = setInterval(() => {
    if (loadingProgress < 90) {
      loadingProgress += Math.random() * 10 + 5;
      if (loadingProgress > 90) loadingProgress = 90;
    } else {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
    
    updateLoadingProgress();
    
    if (loadingProgress >= 15 && currentLoadingStep < 1) {
      currentLoadingStep = 1;
      updateLoadingMessage();
    } else if (loadingProgress >= 30 && currentLoadingStep < 2) {
      currentLoadingStep = 2;
      updateLoadingMessage();
    } else if (loadingProgress >= 50 && currentLoadingStep < 3) {
      currentLoadingStep = 3;
      updateLoadingMessage();
    } else if (loadingProgress >= 70 && currentLoadingStep < 4) {
      currentLoadingStep = 4;
      updateLoadingMessage();
    }
  }, 300);
}

function updateLoadingProgress() {
  const progressFill = document.querySelector('.loading-progress-fill');
  const progressText = document.querySelector('.loading-progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${loadingProgress}%`;
  }
  if (progressText) {
    progressText.textContent = `${Math.round(loadingProgress)}%`;
  }
}

function updateLoadingMessage() {
  const messageElement = document.querySelector('.loading-message');
  if (messageElement && loadingSteps[currentLoadingStep]) {
    messageElement.textContent = loadingSteps[currentLoadingStep];
  }
}

function completeLoading() {
  console.log('✅ اكتمال التحميل...');
  
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  
  loadingProgress = 100;
  currentLoadingStep = 4;
  
  updateLoadingProgress();
  updateLoadingMessage();
  
  // تأخير قصير لإظهار الرسالة النهائية
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        loadingScreen.style.display = 'none';
        
        // إظهار الأقسام المناسبة بناءً على حالة المستخدم
        showHomeSection();
        
        console.log('🎉 تم تحميل الموقع بالكامل');
        
        // تشغيل تأثير الكتابة بعد تحميل المحتوى
        if (welcomeMessage) {
          setTimeout(() => {
            initTypingEffect();
          }, 500);
        }
      }, 500);
    }
  }, 1000);
}

// ==================== إدارة الشريط التنقلي ====================
function initNavbarScroll() {
  const navbar = document.getElementById('navsec');
  if (!navbar) return;
  
  let lastScrollY = window.pageYOffset;
  window.addEventListener('scroll', () => {
    const currentY = window.pageYOffset;
    if (currentY <= 0) {
      navbar.classList.remove('hide', 'show');
    } else if (currentY > lastScrollY) {
      navbar.classList.add('hide');
      navbar.classList.remove('show');
    } else {
      navbar.classList.add('show');
      navbar.classList.remove('hide');
    }
    lastScrollY = currentY;
  });
}

// ==================== إدارة الأقسام ====================
function showHomeSection() {
  console.log('🏠 عرض القسم الرئيسي...');
  
  const pandaSection = document.getElementById('panda-section');
  const mainSections = document.getElementById('main-sections');
  
  if (pandaSection) pandaSection.style.display = 'none';
  if (mainSections) mainSections.style.display = 'block';
  
  // تحديث الأزرار النشطة
  const homeBtn = document.getElementById('toggle-home-btn');
  const loginBtn = document.getElementById('toggle-login-btn');
  
  if (homeBtn) homeBtn.classList.add('active');
  if (loginBtn) loginBtn.classList.remove('active');
  
  // التمرير إلى الأعلى
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // إعادة تشغيل تأثير الكتابة إذا كان مخفيًا
  const typingContainer = document.getElementById('typing-container');
  if (typingContainer && typingContainer.innerHTML === '' && welcomeMessage) {
    initTypingEffect();
  }
}

function showLoginSection() {
  console.log('🔐 عرض قسم تسجيل الدخول...');
  
  const pandaSection = document.getElementById('panda-section');
  const mainSections = document.getElementById('main-sections');
  
  if (mainSections) mainSections.style.display = 'none';
  if (pandaSection) {
    pandaSection.style.display = 'block';
    
    // التمرير إلى قسم الباندا
    const navH = document.getElementById('navsec')?.offsetHeight || 0;
    window.scrollTo({
      top: pandaSection.offsetTop - navH,
      behavior: 'smooth'
    });
  }
  
  // تحديث الأزرار النشطة
  const homeBtn = document.getElementById('toggle-home-btn');
  const loginBtn = document.getElementById('toggle-login-btn');
  
  if (loginBtn) loginBtn.classList.add('active');
  if (homeBtn) homeBtn.classList.remove('active');
}

// ==================== رسالة الترحيب والكتابة ====================
function renderWelcome(msg) {
  const lang = currentLang();
  if (msg && msg.text) {
    welcomeMessage = typeof msg.text === 'object'
      ? (msg.text[lang] || msg.text.ar || '')
      : (msg.text || 'مرحباً بكم في نظام الإدارة');
  } else {
    welcomeMessage = 'مرحباً بكم في نظام الإدارة';
  }
  
  console.log('📝 رسالة الترحيب:', welcomeMessage);
  
  clearTimeout(typingTimer);
  const container = document.getElementById('typing-container');
  if (container) {
    container.innerHTML = '';
  }
  
  // بدء تأثير الكتابة بعد فترة قصيرة
  setTimeout(() => {
    initTypingEffect();
  }, 300);
}

function initTypingEffect() {
  const container = document.getElementById('typing-container');
  if (!container || !welcomeMessage) {
    console.log('❌ لا يوجد حاوية أو رسالة ترحيب');
    return;
  }
  
  container.innerHTML = '';
  
  // إنشاء سطر الكتابة
  const lineDiv = document.createElement('div');
  lineDiv.className = 'typing-line';
  container.appendChild(lineDiv);
  
  let charIndex = 0;
  const text = welcomeMessage;
  
  function typeCharacter() {
    if (charIndex <= text.length) {
      // إضافة المؤشر الوامض
      lineDiv.innerHTML = text.substring(0, charIndex) + '<span class="blinking-cursor">|</span>';
      charIndex++;
      typingTimer = setTimeout(typeCharacter, 80);
    } else {
      // إزالة المؤشر عند الانتهاء
      lineDiv.innerHTML = text;
      
      // إعادة التشغيل بعد 10 ثوان
      typingTimer = setTimeout(() => {
        charIndex = 0;
        lineDiv.innerHTML = '';
        typeCharacter();
      }, 10000);
    }
  }
  
  typeCharacter();
}

// ==================== من نحن ====================
function loadAboutContent(data) {
  const lang = currentLang();
  let content = '';
  
  if (data && typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const item = data[firstKey];
      if (item && item.content) {
        content = typeof item.content === 'object'
          ? (item.content[lang] || item.content.ar || '')
          : (item.content || '');
      } else {
        content = translations.no_data.ar;
      }
    } else {
      content = translations.no_data.ar;
    }
  } else {
    content = translations.no_data.ar;
  }
  
  const aboutContent = document.getElementById('aboutContent');
  if (aboutContent) {
    aboutContent.innerHTML = content.replace(/\n/g, '<br>');
  }
}

// ==================== بطاقات التواصل ====================
const iconColors = {
  "fa-google": "#D44638", "fa-whatsapp": "#25D366", "fa-facebook": "#1877F2",
  "fa-twitter": "#1DA1F2", "fa-linkedin": "#0077B5", "fa-instagram": "#E4405F",
  "fa-github": "#333", "fa-paypal": "#1877F2", "fa-telegram": "#0088cc",
  "fa-tiktok": "#69c9d0", "fa-youtube": "#ff0000", "fa-microsoft": "#6666ff", "fa-at": "#666666"
};

function renderContactCards(data) {
  const grid = document.getElementById('contactGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // إذا لم توجد بيانات، عرض رسالة
  if (!data || Object.keys(data).length === 0) {
    const noDataMsg = document.createElement('div');
    noDataMsg.className = 'no-data-message';
    noDataMsg.innerHTML = `<i class="fas fa-info-circle"></i> <span>${translations.no_data.ar}</span>`;
    grid.appendChild(noDataMsg);
    return;
  }
  
  const lang = currentLang();
  
  Object.values(data).forEach((c, index) => {
    const name = typeof c.name === 'object'
      ? (c.name[lang] || c.name.ar || `اتصال ${index + 1}`)
      : (c.name || `اتصال ${index + 1}`);
    
    const a = document.createElement('a');
    a.className = 'contact-card';
    a.href = c.link || '#';
    a.target = '_blank';
    
    // تحديد اللون بناءً على الأيقونة
    let iconColor = '#000000';
    if (c.icon) {
      // استخراج اسم الفئة الأساسي للأيقونة
      const iconClass = c.icon.split(' ').find(cls => cls.startsWith('fa-'));
      if (iconClass && iconColors[iconClass]) {
        iconColor = iconColors[iconClass];
      }
    }
    
    // تطبيق اللون كنمط مضمن مباشرة
    a.style.cssText = `
      --card-color: ${iconColor};
      color: ${iconColor} !important;
      border-color: ${iconColor} !important;
    `;
    
    // إضافة تأثير hover
    a.onmouseenter = function() {
      this.style.backgroundColor = `${iconColor}20`; // شفاف 20%
    };
    a.onmouseleave = function() {
      this.style.backgroundColor = '';
    };
    
    a.innerHTML = `<i class="${c.icon || 'fas fa-link'}" style="color: ${iconColor} !important;"></i><h3>${name}</h3>`;
    grid.appendChild(a);
  });
}

// ==================== الأسئلة الشائعة ====================
function renderPublicFAQs(data) {
  const list = document.getElementById('faqList');
  if (!list) return;
  
  list.innerHTML = '';
  const lang = currentLang();
  
  // إذا لم توجد بيانات، عرض رسالة
  if (!data || Object.keys(data).length === 0) {
    const noDataMsg = document.createElement('div');
    noDataMsg.className = 'no-data-message';
    noDataMsg.innerHTML = `<i class="fas fa-info-circle"></i> <span>${translations.no_data.ar}</span>`;
    list.appendChild(noDataMsg);
    return;
  }
  
  Object.values(data)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach((f, index) => {
      const q = typeof f.question === 'object'
        ? (f.question[lang] || f.question.ar || `سؤال ${index + 1}`)
        : (f.question || `سؤال ${index + 1}`);
      
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.style.setProperty('--faq-color', f.color || '#fff');

      const btn = document.createElement('button');
      btn.className = 'faq-btn';
      btn.innerHTML = `<i class="${f.icon || 'fas fa-question-circle'}"></i><span>${q}</span>`;
      btn.onclick = () => displayAnswer({
        answer: typeof f.answer === 'object'
          ? (f.answer[lang] || f.answer.ar || 'لا توجد إجابة متاحة')
          : (f.answer || 'لا توجد إجابة متاحة'),
        color: f.color || '#9e9e9e'
      });

      item.appendChild(btn);
      list.appendChild(item);
    });
}

function displayAnswer({ answer, color }) {
  const box = document.getElementById('answerBox');
  if (!box) return;
  
  box.style.borderColor = color;
  const cnt = box.querySelector('.answer-content');
  if (cnt) {
    cnt.style.color = color;
    cnt.textContent = answer;
    box.style.display = 'block';
  }
}

// ==================== البوت الدردشة ====================
function setupChatBot(responses) {
  const lang = currentLang();
  
  // إذا لم توجد بيانات، عرض رسالة ترحيبية بسيطة
  if (!responses || Object.keys(responses).length === 0) {
    responses = {
      welcome1: {
        question: { ar: 'ما هو النظام؟' },
        response: { ar: 'هذا نظام إدارة متكامل للمدارس والطلاب.' },
        category: 'welcome',
        order: 1
      }
    };
  }
  
  welcomeButtons = Object.values(responses)
    .filter(r => r.category === 'welcome')
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .slice(0, 4)
    .map(r => ({
      raw: r,
      question: typeof r.question === 'object'
        ? r.question[lang] || r.question.ar
        : r.question
    }));

  const list = Object.values(responses).map(r => ({
    question: typeof r.question === 'object'
      ? r.question[lang] || r.question.ar
      : r.question,
    response: r.response,
    keywords: r.keywords || []
  }));

  fuseBot = new Fuse(list, {
    keys: ['question', 'keywords'],
    threshold: 0.3,
    includeScore: true
  });

  showWelcomeMessage();
  initVoiceRecognition();
}

function showWelcomeMessage() {
  const box = document.getElementById('chatBox');
  if (!box) return;

  const lang = currentLang();
  const greeting = translations.botwelcm?.[lang] || 'مرحباً!';
  const prompt = translations.botwelcm2?.[lang] || 'كيف يمكنني مساعدتك؟';

  box.innerHTML = `
    <div class="message bot">
      <h3>${greeting}</h3>
      <p>${prompt}</p>
      ${welcomeButtons.length > 0 ? `
      <div class="examples">
        ${welcomeButtons.map(b => `
          <button class="welcome-btn" 
                  onclick="handleBotButton('${b.question.replace(/'/g, "\\'")}')">
            ${b.question}
          </button>`
        ).join('')}
      </div>` : ''}
    </div>`;
}

function handleBotButton(q) {
  const userInput = document.getElementById('userInput');
  if (userInput) {
    userInput.value = q;
    sendBotMessage();
  }
}

function initVoiceRecognition() {
  const voiceBtn = document.getElementById('voice-btn');
  if (!voiceBtn) return;

  recognition.onstart = () => {
    voiceBtn.classList.add('recording');
    isListening = true;
  };
  
  recognition.onend = () => {
    voiceBtn.classList.remove('recording');
    isListening = false;
  };
  
  recognition.onerror = () => {
    voiceBtn.classList.remove('recording');
    isListening = false;
    console.error('خطأ في التعرف على الصوت');
  };
  
  recognition.onresult = e => {
    const userInput = document.getElementById('userInput');
    if (userInput && e.results[0]) {
      userInput.value = e.results[0][0].transcript;
      voiceAsked = true;
      sendBotMessage();
    }
  };

  voiceBtn.onclick = () => {
    if (!isListening) {
      try {
        recognition.start();
      } catch (error) {
        console.error('لا يمكن بدء التعرف على الصوت:', error);
        showToast('المتصفح لا يدخدم التعرف على الصوت', 'error');
      }
    }
  };
}

function sendBotMessage() {
  const inp = document.getElementById('userInput');
  const box = document.getElementById('chatBox');
  
  if (!inp || !box) return;
  
  const txt = inp.value.trim();
  if (!txt) return;

  box.innerHTML += `<div class="message user">${txt}</div>`;
  inp.value = '';
  box.innerHTML += `
    <div class="message bot">
      <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>`;
  
  // التمرير إلى الأسفل
  setTimeout(() => {
    box.scrollTop = box.scrollHeight;
  }, 100);

  setTimeout(() => {
    const typingIndicator = box.querySelector('.typing-indicator');
    if (typingIndicator && typingIndicator.parentElement) {
      typingIndicator.parentElement.remove();
    }

    let resp = '';
    const lower = txt.toLowerCase();
    const greetings = ['اهلا', 'مرحبا', 'هلا', 'السلام عليكم'];
    
    if (greetings.some(g => lower.includes(g))) {
      resp = translations['bot_reply_rewelcome']?.[currentLang()] ||
        'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊';
    } else {
      const searchResults = fuseBot ? fuseBot.search(txt) : [];
      const found = searchResults[0]?.item;
      if (found) {
        const r = found.response;
        resp = typeof r === 'object' ?
          (r[currentLang()] || r.ar || '') :
          (r || '');
      } else {
        resp = translations['bot_reply_not_understand']?.[currentLang()] ||
          'عذرًا، لم أفهم. حاول إعادة الصياغة.';
      }
    }

    box.innerHTML += `<div class="message bot">${resp}</div>`;
    
    // التمرير إلى الأسفل
    setTimeout(() => {
      box.scrollTop = box.scrollHeight;
    }, 100);

    if (voiceAsked && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(resp);
      u.lang = currentLang() === 'ar' ? 'ar-SA' : 'en-US';
      u.rate = 0.9;
      speechSynthesis.speak(u);
      voiceAsked = false;
    }
  }, 1000);
}

// ==================== التواصل السريع ====================
function initQuickContact(settings) {
  qcSettings = settings || {};
  const form = document.getElementById('quickContactForm');
  const nameEl = document.getElementById('qcName');
  const contactEl = document.getElementById('qcContact');
  const countryCodeEl = document.getElementById('qcCountryCode');
  const msgEl = document.getElementById('qcMessage');
  const btnSubmit = document.getElementById('qcSubmit');
  const msgBox = document.getElementById('qcUserMessageBox');

  if (!form || !nameEl || !contactEl || !countryCodeEl || !msgEl || !btnSubmit) {
    console.error('❌ عناصر التواصل السريع غير موجودة');
    return;
  }

  function updateContactPlaceholder() {
    const countryCode = countryCodeEl.value;
    const country = countryCodes.find(c => c.code === countryCode);
    const lang = currentLang();
    
    if (country && country.example) {
      contactEl.placeholder = `${translations.phone_example?.[lang] || 'Example'}: ${country.example}`;
    } else {
      contactEl.placeholder = translations.phone_example?.[lang] || 'أدخل رقم الهاتف';
    }
  }

  // تحميل رموز الدول
  loadCountryCodes('qcCountryCode', '20');
  countryCodeEl.addEventListener('change', updateContactPlaceholder);
  
  // تحديث placeholder أول مرة
  setTimeout(updateContactPlaceholder, 100);

  function showUserMessage(message, isError = false) {
    if (!msgBox) return;
    
    msgBox.className = `message-box ${isError ? 'error' : 'success'}`;
    msgBox.textContent = message;
    msgBox.style.display = 'block';
    
    setTimeout(() => {
      msgBox.style.display = 'none';
    }, 5000);
  }

  btnSubmit.onclick = async () => {
    if (!form.reportValidity()) return;
    
    const name = nameEl.value.trim();
    const contact = contactEl.value.trim();
    const countryCode = countryCodeEl.value;
    const message = msgEl.value.trim();
    
    if (!name) {
      showUserMessage(translations.qc_warn_no_name?.[currentLang()] || 'الرجاء إدخال الاسم', true);
      return;
    }
    
    if (!contact) {
      showUserMessage(translations.qc_warn_no_contact?.[currentLang()] || 'الرجاء إدخال رقم الهاتف أو الإيميل', true);
      return;
    }
    
    const isPhoneNumber = /^\d+$/.test(contact.replace(/\D/g, ''));
    
    if (isPhoneNumber) {
      if (!validatePhoneNumber(contact, countryCode)) {
        const lang = currentLang();
        const invalidPhoneMsg = translations.invalid_phone?.[lang] || 'رقم الهاتف غير صحيح';
        showUserMessage(invalidPhoneMsg, true);
        return;
      }
      
      const saved = await saveCustomerMessage(name, contact, message, countryCode, true);
      if (saved) {
        form.reset();
        showUserMessage(translations.qc_sent_success?.[currentLang()] || 'تم إرسال الرسالة بنجاح');
      } else {
        showUserMessage(translations.qc_sent_failed?.[currentLang()] || 'فشل في إرسال الرسالة', true);
      }
    } else {
      // التحقق من صحة الإيميل
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(contact)) {
        showUserMessage('البريد الإلكتروني غير صحيح', true);
        return;
      }
      
      const saved = await saveCustomerMessage(name, contact, message);
      if (saved) {
        form.reset();
        showUserMessage(translations.qc_sent_success?.[currentLang()] || 'تم إرسال الرسالة بنجاح');
      } else {
        showUserMessage(translations.qc_sent_failed?.[currentLang()] || 'فشل في إرسال الرسالة', true);
      }
    }
  };
}

async function saveCustomerMessage(name, contact, message, countryCode = null, isWhatsApp = false) {
  try {
    const messagesRef = database.ref('customerMessages');
    const fullPhone = countryCode ? getFullPhoneNumberForWhatsApp(countryCode, contact) : contact;
    
    const newMessage = {
      name,
      contact,
      message,
      countryCode,
      fullPhone,
      isWhatsApp,
      timestamp: Date.now(),
      status: 'new',
      read: false
    };
    
    await messagesRef.push(newMessage);
    return true;
  } catch (error) {
    console.error('❌ فشل في ارسال الرسالة:', error);
    return false;
  }
}

function getFullPhoneNumberForWhatsApp(countryCode, phoneNumber) {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  let finalNumber = cleanNumber.replace(/^0+/, '');
  return countryCode + finalNumber;
}

// ==================== نظام تسجيل الدخول ====================
function initLoginSystem() {
  // تأثيرات الباندا
  const passwordInput = document.getElementById('password');
  const loginForm = document.getElementById('login-form');
  const loginButton = document.getElementById('login-button');
  const loginAlert = document.getElementById('login-alert');
  
  if (!passwordInput || !loginForm || !loginButton) {
    console.error('❌ عناصر تسجيل الدخول غير موجودة');
    return;
  }
  
  passwordInput.addEventListener('focus', function() {
    loginForm.classList.add('up');
  });
  
  passwordInput.addEventListener('blur', function() {
    loginForm.classList.remove('up');
  });

  // حركة عيون الباندا
  document.addEventListener("mousemove", function(event) {
    const eyeBalls = document.querySelectorAll('.eye-ball');
    if (eyeBalls.length === 0) return;
    
    const dw = window.innerWidth / 15;
    const dh = window.innerHeight / 15;
    const x = event.pageX / dw;
    const y = event.pageY / dh;
    
    eyeBalls.forEach(eye => {
      eye.style.width = `${x}px`;
      eye.style.height = `${y}px`;
    });
  });

  // زر تسجيل الدخول
  loginButton.addEventListener('click', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    
    try {
      showToast('جاري تسجيل الدخول...', 'info');
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      currentUser = userCredential.user;
      
      // الحصول على دور المستخدم من قاعدة البيانات
      const userRole = await getUserRole(currentUser.uid);
      currentUserRole = userRole;
      
      if (userRole) {
        // توجيه المستخدم إلى الصفحة المناسبة حسب الدور
        showToast('تم تسجيل الدخول بنجاح', 'success');
        setTimeout(() => {
          redirectBasedOnRole(userRole);
        }, 1000);
      } else {
        showToast('تم تسجيل الدخول، ولكن ليس لديك صلاحية محددة', 'warning');
        showHomeSection();
      }
      
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      loginForm.classList.add('wrong-entry');
      if (loginAlert) loginAlert.style.display = 'block';
      
      setTimeout(function() {
        loginForm.classList.remove('wrong-entry');
        if (loginAlert) loginAlert.style.display = 'none';
      }, 3000);
      
      showToast('فشل تسجيل الدخول. تحقق من البيانات', 'error');
    }
  });
}

// تسجيل الخروج
function handleLogout() {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    auth.signOut().then(() => {
      currentUser = null;
      currentUserRole = null;
      updateAuthUI();
      showToast('تم تسجيل الخروج بنجاح', 'success');
      showHomeSection();
    }).catch(error => {
      console.error('❌ خطأ في تسجيل الخروج:', error);
      showToast('فشل تسجيل الخروج', 'error');
    });
  }
}

// ==================== نظام التنبيهات ====================
function showToast(message, type = 'success') {
  const toast = document.getElementById('global-toast');
  if (!toast) {
    // إنشاء عنصر toast إذا لم يكن موجودًا
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
}

// ==================== تحميل البيانات ====================
function loadInitialData() {
  console.log('📦 بدء تحميل البيانات...');
  
  let loadedCount = 0;
  const totalLoads = 6;

  function updateProgress() {
    loadedCount++;
    const progress = 10 + (loadedCount / totalLoads) * 80;
    loadingProgress = Math.min(progress, 90);
    updateLoadingProgress();
    
    if (loadedCount === 1) {
      currentLoadingStep = 1;
      updateLoadingMessage();
    } else if (loadedCount === 2) {
      currentLoadingStep = 2;
      updateLoadingMessage();
    } else if (loadedCount === 4) {
      currentLoadingStep = 3;
      updateLoadingMessage();
    } else if (loadedCount === 5) {
      currentLoadingStep = 4;
      updateLoadingMessage();
    }
    
    if (loadedCount >= totalLoads) {
      console.log('✅ اكتمل تحميل جميع البيانات');
      loadingProgress = 100;
      updateLoadingProgress();
      setTimeout(completeLoading, 500);
    }
  }

  try {
    console.log('📝 جاري تحميل رسالة الترحيب...');
    database.ref('storeWelcomeMessage').on('value', snap => {
      const data = snap.val();
      console.log('✅ تم تحميل رسالة الترحيب:', data);
      renderWelcome(data);
      updateProgress();
    }, error => {
      console.error('❌ خطأ في تحميل رسالة الترحيب:', error);
      renderWelcome(null);
      updateProgress();
    });
  } catch (e) {
    console.error('❌ استثناء في تحميل رسالة الترحيب:', e);
    renderWelcome(null);
    updateProgress();
  }
  
  try {
    console.log('👤 جاري تحميل قسم من أنا...');
    database.ref('storeAboutUs').on('value', snap => {
      const data = snap.val();
      console.log('✅ تم تحميل قسم من أنا:', data);
      currentAbout = data || {};
      loadAboutContent(currentAbout);
      updateProgress();
    }, error => {
      console.error('❌ خطأ في تحميل قسم من أنا:', error);
      currentAbout = {};
      loadAboutContent(currentAbout);
      updateProgress();
    });
  } catch (e) {
    console.error('❌ استثناء في تحميل قسم من أنا:', e);
    currentAbout = {};
    loadAboutContent(currentAbout);
    updateProgress();
  }
  
  try {
    console.log('📞 جاري تحميل معلومات التواصل...');
    database.ref('storeContactInfo').on('value', snap => {
      const data = snap.val();
      console.log('✅ تم تحميل معلومات التواصل:', data);
      currentContacts = data || {};
      renderContactCards(currentContacts);
      updateProgress();
    }, error => {
      console.error('❌ خطأ في تحميل معلومات التواصل:', error);
      currentContacts = {};
      renderContactCards(currentContacts);
      updateProgress();
    });
  } catch (e) {
    console.error('❌ استثناء في تحميل معلومات التواصل:', e);
    currentContacts = {};
    renderContactCards(currentContacts);
    updateProgress();
  }
  
  try {
    console.log('❓ جاري تحميل الأسئلة الشائعة...');
    database.ref('storeFaqs').on('value', snap => {
      const data = snap.val();
      console.log('✅ تم تحميل الأسئلة الشائعة:', data);
      currentFAQs = data || {};
      renderPublicFAQs(currentFAQs);
      updateProgress();
    }, error => {
      console.error('❌ خطأ في تحميل الأسئلة الشائعة:', error);
      currentFAQs = {};
      renderPublicFAQs(currentFAQs);
      updateProgress();
    });
  } catch (e) { 
    console.error('❌ استثناء في تحميل الأسئلة الشائعة:', e);
    currentFAQs = {};
    renderPublicFAQs(currentFAQs);
    updateProgress();
  }
  
  try {
    console.log('🤖 جاري تحميل ردود البوت...');
    database.ref('storeBotResponses').on('value', snap => {
      const data = snap.val();
      console.log('✅ تم تحميل ردود البوت:', data);
      currentBot = data || {};
      setupChatBot(currentBot);
      updateProgress();
    }, error => {
      console.error('❌ خطأ في تحميل ردود البوت:', error);
      currentBot = {};
      setupChatBot(currentBot);
      updateProgress();
    });
  } catch (e) {
    console.error('❌ استثناء في تحميل ردود البوت:', e);
    currentBot = {};
    setupChatBot(currentBot);
    updateProgress();
  }
  
  try {
    console.log('📨 جاري تحميل إعدادات التواصل السريع...');
    database.ref('storeQuickContact').on('value', snap => {
      const data = snap.val();
      console.log('✅ تم تحميل إعدادات التواصل السريع:', data);
      qcSettings = data || {};
      initQuickContact(qcSettings);
      updateProgress();
    }, error => {
      console.error('❌ خطأ في تحميل إعدادات التواصل السريع:', error);
      qcSettings = {};
      initQuickContact(qcSettings);
      updateProgress();
    });
  } catch (e) {
    console.error('❌ استثناء في تحميل إعدادات التواصل السريع:', e);
    qcSettings = {};
    initQuickContact(qcSettings);
    updateProgress();
  }
}

// ==================== ضمان اكتمال التحميل ====================
function ensureCompleteLoading() {
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen && loadingScreen.style.display !== 'none') {
      console.warn('⚠️ تم تفعيل النظام البديل لإكمال التحميل');
      completeLoading();
    }
  }, 15000);
}

// ==================== إعداد الصفحات الداخلية ====================
function initAdminPage() {
  console.log('👑 تهيئة صفحة الأدمن...');
  // صفحة الأدمن فارغة حالياً - ستضاف لاحقاً
}

function initStudentPage() {
  console.log('🎓 تهيئة صفحة الطالب...');
  // صفحة الطالب فارغة حالياً - ستضاف لاحقاً
}

function initParentPage() {
  console.log('👨‍👩‍👧‍👦 تهيئة صفحة ولي الأمر...');
  // صفحة ولي الأمر فارغة حالياً - ستضاف لاحقاً
}

// ==================== تهيئة الصفحة بناءً على نوعها ====================
function initPageBasedOnPath() {
  const path = window.location.pathname;
  
  if (path.includes('admin.html')) {
    initAdminPage();
  } else if (path.includes('student.html')) {
    initStudentPage();
  } else if (path.includes('parent.html')) {
    initParentPage();
  }
}

// ==================== تهيئة نظام تسجيل الدخول للصفحات الداخلية ====================
function initInternalPagesAuth() {
  // زر تسجيل الخروج في الصفحات الداخلية
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // زر العودة للرئيسية في الصفحات الداخلية
  const homeBtn = document.getElementById('toggle-home-btn');
  if (homeBtn && !window.location.pathname.includes('index.html')) {
    homeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
}

// ==================== تهيئة الصفحة الرئيسية ====================
function initIndexPage() {
  // تهيئة نظام التحميل
  initLoadingSystem();
  ensureCompleteLoading();
  
  // تحميل بيانات البلدان بعد فترة
  setTimeout(() => {
    loadCountryCodes('qcCountryCode', '20');
  }, 500);
  
  // تهيئة أنظمة تسجيل الدخول
  initLoginSystem();
  
  // تحميل البيانات من Firebase
  loadInitialData();
  
  // إعداد مستمعي الأحداث للأزرار
  const homeBtn = document.getElementById('toggle-home-btn');
  const loginBtn = document.getElementById('toggle-login-btn');
  const sendBtn = document.getElementById('send-btn');
  const userInput = document.getElementById('userInput');
  
  if (homeBtn) homeBtn.addEventListener('click', showHomeSection);
  if (loginBtn) loginBtn.addEventListener('click', showLoginSection);
  if (sendBtn) sendBtn.addEventListener('click', sendBotMessage);
  
  // إضافة مستمع للأدخال بالإنتر
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendBotMessage();
      }
    });
  }
  
  // تهيئة نظام التمرير
  initNavbarScroll();
}

// ==================== تهيئة الصفحة ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 بدء تهيئة التطبيق...');
  
  // التمرير إلى الأعلى
  window.scrollTo({ top: 0, behavior: 'auto' });
  
  // مراقبة حالة المصادقة
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    
    if (user) {
      // الحصول على دور المستخدم
      const role = await getUserRole(user.uid);
      currentUserRole = role;
      
      console.log('👤 المستخدم مسجل الدخول:', user.email, 'الدور:', role);
      
      // تحديث واجهة المستخدم
      updateAuthUI();
      
      // إذا كان المستخدم في الصفحة الرئيسية وكان لديه دور، نوجهه للصفحة المناسبة
      if (window.location.pathname.includes('index.html') && role) {
        console.log('🔀 توجيه المستخدم المسجل...');
        setTimeout(() => {
          redirectBasedOnRole(role);
        }, 1000);
      }
    } else {
      console.log('👤 لا يوجد مستخدم مسجل الدخول');
      currentUserRole = null;
      updateAuthUI();
      
      // إذا كان المستخدم في صفحة داخلية وهو غير مسجل، نعيده للصفحة الرئيسية
      if (!window.location.pathname.includes('index.html')) {
        console.log('⚠️ المستخدم غير مسجل في صفحة داخلية، إعادة التوجيه...');
        window.location.href = 'index.html';
      }
    }
  });
  
  // تهيئة الصفحة الرئيسية
  if (window.location.pathname.includes('index.html')) {
    initIndexPage();
  }
  
  // تهيئة الصفحات الداخلية
  initPageBasedOnPath();
  initInternalPagesAuth();
  
  console.log('✅ تم تهيئة التطبيق بنجاح');
});

// جعل الدوال متاحة عالمياً
window.sendBotMessage = sendBotMessage;
window.handleBotButton = handleBotButton;
window.showToast = showToast;
window.handleLogout = handleLogout;
window.showHomeSection = showHomeSection;
window.showLoginSection = showLoginSection;