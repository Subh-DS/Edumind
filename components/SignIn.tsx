
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BrainCircuit, Mail, Lock, ArrowRight, Chrome, User, AlertCircle, CheckCircle } from 'lucide-react';
import { storage } from '../services/storageService';

interface SignInProps {
  onBack: () => void;
  onSignIn: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onBack, onSignIn }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const validate = () => {
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Please enter a valid email address.";
      if (password.length < 6) return "Password must be at least 6 characters.";
      if (isSignUp && name.length < 2) return "Please enter your full name.";
      return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const validationError = validate();
    if (validationError) {
        setError(validationError);
        return;
    }

    setIsLoading(true);
    
    // Simulate network delay for realism
    setTimeout(() => {
        let result;
        if (isSignUp) {
            result = storage.registerUser(name, email, password);
        } else {
            result = storage.loginUser(email, password);
        }

        setIsLoading(false);

        if (result.success) {
            setSuccessMsg("Success! Redirecting...");
            setTimeout(() => onSignIn(), 800);
        } else {
            setError(result.message || "An error occurred.");
        }
    }, 1000);
  };

  // Switch modes clears errors
  useEffect(() => { setError(null); setSuccessMsg(null); }, [isSignUp]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-white">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-100/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-grid-dots opacity-[0.25]"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-slide-up-fade">
        
        <button 
          onClick={onBack} 
          className="mb-8 flex items-center gap-2 text-stone-500 font-bold hover:text-stone-900 transition-colors group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:-translate-x-1 transition-transform border border-stone-100">
            <ArrowLeft size={20} />
          </div>
          <span>Back to Home</span>
        </button>

        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 rounded-2xl mb-6 shadow-xl text-white transition-transform duration-500 hover:rotate-12">
              <BrainCircuit size={32} />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 mb-2 font-serif">
                {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-stone-500 text-sm font-medium">
                {isSignUp ? "Start your personalized learning journey." : "Sign in to verify your identity."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={16} /> {error}
                </div>
            )}
            {successMsg && (
                <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in">
                    <CheckCircle size={16} /> {successMsg}
                </div>
            )}

            {isSignUp && (
                <div className="space-y-1 animate-fade-in-up">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-800 transition-colors" size={20} />
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-stone-50 rounded-2xl py-4 pl-14 pr-6 text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all border border-transparent focus:border-stone-200"
                        />
                    </div>
                </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-800 transition-colors" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-stone-50 rounded-2xl py-4 pl-14 pr-6 text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all border border-transparent focus:border-stone-200"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-800 transition-colors" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-stone-50 rounded-2xl py-4 pl-14 pr-6 text-stone-900 font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all border border-transparent focus:border-stone-200"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-stone-900 text-white font-bold py-5 rounded-2xl shadow-xl shadow-stone-900/20 hover:shadow-stone-900/30 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 group mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                    {isSignUp ? "Create Account" : "Sign In"} 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-stone-400 font-medium">
            {isSignUp ? "Already have an account?" : "Don't have an account?"} 
            <button 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-stone-900 hover:underline decoration-2 ml-1 font-bold"
            >
                {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
