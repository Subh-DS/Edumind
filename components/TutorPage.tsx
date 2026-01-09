
import React, { useState, useCallback } from 'react';
import { AnalysisInput } from './AnalysisInput';
import { AnalysisResultCard } from './AnalysisResultCard';
import { ConceptCarousel } from './ConceptCarousel';
import { AssessmentResult, AnalysisType, Subject, Language, BehavioralMetrics } from '../types';
import { analyzeLearningContent } from '../services/geminiService';
import { ArrowLeft, Globe, X } from 'lucide-react';

interface TutorPageProps {
  onBack: () => void;
  language: Language;
  onStartLiveScan: () => void;
}

export const TutorPage: React.FC<TutorPageProps> = ({ onBack, language, onStartLiveScan }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(async (
    content: string | File, 
    type: AnalysisType, 
    subject: Subject, 
    useThinking: boolean, 
    metrics: BehavioralMetrics
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await analyzeLearningContent(content, type, subject, language, useThinking, metrics);
      setResult(data);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Could not analyze the content.");
    } finally {
      setLoading(false);
    }
  }, [language]);

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in-up overflow-x-hidden">
       <button onClick={onBack} className="mb-6 flex items-center gap-2 text-stone-500 font-semibold hover:text-black transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
       </button>

       <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-black tracking-tight">
              {language === 'en' ? 'Personal Tutor' : language === 'hi' ? 'व्यक्तिगत शिक्षक' : 'ବ୍ୟକ୍ତିଗତ ଶିକ୍ଷକ'}
            </h2>
            <p className="text-stone-500 mt-1 font-medium text-sm">
              {language === 'en' ? 'Socratic guidance using Bayesian Knowledge Tracing.' : 'पूछताछ और मार्गदर्शन।'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-stone-500 bg-stone-50 px-3 py-1.5 rounded-full shadow-sm">
             <Globe size={14} /> Subject: General
          </div>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input */}
        <div className="lg:col-span-4 space-y-6">
          <AnalysisInput 
            onAnalyze={handleAnalysis} 
            isLoading={loading} 
            onStartLiveScan={onStartLiveScan}
            language={language}
          />
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-8">
           {error && (
            <div className="bg-red-50 rounded-2xl p-6 mb-8 flex items-start gap-4 animate-fade-in-up">
              <div className="bg-red-100 text-red-600 p-3 rounded-full flex-shrink-0"><X size={24} /></div>
              <div>
                 <h3 className="text-lg font-bold text-red-900">Learning Blocked</h3>
                 <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-[2rem] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center min-h-[500px] text-center animate-pulse">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-stone-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-black rounded-full animate-spin border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-bold text-black">Thinking Socratic...</h3>
              <p className="text-stone-500 mt-2 max-w-xs mx-auto">Analyzing logic, checking behavioral signals, and formulating guidance.</p>
            </div>
          ) : result ? (
            <AnalysisResultCard result={result} onReset={resetAnalysis} language={language} />
          ) : (
            <ConceptCarousel language={language} />
          )}
        </div>
      </div>
    </div>
  );
};
