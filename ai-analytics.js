// ai-analytics.js - سیستم تحلیل هوشمند و پیشنهادات خودکار

class AIAnalytics {
    constructor() {
        this.STORAGE_KEY = 'portfolio_database_v1';
        this.data = this.loadData();
        console.log('🤖 AI Analytics initialized with data:', this.data);
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure all required fields exist
                if (!parsed.students) parsed.students = [];
                if (!parsed.evaluations) parsed.evaluations = {};
                if (!parsed.goals) parsed.goals = {};
                if (!parsed.teacherNotes) parsed.teacherNotes = {};
                return parsed;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return { 
            students: [], 
            evaluations: {}, 
            goals: {}, 
            teacherNotes: {} 
        };
    }
    
    // ============================================
    // 1. پیشنهادات خودکار هدف بر اساس علایق
    // ============================================
    suggestGoals(studentId) {
        console.log('🔍 Suggesting goals for student:', studentId);
        
        const student = this.data.students.find(s => s.id === studentId);
        if (!student) {
            console.log('❌ Student not found');
            return [];
        }
        
        const studentView = student.data?.student_view || {};
        const interests = studentView.interests || [];
        const grade = student.grade || 'سوم';
        const existingGoals = this.data.goals[studentId] || [];
        const existingTitles = existingGoals.map(g => g.generalGoal || '');
        
        console.log('📊 Student interests:', interests);
        console.log('📊 Existing goals:', existingTitles);
        
        const suggestions = [];
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0];
        
        // بر اساس علایق
        const interestMap = {
            'نقاشی': {
                generalGoal: 'پیشرفت در نقاشی و هنر',
                specificGoal: 'کشیدن ۵ نقاشی زیبا در ماه',
                measurable: 'تعداد نقاشی‌های کامل شده',
                achievable: 'با تمرین روزانه ۲۰ دقیقه',
                relevant: 'علاقه من به هنر را تقویت می‌کند',
                startDate: today,
                endDate: nextMonth,
                frequency: '3'
            },
            'موسیقی': {
                generalGoal: 'یادگیری یک ساز موسیقی',
                specificGoal: 'نواختن یک آهنگ کامل با ساز مورد علاقه',
                measurable: 'تعداد آهنگ‌های یادگرفته شده',
                achievable: 'با تمرین هفته‌ای ۳ بار',
                relevant: 'به تقویت خلاقیت کمک می‌کند',
                startDate: today,
                endDate: nextMonth,
                frequency: '3'
            },
            'فوتبال': {
                generalGoal: 'بهبود مهارت‌های فوتبال',
                specificGoal: 'یادگیری ۳ حرکت جدید فوتبال',
                measurable: 'تعداد حرکات یادگرفته شده',
                achievable: 'با تمرین هفته‌ای ۲ بار',
                relevant: 'سلامتی و ورزش را تقویت می‌کند',
                startDate: today,
                endDate: nextMonth,
                frequency: '2'
            },
            'کتاب‌خوانی': {
                generalGoal: 'افزایش مطالعه و کتاب‌خوانی',
                specificGoal: 'خواندن ۵ کتاب داستان در ماه',
                measurable: 'تعداد کتاب‌های خوانده شده',
                achievable: 'روزی ۱۵ دقیقه مطالعه',
                relevant: 'تقویت مهارت خواندن و واژگان',
                startDate: today,
                endDate: nextMonth,
                frequency: '4'
            },
            'ریاضی': {
                generalGoal: 'تقویت مهارت‌های ریاضی',
                specificGoal: 'حل ۵۰ مساله ریاضی در ماه',
                measurable: 'تعداد مسائل حل شده',
                achievable: 'روزی ۱۰ مساله',
                relevant: 'پایه و اساس درس‌های دیگر است',
                startDate: today,
                endDate: nextMonth,
                frequency: '4'
            },
            'علوم': {
                generalGoal: 'یادگیری علوم و آزمایش‌ها',
                specificGoal: 'انجام ۳ آزمایش علمی در ماه',
                measurable: 'تعداد آزمایش‌های انجام شده',
                achievable: 'با کمک والدین',
                relevant: 'کنجکاوی و تفکر علمی را تقویت می‌کند',
                startDate: today,
                endDate: nextMonth,
                frequency: '2'
            }
        };
        
        // پیدا کردن پیشنهاد بر اساس علاقه
        for (const interest of interests) {
            for (const [key, value] of Object.entries(interestMap)) {
                if (interest.includes(key) || key.includes(interest)) {
                    if (!existingTitles.includes(value.generalGoal)) {
                        suggestions.push({
                            ...value,
                            status: 'not-started'
                        });
                    }
                    break;
                }
            }
        }
        
        // اگر پیشنهادی بر اساس علایق نبود، پیشنهادات پایه
        if (suggestions.length < 2) {
            const basicGoals = [
                {
                    generalGoal: 'بهبود نمرات ریاضی',
                    specificGoal: `افزایش نمره ریاضی به ۱۸ از ۲۰ در پایه ${grade}`,
                    measurable: 'نمره ریاضی در آزمون بعدی',
                    achievable: 'با تمرین روزانه و حل مسائل',
                    relevant: 'ریاضی پایه درس‌های دیگر است',
                    startDate: today,
                    endDate: nextMonth,
                    frequency: '4',
                    status: 'not-started'
                },
                {
                    generalGoal: 'پیشرفت در درس فارسی',
                    specificGoal: 'نوشتن ۵ انشای خوب در ماه',
                    measurable: 'تعداد انشاهای نوشته شده',
                    achievable: 'با تمرین هفته‌ای یک انشا',
                    relevant: 'تقویت مهارت نوشتن و بیان',
                    startDate: today,
                    endDate: nextMonth,
                    frequency: '2',
                    status: 'not-started'
                },
                {
                    generalGoal: 'تقویت مهارت خواندن',
                    specificGoal: 'خواندن ۳ کتاب داستان در ماه',
                    measurable: 'تعداد کتاب‌های خوانده شده',
                    achievable: 'روزی ۲۰ دقیقه مطالعه',
                    relevant: 'تقویت دایره واژگان و درک مطلب',
                    startDate: today,
                    endDate: nextMonth,
                    frequency: '3',
                    status: 'not-started'
                }
            ];
            
            for (const goal of basicGoals) {
                if (!existingTitles.includes(goal.generalGoal) && suggestions.length < 5) {
                    suggestions.push(goal);
                }
            }
        }
        
        console.log('✅ Suggestions found:', suggestions.length);
        return suggestions.slice(0, 5);
    }
    
    // ============================================
    // 2. پیش‌بینی روند پیشرفت
    // ============================================
    predictProgress(studentId) {
        console.log('📈 Predicting progress for student:', studentId);
        
        const evals = this.data.evaluations[studentId] || {};
        const months = Object.keys(evals);
        
        if (months.length < 2) {
            return {
                trend: 'insufficient_data',
                message: 'برای پیش‌بینی نیاز به حداقل ۲ ماه داده داریم',
                predictedRating: null,
                confidence: 0,
                currentRating: months.length > 0 ? evals[months[months.length-1]]?.rating || 0 : 0,
                avgRating: 0,
                months: months,
                ratings: months.map(m => evals[m]?.rating || 0)
            };
        }
        
        const ratings = months.map(m => evals[m]?.rating || 0);
        const lastRating = ratings[ratings.length - 1];
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        
        let trend = 'stable';
        let predictedRating = lastRating;
        let confidence = 0.6;
        
        if (ratings.length >= 3) {
            const recentAvg = ratings.slice(-3).reduce((a, b) => a + b, 0) / 3;
            const olderAvg = ratings.slice(0, -3).reduce((a, b) => a + b, 0) / (ratings.length - 3);
            
            if (recentAvg > olderAvg + 0.5) {
                trend = 'improving';
                predictedRating = Math.min(lastRating + 0.3, 5);
                confidence = 0.7;
            } else if (recentAvg < olderAvg - 0.5) {
                trend = 'declining';
                predictedRating = Math.max(lastRating - 0.3, 1);
                confidence = 0.65;
            }
        }
        
        const result = {
            trend: trend,
            message: this.getTrendMessage(trend),
            predictedRating: Math.round(predictedRating * 10) / 10,
            confidence: Math.round(confidence * 100),
            currentRating: lastRating,
            avgRating: Math.round(avgRating * 10) / 10,
            months: months,
            ratings: ratings
        };
        
        console.log('✅ Progress prediction:', result);
        return result;
    }
    
    getTrendMessage(trend) {
        const messages = {
            'improving': '✅ روند رو به رشد! ادامه بده!',
            'declining': '⚠️ روند کاهشی - نیاز به توجه ویژه',
            'stable': '📊 روند ثابت - با تلاش بیشتر پیشرفت کن!',
            'insufficient_data': '📊 برای تحلیل دقیق به داده بیشتری نیاز داریم'
        };
        return messages[trend] || messages.stable;
    }
    
    // ============================================
    // 3. شناسایی دانش‌آموزان در معرض خطر
    // ============================================
    identifyAtRiskStudents() {
        console.log('⚠️ Identifying at-risk students...');
        
        const students = this.data.students || [];
        const atRiskList = [];
        
        students.forEach(student => {
            const risks = [];
            
            // بررسی خودارزیابی
            const evals = this.data.evaluations[student.id] || {};
            const months = Object.keys(evals);
            const recentMonths = months.slice(-3);
            
            if (recentMonths.length >= 2) {
                const ratings = recentMonths.map(m => evals[m]?.rating || 0);
                const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
                if (avgRating < 3) {
                    risks.push({
                        type: 'low_rating',
                        severity: 'high',
                        description: `میانگین امتیاز ${avgRating.toFixed(1)} در ۳ ماه اخیر`
                    });
                }
            }
            
            // بررسی اهداف
            const goals = this.data.goals[student.id] || [];
            const completedGoals = goals.filter(g => g.status === 'completed').length;
            const totalGoals = goals.length;
            
            if (totalGoals > 2 && completedGoals / totalGoals < 0.3) {
                risks.push({
                    type: 'low_goal_completion',
                    severity: 'medium',
                    description: `فقط ${completedGoals} از ${totalGoals} هدف تکمیل شده`
                });
            }
            
            // بررسی یادداشت‌های نگرانی
            const notes = this.data.teacherNotes?.[student.id] || [];
            const concernNotes = notes.filter(n => n.type === 'concern');
            if (concernNotes.length > 2) {
                risks.push({
                    type: 'multiple_concerns',
                    severity: 'high',
                    description: `${concernNotes.length} یادداشت نگرانی ثبت شده`
                });
            }
            
            // بررسی عدم فعالیت
            if (months.length === 0 && goals.length === 0) {
                risks.push({
                    type: 'inactive',
                    severity: 'medium',
                    description: 'هیچ فعالیتی ثبت نشده است'
                });
            }
            
            if (risks.length > 0) {
                atRiskList.push({
                    student: student,
                    risks: risks,
                    riskScore: risks.reduce((sum, r) => sum + (r.severity === 'high' ? 3 : 2), 0),
                    totalRisks: risks.length
                });
            }
        });
        
        // مرتب‌سازی بر اساس میزان خطر
        atRiskList.sort((a, b) => b.riskScore - a.riskScore);
        
        console.log('✅ At-risk students found:', atRiskList.length);
        return atRiskList;
    }
    
    // ============================================
    // 4. تحلیل خودکار خودارزیابی‌ها
    // ============================================
    analyzeEvaluations(studentId) {
        console.log('📝 Analyzing evaluations for student:', studentId);
        
        const evals = this.data.evaluations[studentId] || {};
        const months = Object.keys(evals);
        
        if (months.length === 0) {
            return {
                hasData: false,
                message: 'هنوز خودارزیابی ثبت نشده است'
            };
        }
        
        let totalRating = 0;
        let totalPrides = 0;
        const moodCount = {};
        const subjects = {};
        
        months.forEach(month => {
            const evalData = evals[month];
            if (evalData) {
                totalRating += evalData.rating || 0;
                totalPrides += (evalData.prides?.length || 0);
                
                const mood = evalData.mood?.label || 'معمولی';
                moodCount[mood] = (moodCount[mood] || 0) + 1;
                
                const subject = evalData.bestSubject || 'نامشخص';
                subjects[subject] = (subjects[subject] || 0) + 1;
            }
        });
        
        const avgRating = totalRating / months.length;
        const avgPrides = totalPrides / months.length;
        
        // پیدا کردن حالت غالب
        let dominantMood = 'معمولی';
        let maxMoodCount = 0;
        for (const [mood, count] of Object.entries(moodCount)) {
            if (count > maxMoodCount) {
                maxMoodCount = count;
                dominantMood = mood;
            }
        }
        
        // پیدا کردن درس برتر
        let bestSubject = 'نامشخص';
        let maxSubjectCount = 0;
        for (const [subject, count] of Object.entries(subjects)) {
            if (count > maxSubjectCount) {
                maxSubjectCount = count;
                bestSubject = subject;
            }
        }
        
        const result = {
            hasData: true,
            totalMonths: months.length,
            avgRating: Math.round(avgRating * 10) / 10,
            avgPrides: Math.round(avgPrides * 10) / 10,
            dominantMood: dominantMood,
            bestSubject: bestSubject,
            months: months,
            moodCount: moodCount,
            subjects: subjects,
            message: this.getAnalysisMessage(avgRating, avgPrides, dominantMood)
        };
        
        console.log('✅ Evaluation analysis:', result);
        return result;
    }
    
    getAnalysisMessage(avgRating, avgPrides, mood) {
        let message = '';
        
        if (avgRating >= 4) {
            message += '🌟 عالی! دانش‌آموز عملکرد بسیار خوبی دارد. ';
        } else if (avgRating >= 3) {
            message += '📊 خوب، اما جای پیشرفت دارد. ';
        } else {
            message += '⚠️ نیاز به توجه ویژه و حمایت بیشتر. ';
        }
        
        if (avgPrides >= 2) {
            message += '🏆 تعداد افتخارات خوب است.';
        } else if (avgPrides >= 1) {
            message += '💪 می‌تواند افتخارات بیشتری ثبت کند.';
        } else {
            message += '💡 تشویق به ثبت افتخارات روزانه.';
        }
        
        if (mood === 'عالی' || mood === 'خوب') {
            message += ' 😊 روحیه مثبت.';
        } else if (mood === 'ناراحت' || mood === 'عصبی') {
            message += ' 😔 نیاز به گفتگو و حمایت عاطفی.';
        }
        
        return message;
    }
    
    // ============================================
    // 5. تشخیص الگوهای رفتاری
    // ============================================
    detectPatterns(studentId) {
        console.log('🎯 Detecting patterns for student:', studentId);
        
        const evals = this.data.evaluations[studentId] || {};
        const months = Object.keys(evals);
        
        if (months.length < 3) {
            return {
                hasData: false,
                message: 'برای تشخیص الگو به حداقل ۳ ماه داده نیاز داریم'
            };
        }
        
        const patterns = [];
        const ratings = months.map(m => evals[m]?.rating || 0);
        const firstRating = ratings[0];
        const lastRating = ratings[ratings.length - 1];
        
        // الگوی بهبود
        if (lastRating > firstRating + 1) {
            patterns.push({
                type: 'improving',
                name: '📈 الگوی بهبود',
                description: 'امتیاز در طول زمان افزایش یافته است'
            });
        }
        
        // الگوی کاهش
        if (lastRating < firstRating - 1) {
            patterns.push({
                type: 'declining',
                name: '📉 الگوی کاهش',
                description: 'امتیاز در طول زمان کاهش یافته است'
            });
        }
        
        // الگوی نوسانی
        let oscillations = 0;
        for (let i = 1; i < ratings.length - 1; i++) {
            if ((ratings[i] > ratings[i-1] && ratings[i] > ratings[i+1]) ||
                (ratings[i] < ratings[i-1] && ratings[i] < ratings[i+1])) {
                oscillations++;
            }
        }
        if (oscillations > 1) {
            patterns.push({
                type: 'volatile',
                name: '🎢 الگوی نوسانی',
                description: 'امتیازات نوسان زیادی دارند'
            });
        }
        
        // الگوی ثابت
        const uniqueRatings = new Set(ratings);
        if (uniqueRatings.size <= 2 && ratings.length >= 4) {
            patterns.push({
                type: 'stable',
                name: '📊 الگوی ثابت',
                description: 'امتیازات تقریباً ثابت هستند'
            });
        }
        
        const result = {
            hasData: true,
            patterns: patterns,
            totalPatterns: patterns.length,
            message: patterns.length > 0 ? 
                `${patterns.length} الگوی رفتاری شناسایی شد` : 
                'الگوی خاصی شناسایی نشد'
        };
        
        console.log('✅ Patterns detected:', result);
        return result;
    }
    
    // ============================================
    // 6. خلاصه کلی برای یک دانش‌آموز
    // ============================================
    getStudentSummary(studentId) {
        console.log('📊 Getting summary for student:', studentId);
        
        const student = this.data.students.find(s => s.id === studentId);
        if (!student) {
            console.log('❌ Student not found');
            return null;
        }
        
        const goals = this.data.goals[studentId] || [];
        const evals = this.data.evaluations[studentId] || {};
        const notes = this.data.teacherNotes?.[studentId] || [];
        
        const suggestions = this.suggestGoals(studentId);
        const progress = this.predictProgress(studentId);
        const analysis = this.analyzeEvaluations(studentId);
        const patterns = this.detectPatterns(studentId);
        
        // محاسبه امتیاز کلی
        let totalScore = 0;
        if (analysis.hasData) {
            totalScore += (analysis.avgRating / 5) * 4;
        }
        totalScore += Math.min(goals.length * 0.5, 3);
        totalScore += Math.min(Object.keys(evals).length * 0.3, 2);
        totalScore = Math.round(totalScore * 10) / 10;
        
        const result = {
            student: student,
            totalScore: totalScore,
            goalsCount: goals.length,
            evaluationsCount: Object.keys(evals).length,
            notesCount: notes.length,
            suggestions: suggestions,
            progress: progress,
            analysis: analysis,
            patterns: patterns,
            summary: this.generateSummary(totalScore, goals.length, Object.keys(evals).length, analysis)
        };
        
        console.log('✅ Student summary generated:', result);
        return result;
    }
    
    generateSummary(score, goals, evals, analysis) {
        let summary = '';
        
        if (score >= 8) {
            summary = '🌟 دانش‌آموز فوق‌العاده! عملکرد عالی در همه زمینه‌ها.';
        } else if (score >= 6) {
            summary = '📊 دانش‌آموز خوب است، اما جای پیشرفت دارد.';
        } else if (score >= 4) {
            summary = '⚠️ دانش‌آموز نیاز به حمایت و تشویق بیشتر دارد.';
        } else {
            summary = '🔴 دانش‌آموز نیاز به مداخله فوری و توجه ویژه دارد.';
        }
        
        if (goals === 0) {
            summary += ' 🎯 ثبت اهداف جدید توصیه می‌شود.';
        }
        
        if (evals === 0) {
            summary += ' 📝 خودارزیابی ماهانه را شروع کند.';
        }
        
        if (analysis.hasData && analysis.avgRating < 3) {
            summary += ' 💪 نیاز به تقویت انگیزه و اعتماد به نفس.';
        }
        
        return summary;
    }
}

// Export to global scope
window.AIAnalytics = AIAnalytics;

console.log('🤖 سیستم تحلیل هوشمند بارگذاری شد!');