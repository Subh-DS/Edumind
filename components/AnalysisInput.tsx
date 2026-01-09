
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisType, Subject, Language, BehavioralMetrics } from '../types';
import { Image, UploadCloud, FileText, ArrowRight, Mic, Camera, Loader2, Book, Code, FlaskConical, Globe, Calculator, PenTool, BrainCircuit, Activity } from 'lucide-react';
import { transcribeAudio } from '../services/geminiService';
import { translations } from '../i18n';

interface AnalysisInputProps {
  onAnalyze: (content: string | File, type: AnalysisType, subject: Subject, useThinking: boolean, metrics: BehavioralMetrics) => void;
  isLoading: boolean;
  onStartLiveScan: () => void;
  language: Language;
}

export const AnalysisInput: React.FC<AnalysisInputProps> = ({ onAnalyze, isLoading, onStartLiveScan, language }) => {
  const t = translations[language].analysisInput;
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'voice' | 'camera'>('text');
  const [subject, setSubject] = useState<Subject>('general');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useThinking, setUseThinking] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'high'>('high');
  
  // Behavioral Metrics Sensors
  const startTimeRef = useRef<number>(Date.now());
  const backspaceCountRef = useRef<number>(0);
  const keystrokeCountRef = useRef<number>(0);
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
      startTimeRef.current = Date.now();
      backspaceCountRef.current = 0;
      keystrokeCountRef.current = 0;
  }, [activeTab]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (e.target.value.length < textContent.length) backspaceCountRef.current++;
      keystrokeCountRef.current++;
      setTextContent(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const getMetrics = (): BehavioralMetrics => ({
      timeToSubmit: Date.now() - startTimeRef.current,
      backspaceCount: backspaceCountRef.current,
      confidenceLevel: confidence,
      typingSpeed: keystrokeCountRef.current / Math.max(0.1, (Date.now() - startTimeRef.current) / 60000)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const metrics = getMetrics();
    if (activeTab === 'text' && textContent.trim()) {
      onAnalyze(textContent, 'text', subject, useThinking, metrics);
    } else if (activeTab === 'image' && selectedFile) {
      onAnalyze(selectedFile, 'image', subject, useThinking, metrics);
    } else if (activeTab === 'voice' && textContent.trim()) {
      onAnalyze(textContent, 'text', subject, useThinking, metrics);
    }
  };

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop());
            try {
                const text = await transcribeAudio(audioBlob);
                setTextContent(text);
                setActiveTab('text');
            } catch (err) { alert("Could not transcribe."); } 
            finally { setIsRecording(false); }
        };
        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) { alert("Microphone access denied."); }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();
  const isSubmitDisabled = isLoading || (activeTab === 'text' || activeTab === 'voice' ? !textContent.trim() : !selectedFile);

  const subjects: { value: Subject; label: string; icon: React.ReactNode }[] = [
    { value: 'math', label: 'Math', icon: <Calculator size={18} /> },
    { value: 'science', label: 'Science', icon: <FlaskConical size={18} /> },
    { value: 'history', label: 'History', icon: <Globe size={18} /> },
    { value: 'coding', label: 'Coding', icon: <Code size={18} /> },
    { value: 'literature', label: 'Lit/Arts', icon: <PenTool size={18} /> },
    { value: 'general', label: 'General', icon: <Book size={18} /> },
  ];

  return (
    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden animate-slide-up-fade hover-lift transition-all duration-500">
      <div className="p-8">
        <div className="flex bg-stone-50 p-1.5 rounded-2xl mb-8 backdrop-blur-sm">
          {['text', 'image', 'voice', 'camera'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === tab ? 'bg-white text-stone-900 shadow-lg shadow-stone-200/50 scale-[1.02]' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}>
                {tab === 'text' && <FileText size={18} />} {tab === 'image' && <Image size={18} />} {tab === 'voice' && <Mic size={18} />} {tab === 'camera' && <Camera size={18} />}
                <span className="capitalize hidden sm:inline">{t.tabs[tab as keyof typeof t.tabs]}</span>
             </button>
          ))}
        </div>

        {activeTab === 'camera' ? (
          <div className="text-center py-10 animate-fade-in">
             <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-700 animate-breathe shadow-inner"><Camera size={40} /></div>
             <h3 className="text-2xl font-bold mb-3 font-serif text-stone-900">{t.liveTitle}</h3>
             <button onClick={onStartLiveScan} className="w-full py-5 rounded-2xl font-bold text-white bg-stone-900 hover:bg-stone-800 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all btn-elastic"><Camera size={20} /> {t.openScannerBtn}</button>
          </div>
        ) : activeTab === 'voice' && isRecording ? (
           <div className="text-center py-16 cursor-pointer animate-fade-in" onClick={stopRecording}>
               <div className="relative w-28 h-28 bg-rose-500 rounded-full flex items-center justify-center shadow-xl mx-auto"><Mic size={48} className="text-white" /></div>
               <h3 className="text-xl font-bold mt-8 text-stone-900">{t.voice.recording}</h3>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="mb-8">
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 ml-1">{t.sourceLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {subjects.map((s) => (
                        <button key={s.value} type="button" onClick={() => setSubject(s.value)} className={`flex items-center gap-2 px-4 py-3.5 text-sm rounded-2xl transition-all duration-200 ${subject === s.value ? 'bg-stone-900 text-white font-bold shadow-lg scale-[1.02]' : 'bg-stone-50 text-stone-600 hover:bg-stone-100 font-medium'}`}>
                            {s.icon} {s.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${useThinking ? 'bg-indigo-50 border border-indigo-100' : 'bg-stone-50 border border-transparent'}`} onClick={() => setUseThinking(!useThinking)}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${useThinking ? 'bg-indigo-600 text-white' : 'bg-stone-200 text-stone-500'}`}><BrainCircuit size={20} /></div>
                        <div><div className="font-bold text-stone-900 text-sm">Deep Reasoning</div></div>
                    </div>
                </div>
                <div className={`p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors ${confidence === 'high' ? 'bg-teal-50 border border-teal-100' : 'bg-amber-50 border border-amber-100'}`} onClick={() => setConfidence(c => c === 'high' ? 'low' : 'high')}>
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${confidence === 'high' ? 'bg-teal-600 text-white' : 'bg-amber-500 text-white'}`}><Activity size={20} /></div>
                        <div><div className="font-bold text-stone-900 text-sm">Confidence</div></div>
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider text-stone-400">{confidence}</div>
                </div>
            </div>

            {activeTab === 'text' || activeTab === 'voice' ? (
                <div className="space-y-4">
                    <textarea value={textContent} onChange={handleTextChange} placeholder={t.textPlaceholder} className="w-full h-44 p-6 bg-stone-50 rounded-3xl focus:ring-2 focus:ring-stone-900 focus:outline-none resize-none text-stone-800 placeholder-stone-400 transition-all text-lg leading-relaxed shadow-inner" />
                    {activeTab === 'voice' && <button type="button" onClick={startRecording} className="w-full py-4 bg-white text-stone-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition-all shadow-sm hover:shadow-md btn-elastic"><Mic size={20} /> Tap to Speak Question</button>}
                </div>
            ) : (
                <div className="relative border-2 border-dashed border-stone-200 rounded-[2rem] p-12 hover:bg-stone-50/50 hover:border-stone-400 transition-all text-center cursor-pointer group">
                    {!selectedFile ? (
                        <>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-400 group-hover:scale-110 group-hover:bg-stone-100 group-hover:text-stone-600 transition-all duration-300"><UploadCloud size={32} /></div>
                            <p className="font-bold text-lg text-stone-700">{t.clickToUpload}</p>
                        </>
                    ) : (
                        <div className="flex items-center gap-6 bg-white p-4 rounded-2xl shadow-lg text-left">
                            <img src={previewUrl!} alt="Preview" className="w-24 h-24 rounded-xl object-cover shadow-sm" />
                            <div className="flex-1 min-w-0"><p className="font-bold text-stone-900 text-lg truncate">{selectedFile.name}</p><button type="button" onClick={() => setSelectedFile(null)} className="text-sm text-rose-500 hover:text-rose-700 font-bold mt-1 bg-rose-50 px-3 py-1 rounded-lg">Remove</button></div>
                        </div>
                    )}
                </div>
            )}

            <button type="submit" disabled={isSubmitDisabled} className={`w-full mt-8 py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 ${isSubmitDisabled ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-stone-900 hover:bg-stone-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 btn-elastic'}`}>{isLoading ? <Loader2 className="animate-spin" /> : <>{t.scanBtn} <ArrowRight size={20} /></>}</button>
          </form>
        )}
      </div>
    </div>
  );
};
