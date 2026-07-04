// pwa-install.js - مدیریت نصب PWA

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }
    
    init() {
        // بررسی نصب بودن
        this.checkInstalled();
        
        // گوش دادن به رویداد beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            // جلوگیری از نمایش پیش‌فرض
            e.preventDefault();
            
            // ذخیره رویداد برای استفاده بعدی
            this.deferredPrompt = e;
            
            // نمایش دکمه نصب
            this.showInstallButton();
        });
        
        // گوش دادن به رویداد نصب موفق
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            console.log('✅ PWA با موفقیت نصب شد!');
            
            // نمایش پیام تبریک
            this.showInstallSuccess();
        });
    }
    
    checkInstalled() {
        // بررسی در حالت standalone (نصب شده)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            this.hideInstallButton();
        }
        
        // برای iOS
        if (window.navigator.standalone) {
            this.isInstalled = true;
            this.hideInstallButton();
        }
    }
    
    showInstallButton() {
        const existingBtn = document.getElementById('pwaInstallBtn');
        if (existingBtn) return;
        
        const btn = document.createElement('button');
        btn.id = 'pwaInstallBtn';
        btn.className = 'pwa-install-btn';
        btn.innerHTML = '📱 نصب برنامه';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 14px 30px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 15px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            font-family: 'Vazirmatn', sans-serif;
            animation: pulseInstall 2s infinite;
        `;
        
        // اضافه کردن استایل انیمیشن
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulseInstall {
                0%, 100% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
            }
        `;
        document.head.appendChild(style);
        
        btn.onclick = () => this.installApp();
        document.body.appendChild(btn);
    }
    
    hideInstallButton() {
        const btn = document.getElementById('pwaInstallBtn');
        if (btn) {
            btn.style.display = 'none';
        }
    }
    
    installApp() {
        if (this.deferredPrompt) {
            // نمایش دیالوگ نصب
            this.deferredPrompt.prompt();
            
            // بررسی نتیجه
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('✅ کاربر نصب را تایید کرد');
                    this.isInstalled = true;
                    this.hideInstallButton();
                } else {
                    console.log('❌ کاربر نصب را رد کرد');
                }
                this.deferredPrompt = null;
            });
        } else {
            // اگر رویداد ذخیره نشده، راهنمایی برای نصب دستی
            this.showManualInstallGuide();
        }
    }
    
    showManualInstallGuide() {
        // نمایش راهنمای نصب دستی
        const guide = document.createElement('div');
        guide.id = 'pwaInstallGuide';
        guide.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        guide.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 20px; max-width: 400px; width: 100%; text-align: center;">
                <div style="font-size: 60px; margin-bottom: 15px;">📱</div>
                <h3 style="color: #1a202c; margin-bottom: 10px;">نصب دستی برنامه</h3>
                <p style="color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 20px;">
                    برای نصب برنامه روی گوشی خود، مراحل زیر را دنبال کنید:
                </p>
                <div style="text-align: right; font-size: 14px; color: #666; line-height: 2; padding: 10px; background: #f7fafc; border-radius: 10px;">
                    <div>📌 <strong>مرورگر Chrome:</strong></div>
                    <div style="padding-right: 20px;">۱. روی ⋮ (سه نقطه) کلیک کنید</div>
                    <div style="padding-right: 20px;">۲. گزینه "نصب برنامه" را انتخاب کنید</div>
                    <br>
                    <div>📌 <strong>مرورگر Safari (iOS):</strong></div>
                    <div style="padding-right: 20px;">۱. روی ⬆ (اشتراک‌گذاری) کلیک کنید</div>
                    <div style="padding-right: 20px;">۲. گزینه "Add to Home Screen" را انتخاب کنید</div>
                </div>
                <button onclick="document.getElementById('pwaInstallGuide').remove()" style="
                    margin-top: 20px;
                    padding: 12px 30px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: 'Vazirmatn', sans-serif;
                ">متوجه شدم</button>
            </div>
        `;
        
        document.body.appendChild(guide);
    }
    
    showInstallSuccess() {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            background: #10b981;
            color: white;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            z-index: 10001;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
            animation: slideDown 0.5s ease;
            font-family: 'Vazirmatn', sans-serif;
        `;
        toast.textContent = '🎉 برنامه با موفقیت نصب شد!';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-50px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.5s';
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }
}

// Export to global scope
window.PWAManager = PWAManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if ('serviceWorker' in navigator) {
        // Register Service Worker
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered successfully!');
                
                // Check for updates
                registration.update();
                
                // Listen for push notifications
                if ('PushManager' in window) {
                    // Request permission for notifications
                    if (Notification.permission === 'default') {
                        Notification.requestPermission();
                    }
                }
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    }
    
    // Initialize PWA Manager
    if (!window.pwaManager) {
        window.pwaManager = new PWAManager();
    }
});

console.log('📱 PWA Manager Loaded!');