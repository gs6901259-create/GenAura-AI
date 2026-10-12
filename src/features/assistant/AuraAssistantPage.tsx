/**
 * GenAura AI — Aura Assistant Interactive Chat Interface
 * ========================================================
 * Persistent, conversational AI interface with starter prompts,
 * markdown formatting, action shortcuts, and zero-setup deterministic fallback.
 */
import { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuraAssistantPage() {
  const navigate = useNavigate();
  const chatMessages = useAppStore((s) => s.chatMessages) || [];
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const clearChatMessages = useAppStore((s) => s.clearChatMessages);
  const authUser = useAppStore((s) => s.authUser);
  const currentPersona = useAppStore((s) => s.currentPersona);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const modelInfo = aiAssistantService.getModelInfo();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    setError(null);
    setInput('');

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addChatMessage(userMessage);

    setIsLoading(true);

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
    } catch (err) {
      console.error('Failed to get response:', err);
      setError('Unable to complete request. Please try again or inspect your connection.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    clearChatMessages();
    setShowClearConfirm(false);
  };

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
            <span className="truncate max-w-[200px]">
              {modelInfo.isLive ? 'Live Gemini AI' : 'Deterministic Demo AI Mode'}
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

                {/* Timestamp */}
                <div
                  className={cn(
                    'mt-1.5 text-[10px] text-right',
                    isUser ? 'text-violet-200/70' : 'text-navy-400'
                  )}
                >
                  {msg.timestamp}
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
