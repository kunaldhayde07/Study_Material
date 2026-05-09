// ===================================
// APPLICATION STATE
// ===================================

const AppState = {
    currentSection: 'goals',
    theme: 'light',
    profile: {
        name: 'Your Name',
        avatar: '👤',
        mantra: 'Make today amazing!',
        accentColor: 'indigo',
        achievements: []
    },
    goals: [],
    habits: [],
    expenses: [],
    notes: [],
    timer: {
        mode: 'study',
        timeRemaining: 25 * 60,
        isRunning: false,
        interval: null,
        sessionsToday: 0,
        focusTimeToday: 0,
        studyDuration: 25,
        breakDuration: 5
    },
    goalFilter: 'all',
    editingNoteId: null
};

// ===================================
// STORAGE SERVICE
// ===================================

const Storage = {
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date = new Date()) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    },

    getTimeString() {
        return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },

    getDateString(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    isToday(dateString) {
        return dateString === this.getDateString();
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

// ===================================
// THEME MANAGEMENT
// ===================================

const ThemeManager = {
    init() {
        const savedTheme = Storage.load('theme', 'light');
        this.setTheme(savedTheme);

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    },

    setTheme(theme) {
        AppState.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        const icon = document.querySelector('.theme-icon');
        icon.textContent = theme === 'light' ? '🌙' : '☀️';
        Storage.save('theme', theme);
    },

    toggleTheme() {
        const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
};

// ===================================
// NAVIGATION MANAGEMENT
// ===================================

const Navigation = {
    init() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.navigateTo(section);
            });
        });

        // Mobile sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar on mobile when clicking nav item
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
    },

    navigateTo(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update active section
        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`section-${section}`).classList.add('active');

        AppState.currentSection = section;

        // Refresh productivity score when navigating to it
        if (section === 'productivity') {
            ProductivityScore.calculateAndRender();
        }
    }
};

// ===================================
// HEADER MANAGEMENT
// ===================================

const Header = {
    init() {
        this.updateGreeting();
        this.updateDate();
        
        // Update every minute
        setInterval(() => {
            this.updateGreeting();
            this.updateDate();
        }, 60000);
    },

    updateGreeting() {
        document.getElementById('greetingText').textContent = Utils.getGreeting();
    },

    updateDate() {
        document.getElementById('currentDate').textContent = Utils.formatDate();
    }
};

// ===================================
// PROFILE MANAGEMENT
// ===================================

const Profile = {
    init() {
        this.loadProfile();
        this.bindEvents();
        this.render();
        this.updateStats();
    },

    loadProfile() {
        const savedProfile = Storage.load('profile');
        if (savedProfile) {
            AppState.profile = { ...AppState.profile, ...savedProfile };
        }
        this.applyAccentColor();
    },

    saveProfile() {
        Storage.save('profile', AppState.profile);
        this.applyAccentColor();
    },

    bindEvents() {
        const saveBtn = document.getElementById('saveProfileBtn');
        const nameInput = document.getElementById('profileNameInput');
        const mantraInput = document.getElementById('profileMantraInput');
        
        saveBtn.addEventListener('click', () => this.saveProfileData());
        
        nameInput.addEventListener('input', (e) => {
            AppState.profile.name = e.target.value;
            this.updateSidebarProfile();
        });
        
        mantraInput.addEventListener('input', (e) => {
            AppState.profile.mantra = e.target.value;
            this.updateSidebarProfile();
        });

        // Avatar selection
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const avatar = e.target.getAttribute('data-avatar');
                this.selectAvatar(avatar);
            });
        });

        // Color selection
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const color = e.target.getAttribute('data-color');
                this.selectAccentColor(color);
            });
        });
    },

    saveProfileData() {
        const nameInput = document.getElementById('profileNameInput');
        const mantraInput = document.getElementById('profileMantraInput');
        
        AppState.profile.name = nameInput.value.trim() || 'Your Name';
        AppState.profile.mantra = mantraInput.value.trim() || 'Make today amazing!';
        
        this.saveProfile();
        this.updateSidebarProfile();
        Utils.showToast('Profile saved successfully!', 'success');
    },

    selectAvatar(avatar) {
        AppState.profile.avatar = avatar;
        
        // Update UI
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-avatar') === avatar) {
                option.classList.add('active');
            }
        });
        
        document.getElementById('avatarPreview').textContent = avatar;
        document.getElementById('profileAvatar').textContent = avatar;
    },

    selectAccentColor(color) {
        AppState.profile.accentColor = color;
        
        // Update UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-color') === color) {
                option.classList.add('active');
            }
        });
        
        this.applyAccentColor();
    },

    applyAccentColor() {
        const colorMap = {
            'indigo': '#4f46e5',
            'blue': '#3b82f6',
            'purple': '#8b5cf6',
            'pink': '#ec4899',
            'green': '#10b981',
            'orange': '#f59e0b',
            'red': '#ef4444',
            'teal': '#14b8a6'
        };

        const color = colorMap[AppState.profile.accentColor] || '#4f46e5';
        document.documentElement.style.setProperty('--primary', color);
        
        // Calculate hover color (darken by 10%)
        const hoverColor = this.adjustColor(color, -20);
        document.documentElement.style.setProperty('--primary-hover', hoverColor);
    },

    adjustColor(color, amount) {
        let usePound = false;
        if (color[0] === "#") {
            color = color.slice(1);
            usePound = true;
        }
        const num = parseInt(color, 16);
        let r = (num >> 16) + amount;
        if (r > 255) r = 255;
        else if (r < 0) r = 0;
        let b = ((num >> 8) & 0x00FF) + amount;
        if (b > 255) b = 255;
        else if (b < 0) b = 0;
        let g = (num & 0x0000FF) + amount;
        if (g > 255) g = 255;
        else if (g < 0) g = 0;
        return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    },

    updateSidebarProfile() {
        document.getElementById('profileName').textContent = AppState.profile.name;
        document.getElementById('profileMantra').textContent = AppState.profile.mantra;
        document.getElementById('profileAvatar').textContent = AppState.profile.avatar;
    },

    calculateAchievements() {
        const achievements = [];
        
        // Goal achievements
        const totalGoals = AppState.goals.length;
        const completedGoals = AppState.goals.filter(g => g.completed).length;
        
        if (completedGoals >= 1) achievements.push({
            id: 'first_goal',
            title: 'First Step',
            desc: 'Complete your first goal',
            icon: '🎯', 
            unlocked: true
        });
        
        if (completedGoals >= 5) achievements.push({
            id: 'goal_master',
            title: 'Goal Master',
            desc: 'Complete 5 goals',
            icon: '🏆',
            unlocked: true
        });
        
        // Habit achievements
        const currentStreaks = AppState.habits.map(h => h.currentStreak);
        const maxStreak = Math.max(...currentStreaks, 0);
        
        if (maxStreak >= 3) achievements.push({
            id: 'habit_starter',
            title: 'Habit Starter',
            desc: 'Maintain a 3-day streak',
            icon: '🔥',
            unlocked: true
        });
        
        if (maxStreak >= 7) achievements.push({
            id: 'habit_champion',
            title: 'Habit Champion',
            desc: 'Maintain a 7-day streak',
            icon: '💪',
            unlocked: true
        });
        
        // Focus achievements
        const focusMinutes = AppState.timer.focusTimeToday;
        
        if (focusMinutes >= 30) achievements.push({
            id: 'focus_beginner',
            title: 'Focused Mind',
            desc: 'Focus for 30 minutes',
            icon: '⏱️',
            unlocked: true
        });
        
        if (focusMinutes >= 120) achievements.push({
            id: 'focus_master',
            title: 'Focus Master',
            desc: 'Focus for 2 hours',
            icon: '🧠',
            unlocked: true
        });
        
        // Productivity achievements
        const { totalScore } = ProductivityScore.calculateScore();
        
        if (totalScore >= 50) achievements.push({
            id: 'productive',
            title: 'Productive',
            desc: 'Reach 50 productivity score',
            icon: '📈',
            unlocked: true
        });
        
        if (totalScore >= 80) achievements.push({
            id: 'highly_productive',
            title: 'Highly Productive',
            desc: 'Reach 80 productivity score',
            icon: '🚀',
            unlocked: true
        });
        
        // Add locked achievements
        const allAchievements = [
            ...achievements,
            { id: 'goal_expert', title: 'Goal Expert', desc: 'Complete 20 goals', icon: '🌟', unlocked: false },
            { id: 'habit_legend', title: 'Habit Legend', desc: 'Maintain a 30-day streak', icon: '✨', unlocked: false },
            { id: 'focus_pro', title: 'Focus Pro', desc: 'Focus for 5 hours', icon: '🎯', unlocked: false },
            { id: 'perfect_day', title: 'Perfect Day', desc: 'Reach 100 productivity score', icon: '💯', unlocked: false }
        ];
        
        return allAchievements;
    },

    updateStats() {
        // Goals
        const completedGoals = AppState.goals.filter(g => g.completed).length;
        document.getElementById('profileGoalsCompleted').textContent = completedGoals;
        
        // Habit streak
        const currentStreaks = AppState.habits.map(h => h.currentStreak);
        const maxStreak = Math.max(...currentStreaks, 0);
        document.getElementById('profileHabitStreak').textContent = maxStreak;
        
        // Focus time
        document.getElementById('profileFocusTime').textContent = AppState.timer.focusTimeToday;
        
        // Productivity score
        const { totalScore } = ProductivityScore.calculateScore();
        document.getElementById('profileProductivity').textContent = totalScore;
    },

    render() {
        // Update form inputs
        document.getElementById('profileNameInput').value = AppState.profile.name;
        document.getElementById('profileMantraInput').value = AppState.profile.mantra;
        
        // Update avatar
        document.getElementById('avatarPreview').textContent = AppState.profile.avatar;
        document.getElementById('profileAvatar').textContent = AppState.profile.avatar;
        
        // Update avatar options
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-avatar') === AppState.profile.avatar) {
                option.classList.add('active');
            }
        });
        
        // Update color options
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-color') === AppState.profile.accentColor) {
                option.classList.add('active');
            }
        });
        
        // Update sidebar
        this.updateSidebarProfile();
        
        // Render achievements
        this.renderAchievements();
        
        // Update stats
        this.updateStats();
    },

    renderAchievements() {
        const achievements = this.calculateAchievements();
        const grid = document.getElementById('achievementsGrid');
        
        if (!grid) return;
        
        grid.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.unlocked ? '' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `).join('');
    }
};

// ===================================
// DAILY GOALS MODULE
// ===================================

const Goals = {
    init() {
        this.loadGoals();
        this.bindEvents();
        this.render();
    },

    loadGoals() {
        const savedGoals = Storage.load('goals', []);
        // Filter goals to only show today's goals
        const today = Utils.getDateString();
        AppState.goals = savedGoals.filter(goal => goal.date === today);
        
        // Clean up old goals from storage
        Storage.save('goals', AppState.goals);
    },

    saveGoals() {
        Storage.save('goals', AppState.goals);
    },

    bindEvents() {
        const addBtn = document.getElementById('addGoalBtn');
        const saveBtn = document.getElementById('saveGoalBtn');
        const cancelBtn = document.getElementById('cancelGoalBtn');
        const input = document.getElementById('goalInput');
        const filterBtns = document.querySelectorAll('.filter-btn');

        addBtn.addEventListener('click', () => this.showInput());
        saveBtn.addEventListener('click', () => this.addGoal());
        cancelBtn.addEventListener('click', () => this.hideInput());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addGoal();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                AppState.goalFilter = e.target.getAttribute('data-filter');
                this.render();
            });
        });
    },

    showInput() {
        document.getElementById('goalInputContainer').classList.remove('hidden');
        document.getElementById('goalInput').focus();
    },

    hideInput() {
        document.getElementById('goalInputContainer').classList.add('hidden');
        document.getElementById('goalInput').value = '';
    },

    addGoal() {
        const input = document.getElementById('goalInput');
        const text = input.value.trim();

        if (!text) {
            Utils.showToast('Please enter a goal', 'error');
            return;
        }

        const goal = {
            id: Utils.generateId(),
            text: text,
            completed: false,
            date: Utils.getDateString()
        };

        AppState.goals.unshift(goal);
        this.saveGoals();
        this.hideInput();
        this.render();
        Utils.showToast('Goal added successfully', 'success');
    },

    toggleGoal(id) {
        const goal = AppState.goals.find(g => g.id === id);
        if (goal) {
            goal.completed = !goal.completed;
            this.saveGoals();
            this.render();
            Utils.showToast(goal.completed ? 'Goal completed! 🎉' : 'Goal marked as pending', 'success');
        }
    },

    deleteGoal(id) {
        AppState.goals = AppState.goals.filter(g => g.id !== id);
        this.saveGoals();
        this.render();
        Utils.showToast('Goal deleted', 'info');
    },

    editGoal(id) {
        const goal = AppState.goals.find(g => g.id === id);
        if (!goal) return;

        const newText = prompt('Edit goal:', goal.text);
        if (newText && newText.trim()) {
            goal.text = newText.trim();
            this.saveGoals();
            this.render();
            Utils.showToast('Goal updated', 'success');
        }
    },

    getFilteredGoals() {
        switch (AppState.goalFilter) {
            case 'completed':
                return AppState.goals.filter(g => g.completed);
            case 'pending':
                return AppState.goals.filter(g => !g.completed);
            default:
                return AppState.goals;
        }
    },

    updateProgress() {
        const total = AppState.goals.length;
        const completed = AppState.goals.filter(g => g.completed).length;
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        const progressBar = document.getElementById('goalProgress');
        const progressText = document.getElementById('goalProgressText');

        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}% Complete (${completed}/${total})`;
    },

    render() {
        const list = document.getElementById('goalsList');
        const emptyState = document.getElementById('goalsEmptyState');
        const filteredGoals = this.getFilteredGoals();

        if (filteredGoals.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            list.style.display = 'block';
            emptyState.style.display = 'none';

            list.innerHTML = filteredGoals.map(goal => `
                <li class="goal-item ${goal.completed ? 'completed' : ''}">
                    <input type="checkbox" 
                           class="goal-checkbox" 
                           ${goal.completed ? 'checked' : ''} 
                           onchange="Goals.toggleGoal('${goal.id}')">
                    <span class="goal-text">${this.escapeHtml(goal.text)}</span>
                    <div class="goal-actions">
                        <button class="btn btn-sm btn-secondary" onclick="Goals.editGoal('${goal.id}')">✏️</button>
                        <button class="btn btn-sm btn-danger" onclick="Goals.deleteGoal('${goal.id}')">🗑️</button>
                    </div>
                </li>
            `).join('');
        }

        this.updateProgress();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===================================
// HABIT STREAK MODULE
// ===================================

const Habits = {
    init() {
        this.loadHabits();
        this.bindEvents();
        this.checkAndResetStreaks();
        this.render();
    },

    loadHabits() {
        AppState.habits = Storage.load('habits', []);
    },

    saveHabits() {
        Storage.save('habits', AppState.habits);
    },

    bindEvents() {
        const addBtn = document.getElementById('addHabitBtn');
        const saveBtn = document.getElementById('saveHabitBtn');
        const cancelBtn = document.getElementById('cancelHabitBtn');
        const input = document.getElementById('habitInput');

        addBtn.addEventListener('click', () => this.showInput());
        saveBtn.addEventListener('click', () => this.addHabit());
        cancelBtn.addEventListener('click', () => this.hideInput());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });
    },

    showInput() {
        document.getElementById('habitInputContainer').classList.remove('hidden');
        document.getElementById('habitInput').focus();
    },

    hideInput() {
        document.getElementById('habitInputContainer').classList.add('hidden');
        document.getElementById('habitInput').value = '';
    },

    addHabit() {
        const input = document.getElementById('habitInput');
        const name = input.value.trim();

        if (!name) {
            Utils.showToast('Please enter a habit name', 'error');
            return;
        }

        const habit = {
            id: Utils.generateId(),
            name: name,
            currentStreak: 0,
            bestStreak: 0,
            lastCheckin: null
        };

        AppState.habits.push(habit);
        this.saveHabits();
        this.hideInput();
        this.render();
        Utils.showToast('Habit created successfully', 'success');
    },

    checkIn(id) {
        const habit = AppState.habits.find(h => h.id === id);
        if (!habit) return;

        const today = Utils.getDateString();
        
        if (habit.lastCheckin === today) {
            Utils.showToast('Already checked in today!', 'warning');
            return;
        }

        habit.currentStreak++;
        habit.lastCheckin = today;
        
        if (habit.currentStreak > habit.bestStreak) {
            habit.bestStreak = habit.currentStreak;
        }

        this.saveHabits();
        this.render();
        Utils.showToast(`Streak updated! 🔥 ${habit.currentStreak} days`, 'success');
    },

    deleteHabit(id) {
        AppState.habits = AppState.habits.filter(h => h.id !== id);
        this.saveHabits();
        this.render();
        Utils.showToast('Habit deleted', 'info');
    },

    checkAndResetStreaks() {
        const today = Utils.getDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = Utils.getDateString(yesterday);

        let updated = false;

        AppState.habits.forEach(habit => {
            if (habit.lastCheckin && habit.lastCheckin !== today && habit.lastCheckin !== yesterdayStr) {
                // Missed a day, reset streak
                habit.currentStreak = 0;
                updated = true;
            }
        });

        if (updated) {
            this.saveHabits();
        }
    },

    render() {
        const list = document.getElementById('habitsList');
        const emptyState = document.getElementById('habitsEmptyState');

        if (AppState.habits.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            list.style.display = 'grid';
            emptyState.style.display = 'none';

            list.innerHTML = AppState.habits.map(habit => {
                const today = Utils.getDateString();
                const checkedInToday = habit.lastCheckin === today;

                return `
                    <div class="habit-card">
                        <div class="habit-header">
                            <h3 class="habit-name">${this.escapeHtml(habit.name)}</h3>
                            <button class="habit-delete" onclick="Habits.deleteHabit('${habit.id}')">❌</button>
                        </div>
                        <div class="habit-streaks">
                            <div class="streak-item">
                                <span class="streak-value">${habit.currentStreak}</span>
                                <span class="streak-label">Current</span>
                            </div>
                            <div class="streak-item">
                                <span class="streak-value">${habit.bestStreak}</span>
                                <span class="streak-label">Best</span>
                            </div>
                        </div>
                        <button class="btn btn-primary habit-checkin" 
                                onclick="Habits.checkIn('${habit.id}')"
                                ${checkedInToday ? 'disabled' : ''}>
                            ${checkedInToday ? '✓ Checked In' : 'Check In Today'}
                        </button>
                        ${habit.currentStreak >= 7 ? '<div class="habit-badge">🔥 On Fire!</div>' : ''}
                    </div>
                `;
            }).join('');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===================================
// FOCUS TIMER MODULE
// ===================================

const Timer = {
    init() {
        this.loadTimerData();
        this.bindEvents();
        this.render();
        this.checkAndResetDaily();
    },

    loadTimerData() {
        const savedTimer = Storage.load('timer', null);
        if (savedTimer) {
            // Only restore if it's from today
            if (Utils.isToday(savedTimer.date)) {
                AppState.timer.sessionsToday = savedTimer.sessionsToday || 0;
                AppState.timer.focusTimeToday = savedTimer.focusTimeToday || 0;
                AppState.timer.studyDuration = savedTimer.studyDuration || 25;
                AppState.timer.breakDuration = savedTimer.breakDuration || 5;
            }
        }
        // Set initial time based on mode and duration
        this.resetTimer();
    },

    saveTimerData() {
        Storage.save('timer', {
            sessionsToday: AppState.timer.sessionsToday,
            focusTimeToday: AppState.timer.focusTimeToday,
            studyDuration: AppState.timer.studyDuration,
            breakDuration: AppState.timer.breakDuration,
            date: Utils.getDateString()
        });
    },

    bindEvents() {
        const startBtn = document.getElementById('timerStartBtn');
        const resetBtn = document.getElementById('timerResetBtn');
        const modeBtns = document.querySelectorAll('.mode-btn');
        const studyMinutesInput = document.getElementById('studyMinutes');
        const breakMinutesInput = document.getElementById('breakMinutes');

        startBtn.addEventListener('click', () => this.toggleTimer());
        resetBtn.addEventListener('click', () => this.resetTimer());

        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (AppState.timer.isRunning) {
                    Utils.showToast('Stop timer before changing mode', 'warning');
                    return;
                }
                modeBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                AppState.timer.mode = e.target.getAttribute('data-mode');
                this.resetTimer();
            });
        });

        // Custom duration inputs
        studyMinutesInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 120) {
                AppState.timer.studyDuration = value;
                if (AppState.timer.mode === 'study' && !AppState.timer.isRunning) {
                    this.resetTimer();
                }
                this.saveTimerData();
            }
        });

        breakMinutesInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 60) {
                AppState.timer.breakDuration = value;
                if (AppState.timer.mode === 'break' && !AppState.timer.isRunning) {
                    this.resetTimer();
                }
                this.saveTimerData();
            }
        });
    },

    toggleTimer() {
        if (AppState.timer.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        AppState.timer.isRunning = true;
        document.getElementById('timerStartBtn').textContent = 'Pause';

        AppState.timer.interval = setInterval(() => {
            if (AppState.timer.timeRemaining > 0) {
                AppState.timer.timeRemaining--;
                this.render();
            } else {
                this.timerComplete();
            }
        }, 1000);
    },

    pauseTimer() {
        AppState.timer.isRunning = false;
        document.getElementById('timerStartBtn').textContent = 'Start';
        clearInterval(AppState.timer.interval);
    },

    resetTimer() {
        this.pauseTimer();
        const duration = AppState.timer.mode === 'study' 
            ? AppState.timer.studyDuration * 60 
            : AppState.timer.breakDuration * 60;
        AppState.timer.timeRemaining = duration;
        this.render();
    },

    timerComplete() {
        this.pauseTimer();
        
        if (AppState.timer.mode === 'study') {
            AppState.timer.sessionsToday++;
            AppState.timer.focusTimeToday += AppState.timer.studyDuration;
            this.saveTimerData();
            Utils.showToast('Study session complete! Take a break 🎉', 'success');
        } else {
            Utils.showToast('Break time over! Ready to focus? 💪', 'success');
        }

        // Play sound notification (simple beep using Web Audio API)
        this.playNotificationSound();

        this.resetTimer();
    },

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio notification not supported');
        }
    },

    checkAndResetDaily() {
        const savedTimer = Storage.load('timer', null);
        if (savedTimer && !Utils.isToday(savedTimer.date)) {
            AppState.timer.sessionsToday = 0;
            AppState.timer.focusTimeToday = 0;
            this.saveTimerData();
        }
    },

    render() {
        document.getElementById('timerDisplay').textContent = Utils.formatTime(AppState.timer.timeRemaining);
        document.getElementById('sessionCount').textContent = AppState.timer.sessionsToday;
        document.getElementById('focusTime').textContent = `${AppState.timer.focusTimeToday} min`;
        
        // Update input values
        document.getElementById('studyMinutes').value = AppState.timer.studyDuration;
        document.getElementById('breakMinutes').value = AppState.timer.breakDuration;
    }
};

// ===================================
// EXPENSE TRACKER MODULE
// ===================================

const Expenses = {
    init() {
        this.loadExpenses();
        this.bindEvents();
        this.render();
    },

    loadExpenses() {
        const savedExpenses = Storage.load('expenses', []);
        // Filter to only show today's expenses
        const today = Utils.getDateString();
        AppState.expenses = savedExpenses.filter(exp => exp.date === today);
        Storage.save('expenses', AppState.expenses);
    },

    saveExpenses() {
        Storage.save('expenses', AppState.expenses);
    },

    bindEvents() {
        const addBtn = document.getElementById('addExpenseBtn');
        addBtn.addEventListener('click', () => this.addExpense());

        const amountInput = document.getElementById('expenseAmount');
        amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addExpense();
        });
    },

    addExpense() {
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;

        if (!amount || amount <= 0) {
            Utils.showToast('Please enter a valid amount', 'error');
            return;
        }

        if (!category) {
            Utils.showToast('Please select a category', 'error');
            return;
        }

        const expense = {
            id: Utils.generateId(),
            amount: amount,
            category: category,
            date: Utils.getDateString(),
            time: Utils.getTimeString()
        };

        AppState.expenses.unshift(expense);
        this.saveExpenses();
        this.render();

        // Clear inputs
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseCategory').value = '';

        Utils.showToast('Expense added', 'success');
    },

    deleteExpense(id) {
        AppState.expenses = AppState.expenses.filter(e => e.id !== id);
        this.saveExpenses();
        this.render();
        Utils.showToast('Expense deleted', 'info');
    },

    getCategoryIcon(category) {
        const icons = {
            'Food': '🍔',
            'Transport': '🚗',
            'Shopping': '🛍️',
            'Entertainment': '🎬',
            'Bills': '📄',
            'Other': '📦'
        };
        return icons[category] || '📦';
    },

    calculateCategorySummary() {
        const summary = {};
        AppState.expenses.forEach(exp => {
            if (!summary[exp.category]) {
                summary[exp.category] = 0;
            }
            summary[exp.category] += exp.amount;
        });
        return summary;
    },

    render() {
        const list = document.getElementById('expensesList');
        const emptyState = document.getElementById('expensesEmptyState');
        const totalEl = document.getElementById('todayTotal');
        const summaryEl = document.getElementById('categorySummary');

        // Calculate total
        const total = AppState.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalEl.textContent = total.toFixed(2);

        // Render category summary
        const summary = this.calculateCategorySummary();
        const maxAmount = Math.max(...Object.values(summary), 1);

        if (Object.keys(summary).length > 0) {
            summaryEl.innerHTML = Object.entries(summary).map(([category, amount]) => {
                const percentage = (amount / maxAmount) * 100;
                return `
                    <div class="category-bar">
                        <div class="category-header">
                            <span class="category-name">${this.getCategoryIcon(category)} ${category}</span>
                            <span class="category-amount">$${amount.toFixed(2)}</span>
                        </div>
                        <div class="category-bar-container">
                            <div class="category-bar-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            summaryEl.innerHTML = '';
        }

        // Render expenses list
        if (AppState.expenses.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            list.style.display = 'block';
            emptyState.style.display = 'none';

            list.innerHTML = AppState.expenses.map(exp => `
                <div class="expense-item">
                    <div class="expense-info">
                        <div class="expense-category-icon">${this.getCategoryIcon(exp.category)}</div>
                        <div class="expense-details">
                            <div class="expense-category-name">${exp.category}</div>
                            <div class="expense-time">${exp.time}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="expense-amount-display">$${exp.amount.toFixed(2)}</div>
                        <button class="btn btn-sm btn-danger" onclick="Expenses.deleteExpense('${exp.id}')">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    }
};

// ===================================
// NOTES MODULE
// ===================================

const Notes = {
    init() {
        this.loadNotes();
        this.bindEvents();
        this.render();
    },

    loadNotes() {
        AppState.notes = Storage.load('notes', []);
    },

    saveNotes() {
        Storage.save('notes', AppState.notes);
    },

    bindEvents() {
        const addBtn = document.getElementById('addNoteBtn');
        const saveBtn = document.getElementById('saveNoteBtn');
        const cancelBtn = document.getElementById('cancelNoteBtn');
        const input = document.getElementById('noteInput');

        addBtn.addEventListener('click', () => this.showInput());
        saveBtn.addEventListener('click', () => this.addNote());
        cancelBtn.addEventListener('click', () => this.hideInput());

        input.addEventListener('input', (e) => {
            const charCounter = document.getElementById('charCounter');
            charCounter.textContent = `${e.target.value.length}/500`;
        });
    },

    showInput() {
        document.getElementById('noteInputContainer').classList.remove('hidden');
        document.getElementById('noteInput').focus();
    },

    hideInput() {
        document.getElementById('noteInputContainer').classList.add('hidden');
        document.getElementById('noteInput').value = '';
        document.getElementById('charCounter').textContent = '0/500';
    },

    addNote() {
        const input = document.getElementById('noteInput');
        const content = input.value.trim();

        if (!content) {
            Utils.showToast('Please enter some content', 'error');
            return;
        }

        const note = {
            id: Utils.generateId(),
            content: content,
            date: new Date().toISOString()
        };

        AppState.notes.unshift(note);
        this.saveNotes();
        this.hideInput();
        this.render();
        Utils.showToast('Note saved', 'success');
    },

    deleteNote(id) {
        AppState.notes = AppState.notes.filter(n => n.id !== id);
        this.saveNotes();
        this.render();
        Utils.showToast('Note deleted', 'info');
    },

    startEdit(id) {
        AppState.editingNoteId = id;
        this.render();
    },

    saveEdit(id) {
        const textarea = document.querySelector(`textarea[data-note-id="${id}"]`);
        const note = AppState.notes.find(n => n.id === id);
        
        if (note && textarea) {
            const newContent = textarea.value.trim();
            if (newContent) {
                note.content = newContent;
                this.saveNotes();
                Utils.showToast('Note updated', 'success');
            }
        }

        AppState.editingNoteId = null;
        this.render();
    },

    cancelEdit() {
        AppState.editingNoteId = null;
        this.render();
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    render() {
        const list = document.getElementById('notesList');
        const emptyState = document.getElementById('notesEmptyState');

        if (AppState.notes.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            list.style.display = 'grid';
            emptyState.style.display = 'none';

            list.innerHTML = AppState.notes.map(note => {
                const isEditing = AppState.editingNoteId === note.id;

                return `
                    <div class="note-card">
                        <div class="note-header">
                            <span class="note-date">${this.formatDate(note.date)}</span>
                            <div class="note-actions">
                                ${!isEditing ? `
                                    <button class="note-action-btn" onclick="Notes.startEdit('${note.id}')">✏️</button>
                                    <button class="note-action-btn" onclick="Notes.deleteNote('${note.id}')">🗑️</button>
                                ` : `
                                    <button class="note-action-btn" onclick="Notes.saveEdit('${note.id}')">✓</button>
                                    <button class="note-action-btn" onclick="Notes.cancelEdit()">✕</button>
                                `}
                            </div>
                        </div>
                        ${isEditing ? `
                            <textarea class="note-edit-input" data-note-id="${note.id}" maxlength="500">${this.escapeHtml(note.content)}</textarea>
                        ` : `
                            <div class="note-content">${this.escapeHtml(note.content)}</div>
                        `}
                    </div>
                `;
            }).join('');
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ===================================
// WEATHER MODULE
// ===================================

const Weather = {
    // Using Open-Meteo API (free, no API key required)
    geocodeUrl: 'https://geocoding-api.open-meteo.com/v1/search',
    weatherUrl: 'https://api.open-meteo.com/v1/forecast',

    init() {
        this.bindEvents();
        this.loadSavedLocation();
    },

    loadSavedLocation() {
        const savedLocation = Storage.load('weatherLocation', null);
        if (savedLocation) {
            document.getElementById('cityInput').value = savedLocation.city;
            this.fetchWeatherByCoords(savedLocation.latitude, savedLocation.longitude, savedLocation.city, savedLocation.country);
        } else {
            // Default to user's location or London
            this.getUserLocation();
        }
    },

    saveLocation(city, country, latitude, longitude) {
        Storage.save('weatherLocation', { city, country, latitude, longitude });
    },

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.reverseGeocode(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    // If geolocation fails, default to London
                    this.fetchWeather('London');
                }
            );
        } else {
            this.fetchWeather('London');
        }
    },

    async reverseGeocode(latitude, longitude) {
        try {
            const response = await fetch(`${this.geocodeUrl}?latitude=${latitude}&longitude=${longitude}&count=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    const location = data.results[0];
                    document.getElementById('cityInput').value = `${location.name}, ${location.country}`;
                    this.fetchWeatherByCoords(latitude, longitude, location.name, location.country);
                    return;
                }
            }
        } catch (err) {
            console.error('Reverse geocode error:', err);
        }
        this.fetchWeather('London');
    },

    bindEvents() {
        const searchBtn = document.getElementById('searchWeatherBtn');
        const input = document.getElementById('cityInput');
        const locationBtn = document.getElementById('useLocationBtn');

        searchBtn.addEventListener('click', () => this.searchWeather());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });

        if (locationBtn) {
            locationBtn.addEventListener('click', () => this.getUserLocation());
        }
    },

    searchWeather() {
        const cityInput = document.getElementById('cityInput').value.trim();
        if (!cityInput) {
            Utils.showToast('Please enter a city or country name', 'error');
            return;
        }
        this.fetchWeather(cityInput);
    },

    async fetchWeather(searchQuery) {
        const loading = document.getElementById('weatherLoading');
        const display = document.getElementById('weatherDisplay');
        const error = document.getElementById('weatherError');

        // Show loading
        loading.classList.remove('hidden');
        display.classList.add('hidden');
        error.classList.add('hidden');

        try {
            // Step 1: Geocode the city/country name to get coordinates
            const geocodeResponse = await fetch(
                `${this.geocodeUrl}?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`
            );

            if (!geocodeResponse.ok) {
                throw new Error('Geocoding failed');
            }

            const geocodeData = await geocodeResponse.json();

            if (!geocodeData.results || geocodeData.results.length === 0) {
                throw new Error('Location not found');
            }

            // Get the first result (most relevant)
            const location = geocodeData.results[0];
            const { latitude, longitude, name, country, admin1 } = location;

            // Step 2: Fetch weather data using coordinates
            await this.fetchWeatherByCoords(latitude, longitude, name, country, admin1);

            // Save the location for next time
            this.saveLocation(name, country, latitude, longitude);

        } catch (err) {
            console.error('Weather fetch error:', err);
            loading.classList.add('hidden');
            error.classList.remove('hidden');
            document.getElementById('weatherErrorMessage').textContent = 
                err.message === 'Location not found' 
                    ? 'Location not found. Please try a different city or country.' 
                    : 'Unable to fetch weather data. Please try again.';
        }
    },

    async fetchWeatherByCoords(latitude, longitude, cityName, country, region = '') {
        const loading = document.getElementById('weatherLoading');
        const display = document.getElementById('weatherDisplay');
        const error = document.getElementById('weatherError');

        loading.classList.remove('hidden');
        display.classList.add('hidden');
        error.classList.add('hidden');

        try {
            // Fetch current weather with additional data
            const weatherResponse = await fetch(
                `${this.weatherUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`
            );

            if (!weatherResponse.ok) {
                throw new Error('Weather data not available');
            }

            const weatherData = await weatherResponse.json();
            const current = weatherData.current;

            // Get weather condition from code
            const condition = this.getWeatherCondition(current.weather_code);

            // Display the weather
            this.displayWeather({
                city: cityName,
                country: country,
                region: region,
                temp: Math.round(current.temperature_2m),
                feelsLike: Math.round(current.apparent_temperature),
                condition: condition,
                humidity: current.relative_humidity_2m,
                windSpeed: Math.round(current.wind_speed_10m),
                windDirection: this.getWindDirection(current.wind_direction_10m),
                precipitation: current.precipitation
            });

            Utils.showToast(`Weather loaded for ${cityName}, ${country}`, 'success');

        } catch (err) {
            console.error('Weather fetch error:', err);
            loading.classList.add('hidden');
            error.classList.remove('hidden');
        }
    },

    getWeatherCondition(code) {
        // WMO Weather interpretation codes
        const conditions = {
            0: { text: 'Clear Sky', icon: '☀️' },
            1: { text: 'Mainly Clear', icon: '🌤️' },
            2: { text: 'Partly Cloudy', icon: '⛅' },
            3: { text: 'Overcast', icon: '☁️' },
            45: { text: 'Foggy', icon: '🌫️' },
            48: { text: 'Depositing Rime Fog', icon: '🌫️' },
            51: { text: 'Light Drizzle', icon: '🌦️' },
            53: { text: 'Moderate Drizzle', icon: '🌦️' },
            55: { text: 'Dense Drizzle', icon: '🌧️' },
            56: { text: 'Freezing Drizzle', icon: '🌨️' },
            57: { text: 'Dense Freezing Drizzle', icon: '🌨️' },
            61: { text: 'Slight Rain', icon: '🌧️' },
            63: { text: 'Moderate Rain', icon: '🌧️' },
            65: { text: 'Heavy Rain', icon: '🌧️' },
            66: { text: 'Freezing Rain', icon: '🌨️' },
            67: { text: 'Heavy Freezing Rain', icon: '🌨️' },
            71: { text: 'Slight Snow', icon: '🌨️' },
            73: { text: 'Moderate Snow', icon: '❄️' },
            75: { text: 'Heavy Snow', icon: '❄️' },
            77: { text: 'Snow Grains', icon: '🌨️' },
            80: { text: 'Slight Rain Showers', icon: '🌦️' },
            81: { text: 'Moderate Rain Showers', icon: '🌧️' },
            82: { text: 'Violent Rain Showers', icon: '⛈️' },
            85: { text: 'Slight Snow Showers', icon: '🌨️' },
            86: { text: 'Heavy Snow Showers', icon: '❄️' },
            95: { text: 'Thunderstorm', icon: '⛈️' },
            96: { text: 'Thunderstorm with Hail', icon: '⛈️' },
            99: { text: 'Thunderstorm with Heavy Hail', icon: '⛈️' }
        };
        return conditions[code] || { text: 'Unknown', icon: '🌡️' };
    },

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    },

    displayWeather(data) {
        const loading = document.getElementById('weatherLoading');
        const display = document.getElementById('weatherDisplay');

        // Update weather icon
        document.getElementById('weatherIcon').textContent = data.condition.icon;
        
        // Update temperature
        document.getElementById('weatherTemp').textContent = `${data.temp}°C`;
        
        // Update feels like
        const feelsLikeEl = document.getElementById('weatherFeelsLike');
        if (feelsLikeEl) {
            feelsLikeEl.textContent = `Feels like ${data.feelsLike}°C`;
        }
        
        // Update condition
        document.getElementById('weatherCondition').textContent = data.condition.text;
        
        // Update location with country
        document.getElementById('weatherCity').textContent = `${data.city}, ${data.country}`;
        
        // Update humidity
        document.getElementById('weatherHumidity').textContent = `${data.humidity}%`;
        
        // Update wind with direction
        document.getElementById('weatherWind').textContent = `${data.windSpeed} km/h ${data.windDirection}`;

        // Update precipitation if element exists
        const precipEl = document.getElementById('weatherPrecipitation');
        if (precipEl) {
            precipEl.textContent = `${data.precipitation} mm`;
        }

        loading.classList.add('hidden');
        display.classList.remove('hidden');
    }
};

// ===================================
// QUOTE MODULE
// ===================================

const Quote = {
    fallbackQuotes: [
        { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" }
    ],

    init() {
        this.bindEvents();
        this.fetchQuote();
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refreshQuoteBtn');
        refreshBtn.addEventListener('click', () => this.fetchQuote());
    },

    async fetchQuote() {
        const loading = document.getElementById('quoteLoading');
        const display = document.getElementById('quoteDisplay');

        loading.classList.remove('hidden');
        display.classList.add('hidden');

        try {
            const response = await fetch('https://api.quotable.io/random');
            
            if (!response.ok) {
                throw new Error('Failed to fetch quote');
            }

            const data = await response.json();
            this.displayQuote(data.content, data.author);

        } catch (err) {
            console.error('Quote fetch error:', err);
            // Use fallback quote
            const randomQuote = this.fallbackQuotes[Math.floor(Math.random() * this.fallbackQuotes.length)];
            this.displayQuote(randomQuote.text, randomQuote.author);
        }
    },

    displayQuote(text, author) {
        const loading = document.getElementById('quoteLoading');
        const display = document.getElementById('quoteDisplay');

        document.getElementById('quoteText').textContent = `"${text}"`;
        document.getElementById('quoteAuthor').textContent = `— ${author}`;

        loading.classList.add('hidden');
        display.classList.remove('hidden');
    }
};

// ===================================
// PRODUCTIVITY SCORE MODULE
// ===================================

const ProductivityScore = {
    init() {
        this.calculateAndRender();
    },

    calculateScore() {
        let totalScore = 0;
        const breakdown = {
            goals: 0,
            habits: 0,
            focus: 0
        };

        // Goals completion (40 points max)
        if (AppState.goals.length > 0) {
            const completedGoals = AppState.goals.filter(g => g.completed).length;
            breakdown.goals = Math.round((completedGoals / AppState.goals.length) * 40);
        }

        // Habits checked today (30 points max)
        if (AppState.habits.length > 0) {
            const today = Utils.getDateString();
            const checkedHabits = AppState.habits.filter(h => h.lastCheckin === today).length;
            breakdown.habits = Math.round((checkedHabits / AppState.habits.length) * 30);
        }

        // Focus time (30 points max - 120 minutes = 30 points)
        const focusMinutes = AppState.timer.focusTimeToday;
        breakdown.focus = Math.min(Math.round((focusMinutes / 120) * 30), 30);

        totalScore = breakdown.goals + breakdown.habits + breakdown.focus;

        return { totalScore, breakdown };
    },

    calculateAndRender() {
        const { totalScore, breakdown } = this.calculateScore();

        // Update circular progress
        const circle = document.getElementById('productivityCircle');
        const scoreText = document.getElementById('productivityScore');
        const circumference = 2 * Math.PI * 85;
        const offset = circumference - (totalScore / 100) * circumference;

        circle.style.strokeDashoffset = offset;
        scoreText.textContent = totalScore;

        // Update breakdown bars
        const goalsPercent = Math.round((breakdown.goals / 40) * 100);
        const habitsPercent = Math.round((breakdown.habits / 30) * 100);
        const focusPercent = Math.round((breakdown.focus / 30) * 100);

        document.getElementById('goalsBreakdown').style.width = `${goalsPercent}%`;
        document.getElementById('habitsBreakdown').style.width = `${habitsPercent}%`;
        document.getElementById('focusBreakdown').style.width = `${focusPercent}%`;

        document.getElementById('goalsBreakdownValue').textContent = `${goalsPercent}%`;
        document.getElementById('habitsBreakdownValue').textContent = `${habitsPercent}%`;
        document.getElementById('focusBreakdownValue').textContent = `${focusPercent}%`;
    },

    render() {
        this.calculateAndRender();
    }
};

// ===================================
// KEYBOARD SHORTCUTS
// ===================================

const KeyboardShortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            // Alt + G: Add Goal
            if (e.altKey && e.key === 'g') {
                e.preventDefault();
                Navigation.navigateTo('goals');
                setTimeout(() => Goals.showInput(), 100);
            }

            // Alt + H: Add Habit
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                Navigation.navigateTo('habits');
                setTimeout(() => Habits.showInput(), 100);
            }

            // Alt + N: Add Note
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                Navigation.navigateTo('notes');
                setTimeout(() => Notes.showInput(), 100);
            }

            // Alt + T: Toggle Theme
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                ThemeManager.toggleTheme();
            }
        });
    }
};

// ===================================
// APPLICATION INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    ThemeManager.init();
    Navigation.init();
    Header.init();
    Profile.init();
    Goals.init();
    Habits.init();
    Timer.init();
    Expenses.init();
    Notes.init();
    Weather.init();
    Quote.init();
    ProductivityScore.init();
    KeyboardShortcuts.init();

    console.log('🚀 Digital Life Dashboard initialized successfully!');
});

// Update productivity score when data changes
setInterval(() => {
    if (AppState.currentSection === 'productivity') {
        ProductivityScore.calculateAndRender();
    }
}, 5000);