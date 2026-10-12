/**
 * GenAura AI — Aura Assistant Interactive Chat & Hands-Free Voice Interface
 * ==========================================================================
 * Dual-mode AI assistant:
 * 1. Conversational Chat Mode with markdown formatting & starter prompts.
 * 2. Hands-Free Aura Voice Mode powered by Web Speech API (SpeechRecognition + SpeechSynthesis).
 * Features live audio visualizer waveforms, turn-taking loops, speech markdown sanitization,
 * and zero-setup deterministic fallback.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { aiAssistantService } from '@/services/aiAssistantService';
import { STARTER_PROMPTS } from '@/data/authAndSettingsDefaults';
import { ChatMessage } from '@/types';
import {
  Sparkles,
  Send,
  Trash2,
  PlusCircle,
  Cpu,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  MessageSquare,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeMarkdownForSpeech } from '@/utils/speechUtils';

export { sanitizeMarkdownForSpeech };
export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export function AuraAssistantPage() {
  const navigate = useNavigate();
  const chatMessages = useAppStore((s) => s.chatMessages) || [];
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const clearChatMessages = useAppStore((s) => s.clearChatMessages);
  const authUser = useAppStore((s) => s.authUser);
  const currentPersona = useAppStore((s) => s.currentPersona);
  const userSettings = useAppStore((s) => s.userSettings);

  const aiPrefs = userSettings?.aiPreferences;
  const autoSpeakReplies = aiPrefs?.autoSpeakReplies ?? true;
  const autoListenNextTurn = aiPrefs?.autoListenNextTurn ?? true;
  const speechRate = aiPrefs?.speechRate ?? 1.0;

  // Text Chat States
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Hands-Free Voice States
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);
  const [autoListenEnabled, setAutoListenEnabled] = useState(autoListenNextTurn);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isComponentMounted = useRef(true);

  const modelInfo = aiAssistantService.getModelInfo();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  // Check Web Speech API availability on mount
  useEffect(() => {
    isComponentMounted.current = true;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
    }

    return () => {
      isComponentMounted.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup error
        }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop active speech synthesis
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
    setCurrentlySpeakingText(null);
  }, []);

  // Speak aloud an assistant message
  const speakText = useCallback(
    (textToSpeak: string, onFinished?: () => void) => {
      if (!window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      const sanitized = sanitizeMarkdownForSpeech(textToSpeak);
      if (!sanitized) return;

      const utterance = new SpeechSynthesisUtterance(sanitized);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      // Select preferred voice if available
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onstart = () => {
        if (!isComponentMounted.current) return;
        setVoiceState('speaking');
        setCurrentlySpeakingText(sanitized);
      };

      utterance.onend = () => {
        if (!isComponentMounted.current) return;
        setVoiceState('idle');
        setCurrentlySpeakingText(null);
        if (onFinished) {
          onFinished();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('Speech synthesis error:', e);
        }
        if (!isComponentMounted.current) return;
        setVoiceState('idle');
        setCurrentlySpeakingText(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [speechRate]
  );

  // Core Send Message Handler
  const handleSend = async (messageText?: string, fromVoice = false) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    setInput('');
    setVoiceError(null);

    // Stop speaking any previous utterance
    stopSpeaking();

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addChatMessage(userMessage);

    setIsLoading(true);
    if (fromVoice || voiceMode) {
      setVoiceState('thinking');
    }

    try {
      const reply = await aiAssistantService.generateReply(textToSend, chatMessages, {
        currentPage: 'assistant',
        userRole: currentPersona,
        userName: authUser?.name || 'Creator',
      });

      const assistantMessage: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionLink: reply.actionLink,
      };
      addChatMessage(assistantMessage);

      // In Voice Mode or if auto-speak is enabled, speak response aloud
      if (voiceMode || fromVoice || autoSpeakReplies) {
        speakText(reply.text, () => {
          // If in hands-free voice mode with auto-listen, resume listening automatically
          if ((voiceMode || fromVoice) && autoListenEnabled && isComponentMounted.current) {
            setTimeout(() => {
              startListening();
            }, 350);
          }
        });
      }
    } catch (err) {
      console.error('Failed to get response:', err);
      setError('Unable to complete request. Please try again or inspect your connection.');
      if (voiceMode || fromVoice) {
        setVoiceState('idle');
        setVoiceError('Could not process voice request. Please try again.');
      }
    } finally {
      setIsLoading(false);
      if (!voiceMode) {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  };

  // Start Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Stop synthesis if currently playing
    stopSpeaking();

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      setLiveTranscript('');
      setVoiceError(null);

      recognition.onstart = () => {
        if (!isComponentMounted.current) return;
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        if (!isComponentMounted.current) return;
        let transcript = '';
        let isFinal = false;

        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        setLiveTranscript(transcript);

        if (isFinal && transcript.trim()) {
          recognition.stop();
          handleSend(transcript, true);
        }
      };

      recognition.onerror = (event: any) => {
        if (!isComponentMounted.current) return;
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setVoiceError(`Voice recognition notice: ${event.error}`);
        }
        setVoiceState('idle');
      };

      recognition.onend = () => {
        if (!isComponentMounted.current) return;
        if (voiceState === 'listening') {
          setVoiceState('idle');
        }
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setVoiceState('idle');
    }
  }, [stopSpeaking, voiceState, autoListenEnabled]);

  // Toggle Voice Mode
  const toggleVoiceMode = () => {
    if (!voiceMode) {
      setVoiceMode(true);
      // Greet user or start listening
      setTimeout(() => {
        startListening();
      }, 200);
    } else {
      setVoiceMode(false);
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      setVoiceState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    stopSpeaking();
    clearChatMessages();
    setShowClearConfirm(false);
  };

  // Get most recent assistant message for Voice Mode card
  const latestAssistantMessage = [...chatMessages]
    .reverse()
    .find((m) => m.sender === 'assistant');

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col bg-navy-900 border border-navy-700/60 rounded-2xl shadow-2xl overflow-hidden">
      {/* Top Header */}
      <header className="px-5 py-4 border-b border-navy-800 bg-navy-950/70 backdrop-blur-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shadow-glow-violet text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-navy-50 tracking-tight">Aura Assistant</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Official AI Guide
              </span>
            </div>
            <p className="text-xs text-navy-400">
              Context-aware intelligence for briefs, verification, discovery & collaboration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hands-Free Voice Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm',
              voiceMode
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-glow-cyan ring-1 ring-cyan-400'
                : 'bg-navy-800 text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30'
            )}
            title={voiceMode ? 'Switch to text chat view' : 'Activate Hands-Free Aura Voice Mode'}
          >
            {voiceMode ? (
              <>
                <Radio size={14} className="animate-spin text-cyan-200" />
                <span>Voice Active</span>
              </>
            ) : (
              <>
                <Mic size={14} className="text-cyan-400" />
                <span>Aura Voice</span>
              </>
            )}
          </button>

          {/* AI Mode Banner */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border font-medium',
              modelInfo.isLive
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
            )}
            title={modelInfo.notice}
          >
            <Cpu size={13} className={modelInfo.isLive ? 'text-emerald-400' : 'text-cyan-400'} />
            <span className="truncate max-w-[170px]">
              {modelInfo.isLive ? 'Live Gemini AI' : 'Deterministic Mode'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleSend('What should I do next on GenAura AI?')}
            className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
            title="Start new topic"
          >
            <PlusCircle size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="p-2 rounded-lg text-navy-400 hover:text-rose-400 hover:bg-navy-800 transition-colors"
            title="Clear conversation"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* Subtle Notice banner if demo mode */}
      {!modelInfo.isLive && (
        <div className="bg-navy-950/90 border-b border-navy-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className="text-cyan-400" />
            <span>
              <strong>Demo AI mode:</strong> Connect an AI provider in{' '}
              <button
                onClick={() => navigate('/settings')}
                className="text-cyan-400 hover:underline font-medium inline-flex items-center gap-0.5"
              >
                Settings <ExternalLink size={10} />
              </button>{' '}
              for full conversational LLM responses.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden md:inline">Zero API Key Required</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VOICE MODE PORTAL (Hands-Free Voice Interface)
         ───────────────────────────────────────────────────────────── */}
      {voiceMode ? (
        <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-8 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 overflow-y-auto">
          {/* Top Status & Browser Notice */}
          <div className="w-full max-w-xl text-center space-y-2">
            {!isSpeechSupported && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                Web Speech API is not supported in this browser. Please use Google Chrome or Edge for hands-free speech input.
              </div>
            )}
            {voiceError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                <span>{voiceError}</span>
              </div>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800/80 border border-navy-700/60 text-xs font-semibold text-navy-300">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  voiceState === 'listening'
                    ? 'bg-cyan-400 animate-ping'
                    : voiceState === 'speaking'
                    ? 'bg-violet-400 animate-pulse'
                    : voiceState === 'thinking'
                    ? 'bg-amber-400 animate-bounce'
                    : 'bg-navy-500'
                )}
              />
              <span className="capitalize">
                {voiceState === 'listening'
                  ? 'Listening to your voice...'
                  : voiceState === 'thinking'
                  ? 'Aura is reasoning...'
                  : voiceState === 'speaking'
                  ? 'Aura is speaking aloud...'
                  : 'Aura Voice is ready — Tap to speak'}
              </span>
            </div>
          </div>

          {/* Central Interactive Aura Orb & Animated Waveform */}
          <div className="my-8 flex flex-col items-center justify-center relative">
            {/* Ambient glowing background rings */}
            <div
              className={cn(
                'absolute h-64 w-64 rounded-full filter blur-3xl transition-opacity duration-700 pointer-events-none',
                voiceState === 'listening'
                  ? 'bg-cyan-500/25 opacity-100 scale-125'
                  : voiceState === 'speaking'
                  ? 'bg-violet-600/30 opacity-100 scale-125'
                  : voiceState === 'thinking'
                  ? 'bg-amber-500/20 opacity-80 scale-110'
                  : 'bg-violet-500/15 opacity-40'
              )}
            />

            {/* Glowing Aura Orb */}
            <button
              type="button"
              onClick={voiceState === 'speaking' ? stopSpeaking : startListening}
              className={cn(
                'relative h-36 w-36 sm:h-44 sm:w-44 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer group focus:outline-none',
                voiceState === 'listening'
                  ? 'bg-gradient-to-tr from-cyan-600 via-violet-600 to-cyan-400 ring-4 ring-cyan-400/50 scale-105 shadow-glow-cyan'
                  : voiceState === 'speaking'
                  ? 'bg-gradient-to-tr from-violet-700 via-indigo-600 to-purple-500 ring-4 ring-violet-500/50 scale-105 shadow-glow-violet'
                  : voiceState === 'thinking'
                  ? 'bg-gradient-to-tr from-amber-600 via-violet-600 to-cyan-500 animate-spin ring-2 ring-amber-400/50'
                  : 'bg-navy-800 hover:bg-navy-750 border-2 border-navy-700 hover:border-violet-500 hover:scale-105'
              )}
              title={
                voiceState === 'speaking'
                  ? 'Click to interrupt / stop speaking'
                  : 'Click to start speaking'
              }
            >
              <div className="flex flex-col items-center justify-center text-white z-10 space-y-1">
                {voiceState === 'listening' ? (
                  <Mic size={36} className="text-white animate-pulse" />
                ) : voiceState === 'speaking' ? (
                  <Volume2 size={36} className="text-white animate-bounce" />
                ) : voiceState === 'thinking' ? (
                  <Cpu size={36} className="text-white" />
                ) : (
                  <Mic size={36} className="text-violet-400 group-hover:text-white transition-colors" />
                )}
                <span className="text-[11px] font-bold tracking-wider uppercase opacity-90">
                  {voiceState === 'listening'
                    ? 'Listening'
                    : voiceState === 'speaking'
                    ? 'Interrupt'
                    : voiceState === 'thinking'
                    ? 'Thinking'
                    : 'Tap to Talk'}
                </span>
              </div>
            </button>

            {/* Animated Audio Waveform Bars (Active when listening or speaking) */}
            <div className="flex items-center gap-1.5 h-8 mt-6">
              {[0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8].map((mult, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'w-1.5 rounded-full transition-all duration-150',
                    voiceState === 'listening'
                      ? 'bg-cyan-400 animate-pulse'
                      : voiceState === 'speaking'
                      ? 'bg-violet-400 animate-bounce'
                      : 'bg-navy-700 h-2'
                  )}
                  style={{
                    height:
                      voiceState === 'listening' || voiceState === 'speaking'
                        ? `${Math.max(8, 28 * mult)}px`
                        : '8px',
                    animationDelay: `${idx * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Transcript & Assistant Output Display */}
          <div className="w-full max-w-2xl space-y-3">
            {/* User live speech transcript */}
            {liveTranscript && (
              <div className="glass-card p-3.5 rounded-xl border border-cyan-500/30 text-left">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                  You Spoke:
                </span>
                <p className="text-xs text-navy-100 font-medium mt-0.5 italic">
                  "{liveTranscript}"
                </p>
              </div>
            )}

            {/* Latest Assistant Message */}
            {latestAssistantMessage && (
              <div className="glass-card p-4 rounded-xl border border-navy-700/80 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-300">
                    <Sparkles size={13} />
                    <span>Aura Response</span>
                  </div>
                  {voiceState === 'speaking' && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 transition-colors"
                    >
                      <Square size={10} />
                      <span>Stop Audio</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-navy-100 leading-relaxed max-h-32 overflow-y-auto">
                  {latestAssistantMessage.text}
                </p>

                {latestAssistantMessage.actionLink && (
                  <div className="pt-2 border-t border-navy-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(latestAssistantMessage.actionLink!.to)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-sm"
                    >
                      <span>{latestAssistantMessage.actionLink.label}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Voice Mode Quick Questions */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 mb-1.5 block">
                Quick Voice Inquiries
              </span>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  'Help me improve my creator profile.',
                  'How can I get my profile verified?',
                  'Create a campaign brief for my brand.',
                  'Explain my creator match score.',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt, true)}
                    className="text-xs px-3 py-1.5 rounded-full bg-navy-800 hover:bg-violet-600/20 hover:text-violet-200 border border-navy-700/60 text-navy-300 transition-all font-medium"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Hands-Free Controls Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-navy-800 text-xs text-navy-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoListenEnabled}
                  onChange={(e) => setAutoListenEnabled(e.target.checked)}
                  className="rounded border-navy-700 text-violet-600 bg-navy-900 h-3.5 w-3.5"
                />
                <span className="text-[11px] text-navy-300">Continuous Dialogue (Auto-Listen)</span>
              </label>

              <button
                type="button"
                onClick={() => setVoiceMode(false)}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold"
              >
                <MessageSquare size={13} />
                <span>Return to Chat</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            TEXT CHAT MODE
           ───────────────────────────────────────────────────────────── */
        <>
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 max-w-3xl',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  {/* Avatar Icon */}
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold',
                      isUser
                        ? 'bg-violet-600 text-white'
                        : 'gradient-brand text-white shadow-glow-violet'
                    )}
                  >
                    {isUser ? <User size={15} /> : <Bot size={16} />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                      isUser
                        ? 'bg-violet-600 text-white rounded-tr-none'
                        : 'bg-navy-800 border border-navy-700/70 text-navy-100 rounded-tl-none'
                    )}
                  >
                    {/* Content rendering */}
                    <div className="prose prose-invert prose-sm max-w-none space-y-2 whitespace-pre-wrap">
                      {msg.text}
                    </div>

                    {/* Optional Action Link Shortcut */}
                    {msg.actionLink && (
                      <div className="mt-3 pt-2.5 border-t border-navy-700/60 flex items-center justify-between">
                        <span className="text-[11px] text-navy-400">Recommended Next Step</span>
                        <button
                          type="button"
                          onClick={() => navigate(msg.actionLink!.to)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-violet-600/30 text-violet-300 hover:bg-violet-600 hover:text-white border border-violet-500/40 transition-all"
                        >
                          <span>{msg.actionLink.label}</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    )}

                    {/* Footer: Listen Aloud Button & Timestamp */}
                    <div className="mt-2 pt-1 border-t border-navy-700/40 flex items-center justify-between text-[10px]">
                      {!isUser ? (
                        <button
                          type="button"
                          onClick={() =>
                            currentlySpeakingText ? stopSpeaking() : speakText(msg.text)
                          }
                          className="inline-flex items-center gap-1 text-navy-400 hover:text-cyan-300 transition-colors"
                          title="Listen to this message"
                        >
                          {currentlySpeakingText ? (
                            <>
                              <VolumeX size={12} className="text-rose-400" />
                              <span className="text-rose-300">Stop Reading</span>
                            </>
                          ) : (
                            <>
                              <Volume2 size={12} />
                              <span>Listen Aloud</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span />
                      )}
                      <span className={isUser ? 'text-violet-200/70' : 'text-navy-400'}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-md mr-auto">
                <div className="h-8 w-8 rounded-lg gradient-brand shrink-0 flex items-center justify-center text-white">
                  <Bot size={16} />
                </div>
                <div className="bg-navy-800 border border-navy-700/70 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="text-xs text-navy-300">Aura is thinking</span>
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error notification */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
                <button
                  onClick={() => handleSend()}
                  className="flex items-center gap-1 text-xs font-medium hover:underline text-rose-200"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Starter Prompts */}
          <div className="px-4 py-2 border-t border-navy-800/80 bg-navy-950/50">
            <p className="text-[10px] uppercase tracking-wider text-navy-400 font-bold mb-1.5">
              Suggested Questions
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-xs shrink-0 px-3 py-1.5 rounded-full bg-navy-800 hover:bg-violet-600/20 hover:text-violet-200 hover:border-violet-500/40 text-navy-300 border border-navy-700/60 transition-all font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form Bar */}
          <div className="p-4 border-t border-navy-800 bg-navy-950 flex items-center gap-3">
            <button
              type="button"
              onClick={toggleVoiceMode}
              className="p-3 rounded-xl bg-navy-900 border border-navy-700 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-colors"
              title="Activate Hands-Free Aura Voice Mode"
            >
              <Mic size={18} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Aura anything about creator verification, briefs, match scores..."
              disabled={isLoading}
              className="flex-1 bg-navy-900 border border-navy-700 rounded-xl px-4 py-3 text-sm text-navy-100 placeholder-navy-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl gradient-brand text-white font-medium flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-glow-violet transition-all"
            >
              <Send size={16} />
              <span className="hidden sm:inline text-xs font-semibold">Send</span>
            </button>
          </div>
        </>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-navy-50">Clear Chat History?</h3>
            <p className="text-xs text-navy-300 leading-relaxed">
              This will reset your conversation with Aura. The assistant will return to its welcome greeting.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-navy-300 hover:bg-navy-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500"
              >
                Clear Conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
