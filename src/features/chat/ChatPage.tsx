/**
 * GenAura AI — Brand–Creator Workspace Chat Page
 * ===============================================
 * Dedicated multi-party private messaging system connecting brands and creators.
 * Features:
 * - Real-time chronological message streaming
 * - Campaign and Smart Deal Room linkage
 * - Integrated 1-click INR Wallet payment triggers
 * - Privacy-respecting online status & read receipts
 * - Participant profile & verification badges
 * - Responsive split-panel layout
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { chatService } from '@/services/chatService';
import { WorkspaceConversation, WorkspaceChatMessage } from '@/types/chat';
import { ROUTES } from '@/types';
import { formatINR } from '@/services/currencyService';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Wallet,
  Handshake,
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
  User,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conv');
  const targetRecipientId = searchParams.get('recipient');
  const linkedDealIdParam = searchParams.get('deal');

  const authUser = useAppStore((s) => s.authUser);
  const currentPersona = useAppStore((s) => s.currentPersona);
  const currentUserId = authUser?.id || (currentPersona === 'brand' ? 'usr_brand_1' : 'usr_creator_1');

  const [conversations, setConversations] = useState<WorkspaceConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<WorkspaceChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'deals'>('all');
  const [messageInput, setMessageInput] = useState('');
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    const list = chatService.getConversationsForUser(currentUserId);
    setConversations(list);

    // If a specific conversation was requested or pick first
    if (initialConvId && list.some((c) => c.id === initialConvId)) {
      setActiveConvId(initialConvId);
    } else if (targetRecipientId) {
      // Find or create conversation with this recipient
      const existing = list.find((c) => c.participantIds.includes(targetRecipientId));
      if (existing) {
        setActiveConvId(existing.id);
      } else {
        const targetCreator = useAppStore.getState().creators.find((c) => c.id === targetRecipientId);
        if (targetCreator) {
          const newConv = chatService.createOrGetConversation({
            participants: [
              {
                id: currentUserId,
                name: authUser?.name || 'My Account',
                handle: authUser?.username ? `@${authUser.username}` : '@user',
                role: (authUser?.role || currentPersona) as any,
                avatarUrl: authUser?.avatarUrl || '',
                verified: true,
                isOnline: true,
              },
              {
                id: targetCreator.id,
                name: targetCreator.name,
                handle: targetCreator.handle,
                role: 'creator',
                avatarUrl: targetCreator.avatarUrl,
                verified: targetCreator.verified,
                isOnline: true,
              },
            ],
            title: `Chat with ${targetCreator.name}`,
            linkedDealId: linkedDealIdParam || undefined,
          });
          const updated = chatService.getConversationsForUser(currentUserId);
          setConversations(updated);
          setActiveConvId(newConv.id);
        }
      }
    } else if (list.length > 0 && !activeConvId) {
      setActiveConvId(list[0].id);
    }
  }, [currentUserId, initialConvId, targetRecipientId, linkedDealIdParam]);

  // Load messages & mark as read when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    try {
      const msgs = chatService.getMessages(activeConvId, currentUserId);
      setMessages(msgs);
      chatService.markAsRead(activeConvId, currentUserId);
      // Refresh conversation list to update unread badges
      setConversations(chatService.getConversationsForUser(currentUserId));
      setErrorFeedback(null);
    } catch (err: any) {
      setErrorFeedback(err.message || 'Unable to open conversation.');
    }
  }, [activeConvId, currentUserId]);

  // Auto-scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const otherParticipant = activeConversation?.participants.find((p) => p.id !== currentUserId) || activeConversation?.participants[0];

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participants.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.handle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.linkedDealTitle?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'unread') {
      return (c.unreadCountByUser[currentUserId] || 0) > 0;
    }
    if (filterType === 'deals') {
      return Boolean(c.linkedDealId);
    }
    return true;
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConvId || !messageInput.trim()) return;

    try {
      setErrorFeedback(null);
      const newMsg = chatService.sendMessage({
        conversationId: activeConvId,
        senderId: currentUserId,
        senderName: authUser?.name || 'Verified User',
        senderRole: (authUser?.role || currentPersona) as any,
        senderAvatar: authUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        content: messageInput.trim(),
        linkedDealId: activeConversation?.linkedDealId,
        linkedDealTitle: activeConversation?.linkedDealTitle,
      });

      setMessages((prev) => [...prev, newMsg]);
      setMessageInput('');
      setConversations(chatService.getConversationsForUser(currentUserId));
    } catch (err: any) {
      setErrorFeedback(err.message || 'Failed to send message.');
    }
  };

  const handleQuickPrompt = (text: string) => {
    setMessageInput(text);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col bg-navy-950 border border-navy-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Banner / Breadcrumb */}
      <div className="px-5 py-3 border-b border-navy-800/80 bg-navy-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-navy-400">
          <MessageSquare size={15} className="text-violet-400" />
          <span className="font-semibold text-navy-200">Workspace Chat</span>
          <span>/</span>
          <span className="text-navy-400 truncate max-w-xs">{activeConversation?.title || 'Private Conversations'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            End-to-End Private Messaging
          </span>
        </div>
      </div>

      {/* Main Grid: Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Conversation List */}
        <aside className="w-80 sm:w-96 border-r border-navy-800/80 flex flex-col bg-navy-950/60 shrink-0">
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-navy-800/80 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations, creators, deals..."
                className="w-full pl-9 pr-3.5 py-2 bg-navy-900 border border-navy-800 rounded-xl text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  filterType === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'text-navy-400 hover:text-navy-200 hover:bg-navy-900'
                )}
              >
                All ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('unread')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  filterType === 'unread'
                    ? 'bg-violet-600 text-white'
                    : 'text-navy-400 hover:text-navy-200 hover:bg-navy-900'
                )}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setFilterType('deals')}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
                  filterType === 'deals'
                    ? 'bg-violet-600 text-white'
                    : 'text-navy-400 hover:text-navy-200 hover:bg-navy-900'
                )}
              >
                Deal Rooms
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-navy-900">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-navy-400 space-y-2">
                <MessageSquare size={28} className="mx-auto text-navy-600 opacity-60" />
                <p className="text-xs font-medium text-navy-300">No conversations found</p>
                <p className="text-[11px] text-navy-500">
                  {searchQuery ? 'Try clearing your search query.' : 'Initiate a chat from a creator profile or Deal Room.'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.participants.find((p) => p.id !== currentUserId) || conv.participants[0];
                const isActive = conv.id === activeConvId;
                const unread = conv.unreadCountByUser[currentUserId] || 0;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn(
                      'w-full text-left p-3.5 transition-all flex items-start gap-3 relative group',
                      isActive
                        ? 'bg-violet-950/30 border-l-2 border-violet-500'
                        : 'hover:bg-navy-900/50'
                    )}
                  >
                    {/* Avatar with Online Badge */}
                    <div className="relative shrink-0">
                      <img
                        src={other?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={other?.name}
                        className="h-10 w-10 rounded-full object-cover border border-navy-700 bg-navy-800"
                      />
                      {other?.isOnline && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-navy-950" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-semibold text-navy-100 truncate">{other?.name}</span>
                          {other?.verified && <ShieldCheck size={12} className="text-cyan-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-navy-500 shrink-0">
                          {conv.lastMessage
                            ? new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>

                      {/* Role Pill & Deal Link */}
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold uppercase tracking-wider bg-navy-800 text-navy-300">
                          {other?.role}
                        </span>
                        {conv.linkedDealTitle && (
                          <span className="text-[10px] text-violet-400 truncate flex items-center gap-0.5">
                            <Handshake size={10} className="shrink-0" />
                            {conv.linkedDealTitle}
                          </span>
                        )}
                      </div>

                      {/* Last Message Snippet */}
                      <p className="text-[11px] text-navy-400 truncate">
                        {conv.lastMessage ? conv.lastMessage.content : 'No messages yet.'}
                      </p>
                    </div>

                    {/* Unread Pill */}
                    {unread > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white shadow-glow-violet shrink-0 self-center">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER PANEL: Active Conversation Thread */}
        {activeConversation && otherParticipant ? (
          <main className="flex-1 flex flex-col bg-navy-950 min-w-0">
            {/* Conversation Header */}
            <header className="px-5 py-3.5 border-b border-navy-800/80 bg-navy-900/40 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={otherParticipant.avatarUrl}
                    alt={otherParticipant.name}
                    className="h-10 w-10 rounded-full object-cover border border-violet-500/40"
                  />
                  {otherParticipant.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-navy-950" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-navy-100 truncate">{otherParticipant.name}</h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-navy-800 text-navy-300 border border-navy-700">
                      {otherParticipant.role}
                    </span>
                    {otherParticipant.verified && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-0.5">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-navy-400 truncate mt-0.5">
                    {otherParticipant.handle} • {otherParticipant.isOnline ? 'Active in workspace' : otherParticipant.lastSeenAt || 'Offline'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {activeConversation.linkedDealId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/deals/${activeConversation.linkedDealId}`)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-800 text-navy-200 hover:text-white border border-navy-700 transition-all flex items-center gap-1.5"
                  >
                    <Handshake size={14} className="text-emerald-400" />
                    <span>View Deal</span>
                  </button>
                )}

                {/* 1-Click Send INR Payment Trigger */}
                {currentPersona === 'brand' && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/wallet?action=send&recipient=${otherParticipant.id}&deal=${activeConversation.linkedDealId || ''}`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold gradient-brand text-white shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Wallet size={14} />
                    <span>Pay in INR (₹)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowDetailsDrawer(!showDetailsDrawer)}
                  className={cn(
                    'p-2 rounded-xl border transition-all text-navy-300 hover:text-white',
                    showDetailsDrawer ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-navy-900 border-navy-800'
                  )}
                  title="Toggle Conversation Details"
                >
                  <Info size={16} />
                </button>
              </div>
            </header>

            {/* Error / Denial Feedback Banner */}
            {errorFeedback && (
              <div className="px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorFeedback}</span>
                </div>
                <button type="button" onClick={() => setErrorFeedback(null)} className="text-rose-400 hover:text-rose-200">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-navy-400">
                  <div className="h-12 w-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-3">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-navy-200">Start the Conversation</h3>
                  <p className="text-xs text-navy-400 max-w-sm mt-1">
                    Send a proposal revision, ask clarifying creative questions, or negotiate collaboration terms in private.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.senderId === currentUserId;

                  return (
                    <div
                      key={msg.id}
                      className={cn('flex items-end gap-2.5 max-w-2xl', isMine ? 'ml-auto flex-row-reverse' : 'mr-auto')}
                    >
                      {/* Avatar */}
                      {!isMine && (
                        <img
                          src={msg.senderAvatar || otherParticipant.avatarUrl}
                          alt={msg.senderName}
                          className="h-7 w-7 rounded-full object-cover shrink-0 border border-navy-700 mb-1"
                        />
                      )}

                      {/* Bubble */}
                      <div className="space-y-1">
                        {!isMine && (
                          <div className="flex items-center gap-1.5 text-[10px] text-navy-400 ml-1">
                            <span className="font-semibold text-navy-300">{msg.senderName}</span>
                            <span>•</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}

                        <div
                          className={cn(
                            'p-3.5 rounded-2xl text-xs leading-relaxed transition-all shadow-sm',
                            isMine
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none border border-violet-400/30'
                              : 'bg-navy-900 text-navy-100 rounded-bl-none border border-navy-800'
                          )}
                        >
                          {/* Message Content */}
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Linked Deal Context Pill */}
                          {msg.linkedDealTitle && (
                            <div
                              onClick={() => msg.linkedDealId && navigate(`/deals/${msg.linkedDealId}`)}
                              className={cn(
                                'mt-2.5 p-2 rounded-xl text-[11px] font-medium flex items-center justify-between cursor-pointer transition-all',
                                isMine
                                  ? 'bg-violet-700/60 hover:bg-violet-700 border border-violet-400/30'
                                  : 'bg-navy-950 hover:bg-navy-800 border border-navy-700'
                              )}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Handshake size={13} className="text-emerald-400 shrink-0" />
                                <span className="truncate">{msg.linkedDealTitle}</span>
                              </div>
                              <ExternalLink size={12} className="shrink-0 opacity-80" />
                            </div>
                          )}

                          {/* Linked Payment Context Pill */}
                          {msg.linkedPaymentId && (
                            <div
                              onClick={() => navigate('/wallet')}
                              className={cn(
                                'mt-2 p-2 rounded-xl text-[11px] font-medium flex items-center justify-between cursor-pointer transition-all',
                                isMine
                                  ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-500/40'
                                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                              )}
                            >
                              <div className="flex items-center gap-1.5">
                                <Wallet size={13} className="text-emerald-400" />
                                <span>INR Wallet Payment Linked</span>
                              </div>
                              <span className="text-[10px] underline">View Receipt</span>
                            </div>
                          )}
                        </div>

                        {/* Timestamp & Status for Sent Messages */}
                        {isMine && (
                          <div className="flex items-center justify-end gap-1 text-[10px] text-navy-400 mr-1">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.status === 'read' ? (
                              <span title="Read"><CheckCheck size={13} className="text-cyan-400" /></span>
                            ) : msg.status === 'delivered' ? (
                              <span title="Delivered"><CheckCheck size={13} className="text-navy-400" /></span>
                            ) : (
                              <span title="Sent"><Check size={13} className="text-navy-500" /></span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-5 py-1.5 border-t border-navy-800/40 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-navy-500 shrink-0">Quick responses:</span>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Could we schedule a 15-minute briefing to review creative deliverables?')}
                className="px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800 text-navy-300 hover:text-white shrink-0"
              >
                Schedule Briefing
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('I have reviewed the agreed terms in the Smart Deal Room and accepted.')}
                className="px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800 text-navy-300 hover:text-white shrink-0"
              >
                Terms Accepted
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrompt('Milestone payment has been disbursed to your INR Wallet balance.')}
                className="px-2.5 py-1 rounded-lg bg-navy-900 border border-navy-800 text-navy-300 hover:text-white shrink-0"
              >
                Payment Notice
              </button>
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-navy-800/80 bg-navy-900/30 flex items-end gap-3">
              <div className="flex-1 bg-navy-900 border border-navy-800 rounded-2xl p-2.5 focus-within:border-violet-500 transition-all flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Write a message to ${otherParticipant.name}... (Press Enter to send)`}
                  className="w-full bg-transparent text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none resize-none"
                />

                <div className="flex items-center justify-between pt-1 border-t border-navy-800/60">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => alert('Attachment simulation: Supported formats include PDF briefs, MP4 drafts, and Figma links.')}
                      className="p-1.5 rounded-lg text-navy-400 hover:text-navy-200 hover:bg-navy-800 transition-all"
                      title="Attach File or Creative Asset"
                    >
                      <Paperclip size={14} />
                    </button>
                    <span className="text-[10px] text-navy-500">Shift + Enter for new line</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="px-4 py-1.5 rounded-xl gradient-brand text-white text-xs font-semibold shadow-glow-violet disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                  >
                    <span>Send</span>
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </form>
          </main>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-navy-400">
            <MessageSquare size={36} className="text-navy-600 mb-2" />
            <p className="text-sm font-semibold text-navy-200">No Conversation Selected</p>
            <p className="text-xs text-navy-400 max-w-sm mt-1">
              Select an active collaboration thread from the list or contact a creator from their profile.
            </p>
          </div>
        )}

        {/* RIGHT DRAWER: Conversation & Deal Details */}
        {showDetailsDrawer && otherParticipant && (
          <aside className="w-80 border-l border-navy-800/80 bg-navy-950 p-5 overflow-y-auto space-y-5 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-navy-200 uppercase tracking-wider">Participant Overview</h3>
              <button
                type="button"
                onClick={() => setShowDetailsDrawer(false)}
                className="p-1 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800"
              >
                <X size={15} />
              </button>
            </div>

            {/* Profile Card */}
            <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 text-center space-y-2">
              <img
                src={otherParticipant.avatarUrl}
                alt={otherParticipant.name}
                className="h-16 w-16 rounded-full object-cover mx-auto border-2 border-violet-500"
              />
              <div>
                <h4 className="text-sm font-bold text-navy-100">{otherParticipant.name}</h4>
                <p className="text-xs text-navy-400">{otherParticipant.handle}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {otherParticipant.role.toUpperCase()}
                </span>
                {otherParticipant.verified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    VERIFIED
                  </span>
                )}
              </div>
            </div>

            {/* Linked Deal Context Card */}
            {activeConversation?.linkedDealId && (
              <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-navy-200">
                  <Handshake size={14} className="text-emerald-400" />
                  <span>Linked Smart Deal</span>
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-navy-100">{activeConversation.linkedDealTitle}</h5>
                  <p className="text-[11px] text-navy-400 mt-0.5">Agreement terms recorded in Smart Deal Room</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/deals/${activeConversation.linkedDealId}`)}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-navy-200 hover:text-white border border-navy-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Go to Deal Room</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* INR Wallet Quick Actions */}
            <div className="p-4 rounded-xl bg-navy-900 border border-navy-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-navy-200">
                <Wallet size={14} className="text-cyan-400" />
                <span>INR Wallet Actions</span>
              </div>
              <p className="text-xs text-navy-400">
                Disburse milestone payouts directly in Indian Rupees (₹) with zero floating-point error.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/wallet?action=send&recipient=${otherParticipant.id}&deal=${activeConversation?.linkedDealId || ''}`
                  )
                }
                className="w-full py-2 rounded-xl text-xs font-semibold gradient-brand text-white shadow-glow-violet transition-all"
              >
                Send INR Payment
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
