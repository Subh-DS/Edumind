
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AssessmentResult, AnalysisType, Subject, QuizQuestion, ProgressMetric, Language, ConceptMapData, BehavioralMetrics } from '../types';

const API_KEY = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

if (!API_KEY) {
  console.error("CRITICAL: API Key is missing. Please set VITE_API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Audio Helper Utils ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const fileToGenerativePart = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getLanguageName = (code: Language) => {
    if (code === 'hi') return 'Hindi';
    if (code === 'or') return 'Odia';
    return 'English';
}

/**
 * 1. Neuro-Symbolic Assessment & Socratic Tutor
 */
export const analyzeLearningContent = async (
  content: string | File, 
  type: AnalysisType,
  subject: Subject,
  language: Language,
  useThinking: boolean = false,
  metrics: BehavioralMetrics = { timeToSubmit: 0, backspaceCount: 0, confidenceLevel: 'high' }
): Promise<AssessmentResult> => {

  const langName = getLanguageName(language);
  let modelName = 'gemini-3-flash-preview'; 
  
  const SYSTEM_INSTRUCTION = `
    You are EduMind, an advanced **Neuro-Symbolic Socratic Tutor**.
    
    **Goal**: Diagnose mastery using **Bayesian Knowledge Tracing (BKT)** principles based on answer and behavior.
    
    **Inputs**:
    - Answer: User's submission.
    - Latency: ${metrics.timeToSubmit}ms (Fast=Fluent/Impulsive, Slow=Thoughtful/Stuck).
    - Hesitation: ${metrics.backspaceCount} backspaces (High=Uncertainty).
    - Confidence: ${metrics.confidenceLevel} (Self-reported).

    **Algorithm**:
    1. **Check Correctness**: Is it factually/logically correct?
    2. **Detect Misconceptions**: Match against known fallacies in ${subject}. Label \`misconception_type\`.
    3. **Calculate p_known (Mastery Probability)**:
       - Start p_known = 0.5.
       - If Correct + High Confidence + Moderate Latency: p_known += 0.4.
       - If Correct + Low Confidence: p_known += 0.2 (Lucky Guess?).
       - If Incorrect + High Confidence: p_known -= 0.4 (Deep Misconception).
    4. **Socratic Output**:
       - **Never give the answer.**
       - p_known < 0.4: Scaffold with analogy.
       - p_known > 0.8: Challenge with advanced follow-up.
       - Misconception: Reveal contradiction. If \`misconception_detected\` is true, you MUST populate the \`remediation\` object with a concrete \`counter_example\` and a \`intervention\` strategy.

    **Tone**: Professional, encouraging, precise, in ${langName}.
  `;

  let config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    tools: [{ googleSearch: {} }],
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        mastery_score: { type: Type.INTEGER },
        p_known: { type: Type.NUMBER, description: "Bayesian probability (0.0-1.0)" },
        conceptual_understanding: { type: Type.STRING },
        misconception_detected: { type: Type.BOOLEAN },
        misconception_type: { type: Type.STRING },
        explanation: { type: Type.STRING },
        key_concepts: { type: Type.ARRAY, items: { type: Type.STRING } },
        follow_up_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommended_resources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    uri: { type: Type.STRING }
                }
            }
        },
        remediation: {
            type: Type.OBJECT,
            properties: {
                intervention: { type: Type.STRING, description: "Micro-learning intervention strategy." },
                counter_example: { type: Type.STRING, description: "A concrete example disproving the misconception." }
            }
        }
      }
    }
  };

  if (useThinking) {
      modelName = 'gemini-3-pro-preview';
      config.thinkingConfig = { thinkingBudget: 32768 };
  } else if (type === 'text') {
      modelName = 'gemini-flash-lite-latest';
  } else {
      modelName = 'gemini-3-flash-preview'; 
  }

  let promptContent: any;
  if (type === 'text') {
    promptContent = `Subject: ${subject}. Student Query: "${content as string}"`;
  } else {
    const base64Data = await fileToGenerativePart(content as File);
    promptContent = {
      parts: [
        { inlineData: { mimeType: (content as File).type, data: base64Data } },
        { text: `Subject: ${subject}. Analyze this. Explain step-by-step.` }
      ]
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptContent,
      config: config
    });

    const text = response.text;
    if (!text) throw new Error("No response from Tutor AI.");

    const result = JSON.parse(text) as AssessmentResult;
    result.key_concepts = result.key_concepts || [];
    result.follow_up_questions = result.follow_up_questions || [];
    result.recommended_resources = result.recommended_resources || [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    if (result.recommended_resources.length === 0 && chunks.length > 0) {
         result.recommended_resources = chunks
            .map((chunk: any) => chunk.web)
            .filter((web: any) => web)
            .map((web: any) => ({ title: web.title, uri: web.uri }))
            .slice(0, 3);
    }
    return result;
  } catch (error) {
    console.error("Gemini Tutor Error:", error);
    throw new Error("I couldn't analyze that. Please check your connection.");
  }
};

/**
 * 2. Adaptive Quiz Generation
 */
export const generateQuizQuestions = async (subject: Subject, difficulty: string, language: Language): Promise<QuizQuestion[]> => {
    const modelName = 'gemini-flash-lite-latest';
    const langName = getLanguageName(language);
    
    const prompt = `Generate 3 ${difficulty} level quiz questions for ${subject} in ${langName}. Adapt to user skill.`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            question: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["multiple_choice", "open_ended"] },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            difficulty: { type: Type.STRING },
                            topic: { type: Type.STRING },
                            hint: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const text = response.text;
        return JSON.parse(text || "[]") as QuizQuestion[];
    } catch (e) {
        console.error("Quiz Gen Error:", e);
        return [{ id: '1', question: 'Error loading quiz.', type: 'multiple_choice', options: ['Ok'], difficulty: 'Easy', topic: 'Error', hint: '' }];
    }
};

/**
 * 3. Generate Study Set Metadata (For Dashboard)
 */
export const generateStudySetMetadata = async (input: string): Promise<{title: string, type: 'video' | 'pdf' | 'article', duration: string, category: string}> => {
    const modelName = 'gemini-3-flash-preview';
    const prompt = `Analyze this input (which could be a URL, topic, or file name) and generate study set metadata. Input: "${input}"`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "A formal, academic title for the study set." },
                        type: { type: Type.STRING, enum: ["video", "pdf", "article"], description: "The likely format of the content." },
                        duration: { type: Type.STRING, description: "Estimated time to read/watch (e.g., '10 min', '5 pages')." },
                        category: { type: Type.STRING, description: "Academic subject or category." }
                    }
                }
            }
        });
        return JSON.parse(response.text || "{}") as any;
    } catch (e) {
        // Fallback if API fails
        return { 
            title: input.length > 20 ? input.substring(0, 20) + "..." : input, 
            type: 'article', 
            duration: 'Unknown',
            category: 'General'
        };
    }
};

export const getProgressAnalytics = async (): Promise<ProgressMetric[]> => {
    await new Promise(r => setTimeout(r, 1000));
    return [
        { subject: 'Mathematics', masteryLevel: 'Intermediate', hoursSpent: 12.5, quizzesTaken: 8, weakAreas: ['Calculus', 'Trigonometry'] },
        { subject: 'Science', masteryLevel: 'Advanced', hoursSpent: 20, quizzesTaken: 15, weakAreas: ['Quantum Physics'] },
        { subject: 'History', masteryLevel: 'Novice', hoursSpent: 3, quizzesTaken: 2, weakAreas: ['World War II dates'] },
    ];
};

export const generateTutorVoice = async (text: string, language: Language): Promise<AudioBuffer> => {
    const modelName = 'gemini-2.5-flash-preview-tts';
    let cleanText = text.replace(/[*_#`]/g, '').trim().substring(0, 297);
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text: `Explain: ${cleanText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("TTS generation failed.");
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        return pcmToAudioBuffer(decode(base64Audio), audioCtx, 24000, 1);
    } catch (e) { throw e; }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const modelName = 'gemini-flash-lite-latest';
    try {
        const base64Data = await fileToGenerativePart(audioBlob);
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { inlineData: { mimeType: audioBlob.type || 'audio/webm', data: base64Data } },
                    { text: "Transcribe exactly." }
                ]
            }
        });
        return response.text?.trim() || "";
    } catch (error) { throw new Error("Failed to transcribe."); }
};

export const generateConceptMap = async (topic: string, language: Language): Promise<ConceptMapData> => {
    const modelName = 'gemini-3-flash-preview'; 
    const langName = getLanguageName(language);
    const prompt = `Create a Concept Map for "${topic}" in ${langName}. Return nodes/edges JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        nodes: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    label: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['core', 'related', 'detail'] },
                                    x: { type: Type.NUMBER },
                                    y: { type: Type.NUMBER }
                                }
                            }
                        },
                        edges: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    source: { type: Type.STRING },
                                    target: { type: Type.STRING },
                                    label: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        return JSON.parse(response.text || "{}") as ConceptMapData;
    } catch (e) {
        return { nodes: [], edges: [] };
    }
}

export const chatWithTutor = async (history: {role: string, parts: {text: string}[]}[], message: string, metrics?: BehavioralMetrics): Promise<string> => {
    const modelName = 'gemini-3-pro-preview';
    
    // System Instruction for Professional Persona
    const SYSTEM_INSTRUCTION = `
        You are EduMind, a world-class academic tutor. 
        Your responses should be:
        1. **Professional & Socratic**: Don't just give answers. Guide the student with questions.
        2. **Concise**: Avoid fluff. Get straight to the educational value.
        3. **Encouraging but Formal**: Maintain a supportive yet academic tone.
        
        If provided with behavioral metrics (latency, backspaces), use them to gauge uncertainty.
        If confidence is low, break concepts down further.
    `;

    let contextualMessage = message;
    if (metrics) {
        contextualMessage += `\n[System: Latency=${metrics.timeToSubmit}ms, Backspaces=${metrics.backspaceCount}, Confidence=${metrics.confidenceLevel}]`;
    }

    try {
        const chat = ai.chats.create({
            model: modelName,
            history: history,
            config: { systemInstruction: SYSTEM_INSTRUCTION }
        });
        const result = await chat.sendMessage({ message: contextualMessage });
        return result.text || "";
    } catch (e) { return "I apologize, but I'm unable to process that request at the moment. Please try again."; }
}
