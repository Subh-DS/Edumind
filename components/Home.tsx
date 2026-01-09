
import React, { useState, useEffect } from 'react';
import { ArrowRight, Play, Upload, MessageSquare, FileText, Check, Search, Star, Zap, BrainCircuit, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n';
import { storage } from '../services/storageService';

interface HomeProps {
  onStart: () => void;
  onOpenRadar: () => void;
  onOpenEducation: () => void;
  onOpenSimulation: () => void;
  language: Language;
}

export const Home: React.FC<HomeProps> = ({ onStart, onOpenRadar }) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'pdf'>('youtube');
  const [demoInput, setDemoInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    if (storage.isAuthenticated()) {
        setIsAuthenticated(true);
    }
  }, []);

  const handleStart = () => {
    if (isAuthenticated) {
        onOpenRadar(); // Go directly to dashboard
    } else {
        onStart(); // Go to sign in
    }
  };

  const examples = [
    { icon: <Play size={14} />, text: "Andrew Huberman: Focus Tools" },
    { icon: <FileText size={14} />, text: "Intro to Quantum Mechanics.pdf" },
    { icon: <Play size={14} />, text: "Crash Course: World History" },
  ];

  return (
    <div className="font-sans text-stone-900 bg-white relative selection:bg-stone-200">
      
      {/* 1. Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <BrainCircuit size={24} className="text-black" />
            <span className="text-lg font-bold tracking-tight text-black">EduMind</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-stone-600 hover:text-black transition-colors">Features</a>
            <a href="#demo" className="text-sm font-medium text-stone-600 hover:text-black transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-stone-600 hover:text-black transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={handleStart} className="hidden sm:block text-sm font-medium text-stone-600 hover:text-black transition-colors">
                {isAuthenticated ? "Dashboard" : "Log in"}
            </button>
            <button 
                onClick={handleStart}
                className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-sm"
            >
              {isAuthenticated ? "Go to App" : "Sign up free"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-600 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            New: Gemini 2.0 Integration
        </div>
        
        <h1 className="animate-fade-in-up text-5xl sm:text-7xl font-bold tracking-tight mb-6 text-black leading-[1.1]">
          Do your homework <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-stone-500 to-black">10x faster.</span>
        </h1>
        
        <p className="animate-fade-in-up delay-100 text-lg sm:text-xl text-stone-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          EduMind watches videos and reads documents for you. <br className="hidden sm:block" />
          Get instant answers, summaries, and personalized tutoring.
        </p>

        {/* Input Simulation */}
        <div className="animate-fade-in-up delay-200 max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000"></div>
            <div className="relative bg-white rounded-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-stone-200 p-2 flex items-center transition-transform hover:scale-[1.01]">
                <div className="pl-4 text-stone-400">
                    {activeTab === 'youtube' ? <Play size={20} /> : <Upload size={20} />}
                </div>
                <input 
                    type="text" 
                    value={demoInput}
                    onChange={(e) => setDemoInput(e.target.value)}
                    placeholder="Paste a YouTube link or upload a PDF..." 
                    className="flex-1 bg-transparent border-none outline-none px-4 text-stone-800 placeholder-stone-400 h-10"
                />
                <button 
                    onClick={handleStart}
                    className="bg-black text-white p-2.5 rounded-full hover:bg-stone-800 transition-colors"
                >
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>

        {/* Examples */}
        <div className="animate-fade-in-up delay-300 mt-6 flex flex-wrap justify-center gap-3">
            {examples.map((ex, i) => (
                <button key={i} onClick={handleStart} className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full text-xs font-medium text-stone-600 transition-colors">
                    {ex.icon} {ex.text}
                </button>
            ))}
        </div>
      </section>

      {/* 3. Social Proof */}
      <section className="py-10 border-b border-stone-100 bg-stone-50/50">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-stone-400 mb-8">Trusted by students from</p>
          <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-40 grayscale">
             {/* Text-based logos as placeholders for trademarks */}
             <span className="font-serif font-bold text-xl">Harvard</span>
             <span className="font-serif font-bold text-xl">Stanford</span>
             <span className="font-serif font-bold text-xl">MIT</span>
             <span className="font-serif font-bold text-xl">Oxford</span>
             <span className="font-serif font-bold text-xl">Cambridge</span>
          </div>
      </section>

      {/* 4. Product Demo (The "Replica" Part) */}
      <section id="demo" className="py-24 px-4 sm:px-6 bg-white">
         <div className="max-w-6xl mx-auto">
             <div className="text-center mb-16">
                 <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Everything you need to learn.</h2>
                 <p className="text-stone-500 text-lg">Stop scrubbing through videos. Start chatting with them.</p>
             </div>

             <div className="relative rounded-2xl bg-stone-100 p-2 sm:p-4 border border-stone-200 shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-full bg-white/50 backdrop-blur-3xl rounded-2xl -z-10"></div>
                 
                 {/* Fake UI Container */}
                 <div className="bg-white rounded-xl overflow-hidden border border-stone-200 flex flex-col md:flex-row h-[600px] md:h-[700px]">
                     
                     {/* Left: Video / Content Area */}
                     <div className="md:w-3/5 bg-black relative flex items-center justify-center border-b md:border-b-0 md:border-r border-stone-200">
                         {/* Fake Video Player UI */}
                         <div className="absolute inset-0 bg-stone-900 opacity-50"></div>
                         <div className="relative z-10 text-center text-white">
                             <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 mx-auto cursor-pointer hover:scale-110 transition-transform">
                                 <Play size={32} fill="white" className="ml-1" />
                             </div>
                             <p className="font-medium text-sm">Introduction to Neuroscience</p>
                             <p className="text-xs text-white/60 mt-1">04:20 / 45:00</p>
                         </div>
                         {/* Fake Progress Bar */}
                         <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                             <div className="w-[15%] h-full bg-red-600"></div>
                         </div>
                     </div>

                     {/* Right: Chat / Notes Area */}
                     <div className="md:w-2/5 flex flex-col bg-white">
                         {/* Tabs */}
                         <div className="flex border-b border-stone-100">
                             <button className="flex-1 py-4 text-sm font-semibold border-b-2 border-black">Chat</button>
                             <button className="flex-1 py-4 text-sm font-medium text-stone-500 hover:text-stone-800">Transcript</button>
                             <button className="flex-1 py-4 text-sm font-medium text-stone-500 hover:text-stone-800">Notes</button>
                         </div>

                         {/* Chat Messages */}
                         <div className="flex-grow p-6 space-y-6 overflow-hidden relative">
                             {/* AI Message */}
                             <div className="flex gap-4">
                                 <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                     <BrainCircuit size={14} className="text-white" />
                                 </div>
                                 <div className="space-y-2">
                                     <p className="text-sm font-semibold">EduMind</p>
                                     <div className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg rounded-tl-none">
                                         Here's a summary of the key points about Neurons:
                                         <ul className="list-disc pl-4 mt-2 space-y-1">
                                             <li>Neurons transmit information via electrical impulses.</li>
                                             <li>Synapses are the gaps where chemical signals are exchanged.</li>
                                         </ul>
                                     </div>
                                 </div>
                             </div>

                             {/* User Message */}
                             <div className="flex gap-4 flex-row-reverse">
                                 <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                                     <span className="text-xs font-bold">You</span>
                                 </div>
                                 <div className="space-y-2 text-right">
                                     <div className="text-sm text-white leading-relaxed bg-black p-3 rounded-lg rounded-tr-none inline-block text-left">
                                         Can you explain "Action Potential" like I'm 5?
                                     </div>
                                 </div>
                             </div>

                             {/* AI Typing */}
                             <div className="flex gap-4">
                                 <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                                     <BrainCircuit size={14} className="text-white" />
                                 </div>
                                 <div className="space-y-2">
                                     <p className="text-sm font-semibold">EduMind</p>
                                     <div className="text-sm text-stone-600 leading-relaxed">
                                         <span className="inline-block w-2 h-2 bg-stone-400 rounded-full animate-bounce"></span>
                                         <span className="inline-block w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100 ml-1"></span>
                                         <span className="inline-block w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200 ml-1"></span>
                                     </div>
                                 </div>
                             </div>
                             
                             {/* Gradient Fade */}
                             <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                         </div>

                         {/* Input Area */}
                         <div className="p-4 border-t border-stone-100">
                             <div className="relative">
                                 <input disabled placeholder="Ask a follow up question..." className="w-full bg-stone-50 border border-stone-200 rounded-lg py-3 pl-4 pr-10 text-sm outline-none" />
                                 <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-stone-200 rounded-md">
                                     <ArrowRight size={14} className="text-stone-500" />
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* 6. Testimonial / CTA */}
      <section className="py-32 px-6 bg-white text-center">
          <div className="max-w-3xl mx-auto">
              <div className="flex justify-center mb-6 text-yellow-400 gap-1">
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
                  <Star fill="currentColor" size={20} />
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">"I literally learned a semester's worth of Biology in 3 days using this. It feels like cheating but it's not."</h2>
              <div className="flex items-center justify-center gap-4 mb-16">
                  <div className="w-12 h-12 bg-stone-200 rounded-full"></div>
                  <div className="text-left">
                      <p className="font-bold text-sm">Sarah Jenkins</p>
                      <p className="text-stone-500 text-xs">Pre-med Student at UCLA</p>
                  </div>
              </div>

              <div className="p-8 bg-stone-900 rounded-3xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-stone-800 rounded-full blur-[80px] opacity-50 -mr-10 -mt-10"></div>
                  <div className="relative z-10">
                      <h3 className="text-3xl font-bold mb-6">Ready to upgrade your brain?</h3>
                      <button 
                        onClick={onStart}
                        className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-stone-100 transition-colors shadow-xl"
                      >
                          Get Started for Free
                      </button>
                      <p className="mt-6 text-stone-400 text-sm">No credit card required.</p>
                  </div>
              </div>
          </div>
      </section>

    </div>
  );
};
