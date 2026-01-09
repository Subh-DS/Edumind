
import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, Trophy, Zap, Play, Lightbulb } from 'lucide-react';
import { Language, QuizQuestion } from '../types';
import { translations } from '../i18n';
import { generateQuizQuestions } from '../services/geminiService';
import { storage } from '../services/storageService';

interface Props { onBack: () => void; language: Language; }

export const AdaptiveQuiz: React.FC<Props> = ({ onBack, language }) => {
  const t = translations[language].simulation;
  const [state, setState] = useState<'intro' | 'loading' | 'playing' | 'result'>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const start = async () => {
      setState('loading');
      setScore(0);
      try {
          const qs = await generateQuizQuestions('science', difficulty, language);
          setQuestions(qs);
          setState('playing');
      } catch(e) { 
          // Error handling or mock data fallback
          setQuestions([{
              id: '1', question: 'What is the powerhouse of the cell?', type: 'multiple_choice', 
              options: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi Body'], 
              difficulty: 'Easy', topic: 'Biology', hint: 'Starts with M' 
          }]);
          setState('playing');
      }
  };

  const finishQuiz = (finalScore: number) => {
      // Calculate percentage based on 10 pts per question (mock logic)
      const maxScore = questions.length * 10;
      const percentage = Math.round((finalScore / maxScore) * 100);
      
      // Save to storage backend
      storage.recordQuizResult('Science', percentage);
      
      setState('result');
  };

  const handleAnswer = (option: string) => {
      const q = questions[index];
      const isCorrect = option === q.options?.[0]; // In real app, check against correct answer ID
      
      let newScore = score;
      if (isCorrect) {
          newScore += 10;
          setScore(newScore);
          setFeedback('correct');
          if (difficulty === 'Easy') setDifficulty('Medium');
      } else {
          setFeedback('wrong');
      }

      setTimeout(() => {
          setFeedback(null);
          if (index < questions.length - 1) {
              setIndex(i => i + 1);
          } else {
              finishQuiz(newScore);
          }
      }, 1500);
  };

  if (state === 'intro') return (
      <div className="max-w-md mx-auto py-16 text-center animate-slide-up-fade px-6">
          <div className="w-24 h-24 bg-stone-100 rounded-3xl mx-auto mb-8 flex items-center justify-center text-stone-700 animate-float"><Zap size={48} strokeWidth={1.5} /></div>
          <h1 className="text-3xl font-bold mb-4 font-serif text-stone-800">{t.title}</h1>
          <p className="text-stone-500 mb-10 text-lg">{t.subtitle}</p>
          <button onClick={start} className="w-full py-5 bg-stone-800 text-white font-bold rounded-2xl shadow-xl hover:bg-stone-700 transition-all flex justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"><Play size={20} /> {t.startBtn}</button>
          <button onClick={onBack} className="mt-6 text-stone-400 font-bold hover:text-stone-600 transition-colors">{t.back}</button>
      </div>
  );

  if (state === 'playing') return (
      <div className="max-w-md mx-auto py-8 px-4 h-full flex flex-col animate-fade-in">
          <div className="flex justify-between items-center mb-8">
              <span className="text-sm font-bold text-stone-400 tracking-wider">Q {index + 1}/{questions.length}</span>
              <span className="bg-stone-100 text-stone-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">{difficulty}</span>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 mb-6 flex-grow relative overflow-hidden">
             {feedback && <div className={`absolute inset-0 flex items-center justify-center bg-white/95 z-20 animate-fade-in ${feedback === 'correct' ? 'text-teal-500' : 'text-rose-500'}`}>{feedback === 'correct' ? <CheckCircle size={80} className="animate-scale-pulse" /> : <XCircle size={80} className="animate-shake-gentle" />}</div>}
             <h3 className="text-xl font-bold text-stone-800 mb-8 font-serif leading-relaxed">{questions[index].question}</h3>
             <div className="space-y-4">
                 {questions[index].options?.map((opt, i) => (
                     <button key={i} onClick={() => handleAnswer(opt)} className="w-full p-5 rounded-xl border border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white font-medium text-stone-700 transition-all text-left shadow-sm hover:shadow-md active:scale-[0.99]">{opt}</button>
                 ))}
             </div>
             {questions[index].hint && <div className="mt-8 flex items-start gap-3 text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100 animate-slide-up-fade"><Lightbulb size={18} className="mt-0.5 flex-shrink-0" /> <span className="leading-relaxed">Hint: {questions[index].hint}</span></div>}
          </div>
      </div>
  );

  return (
      <div className="max-w-md mx-auto py-16 text-center animate-pop-in px-6">
          <Trophy size={80} className="text-amber-400 mx-auto mb-6 animate-float" strokeWidth={1.5} />
          <h2 className="text-3xl font-bold font-serif text-stone-800">{t.winTitle}</h2>
          <div className="text-6xl font-black text-stone-800 my-8 tracking-tight">{score} <span className="text-2xl font-medium text-stone-400">pts</span></div>
          <button onClick={() => setState('intro')} className="w-full py-5 bg-stone-900 text-white font-bold rounded-2xl flex justify-center gap-2 shadow-lg hover:bg-stone-800 transition-all"><RefreshCw /> Play Again</button>
          <button onClick={onBack} className="mt-6 text-stone-400 font-bold hover:text-stone-600 transition-colors">{t.back}</button>
      </div>
  );
};
