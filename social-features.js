// social-features.js - امکانات اجتماعی

class SocialFeatures {
    constructor() {
        this.STORAGE_KEY = 'portfolio_social_data';
        this.data = this.loadData();
        this.initializeSampleData();
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading social data:', error);
        }
        return {
            leaderboard: [],
            messages: [],
            resources: [],
            comments: [],
            reactions: {},
            achievements: []
        };
    }
    
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving social data:', error);
        }
    }
    
    initializeSampleData() {
        if (this.data.resources.length === 0) {
            this.data.resources = [
                {
                    id: 'res_1',
                    title: 'آموزش جدول ضرب با انیمیشن',
                    type: 'video',
                    category: 'ریاضی',
                    url: 'https://www.aparat.com/v/example1',
                    thumbnail: '📹',
                    description: 'آموزش تصویری و جذاب جدول ضرب با انیمیشن‌های رنگی',
                    views: 156,
                    likes: 45,
                    createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString()
                },
                {
                    id: 'res_2',
                    title: 'کتاب داستان های علمی برای کودکان',
                    type: 'book',
                    category: 'علوم',
                    url: '#',
                    thumbnail: '📖',
                    description: 'مجموعه داستان‌های علمی جذاب برای دانش‌آموزان دوره ابتدایی',
                    views: 89,
                    likes: 23,
                    createdAt: new Date(Date.now() - 10*24*60*60*1000).toISOString()
                },
                {
                    id: 'res_3',
                    title: 'تمرینات تعاملی ریاضی',
                    type: 'exercise',
                    category: 'ریاضی',
                    url: '#',
                    thumbnail: '🧮',
                    description: '۳۰ تمرین تعاملی ریاضی با پاسخنامه تشریحی',
                    views: 234,
                    likes: 67,
                    createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString()
                },
                {
                    id: 'res_4',
                    title: 'نقاشی و خلاقیت برای کودکان',
                    type: 'video',
                    category: 'هنر',
                    url: 'https://www.aparat.com/v/example2',
                    thumbnail: '🎨',
                    description: 'آموزش نقاشی با تکنیک‌های ساده و خلاقانه',
                    views: 78,
                    likes: 34,
                    createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString()
                },
                {
                    id: 'res_5',
                    title: 'کتاب مهارت‌های زندگی',
                    type: 'book',
                    category: 'مهارت‌های زندگی',
                    url: '#',
                    thumbnail: '📚',
                    description: 'آموزش مهارت‌های اجتماعی و زندگی به زبان ساده',
                    views: 112,
                    likes: 41,
                    createdAt: new Date(Date.now() - 15*24*60*60*1000).toISOString()
                }
            ];
            this.saveData();
        }
        
        // Add sample comments if empty
        if (this.data.comments.length === 0) {
            this.data.comments = [
                {
                    id: 'cmt_1',
                    resourceId: 'res_1',
                    studentName: 'علی رضایی',
                    text: 'این ویدیو خیلی عالی بود! جدول ضرب رو کامل یاد گرفتم 🎉',
                    createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
                    likes: 5
                },
                {
                    id: 'cmt_2',
                    resourceId: 'res_3',
                    studentName: 'مریم احمدی',
                    text: 'تمرینات خیلی مفید بودن. ممنون از شما 🙏',
                    createdAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
                    likes: 3
                }
            ];
            this.saveData();
        }
    }
    
    // ============================================
    // LEADERBOARD
    // ============================================
    getLeaderboard(limit = 10) {
        const students = this.getStudentsFromDB();
        const leaderboard = students.map(student => {
            const points = this.getStudentPoints(student.id);
            const badges = this.getStudentBadges(student.id);
            const goals = this.getStudentGoals(student.id);
            const evals = this.getStudentEvaluations(student.id);
            
            return {
                id: student.id,
                name: student.name,
                grade: student.grade,
                points: points,
                badges: badges.length,
                goals: goals.length,
                evaluations: Object.keys(evals).length,
                level: this.calculateLevel(points),
                avatar: student.name.charAt(0)
            };
        });
        
        // Sort by points (descending)
        leaderboard.sort((a, b) => b.points - a.points);
        
        // Add rank
        leaderboard.forEach((item, index) => {
            item.rank = index + 1;
            item.medal = this.getMedal(index);
        });
        
        return leaderboard.slice(0, limit);
    }
    
    getMedal(index) {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return null;
    }
    
    calculateLevel(points) {
        if (points >= 1000) return { level: 10, title: 'افسانه‌ای', icon: '👑' };
        if (points >= 800) return { level: 9, title: 'قهرمان', icon: '🦸' };
        if (points >= 600) return { level: 8, title: 'استاد', icon: '🎓' };
        if (points >= 500) return { level: 7, title: 'پیشرفته', icon: '⭐' };
        if (points >= 400) return { level: 6, title: 'متوسط رو به بالا', icon: '📈' };
        if (points >= 300) return { level: 5, title: 'متوسط', icon: '📊' };
        if (points >= 200) return { level: 4, title: 'در حال رشد', icon: '🌱' };
        if (points >= 100) return { level: 3, title: 'تازه‌کار', icon: '🌟' };
        if (points >= 50) return { level: 2, title: 'شروع کننده', icon: '🚀' };
        return { level: 1, title: 'مبتدی', icon: '👶' };
    }
    
    // Helper methods to get data from main DB
    getStudentsFromDB() {
        try {
            const data = localStorage.getItem('portfolio_database_v1');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.students || [];
            }
        } catch (error) {
            console.error('Error getting students:', error);
        }
        return [];
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
    
    getStudentBadges(studentId) {
        try {
            const data = localStorage.getItem('portfolio_database_v1');
            if (data) {
                const parsed = JSON.parse(data);
                const rewards = parsed.rewards && parsed.rewards[studentId];
                return rewards ? rewards.badges || [] : [];
            }
        } catch (error) {
            console.error('Error getting badges:', error);
        }
        return [];
    }
    
    getStudentGoals(studentId) {
        try {
            const data = localStorage.getItem('portfolio_database_v1');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.goals && parsed.goals[studentId] ? parsed.goals[studentId] : [];
            }
        } catch (error) {
            console.error('Error getting goals:', error);
        }
        return [];
    }
    
    getStudentEvaluations(studentId) {
        try {
            const data = localStorage.getItem('portfolio_database_v1');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.evaluations && parsed.evaluations[studentId] ? parsed.evaluations[studentId] : {};
            }
        } catch (error) {
            console.error('Error getting evaluations:', error);
        }
        return {};
    }
    
    // ============================================
    // MESSAGES
    // ============================================
    sendMessage(from, to, text, type = 'direct') {
        const message = {
            id: 'msg_' + Date.now(),
            from: from,
            to: to,
            text: text,
            type: type, // 'direct', 'group', 'broadcast'
            read: false,
            createdAt: new Date().toISOString(),
            replies: []
        };
        
        this.data.messages.push(message);
        this.saveData();
        return message;
    }
    
    getMessages(studentId, limit = 50) {
        const messages = this.data.messages.filter(m => 
            m.from === studentId || m.to === studentId || m.to === 'all'
        );
        messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return messages.slice(0, limit);
    }
    
    getUnreadMessages(studentId) {
        return this.data.messages.filter(m => 
            m.to === studentId && !m.read
        );
    }
    
    markMessageAsRead(messageId) {
        const message = this.data.messages.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            this.saveData();
            return true;
        }
        return false;
    }
    
    replyToMessage(messageId, from, text) {
        const message = this.data.messages.find(m => m.id === messageId);
        if (message) {
            const reply = {
                id: 'reply_' + Date.now(),
                from: from,
                text: text,
                createdAt: new Date().toISOString()
            };
            message.replies.push(reply);
            this.saveData();
            return reply;
        }
        return null;
    }
    
    // ============================================
    // RESOURCES
    // ============================================
    getResources(category = null, type = null) {
        let resources = this.data.resources;
        
        if (category) {
            resources = resources.filter(r => r.category === category);
        }
        
        if (type) {
            resources = resources.filter(r => r.type === type);
        }
        
        // Sort by views (popular)
        resources.sort((a, b) => b.views - a.views);
        return resources;
    }
    
    getResourceById(resourceId) {
        return this.data.resources.find(r => r.id === resourceId);
    }
    
    addResource(resource) {
        resource.id = 'res_' + Date.now();
        resource.createdAt = new Date().toISOString();
        resource.views = 0;
        resource.likes = 0;
        this.data.resources.push(resource);
        this.saveData();
        return resource;
    }
    
    incrementViews(resourceId) {
        const resource = this.data.resources.find(r => r.id === resourceId);
        if (resource) {
            resource.views++;
            this.saveData();
        }
    }
    
    likeResource(resourceId) {
        const resource = this.data.resources.find(r => r.id === resourceId);
        if (resource) {
            resource.likes++;
            this.saveData();
            return resource.likes;
        }
        return 0;
    }
    
    // ============================================
    // COMMENTS
    // ============================================
    addComment(resourceId, studentName, text) {
        const comment = {
            id: 'cmt_' + Date.now(),
            resourceId: resourceId,
            studentName: studentName,
            text: text,
            createdAt: new Date().toISOString(),
            likes: 0
        };
        
        this.data.comments.push(comment);
        this.saveData();
        return comment;
    }
    
    getComments(resourceId) {
        const comments = this.data.comments.filter(c => c.resourceId === resourceId);
        comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return comments;
    }
    
    likeComment(commentId) {
        const comment = this.data.comments.find(c => c.id === commentId);
        if (comment) {
            comment.likes++;
            this.saveData();
            return comment.likes;
        }
        return 0;
    }
    
    // ============================================
    // ACHIEVEMENTS
    // ============================================
    getStudentAchievements(studentId) {
        const achievements = [];
        const points = this.getStudentPoints(studentId);
        const badges = this.getStudentBadges(studentId);
        const goals = this.getStudentGoals(studentId);
        const evals = this.getStudentEvaluations(studentId);
        
        // Level achievement
        const level = this.calculateLevel(points);
        if (level.level >= 5) {
            achievements.push({
                type: 'level',
                title: `سطح ${level.level} - ${level.title}`,
                description: `به سطح ${level.level} رسیدی!`,
                icon: level.icon,
                earned: true
            });
        }
        
        // Badge achievements
        if (badges.length >= 5) {
            achievements.push({
                type: 'badge_collector',
                title: 'جمع‌آوری کننده نشان‌ها',
                description: '۵ نشان مختلف جمع‌آوری کردی!',
                icon: '🏅',
                earned: true
            });
        }
        
        // Goal achievements
        if (goals.length >= 3) {
            achievements.push({
                type: 'goal_setter',
                title: 'هدف‌گذار حرفه‌ای',
                description: '۳ هدف SMART ثبت کردی!',
                icon: '🎯',
                earned: true
            });
        }
        
        // Evaluation achievements
        if (Object.keys(evals).length >= 3) {
            achievements.push({
                type: 'evaluator',
                title: 'ارزیاب ماهر',
                description: '۳ خودارزیابی ماهانه ثبت کردی!',
                icon: '✍️',
                earned: true
            });
        }
        
        return achievements;
    }
}

// Export to global scope
window.SocialFeatures = SocialFeatures;

console.log('👥 امکانات اجتماعی بارگذاری شد!');