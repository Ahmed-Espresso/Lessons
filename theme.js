
class ThemeSystem {
    constructor() {
        this.THEMES = ['wine', 'day', 'sunset', 'coffee'];
        this.currentTheme = localStorage.getItem('theme') || 'wine';
        this.canvases = {};
        this.contexts = {};
        this.animations = {};
        this.images = {};
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            // التحقق من صحة الثيم المحفوظ
            this.validateCurrentTheme();
            
            // إنشاء عناصر Canvas
            this.createCanvases();
            
            // تحميل الصور
            await this.loadImages();
            
            // تهيئة جميع الثيمات
            this.initializeThemes();
            
            // بدء الرسوم المتحركة
            this.startAnimations();
            
            // تطبيق الثيم الأولي
            this.applyTheme(true);
            
            // إعداد مستمعي الأحداث
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ نظام الثيمات محمل بنجاح');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل نظام الثيمات:', error);
            this.applyFallbackTheme();
        }
    }

    validateCurrentTheme() {
        if (!this.THEMES.includes(this.currentTheme)) {
            this.currentTheme = 'wine';
            localStorage.setItem('theme', this.currentTheme);
        }
    }

    createCanvases() {
        const themeCanvases = ['day', 'wine', 'coffee', 'sunset'];
        
        themeCanvases.forEach(theme => {
            const canvas = document.createElement('canvas');
            canvas.id = `${theme}-canvas`;
            canvas.className = 'theme-canvas';
            
            // تحسين الأداء
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.pointerEvents = 'none';
            canvas.style.zIndex = '-1';
            canvas.style.opacity = '0';
            canvas.style.transition = 'opacity 1.5s ease';
            
            document.body.prepend(canvas);
            
            this.canvases[theme] = canvas;
            this.contexts[theme] = canvas.getContext('2d');
        });
    }

    async loadImages() {
        return new Promise((resolve, reject) => {
            const beanImg = new Image();
            const appleImg = new Image();
            let loadedCount = 0;
            
            const checkLoaded = () => {
                loadedCount++;
                if (loadedCount === 2) {
                    this.images.bean = beanImg;
                    this.images.apple = appleImg;
                    resolve();
                }
            };
            
            beanImg.onload = checkLoaded;
            beanImg.onerror = () => {
                console.warn('⚠️ لم يتم تحميل صورة القهوة، سيتم استخدام رسومات بديلة');
                checkLoaded();
            };
            beanImg.src = 'coffee.png';
            
            appleImg.onload = checkLoaded;
            appleImg.onerror = () => {
                console.warn('⚠️ لم يتم تحميل صورة التفاح، سيتم استخدام رسومات بديلة');
                checkLoaded();
            };
            appleImg.src = 'apple.png';
            
            // وقت انتظار أقصى 5 ثوان
            setTimeout(() => {
                if (loadedCount < 2) {
                    console.warn('⏰ انتهى وقت تحميل الصور، المتابعة بالرسومات البديلة');
                    resolve();
                }
            }, 5000);
        });
    }

    initializeThemes() {
        this.initializeDayTheme();
        this.initializeWineTheme();
        this.initializeCoffeeTheme();
        this.initializeSunsetTheme();
        
        // ضبط أبعاد Canvas الأولية
        this.handleResize();
    }

    initializeDayTheme() {
        const canvas = this.canvases.day;
        const ctx = this.contexts.day;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.day = {
            particles: [],
            init: () => {
                this.animations.day.particles = [];
                for (let i = 0; i < 80; i++) {
                    this.animations.day.particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        r: Math.random() * 1.5 + 0.5,
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        phase: Math.random() * 2 * Math.PI,
                        opacity: Math.random() * 0.5 + 0.3
                    });
                }
            },
            draw: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                this.animations.day.particles.forEach(p => {
                    // تحديث المواقع
                    p.x += p.vx;
                    p.y += p.vy;
                    p.phase += 0.02;
                    
                    // إعادة التدوير عند الحواف
                    if (p.x < -p.r) p.x = canvas.width + p.r;
                    if (p.x > canvas.width + p.r) p.x = -p.r;
                    if (p.y < -p.r) p.y = canvas.height + p.r;
                    if (p.y > canvas.height + p.r) p.y = -p.r;
                    
                    // الرسم
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity + 0.3 * Math.sin(p.phase)})`;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    ctx.fill();
                });
                ctx.shadowBlur = 0;
            }
        };
        
        this.animations.day.init();
    }

    initializeWineTheme() {
        const canvas = this.canvases.wine;
        const ctx = this.contexts.wine;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.wine = {
            particles: [],
            init: () => {
                this.animations.wine.particles = [];
                const particleCount = Math.min(15, Math.floor(window.innerWidth / 50));
                
                for (let i = 0; i < particleCount; i++) {
                    this.animations.wine.particles.push({
                        x: Math.random() * canvas.width,
                        y: -Math.random() * canvas.height,
                        speed: 0.3 + Math.random() * 1.2,
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 2,
                        size: 15 + Math.random() * 10,
                        wobble: Math.random() * 2,
                        wobbleSpeed: 0.05 + Math.random() * 0.05,
                        wobbleOffset: Math.random() * Math.PI * 2
                    });
                }
            },
            draw: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                this.animations.wine.particles.forEach(p => {
                    // تحديث المواقع والتدوير
                    p.y += p.speed;
                    p.rotation += p.rotationSpeed;
                    p.wobbleOffset += p.wobbleSpeed;
                    
                    const wobbleX = Math.sin(p.wobbleOffset) * p.wobble;
                    
                    // إعادة التدوير
                    if (p.y > canvas.height + p.size) {
                        p.y = -p.size;
                        p.x = Math.random() * canvas.width;
                    }
                    
                    // الرسم (استخدام الصورة أو شكل بديل)
                    ctx.save();
                    ctx.translate(p.x + wobbleX, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    
                    if (this.images.apple && this.images.apple.complete) {
                        ctx.drawImage(this.images.apple, -p.size/2, -p.size/2, p.size, p.size);
                    } else {
                        // شكل تفاح بديل
                        ctx.fillStyle = '#8B0000';
                        ctx.beginPath();
                        ctx.ellipse(0, 0, p.size/2, p.size/3, 0, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        ctx.fillStyle = '#228B22';
                        ctx.beginPath();
                        ctx.moveTo(0, -p.size/3);
                        ctx.lineTo(-p.size/4, -p.size/2);
                        ctx.lineTo(p.size/4, -p.size/2);
                        ctx.closePath();
                        ctx.fill();
                    }
                    
                    ctx.restore();
                });
            }
        };
        
        this.animations.wine.init();
    }

    initializeCoffeeTheme() {
        const canvas = this.canvases.coffee;
        const ctx = this.contexts.coffee;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.coffee = {
            particles: [],
            init: () => {
                this.animations.coffee.particles = [];
                const particleCount = Math.min(12, Math.floor(window.innerWidth / 60));
                
                for (let i = 0; i < particleCount; i++) {
                    this.animations.coffee.particles.push({
                        x: Math.random() * canvas.width,
                        y: -Math.random() * canvas.height,
                        speed: 0.2 + Math.random() * 0.8,
                        rotation: Math.random() * 360,
                        rotationSpeed: (Math.random() - 0.5) * 3,
                        size: 12 + Math.random() * 8,
                        wobble: Math.random() * 1.5,
                        wobbleSpeed: 0.03 + Math.random() * 0.04,
                        wobbleOffset: Math.random() * Math.PI * 2
                    });
                }
            },
            draw: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                this.animations.coffee.particles.forEach(p => {
                    // تحديث المواقع والتدوير
                    p.y += p.speed;
                    p.rotation += p.rotationSpeed;
                    p.wobbleOffset += p.wobbleSpeed;
                    
                    const wobbleX = Math.sin(p.wobbleOffset) * p.wobble;
                    
                    // إعادة التدوير
                    if (p.y > canvas.height + p.size) {
                        p.y = -p.size;
                        p.x = Math.random() * canvas.width;
                    }
                    
                    // الرسم (استخدام الصورة أو شكل بديل)
                    ctx.save();
                    ctx.translate(p.x + wobbleX, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    
                    if (this.images.bean && this.images.bean.complete) {
                        ctx.drawImage(this.images.bean, -p.size/2, -p.size/2, p.size, p.size);
                    } else {
                        // شكل حبة قهوة بديل
                        ctx.fillStyle = '#8B4513';
                        ctx.beginPath();
                        ctx.ellipse(0, 0, p.size/3, p.size/2, Math.PI/4, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        ctx.strokeStyle = '#5D4037';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(-p.size/4, -p.size/4);
                        ctx.lineTo(p.size/4, p.size/4);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                });
            }
        };
        
        this.animations.coffee.init();
    }

    initializeSunsetTheme() {
        const canvas = this.canvases.sunset;
        const ctx = this.contexts.sunset;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.sunset = {
            bubbles: [],
            init: () => {
                this.animations.sunset.bubbles = [];
                const bubbleCount = Math.min(25, Math.floor(window.innerWidth / 40));
                
                for (let i = 0; i < bubbleCount; i++) {
                    this.animations.sunset.bubbles.push({
                        x: Math.random() * canvas.width,
                        y: canvas.height + Math.random() * 200,
                        r: 1.5 + Math.random() * 4,
                        speed: 0.4 + Math.random() * 1.2,
                        opacity: 0.2 + Math.random() * 0.3,
                        wobble: Math.random() * 1.5,
                        wobbleSpeed: 0.02 + Math.random() * 0.03,
                        wobbleOffset: Math.random() * Math.PI * 2
                    });
                }
            },
            draw: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // خلفية متدرجة للشفق
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(74, 0, 51, 0.3)');
                gradient.addColorStop(1, 'rgba(192, 180, 158, 0.1)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                this.animations.sunset.bubbles.forEach(b => {
                    // تحديث المواقع
                    b.y -= b.speed;
                    b.wobbleOffset += b.wobbleSpeed;
                    b.x += Math.sin(b.wobbleOffset) * 0.3;
                    
                    // إعادة التدوير
                    if (b.y + b.r < 0) {
                        b.y = canvas.height + Math.random() * 100;
                        b.x = Math.random() * canvas.width;
                    }
                    
                    // الرسم مع تأثيرات أكثر واقعية
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
                    
                    // تدرج لوني للفقاعة
                    const bubbleGradient = ctx.createRadialGradient(
                        b.x - b.r/3, b.y - b.r/3, 0,
                        b.x, b.y, b.r
                    );
                    bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${b.opacity + 0.1})`);
                    bubbleGradient.addColorStop(1, `rgba(255, 255, 255, ${b.opacity - 0.1})`);
                    
                    ctx.fillStyle = bubbleGradient;
                    ctx.fill();
                    
                    // highlight صغير
                    ctx.beginPath();
                    ctx.arc(b.x - b.r/3, b.y - b.r/3, b.r/4, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity + 0.2})`;
                    ctx.fill();
                });
            }
        };
        
        this.animations.sunset.init();
    }

    startAnimations() {
        const animate = () => {
            Object.keys(this.animations).forEach(theme => {
                if (this.currentTheme === theme) {
                    this.animations[theme].draw();
                }
            });
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    applyTheme(initial = false) {
        // إخفاء جميع Canvas أولاً
        Object.values(this.canvases).forEach(canvas => {
            canvas.style.opacity = '0';
        });
        
        // إزالة classes الثيمات القديمة
        this.THEMES.forEach(theme => {
            document.documentElement.classList.remove(`theme-${theme}`);
        });
        
        // التأكد من صحة الثيم الحالي
        this.validateCurrentTheme();
        
        // تطبيق الثيم الجديد
        document.documentElement.classList.add(`theme-${this.currentTheme}`);
        
        // إظهار Canvas الثيم الحالي
        if (this.canvases[this.currentTheme]) {
            setTimeout(() => {
                this.canvases[this.currentTheme].style.opacity = '1';
            }, 50);
        }
        
        // تحديث المتغير العالمي
        window.currentTheme = this.currentTheme;
        
        // جعل الصفحة مرئية (لأول مرة فقط)
        if (initial) {
            document.documentElement.style.visibility = 'visible';
        }
        
        // تحديث الأيقونة
        this.updateThemeIcon();
        
        // إعادة تهيئة الرسوم المتحركة إذا لزم الأمر
        this.reinitializeCurrentTheme();
        
        console.log(`🎨 تم تطبيق الثيم: ${this.currentTheme}`);
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        
        const iconMap = {
            day: 'fas fa-moon',
            wine: 'fas fa-apple-alt',
            coffee: 'fas fa-coffee',
            sunset: 'fas fa-wine-glass-alt'
        };
        
        icon.className = iconMap[this.currentTheme] || iconMap.wine;
    }

    reinitializeCurrentTheme() {
        if (this.animations[this.currentTheme] && this.animations[this.currentTheme].init) {
            this.animations[this.currentTheme].init();
        }
    }

    toggleTheme() {
        const currentIndex = this.THEMES.indexOf(this.currentTheme);
        this.currentTheme = this.THEMES[(currentIndex + 1) % this.THEMES.length];
        
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
        
        // إرسال حدث لتحديث العناصر الأخرى إذا لزم الأمر
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));
    }

    setTheme(themeName) {
        if (this.THEMES.includes(themeName)) {
            this.currentTheme = themeName;
            localStorage.setItem('theme', this.currentTheme);
            this.applyTheme();
            return true;
        }
        return false;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return [...this.THEMES];
    }

    handleResize() {
        Object.keys(this.canvases).forEach(theme => {
            const canvas = this.canvases[theme];
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // إعادة تهيئة الرسوم المتحركة للثيم
            if (this.animations[theme] && this.animations[theme].init) {
                this.animations[theme].init();
            }
        });
    }

    setupEventListeners() {
        // تغيير حجم النافذة
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // زر تبديل الثيم
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // تحسين الأداء عند عدم رؤية الصفحة
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    pauseAnimations() {
        // يمكن إضافة منطق لإيقاف الرسوم المتحركة مؤقتاً إذا لزم الأمر
    }

    resumeAnimations() {
        // يمكن إضافة منطق لاستئناف الرسوم المتحركة
    }

    applyFallbackTheme() {
        // ثيم احتياطي في حالة فشل التحميل
        document.documentElement.classList.add('theme-wine');
        document.documentElement.style.visibility = 'visible';
        console.log('🔄 تم تطبيق الثيم الاحتياطي');
    }

    // دالة لتنظيف الموارد إذا لزم الأمر
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        // تنظيف أي موارد أخرى
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.themeSystem = new ThemeSystem();
});

// جعل النظام متاحاً عالمياً للاستخدام من قبل ملفات أخرى
window.ThemeSystem = ThemeSystem;