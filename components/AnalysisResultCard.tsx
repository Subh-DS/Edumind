
import React, { useEffect, useState, useRef } from 'react';
import { AssessmentResult, Language, ChatMessage } from '../types';
import { CheckCircle, AlertTriangle, Lightbulb, RefreshCw, Volume2, Square, ExternalLink, Brain, ArrowRight, Send, MessageCircle, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { generateTutorVoice, chatWithTutor } from '../services/geminiService';
import { translations } from '../i18n';
import ReactMarkdown from 'react-markdown';

interface Props {
  result: AssessmentResult;
  onReset: () => void;
  language: Language;
}

export const AnalysisResultCard: React.FC<Props> = ({ result, onReset, language }) => {
  const t = translations[language].analysisResult;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const score = result.mastery_score;
  const color = score > 80 ? '#14b8a6' : score > 50 ? '#f59e0b' : '#f43f5e'; 
  
  const handlePlayAudio = async () => {
    if (isPlaying) { audioCtxRef.current?.close(); setIsPlaying(false); return; }
    setIsLoadingAudio(true);
    try {
        const buffer = await generateTutorVoice(result.explanation, language);
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
        setIsPlaying(true);
    } catch(e) { console.error(e); } finally { setIsLoadingAudio(false); }
  };

  const handleSendMessage = async () => {
      if (!input.trim()) return;
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
      setMessages(p => [...p, userMsg]);
      setInput('');
      setIsChatting(true);

      // Build History
      const history = messages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      // Add context
      history.unshift({ role: 'model', parts: [{ text: `Original Assessment: ${result.explanation}` }] });

      try {
        const responseText = await chatWithTutor(history, userMsg.text);
        const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
        setMessages(p => [...p, aiMsg]);
      } finally {
        setIsChatting(false);
      }
  };

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col lg:flex-row min-h-[600px] h-auto lg:h-[800px] animate-slide-up-fade">
      
      {/* Left Column: Assessment & Content */}
      <div className="lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-stone-100 h-auto lg:h-full lg:overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-10 bg-stone-50/50">
             <div className="flex justify-between items-start">
                <div>
                     <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${result.misconception_detected ? 'bg-rose-100 text-rose-800' : 'bg-teal-100 text-teal-800'}`}>
                        {result.misconception_detected ? t.misconception : t.mastery}
                     </div>
                     <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight font-serif">{result.conceptual_understanding}</h3>
                </div>
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={[{ val: score }, { val: 100 - score }]} innerRadius={24} outerRadius={36} startAngle={90} endAngle={-270} dataKey="val" cornerRadius={10}><Cell fill={color} stroke="none" /><Cell fill="#e7e5e4" stroke="none" /></Pie></PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-sm text-stone-800">{score}%</div>
                </div>
             </div>
          </div>

          <div className="p-6 sm:p-10 pt-6 space-y-8 flex-grow">
            
            {result.misconception_detected && result.remediation && (
                 <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl animate-fade-in shadow-sm">
                     <h4 className="flex items-center gap-2 text-amber-800 font-bold mb-4 text-lg">
                        <AlertTriangle size={20} className="text-amber-600"/> 
                        Correction Zone: {result.misconception_type || "Misconception Detected"}
                     </h4>
                     
                     <div className="grid gap-4">
                         <div className="bg-white/80 p-4 rounded-xl border border-amber-100">
                             <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
                                <Zap size={14} /> Counter Example
                             </div>
                             <p className="text-stone-800 font-medium leading-relaxed text-sm sm:text-base">
                                {result.remediation.counter_example}
                             </p>
                         </div>
                         
                         <div>
                             <div className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                <Lightbulb size={14} /> Intervention
                             </div>
                             <p className="text-stone-600 text-sm leading-relaxed">
                                {result.remediation.intervention}
                             </p>
                         </div>
                     </div>
                 </div>
            )}

            <div className="prose prose-stone prose-lg max-w-none">
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-100">
                    <h4 className="text-xs font-bold uppercase text-stone-400 flex items-center gap-2 tracking-widest"><Brain size={16}/> {t.explanation}</h4>
                    <button onClick={handlePlayAudio} disabled={isLoadingAudio} className="text-stone-500 hover:bg-stone-100 p-2.5 rounded-full transition-colors active:scale-90">
                        {isLoadingAudio ? <div className="w-4 h-4 border-2 border-stone-500 border-t-transparent animate-spin rounded-full" /> : isPlaying ? <Square size={18} fill="currentColor"/> : <Volume2 size={20} />}
                    </button>
                </div>
                <div className="text-stone-700 leading-relaxed font-medium text-base">
                    <ReactMarkdown>{result.explanation}</ReactMarkdown>
                </div>
            </div>

            {result.recommended_resources && result.recommended_resources.length > 0 && (
                 <div>
                    <h4 className="text-xs font-bold text-stone-400 uppercase mb-4 tracking-widest">Verified Sources</h4>
                    <div className="flex flex-col gap-2">
                        {result.recommended_resources.map((res, i) => (
                            <a key={i} href={res.uri} target="_blank" rel="noopener" className="flex items-center gap-3 bg-stone-50 px-4 py-3 rounded-xl text-sm font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all">
                                <ExternalLink size={14} /> <span className="truncate">{res.title}</span>
                            </a>
                        ))}
                    </div>
                 </div>
            )}
            
            <button onClick={onReset} className="w-full py-4 mt-4 flex items-center justify-center gap-2 text-stone-500 bg-white border border-stone-200 rounded-xl font-bold hover:bg-stone-50 transition-all">
              <RefreshCw size={18} /> {t.analyzeNew}
            </button>
          </div>
      </div>

      {/* Right Column: Socratic Chat */}
      <div className="lg:w-1/2 flex flex-col bg-stone-50/30 h-[500px] lg:h-full border-t lg:border-t-0">
          <div className="p-6 border-b border-stone-100 bg-white">
              <h4 className="font-bold text-stone-800 flex items-center gap-2"><MessageCircle size={18}/> Tutor Chat</h4>
              <p className="text-xs text-stone-500">Ask clarifying questions to deepen your understanding.</p>
          </div>

          <div className="flex-grow p-6 overflow-y-auto space-y-4">
              {messages.length === 0 && (
                  <div className="text-center py-10 opacity-50">
                      <MessageCircle size={40} className="mx-auto mb-4 text-stone-300"/>
                      <p className="text-sm">Start the conversation.<br/>Try: "Can you give me an analogy?"</p>
                  </div>
              )}
              {messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-black text-white rounded-tr-sm' : 'bg-white text-stone-800 rounded-tl-sm border border-stone-100'}`}>
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                  </div>
              ))}
              {isChatting && <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-stone-100"><div className="flex gap-1"><div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"/><div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"/><div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"/></div></div></div>}
              <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-stone-100">
              {result.follow_up_questions.length > 0 && messages.length === 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                      {result.follow_up_questions.map((q, i) => (
                          <button key={i} onClick={() => { setInput(q); handleSendMessage(); }} className="whitespace-nowrap px-4 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-full text-xs font-bold text-stone-600 transition-colors">
                              {q}
                          </button>
                      ))}
                  </div>
              )}
              <div className="relative">
                  <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a follow up question..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
                  />
                  <button onClick={handleSendMessage} disabled={!input.trim() || isChatting} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-all">
                      <Send size={16} />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};
