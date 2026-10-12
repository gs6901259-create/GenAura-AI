/**
 * GenAura AI — Workspace Brand–Creator Chat Service
 * =================================================
 * Authoritative message routing, privacy rule enforcement,
 * unread badges, read receipts, and campaign/deal linkage.
 */

import {
  WorkspaceConversation,
  WorkspaceChatMessage,
  SendMessagePayload,
  ConversationParticipant,
  MessagingPermissionCheck,
} from '@/types/chat';
import { INITIAL_SEED_CONVERSATIONS, INITIAL_SEED_CHAT_MESSAGES } from '@/data/chatSeedData';
import { useAppStore } from '@/lib/store';

const CHAT_STORAGE_KEY = 'genaura_chat_data_v1';

interface StoredChatData {
  conversations: WorkspaceConversation[];
  messagesByConversation: Record<string, WorkspaceChatMessage[]>;
}

class ChatService {
  private data: StoredChatData;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): StoredChatData {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return this.getInitialState();
      }
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) {
        const initial = this.getInitialState();
        this.saveToStorage(initial);
        return initial;
      }
      const parsed = JSON.parse(raw);
      return {
        conversations: parsed.conversations || INITIAL_SEED_CONVERSATIONS,
        messagesByConversation: parsed.messagesByConversation || INITIAL_SEED_CHAT_MESSAGES,
      };
    } catch {
      return this.getInitialState();
    }
  }

  private getInitialState(): StoredChatData {
    return {
      conversations: [...INITIAL_SEED_CONVERSATIONS],
      messagesByConversation: { ...INITIAL_SEED_CHAT_MESSAGES },
    };
  }

  private saveToStorage(data: StoredChatData = this.data): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.error('Failed to save chat data', e);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1. CONVERSATION QUERIES & AUTHORIZATION
  // ────────────────────────────────────────────────────────────────────────────
  public getConversationsForUser(userId: string): WorkspaceConversation[] {
    if (!userId) return [];
    return this.data.conversations
      .filter((c) => c.participantIds.includes(userId))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getConversationById(conversationId: string, currentUserId: string): WorkspaceConversation | undefined {
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv) return undefined;

    // Strict Authorization: User must be a participant or an admin
    if (!conv.participantIds.includes(currentUserId) && currentUserId !== 'usr_admin_1') {
      throw new Error('Unauthorized: You are not a participant in this conversation.');
    }

    return { ...conv };
  }

  public getMessages(conversationId: string, currentUserId: string): WorkspaceChatMessage[] {
    // Check authorization first
    this.getConversationById(conversationId, currentUserId);
    return this.data.messagesByConversation[conversationId] || [];
  }

  public getTotalUnreadCount(userId: string): number {
    if (!userId) return 0;
    return this.data.conversations.reduce((sum, c) => {
      if (!c.participantIds.includes(userId)) return sum;
      return sum + (c.unreadCountByUser[userId] || 0);
    }, 0);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. PRIVACY & PERMISSION CHECKS
  // ────────────────────────────────────────────────────────────────────────────
  public checkMessagingPermission(senderId: string, recipientId: string): MessagingPermissionCheck {
    if (senderId === recipientId) {
      return { allowed: false, reason: 'Cannot initiate a chat conversation with yourself.' };
    }

    const store = useAppStore.getState();
    const recipientUser = store.authUser?.id === recipientId ? store.authUser : null;
    const recipientSettings = store.userSettings;

    // If recipient has customized messaging privacy settings
    if (recipientSettings?.privacy?.messaging) {
      const { allowedSenders, allowNewMessageRequests } = recipientSettings.privacy.messaging;

      if (allowedSenders === 'verified-only') {
        const sender = store.authUser?.id === senderId ? store.authUser : null;
        const senderCreator = store.creators.find((c) => c.id === senderId);
        const isVerified = sender?.role === 'brand' || senderCreator?.verified;
        if (!isVerified) {
          return {
            allowed: false,
            reason: 'Recipient accepts messages only from verified creators and registered brands.',
          };
        }
      }

      if (allowedSenders === 'contacts-only' || !allowNewMessageRequests) {
        const hasExistingChat = this.data.conversations.some(
          (c) => c.participantIds.includes(senderId) && c.participantIds.includes(recipientId)
        );
        if (!hasExistingChat) {
          return {
            allowed: false,
            reason: 'Recipient does not accept unsolicited message requests.',
          };
        }
      }
    }

    return { allowed: true };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. SEND MESSAGE
  // ────────────────────────────────────────────────────────────────────────────
  public sendMessage(params: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderRole: 'brand' | 'creator' | 'admin';
    senderAvatar: string;
    content: string;
    attachments?: import('@/types/chat').ChatAttachment[];
    linkedDealId?: string;
    linkedDealTitle?: string;
    linkedPaymentId?: string;
  }): WorkspaceChatMessage {
    const {
      conversationId,
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      content,
      attachments,
      linkedDealId,
      linkedDealTitle,
      linkedPaymentId,
    } = params;

    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      throw new Error('Conversation not found.');
    }

    // Verify sender is in conversation
    if (!conv.participantIds.includes(senderId)) {
      throw new Error('Unauthorized: Sender is not a participant in this conversation.');
    }

    const cleanContent = content.trim();
    if (!cleanContent && (!attachments || attachments.length === 0)) {
      throw new Error('Cannot send an empty message.');
    }

    const otherParticipantIds = conv.participantIds.filter((id) => id !== senderId);

    // Permission check for recipient(s)
    for (const recipientId of otherParticipantIds) {
      const perm = this.checkMessagingPermission(senderId, recipientId);
      if (!perm.allowed) {
        throw new Error(perm.reason || 'Messaging permission denied by recipient privacy settings.');
      }
    }

    const timestamp = new Date().toISOString();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const message: WorkspaceChatMessage = {
      id: msgId,
      conversationId,
      senderId,
      senderName,
      senderRole,
      senderAvatar,
      content: cleanContent,
      timestamp,
      status: 'sent',
      readBy: [],
      attachments,
      linkedDealId: linkedDealId || conv.linkedDealId,
      linkedDealTitle: linkedDealTitle || conv.linkedDealTitle,
      linkedPaymentId,
    };

    if (!this.data.messagesByConversation[conversationId]) {
      this.data.messagesByConversation[conversationId] = [];
    }
    this.data.messagesByConversation[conversationId].push(message);

    // Update conversation metadata and unread counts
    conv.lastMessage = message;
    conv.updatedAt = timestamp;
    for (const recipientId of otherParticipantIds) {
      conv.unreadCountByUser[recipientId] = (conv.unreadCountByUser[recipientId] || 0) + 1;
    }

    this.saveToStorage();

    // In-app Notification for recipients, respecting showPreviewsInNotifications
    try {
      const store = useAppStore.getState();
      const showPreview = store.userSettings?.privacy?.messaging?.showPreviewsInNotifications !== false;
      const notifMessage = showPreview
        ? `${cleanContent.length > 60 ? cleanContent.substring(0, 57) + '...' : cleanContent}`
        : `You have received a new message from ${senderName}.`;

      store.addNotification({
        id: `notif_chat_${Date.now()}`,
        title: `Message from ${senderName}`,
        message: notifMessage,
        type: 'collaboration',
        timestamp: 'Just now',
        read: false,
        linkTo: `/chat`,
      });
    } catch {
      // test fallback
    }

    return message;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4. MARK CONVERSATION AS READ
  // ────────────────────────────────────────────────────────────────────────────
  public markAsRead(conversationId: string, currentUserId: string): void {
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    if (!conv.participantIds.includes(currentUserId)) return;

    // Reset unread count for current user
    conv.unreadCountByUser[currentUserId] = 0;

    // Mark messages as read
    const msgs = this.data.messagesByConversation[conversationId] || [];
    const timestamp = new Date().toISOString();

    const store = useAppStore.getState();
    const sendReadReceipts = store.userSettings?.privacy?.messaging?.readReceipts !== false;

    if (sendReadReceipts) {
      for (const msg of msgs) {
        if (msg.senderId !== currentUserId) {
          const alreadyRead = msg.readBy.some((r) => r.userId === currentUserId);
          if (!alreadyRead) {
            msg.readBy.push({ userId: currentUserId, readAt: timestamp });
          }
          msg.status = 'read';
        }
      }
    }

    this.saveToStorage();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 5. CREATE OR GET CONVERSATION (e.g. from Profile or Deal Room)
  // ────────────────────────────────────────────────────────────────────────────
  public createOrGetConversation(params: {
    participants: ConversationParticipant[];
    title?: string;
    linkedDealId?: string;
    linkedDealTitle?: string;
    linkedBriefId?: string;
    linkedCampaignTitle?: string;
  }): WorkspaceConversation {
    const { participants, title, linkedDealId, linkedDealTitle, linkedBriefId, linkedCampaignTitle } = params;

    const participantIds = participants.map((p) => p.id).sort();

    // Check if matching conversation already exists
    let existing = this.data.conversations.find((c) => {
      const cIds = [...c.participantIds].sort();
      const sameParticipants = cIds.length === participantIds.length && cIds.every((id, i) => id === participantIds[i]);
      if (linkedDealId && c.linkedDealId === linkedDealId) return true;
      return sameParticipants;
    });

    if (existing) {
      if (linkedDealId && !existing.linkedDealId) {
        existing.linkedDealId = linkedDealId;
        existing.linkedDealTitle = linkedDealTitle;
        this.saveToStorage();
      }
      return { ...existing };
    }

    const timestamp = new Date().toISOString();
    const newConv: WorkspaceConversation = {
      id: `conv_${Date.now()}`,
      title: title || `Chat with ${participants.map((p) => p.name).join(' & ')}`,
      participantIds,
      participants,
      unreadCountByUser: participantIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
      linkedDealId,
      linkedDealTitle,
      linkedBriefId,
      linkedCampaignTitle,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.data.conversations.unshift(newConv);
    this.data.messagesByConversation[newConv.id] = [];
    this.saveToStorage();

    return newConv;
  }

  // Helper for test resets
  public resetToSeed(): void {
    this.data = this.getInitialState();
    this.saveToStorage();
  }
}

export const chatService = new ChatService();
