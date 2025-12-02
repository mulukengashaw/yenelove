import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { XIcon, MicIcon, VideoIcon, PhoneIcon, GlobeIcon } from './Icons';
import { createPcmBlob, decodeAudioData, blobToBase64, base64ToUint8Array } from '../utils/audioUtils';
import { LiveConnectionState } from '../types';

interface LiveCallInterfaceProps {
  onClose: () => void;
  isOpen: boolean;
  contactName: string;
  contactBio?: string;
  voiceName?: string;
}

const FRAME_RATE = 10;
const JPEG_QUALITY = 0.8;

export const LiveCallInterface: React.FC<LiveCallInterfaceProps> = ({ 
  onClose, 
  isOpen, 
  contactName,
  contactBio = "You are a helpful AI assistant.",
  voiceName = "Kore"
}) => {
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(LiveConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isTranslationMode, setIsTranslationMode] = useState(false);
  const [captionText, setCaptionText] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      stopSession();
    }
    return () => stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const stopSession = () => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close()).catch(() => {});
        sessionPromiseRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    
    // Clear audio sources
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    setConnectionState(LiveConnectionState.DISCONNECTED);
    setShowConfirmDialog(false);
    setIsTranslationMode(false);
    setCaptionText("");
  };

  const startSession = async () => {
    setConnectionState(LiveConnectionState.CONNECTING);
    setError(null);
    setCaptionText("");

    try {
      // 1. Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // 2. Get Media Stream (Video + Audio)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // 3. Initialize GenAI Client
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_API_KEY });
      
      const systemInstruction = `You are ${contactName}, an Ethiopian/Habesha person. ${contactBio}. 
      You are on a video call. 
      Speak with a warm tone. Use occasional Amharic words like 'Selam' and 'Eshi'.
      Be short, conversational, and stay in character.`;

      // 4. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
            },
            systemInstruction: systemInstruction,
            outputAudioTranscription: {}, // Enable transcription
        },
        callbacks: {
            onopen: () => {
                setConnectionState(LiveConnectionState.CONNECTED);
                
                // --- Audio Input Setup ---
                if (!inputAudioContextRef.current) return;
                
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                
                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContextRef.current.destination);
                
                // --- Video Input Setup ---
                if (videoRef.current && canvasRef.current) {
                     frameIntervalRef.current = window.setInterval(() => {
                        const videoEl = videoRef.current;
                        const canvasEl = canvasRef.current;
                        if (!videoEl || !canvasEl) return;

                        const ctx = canvasEl.getContext('2d');
                        if (!ctx) return;

                        canvasEl.width = videoEl.videoWidth / 4; // Downscale for performance
                        canvasEl.height = videoEl.videoHeight / 4;
                        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

                        canvasEl.toBlob(async (blob) => {
                             if (blob) {
                                 const base64Data = await blobToBase64(blob);
                                 sessionPromise.then(session => {
                                     session.sendRealtimeInput({
                                         media: { data: base64Data, mimeType: 'image/jpeg' }
                                     });
                                 });
                             }
                        }, 'image/jpeg', JPEG_QUALITY);
                     }, 1000 / FRAME_RATE);
                }
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle Transcription
                const transcript = message.serverContent?.outputTranscription?.text;
                if (transcript) {
                    setCaptionText(prev => prev + transcript);
                    
                    // Clear previous timer
                    if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current);
                    // Set new timer to clear captions after 5 seconds of silence
                    captionTimeoutRef.current = setTimeout(() => {
                        setCaptionText("");
                    }, 5000);
                }

                // Handle Audio Output
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64Audio && outputAudioContextRef.current) {
                    const ctx = outputAudioContextRef.current;
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    
                    const audioBuffer = await decodeAudioData(
                        base64ToUint8Array(base64Audio),
                        ctx,
                        24000,
                        1
                    );
                    
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(ctx.destination);
                    
                    source.addEventListener('ended', () => {
                        sourcesRef.current.delete(source);
                    });
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(source);
                }
                
                // Handle Interruption
                if (message.serverContent?.interrupted) {
                    sourcesRef.current.forEach(source => source.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setCaptionText(""); // Clear captions on interruption
                }
            },
            onclose: () => {
                setConnectionState(LiveConnectionState.DISCONNECTED);
            },
            onerror: (e) => {
                console.error("Live API Error", e);
                setError("Connection error.");
                setConnectionState(LiveConnectionState.ERROR);
            }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start session", err);
      setError("Failed to access camera/microphone or connect.");
      setConnectionState(LiveConnectionState.ERROR);
    }
  };

  const handleCloseRequest = () => {
      setShowConfirmDialog(true);
  };

  const confirmClose = () => {
      setShowConfirmDialog(false);
      onClose();
  };

  const toggleTranslation = () => {
      const newMode = !isTranslationMode;
      setIsTranslationMode(newMode);
      setCaptionText(""); // Clear text when switching modes

      if (sessionPromiseRef.current) {
          const prompt = newMode 
             ? "SYSTEM COMMAND: Pause your dating persona. Act as a real-time interpreter. Listen to the user. If they speak English, translate to Amharic. If they speak Amharic, translate to English. Keep translations accurate and short."
             : `SYSTEM COMMAND: Stop acting as an interpreter. Return immediately to your persona character: ${contactName}. ${contactBio}. Resume the date conversation warmly.`;
          
          sessionPromiseRef.current.then(session => {
              // We send a text part to steer the model
              session.sendRealtimeInput({ content: [{ text: prompt }] });
          });
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full h-full md:w-[900px] md:h-[650px] bg-gray-900 md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center space-x-3">
             <div className={`w-3 h-3 rounded-full ${connectionState === LiveConnectionState.CONNECTED ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-amber-500'}`}></div>
             <div>
               <h3 className="text-white font-semibold text-lg drop-shadow-md flex items-center gap-2">
                 {contactName}
                 {isTranslationMode && (
                     <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded-full font-bold uppercase tracking-wide animate-pulse">
                         Translating
                     </span>
                 )}
               </h3>
               <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                 {connectionState === LiveConnectionState.CONNECTED ? 'Live Video' : 'Connecting...'}
               </span>
             </div>
          </div>
          <button onClick={handleCloseRequest} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md border border-white/10">
            <XIcon className="text-white w-6 h-6" />
          </button>
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-gray-950 flex items-center justify-center">
             <video 
               ref={videoRef} 
               className="w-full h-full object-cover transform scale-x-[-1] opacity-80" 
               muted 
               playsInline 
             />
             <canvas ref={canvasRef} className="hidden" />
             
             {/* Gradient Overlay for vibe - Green/Yellow/Red tint subtle */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

             {/* Captions Overlay */}
             {captionText && (
               <div className="absolute bottom-28 left-0 right-0 flex justify-center z-40 px-4 pointer-events-none">
                  <div className={`
                      backdrop-blur-md rounded-2xl px-6 py-3 shadow-2xl transition-all duration-300 max-w-2xl text-center
                      ${isTranslationMode 
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-50' 
                        : 'bg-gray-900/60 border border-white/10 text-white'}
                  `}>
                      {isTranslationMode && (
                          <div className="flex items-center justify-center mb-1 space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                              <GlobeIcon className="w-3 h-3 animate-pulse" />
                              <span>Translated</span>
                          </div>
                      )}
                      <p className="text-lg font-medium leading-relaxed drop-shadow-sm">{captionText}</p>
                  </div>
               </div>
             )}

             {/* Center Status/Error */}
             {error && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
                 <p className="text-red-400 font-medium px-4 text-center bg-red-900/20 py-2 px-4 rounded-lg border border-red-500/30">{error}</p>
               </div>
             )}
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center items-center space-x-6 md:space-x-8">
           <div className="p-4 rounded-full bg-gray-800/60 backdrop-blur-md text-white/80 border border-white/10 hover:bg-gray-700/60 transition-all cursor-pointer">
             <VideoIcon className="w-6 h-6" />
           </div>
           
           <button onClick={handleCloseRequest} className="p-5 rounded-full bg-red-600 text-white hover:bg-red-500 transition-all shadow-lg shadow-red-900/50 scale-110 hover:scale-125">
             <PhoneIcon className="w-8 h-8 transform rotate-[135deg]" />
           </button>

           <div className="p-4 rounded-full bg-gray-800/60 backdrop-blur-md text-white/80 border border-white/10 hover:bg-gray-700/60 transition-all cursor-pointer">
             <MicIcon className="w-6 h-6" />
           </div>

           {/* Translation Toggle */}
           <button 
             onClick={toggleTranslation}
             className={`p-4 rounded-full backdrop-blur-md border transition-all cursor-pointer ${isTranslationMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-gray-800/60 text-white/80 border-white/10 hover:bg-gray-700/60'}`}
             title="Toggle Real-time Translation"
           >
             <GlobeIcon className="w-6 h-6" />
           </button>
        </div>

        {/* Confirmation Dialog Overlay */}
        {showConfirmDialog && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-white/10 shadow-2xl max-w-sm w-full mx-4 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">End Call?</h3>
                    <p className="text-gray-400 mb-6">Are you sure you want to end this video call?</p>
                    <div className="flex space-x-3 justify-center">
                        <button 
                            onClick={() => setShowConfirmDialog(false)}
                            className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={confirmClose}
                            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
                        >
                            End Call
                        </button>
                    </div>
                </div>
            </div>
         )}
      </div>
    </div>
  );
};