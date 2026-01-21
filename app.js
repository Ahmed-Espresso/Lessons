// ==================== تهيئة النظام ====================
console.log('🎯 تهيئة النظام...');

// ==================== تهيئة Firebase ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, get, set, update, remove, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js/dist/fuse.esm.js";
import { initI18n, setLanguage, applyTranslations, translations, getTranslatedText , i18n, toggleLanguage } from './i18n.js';
import contentUtils from "./content.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ==================== المتغيرات العامة ====================
let currentUser = null;
let currentUserRole = null;
let loadingProgress = 0;
let loadingInterval;
let currentLoadingStep = 0;

// متغيرات إدارة الأقسام
let welcomeMessage = "";
let typingTimer = null;
let currentBot = {};
let currentFAQs = {};
let currentContacts = {};
let currentQC = {};
let qcSettings = {};
let currentAbout = {};
let fuseBot,
    welcomeButtons = [],
    isListening = false,
    voiceAsked = false;

let filterResetTimer = null;
let isSubmitting = false;

// خطوات التحميل المحسنة
const loadingSteps = [
    "جاري التحميل...",
    "جاري تحميل البيانات...", 
    "جاري تهيئة ...",
    "جاري تحميل ...",
    "جاري التهيئة النهائية...",
    "تم التحميل بنجاح!"
];

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
const recognitionSearch = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// ==================== دوال المساعدة العامة ====================
function currentLang() {
  return document.documentElement.lang || 'ar';
}

function getLocalizedText(obj) {
  const lang = currentLang();
  if (!obj) return '';
  return typeof obj === 'object' ? (obj[lang] || obj.ar) : obj;
}

// رموز الدول
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
      },
      { 
        code: '970', 
        name: { ar: 'فلسطين', en: 'Palestine' }, 
        flag: '🇵🇸', 
        pattern: /^5[0-9]{8}$/,
        example: '599123456',
        whatsapp: true
      }
];

// ==================== دوال مساعدة ====================
const utils = {
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

    currentLang: function() {
        return document.documentElement.lang || 'ar';
    },

    getLocalizedText: function(obj) {
        const lang = this.currentLang();
        if (!obj) return '';
        return typeof obj === 'object' ? (obj[lang] || obj.ar) : obj;
    },

    // دوال رموز الدول
    loadCountryCodes: function(selectElementId, defaultCountry = '20') {
        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) {
            console.log('❌ لم يتم العثور على العنصر:', selectElementId);
            return;
        }
        
        const lang = this.currentLang();
        console.log('🌍 تحميل رموز الدول للغة:', lang);
        
        // حفظ القيمة المحددة حالياً
        const currentValue = selectElement.value;
        
        // مسح الخيارات القديمة
        selectElement.innerHTML = '';
        
        // إضافة option افتراضي
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = lang === 'ar' ? 'اختر الدولة' : 'Select Country';
        defaultOption.disabled = true;
        defaultOption.selected = !currentValue;
        selectElement.appendChild(defaultOption);
        
        // إضافة جميع رموز الدول
        countryCodes.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = `${country.flag} ${country.name[lang]} (+${country.code})`;
            option.dataset.flag = country.flag;
            option.dataset.name = country.name[lang];
            option.dataset.pattern = country.pattern.toString();
            option.dataset.example = country.example;
            option.dataset.whatsapp = country.whatsapp;
            option.dataset.i18n = `country.${country.code}`; // إضافة مفتاح الترجمة
            
            if (country.code === defaultCountry || country.code === currentValue) {
                option.selected = true;
            }
            
            selectElement.appendChild(option);
        });
        
        // استعادة القيمة المحددة إذا كانت موجودة
        if (currentValue && countryCodes.find(c => c.code === currentValue)) {
            selectElement.value = currentValue;
        }
        
        // تحديث placeholder للرقم
        setTimeout(() => this.updateContactPlaceholder(), 100);
    },

    validatePhoneNumber: function(phoneNumber, countryCode) {
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
    },

    createWhatsAppLink: function(phoneNumber, message = '') {
        const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
        const encodedMessage = encodeURIComponent(message);
        return `https://wa.me/${fullNumber}${message ? `?text=${encodedMessage}` : ''}`;
    },

    updateContactPlaceholder: function() {
        const countryCodeEl = document.getElementById('qcCountryCode');
        const contactEl = document.getElementById('qcContact');
        
        if (!countryCodeEl || !contactEl) return;
        
        const countryCode = countryCodeEl.value;
        const country = countryCodes.find(c => c.code === countryCode);
        const lang = this.currentLang();
        
        if (country && country.example) {
            const exampleText = getTranslatedText('phone.example') || 'مثال';
            contactEl.placeholder = `${exampleText}: ${country.example}`;
        } else {
            contactEl.placeholder = getTranslatedText('contactForm.contactPlaceholder') || 'أدخل رقم الهاتف أو الإيميل';
        }
    }
};

// ==================== تحديث فوري للترجمة ====================
function updateTranslationsImmediately(newTranslations) {
    if (newTranslations && translations) {
        Object.assign(translations, newTranslations);
        applyTranslations();
        
        // تحديث البوت فورياً
        if (typeof window.setupChatBot === 'function' && currentBot) {
            window.setupChatBot(currentBot);
        }
        
        // تحديث الأسئلة الشائعة فورياً
        if (typeof window.renderPublicFAQs === 'function' && currentFAQs) {
            window.renderPublicFAQs(currentFAQs);
        }
        
        // تحديث التواصل فورياً
        if (typeof window.renderContactCards === 'function' && currentContacts) {
            window.renderContactCards(currentContacts);
        }
        
        // تحديث رسالة الترحيب فورياً
        if (typeof window.renderWelcome === 'function' && welcomeMessage) {
            window.renderWelcome(welcomeMessage);
        }
        
        console.log('🔄 تم تحديث الترجمات فورياً');
    }
}

// ==================== نظام التحميل المحسن ====================
function initLoadingSystem() {
    console.log('🔧 تهيئة نظام التحميل...');
    
    // التأكد من تطبيق الثيم الافتراضي
    const currentTheme = localStorage.getItem('theme');
    if (!currentTheme || !['night', 'apple', 'wine', 'coffee', 'space', 'water', 'wild'].includes(currentTheme)) {
        localStorage.setItem('theme', 'apple'); // تغيير الافتراضي إلى apple
        document.documentElement.classList.add('theme-apple');
    }
    
    const mainSections = document.getElementById('main-sections');
    const pandaSection = document.getElementById('panda-section');
    
    if (mainSections) mainSections.style.display = 'none';
    if (pandaSection) pandaSection.style.display = 'none';
    
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
    currentLoadingStep = 5;
    
    updateLoadingProgress();
    updateLoadingMessage();
    
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                showHomeSection();
                console.log('🎉 تم تحميل الموقع بالكامل');
                
                // بدء الرسوم المتحركة للعناصر
                if (typeof initSectionObserver === 'function') {
                    initSectionObserver();
                }
            }, 500);
        }
    }, 1000);
}

// ==================== تحديث الـ Placeholders ====================
function updatePlaceholders() {
  const lang = currentLang();
  
  // حقول البحث والبيانات
  const elementsToUpdate = [
    { id: 'searchName', attr: 'placeholder' },
    { id: 'userInput', attr: 'placeholder' },
    { id: 'bot-field', attr: 'placeholder' },
    { id: 'search-field', attr: 'placeholder' },
    { id: 'qcContact', attr: 'placeholder' } // أضفت هذا السطر
  ];
  
  elementsToUpdate.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      const placeholderKey = item.id + '_placeholder';
      const placeholderText = translations[placeholderKey]?.[lang] || 
                            element.dataset.placeholder ||
                            (lang === 'ar' ? element.dataset.placeholderAr : element.dataset.placeholderEn);
      
      if (placeholderText) {
        element[item.attr] = placeholderText;
      }
    }
  });

}

// ==================== تأثير الكتابة للرسالة الترحيبية ====================
function renderWelcome(msg) {
  // مسح المؤقتات السابقة
  clearTimeout(typingTimer);
  const container = document.getElementById('typing-container');
  if (container) {
    container.innerHTML = '';
  }
  
  // استخراج النص بناءً على اللغة الحالية
  let welcomeText = '';
  const lang = currentLang();
  
  if (msg) {
    // إذا كانت msg كائن كامل من قاعدة البيانات
    if (typeof msg === 'object') {
      if (msg.ar && msg.en) {
        // النموذج الجديد: {ar: "...", en: "..."}
        welcomeText = msg[lang] || msg.ar || '';
      } else if (msg.text && typeof msg.text === 'object') {
        // النموذج القديم: {text: {ar: "...", en: "..."}}
        welcomeText = msg.text[lang] || msg.text.ar || '';
      } else if (typeof msg.text === 'string') {
        // نص مباشر في msg.text
        welcomeText = msg.text;
      } else if (typeof msg === 'string') {
        // نص مباشر
        welcomeText = msg;
      }
    } else if (typeof msg === 'string') {
      // نص مباشر
      welcomeText = msg;
    }
  }
  
  // إذا لم يكن هناك نص، استخدم القيمة المخزنة
  if (!welcomeText && window.welcomeMessageData) {
    if (typeof window.welcomeMessageData === 'object') {
      welcomeText = window.welcomeMessageData[lang] || window.welcomeMessageData.ar || '';
    } else {
      welcomeText = window.welcomeMessageData;
    }
  }
  
  // تنظيف النص من التكرار
  welcomeText = cleanTextFromDuplicates(welcomeText);
  
  // بدء تأثير الكتابة فوراً
  if (welcomeText) {
    setTimeout(() => {
      initTypingEffect(welcomeText);
    }, 50);
  }
}

// دالة مساعدة لتنظيف النص من التكرار
function cleanTextFromDuplicates(text) {
    if (!text) return '';
    
    const words = text.split(' ');
    const result = [];
    
    for (let i = 0; i < words.length; i++) {
        // التحقق من التكرار
        if (i === 0 || words[i] !== words[i-1]) {
            result.push(words[i]);
        }
    }
    
    return result.join(' ');
}

function initTypingEffect(textToType) {
  const container = document.getElementById('typing-container');
  if (!container || !textToType) return;
  
  // تنظيف كامل
  container.innerHTML = '';
  
  // تقسيم النص إلى كلمات مع إزالة التكرار
  const words = textToType.split(' ');
  const cleanedWords = [];
  
  for (let i = 0; i < words.length; i++) {
    if (i === 0 || words[i] !== words[i-1]) {
      cleanedWords.push(words[i]);
    }
  }
  
  const finalText = cleanedWords.join(' ');
  
  // تقسيم النص إلى أسطر
  const maxCharsPerLine = 50;
  let lines = [];
  let currentLine = '';
  
  cleanedWords.forEach(word => {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  
  // إذا لم يكن هناك أسطر، استخدم نصاً واحداً
  if (lines.length === 0) {
    container.innerHTML = '<div class="typing-line">' + finalText + '</div>';
    return;
  }
  
  // تأثير الكتابة
  let lineIndex = 0;
  
  function typeLine() {
    if (lineIndex >= lines.length) {
      // إعادة بعد 10 ثواني
      typingTimer = setTimeout(() => {
        container.innerHTML = '';
        lineIndex = 0;
        typeLine();
      }, 10000);
      return;
    }
    
    const lineDiv = document.createElement('div');
    lineDiv.className = 'typing-line';
    container.appendChild(lineDiv);
    
    const lineText = lines[lineIndex];
    let charIndex = 0;
    
    function typeChar() {
      if (charIndex < lineText.length) {
        lineDiv.textContent = lineText.substring(0, charIndex + 1);
        charIndex++;
        typingTimer = setTimeout(typeChar, 80);
      } else {
        lineIndex++;
        typingTimer = setTimeout(typeLine, 300);
      }
    }
    
    typeChar();
  }
  
  typeLine();
}

// ==================== إدارة المحادثة ====================
function setupChatBot(responses) {
  const lang = currentLang();
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
      <div class="examples">
        ${welcomeButtons.map(b => `
          <button class="welcome-btn" 
                  onclick="handleBotButton('${b.question.replace(/'/g, "\\'")}')">
            ${b.question}
          </button>`
    ).join('')}
      </div>
    </div>`;
  applyTranslations();
}

function handleBotButton(q) {
  document.getElementById('userInput').value = q;
  sendBotMessage();
}

function initVoiceRecognition() {
  recognition.lang = 'ar-SA';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = e => {
    document.getElementById('userInput').value = e.results[0][0].transcript;
    voiceAsked = true;
    sendBotMessage();
    isListening = false;
  };

  const voiceBtn = document.getElementById('voice-btn');
  if (!voiceBtn) return;

  recognition.onstart = () => {
    voiceBtn.classList.add('recording');
  };
  recognition.onend = () => {
    voiceBtn.classList.remove('recording');
    isListening = false;
  };
  recognition.onerror = () => {
    isListening = false;
  };

  voiceBtn.onclick = () => {
    if (!isListening) {
      recognition.start();
      isListening = true;
    }
  };
}

function sendBotMessage() {
  const inp = document.getElementById('userInput');
  const txt = inp.value.trim();
  if (!txt) return;

  const box = document.getElementById('chatBox');
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
  box.scrollTop = box.scrollHeight;

  setTimeout(() => {
    box.querySelector('.typing-indicator').parentElement.remove();

    let resp = '';
    const lower = txt.toLowerCase();
    const greetings = ['اهلا', 'مرحبا', 'هلا', 'السلام عليكم'];
    if (greetings.some(g => lower.includes(g))) {
      resp = translations['bot_reply_rewelcome']?.[currentLang()] ||
        (currentLang() === 'ar' ?
          'مرحبًا مجددًا! كيف يمكنني مساعدتك؟ 😊' :
          'Welcome back! How can I help? 😊');
    } else {
      const found = fuseBot.search(txt)[0]?.item;
      if (found) {
        const r = found.response;
        resp = typeof r === 'object' ?
          (r[currentLang()] || r.ar) :
          r;
      } else {
        resp = translations['bot_reply_not_understand']?.[currentLang()] ||
          (currentLang() === 'ar' ?
            'عذرًا، لم أفهم. حاول إعادة الصياغة.' :
            "Sorry, I didn't understand. Please rephrase.");
      }
    }

    box.innerHTML += `<div class="message bot">${resp}</div>`;
    box.scrollTop = box.scrollHeight;

    if (voiceAsked) {
      const u = new SpeechSynthesisUtterance(resp);
      const lang = currentLang();
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      speechSynthesis.speak(u);
      voiceAsked = false;
    }
  }, 600);
}

// ==================== الأسئلة الشائعة ====================
function renderPublicFAQs(data) {
  const lang = currentLang();
  const list = document.getElementById('faqList');
  list.innerHTML = '';

  Object.values(data || {})
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(f => {
      const q = typeof f.question === 'object'
        ? (f.question[lang] || f.question.ar)
        : f.question;
      const item = document.createElement('div');
      item.className = 'faq-item';
      item.style.setProperty('--faq-color', f.color || '#fff');

      const btn = document.createElement('button');
      btn.className = 'faq-btn';
      btn.innerHTML = `<i class="${f.icon || ''}"></i><span>${q}</span>`;
      btn.onclick = () => displayAnswer({
        answer: typeof f.answer === 'object'
          ? (f.answer[lang] || f.answer.ar)
          : f.answer,
        color: f.color || '#9e9e9e'
      });

      item.appendChild(btn);
      list.appendChild(item);
    });

    applyTranslations(); 
}

function displayAnswer({ answer, color }) {
  const box = document.getElementById('answerBox');
  box.style.borderColor = color;
  const cnt = box.querySelector('.answer-content');
  cnt.style.color = color;
  cnt.textContent = answer;
}

function loadAboutContent(data) {
    const lang = currentLang();
    const key = Object.keys(data || {})[0];
    const contentData = data[key]?.content;
    
    let txt = '';
    if (contentData) {
        if (typeof contentData === 'object') {
            txt = contentData[lang] || contentData.ar || '';
        } else {
            txt = contentData || '';
        }
    }
    
    document.getElementById('aboutContent').innerHTML = txt.replace(/\n/g, '<br>');
}

// ==================== بطاقات التواصل ====================
function renderContactCards(data) {
  const grid = document.getElementById('contactGrid');
  grid.innerHTML = '';
  const lang = currentLang();

  Object.values(data || {}).forEach(c => {
    const name = typeof c.name === 'object'
      ? (c.name[lang] || c.name.ar)
      : c.name;
    const a = document.createElement('a');
    a.className = 'contact-card';
    a.href = c.link;
    a.target = '_blank';
    const iconKey = c.icon.split(' ').find(i => iconColors[i]);
    a.style.setProperty('--card-color', iconColors[iconKey] || '#000');
    a.innerHTML = `<i class="${c.icon}"></i><h3>${name}</h3>`;
    grid.appendChild(a);
  });

  applyTranslations();
}

const iconColors = {
  "fa-google": "#D44638", "fa-whatsapp": "#25D366", "fa-facebook": "#1877F2",
  "fa-twitter": "#1DA1F2", "fa-linkedin": "#0077B5", "fa-instagram": "#E4405F",
  "fa-github": "#333", "fa-paypal": "#1877F2", "fa-telegram": "#0088cc",
  "fa-tiktok": "#69c9d0", "fa-youtube": "#ff0000", "fa-microsoft": "#6666ff", "fa-at": "white"
};

// ==================== التواصل السريع ====================
function initQuickContact(settings) {
  qcSettings = settings || {};
  
  // إذا كانت هناك إعدادات للترجمة، قم بتحديثها فورياً
  if (settings && translations) {
    if (settings.successMessage) {
      translations['qc_sent_success'] = settings.successMessage;
    }
    if (settings.errorMessage) {
      translations['qc_sent_failed'] = settings.errorMessage;
    }
    if (settings.enableWhatsApp !== undefined) {
      // تحديث إعدادات واتساب
      window.enableWhatsApp = settings.enableWhatsApp;
    }
    applyTranslations();
  }
  
  const form = document.getElementById('quickContactForm');
  const nameEl = document.getElementById('qcName');
  const contactEl = document.getElementById('qcContact');
  const countryCodeEl = document.getElementById('qcCountryCode');
  const msgEl = document.getElementById('qcMessage');
  const btnSubmit = document.getElementById('qcSubmit');
  const msgBox = document.getElementById('qcUserMessageBox');

  // تحميل رموز الدول
  setTimeout(() => {
    utils.loadCountryCodes('qcCountryCode', '20');
    console.log('✅ تم تحميل رموز الدول');
  }, 500);

  // إضافة مستمع لتغيير رمز الدولة
  if (countryCodeEl) {
    countryCodeEl.addEventListener('change', () => {
      utils.updateContactPlaceholder();
    });
  }

  // تحديث placeholder أول مرة
  setTimeout(() => {
    utils.updateContactPlaceholder();
  }, 1000);

  function showUserMessage(message, isError = false) {
    msgBox.className = `message-box ${isError ? 'error' : 'success'}`;
    msgBox.textContent = message;
    msgBox.style.display = 'block';
    
    setTimeout(() => {
      msgBox.style.display = 'none';
    }, 5000);
  }

  if (btnSubmit) {
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
      
      // التحقق إذا كان الاتصال رقم هاتف
      const isPhoneNumber = /^\d+$/.test(contact.replace(/\D/g, ''));
      
      if (isPhoneNumber) {
        // التحقق من صحة رقم الهاتف
        if (!utils.validatePhoneNumber(contact, countryCode)) {
          const lang = currentLang();
          const countryName = getCountryDisplayName(countryCode, lang);
          const invalidPhoneMsg = translations.invalid_phone?.[lang] || `رقم الهاتف غير صحيح لـ ${countryName}`;
          showUserMessage(invalidPhoneMsg, true);
          return;
        }
        
        // حفظ كرسالة واتساب (فقط في قاعدة البيانات)
        const saved = await saveCustomerMessage(name, contact, message, countryCode, true);
        if (saved) {
          form.reset();
          showUserMessage(translations.qc_sent_success?.[currentLang()] || 'تم إرسال الرسالة بنجاح');
        } else {
          showUserMessage(translations.qc_sent_failed?.[currentLang()] || 'فشل في إرسال الرسالة', true);
        }
      } else {
        // إذا كان إيميل، حفظ كإيميل
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
}

// دالة مساعدة للحصول على الاسم المعروض للدولة
function getCountryDisplayName(countryCode, lang = null) {
  if (!lang) lang = currentLang();
  const country = countryCodes.find(c => c.code === countryCode);
  if (!country) return countryCode;
  return `${country.flag} ${country.name[lang]}`;
}

async function saveCustomerMessage(name, contact, message, countryCode = null, isWhatsApp = false) {
  const messagesRef = ref(database, 'customerMessages');
  
  // الحصول على الرقم الكامل الصحيح
  const fullPhone = countryCode ? getFullPhoneNumberForWhatsApp(countryCode, contact) : contact;
  
  const newMessage = {
    name,
    contact,
    message,
    countryCode,
    fullPhone, // الرقم سيصل كـ 201012345678 (مثال لمصر)
    isWhatsApp,
    timestamp: Date.now(),
    status: 'new',
    read: false
  };
  
  try {
    await push(messagesRef, newMessage);
    return true;
  } catch (error) {
    console.error('فشل في ارسال الرسالة:', error);
    return false;
  }
}

function getFullPhoneNumberForWhatsApp(countryCode, phoneNumber) {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  let finalNumber = cleanNumber.replace(/^0+/, '');
  return countryCode + finalNumber;
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
        } else if (loadedCount === 3) {
            currentLoadingStep = 2;
            updateLoadingMessage();
        } else if (loadedCount === 5) {
            currentLoadingStep = 3;
            updateLoadingMessage();
        } else if (loadedCount === 6) {
            currentLoadingStep = 4;
            updateLoadingMessage();
        }
        
        if (loadedCount >= totalLoads) {
            loadingProgress = 100;
            updateLoadingProgress();
            setTimeout(completeLoading, 500);
        }
    }

    try {
        onValue(ref(database, 'storeWelcomeMessage'), snap => {
            const data = snap.val();
            if (data) {
                welcomeMessage = data;
                renderWelcome(data);
            }
            updateProgress();
        });
    } catch (e) {
        console.error('welcomeMessage load error', e);
        utils.showToast('فشل تحميل الترحيب', 'error');
        updateProgress();
    }
    
    try {
        onValue(ref(database, 'storeAboutUs'), snap => {
            currentAbout = snap.val() || {};
            loadAboutContent(currentAbout);
            updateProgress();
        });
    } catch (e) {
        console.error('aboutUs load error', e);
        utils.showToast('فشل تحميل من نحن', 'error');
        updateProgress();
    }
    
    try {
        onValue(ref(database, 'storeContactInfo'), snap => {
            currentContacts = snap.val() || {};
            renderContactCards(currentContacts);
            updateProgress();
        });
    } catch (e) {
        console.error('contactInfo load error', e);
        utils.showToast('فشل تحميل التواصل', 'error');
        updateProgress();
    }
    
    try {
        onValue(ref(database, 'storeFaqs'), snap => {
            currentFAQs = snap.val() || {};
            renderPublicFAQs(currentFAQs);
            updateProgress();
        });
    } catch (e) { 
        console.error('faqs load error', e);
        utils.showToast('فشل تحميل الأسئلة الشائعة', 'error'); 
        updateProgress();
    }
    
    try {
        onValue(ref(database, 'storeBotResponses'), snap => {
            currentBot = snap.val() || {};
            setupChatBot(currentBot);
            updateProgress();
        });
    } catch (e) {
        console.error('botResponses load error', e);
        utils.showToast('فشل تحميل الروبوت', 'error');
        updateProgress();
    }
    
    try {
        onValue(ref(database, 'storeQuickContact'), snap => {
            qcSettings = snap.val() || {};
            initQuickContact(qcSettings);
            updateProgress();
        });
    } catch (e) {
        console.error('quickContact load error', e);
        utils.showToast('فشل تحميل التواصل السريع', 'error');
        updateProgress();
    }
}

// ==================== إدارة الترجمة ====================
async function loadTranslations() {
  try {
    const transRef = ref(database, 'translate');
    const snapshot = await get(transRef);
    if (snapshot.exists()) {
      Object.assign(translations, snapshot.val());
      applyTranslations();
    }
  } catch (error) {
    console.error("Error loading translations:", error);
  }
}

function translate(key) {
  const lang = currentLang();
  return translations[key]?.[lang] || key;
}

// ==================== دوال شريط التنقل ====================
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

function initSectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('section').forEach(sec => {
        sectionObserver.observe(sec);
    });
}

// ==================== إدارة الأقسام ====================
function showHomeSection() {
    console.log('🏠 عرض القسم الرئيسي...');
    
    const pandaSection = document.getElementById('panda-section');
    const mainSections = document.getElementById('main-sections');
    
    if (pandaSection) pandaSection.style.display = 'none';
    if (mainSections) mainSections.style.display = 'block';
    
    const homeBtn = document.getElementById('toggle-home-btn');
    const loginBtn = document.getElementById('toggle-login-btn');
    
    if (homeBtn) homeBtn.classList.add('active');
    if (loginBtn) loginBtn.classList.remove('active');
    
    if (filterResetTimer) clearTimeout(filterResetTimer);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoginSection() {
    console.log('🔐 عرض قسم تسجيل الدخول...');
    
    const pandaSection = document.getElementById('panda-section');
    const mainSections = document.getElementById('main-sections');
    
    if (mainSections) mainSections.style.display = 'none';
    if (pandaSection) {
        pandaSection.style.display = 'block';
        
        const navH = document.getElementById('navsec')?.offsetHeight || 0;
        window.scrollTo({
            top: pandaSection.offsetTop - navH,
            behavior: 'smooth'
        });
    }
    
    const homeBtn = document.getElementById('toggle-home-btn');
    const loginBtn = document.getElementById('toggle-login-btn');
    
    if (loginBtn) loginBtn.classList.add('active');
    if (homeBtn) homeBtn.classList.remove('active');
}

// ==================== نظام تسجيل الدخول ====================
function initLoginSystem() {
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
            utils.showToast(i18n.translate('logging_in'), 'info');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            currentUser = userCredential.user;
            
            const userRole = await getUserRole(currentUser.uid);
            currentUserRole = userRole;
            
            if (userRole) {
                utils.showToast(i18n.translate('login.success'), 'success');
                setTimeout(() => {
                    redirectBasedOnRole(userRole);
                }, 1000);
            } else {
                utils.showToast(i18n.translate('login_no_role'), 'warning');
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
            
            utils.showToast(i18n.translate('login.error'), 'error');
        }
    });
}

// الحصول على دور المستخدم
async function getUserRole(uid) {
    try {
        const snapshot = await get(ref(database, 'users/' + uid));
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
            console.log('⚠️ لا يوجد دور محدد للمستخدم');
            showHomeSection();
    }
}

// تسجيل الخروج
function handleLogout() {
    const logoutMessage = i18n ? i18n.translate('logout.confirm') : 'هل أنت متأكد من تسجيل الخروج؟';
    const successMessage = i18n ? i18n.translate('logout.success') : 'تم تسجيل الخروج بنجاح';
    const errorMessage = i18n ? i18n.translate('logout.error') : 'فشل تسجيل الخروج';
    
    if (confirm(logoutMessage)) {
        signOut(auth).then(() => {
            currentUser = null;
            currentUserRole = null;
            updateAuthUI();
            utils.showToast(successMessage, 'success');
            showHomeSection();
        }).catch(error => {
            console.error('❌ خطأ في تسجيل الخروج:', error);
            utils.showToast(errorMessage, 'error');
        });
    }
}

// تحديث واجهة المستخدم
function updateAuthUI() {
    const toggleLoginBtn = document.getElementById('toggle-login-btn');
    const authText = document.getElementById('auth-text');
    
    if (currentUser) {
        if (toggleLoginBtn) {
            toggleLoginBtn.innerHTML = `<i class="fas fa-user"></i><span>${currentUser.email}</span>`;
            toggleLoginBtn.title = i18n ? i18n.translate('nav.logout') : 'تسجيل الخروج';
            toggleLoginBtn.onclick = handleLogout;
            
            // إضافة خاصية data-i18n للسماح بالترجمة التلقائية
            const spanElement = toggleLoginBtn.querySelector('span');
            if (spanElement) {
                spanElement.dataset.i18n = 'nav.logout';
            }
        }
    } else {
        if (toggleLoginBtn) {
            // استخدام ترجمة ديناميكية مباشرة
            const loginText = i18n ? i18n.translate('nav.login') : 'تسجيل الدخول';
            toggleLoginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i><span>${loginText}</span>`;
            toggleLoginBtn.title = loginText;
            toggleLoginBtn.onclick = showLoginSection;
            
            // إضافة خاصية data-i18n للسماح بالترجمة التلقائية
            const spanElement = toggleLoginBtn.querySelector('span');
            if (spanElement) {
                spanElement.dataset.i18n = 'nav.login';
            }
        }
    }
    
    // إعادة تطبيق الترجمات على الزر المحدث
    if (i18n && i18n.applyTranslations) {
        setTimeout(() => {
            i18n.applyTranslations();
        }, 100);
    }
}

// ==================== تهيئة الصفحة الرئيسية ====================
function initIndexPage() {
    initLoadingSystem();
    initLoginSystem();
    
    // تحميل رموز الدول
    setTimeout(() => {
        utils.loadCountryCodes('qcCountryCode', '20');
    }, 1000);
    
    loadInitialData();
    
    const homeBtn = document.getElementById('toggle-home-btn');
    const loginBtn = document.getElementById('toggle-login-btn');
    
    if (homeBtn) homeBtn.addEventListener('click', showHomeSection);
    if (loginBtn) loginBtn.addEventListener('click', showLoginSection);
    
    // إضافة مستمعي الأحداث للروبوت
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('userInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendBotMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendBotMessage();
            }
        });
    }
}

// ==================== تهيئة الصفحات الداخلية ====================
function initInternalPagesAuth() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const homeBtn = document.getElementById('toggle-home-btn');
    if (homeBtn && !window.location.pathname.includes('index.html')) {
        homeBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

// ==================== تهيئة الصفحة ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 بدء تهيئة التطبيق...');
    
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    // تهيئة شريط التنقل
    initNavbarScroll();
    
    // مراقبة حالة المصادقة
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        
        if (user) {
            const role = await getUserRole(user.uid);
            currentUserRole = role;
            
            console.log('👤 المستخدم مسجل الدخول:', user.email, 'الدور:', role);
            
            updateAuthUI();
            
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
            
            if (!window.location.pathname.includes('index.html')) {
                console.log('⚠️ المستخدم غير مسجل في صفحة داخلية');
                window.location.href = 'index.html';
            }
        }
    });

    initLoadingSystem();
    updatePlaceholders();

    await initI18n();
    await loadTranslations();
    setLanguage(localStorage.getItem('lang') || 'ar');

    document.getElementById('language-toggle').addEventListener('click', () => {
        setLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
    });
  
    setTimeout(() => {
        utils.loadCountryCodes('qcCountryCode', '20');
    }, 1000);

    loadInitialData();
    showHomeSection();

    // استماع لتغيير اللغة
    document.addEventListener('languageChanged', () => {
        console.log('🎯 حدث تغيير اللغة - بدء التحديثات');
        
        // 1. تحديث واجهة المستخدم للمصادقة
        updateAuthUI();
        
        // 2. تحديث رسالة الترحيب
        if (window.welcomeMessageData) {
            renderWelcome(window.welcomeMessageData);
        } else if (welcomeMessage) {
            renderWelcome(welcomeMessage);
        }
        
        // 3. تحديث المحتوى الديناميكي
        loadAboutContent(currentAbout);
        renderContactCards(currentContacts);
        setupChatBot(currentBot);
        renderPublicFAQs(currentFAQs);
        
        // 4. تحديث التواصل السريع (الأهم)
        utils.loadCountryCodes('qcCountryCode'); // استخدم هذه الدالة الجديدة
        
        // 5. تحديث placeholders
        updatePlaceholders();
        
        // 6. تطبيق الترجمات
        if (window.i18n && window.i18n.applyTranslations) {
            window.i18n.applyTranslations();
        }
        
        // 7. تحديث زر اللغة
        const langLabel = document.getElementById('language-label');
        if (langLabel) {
            langLabel.textContent = currentLang() === 'ar' ? 'English' : 'العربية';
        }
        
        console.log('✅ تم تحديث الواجهة بلغة جديدة: ', currentLang());
    });
    
    // تهيئة الصفحة الرئيسية
    if (window.location.pathname.includes('index.html')) {
        initIndexPage();
    }

    if (typeof Fuse === 'undefined') {
        console.error('Fuse.js not loaded properly');
    } else {
        console.log('Fuse.js loaded successfully');
    }
    // تهيئة الصفحات الداخلية
    initInternalPagesAuth();
    
    console.log('✅ تم تهيئة التطبيق بنجاح');
    
// نظام تحديث الترجمة الفوري
function setupInstantTranslation() {
    // تحديث جميع العناصر عند تغيير اللغة
    document.addEventListener('languageChanged', (event) => {
        console.log('🔄 تحديث سريع للترجمة:', event.detail?.lang);
        
        // تحديث زر تسجيل الدخول
        updateAuthUI();
        
        // تحديث رسالة الترحيب
        if (welcomeMessage) {
            renderWelcome(welcomeMessage);
        }
        
        // تحديث جميع الأقسام الأخرى
        if (currentAbout) loadAboutContent(currentAbout);
        if (currentContacts) renderContactCards(currentContacts);
        if (currentBot) setupChatBot(currentBot);
        if (currentFAQs) renderPublicFAQs(currentFAQs);
        if (qcSettings) initQuickContact(qcSettings);
        
        updatePlaceholders();
        utils.loadCountryCodes('qcCountryCode');
        utils.updateContactPlaceholder();
        
        // إعادة تطبيق الترجمات
        if (i18n && i18n.applyTranslations) {
            i18n.applyTranslations();
        }
    });
}

// تشغيل نظام الترجمة الفوري
setupInstantTranslation();

});

// جعل الدوال متاحة عالمياً
window.handleLogout = handleLogout;
window.showHomeSection = showHomeSection;
window.showLoginSection = showLoginSection;
window.sendBotMessage = sendBotMessage;
window.handleBotButton = handleBotButton;
window.updateTranslationsImmediately = updateTranslationsImmediately;
window.contentUtils = contentUtils;

// تصدير الكائنات لاستخدامها في ملفات أخرى
export { auth, database, utils };