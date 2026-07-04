// theme-manager.js - مدیریت تم (Dark/Light Mode)

class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'portfolio_theme_preference';
        this.theme = this.loadTheme();
        this.applyTheme(this.theme);
        this.setupToggle();
    }
    
    loadTheme() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return saved;
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
        
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        
        return 'light';
    }
    
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    }
    
    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Update toggle button
        this.updateToggleIcon();
    }
    
    toggle() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        this.saveTheme(newTheme);
        
        // Dispatch event for other components
        const event = new CustomEvent('themeChanged', {
            detail: { theme: newTheme }
        });
        document.dispatchEvent(event);
    }
    
    setupToggle() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'themeToggle';
        toggleBtn.className = 'theme-toggle-btn';
        toggleBtn.setAttribute('aria-label', 'تغییر تم');
        toggleBtn.onclick = () => this.toggle();
        this.updateToggleIcon(toggleBtn);
        
        // Insert toggle button in header
        const header = document.querySelector('.header .header-right') || 
                       document.querySelector('.header .nav-buttons') ||
                       document.querySelector('.header-right') ||
                       document.querySelector('.header .right');
        
        if (header) {
            header.appendChild(toggleBtn);
        } else {
            // Fallback: add to body
            document.body.prepend(toggleBtn);
        }
    }
    
    updateToggleIcon(btn) {
        const button = btn || document.getElementById('themeToggle');
        if (!button) return;
        
        const isDark = this.theme === 'dark';
        button.innerHTML = isDark ? '☀️' : '🌙';
        button.title = isDark ? 'تم روشن' : 'تم تاریک';
    }
    
    getCurrentTheme() {
        return this.theme;
    }
    
    isDark() {
        return this.theme === 'dark';
    }
}

// Export to global scope
window.ThemeManager = ThemeManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (!window.themeManager) {
        window.themeManager = new ThemeManager();
    }
});

console.log('🎨 مدیریت تم بارگذاری شد!');