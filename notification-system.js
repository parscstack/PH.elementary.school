// notification-system.js - سیستم نوتیفیکیشن و یادآوری

class NotificationSystem {
    constructor() {
        this.STORAGE_KEY = 'portfolio_notifications_v1';
        this.notifications = this.load();
        this.checkReminders();
    }
    
    // ============================================
    // LOAD / SAVE
    // ============================================
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
        return {
            items: [],
            settings: {
                evaluationReminder: true,
                goalReminder: true,
                badgeAlert: true,
                teacherNote: true,
                lastCheck: null
            },
            stats: {
                total: 0,
                unread: 0,
                read: 0
            }
        };
    }
    
    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }
    
    // ============================================
    // CREATE NOTIFICATION
    // ============================================
    add(type, title, message, data = {}) {
        const notification = {
            id: 'notif_' + Date.now(),
            type: type, // 'evaluation', 'goal', 'badge', 'teacher_note', 'achievement'
            title: title,
            message: message,
            data: data,
            createdAt: new Date().toISOString(),
            read: false,
            readAt: null
        };
        
        this.notifications.items.unshift(notification);
        this.notifications.stats.total++;
        this.notifications.stats.unread++;
        this.save();
        
        // Show browser notification if supported
        this.showBrowserNotification(title, message);
        
        // Dispatch event for UI update
        this.dispatchUpdateEvent();
        
        return notification;
    }
    
    // ============================================
    // READ / UNREAD
    // ============================================
    markAsRead(notificationId) {
        const notif = this.notifications.items.find(n => n.id === notificationId);
        if (notif && !notif.read) {
            notif.read = true;
            notif.readAt = new Date().toISOString();
            this.notifications.stats.unread--;
            this.notifications.stats.read++;
            this.save();
            this.dispatchUpdateEvent();
            return true;
        }
        return false;
    }
    
    markAllAsRead() {
        this.notifications.items.forEach(n => {
            if (!n.read) {
                n.read = true;
                n.readAt = new Date().toISOString();
            }
        });
        this.notifications.stats.unread = 0;
        this.notifications.stats.read = this.notifications.items.length;
        this.save();
        this.dispatchUpdateEvent();
    }
    
    delete(notificationId) {
        this.notifications.items = this.notifications.items.filter(n => n.id !== notificationId);
        this.updateStats();
        this.save();
        this.dispatchUpdateEvent();
    }
    
    deleteAll() {
        this.notifications.items = [];
        this.notifications.stats = { total: 0, unread: 0, read: 0 };
        this.save();
        this.dispatchUpdateEvent();
    }
    
    // ============================================
    // GET NOTIFICATIONS
    // ============================================
    getAll() {
        return this.notifications.items;
    }
    
    getUnread() {
        return this.notifications.items.filter(n => !n.read);
    }
    
    getByType(type) {
        return this.notifications.items.filter(n => n.type === type);
    }
    
    getStats() {
        return this.notifications.stats;
    }
    
    // ============================================
    // UPDATE STATS
    // ============================================
    updateStats() {
        const total = this.notifications.items.length;
        const unread = this.notifications.items.filter(n => !n.read).length;
        this.notifications.stats = { total, unread, read: total - unread };
    }
    
    // ============================================
    // REMINDERS
    // ============================================
    checkReminders() {
        const today = new Date();
        const lastCheck = this.notifications.settings.lastCheck ? 
            new Date(this.notifications.settings.lastCheck) : null;
        
        // Check once per day
        if (lastCheck && today.toDateString() === lastCheck.toDateString()) {
            return;
        }
        
        this.notifications.settings.lastCheck = today.toISOString();
        this.save();
        
        // Check evaluation reminder (after 25th of each month)
        if (this.notifications.settings.evaluationReminder) {
            this.checkEvaluationReminder();
        }
        
        // Check goal reminder (every 2 weeks)
        if (this.notifications.settings.goalReminder) {
            this.checkGoalReminder();
        }
    }
    
    checkEvaluationReminder() {
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        
        // After 25th of each month, remind about evaluation
        if (day >= 25) {
            // Check if already reminded this month
            const lastEvalReminder = this.notifications.items.find(n => 
                n.type === 'evaluation_reminder' && 
                new Date(n.createdAt).getMonth() === today.getMonth()
            );
            
            if (!lastEvalReminder) {
                this.add(
                    'evaluation_reminder',
                    '📝 یادآوری خودارزیابی ماهانه',
                    `ماه ${this.getPersianMonth(month)} تقریباً تموم شده! خودارزیابی این ماه رو ثبت کن.`,
                    { month: month }
                );
            }
        }
    }
    
    checkGoalReminder() {
        const today = new Date();
        
        // Check every 2 weeks
        const lastGoalReminder = this.notifications.items.find(n => 
            n.type === 'goal_reminder' && 
            (new Date() - new Date(n.createdAt)) < 14 * 24 * 60 * 60 * 1000
        );
        
        if (!lastGoalReminder) {
            this.add(
                'goal_reminder',
                '🎯 یادآوری بررسی اهداف',
                'بهت یادآوری میکنیم که اهداف SMART خودت رو بررسی کنی و پیشرفتت رو ثبت کنی!',
                {}
            );
        }
    }
    
    // ============================================
    // BROWSER NOTIFICATION
    // ============================================
    showBrowserNotification(title, message) {
        if (!('Notification' in window)) return;
        
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '🎒',
                silent: false
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    
    // ============================================
    // EVENT DISPATCH
    // ============================================
    dispatchUpdateEvent() {
        const event = new CustomEvent('notificationsUpdated', {
            detail: {
                stats: this.getStats(),
                notifications: this.getAll()
            }
        });
        document.dispatchEvent(event);
    }
    
    // ============================================
    // UTILITIES
    // ============================================
    getPersianMonth(month) {
        const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                       'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        return months[month - 1] || month;
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = Math.floor((now - new Date(date)) / 1000);
        
        if (diff < 60) return 'چند لحظه پیش';
        if (diff < 3600) return Math.floor(diff / 60) + ' دقیقه پیش';
        if (diff < 86400) return Math.floor(diff / 3600) + ' ساعت پیش';
        if (diff < 2592000) return Math.floor(diff / 86400) + ' روز پیش';
        return new Date(date).toLocaleDateString('fa-IR');
    }
    
    getTypeIcon(type) {
        const icons = {
            'evaluation_reminder': '📝',
            'goal_reminder': '🎯',
            'badge_alert': '🏆',
            'teacher_note': '👨‍🏫',
            'achievement': '🌟',
            'system': '⚙️'
        };
        return icons[type] || '🔔';
    }
    
    getTypeLabel(type) {
        const labels = {
            'evaluation_reminder': 'یادآوری خودارزیابی',
            'goal_reminder': 'یادآوری اهداف',
            'badge_alert': 'نشان جدید',
            'teacher_note': 'یادداشت معلم',
            'achievement': 'دستاورد',
            'system': 'سیستم'
        };
        return labels[type] || 'اطلاع‌رسانی';
    }
}

// Export to global scope
window.NotificationSystem = NotificationSystem;

console.log('🔔 سیستم نوتیفیکیشن بارگذاری شد!');