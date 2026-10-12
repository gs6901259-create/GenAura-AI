/**
 * GenAura AI — Workspace Brand–Creator Chat Types
 * ===============================================
 * Multi-party conversation models, message statuses, participants,
 * campaign/deal linkage, and messaging permissions.
 */

export type MessageDeliveryStatus = 'sent' | 'delivered' | 'read';

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  handle: string;
  role: 'brand' | 'creator' | 'admin';
  avatarUrl: string;
  verified?: boolean;
  isOnline?: boolean;
  lastSeenAt?: string;
}

export interface WorkspaceChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'brand' | 'creator' | 'admin';
  senderAvatar: string;
  content: string;
  timestamp: string; // ISO 8601
  status: MessageDeliveryStatus;
  readBy: Array<{ userId: string; readAt: string }>;
  attachments?: ChatAttachment[];
  linkedDealId?: string;
  linkedDealTitle?: string;
  linkedPaymentId?: string;
}

export interface WorkspaceConversation {
  id: string;
  title?: string;
  participantIds: string[];
  participants: ConversationParticipant[];
  lastMessage?: WorkspaceChatMessage;
  unreadCountByUser: Record<string, number>;
  linkedDealId?: string;
  linkedDealTitle?: string;
  linkedBriefId?: string;
  linkedCampaignTitle?: string;
  isArchived?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface SendMessagePayload {
  conversationId: string;
  content: string;
  attachments?: ChatAttachment[];
  linkedDealId?: string;
  linkedDealTitle?: string;
}

export interface MessagingPermissionCheck {
  allowed: boolean;
  reason?: string;
}
