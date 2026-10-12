/**
 * GenAura AI — Aura Assistant Service
 * ====================================
 * Powers the conversational AI assistant "Aura".
 * Connects to live Google Gemini API if VITE_GEMINI_API_KEY is configured,
 * or gracefully runs the robust, explainable Deterministic Knowledge Engine.
 *
 * Never exposes secrets in frontend code.
 */
import { ChatMessage } from '@/types';

export interface AssistantResponse {
  text: string;
  actionLink?: {
    label: string;
    to: string;
  };
  isLiveModel: boolean;
  modelName: string;
}

export interface AssistantContext {
  currentPage?: string;
  userRole?: string;
  userName?: string;
}

const SYSTEM_PROMPT = `You are Aura, the expert AI Assistant for GenAura AI, an AI Content Creator Marketplace ("Discover Creators. Empower Creativity.").
You help Creators build standout profiles, pass the 100-point verification rubric, and manage portfolios.
You help Brands craft campaign briefs (BriefGen AI), discover verified creators with 6-factor AuraMatch scoring, and manage collaboration requests.
Keep your responses helpful, concise, actionable, and formatted in clean markdown. Always maintain a professional, encouraging SaaS demeanor.`;

class AiAssistantService {
  private apiKey: string = '';
  private model: string = 'gemini-1.5-flash';

  constructor() {
    this.apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
    this.model = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_MODEL) || 'gemini-1.5-flash';
  }

  public hasLiveApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  public getModelInfo(): { isLive: boolean; modelName: string; notice: string } {
    if (this.hasLiveApiKey()) {
      return {
        isLive: true,
        modelName: this.model,
        notice: 'Connected to live Gemini API provider.',
      };
    }
    return {
      isLive: false,
      modelName: 'GenAura Rule-Based Knowledge Engine (Deterministic)',
      notice: 'Demo AI mode — connect an AI provider for full conversational responses.',
    };
  }

  /**
   * Generates a response to a user prompt, utilizing live Gemini API if configured
   * or rich context-aware knowledge fallback.
   */
  public async generateReply(
    userMessage: string,
    history: ChatMessage[] = [],
    context: AssistantContext = {}
  ): Promise<AssistantResponse> {
    const trimmed = userMessage.trim();

    // 1. If API key exists, call Gemini REST API securely
    if (this.hasLiveApiKey()) {
      try {
        const response = await this.callGeminiApi(trimmed, history, context);
        return {
          text: response,
          isLiveModel: true,
          modelName: this.model,
          actionLink: this.detectActionLink(trimmed),
        };
      } catch (err) {
        console.warn('Gemini API request encountered an issue. Falling back to knowledge engine:', err);
        // Fall through to deterministic engine with transparent indicator
      }
    }

    // 2. Deterministic Knowledge Engine Fallback
    const fallbackResponse = this.generateDeterministicResponse(trimmed, context);
    return {
      text: fallbackResponse.text,
      actionLink: fallbackResponse.actionLink,
      isLiveModel: false,
      modelName: 'GenAura Knowledge Engine (Demo Fallback)',
    };
  }

  /**
   * Calls Gemini REST API
   */
  private async callGeminiApi(
    prompt: string,
    history: ChatMessage[],
    context: AssistantContext
  ): Promise<string> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const contextPrefix = `[Current Context: Page="${context.currentPage || 'general'}", UserRole="${context.userRole || 'brand'}", UserName="${context.userName || 'User'}"]\n`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextPrefix}User Question: ${prompt}` }],
      },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API Error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      throw new Error('No candidate content received from Gemini API');
    }
    return candidate;
  }

  /**
   * Deterministic Knowledge Engine: Recognizes core GenAura AI topics
   */
  private generateDeterministicResponse(
    query: string,
    context: AssistantContext
  ): { text: string; actionLink?: { label: string; to: string } } {
    const q = query.toLowerCase();

    // 1. Creator Discovery & AuraMatch Questions (Check first so "match score" routes here)
    if (q.includes('match') || q.includes('auramatch') || q.includes('find creator') || q.includes('discover')) {
      return {
        text: `### ⚡ AuraMatch 6-Factor Matching Engine

AuraMatch pairs your campaign briefs with creators based on a weighted 6-factor rubric:
1. **Niche & Domain Alignment (30%):** Category and topic synergy.
2. **Audience & Quality Fit (20%):** Engagement rate, follower tier, and past project reviews.
3. **Budget Compatibility (15%):** Creator starting rates vs. campaign budget ceiling.
4. **Platform & Format Fit (15%):** Capability in requested formats (Reels, 3D, UGC).
5. **Portfolio Relevance (10%):** Quality of tagged client case studies.
6. **Location & Language (10%):** Preferred working region and spoken languages.

Click **"Why this match?"** on any creator card in Discovery to inspect the exact score breakdown!`,
        actionLink: { label: 'Explore Creator Discovery', to: '/discovery' },
      };
    }

    // 2. Verification & Rubric Questions
    if (q.includes('verif') || q.includes('rubric') || q.includes('badge') || q.includes('score')) {
      return {
        text: `### 🛡️ GenAura AI Verification Guidelines

Creator verification uses our transparent **100-Point Rubric**:
- **Profile Completeness (20 pts):** Bio ($\ge 40$ chars), niche, declared rates, social links.
- **Portfolio Quality & Proof (25 pts):** At least 3 work samples with client credits and high-res media.
- **Content Originality (20 pts):** Rich project descriptions and varied content formats.
- **Professional Readiness (15 pts):** Documented experience and collaboration retainers.
- **Platform Authenticity (20 pts):** Verified portfolio link and multi-platform presence.

**Decision Thresholds:**
- **$\ge 85$ points:** Eligible for human reviewer badge approval.
- **$65 - 84$ points:** Needs changes (check review feedback for missing proof).
- **$< 65$ points:** Requires profile enhancement.

> **Important Invariant:** Submitting your profile moves you to \`submitted\` status. Verified badges are **only** awarded after human editorial review to prevent fraudulent auto-verification.`,
        actionLink: { label: 'Open Verification Portal', to: '/studio' },
      };
    }

    // 3. Campaign Brief Questions
    if (q.includes('brief') || q.includes('campaign') || q.includes('briefgen')) {
      return {
        text: `### 📝 Creating a Campaign Brief with BriefGen AI

You can create campaign briefs in minutes:
1. **Define Objective:** State brand goal (e.g. brand awareness, product launch, conversions).
2. **Target Audience:** Specify demographics, age range, and core interests.
3. **Select Deliverables:** Pick content formats (Reels, TikTok UGC, 3D animations, Long-form).
4. **Set Budget & Timeline:** Establish budget range and delivery milestones.

Once generated, **AuraMatch** automatically calculates match scores across all creators in the marketplace!`,
        actionLink: { label: 'Create New Campaign Brief', to: '/briefs/new' },
      };
    }

    // 4. Creator Profile & Bio Enhancement
    if (q.includes('profile') || q.includes('bio') || q.includes('portfolio') || q.includes('coach')) {
      return {
        text: `### ✨ Profile & Portfolio Optimization

To maximize your discoverability on GenAura AI:
- **Bio Formula:** State your specialization + years of experience + client impact in the first 2 sentences.
- **Tagging:** Add 3–5 specific tags (e.g., \`3D Motion\`, \`Blender\`, \`Tech UGC\`).
- **Client Attribution:** Tag real client names and your specific role (e.g., *Lead Director*).
- **Pricing Transparency:** Set a clear starting rate and collaboration retainer options.

Head over to **Creator Studio** to use our built-in **AI Profile Coach** for instant bio rewrites!`,
        actionLink: { label: 'Open Creator Studio', to: '/studio' },
      };
    }

    // 5. Collaboration Requests & Projects
    if (q.includes('collab') || q.includes('project') || q.includes('request') || q.includes('hire')) {
      return {
        text: `### 🤝 Collaboration Lifecycle

GenAura AI streamlines partnerships through an accountable workflow:
1. **Send Request:** Brand selects a creator from Discovery or Shortlist and links a brief.
2. **Creator Review:** Creator reviews the scope, deliverables, and rate—then accepts or declines with notes.
3. **Milestone Tracking:** Track progress from \`in-progress\` to \`review\` and final delivery.
4. **Audit History:** Every status change is timestamped for transparent record-keeping.`,
        actionLink: { label: 'View Active Projects', to: '/projects' },
      };
    }

    // 6. Navigation, Settings, and Themes
    if (q.includes('theme') || q.includes('setting') || q.includes('dark') || q.includes('light') || q.includes('account')) {
      return {
        text: `### ⚙️ Account & Appearance Settings

You can customize your GenAura AI workspace:
- **Themes:** Toggle between **Dark Mode** (Midnight Navy), **Light Mode** (Clean Slate), or **System Preference**. Use the sun/moon icon in the top header or visit Settings.
- **Profile:** Update your display name, username, bio, and portfolio links.
- **Privacy & Export:** Control profile discoverability and download your full marketplace data.`,
        actionLink: { label: 'Open Settings Page', to: '/settings' },
      };
    }

    // 7. General Next Steps & Guidance
    return {
      text: `Hello! As your **Aura Assistant**, here is what you can do on GenAura AI:
- **For Brands:** [Create a Campaign Brief](/briefs/new) or [Discover Verified Creators](/discovery) using our 6-factor AuraMatch engine.
- **For Creators:** [Build Your Studio Profile](/studio), polish your portfolio, and run the [AI Profile Coach](/studio) to get verified.
- **For Admins:** [Review the Verification Queue](/admin/verification) against our 100-point rubric.

Feel free to ask any specific question about verification criteria, brief generation, or match score breakdowns!`,
      actionLink: { label: 'Go to Discovery', to: '/discovery' },
    };
  }

  private detectActionLink(prompt: string): { label: string; to: string } | undefined {
    const p = prompt.toLowerCase();
    if (p.includes('brief') || p.includes('campaign')) {
      return { label: 'Open BriefGen AI', to: '/briefs/new' };
    }
    if (p.includes('profile') || p.includes('studio') || p.includes('portfolio')) {
      return { label: 'Open Creator Studio', to: '/studio' };
    }
    if (p.includes('verif') || p.includes('rubric')) {
      return { label: 'View Verification', to: '/studio' };
    }
    if (p.includes('discover') || p.includes('match') || p.includes('search')) {
      return { label: 'Explore Creators', to: '/discovery' };
    }
    if (p.includes('project') || p.includes('collab')) {
      return { label: 'View Projects', to: '/projects' };
    }
    if (p.includes('setting') || p.includes('theme')) {
      return { label: 'Open Settings', to: '/settings' };
    }
    return undefined;
  }
}

export const aiAssistantService = new AiAssistantService();
