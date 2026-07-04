// reward-system-v2.js - سیستم پاداش پیشرفته کامل

class RewardSystemV2 {
    constructor() {
        this.STORAGE_KEY = 'portfolio_rewards_v2';
        this.data = this.loadData();
        this.activities = this.defineActivities();
        this.initializeDefaultRewards();
    }
    
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading reward data:', error);
        }
        return {
            students: {},
            shopItems: [],
            pendingApprovals: [],
            approvedActivities: []
        };
    }
    
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving reward data:', error);
        }
    }
    
    // ============================================
    // تعریف فعالیت‌ها
    // ============================================
    defineActivities() {
        return {
            automatic: [
                { id: 'auto_portfolio', name: 'تکمیل پوشه کار', points: 100, maxCount: 1, description: 'ثبت کامل پوشه کار' },
                { id: 'auto_goal', name: 'ثبت هدف SMART', points: 20, maxCount: 9, description: 'ثبت یک هدف جدید' },
                { id: 'auto_goal_complete', name: 'تکمیل هدف', points: 50, maxCount: 9, description: 'تکمیل یک هدف' },
                { id: 'auto_evaluation', name: 'ثبت خودارزیابی', points: 30, maxCount: 9, description: 'ثبت خودارزیابی ماهانه' },
                { id: 'auto_badge', name: 'کسب نشان', points: 50, maxCount: 10, description: 'کسب یک نشان جدید' }
            ],
            
            levelRewards: [
                { from: 'مبتدی', to: 'شروع کننده', points: 10 },
                { from: 'شروع کننده', to: 'تازه‌کار', points: 20 },
                { from: 'تازه‌کار', to: 'در حال رشد', points: 30 },
                { from: 'در حال رشد', to: 'متوسط', points: 40 },
                { from: 'متوسط', to: 'متوسط رو به بالا', points: 50 },
                { from: 'متوسط رو به بالا', to: 'پیشرفته', points: 80 },
                { from: 'پیشرفته', to: 'استاد', points: 120 },
                { from: 'استاد', to: 'قهرمان', points: 180 },
                { from: 'قهرمان', to: 'افسانه‌ای', points: 300 }
            ],
            
            teacher: [
                { id: 'teacher_participation', name: 'مشارکت در کلاس', points: 50, maxPoints: 100, description: 'مشارکت فعال در کلاس' },
                { id: 'teacher_behavior', name: 'رفتار خوب', points: 50, maxPoints: 100, description: 'رفتار مناسب در کلاس' },
                { id: 'teacher_progress', name: 'پیشرفت ویژه', points: 100, maxPoints: 150, description: 'پیشرفت قابل توجه' },
                { id: 'teacher_project', name: 'پروژه ویژه', points: 150, maxPoints: 200, description: 'انجام پروژه ویژه' },
                { id: 'teacher_extra', name: 'فعالیت فوق‌برنامه', points: 100, maxPoints: 150, description: 'شرکت در فعالیت فوق‌برنامه' },
                { id: 'teacher_group', name: 'کار گروهی', points: 50, maxPoints: 100, description: 'همکاری در کار گروهی' },
                { id: 'teacher_help', name: 'کمک به دیگران', points: 50, maxPoints: 100, description: 'کمک به همکلاسی‌ها' }
            ],
            
            parent: [
                { id: 'parent_homework', name: 'انجام تکالیف', points: 50, maxPoints: 100, description: 'انجام منظم تکالیف' },
                { id: 'parent_chores', name: 'وظایف خانه', points: 50, maxPoints: 100, description: 'کمک در کارهای خانه' },
                { id: 'parent_behavior', name: 'رفتار خوب در خانه', points: 50, maxPoints: 100, description: 'رفتار مناسب در خانه' },
                { id: 'parent_reading', name: 'مطالعه در خانه', points: 50, maxPoints: 100, description: 'مطالعه و کتاب‌خوانی' }
            ]
        };
    }
    
    // ============================================
    // امتیازات سطوح
    // ============================================
    getLevelReward(level) {
        const levelNames = {
            1: 'مبتدی',
            2: 'شروع کننده',
            3: 'تازه‌کار',
            4: 'در حال رشد',
            5: 'متوسط',
            6: 'متوسط رو به بالا',
            7: 'پیشرفته',
            8: 'استاد',
            9: 'قهرمان',
            10: 'افسانه‌ای'
        };
        
        const currentLevelName = levelNames[level] || 'مبتدی';
        const nextLevelName = levelNames[level + 1];
        
        if (!nextLevelName) return null;
        
        const reward = this.activities.levelRewards.find(
            r => r.from === currentLevelName && r.to === nextLevelName
        );
        
        return reward || null;
    }
    
    // ============================================
    // محاسبه سطح
    // ============================================
    calculateLevel(points) {
        if (points >= 1000) return 10;
        if (points >= 800) return 9;
        if (points >= 600) return 8;
        if (points >= 500) return 7;
        if (points >= 400) return 6;
        if (points >= 300) return 5;
        if (points >= 200) return 4;
        if (points >= 100) return 3;
        if (points >= 50) return 2;
        return 1;
    }
    
    // ============================================
    // دریافت اطلاعات دانش‌آموز
    // ============================================
    getStudentData(studentId) {
        if (!this.data.students[studentId]) {
            this.data.students[studentId] = {
                points: 0,
                badges: [],
                activities: [],
                level: 1,
                levelRewards: [], // امتیازات دریافت شده از سطوح
                pendingRewards: [],
                approvedRewards: [],
                totalEarned: 0,
                redeemedItems: [] // جوایز دریافت شده
            };
            this.saveData();
        }
        return this.data.students[studentId];
    }
    
    // ============================================
    // 1. افزودن فعالیت خودکار (سیستم)
    // ============================================
    addAutomaticReward(studentId, activityId, metadata = {}) {
        const activity = this.activities.automatic.find(a => a.id === activityId);
        if (!activity) return { success: false, message: 'فعالیت یافت نشد' };
        
        const student = this.getStudentData(studentId);
        
        // بررسی محدودیت تعداد
        const existingCount = student.activities.filter(a => a.activityId === activityId).length;
        if (activity.maxCount && existingCount >= activity.maxCount) {
            return { success: false, message: `حداکثر ${activity.maxCount} بار می‌توانید این فعالیت را انجام دهید` };
        }
        
        const reward = {
            id: 'reward_' + Date.now(),
            studentId: studentId,
            activityId: activityId,
            activityName: activity.name,
            points: activity.points,
            description: activity.description,
            type: 'automatic',
            status: 'approved',
            approvedBy: 'system',
            timestamp: new Date().toISOString(),
            metadata: metadata
        };
        
        // اعمال امتیاز
        const oldLevel = student.level;
        student.points += activity.points;
        student.totalEarned += activity.points;
        student.activities.push(reward);
        student.approvedRewards.push(reward);
        
        // بررسی سطح و امتیاز سطح
        const newLevel = this.calculateLevel(student.points);
        if (newLevel > oldLevel) {
            const levelReward = this.getLevelReward(oldLevel);
            if (levelReward) {
                student.points += levelReward.points;
                student.totalEarned += levelReward.points;
                student.levelRewards.push({
                    from: levelReward.from,
                    to: levelReward.to,
                    points: levelReward.points,
                    timestamp: new Date().toISOString()
                });
                student.level = newLevel;
            }
        }
        
        // بررسی نشان‌ها
        const newBadges = this.checkBadges(studentId);
        student.badges = [...student.badges, ...newBadges];
        
        this.saveData();
        
        return {
            success: true,
            message: `${activity.points} امتیاز به ${activity.name} اضافه شد`,
            reward: reward,
            newBadges: newBadges,
            newLevel: student.level,
            totalPoints: student.points
        };
    }
    
    // ============================================
    // 2. بررسی نشان‌ها
    // ============================================
    checkBadges(studentId) {
        const student = this.getStudentData(studentId);
        const newBadges = [];
        const existingBadges = student.badges || [];
        
        // لیست نشان‌ها با شرایط
        const badgeList = [
            { id: 'first_goal', name: 'اولین هدف', icon: '🎯', condition: () => 
                student.activities.filter(a => a.activityId === 'auto_goal').length >= 1 },
            { id: 'goal_master', name: 'استاد اهداف', icon: '🏆', condition: () => 
                student.activities.filter(a => a.activityId === 'auto_goal').length >= 5 },
            { id: 'first_evaluation', name: 'اولین خودارزیابی', icon: '✍️', condition: () => 
                student.activities.filter(a => a.activityId === 'auto_evaluation').length >= 1 },
            { id: 'consistent', name: 'پیگیر', icon: '📅', condition: () => 
                student.activities.filter(a => a.activityId === 'auto_evaluation').length >= 3 },
            { id: 'perfect_month', name: 'ماه کامل', icon: '⭐', condition: () => 
                student.approvedRewards.some(a => a.points >= 50) },
            { id: 'proud_student', name: 'دانش‌آموز افتخارآفرین', icon: '🌟', condition: () => 
                student.activities.length >= 10 },
            { id: 'portfolio_complete', name: 'پوشه کار کامل', icon: '🎒', condition: () => 
                student.activities.some(a => a.activityId === 'auto_portfolio') },
            { id: 'letter_writer', name: 'نامه‌نویس', icon: '💌', condition: () => 
                student.activities.some(a => a.activityId === 'auto_letter') },
            { id: 'challenge_overcomer', name: 'غلبه بر چالش', icon: '💪', condition: () => 
                student.activities.some(a => a.activityId === 'auto_challenge') },
            { id: 'goal_setter', name: 'هدف‌گذار ماه بعد', icon: '🎯', condition: () => 
                student.activities.some(a => a.activityId === 'auto_goal') }
        ];
        
        badgeList.forEach(badge => {
            if (!existingBadges.includes(badge.id) && badge.condition()) {
                newBadges.push(badge.id);
                // امتیاز نشان
                student.points += 50;
                student.totalEarned += 50;
                student.activities.push({
                    id: 'badge_' + Date.now(),
                    studentId: studentId,
                    activityId: 'auto_badge',
                    activityName: badge.name,
                    points: 50,
                    description: `کسب نشان ${badge.name}`,
                    type: 'automatic',
                    status: 'approved',
                    approvedBy: 'system',
                    timestamp: new Date().toISOString(),
                    metadata: { badge: badge }
                });
            }
        });
        
        this.saveData();
        return newBadges;
    }
    
    // ============================================
    // 3. تایید فعالیت (معلم/والدین/مدیر)
    // ============================================
    requestApproval(studentId, activityId, requestedBy, points = null, note = '') {
        const role = this.getUserRole(requestedBy);
        let activity = null;
        let maxPoints = 0;
        let roleType = '';
        
        if (role === 'teacher') {
            activity = this.activities.teacher.find(a => a.id === activityId);
            if (activity) {
                maxPoints = activity.maxPoints || activity.points;
                roleType = 'teacher';
            }
        } else if (role === 'parent') {
            activity = this.activities.parent.find(a => a.id === activityId);
            if (activity) {
                maxPoints = activity.maxPoints || activity.points;
                roleType = 'parent';
            }
        }
        
        if (!activity) {
            return { success: false, message: 'فعالیت یافت نشد یا دسترسی ندارید' };
        }
        
        // محدودیت امتیاز
        if ((role === 'parent' || role === 'admin') && points > 150) {
            return { success: false, message: 'حداکثر امتیاز برای این نقش ۱۵۰ است' };
        }
        if (role === 'teacher' && points > 2000) {
            return { success: false, message: 'حداکثر امتیاز برای معلم ۲۰۰۰ است' };
        }
        
        const finalPoints = points || activity.points;
        if (finalPoints > maxPoints) {
            return { success: false, message: `حداکثر امتیاز برای این فعالیت ${maxPoints} است` };
        }
        
        // نیاز به تایید مدیر برای امتیاز بالای ۱۰۰
        const needsAdminApproval = finalPoints > 100;
        
        const reward = {
            id: 'reward_' + Date.now(),
            studentId: studentId,
            activityId: activityId,
            activityName: activity.name,
            points: finalPoints,
            description: activity.description,
            note: note,
            type: 'manual',
            status: needsAdminApproval ? 'pending_admin' : 'pending_parent',
            requestedBy: requestedBy,
            requestedRole: role,
            needsAdminApproval: needsAdminApproval,
            timestamp: new Date().toISOString(),
            parentApproved: false,
            adminApproved: false,
            approvedBy: null,
            approvedAt: null
        };
        
        this.data.pendingApprovals.push(reward);
        this.saveData();
        
        return {
            success: true,
            message: `درخواست امتیاز ثبت شد و در انتظار تایید ${needsAdminApproval ? 'مدیر' : 'والدین'}`,
            reward: reward
        };
    }
    
    // ============================================
    // 4. تایید توسط والدین
    // ============================================
    approveByParent(rewardId) {
        const pending = this.data.pendingApprovals.find(r => r.id === rewardId);
        if (!pending) return { success: false, message: 'درخواست یافت نشد' };
        if (pending.status !== 'pending_parent') {
            return { success: false, message: 'این درخواست در وضعیت تایید والدین نیست' };
        }
        if (pending.points > 150) {
            return { success: false, message: 'امتیاز بیش از ۱۵۰ نیاز به تایید مدیر دارد' };
        }
        
        pending.status = 'approved';
        pending.parentApproved = true;
        pending.approvedAt = new Date().toISOString();
        pending.approvedBy = 'parent';
        
        const student = this.getStudentData(pending.studentId);
        student.points += pending.points;
        student.totalEarned += pending.points;
        student.activities.push({ ...pending, status: 'approved' });
        student.approvedRewards.push({ ...pending, status: 'approved' });
        student.level = this.calculateLevel(student.points);
        
        this.data.pendingApprovals = this.data.pendingApprovals.filter(r => r.id !== rewardId);
        this.saveData();
        
        return {
            success: true,
            message: `${pending.points} امتیاز توسط والدین تایید شد`,
            totalPoints: student.points,
            newLevel: student.level
        };
    }
    
    // ============================================
    // 5. تایید توسط مدیر
    // ============================================
    approveByAdmin(rewardId) {
        const pending = this.data.pendingApprovals.find(r => r.id === rewardId);
        if (!pending) return { success: false, message: 'درخواست یافت نشد' };
        if (pending.status !== 'pending_admin') {
            return { success: false, message: 'این درخواست در وضعیت تایید مدیر نیست' };
        }
        
        pending.status = 'approved';
        pending.adminApproved = true;
        pending.approvedAt = new Date().toISOString();
        pending.approvedBy = 'admin';
        
        const student = this.getStudentData(pending.studentId);
        student.points += pending.points;
        student.totalEarned += pending.points;
        student.activities.push({ ...pending, status: 'approved' });
        student.approvedRewards.push({ ...pending, status: 'approved' });
        student.level = this.calculateLevel(student.points);
        
        this.data.pendingApprovals = this.data.pendingApprovals.filter(r => r.id !== rewardId);
        this.saveData();
        
        return {
            success: true,
            message: `${pending.points} امتیاز توسط مدیر تایید شد`,
            totalPoints: student.points,
            newLevel: student.level
        };
    }
    
    // ============================================
    // 6. ویترین جوایز
    // ============================================
    initializeDefaultRewards() {
        if (this.data.shopItems.length === 0) {
            this.data.shopItems = [
                {
                    id: 'gift_1',
                    title: '🎁 هدیه تشویقی کوچک',
                    description: 'یک هدیه کوچک برای تشویق شما',
                    points: 50,
                    stock: 10,
                    category: 'small',
                    image: '🎁',
                    addedBy: 'system',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'gift_2',
                    title: '🎈 هدیه ویژه متوسط',
                    description: 'هدیه‌ای ارزشمند برای تلاش شما',
                    points: 100,
                    stock: 5,
                    category: 'medium',
                    image: '🎈',
                    addedBy: 'system',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'gift_3',
                    title: '🏆 جایزه بزرگ',
                    description: 'جایزه ویژه برای دانش‌آموزان برتر',
                    points: 200,
                    stock: 3,
                    category: 'big',
                    image: '🏆',
                    addedBy: 'system',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'gift_4',
                    title: '👑 جایزه ویژه افسانه‌ای',
                    description: 'ویژه دانش‌آموزان افسانه‌ای',
                    points: 500,
                    stock: 1,
                    category: 'legendary',
                    image: '👑',
                    addedBy: 'system',
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveData();
        }
    }
    
    // ============================================
    // 7. افزودن جایزه به ویترین (فقط معلم و مدیر)
    // ============================================
    addShopItem(title, description, points, stock, category, image, addedBy) {
        const role = this.getUserRole(addedBy);
        if (!['teacher', 'admin'].includes(role)) {
            return { success: false, message: 'فقط معلم و مدیر می‌توانند جوایز اضافه کنند' };
        }
        
        if (points < 10 || points > 1000) {
            return { success: false, message: 'امتیاز باید بین ۱۰ تا ۱۰۰۰ باشد' };
        }
        
        const item = {
            id: 'shop_' + Date.now(),
            title: title,
            description: description,
            points: points,
            stock: stock || 10,
            category: category || 'general',
            image: image || '🎁',
            addedBy: addedBy,
            addedRole: role,
            createdAt: new Date().toISOString(),
            redeemed: 0
        };
        
        this.data.shopItems.push(item);
        this.saveData();
        
        return {
            success: true,
            message: `جایزه "${title}" با موفقیت اضافه شد`,
            item: item
        };
    }
    
    // ============================================
    // 8. دریافت جایزه توسط دانش‌آموز
    // ============================================
    redeemItem(studentId, itemId) {
        const item = this.data.shopItems.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'جایزه یافت نشد' };
        if (item.stock <= 0) return { success: false, message: 'موجودی این جایزه تمام شده است' };
        
        const student = this.getStudentData(studentId);
        if (student.points < item.points) {
            return { success: false, message: `امتیاز کافی نیست. نیاز به ${item.points} امتیاز دارید` };
        }
        
        // کسر امتیاز
        student.points -= item.points;
        if (!student.redeemedItems) student.redeemedItems = [];
        student.redeemedItems.push({
            itemId: item.id,
            itemTitle: item.title,
            pointsCost: item.points,
            redeemedAt: new Date().toISOString()
        });
        
        // کاهش موجودی
        item.stock--;
        item.redeemed = (item.redeemed || 0) + 1;
        
        this.saveData();
        
        return {
            success: true,
            message: `جایزه "${item.title}" با موفقیت دریافت شد`,
            remainingPoints: student.points
        };
    }
    
    // ============================================
    // 9. دریافت تاریخچه امتیازات دانش‌آموز
    // ============================================
    getStudentRewardHistory(studentId) {
        const student = this.getStudentData(studentId);
        return {
            totalPoints: student.points,
            totalEarned: student.totalEarned,
            level: student.level,
            badges: student.badges || [],
            activities: student.activities || [],
            levelRewards: student.levelRewards || [],
            redeemedItems: student.redeemedItems || [],
            pendingRewards: this.data.pendingApprovals.filter(r => r.studentId === studentId)
        };
    }
    
    // ============================================
    // 10. دریافت لیست جوایز ویترین
    // ============================================
    getShopItems() {
        return this.data.shopItems.sort((a, b) => a.points - b.points);
    }
    
    // ============================================
    // 11. دریافت لیست تاییدهای در انتظار
    // ============================================
    getPendingApprovals(role = null) {
        if (role) {
            return this.data.pendingApprovals.filter(r => r.requestedRole === role);
        }
        return this.data.pendingApprovals;
    }
    
    // ============================================
    // 12. حذف جایزه از ویترین (فقط معلم و مدیر)
    // ============================================
    removeShopItem(itemId, requestedBy) {
        const role = this.getUserRole(requestedBy);
        if (!['teacher', 'admin'].includes(role)) {
            return { success: false, message: 'فقط معلم و مدیر می‌توانند جوایز را حذف کنند' };
        }
        
        const item = this.data.shopItems.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'جایزه یافت نشد' };
        
        this.data.shopItems = this.data.shopItems.filter(i => i.id !== itemId);
        this.saveData();
        
        return { success: true, message: `جایزه "${item.title}" با موفقیت حذف شد` };
    }
    
    // ============================================
    // 13. دریافت امتیازات تایید نشده (برای مدیر/معلم)
    // ============================================
    getPendingRewards(role = null) {
        let pending = this.data.pendingApprovals;
        if (role === 'admin') {
            pending = pending.filter(r => r.needsAdminApproval);
        } else if (role === 'parent') {
            pending = pending.filter(r => !r.needsAdminApproval && r.status === 'pending_parent');
        }
        return pending;
    }
    
    // ============================================
    // Helper: تشخیص نقش کاربر
    // ============================================
    getUserRole(userId) {
        try {
            // بررسی مدیر
            const adminSession = sessionStorage.getItem('admin_session');
            if (adminSession) {
                const session = JSON.parse(adminSession);
                if (session.username === userId || userId === 'admin') {
                    return 'admin';
                }
            }
            
            // بررسی معلم
            const teacherSession = sessionStorage.getItem('teacher_session');
            if (teacherSession) {
                const session = JSON.parse(teacherSession);
                if (session.username === userId || userId === 'teacher') {
                    return 'teacher';
                }
            }
            
            // بررسی والدین
            const parentSession = localStorage.getItem('parent_session');
            if (parentSession) {
                const session = JSON.parse(parentSession);
                if (session.parentName === userId || userId === 'parent') {
                    return 'parent';
                }
            }
            
            return 'unknown';
        } catch (error) {
            console.error('Error getting user role:', error);
            return 'unknown';
        }
    }
}

// Export to global scope
window.RewardSystemV2 = RewardSystemV2;

console.log('🏆 سیستم پاداش پیشرفته v2 بارگذاری شد!');