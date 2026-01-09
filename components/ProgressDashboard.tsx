
import React, { useEffect, useState, useRef } from 'react';
import { 
    LayoutGrid, BookOpen, MessageSquare, PieChart as PieIcon, Settings, 
    Plus, Search, MoreVertical, Play, FileText, Clock, ArrowRight, 
    Bell, User, LogOut, Sparkles, BrainCircuit, TrendingUp, CheckCircle2, Trophy, Loader2, Menu, X, Info, Trash2
} from 'lucide-react';
import { Language, ProgressMetric, LibraryItem } from '../types';
import { generateStudySetMetadata } from '../services/geminiService';
import { storage, DailyHistory } from '../services/storageService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props { 
    onBack: () => void; 
    onStartLearning: () => void;
    onViewConcept: () => void;
    onStartChat: () => void;
    language: Language; 
}

export const ProgressDashboard: React.FC<Props> = ({ onBack, onStartLearning, onViewConcept, onStartChat, language }) => {
    const [currentView, setCurrentView] = useState<'library' | 'progress' | 'chat'>('library');
    
    // Data State
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
    const [history, setHistory] = useState<DailyHistory[]>([]);
    const [user, setUser] = useState({ name: 'Guest', streak: 0 });
    const [totalMastery, setTotalMastery] = useState(0);

    const [importInput, setImportInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI States
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUpgradeToast, setShowUpgradeToast] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);

    // Refresh data
    const refreshData = () => {
        setLibraryItems(storage.getLibrary());
        setMetrics(storage.getMetrics());
        setHistory(storage.getHistory());
        setUser(storage.getUserProfile());
        setTotalMastery(storage.getTotalMastery());
    };

    useEffect(() => { refreshData(); }, [currentView]);

    const handleLogout = () => {
        storage.logout();
        onBack();
    };

    // --- Backend Integration ---
    const handleImport = async () => {
        if (!importInput.trim()) return;
        
        setIsImporting(true);
        try {
            const metadata = await generateStudySetMetadata(importInput);
            
            const newItem: LibraryItem = {
                id: Date.now(),
                title: metadata.title, 
                type: metadata.type as any,
                date: 'Just now',
                duration: metadata.duration,
                progress: 0,
                category: metadata.category
            };
            
            storage.addItem(newItem);
            refreshData();
            setImportInput('');
        } catch (error) {
            const fallbackItem: LibraryItem = {
                id: Date.now(),
                title: importInput,
                type: 'article',
                date: 'Just now',
                duration: 'Unknown',
                progress: 0,
                category: 'General'
            };
            storage.addItem(fallbackItem);
            refreshData();
            setImportInput('');
        } finally {
            setIsImporting(false);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        storage.deleteItem(id);
        refreshData();
    };

    const filteredLibrary = libraryItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateNewClick = () => {
        setCurrentView('library');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            importInputRef.current?.focus();
            setImportInput(""); 
        }, 100);
    };

    const handleUpgradeClick = () => {
        setShowUpgradeToast(true);
        setTimeout(() => setShowUpgradeToast(false), 3000);
    }

    // --- Components ---

    const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full
                ${active ? 'bg-stone-100 text-black font-bold' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}
            `}
        >
            <Icon size={20} className={active ? 'text-black' : 'text-stone-400 group-hover:text-stone-600'} />
            <span className={`text-sm ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
        </button>
    );

    const BottomNavItem = ({ icon: Icon, label, active, onClick }: any) => (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1 p-2 flex-1 transition-all active:scale-90 ${active ? 'text-black' : 'text-stone-400 hover:text-stone-600'}`}
        >
            <Icon size={24} strokeWidth={active ? 2.5 : 2} className={active ? '-translate-y-1 transition-transform' : ''} />
            <span className="text-[10px] font-bold">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row h-screen bg-white overflow-hidden font-sans text-stone-900">
            
            {/* Toast for Upgrade */}
            {showUpgradeToast && (
                <div className="fixed top-24 right-4 z-[60] bg-stone-900 text-white px-6 py-3 rounded-xl shadow-2xl animate-fade-in-up flex items-center gap-3">
                    <Sparkles size={18} className="text-yellow-400"/>
                    <span className="font-bold text-sm">Premium features coming soon!</span>
                </div>
            )}

            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex w-64 flex-shrink-0 bg-white border-r border-stone-100 flex-col justify-between p-6 z-20">
                <div>
                    <div className="flex items-center gap-2 px-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={onBack}>
                        <div className="bg-black text-white p-1.5 rounded-lg">
                            <BrainCircuit size={20} />
                        </div>
                        <span className="font-bold text-lg tracking-tight">EduMind</span>
                    </div>

                    <nav className="space-y-1">
                        <SidebarItem icon={LayoutGrid} label="Library" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
                        <SidebarItem icon={PieIcon} label="Progress" active={currentView === 'progress'} onClick={() => setCurrentView('progress')} />
                        <SidebarItem icon={MessageSquare} label="Tutor Chat" active={currentView === 'chat'} onClick={onStartChat} />
                        <SidebarItem icon={BookOpen} label="Concept Map" active={false} onClick={onViewConcept} />
                    </nav>

                    <div className="mt-8 px-4">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Your Folders</p>
                        <div className="space-y-3">
                            {['Physics 101', 'Calculus II', 'History'].map((folder, i) => (
                                <div key={i} className="flex items-center gap-3 text-stone-500 hover:text-stone-900 cursor-pointer text-sm font-medium">
                                    <div className="w-2 h-2 rounded-full bg-stone-200"></div>
                                    {folder}
                                </div>
                            ))}
                            <button className="flex items-center gap-2 text-xs font-bold text-stone-400 mt-4 hover:text-stone-600 transition-colors">
                                <Plus size={14} /> New Folder
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-stone-100 pt-4 mt-4">
                     <button onClick={handleLogout} className="w-full flex items-center gap-3 px-2 py-2 text-stone-500 hover:text-stone-900 text-sm font-medium transition-colors mb-2">
                        <LogOut size={18} /> Sign Out
                     </button>
                     <div className="flex items-center gap-3 mt-2 px-2 py-2 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-stone-200 to-stone-300 border border-stone-200 flex items-center justify-center font-bold text-stone-600 text-xs">
                             {user.name.substring(0,2).toUpperCase()}
                         </div>
                         <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-stone-900 truncate">{user.name}</p>
                             <p className="text-xs text-stone-400 truncate">Free Plan</p>
                         </div>
                         <Settings size={16} className="text-stone-400" />
                     </div>
                </div>
            </aside>

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-stone-50 bg-white z-20 flex-shrink-0">
                <div className="flex items-center gap-2" onClick={onBack}>
                    <div className="bg-black text-white p-1.5 rounded-lg">
                        <BrainCircuit size={18} />
                    </div>
                    <span className="font-bold text-lg tracking-tight">EduMind</span>
                </div>
                <div className="flex items-center gap-3">
                     <button className="p-2 text-stone-600 hover:bg-stone-100 rounded-full">
                         <Search size={20} onClick={() => setCurrentView('library')} />
                     </button>
                     <div className="w-8 h-8 rounded-full bg-stone-200"></div>
                </div>
            </div>


            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-white relative">
                
                {/* Desktop Top Bar */}
                <header className="hidden md:flex h-20 items-center justify-between px-10 border-b border-stone-50 flex-shrink-0">
                     <div className="flex items-center gap-4 w-full max-w-xl">
                         <div className="relative w-full group">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-black transition-colors" size={16} />
                             <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search your library..." 
                                className="w-full bg-stone-50 group-focus-within:bg-white border-none group-focus-within:ring-2 ring-stone-100 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium placeholder-stone-400 focus:outline-none transition-all"
                             />
                         </div>
                     </div>
                     <div className="flex items-center gap-4">
                         <div className="relative">
                            <button 
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 text-stone-400 hover:text-stone-900 transition-colors relative hover:bg-stone-50 rounded-full"
                            >
                                <Bell size={20} />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-64 bg-white border border-stone-100 shadow-xl rounded-xl p-2 z-50">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 px-2">Updates</p>
                                    <div className="p-2 hover:bg-stone-50 rounded-lg cursor-pointer text-sm">
                                        <p className="font-bold">Welcome!</p>
                                        <p className="text-xs text-stone-500">Your journey starts today.</p>
                                    </div>
                                </div>
                            )}
                         </div>
                         <button 
                            onClick={handleUpgradeClick}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                         >
                             <Sparkles size={16} /> Upgrade
                         </button>
                     </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-28 md:pb-10 custom-scrollbar">
                    
                    {currentView === 'library' && (
                        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 animate-fade-in-up">
                            
                            {/* Mobile Search */}
                            <div className="md:hidden">
                                 <div className="relative w-full">
                                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                                     <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..." 
                                        className="w-full bg-stone-50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-100"
                                     />
                                 </div>
                            </div>

                            {/* Upload Hero */}
                            <div className="text-center py-6 md:py-10">
                                <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-2">What do you want to learn?</h1>
                                <p className="text-sm md:text-base text-stone-500 mb-8 px-4">Paste a YouTube link or topic to create a new Study Set.</p>
                                
                                <div className="max-w-2xl mx-auto relative group px-2">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-teal-100 via-blue-100 to-purple-100 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                                    <div className="relative bg-white rounded-2xl shadow-xl p-2 flex items-center gap-2 transition-transform hover:scale-[1.01]">
                                        <div className="p-3 bg-stone-50 rounded-xl text-stone-400 hidden sm:block">
                                            <Plus size={24} />
                                        </div>
                                        <input 
                                            ref={importInputRef}
                                            value={importInput}
                                            onChange={(e) => setImportInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                                            disabled={isImporting}
                                            className="flex-1 bg-transparent border-none outline-none text-base md:text-lg font-medium placeholder-stone-300 min-w-0 pl-2 sm:pl-0" 
                                            placeholder="e.g., 'Photosynthesis' or paste a URL..."
                                        />
                                        <button 
                                            onClick={handleImport} 
                                            disabled={isImporting || !importInput.trim()}
                                            className="bg-black text-white px-4 md:px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {isImporting ? <Loader2 size={20} className="animate-spin" /> : 'Import'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold text-stone-900">Recent Study Sets</h2>
                                    <button onClick={() => setSearchQuery('')} className="text-sm font-bold text-stone-400 hover:text-stone-600">View All</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {/* Create New Card */}
                                    <div onClick={handleCreateNewClick} className="border-2 border-dashed border-stone-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-stone-400 cursor-pointer hover:border-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all min-h-[180px] group active:scale-95">
                                        <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Plus size={24}/></div>
                                        <span className="font-bold text-sm">Create New Study Set</span>
                                    </div>

                                    {/* Library Items */}
                                    {filteredLibrary.map((item) => (
                                        <div key={item.id} onClick={onStartChat} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between min-h-[180px] active:scale-[0.98] relative">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`p-2 rounded-lg ${item.type === 'video' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {item.type === 'video' ? <Play size={20} fill="currentColor" /> : <FileText size={20} />}
                                                    </div>
                                                    <button onClick={(e) => handleDelete(e, item.id)} className="p-1 hover:bg-stone-100 rounded-full text-stone-300 hover:text-red-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <h3 className="font-bold text-lg text-stone-900 leading-tight mb-2 line-clamp-2">{item.title}</h3>
                                                <div className="flex items-center gap-2 text-xs text-stone-400 font-medium">
                                                    <Clock size={12} /> {item.date} • {item.duration}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-6">
                                                <div className="flex justify-between text-xs font-bold text-stone-500 mb-2">
                                                    <span>Progress</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-black rounded-full" style={{width: `${item.progress}%`}}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {filteredLibrary.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
                                            <p className="mb-2 font-bold">Your library is empty.</p>
                                            <p className="text-sm">Create a study set above to get started!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'progress' && (
                        <div className="max-w-5xl mx-auto animate-fade-in-up space-y-8 pb-10">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-stone-900">Your Progress</h1>
                                    <p className="text-stone-500">Track your mastery and learning velocity.</p>
                                </div>
                                <div className="flex gap-2">
                                     <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm border border-orange-100">
                                         <Trophy size={16} /> {user.streak} Day Streak
                                     </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-white border border-stone-100 rounded-3xl p-6 md:p-8 shadow-sm">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-bold text-lg flex items-center gap-2"><TrendingUp size={20} className="text-teal-500"/> Learning Velocity</h3>
                                    </div>
                                    <div className="h-[250px] md:h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={history}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4"/>
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12}} dy={10}/>
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 12}} domain={[0, 100]} />
                                                <Tooltip 
                                                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                                                    itemStyle={{color: '#1c1917', fontWeight: 'bold'}}
                                                />
                                                <Area type="monotone" dataKey="score" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                        {history.every(h => h.score === 0) && (
                                            <div className="absolute inset-0 flex items-center justify-center text-sm text-stone-400">
                                                Start a quiz to see your velocity!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                                         <div className="absolute top-0 right-0 w-32 h-32 bg-stone-800 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                         <h3 className="text-lg font-bold mb-1 relative z-10">Total Mastery</h3>
                                         <p className="text-stone-400 text-sm mb-6 relative z-10">Based on BKT Analysis</p>
                                         <div className="text-5xl font-bold mb-4 relative z-10">{totalMastery}%</div>
                                         <div className="w-full bg-white/10 rounded-full h-2 relative z-10">
                                             <div className="bg-teal-400 h-full rounded-full transition-all duration-1000" style={{width: `${totalMastery}%`}}></div>
                                         </div>
                                    </div>

                                    <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
                                        <h3 className="font-bold mb-4">Focus Areas</h3>
                                        <div className="space-y-3">
                                            {metrics.length > 0 ? (
                                                metrics.slice(0, 3).map((m, i) => (
                                                    <div key={i} className="flex items-center justify-between text-sm">
                                                        <span className="text-stone-600 capitalize">{m.subject}</span>
                                                        <span className={`font-bold ${m.masteryLevel === 'Novice' ? 'text-stone-400' : m.masteryLevel === 'Expert' ? 'text-teal-500' : 'text-amber-500'}`}>{m.masteryLevel}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-stone-400 text-sm">No data yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* --- MOBILE BOTTOM NAV --- */}
            <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-stone-100 flex items-center justify-around py-3 px-2 z-30 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
                <BottomNavItem icon={LayoutGrid} label="Library" active={currentView === 'library'} onClick={() => setCurrentView('library')} />
                <BottomNavItem icon={PieIcon} label="Progress" active={currentView === 'progress'} onClick={() => setCurrentView('progress')} />
                <div className="relative -top-5">
                    <button 
                        onClick={handleCreateNewClick}
                        className="bg-black text-white p-4 rounded-full shadow-lg shadow-black/30 hover:scale-105 transition-transform"
                    >
                        <Plus size={24} />
                    </button>
                </div>
                <BottomNavItem icon={MessageSquare} label="Tutor" active={currentView === 'chat'} onClick={onStartChat} />
                <BottomNavItem icon={Settings} label="Settings" active={false} onClick={() => {}} />
            </div>

        </div>
    );
};
