
import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { SignIn } from './components/SignIn';
import { LiveScanner } from './components/LiveScanner';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ConceptMap } from './components/ConceptMap';
import { AdaptiveQuiz } from './components/AdaptiveQuiz';
import { ChatBot } from './components/ChatBot';
import { TutorPage } from './components/TutorPage';
import { Language, ViewState } from './types';
import { ChevronLeft, Minus, Plus, Type, BrainCircuit } from 'lucide-react';
import { translations } from './i18n';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [fontSizePercent, setFontSizePercent] = useState(100);

  const t = translations[language];

  // Accessibility: Font Scaling
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSizePercent}%`;
  }, [fontSizePercent]);

  const navigateToHome = () => {
    setView('home');
  };

  return (
    <div className={`flex flex-col bg-white font-sans text-stone-900 ${view === 'dashboard' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Multimodal Tutor Overlay */}
      {isLiveScanning && (
        <LiveScanner onClose={() => setIsLiveScanning(false)} language={language} />
      )}

      {/* Global Header - Hidden on Home, SignIn, AND Dashboard Views (Dashboard has its own layout) */}
      {view !== 'home' && view !== 'signin' && view !== 'dashboard' && (
        <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300 border-b border-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <button 
              onClick={() => setView('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-all active:scale-95 group"
            >
              <div className="text-black bg-stone-100 p-2 rounded-xl">
                <BrainCircuit size={20} />
              </div>
              <h1 className="text-lg font-extrabold text-black tracking-tight flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                  <span>EduMind</span>
              </h1>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Accessibility Controls */}
              <div className="hidden sm:flex items-center gap-1 bg-stone-50 rounded-lg p-1 mr-1">
                  <button onClick={() => setFontSizePercent(p => Math.max(85, p - 10))} className="p-2 text-stone-500 hover:text-black rounded-md transition-colors"><Minus size={14} /></button>
                  <div className="w-px h-4 bg-stone-200 mx-1"></div>
                  <button onClick={() => setFontSizePercent(100)} className="p-2 text-stone-500 hover:text-black rounded-md font-bold text-xs transition-colors"><Type size={14} /></button>
                  <div className="w-px h-4 bg-stone-200 mx-1"></div>
                  <button onClick={() => setFontSizePercent(p => Math.min(125, p + 10))} className="p-2 text-stone-500 hover:text-black rounded-md transition-colors"><Plus size={14} /></button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-stone-50 rounded-lg p-1">
                  <button onClick={() => setLanguage('en')} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'en' ? 'bg-white text-black shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>EN</button>
                  <button onClick={() => setLanguage('hi')} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'hi' ? 'bg-white text-black shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>HI</button>
                  <button onClick={() => setLanguage('or')} className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'or' ? 'bg-white text-black shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>OR</button>
              </div>

              <nav>
                <button onClick={() => setView('dashboard')} className="text-sm font-medium text-stone-500 hover:text-black transition-colors flex items-center gap-1 ml-2">
                  <ChevronLeft size={16} /> <span className="hidden sm:inline">Dashboard</span>
                </button>
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {view === 'home' ? (
          <Home 
            onStart={() => setView('signin')} 
            onOpenRadar={() => setView('dashboard')}
            onOpenEducation={() => setView('concepts')}
            onOpenSimulation={() => setView('quiz')}
            language={language}
          />
        ) : view === 'signin' ? (
          <SignIn onBack={navigateToHome} onSignIn={() => setView('dashboard')} />
        ) : view === 'dashboard' ? (
          <ProgressDashboard 
            onBack={navigateToHome} 
            onStartLearning={() => setView('learn')} 
            onViewConcept={() => setView('concepts')}
            onStartChat={() => setView('chat')}
            language={language} 
          /> 
        ) : view === 'concepts' ? (
          <ConceptMap onBack={() => setView('dashboard')} language={language} /> 
        ) : view === 'quiz' ? (
          <AdaptiveQuiz onBack={() => setView('dashboard')} language={language} /> 
        ) : view === 'chat' ? (
          <ChatBot onBack={() => setView('dashboard')} language={language} />
        ) : (
          <TutorPage 
            onBack={() => setView('dashboard')} 
            language={language} 
            onStartLiveScan={() => setIsLiveScanning(true)} 
          />
        )}
      </main>

      {/* Footer */}
      {(view === 'home') && (
        <footer className="bg-white py-12 mt-auto border-t border-stone-50">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="text-black bg-stone-100 p-3 rounded-2xl">
                  <BrainCircuit size={24} />
              </div>
            </div>
            <p className="text-black font-extrabold mb-2 text-lg">EduMind</p>
            <p className="text-stone-500 text-sm mb-6 max-w-md mx-auto">A calm, adaptive learning environment powered by Google Gemini. Designed for focus.</p>
            <p className="text-xs text-stone-400">© {new Date().getFullYear()} EduMind AI.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
