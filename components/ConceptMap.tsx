
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, ZoomIn, Share2 } from 'lucide-react';
import { Language, ConceptMapData } from '../types';
import { generateConceptMap } from '../services/geminiService';

interface Props { 
    onBack: () => void; 
    language: Language;
    initialTopic?: string;
}

export const ConceptMap: React.FC<Props> = ({ onBack, language, initialTopic = "Computer Science" }) => {
    const [topic, setTopic] = useState(initialTopic);
    const [data, setData] = useState<ConceptMapData | null>(null);
    const [loading, setLoading] = useState(false);

    const loadMap = async () => {
        setLoading(true);
        try {
            const mapData = await generateConceptMap(topic, language);
            setData(mapData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMap(); }, [topic]);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-slide-up-fade h-screen flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 transition-colors"><ArrowLeft size={20} /> Back</button>
                <h2 className="text-2xl font-bold text-stone-900 font-serif">Concept Map: {topic}</h2>
                <div className="flex gap-2">
                     <button onClick={loadMap} className="p-2 bg-stone-100 rounded-lg hover:bg-stone-200"><RefreshCw size={18}/></button>
                </div>
            </div>
            
            <div className="flex-grow bg-stone-900 rounded-[2rem] p-4 relative overflow-hidden shadow-2xl border border-stone-800 flex items-center justify-center">
                 <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:32px_32px] pointer-events-none" />
                 
                 {loading ? (
                     <div className="text-white flex flex-col items-center gap-4">
                         <Loader2 size={40} className="animate-spin text-teal-400" />
                         <p className="font-mono text-sm opacity-70">Generating Knowledge Graph...</p>
                     </div>
                 ) : data ? (
                    <svg className="w-full h-full relative z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Edges */}
                        {data.edges?.map((edge, i) => {
                            const src = data.nodes?.find(n => n.id === edge.source);
                            const trg = data.nodes?.find(n => n.id === edge.target);
                            if (!src || !trg) return null;
                            return (
                                <g key={i}>
                                    <line 
                                        x1={src.x} y1={src.y} 
                                        x2={trg.x} y2={trg.y} 
                                        stroke="#57534e" 
                                        strokeWidth="0.5" 
                                        className="opacity-50"
                                    />
                                </g>
                            );
                        })}

                        {/* Nodes */}
                        {data.nodes?.map((node, i) => (
                            <g key={i} className="group cursor-pointer">
                                <circle 
                                    cx={node.x} cy={node.y} 
                                    r={node.type === 'core' ? 6 : node.type === 'related' ? 4 : 2} 
                                    fill={node.type === 'core' ? '#14b8a6' : node.type === 'related' ? '#f59e0b' : '#a8a29e'} 
                                    className="transition-all duration-300 group-hover:r-[8]"
                                />
                                <foreignObject x={node.x - 10} y={node.y + 2} width="20" height="10">
                                    <div className="text-[3px] text-center text-white font-bold bg-black/50 rounded px-1 backdrop-blur-sm truncate">
                                        {node.label}
                                    </div>
                                </foreignObject>
                            </g>
                        ))}
                    </svg>
                 ) : null}

                 {/* Interactive Search Overlay */}
                 <div className="absolute bottom-6 left-6 right-6 flex justify-center">
                     <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl flex items-center gap-2 border border-white/10 w-full max-w-md">
                         <input 
                            type="text" 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadMap()}
                            className="bg-transparent text-white placeholder-white/50 w-full px-4 py-2 outline-none font-medium" 
                            placeholder="Type a concept to explore..."
                        />
                         <button onClick={loadMap} className="bg-teal-500 hover:bg-teal-400 text-black p-2 rounded-xl font-bold transition-colors">
                            <ZoomIn size={18} />
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};
