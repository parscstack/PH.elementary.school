// student-auth.js - سیستم احراز هویت مشترک برای تمام صفحات دانش‌آموز

const DEFAULT_PASSWORD = '123456';
const SESSION_KEY = 'current_student_session';

class StudentAuth {
    constructor() {
        this.STORAGE_KEY = 'portfolio_database_v1';
        this.data = this.loadData();
        this.session = this.getSession();
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.teacherNotes) parsed.teacherNotes = {};
                if (!parsed.studentPasswords) parsed.studentPasswords = {};
                if (!parsed.studentPhotos) parsed.studentPhotos = {};
                return parsed;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return {
            students: [],
            evaluations: {},
            goals: {},
            parentData: {},
            teacherData: {},
            teacherNotes: {},
            studentPasswords: {},
            studentPhotos: {}
        };
    }
    
    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }
    
    // Session Management
    getSession() {
        try {
            const session = sessionStorage.getItem(SESSION_KEY);
            return session ? JSON.parse(session) : null;
        } catch (e) {
            return null;
        }
    }
    
    setSession(student) {
        const session = {
            id: student.id,
            name: student.name,
            grade: student.grade,
            loginTime: new Date().toISOString()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        this.session = session;
    }
    
    clearSession() {
        sessionStorage.removeItem(SESSION_KEY);
        this.session = null;
    }
    
    isLoggedIn() {
        return !!this.session;
    }
    
    getCurrentStudent() {
        if (!this.session) return null;
        return this.data.students.find(s => s.id === this.session.id);
    }
    
    // Authentication
    findStudent(name, grade) {
        return (this.data.students || []).find(s => 
            s.name.toLowerCase() === name.toLowerCase() && s.grade === grade
        );
    }
    
    getPassword(name, grade) {
        const key = `${name}_${grade}`;
        return this.data.studentPasswords[key] || DEFAULT_PASSWORD;
    }
    
    setPassword(name, grade, password) {
        const key = `${name}_${grade}`;
        this.data.studentPasswords[key] = password;
        this.saveData();
    }
    
    resetPassword(name, grade) {
        const key = `${name}_${grade}`;
        if (this.data.studentPasswords) {
            delete this.data.studentPasswords[key];
        }
        this.saveData();
    }
    
    login(name, grade, password) {
        const student = this.findStudent(name, grade);
        if (!student) {
            return { success: false, message: '❌ دانش‌آموزی با این مشخصات پیدا نشد.' };
        }
        
        const correctPassword = this.getPassword(name, grade);
        if (password !== correctPassword) {
            return { success: false, message: '❌ رمز عبور اشتباه است.' };
        }
        
        this.setSession(student);
        return { success: true, student: student };
    }
    
    logout() {
        this.clearSession();
    }
    
    // Data Access (فقط برای دانش‌آموز لاگین شده)
    getStudentId() {
        return this.session ? this.session.id : null;
    }
    
    getEvaluations() {
        const id = this.getStudentId();
        if (!id) return {};
        return (this.data.evaluations && this.data.evaluations[id]) || {};
    }
    
    getGoals() {
        const id = this.getStudentId();
        if (!id) return [];
        return (this.data.goals && this.data.goals[id]) || [];
    }
    
    getNotes() {
        const id = this.getStudentId();
        if (!id) return [];
        return (this.data.teacherNotes && this.data.teacherNotes[id]) || [];
    }
    
    getParentData() {
        const id = this.getStudentId();
        if (!id) return null;
        return this.data.parentData[id] || null;
    }
    
    getTeacherData() {
        const id = this.getStudentId();
        if (!id) return null;
        return this.data.teacherData[id] || null;
    }
    
    getPhoto() {
        if (!this.session) return null;
        const key = `${this.session.name}_${this.session.grade}`;
        return this.data.studentPhotos[key];
    }
    
    setPhoto(photoData) {
        if (!this.session) return;
        const key = `${this.session.name}_${this.session.grade}`;
        this.data.studentPhotos[key] = photoData;
        this.saveData();
    }
    
    // Add Data (فقط برای دانش‌آموز لاگین شده)
    addEvaluation(month, evaluation) {
        const id = this.getStudentId();
        if (!id) return false;
        
        if (!this.data.evaluations) this.data.evaluations = {};
        if (!this.data.evaluations[id]) this.data.evaluations[id] = {};
        
        this.data.evaluations[id][month] = evaluation;
        this.saveData();
        return true;
    }
    
    addGoal(goal) {
        const id = this.getStudentId();
        if (!id) return null;
        
        if (!this.data.goals) this.data.goals = {};
        if (!this.data.goals[id]) this.data.goals[id] = [];
        
        goal.id = 'goal_' + Date.now();
        goal.createdAt = new Date().toISOString();
        this.data.goals[id].push(goal);
        this.saveData();
        return goal;
    }
    
    deleteGoal(goalId) {
        const id = this.getStudentId();
        if (!id || !this.data.goals[id]) return false;
        
        this.data.goals[id] = this.data.goals[id].filter(g => g.id !== goalId);
        this.saveData();
        return true;
    }
    
    updateStudentView(studentData) {
        const student = this.getCurrentStudent();
        if (!student) return false;
        
        student.data = student.data || {};
        student.data.student_view = studentData;
        this.saveData();
        return true;
    }
}

// Export to global scope
window.StudentAuth = StudentAuth;