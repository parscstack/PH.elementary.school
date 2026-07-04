// teacher-auth.js - سیستم احراز هویت معلم

class TeacherAuth {
    constructor() {
        this.STORAGE_KEY = 'portfolio_database_v1';
        this.SESSION_KEY = 'teacher_session';
        this.DEFAULT_PASSWORD = 'teacher123';
        this.data = this.loadData();
        this.session = this.getSession();
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.teacherAuth) {
                    parsed.teacherAuth = {
                        username: 'teacher',
                        password: this.DEFAULT_PASSWORD,
                        lastChanged: new Date().toISOString()
                    };
                }
                return parsed;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return {
            students: [],
            teacherAuth: {
                username: 'teacher',
                password: this.DEFAULT_PASSWORD,
                lastChanged: new Date().toISOString()
            }
        };
    }
    
    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }
    
    getSession() {
        try {
            const session = sessionStorage.getItem(this.SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    }
    
    setSession() {
        const session = {
            username: this.data.teacherAuth.username,
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
    
    login(username, password) {
        if (username !== this.data.teacherAuth.username) {
            return { success: false, message: '❌ نام کاربری اشتباه است.' };
        }
        
        if (password !== this.data.teacherAuth.password) {
            return { success: false, message: '❌ رمز عبور اشتباه است.' };
        }
        
        this.setSession();
        return { success: true, message: '✅ ورود با موفقیت انجام شد!' };
    }
    
    logout() {
        this.clearSession();
    }
    
    changePassword(oldPassword, newPassword) {
        if (oldPassword !== this.data.teacherAuth.password) {
            return { success: false, message: '❌ رمز فعلی اشتباه است.' };
        }
        
        if (newPassword.length < 6) {
            return { success: false, message: '❌ رمز جدید باید حداقل ۶ کاراکتر باشد.' };
        }
        
        this.data.teacherAuth.password = newPassword;
        this.data.teacherAuth.lastChanged = new Date().toISOString();
        this.saveData();
        return { success: true, message: '✅ رمز عبور با موفقیت تغییر کرد!' };
    }
    
    resetPassword() {
        this.data.teacherAuth.password = this.DEFAULT_PASSWORD;
        this.data.teacherAuth.lastChanged = new Date().toISOString();
        this.saveData();
        return { success: true, message: `✅ رمز به پیش‌فرض (${this.DEFAULT_PASSWORD}) ریست شد!` };
    }
}

// Export to global scope
window.TeacherAuth = TeacherAuth;