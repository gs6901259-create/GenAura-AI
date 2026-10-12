import React, { useState } from 'react';
import { DealMessage, DealRole } from '@/types/deal';
import { Send, Lock, MessageSquare, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui';

interface DealMessagesThreadProps {
  messages: DealMessage[];
  currentRole: DealRole;
  currentUserName: string;
  currentUserAvatar?: string;
  privateNotes: string;
  onSendMessage: (content: string, isPrivate: boolean) => void;
  onSavePrivateNotes: (notes: string) => void;
}

export const DealMessagesThread: React.FC<DealMessagesThreadProps> = ({
  messages,
  currentRole,
  currentUserName,
  currentUserAvatar,
  privateNotes,
  onSendMessage,
  onSavePrivateNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [newMessage, setNewMessage] = useState('');
  const [notesDraft, setNotesDraft] = useState(privateNotes);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const publicMessages = messages.filter((m) => !m.isPrivate);
  const privateMessages = messages.filter(
    (m) => m.isPrivate && m.visibleToRole === currentRole
  );

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim(), activeTab === 'private');
    setNewMessage('');
  };

  const handleSaveNotes = () => {
    onSavePrivateNotes(notesDraft);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-navy-700/60 bg-navy-900/80 flex flex-col h-[520px] overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800 bg-navy-950/40">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900 border border-navy-850">
          <button
            onClick={() => setActiveTab('public')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'public'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Negotiation Chat</span>
            <span className="text-[10px] px-1 rounded bg-navy-950/60 font-mono">
              {publicMessages.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('private')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'private'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-navy-400 hover:text-navy-200'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Private Notes</span>
            <span className="text-[10px] px-1 rounded bg-navy-950/60 font-mono">
              {currentRole} only
            </span>
          </button>
        </div>

        <div className="text-[11px] text-navy-400 flex items-center gap-1">
          {activeTab === 'public' ? (
            <span className="text-violet-400 font-medium">Shared with counterparty</span>
          ) : (
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <Shield className="h-3 w-3" /> Confidential to your role
            </span>
          )}
        </div>
      </div>

      {/* Tab 1: Public Negotiation Chat */}
      {activeTab === 'public' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {publicMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-navy-400">
                <MessageSquare className="h-8 w-8 text-navy-600 mb-2 opacity-50" />
                <p className="text-xs font-medium">No messages in this deal yet.</p>
                <p className="text-[11px] text-navy-500 mt-1 max-w-xs">
                  Ask questions, clarify deliverable expectations, or discuss proposed terms here.
                </p>
              </div>
            ) : (
              publicMessages.map((msg) => {
                const isMe = msg.senderRole === currentRole;
                const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 max-w-[85%] ${
                      isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    }`}
                  >
                    {msg.senderAvatar ? (
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className="h-7 w-7 rounded-full object-cover border border-navy-700 shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center shrink-0 mt-0.5 text-navy-300">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div
                        className={`flex items-center gap-1.5 text-[11px] text-navy-400 ${
                          isMe ? 'justify-end' : ''
                        }`}
                      >
                        <span className="font-semibold text-navy-300">{msg.senderName}</span>
                        <span className="text-[10px] uppercase font-bold font-mono">
                          ({msg.senderRole})
                        </span>
                        <span>•</span>
                        <span>{formattedTime}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isMe
                            ? 'bg-violet-600 text-white rounded-tr-none'
                            : 'bg-navy-800/90 text-navy-100 rounded-tl-none border border-navy-700/60'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-navy-800 bg-navy-950/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${currentRole === 'brand' ? 'creator' : 'brand'} regarding this deal...`}
              className="flex-1 bg-navy-900 border border-navy-700/80 rounded-xl px-3.5 py-2 text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
            <Button
              type="submit"
              size="sm"
              icon={Send}
              disabled={!newMessage.trim()}
              className="shrink-0"
            >
              Send
            </Button>
          </form>
        </div>
      )}

      {/* Tab 2: Role-Private Internal Scratchpad & Notes */}
      {activeTab === 'private' && (
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-xs text-amber-300 flex items-start gap-2.5">
            <Shield className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Confidential Team Scratchpad</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Notes written here are stored securely and never visible to the{' '}
                {currentRole === 'brand' ? 'creator' : 'brand'}. Use this space for pricing calculations, strategy notes, or internal approvals.
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <label className="text-xs font-semibold text-navy-300">
              {currentRole === 'brand' ? 'Brand Internal Notes' : 'Creator Private Notes'}
            </label>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Jot down internal considerations, target margins, negotiation bottom-lines, or review comments..."
              className="flex-1 w-full bg-navy-950/80 border border-navy-700/80 rounded-xl p-3 text-xs text-navy-100 placeholder:text-navy-500 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-navy-800">
            <span className="text-[11px] text-navy-400">
              {isSavedNotice ? (
                <span className="text-emerald-400 font-semibold">✓ Notes saved successfully</span>
              ) : (
                'Changes are saved locally to your role view'
              )}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSaveNotes}
              className="border-amber-500/40 hover:bg-amber-950/30 text-amber-300"
            >
              Save Internal Notes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
