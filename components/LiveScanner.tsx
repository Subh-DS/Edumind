
import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, Video, Loader2, BookOpen, BrainCircuit } from 'lucide-react';
import { translations } from '../i18n';
import { Language } from '../types';

interface Props { onClose: () => void; language?: Language; }

function decode(base64: string) { return Uint8Array.from(atob(base64), c => c.charCodeAt(0)); }
function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
  const int16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(numChannels, int16.length / numChannels, sampleRate);
  for (let c = 0; c < numChannels; c++) {
      const ch = buffer.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) ch[i] = int16[i * numChannels + c] / 32768.0;
  }
  return buffer;
}
function createBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for(let i=0; i<data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise(r => { const rd = new FileReader(); rd.onloadend = () => r((rd.result as string).split(',')[1]); rd.readAsDataURL(blob); });
}

export const LiveScanner: React.FC<Props> = ({ onClose, language = 'en' }) => {
  const t = translations[language].liveScanner;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  
  useEffect(() => {
    let session: any;
    let stream: MediaStream;
    let interval: number;
    let audioCtx: AudioContext;
    let inCtx: AudioContext;

    const start = async () => {
        setStatus('connecting');
        try {
            const API_KEY = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: { sampleRate: 16000, echoCancellation: true } });
            if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }

            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('connected');
                        // Audio In
                        const src = inCtx.createMediaStreamSource(stream);
                        const proc = inCtx.createScriptProcessor(2048, 1, 1);
                        proc.onaudioprocess = (e) => sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(e.inputBuffer.getChannelData(0)) }));
                        src.connect(proc); proc.connect(inCtx.destination);
                        
                        // Video In
                        const cvs = document.createElement('canvas');
                        interval = window.setInterval(async () => {
                            if (!videoRef.current) return;
                            cvs.width = videoRef.current.videoWidth; cvs.height = videoRef.current.videoHeight;
                            cvs.getContext('2d')?.drawImage(videoRef.current, 0, 0);
                            cvs.toBlob(async b => b && sessionPromise.then(s => blobToBase64(b).then(d => s.sendRealtimeInput({ media: { data: d, mimeType: 'image/jpeg' }}))), 'image/jpeg', 0.5);
                        }, 2000);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (data) {
                            setAiSpeaking(true);
                            const buf = await decodeAudioData(decode(data), audioCtx, 24000, 1);
                            const src = audioCtx.createBufferSource();
                            src.buffer = buf; src.connect(audioCtx.destination);
                            src.onended = () => setAiSpeaking(false);
                            src.start();
                        }
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: "You are a friendly Homework Helper. Look at the video. If you see a math problem or diagram, explain how to solve it step-by-step. Be concise and encouraging."
                }
            });
            session = sessionPromise;
        } catch (e) { setStatus('error'); }
    };
    start();
    return () => { stream?.getTracks().forEach(t => t.stop()); clearInterval(interval); audioCtx?.close(); inCtx?.close(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900 flex flex-col">
       <div className="absolute top-0 w-full p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-3 text-white"><BookOpen size={20} /> <span className="font-bold tracking-wide">Homework Helper</span></div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X size={24} /></button>
       </div>
       <video ref={videoRef} className="w-full h-full object-cover opacity-90" muted playsInline />
       
       <div className="absolute bottom-12 left-0 w-full flex justify-center">
           {status === 'connecting' && <div className="bg-stone-900/80 backdrop-blur-md text-white px-8 py-4 rounded-full flex gap-3 font-medium animate-pulse"><Loader2 className="animate-spin" /> Connecting Tutor...</div>}
           {status === 'connected' && (
               <div className={`px-8 py-4 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-4 transition-all duration-500 shadow-2xl ${aiSpeaking ? 'bg-stone-800/90 scale-105 border-white/30' : 'bg-black/50'}`}>
                   {aiSpeaking ? <BrainCircuit className="text-teal-400 animate-pulse" /> : <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" />}
                   <span className="text-white font-bold tracking-wide">{aiSpeaking ? "Explaining..." : "Watching..."}</span>
               </div>
           )}
       </div>
    </div>
  );
};
