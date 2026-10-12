/**
 * GenAura AI — Default Demo Accounts, Settings & Assistant Seeds
 */
import { AuthUser, UserSettings, AppNotification, ChatMessage, UserPersona } from '@/types';

export const DEFAULT_DEMO_USERS: Record<UserPersona, AuthUser> = {
  brand: {
    id: 'usr_brand_1',
    name: 'Sarah Lin',
    email: 'sarah@aurabrand.com',
    username: 'sarahlin_growth',
    role: 'brand',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    bio: 'VP of Growth & Creator Partnerships at AuraBrand. Crafting high-converting visual campaigns with elite AI creators.',
    location: 'San Francisco, CA',
    languages: ['English', 'Mandarin'],
    createdAt: '2026-01-15T08:00:00Z',
    isDemoAccount: true,
  },
  creator: {
    id: 'usr_creator_1',
    name: 'Elena Rostova',
    email: 'elena@creativemotion.studio',
    username: 'elenacreates',
    role: 'creator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    bio: 'Senior Visual Storyteller & 3D Brand Animator. Specializing in cinematic product reveals and tactile simulations.',
    location: 'Vancouver, Canada',
    languages: ['English', 'French'],
    createdAt: '2026-02-10T10:30:00Z',
    isDemoAccount: true,
  },
  admin: {
    id: 'usr_admin_1',
    name: 'Alex Vance',
    email: 'admin@genaura.ai',
    username: 'alex_compliance',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    bio: 'Lead Marketplace Trust & Verification Reviewer at GenAura AI.',
    location: 'New York, NY',
    languages: ['English'],
    createdAt: '2025-11-01T09:00:00Z',
    isDemoAccount: true,
  },
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  profile: {
    displayName: 'Sarah Lin',
    username: 'sarahlin_growth',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
    bio: 'VP of Growth & Creator Partnerships at AuraBrand.',
    location: 'San Francisco, CA',
    languages: ['English', 'Mandarin'],
    hourlyRate: 150,
    website: 'https://aurabrand.com',
  },
  account: {
    email: 'sarah@aurabrand.com',
    twoFactorEnabled: false,
    activeSessions: [
      {
        id: 'sess_1',
        device: 'Chrome on Windows 11 (Current)',
        location: 'San Francisco, US',
        lastActive: 'Active now',
        isCurrent: true,
      },
      {
        id: 'sess_2',
        device: 'Safari on iOS 18 (iPhone)',
        location: 'San Francisco, US',
        lastActive: '3 hours ago',
        isCurrent: false,
      },
    ],
  },
  appearance: {
    theme: 'dark',
    reduceMotion: false,
    compactDensity: false,
  },
  notifications: {
    collaborationRequests: true,
    verificationUpdates: true,
    campaignUpdates: true,
    productAnnouncements: false,
    emailChannel: true,
    inAppChannel: true,
  },
  privacy: {
    profileVisibility: 'public',
    discoverabilityEnabled: true,
    searchEngineIndexing: true,
    portfolioVisibility: 'public',
    contactInfoVisibility: 'workspace-only',
    socialLinksVisibility: 'visible',
    availabilityVisibility: 'visible',
    collaborationHistoryVisibility: 'public',
    messaging: {
      allowedSenders: 'anyone',
      allowNewMessageRequests: true,
      showOnlineStatus: true,
      readReceipts: true,
      showPreviewsInNotifications: true,
    },
  },
  aiPreferences: {
    responseLanguage: 'English',
    autoSuggestions: true,
    storeConversations: true,
    preferLiveModel: true,
    voiceEnabled: true,
    autoSpeakReplies: true,
    autoListenNextTurn: true,
    speechRate: 1.0,
    speechPitch: 1.0,
  },
};

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Verification Queue Action',
    message: 'Elena Rostova submitted a 3D animation portfolio for 100-point rubric verification.',
    type: 'verification',
    timestamp: '15m ago',
    read: false,
    linkTo: '/admin/verification',
  },
  {
    id: 'notif_2',
    title: 'AuraMatch Match Found',
    message: 'Cyberpunk Headphone campaign brief matched with Marcus Webb (96% fit).',
    type: 'brief',
    timestamp: '1h ago',
    read: false,
    linkTo: '/discovery',
  },
  {
    id: 'notif_3',
    title: 'Collaboration Proposal Accepted',
    message: 'Aria Chen accepted your Brand Identity and Copywriting engagement.',
    type: 'collaboration',
    timestamp: 'Yesterday',
    read: true,
    linkTo: '/projects',
  },
];

export const STARTER_PROMPTS = [
  'Help me improve my creator profile.',
  'How can I get my profile verified?',
  'Create a campaign brief for my brand.',
  'Find creators for my campaign.',
  'Explain my creator match score.',
  'Help me improve my portfolio.',
  'What should I do next on GenAura AI?',
];

export const INITIAL_ASSISTANT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome',
    sender: 'assistant',
    text: "Hi! I'm Aura, your GenAura AI assistant. How can I help you today?",
    timestamp: 'Just now',
  },
];
