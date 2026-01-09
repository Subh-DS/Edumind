
import React from 'react';
import { Atom } from 'lucide-react';

export const ConceptCarousel: React.FC<{ language: any }> = () => (
    <div className="bg-white rounded-[2rem] p-12 text-center min-h-[400px] flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-fade-in hover-lift">
        <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center text-stone-800 mb-8 animate-breathe shadow-inner"><Atom size={48} strokeWidth={1.5} /></div>
        <h3 className="text-3xl font-bold text-stone-900 mb-6 font-serif">Did You Know?</h3>
        <p className="text-stone-500 max-w-lg mx-auto text-xl leading-relaxed font-medium">Electrons behave as both particles and waves. This duality is the fundamental mystery of Quantum Mechanics.</p>
    </div>
);
