// assistant-auth.js - سیستم احراز هویت معاونین

class AssistantAuth {
    constructor() {
        this.STORAGE_KEY = 'portfolio_database_v1';
        this.SESSION_KEY = 'assistant_session';
        this.data = this.loadData();
        this.session = this.getSession();
        this.initAssistants();
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.assistants) parsed.assistants = [];
                if (!parsed.assistantLogs) parsed.assistantLogs = {};
                return parsed;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return {
            students: [],
            assistants: [],
            assistantLogs: {},
            evaluations: {},
            goals: {},
            teacherNotes: {}
        };
    }
    
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    // ============================================
    // INITIALIZE DEFAULT ASSISTANTS
    // ============================================
    initAssistants() {
        if (this.data.assistants.length === 0) {
            this.data.assistants = [
                {
                    id: 'assistant_1',
                    name: 'معاون آموزشی',
                    username: 'edu',
                    password: 'edu123',
                    role: 'educational',
                    roleTitle: 'معاون آموزشی',
                    createdAt: new Date().toISOString(),
                    permissions: ['view_students', 'view_goals', 'view_evaluations', 'view_charts', 'send_notification', 'import_files']
                },
                {
                    id: 'assistant_2',
                    name: 'معاون پرورشی',
                    username: 'culture',
                    password: 'culture123',
                    role: 'cultural',
                    roleTitle: 'معاون پرورشی',
                    createdAt: new Date().toISOString(),
                    permissions: ['view_students', 'view_badges', 'view_leaderboard', 'send_notification', 'send_files', 'manage_library']
                },
                {
                    id: 'assistant_3',
                    name: 'معاون اجرایی',
                    username: 'executive',
                    password: 'exec123',
                    role: 'executive',
                    roleTitle: 'معاون اجرایی',
                    createdAt: new Date().toISOString(),
                    permissions: ['view_students', 'manage_classes', 'manage_teachers', 'view_reports', 'view_logs', 'manage_passwords', 'send_notification']
                }
            ];
            this.saveData();
        }
    }
    
    // ============================================
    // SESSION MANAGEMENT
    // ============================================
    getSession() {
        try {
            const session = sessionStorage.getItem(this.SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    }
    
    setSession(assistant) {
        const session = {
            id: assistant.id,
            username: assistant.username,
            name: assistant.name,
            role: assistant.role,
            roleTitle: assistant.roleTitle,
            permissions: assistant.permissions,
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        this.session = session;
    }
    
    clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
        this.session = null;
    }
    
    isLoggedIn() {
        return !!this.session;
    }
    
    getCurrentAssistant() {
        if (!this.session) return null;
        return this.data.assistants.find(a => a.id === this.session.id);
    }
    
    // ============================================
    // AUTHENTICATION
    // ============================================
    login(username, password) {
        const assistant = this.data.assistants.find(a => 
            a.username.toLowerCase() === username.toLowerCase()
        );
        
        if (!assistant) {
            return { success: false, message: '❌ معاون با این نام کاربری یافت نشد.' };
        }
        
        if (password !== assistant.password) {
            return { success: false, message: '❌ رمز عبور اشتباه است.' };
        }
        
        this.setSession(assistant);
        this.addLog(assistant.id, 'login', 'ورود موفق به سیستم');
        
        return { success: true, message: '✅ ورود با موفقیت انجام شد!', assistant: assistant };
    }
    
    logout() {
        if (this.session) {
            this.addLog(this.session.id, 'logout', 'خروج از سیستم');
        }
        this.clearSession();
    }
    
    // ============================================
    // PERMISSION CHECK
    // ============================================
    hasPermission(permission) {
        if (!this.session) return false;
        return this.session.permissions.includes(permission);
    }
    
    hasAnyPermission(permissions) {
        if (!this.session) return false;
        return permissions.some(p => this.session.permissions.includes(p));
    }
    
    // ============================================
    // LOGGING
    // ============================================
    addLog(assistantId, action, details = '') {
        if (!this.data.assistantLogs) this.data.assistantLogs = {};
        if (!this.data.assistantLogs[assistantId]) this.data.assistantLogs[assistantId] = [];
        
        this.data.assistantLogs[assistantId].push({
            id: 'log_' + Date.now(),
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            ip: '127.0.0.1'
        });
        
        this.saveData();
    }
    
    getLogs(assistantId, limit = 100) {
        if (!this.data.assistantLogs || !this.data.assistantLogs[assistantId]) return [];
        return this.data.assistantLogs[assistantId].slice(-limit).reverse();
    }
    
    getAllLogs(limit = 500) {
        const allLogs = [];
        const logs = this.data.assistantLogs || {};
        for (const [id, logList] of Object.entries(logs)) {
            const assistant = this.data.assistants.find(a => a.id === id);
            logList.forEach(log => {
                allLogs.push({
                    ...log,
                    assistantId: id,
                    assistantName: assistant ? assistant.name : 'نامشخص',
                    assistantRole: assistant ? assistant.roleTitle : 'نامشخص'
                });
            });
        }
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return allLogs.slice(0, limit);
    }
    
    // ============================================
    // ASSISTANT MANAGEMENT (Admin Only)
    // ============================================
    addAssistant(name, username, password, role) {
        const exists = this.data.assistants.find(a => a.username === username);
        if (exists) {
            return { success: false, message: '❌ این نام کاربری قبلاً ثبت شده است.' };
        }
        
        const roleMap = {
            'educational': 'معاون آموزشی',
            'cultural': 'معاون پرورشی',
            'executive': 'معاون اجرایی'
        };
        
        const permissionMap = {
            'educational': ['view_students', 'view_goals', 'view_evaluations', 'view_charts', 'send_notification', 'import_files'],
            'cultural': ['view_students', 'view_badges', 'view_leaderboard', 'send_notification', 'send_files', 'manage_library'],
            'executive': ['view_students', 'manage_classes', 'manage_teachers', 'view_reports', 'view_logs', 'manage_passwords', 'send_notification']
        };
        
        const assistant = {
            id: 'assistant_' + Date.now(),
            name: name,
            username: username,
            password: password || '123456',
            role: role,
            roleTitle: roleMap[role] || 'معاون',
            createdAt: new Date().toISOString(),
            permissions: permissionMap[role] || []
        };
        
        this.data.assistants.push(assistant);
        this.saveData();
        
        this.addLog(assistant.id, 'create', 'معاون جدید ایجاد شد: ' + name);
        
        return { success: true, message: '✅ معاون با موفقیت اضافه شد!', assistant: assistant };
    }
    
    removeAssistant(assistantId) {
        const assistant = this.data.assistants.find(a => a.id === assistantId);
        if (!assistant) {
            return { success: false, message: '❌ معاون یافت نشد.' };
        }
        
        this.data.assistants = this.data.assistants.filter(a => a.id !== assistantId);
        delete this.data.assistantLogs[assistantId];
        this.saveData();
        
        return { success: true, message: `✅ معاون "${assistant.name}" با موفقیت حذف شد!` };
    }
    
    updateAssistantRole(assistantId, newRole) {
        const assistant = this.data.assistants.find(a => a.id === assistantId);
        if (!assistant) return { success: false, message: '❌ معاون یافت نشد.' };
        
        const roleMap = {
            'educational': 'معاون آموزشی',
            'cultural': 'معاون پرورشی',
            'executive': 'معاون اجرایی'
        };
        
        const permissionMap = {
            'educational': ['view_students', 'view_goals', 'view_evaluations', 'view_charts', 'send_notification', 'import_files'],
            'cultural': ['view_students', 'view_badges', 'view_leaderboard', 'send_notification', 'send_files', 'manage_library'],
            'executive': ['view_students', 'manage_classes', 'manage_teachers', 'view_reports', 'view_logs', 'manage_passwords', 'send_notification']
        };
        
        assistant.role = newRole;
        assistant.roleTitle = roleMap[newRole] || 'معاون';
        assistant.permissions = permissionMap[newRole] || [];
        this.saveData();
        
        this.addLog(assistantId, 'update_role', `نقش به ${assistant.roleTitle} تغییر یافت`);
        
        return { success: true, message: `✅ نقش معاون به "${assistant.roleTitle}" تغییر یافت!` };
    }
    
    resetAssistantPassword(assistantId) {
        const assistant = this.data.assistants.find(a => a.id === assistantId);
        if (!assistant) return { success: false, message: '❌ معاون یافت نشد.' };
        
        assistant.password = '123456';
        this.saveData();
        
        this.addLog(assistantId, 'reset_password', 'رمز عبور به پیش‌فرض (123456) ریست شد');
        
        return { success: true, message: '✅ رمز عبور با موفقیت ریست شد!' };
    }
    
    getAllAssistants() {
        return this.data.assistants || [];
    }
    
    // ============================================
    // REPORTING
    // ============================================
    getAssistantReport(assistantId) {
        const assistant = this.data.assistants.find(a => a.id === assistantId);
        if (!assistant) return null;
        
        const logs = this.getLogs(assistantId, 500);
        const actions = {};
        let totalActions = 0;
        
        logs.forEach(log => {
            actions[log.action] = (actions[log.action] || 0) + 1;
            totalActions++;
        });
        
        return {
            assistant: assistant,
            totalActions: totalActions,
            actions: actions,
            logs: logs,
            lastActivity: logs.length > 0 ? logs[0].timestamp : null,
            firstActivity: logs.length > 0 ? logs[logs.length - 1].timestamp : null
        };
    }
    
    getAllAssistantsReport() {
        const reports = [];
        this.data.assistants.forEach(assistant => {
            const report = this.getAssistantReport(assistant.id);
            if (report) reports.push(report);
        });
        return reports;
    }
}

// Export to global scope
window.AssistantAuth = AssistantAuth;

console.log('👥 سیستم احراز هویت معاونین بارگذاری شد!');