
import { LibraryItem, ProgressMetric } from '../types';

export interface DailyHistory {
    day: string;
    score: number;
}

interface UserData {
    profile: {
        name: string;
        email: string;
        passwordHash: string; // Simple mock hash
        streak: number;
        lastActivity: string;
        joinedAt: string;
    };
    library: LibraryItem[];
    metrics: ProgressMetric[];
    history: DailyHistory[];
}

interface UserDatabase {
    [email: string]: UserData;
}

const DB_KEY = 'edumind_users_db_v1';
const SESSION_KEY = 'edumind_active_session';

class StorageService {
    private currentUserEmail: string | null = null;
    private db: UserDatabase = {};

    constructor() {
        this.loadDB();
        this.restoreSession();
    }

    private loadDB() {
        try {
            const stored = localStorage.getItem(DB_KEY);
            this.db = stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error("DB Load Error", e);
            this.db = {};
        }
    }

    private saveDB() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(this.db));
        } catch (e) { console.error("DB Save Error", e); }
    }

    private restoreSession() {
        this.currentUserEmail = localStorage.getItem(SESSION_KEY);
    }

    private getCurrentUserData(): UserData | null {
        if (!this.currentUserEmail || !this.db[this.currentUserEmail]) return null;
        return this.db[this.currentUserEmail];
    }

    // --- Authentication Logic ---

    isAuthenticated(): boolean {
        return !!this.currentUserEmail && !!this.db[this.currentUserEmail];
    }

    registerUser(name: string, email: string, password: string): { success: boolean; message?: string } {
        this.loadDB(); // Ensure fresh data
        const normalizedEmail = email.toLowerCase().trim();

        if (this.db[normalizedEmail]) {
            return { success: false, message: "Email is already registered. Please sign in." };
        }

        // Initialize new user schema
        const newUser: UserData = {
            profile: {
                name: name.trim(),
                email: normalizedEmail,
                passwordHash: btoa(password), // Simple encoding for demo purposes
                streak: 1,
                lastActivity: new Date().toISOString(),
                joinedAt: new Date().toISOString()
            },
            library: [],
            metrics: [
                { subject: 'Mathematics', masteryLevel: 'Novice', hoursSpent: 0, quizzesTaken: 0, weakAreas: [] },
                { subject: 'Science', masteryLevel: 'Novice', hoursSpent: 0, quizzesTaken: 0, weakAreas: [] },
                { subject: 'History', masteryLevel: 'Novice', hoursSpent: 0, quizzesTaken: 0, weakAreas: [] }
            ],
            history: [
                { day: 'Mon', score: 0 }, { day: 'Tue', score: 0 }, { day: 'Wed', score: 0 }, 
                { day: 'Thu', score: 0 }, { day: 'Fri', score: 0 }
            ]
        };

        this.db[normalizedEmail] = newUser;
        this.saveDB();
        
        // Auto-login after register
        this.currentUserEmail = normalizedEmail;
        localStorage.setItem(SESSION_KEY, normalizedEmail);
        
        return { success: true };
    }

    loginUser(email: string, password: string): { success: boolean; message?: string } {
        this.loadDB();
        const normalizedEmail = email.toLowerCase().trim();
        const user = this.db[normalizedEmail];

        if (!user) {
            return { success: false, message: "Account not found. Please sign up first." };
        }

        if (user.profile.passwordHash !== btoa(password)) {
            return { success: false, message: "Incorrect password." };
        }

        this.currentUserEmail = normalizedEmail;
        localStorage.setItem(SESSION_KEY, normalizedEmail);
        
        // Update Activity
        user.profile.lastActivity = new Date().toISOString();
        this.saveDB();

        return { success: true };
    }

    logout() {
        this.currentUserEmail = null;
        localStorage.removeItem(SESSION_KEY);
    }

    // --- Data Access (Scoped to Current User) ---

    getUserProfile() {
        const data = this.getCurrentUserData();
        return data ? { ...data.profile } : { name: 'Guest', streak: 0 };
    }

    getLibrary(): LibraryItem[] {
        return this.getCurrentUserData()?.library || [];
    }

    addItem(item: LibraryItem) {
        const data = this.getCurrentUserData();
        if (!data) return;

        data.library.unshift(item);
        
        // Update metrics simply by Category presence
        const subject = item.category || 'General';
        this.updateMetricInternal(data, subject, { hoursSpent: 0.5 });
        
        this.saveDB();
    }

    deleteItem(id: number) {
        const data = this.getCurrentUserData();
        if (!data) return;
        data.library = data.library.filter(i => i.id !== id);
        this.saveDB();
    }

    getMetrics(): ProgressMetric[] {
        return this.getCurrentUserData()?.metrics || [];
    }

    getHistory(): DailyHistory[] {
        return this.getCurrentUserData()?.history || [];
    }

    getTotalMastery(): number {
        const data = this.getCurrentUserData();
        if (!data) return 0;
        
        const activeHistory = data.history.filter(h => h.score > 0);
        if (activeHistory.length === 0) return 0;
        
        const sum = activeHistory.reduce((acc, h) => acc + h.score, 0);
        return Math.round(sum / activeHistory.length);
    }

    recordQuizResult(subjectName: string, score: number) {
        const data = this.getCurrentUserData();
        if (!data) return;

        // 1. Update Metrics
        this.updateMetricInternal(data, subjectName, { 
            quizzesTaken: 1, 
            hoursSpent: 0.25, 
            masteryLevel: score > 80 ? 'Expert' : score > 60 ? 'Advanced' : score > 40 ? 'Intermediate' : 'Novice'
        });

        // 2. Update History
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = days[new Date().getDay()];
        const lastEntry = data.history[data.history.length - 1];
        
        if (lastEntry.day === today && lastEntry.score > 0) {
            lastEntry.score = Math.round((lastEntry.score + score) / 2);
        } else {
            if (data.history.length >= 7) data.history.shift();
            if (lastEntry.score === 0 && data.history.length > 0) {
                 data.history[data.history.length - 1] = { day: today, score };
            } else {
                data.history.push({ day: today, score });
            }
        }

        // 3. Update Streak
        const lastDate = new Date(data.profile.lastActivity).toDateString();
        const currentDate = new Date().toDateString();
        if (lastDate !== currentDate) {
            data.profile.streak += 1;
        }
        data.profile.lastActivity = new Date().toISOString();

        this.saveDB();
    }

    private updateMetricInternal(data: UserData, subjectName: string, updates: Partial<ProgressMetric>) {
        const index = data.metrics.findIndex(m => m.subject.toLowerCase() === subjectName.toLowerCase());
        if (index !== -1) {
            const current = data.metrics[index];
            data.metrics[index] = {
                ...current,
                hoursSpent: current.hoursSpent + (updates.hoursSpent || 0),
                quizzesTaken: current.quizzesTaken + (updates.quizzesTaken || 0),
                masteryLevel: updates.masteryLevel || current.masteryLevel
            };
        } else {
            data.metrics.push({
                subject: subjectName,
                masteryLevel: updates.masteryLevel || 'Novice',
                hoursSpent: updates.hoursSpent || 0,
                quizzesTaken: updates.quizzesTaken || 0,
                weakAreas: []
            });
        }
    }
}

export const storage = new StorageService();
