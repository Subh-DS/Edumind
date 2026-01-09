
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MessageCircle, User, Bot, Sparkles, Activity } from 'lucide-react';
import { ChatMessage, Language, BehavioralMetrics } from '../types';
import { chatWithTutor } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Props { onBack: () => void; language: Language; }

export const ChatBot: React.FC<Props> = ({ onBack, language }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Behavioral Metrics
  const startTimeRef = useRef<number>(Date.now());
  const backspaceCountRef = useRef<number>(0);
  const [confidence, setConfidence] = useState<'high' | 'low'>('high');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length < input.length) backspaceCountRef.current++;
      if (input.length === 0 && e.target.value.length > 0) startTimeRef.current = Date.now();
      setInput(e.target.value);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const metrics: BehavioralMetrics = {
        timeToSubmit: Date.now() - startTimeRef.current,
        backspaceCount: backspaceCountRef.current,
        confidenceLevel: confidence
    };
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now(), metrics };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    // Reset Metrics
    backspaceCountRef.current = 0;
    startTimeRef.current = Date.now();

    try {
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const responseText = await chatWithTutor(history, userMsg.text, metrics);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) { console.error("Chat error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-6rem)] py-2 md:py-6 px-4 animate-slide-up-fade flex flex-col">
       {/* Header */}
       <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex-shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-500 hover:text-stone-900"><ArrowLeft size={20} /></button>
              <div>
                  <h2 className="text-xl font-bold text-stone-900 font-serif flex items-center gap-2"><Sparkles size={18} className="text-indigo-500"/> AI Tutor Chat</h2>
                  <p className="text-xs text-stone-500 font-medium hidden sm:block">Powered by Gemini • Professional Socratic Mode</p>
              </div>
          </div>
          <button onClick={() => setConfidence(c => c === 'high' ? 'low' : 'high')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center gap-2 ${confidence === 'high' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <Activity size={12}/> {confidence === 'high' ? 'Confident' : 'Unsure'}
          </button>
       </div>

       {/* Chat Window */}
       <div className="flex-grow bg-white rounded-[2rem] shadow-xl border border-stone-100 overflow-hidden flex flex-col relative">
           <div className="absolute inset-0 bg-grid-dots opacity-[0.1] pointer-events-none"></div>
           
           <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
               {messages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                       <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-6 text-stone-400">
                           <MessageCircle size={32} />
                       </div>
                       <h3 className="text-xl font-bold text-stone-800 mb-2">Academic Guidance</h3>
                       <p className="max-w-xs text-stone-500 text-sm leading-relaxed">I am here to help you understand complex topics through Socratic questioning. What are you studying?</p>
                   </div>
               )}
               
               {messages.map((m) => (
                   <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-indigo-600'}`}>
                               {m.role === 'user' ? <User size={14}/> : <Bot size={16}/>}
                           </div>
                           <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white rounded-tr-sm' : 'bg-stone-50 text-stone-800 border border-stone-100 rounded-tl-sm'}`}>
                               <ReactMarkdown>{m.text}</ReactMarkdown>
                           </div>
                       </div>
                   </div>
               ))}
               
               {loading && (
                   <div className="flex justify-start animate-fade-in">
                        <div className="bg-stone-50 border border-stone-100 p-5 rounded-3xl rounded-tl-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                   </div>
               )}
               <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-stone-100 relative z-20">
               <div className="relative flex items-center gap-2">
                   <input 
                    value={input} 
                    onChange={handleInputChange} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder="Ask a question..." 
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-medium" 
                   />
                   <button 
                    onClick={handleSend} 
                    disabled={!input.trim() || loading} 
                    className="absolute right-2 p-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                   >
                       <Send size={18} />
                   </button>
               </div>
           </div>
       </div>
    </div>
  );
};
