

export type AnalysisType = 'text' | 'image' | 'voice';

export type Subject = 'math' | 'science' | 'history' | 'coding' | 'literature' | 'general';

export type Language = 'en' | 'hi' | 'or';

export interface LibraryItem {
    id: number;
    title: string;
    type: 'video' | 'pdf' | 'article';
    date: string;
    duration: string;
    progress: number;
    category?: string;
}

export interface BehavioralMetrics {
  timeToSubmit: number; // milliseconds
  backspaceCount: number; // hesitation signal
  confidenceLevel: 'low' | 'high'; // self-reported
  typingSpeed?: number; // chars per minute
}

export interface AssessmentResult {
  mastery_score: number; // 0-100 (Visible score)
  p_known: number; // 0.0 - 1.0 (Bayesian Mastery Probability)
  conceptual_understanding: string;
  misconception_detected: boolean;
  misconception_type?: string; // e.g. "Ontological", "Factual"
  explanation: string;
  key_concepts: string[];
  follow_up_questions: string[]; // Socratic follow-ups
  recommended_resources: { title: string; uri: string }[]; // RAG results
  remediation?: {
    intervention: string;
    counter_example: string;
  };
}

export interface ProgressMetric {
  subject: string;
  masteryLevel: 'Novice' | 'Intermediate' | 'Advanced' | 'Expert';
  hoursSpent: number;
  quizzesTaken: number;
  weakAreas: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options?: string[]; // If multiple choice
  type: 'multiple_choice' | 'open_ended';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  hint: string; // Scaffolding
}

// Concept Map Types
export interface ConceptNode {
    id: string;
    label: string;
    type: 'core' | 'related' | 'detail';
    x: number; // 0-100 percentage
    y: number; // 0-100 percentage
    mastery?: number; // 0-100 for heatmap
}

export interface ConceptEdge {
    source: string;
    target: string;
    label?: string;
}

export interface ConceptMapData {
    nodes: ConceptNode[];
    edges: ConceptEdge[];
}

// Chat Interface Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    metrics?: BehavioralMetrics;
}

export type ViewState = 'home' | 'signin' | 'learn' | 'dashboard' | 'concepts' | 'quiz' | 'chat';