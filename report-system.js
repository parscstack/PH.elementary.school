// report-system.js - سیستم گزارش‌گیری پیشرفته

class ReportSystem {
    constructor() {
        this.STORAGE_KEY = 'portfolio_database_v1';
        this.REPORT_KEY = 'portfolio_reports';
        this.data = this.loadData();
        this.reports = this.loadReports();
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return { students: [], evaluations: {}, goals: {}, teacherNotes: {} };
    }
    
    loadReports() {
        try {
            const saved = localStorage.getItem(this.REPORT_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading reports:', error);
        }
        return { reports: [], settings: { autoEmail: false, email: '' } };
    }
    
    saveReports() {
        try {
            localStorage.setItem(this.REPORT_KEY, JSON.stringify(this.reports));
        } catch (error) {
            console.error('Error saving reports:', error);
        }
    }
    
    // ============================================
    // 1. GENERATE REPORT
    // ============================================
    generateReport(filters) {
        const { studentId, classId, grade, startDate, endDate, type } = filters;
        
        let students = this.data.students || [];
        let reportData = {};
        
        // Filter by student
        if (studentId) {
            students = students.filter(s => s.id === studentId);
        }
        
        // Filter by grade
        if (grade) {
            students = students.filter(s => s.grade === grade);
        }
        
        // Filter by class (if implemented)
        if (classId) {
            // students = students.filter(s => s.classId === classId);
        }
        
        // Generate report for each student
        students.forEach(student => {
            const evals = this.getEvaluations(student.id);
            const goals = this.getGoals(student.id);
            const notes = this.getNotes(student.id);
            const points = this.getStudentPoints(student.id);
            
            // Filter evaluations by date
            let filteredEvals = evals;
            if (startDate || endDate) {
                filteredEvals = {};
                Object.keys(evals).forEach(month => {
                    const date = new Date(evals[month].date);
                    if ((!startDate || date >= new Date(startDate)) && 
                        (!endDate || date <= new Date(endDate))) {
                        filteredEvals[month] = evals[month];
                    }
                });
            }
            
            reportData[student.id] = {
                student: student,
                evaluations: filteredEvals,
                goals: goals,
                notes: notes,
                points: points,
                totalEvals: Object.keys(filteredEvals).length,
                totalGoals: goals.length,
                totalNotes: notes.length,
                avgRating: this.calculateAvgRating(filteredEvals)
            };
        });
        
        // Save report
        const report = {
            id: 'report_' + Date.now(),
            name: this.generateReportName(filters),
            filters: filters,
            data: reportData,
            createdAt: new Date().toISOString(),
            type: type || 'comprehensive'
        };
        
        this.reports.reports.push(report);
        this.saveReports();
        
        return report;
    }
    
    generateReportName(filters) {
        const parts = [];
        if (filters.grade) parts.push(`پایه ${filters.grade}`);
        if (filters.studentId) {
            const student = this.data.students.find(s => s.id === filters.studentId);
            if (student) parts.push(student.name);
        }
        if (filters.startDate) parts.push(`از ${new Date(filters.startDate).toLocaleDateString('fa-IR')}`);
        if (filters.endDate) parts.push(`تا ${new Date(filters.endDate).toLocaleDateString('fa-IR')}`);
        return parts.join(' - ') || 'گزارش کامل';
    }
    
    calculateAvgRating(evals) {
        const values = Object.values(evals);
        if (values.length === 0) return 0;
        const total = values.reduce((sum, e) => sum + (e.rating || 0), 0);
        return Math.round((total / values.length) * 10) / 10;
    }
    
    // ============================================
    // 2. GET REPORT HTML (for display/export)
    // ============================================
    getReportHTML(reportId) {
        const report = this.reports.reports.find(r => r.id === reportId);
        if (!report) return null;
        
        const data = report.data;
        const students = Object.values(data);
        
        let html = `
            <div style="font-family: 'Vazirmatn', Tahoma, sans-serif; direction: rtl; padding: 20px; max-width: 1200px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 3px solid #A51C30; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="color: #A51C30; font-size: 28px;">📊 گزارش پیشرفت تحصیلی</h1>
                    <p style="color: #666; font-size: 14px;">تاریخ: ${new Date().toLocaleDateString('fa-IR')}</p>
                    <p style="color: #999; font-size: 13px;">${report.name}</p>
                </div>
        `;
        
        // Summary stats
        const totalStudents = students.length;
        const totalEvals = students.reduce((sum, s) => sum + s.totalEvals, 0);
        const totalGoals = students.reduce((sum, s) => sum + s.totalGoals, 0);
        const avgRating = totalEvals > 0 ? (students.reduce((sum, s) => sum + s.avgRating, 0) / totalStudents).toFixed(1) : 0;
        
        html += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px;">
                <div style="background: #f0f4ff; padding: 15px; border-radius: 10px; text-align: center; border-right: 4px solid #667eea;">
                    <div style="font-size: 28px; font-weight: 800; color: #1a202c;">${totalStudents}</div>
                    <div style="font-size: 13px; color: #666;">دانش‌آموزان</div>
                </div>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center; border-right: 4px solid #48bb78;">
                    <div style="font-size: 28px; font-weight: 800; color: #1a202c;">${totalEvals}</div>
                    <div style="font-size: 13px; color: #666;">خودارزیابی</div>
                </div>
                <div style="background: #fef3c7; padding: 15px; border-radius: 10px; text-align: center; border-right: 4px solid #f59e0b;">
                    <div style="font-size: 28px; font-weight: 800; color: #1a202c;">${totalGoals}</div>
                    <div style="font-size: 13px; color: #666;">اهداف</div>
                </div>
                <div style="background: #f3e8ff; padding: 15px; border-radius: 10px; text-align: center; border-right: 4px solid #8b5cf6;">
                    <div style="font-size: 28px; font-weight: 800; color: #1a202c;">${avgRating}</div>
                    <div style="font-size: 13px; color: #666;">میانگین امتیاز</div>
                </div>
            </div>
        `;
        
        // Student details
        students.forEach((s, index) => {
            const student = s.student;
            const evals = s.evaluations;
            const goals = s.goals;
            const notes = s.notes;
            
            html += `
                <div style="background: white; border-radius: 15px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-right: 5px solid #A51C30;">
                    <h3 style="color: #1E3A5F; font-size: 18px; margin-bottom: 10px;">
                        ${index + 1}. ${student.name} - پایه ${student.grade}
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                        <div><strong>⭐ امتیاز:</strong> ${s.points || 0}</div>
                        <div><strong>📝 خودارزیابی:</strong> ${s.totalEvals}</div>
                        <div><strong>🎯 اهداف:</strong> ${s.totalGoals}</div>
                        <div><strong>📋 یادداشت‌ها:</strong> ${s.totalNotes}</div>
                    </div>
                    ${s.avgRating > 0 ? `<div style="margin-top: 10px; background: #f9fafb; padding: 10px; border-radius: 8px;"><strong>📊 میانگین امتیاز:</strong> ${s.avgRating} / 5</div>` : ''}
                    ${Object.keys(evals).length > 0 ? `
                        <div style="margin-top: 10px; font-size: 13px; color: #666;">
                            <strong>📅 ماه‌های ثبت شده:</strong> ${Object.keys(evals).join('، ')}
                        </div>
                    ` : ''}
                    ${goals.length > 0 ? `
                        <div style="margin-top: 10px; font-size: 13px; color: #666;">
                            <strong>🎯 اهداف:</strong>
                            <ul style="margin-right: 20px; margin-top: 5px;">
                                ${goals.map(g => `<li>${g.generalGoal || 'هدف بدون نام'}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; font-size: 12px; color: #999;">
                    این گزارش توسط سامانه پوشه کار تعاملی تولید شده است
                </div>
            </div>
        `;
        
        return html;
    }
    
    // ============================================
    // 3. EXPORT TO PDF
    // ============================================
    exportToPDF(reportId) {
        const html = this.getReportHTML(reportId);
        if (!html) return null;
        
        // Create a new window for printing (save as PDF)
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>گزارش پیشرفت تحصیلی</title>
                <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">
                <style>
                    @media print {
                        body { padding: 0; margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                ${html}
                <div class="no-print" style="text-align: center; padding: 20px;">
                    <button onclick="window.print()" style="padding: 10px 30px; background: #A51C30; color: white; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; font-family: 'Vazirmatn', sans-serif;">
                        📄 دانلود PDF
                    </button>
                    <button onclick="window.close()" style="padding: 10px 30px; background: #e2e8f0; color: #1a202c; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; font-family: 'Vazirmatn', sans-serif; margin-right: 10px;">
                        ❌ بستن
                    </button>
                </div>
            </body>
            </html>
        `);
        win.document.close();
        
        return win;
    }
    
    // ============================================
    // 4. EXPORT TO WORD
    // ============================================
    exportToWord(reportId) {
        const html = this.getReportHTML(reportId);
        if (!html) return null;
        
        const fullHtml = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>گزارش پیشرفت تحصیلی</title>
                <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet">
            </head>
            <body style="font-family: 'Vazirmatn', Tahoma; direction: rtl; text-align: right; font-size: 12pt; line-height: 2; padding: 20px;">
                ${html}
            </body>
            </html>
        `;
        
        const blob = new Blob(['\ufeff' + fullHtml], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `گزارش-پیشرفت-${Date.now()}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        return true;
    }
    
    // ============================================
    // 5. GET REPORTS LIST
    // ============================================
    getReportsList() {
        return this.reports.reports.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
    }
    
    getReport(reportId) {
        return this.reports.reports.find(r => r.id === reportId);
    }
    
    deleteReport(reportId) {
        this.reports.reports = this.reports.reports.filter(r => r.id !== reportId);
        this.saveReports();
    }
    
    // ============================================
    // HELPERS
    // ============================================
    getEvaluations(studentId) {
        return this.data.evaluations && this.data.evaluations[studentId] ? 
            this.data.evaluations[studentId] : {};
    }
    
    getGoals(studentId) {
        return this.data.goals && this.data.goals[studentId] ? 
            this.data.goals[studentId] : [];
    }
    
    getNotes(studentId) {
        return this.data.teacherNotes && this.data.teacherNotes[studentId] ? 
            this.data.teacherNotes[studentId] : [];
    }
    
    getStudentPoints(studentId) {
        try {
            const data = localStorage.getItem('portfolio_database_v1');
            if (data) {
                const parsed = JSON.parse(data);
                const rewards = parsed.rewards && parsed.rewards[studentId];
                return rewards ? rewards.points || 0 : 0;
            }
        } catch (error) {
            console.error('Error getting points:', error);
        }
        return 0;
    }
}

// Export to global scope
window.ReportSystem = ReportSystem;

console.log('📊 سیستم گزارش‌گیری پیشرفته بارگذاری شد!');