// security-system.js - سیستم امنیت و پشتیبان‌گیری خودکار با تشخیص کاربر

class SecuritySystem {
    constructor() {
        this.STORAGE_KEY = 'portfolio_database_v1';
        this.BACKUP_KEY = 'portfolio_backups';
        this.LOG_KEY = 'portfolio_logs';
        this.SETTINGS_KEY = 'portfolio_security_settings';
        this.ALERT_KEY = 'portfolio_alerts';
        this.SECRET_KEY = 'portfolio_secret_key_v1';
        
        this.settings = this.loadSettings();
        this.logs = this.loadLogs();
        this.backups = this.loadBackups();
        this.alerts = this.loadAlerts();
        this.initAutoBackup();
        this.initActivityMonitor();
    }
    
    // ============================================
    // SETTINGS
    // ============================================
    loadSettings() {
        try {
            const saved = localStorage.getItem(this.SETTINGS_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        return {
            autoBackup: true,
            backupInterval: 24,
            encryption: true,
            logLevel: 'info',
            maxBackups: 10,
            lastBackup: null,
            lastSecurityCheck: null,
            suspiciousPatterns: {
                multipleFailedLogins: 5,
                rapidActions: 10,
                unusualHours: [0, 1, 2, 3, 4, 5],
                maxActionsPerMinute: 30
            },
            alertEmail: null
        };
    }
    
    saveSettings() {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    // ============================================
    // ALERTS SYSTEM
    // ============================================
    loadAlerts() {
        try {
            const saved = localStorage.getItem(this.ALERT_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading alerts:', error);
        }
        return { alerts: [], unread: 0 };
    }
    
    saveAlerts() {
        try {
            localStorage.setItem(this.ALERT_KEY, JSON.stringify(this.alerts));
        } catch (error) {
            console.error('Error saving alerts:', error);
        }
    }
    
    addAlert(level, title, message, data = {}) {
        const alert = {
            id: 'alert_' + Date.now(),
            timestamp: new Date().toISOString(),
            level: level,
            title: title,
            message: message,
            data: data,
            read: false,
            resolved: false,
            resolvedAt: null
        };
        
        this.alerts.alerts.push(alert);
        this.alerts.unread++;
        
        if (this.alerts.alerts.length > 500) {
            this.alerts.alerts = this.alerts.alerts.slice(-500);
        }
        
        this.saveAlerts();
        this.addLog('warn', `🚨 ${title}: ${message}`, { alertId: alert.id, level: level });
        
        if (level === 'critical') {
            this.showBrowserNotification(title, message);
        }
        
        return alert;
    }
    
    getAlerts(level = null, limit = 50) {
        let alerts = this.alerts.alerts;
        if (level) {
            alerts = alerts.filter(a => a.level === level);
        }
        return alerts.slice(-limit).reverse();
    }
    
    getUnreadAlerts() {
        return this.alerts.alerts.filter(a => !a.read);
    }
    
    markAlertAsRead(alertId) {
        const alert = this.alerts.alerts.find(a => a.id === alertId);
        if (alert && !alert.read) {
            alert.read = true;
            this.alerts.unread--;
            this.saveAlerts();
            return true;
        }
        return false;
    }
    
    markAllAlertsAsRead() {
        this.alerts.alerts.forEach(a => {
            if (!a.read) {
                a.read = true;
            }
        });
        this.alerts.unread = 0;
        this.saveAlerts();
    }
    
    resolveAlert(alertId) {
        const alert = this.alerts.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = new Date().toISOString();
            this.saveAlerts();
            return true;
        }
        return false;
    }
    
    showBrowserNotification(title, message) {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification('🚨 ' + title, {
                body: message,
                icon: '🔐',
                silent: false,
                requireInteraction: true
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
    
    // ============================================
    // ENCRYPTION
    // ============================================
    async encryptData(data) {
        if (!this.settings.encryption) return data;
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const key = await this.getEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                dataBuffer
            );
            const result = new Uint8Array(iv.length + encrypted.byteLength);
            result.set(iv);
            result.set(new Uint8Array(encrypted), iv.length);
            return btoa(String.fromCharCode(...result));
        } catch (error) {
            console.error('Encryption error:', error);
            return data;
        }
    }
    
    async decryptData(encryptedData) {
        if (!this.settings.encryption) return encryptedData;
        try {
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            const key = await this.getEncryptionKey();
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        } catch (error) {
            console.error('Decryption error:', error);
            return encryptedData;
        }
    }
    
    async getEncryptionKey() {
        try {
            let keyData = localStorage.getItem(this.SECRET_KEY);
            if (!keyData) {
                const key = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                const exported = await crypto.subtle.exportKey('raw', key);
                keyData = btoa(String.fromCharCode(...new Uint8Array(exported)));
                localStorage.setItem(this.SECRET_KEY, keyData);
            }
            const keyBuffer = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
            return await crypto.subtle.importKey(
                'raw',
                keyBuffer,
                { name: 'AES-GCM' },
                false,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('Error getting encryption key:', error);
            return null;
        }
    }
    
    // ============================================
    // BACKUP SYSTEM
    // ============================================
    loadBackups() {
        try {
            const saved = localStorage.getItem(this.BACKUP_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading backups:', error);
        }
        return { backups: [] };
    }
    
    saveBackups() {
        try {
            localStorage.setItem(this.BACKUP_KEY, JSON.stringify(this.backups));
        } catch (error) {
            console.error('Error saving backups:', error);
        }
    }
    
    async createBackup() {
        try {
            let data = localStorage.getItem(this.STORAGE_KEY);
            if (this.settings.encryption) {
                const parsed = JSON.parse(data);
                data = await this.encryptData(parsed);
            }
            const backup = {
                id: 'backup_' + Date.now(),
                timestamp: new Date().toISOString(),
                data: data,
                encrypted: this.settings.encryption,
                size: data.length,
                version: '3.0'
            };
            this.backups.backups.push(backup);
            if (this.backups.backups.length > this.settings.maxBackups) {
                this.backups.backups = this.backups.backups.slice(-this.settings.maxBackups);
            }
            this.saveBackups();
            this.settings.lastBackup = backup.timestamp;
            this.saveSettings();
            this.addLog('info', 'پشتیبان‌گیری خودکار انجام شد', {
                backupId: backup.id,
                size: backup.size
            });
            return backup;
        } catch (error) {
            console.error('Backup error:', error);
            this.addLog('error', 'خطا در پشتیبان‌گیری', { error: error.message });
            return null;
        }
    }
    
    async restoreBackup(backupId) {
        try {
            const backup = this.backups.backups.find(b => b.id === backupId);
            if (!backup) {
                throw new Error('Backup not found');
            }
            let data = backup.data;
            if (backup.encrypted) {
                data = await this.decryptData(data);
                data = JSON.stringify(data);
            }
            localStorage.setItem(this.STORAGE_KEY, data);
            this.addLog('info', 'بازیابی از پشتیبان انجام شد', {
                backupId: backupId,
                timestamp: backup.timestamp
            });
            return true;
        } catch (error) {
            console.error('Restore error:', error);
            this.addLog('error', 'خطا در بازیابی پشتیبان', { error: error.message });
            return false;
        }
    }
    
    getBackups() {
        return this.backups.backups.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }
    
    deleteBackup(backupId) {
        this.backups.backups = this.backups.backups.filter(b => b.id !== backupId);
        this.saveBackups();
        this.addLog('info', 'پشتیبان حذف شد', { backupId: backupId });
    }
    
    // ============================================
    // AUTO BACKUP
    // ============================================
    initAutoBackup() {
        if (!this.settings.autoBackup) return;
        this.checkAutoBackup();
        setInterval(() => {
            this.checkAutoBackup();
        }, 60 * 60 * 1000);
    }
    
    checkAutoBackup() {
        if (!this.settings.autoBackup) return;
        const lastBackup = this.settings.lastBackup ? new Date(this.settings.lastBackup) : null;
        const now = new Date();
        if (!lastBackup) {
            this.createBackup();
            return;
        }
        const hoursSince = (now - lastBackup) / (1000 * 60 * 60);
        if (hoursSince >= this.settings.backupInterval) {
            this.createBackup();
        }
    }
    
    // ============================================
    // LOGGING SYSTEM (با تشخیص دقیق کاربر)
    // ============================================
    loadLogs() {
        try {
            const saved = localStorage.getItem(this.LOG_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
        }
        return { logs: [] };
    }
    
    saveLogs() {
        try {
            if (this.logs.logs.length > 10000) {
                this.logs.logs = this.logs.logs.slice(-10000);
            }
            localStorage.setItem(this.LOG_KEY, JSON.stringify(this.logs));
        } catch (error) {
            console.error('Error saving logs:', error);
        }
    }
    
    // تشخیص دقیق کاربر بر اساس session
    getCurrentUser() {
        try {
            // 1. Check Student (از دانش‌آموز لاگین شده)
            const studentId = localStorage.getItem('current_student_id');
            if (studentId) {
                const data = JSON.parse(localStorage.getItem('portfolio_database_v1') || '{"students":[]}');
                const student = data.students.find(s => s.id === studentId);
                if (student) {
                    return { 
                        type: 'student', 
                        id: studentId, 
                        name: student.name, 
                        role: 'دانش‌آموز',
                        roleKey: 'student',
                        grade: student.grade
                    };
                }
            }
            
            // 2. Check Teacher (از معلم لاگین شده)
            const teacherSession = sessionStorage.getItem('teacher_session');
            if (teacherSession) {
                const session = JSON.parse(teacherSession);
                return { 
                    type: 'teacher', 
                    id: session.username, 
                    name: session.username, 
                    role: 'معلم',
                    roleKey: 'teacher'
                };
            }
            
            // 3. Check Admin (از مدیر لاگین شده)
            const adminSession = sessionStorage.getItem('admin_session');
            if (adminSession) {
                const session = JSON.parse(adminSession);
                return { 
                    type: 'admin', 
                    id: session.username, 
                    name: session.username, 
                    role: 'مدیر',
                    roleKey: 'admin'
                };
            }
            
            // 4. Check Parent (والدین)
            const parentSession = localStorage.getItem('parent_session');
            if (parentSession) {
                const session = JSON.parse(parentSession);
                return { 
                    type: 'parent', 
                    id: session.studentId || 'parent', 
                    name: session.parentName || 'والدین', 
                    role: 'والدین',
                    roleKey: 'parent'
                };
            }
            
        } catch (error) {
            console.error('Error getting current user:', error);
        }
        
        return { 
            type: 'guest', 
            id: 'guest', 
            name: 'مهمان', 
            role: 'مهمان',
            roleKey: 'guest'
        };
    }
    
    // متد کمکی برای ثبت لاگ با تشخیص خودکار کاربر
    addLog(level, message, data = {}) {
        const user = this.getCurrentUser();
        
        const log = {
            id: 'log_' + Date.now(),
            timestamp: new Date().toISOString(),
            level: level, // 'debug', 'info', 'warn', 'error'
            message: message,
            data: data,
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                roleKey: user.roleKey,
                type: user.type
            },
            // تگ‌های اضافی برای فیلتر بهتر
            tags: {
                role: user.roleKey || 'guest',
                userType: user.type || 'guest',
                userId: user.id || 'unknown'
            },
            ip: this.getUserIP(),
            userAgent: navigator.userAgent
        };
        
        this.logs.logs.push(log);
        this.saveLogs();
        
        // بررسی فعالیت مشکوک
        this.checkSuspiciousActivity(log);
        
        // لاگ در کنسول
        const prefix = {
            'error': '🔴',
            'warn': '🟡',
            'info': '🔵',
            'debug': '🟣'
        }[level] || '⚪';
        
        console.log(`${prefix} [${log.timestamp}] [${user.role}] ${message}`, data);
        
        return log;
    }
    
    getUserIP() {
        try {
            return '127.0.0.1';
        } catch (error) {
            return 'unknown';
        }
    }
    
    // ============================================
    // GET LOGS WITH FILTERS
    // ============================================
    getLogs(level = null, limit = 100, roleKey = null) {
        let logs = this.logs.logs;
        
        // فیلتر بر اساس سطح
        if (level) {
            logs = logs.filter(l => l.level === level);
        }
        
        // فیلتر بر اساس نقش (با تگ)
        if (roleKey) {
            logs = logs.filter(l => l.tags && l.tags.role === roleKey);
        }
        
        return logs.slice(-limit).reverse();
    }
    
    getLogsByRole(roleKey, limit = 50) {
        return this.getLogs(null, limit, roleKey);
    }
    
    getLogsByUser(userId, limit = 50) {
        let logs = this.logs.logs;
        logs = logs.filter(l => l.user && l.user.id === userId);
        return logs.slice(-limit).reverse();
    }
    
    getLogsByDate(startDate, endDate, roleKey = null) {
        let logs = this.logs.logs;
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        logs = logs.filter(l => {
            const logDate = new Date(l.timestamp);
            return logDate >= start && logDate <= end;
        });
        
        if (roleKey) {
            logs = logs.filter(l => l.tags && l.tags.role === roleKey);
        }
        
        return logs.slice(-500).reverse();
    }
    
    getLogStats() {
        const stats = {
            total: this.logs.logs.length,
            byRole: {},
            byLevel: {},
            last24h: 0,
            last7d: 0
        };
        
        const now = new Date();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        
        this.logs.logs.forEach(log => {
            // آمار بر اساس نقش
            const role = log.tags?.role || 'guest';
            stats.byRole[role] = (stats.byRole[role] || 0) + 1;
            
            // آمار بر اساس سطح
            const level = log.level || 'info';
            stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
            
            // آمار زمانی
            const logDate = new Date(log.timestamp);
            if (logDate >= dayAgo) stats.last24h++;
            if (logDate >= weekAgo) stats.last7d++;
        });
        
        return stats;
    }
    
    // ============================================
    // SUSPICIOUS ACTIVITY DETECTION
    // ============================================
    initActivityMonitor() {
        this.userActions = {};
        this.failedLogins = {};
        
        setInterval(() => {
            this.cleanupActionTracking();
        }, 60 * 1000);
    }
    
    checkSuspiciousActivity(log) {
        const patterns = this.settings.suspiciousPatterns;
        const userKey = log.user?.id || 'anonymous';
        const role = log.user?.roleKey || 'guest';
        
        // فقط برای کاربران خاص هشدار بده (مدیر و معلم)
        const shouldAlert = ['admin', 'teacher'].includes(role);
        
        // 1. Multiple failed logins
        if (log.message.includes('ورود ناموفق') || log.message.includes('رمز عبور اشتباه')) {
            if (!this.failedLogins[userKey]) {
                this.failedLogins[userKey] = [];
            }
            this.failedLogins[userKey].push(log.timestamp);
            
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            this.failedLogins[userKey] = this.failedLogins[userKey]
                .filter(t => new Date(t) > fiveMinutesAgo);
            
            if (this.failedLogins[userKey].length >= patterns.multipleFailedLogins) {
                this.addAlert(
                    'critical',
                    '🚨 تلاش مکرر برای ورود ناموفق',
                    `کاربر ${log.user?.name || 'ناشناس'} (${role}) ${this.failedLogins[userKey].length} بار تلاش ناموفق برای ورود داشته است`,
                    {
                        user: log.user,
                        attempts: this.failedLogins[userKey].length,
                        timeWindow: '5 دقیقه'
                    }
                );
                this.failedLogins[userKey] = [];
            }
        }
        
        // 2. Rapid actions (فقط برای کاربران مهم)
        if (shouldAlert && (log.message.includes('حذف') || log.message.includes('تغییر') || log.message.includes('ویرایش'))) {
            if (!this.userActions[userKey]) {
                this.userActions[userKey] = [];
            }
            this.userActions[userKey].push(log.timestamp);
            
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
            this.userActions[userKey] = this.userActions[userKey]
                .filter(t => new Date(t) > oneMinuteAgo);
            
            if (this.userActions[userKey].length > patterns.maxActionsPerMinute) {
                this.addAlert(
                    'warning',
                    '⚠️ فعالیت سریع غیرعادی',
                    `کاربر ${log.user?.name || 'ناشناس'} (${role}) در یک دقیقه ${this.userActions[userKey].length} عمل انجام داده است`,
                    {
                        user: log.user,
                        actions: this.userActions[userKey].length,
                        timeWindow: '1 دقیقه'
                    }
                );
            }
        }
        
        // 3. Unusual hours (فقط برای کاربران مهم)
        if (shouldAlert) {
            const hour = new Date().getHours();
            if (patterns.unusualHours.includes(hour)) {
                this.addAlert(
                    'warning',
                    '🌙 فعالیت در ساعت غیرعادی',
                    `کاربر ${log.user?.name || 'ناشناس'} (${role}) در ساعت ${hour}:${new Date().getMinutes().toString().padStart(2, '0')} فعالیت کرده است`,
                    {
                        user: log.user,
                        hour: hour,
                        minute: new Date().getMinutes()
                    }
                );
            }
        }
        
        // 4. Suspicious data operations (همه کاربران)
        if (log.message.includes('پاک کردن همه') || log.message.includes('حذف تمام') || log.message.includes('حذف همه')) {
            this.addAlert(
                'critical',
                '🚨 عملیات خطرناک داده',
                `کاربر ${log.user?.name || 'ناشناس'} (${role}) درخواست پاک کردن همه داده‌ها را دارد`,
                {
                    user: log.user,
                    action: log.message,
                    timestamp: log.timestamp
                }
            );
        }
    }
    
    cleanupActionTracking() {
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        for (const key in this.userActions) {
            this.userActions[key] = this.userActions[key]
                .filter(t => new Date(t) > oneMinuteAgo);
            if (this.userActions[key].length === 0) {
                delete this.userActions[key];
            }
        }
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        for (const key in this.failedLogins) {
            this.failedLogins[key] = this.failedLogins[key]
                .filter(t => new Date(t) > fiveMinutesAgo);
            if (this.failedLogins[key].length === 0) {
                delete this.failedLogins[key];
            }
        }
    }
    
    // ============================================
    // SECURITY CHECK
    // ============================================
    async runSecurityCheck() {
        const results = {
            timestamp: new Date().toISOString(),
            checks: []
        };
        
        const hasBackup = this.backups.backups.length > 0;
        results.checks.push({
            name: 'پشتیبان‌گیری',
            status: hasBackup ? '✅' : '❌',
            message: hasBackup ? `${this.backups.backups.length} پشتیبان موجود است` : 'هیچ پشتیبان‌گیری انجام نشده است'
        });
        
        results.checks.push({
            name: 'رمزنگاری',
            status: this.settings.encryption ? '✅' : '⚠️',
            message: this.settings.encryption ? 'داده‌ها رمزنگاری می‌شوند' : 'رمزنگاری فعال نیست'
        });
        
        results.checks.push({
            name: 'پشتیبان‌گیری خودکار',
            status: this.settings.autoBackup ? '✅' : '⚠️',
            message: this.settings.autoBackup ? `هر ${this.settings.backupInterval} ساعت` : 'پشتیبان‌گیری خودکار غیرفعال است'
        });
        
        let lastBackupStatus = '⚠️';
        let lastBackupMsg = 'هیچ پشتیبان‌گیری انجام نشده است';
        if (this.settings.lastBackup) {
            const lastBackup = new Date(this.settings.lastBackup);
            const daysSince = (new Date() - lastBackup) / (1000 * 60 * 60 * 24);
            if (daysSince < 1) {
                lastBackupStatus = '✅';
                lastBackupMsg = 'کمتر از ۲۴ ساعت گذشته';
            } else if (daysSince < 7) {
                lastBackupStatus = '⚠️';
                lastBackupMsg = `${Math.round(daysSince)} روز گذشته`;
            } else {
                lastBackupStatus = '❌';
                lastBackupMsg = `${Math.round(daysSince)} روز گذشته (نیاز به پشتیبان‌گیری)`;
            }
        }
        results.checks.push({
            name: 'آخرین پشتیبان‌گیری',
            status: lastBackupStatus,
            message: lastBackupMsg
        });
        
        const hasLogs = this.logs.logs.length > 0;
        results.checks.push({
            name: 'سیستم لاگینگ',
            status: hasLogs ? '✅' : '⚠️',
            message: hasLogs ? `${this.logs.logs.length} رویداد ثبت شده است` : 'هیچ لاگی ثبت نشده است'
        });
        
        const hasAlerts = this.alerts.alerts.length > 0;
        const unreadAlerts = this.getUnreadAlerts().length;
        results.checks.push({
            name: 'هشدارها',
            status: unreadAlerts > 0 ? '⚠️' : '✅',
            message: unreadAlerts > 0 ? `${unreadAlerts} هشدار خوانده نشده` : 'همه هشدارها بررسی شده‌اند'
        });
        
        this.settings.lastSecurityCheck = results.timestamp;
        this.saveSettings();
        
        this.addLog('info', 'بررسی امنیتی انجام شد', { results: results.checks.map(c => c.name + ': ' + c.status) });
        
        return results;
    }
    
    // ============================================
    // EXPORT / IMPORT
    // ============================================
    async exportDatabase() {
        try {
            let data = localStorage.getItem(this.STORAGE_KEY);
            if (this.settings.encryption) {
                const parsed = JSON.parse(data);
                data = await this.encryptData(parsed);
            }
            const exportData = {
                version: '3.0',
                exportedAt: new Date().toISOString(),
                encrypted: this.settings.encryption,
                data: data,
                metadata: {
                    appName: 'سامانه پوشه کار تعاملی',
                    version: '3.0',
                    totalLogs: this.logs.logs.length,
                    totalBackups: this.backups.backups.length,
                    totalAlerts: this.alerts.alerts.length
                }
            };
            this.addLog('info', 'خروجی دیتابیس انجام شد', { encrypted: this.settings.encryption });
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('Export error:', error);
            this.addLog('error', 'خطا در خروجی دیتابیس', { error: error.message });
            return null;
        }
    }
    
    async importDatabase(jsonString) {
        try {
            const importData = JSON.parse(jsonString);
            let data = importData.data;
            if (importData.encrypted) {
                data = await this.decryptData(data);
                data = JSON.stringify(data);
            }
            const parsed = JSON.parse(data);
            if (!parsed.students) {
                throw new Error('فرمت دیتابیس نامعتبر است');
            }
            localStorage.setItem(this.STORAGE_KEY, data);
            this.addLog('info', 'ورودی دیتابیس انجام شد', { 
                encrypted: importData.encrypted,
                exportedAt: importData.exportedAt
            });
            return true;
        } catch (error) {
            console.error('Import error:', error);
            this.addLog('error', 'خطا در ورودی دیتابیس', { error: error.message });
            return false;
        }
    }
    
    // ============================================
    // EMERGENCY RECOVERY
    // ============================================
    async emergencyRecovery() {
        try {
            const backups = this.getBackups();
            if (backups.length === 0) {
                return { success: false, message: 'هیچ پشتیبان‌گیری برای بازیابی وجود ندارد' };
            }
            const latest = backups[0];
            const success = await this.restoreBackup(latest.id);
            if (success) {
                this.addLog('info', 'بازیابی اضطراری انجام شد', { backupId: latest.id });
                return { success: true, message: 'بازیابی با موفقیت انجام شد', backup: latest };
            } else {
                return { success: false, message: 'خطا در بازیابی پشتیبان' };
            }
        } catch (error) {
            console.error('Emergency recovery error:', error);
            return { success: false, message: error.message };
        }
    }
    
    // ============================================
    // PASSWORD MANAGEMENT
    // ============================================
    getAllPasswords() {
        try {
            const data = JSON.parse(localStorage.getItem('portfolio_database_v1') || '{"students":[], "studentPasswords":{}}');
            const passwords = {
                students: [],
                teacher: null,
                admin: null
            };
            
            // دانش‌آموزان
            const students = data.students || [];
            const studentPasswords = data.studentPasswords || {};
            
            students.forEach(student => {
                const key = `${student.name}_${student.grade}`;
                passwords.students.push({
                    id: student.id,
                    name: student.name,
                    grade: student.grade,
                    password: studentPasswords[key] || '123456',
                    isDefault: !studentPasswords[key]
                });
            });
            
            // معلم
            const teacherAuth = data.teacherAuth;
            if (teacherAuth) {
                passwords.teacher = {
                    username: teacherAuth.username || 'teacher',
                    password: teacherAuth.password || 'teacher123',
                    isDefault: teacherAuth.password === 'teacher123'
                };
            }
            
            // مدیر
            const adminAuth = data.adminAuth;
            if (adminAuth) {
                passwords.admin = {
                    username: adminAuth.username || 'admin',
                    password: adminAuth.password || 'admin123',
                    isDefault: adminAuth.password === 'admin123'
                };
            }
            
            return passwords;
        } catch (error) {
            console.error('Error getting passwords:', error);
            return { students: [], teacher: null, admin: null };
        }
    }
    
    resetStudentPassword(studentId) {
        try {
            const data = JSON.parse(localStorage.getItem('portfolio_database_v1') || '{"students":[], "studentPasswords":{}}');
            const student = data.students.find(s => s.id === studentId);
            if (!student) return false;
            
            const key = `${student.name}_${student.grade}`;
            if (data.studentPasswords) {
                delete data.studentPasswords[key];
            }
            localStorage.setItem('portfolio_database_v1', JSON.stringify(data));
            
            this.addLog('info', `رمز عبور دانش‌آموز ${student.name} به پیش‌فرض تغییر کرد`, {
                studentId: studentId,
                studentName: student.name
            });
            
            return true;
        } catch (error) {
            console.error('Error resetting student password:', error);
            return false;
        }
    }
    
    resetTeacherPassword() {
        try {
            const data = JSON.parse(localStorage.getItem('portfolio_database_v1') || '{}');
            if (!data.teacherAuth) {
                data.teacherAuth = { username: 'teacher', password: 'teacher123' };
            }
            data.teacherAuth.password = 'teacher123';
            localStorage.setItem('portfolio_database_v1', JSON.stringify(data));
            
            this.addLog('info', 'رمز عبور معلم به پیش‌فرض تغییر کرد');
            return true;
        } catch (error) {
            console.error('Error resetting teacher password:', error);
            return false;
        }
    }
    
    resetAdminPassword() {
        try {
            const data = JSON.parse(localStorage.getItem('portfolio_database_v1') || '{}');
            if (!data.adminAuth) {
                data.adminAuth = { username: 'admin', password: 'admin123' };
            }
            data.adminAuth.password = 'admin123';
            localStorage.setItem('portfolio_database_v1', JSON.stringify(data));
            
            this.addLog('info', 'رمز عبور مدیر به پیش‌فرض تغییر کرد');
            return true;
        } catch (error) {
            console.error('Error resetting admin password:', error);
            return false;
        }
    }
    
    // ============================================
    // LOGGING HELPERS
    // ============================================
    logLogin(user, success) {
        this.addLog(
            success ? 'info' : 'warn',
            success ? `✅ ورود موفق ${user.role || 'کاربر'}` : `❌ ورود ناموفق ${user.name || 'کاربر ناشناس'}`,
            { user: user, success: success }
        );
    }
    
    logAction(user, action, details = {}) {
        this.addLog(
            'info',
            `${action}`,
            { user: user, action: action, details: details }
        );
    }
    
    logDataOperation(user, operation, dataType, count = null) {
        this.addLog(
            'info',
            `${operation} ${dataType}`,
            { user: user, operation: operation, dataType: dataType, count: count }
        );
    }
    
    logSecurityEvent(user, event, severity = 'info') {
        this.addLog(
            severity,
            `🔒 ${event}`,
            { user: user, event: event }
        );
    }
}

// Export to global scope
window.SecuritySystem = SecuritySystem;

console.log('🔐 سیستم امنیت پیشرفته با تشخیص کاربر بارگذاری شد!');