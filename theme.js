// ==================== نظام الثيمات المتكامل ====================
class ThemeSystem {
    constructor() {
        this.THEMES = ['night', 'apple', 'wine', 'coffee', 'space', 'water', 'wild'];
        this.currentTheme = localStorage.getItem('theme') || 'apple';
        this.canvases = {};
        this.contexts = {};
        this.animations = {};
        this.images = {};
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        try {
            this.validateCurrentTheme();
            this.createCanvases();
            await this.loadImages();
            this.initializeThemes();
            this.startAnimations();
            this.applyTheme(true);
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
            this.currentTheme = 'apple';
            localStorage.setItem('theme', this.currentTheme);
        }
    }

    createCanvases() {
        this.THEMES.forEach(theme => {
            const canvas = document.createElement('canvas');
            canvas.id = `${theme}-canvas`;
            canvas.className = 'theme-canvas';
            
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
        return new Promise((resolve) => {
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
            beanImg.onerror = checkLoaded;
            beanImg.src = 'coffee.png';
            
            appleImg.onload = checkLoaded;
            appleImg.onerror = checkLoaded;
            appleImg.src = 'apple.png';
            
            setTimeout(() => resolve(), 5000);
        });
    }

    initializeThemes() {
        // من الملف الأصلي theme.js
        this.initializeNightTheme();
        this.initializeAppleTheme();
        this.initializeWineTheme();
        this.initializeCoffeeTheme();
        
        // من الملف الخارجي more theme.js
        this.initializeSpaceTheme();
        this.initializeWaterTheme();
        this.initializeWildTheme();
        
        this.handleResize();
    }

    // 1. night Theme (من الملف الأصلي theme.js - النجوم المتساقطة)
    initializeNightTheme() {
        const canvas = this.canvases.night;
        const ctx = this.contexts.night;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.night = {
            particles: [],
            init: () => {
                this.animations.night.particles = [];
                for (let i = 0; i < 80; i++) {
                    this.animations.night.particles.push({
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
                
                this.animations.night.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.phase += 0.02;
                    
                    if (p.x < -p.r) p.x = canvas.width + p.r;
                    if (p.x > canvas.width + p.r) p.x = -p.r;
                    if (p.y < -p.r) p.y = canvas.height + p.r;
                    if (p.y > canvas.height + p.r) p.y = -p.r;
                    
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
        
        this.animations.night.init();
    }

    // 2. apple Theme (من الملف الأصلي theme.js - التفاح المتساقط)
    initializeAppleTheme() {
        const canvas = this.canvases.apple;
        const ctx = this.contexts.apple;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.apple = {
            particles: [],
            init: () => {
                this.animations.apple.particles = [];
                const particleCount = Math.min(15, Math.floor(window.innerWidth / 50));
                
                for (let i = 0; i < particleCount; i++) {
                    this.animations.apple.particles.push({
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
                
                // خلفية متدرجة من الملف الأصلي
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(49, 84, 38, 0.3)');
                gradient.addColorStop(1, 'rgba(49, 84, 38, 0.1)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                this.animations.apple.particles.forEach(p => {
                    p.y += p.speed;
                    p.rotation += p.rotationSpeed;
                    p.wobbleOffset += p.wobbleSpeed;
                    
                    const wobbleX = Math.sin(p.wobbleOffset) * p.wobble;
                    
                    if (p.y > canvas.height + p.size) {
                        p.y = -p.size;
                        p.x = Math.random() * canvas.width;
                    }
                    
                    ctx.save();
                    ctx.translate(p.x + wobbleX, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    
                    if (this.images.apple && this.images.apple.complete) {
                        ctx.drawImage(this.images.apple, -p.size/2, -p.size/2, p.size, p.size);
                    } else {
                        // شكل تفاح بديل من الملف الأصلي
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
        
        this.animations.apple.init();
    }

    // 3. wine Theme (من الملف الأصلي theme.js - الفقاعات المتصاعدة)
    initializeWineTheme() {
        const canvas = this.canvases.wine;
        const ctx = this.contexts.wine;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.wine = {
            bubbles: [],
            init: () => {
                this.animations.wine.bubbles = [];
                const bubbleCount = Math.min(20, Math.floor(window.innerWidth / 40));
                
                for (let i = 0; i < bubbleCount; i++) {
                    this.animations.wine.bubbles.push({
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
                
                // خلفية متدرجة للشفق من الملف الأصلي
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, 'rgba(74, 0, 51, 0.3)');
                gradient.addColorStop(1, 'rgba(192, 180, 158, 0.1)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                this.animations.wine.bubbles.forEach(b => {
                    b.y -= b.speed;
                    b.wobbleOffset += b.wobbleSpeed;
                    b.x += Math.sin(b.wobbleOffset) * 0.3;
                    
                    if (b.y + b.r < 0) {
                        b.y = canvas.height + Math.random() * 100;
                        b.x = Math.random() * canvas.width;
                    }
                    
                    // رسم فقاعة مجسمة كما في الملف الأصلي
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.r, 0, 2 * Math.PI);
                    
                    const bubbleGradient = ctx.createRadialGradient(
                        b.x - b.r/3, b.y - b.r/3, 0,
                        b.x, b.y, b.r
                    );
                    bubbleGradient.addColorStop(0, `rgba(255, 255, 255, ${b.opacity + 0.1})`);
                    bubbleGradient.addColorStop(1, `rgba(255, 255, 255, ${b.opacity - 0.1})`);
                    
                    ctx.fillStyle = bubbleGradient;
                    ctx.fill();
                    
                    // highlight صغير كما في الملف الأصلي
                    ctx.beginPath();
                    ctx.arc(b.x - b.r/3, b.y - b.r/3, b.r/4, 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity + 0.2})`;
                    ctx.fill();
                });
            }
        };
        
        this.animations.wine.init();
    }

    // 4. coffee Theme (من الملف الأصلي theme.js - القهوة المتساقطة)
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
                    p.y += p.speed;
                    p.rotation += p.rotationSpeed;
                    p.wobbleOffset += p.wobbleSpeed;
                    
                    const wobbleX = Math.sin(p.wobbleOffset) * p.wobble;
                    
                    if (p.y > canvas.height + p.size) {
                        p.y = -p.size;
                        p.x = Math.random() * canvas.width;
                    }
                    
                    ctx.save();
                    ctx.translate(p.x + wobbleX, p.y);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    
                    if (this.images.bean && this.images.bean.complete) {
                        ctx.drawImage(this.images.bean, -p.size/2, -p.size/2, p.size, p.size);
                    } else {
                        // شكل حبة قهوة بديل من الملف الأصلي
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

    // 5. space Theme (من الملف الخارجي more theme.js - النقاط المتساقطة)
    initializeSpaceTheme() {
        const canvas = this.canvases.space;
        const ctx = this.contexts.space;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.space = {
            stars: [],
            init: () => {
                this.animations.space.stars = [];
                for (let i = 0; i < 300; i++) {
                    this.animations.space.stars.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        r: Math.random() * 1.2 + 0.2,
                        s: Math.random() * 0.3 + 0.05  // نفس السرعة كما في الملف الخارجي
                    });
                }
            },
            draw: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                this.animations.space.stars.forEach(star => {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
                    ctx.fillStyle = 'white';
                    ctx.fill();
                    star.y += star.s;
                    if (star.y > canvas.height) {
                        star.y = 0;
                        star.x = Math.random() * canvas.width;
                    }
                });
            }
        };
        
        this.animations.space.init();
    }

    // 6. water Theme (من الملف الخارجي more theme.js - الفقاعات)
    initializeWaterTheme() {
        const canvas = this.canvases.water;
        const ctx = this.contexts.water;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.water = {
            particles: [],
            init: () => {
                this.animations.water.particles = [];
                for (let i = 0; i < 100; i++) {
                    this.animations.water.particles.push({
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
                
                this.animations.water.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.phase += 0.02;
                    
                    if (p.x < -p.r) p.x = canvas.width + p.r;
                    if (p.x > canvas.width + p.r) p.x = -p.r;
                    if (p.y < -p.r) p.y = canvas.height + p.r;
                    if (p.y > canvas.height + p.r) p.y = -p.r;
                    
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
        
        this.animations.water.init();
    }

    // 7. wild Theme (من الملف الخارجي more theme.js - اليراعات)
    initializeWildTheme() {
        const canvas = this.canvases.wild;
        const ctx = this.contexts.wild;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        this.animations.wild = {
            fireflies: [],
            init: () => {
                this.animations.wild.fireflies = [];
                for (let i = 0; i < 50; i++) {
                    this.animations.wild.fireflies.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        phase: Math.random() * 2 * Math.PI
                    });
                }
            },
            draw: () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                this.animations.wild.fireflies.forEach(f => {
                    f.phase += 0.02;
                    const alpha = 0.5 + 0.5 * Math.sin(f.phase);
                    ctx.beginPath();
                    ctx.arc(f.x, f.y, 2 + Math.sin(f.phase), 0, 2 * Math.PI);
                    ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                    ctx.fill();
                    f.x += (Math.random() - 0.5) * 0.5;
                    f.y += (Math.random() - 0.5) * 0.5;
                });
            }
        };
        
        this.animations.wild.init();
    }

    startAnimations() {
        const animate = () => {
            if (this.animations[this.currentTheme]) {
                this.animations[this.currentTheme].draw();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }

    applyTheme(initial = false) {
        Object.values(this.canvases).forEach(canvas => {
            canvas.style.opacity = '0';
        });
        
        this.THEMES.forEach(theme => {
            document.documentElement.classList.remove(`theme-${theme}`);
        });
        
        this.validateCurrentTheme();
        document.documentElement.classList.add(`theme-${this.currentTheme}`);
        
        if (this.canvases[this.currentTheme]) {
            setTimeout(() => {
                this.canvases[this.currentTheme].style.opacity = '1';
            }, 50);
        }
        
        window.currentTheme = this.currentTheme;
        
        if (initial) {
            document.documentElement.style.visibility = 'visible';
        }
        
        this.updateThemeIcon();
        this.reinitializeCurrentTheme();
        console.log(`🎨 تم تطبيق الثيم: ${this.currentTheme}`);
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;
        
        const icon = themeToggle.querySelector('i');
        if (!icon) return;
        
        const iconMap = {
            'night': 'fas fa-cloud-moon',
            'apple': 'fas fa-apple-alt',
            'wine': 'fas fa-wine-glass-alt',
            'coffee': 'fas fa-coffee',
            'space': 'fas fa-moon',
            'water': 'fas fa-tint',
            'wild': 'fas fa-star'
        };
        
        icon.className = iconMap[this.currentTheme] || iconMap.apple;
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
            
            if (this.animations[theme] && this.animations[theme].init) {
                this.animations[theme].init();
            }
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    pauseAnimations() {
        // يمكن إضافة منطق لإيقاف الرسوم المتحركة إذا لزم
    }

    resumeAnimations() {
        // يمكن إضافة منطق لاستئناف الرسوم المتحركة
    }

    applyFallbackTheme() {
        document.documentElement.classList.add('theme-apple');
        document.documentElement.style.visibility = 'visible';
        console.log('🔄 تم تطبيق الثيم الاحتياطي');
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeSystem = new ThemeSystem();
});

window.ThemeSystem = ThemeSystem;