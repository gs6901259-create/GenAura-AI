/**
 * GenAura AI — Aura Assistant Service
 * ====================================
 * Powers the conversational AI assistant "Aura" for both text chat & hands-free voice.
 * Connects to live Google Gemini API if VITE_GEMINI_API_KEY is configured,
 * or gracefully runs the robust, context-aware Deterministic Knowledge Engine.
 *
 * Never exposes secrets in frontend client code.
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

const SYSTEM_PROMPT = `You are Aura, the expert AI Assistant and voice companion for GenAura AI, an AI-powered Content Creator Marketplace ("Discover Creators. Empower Creativity.").

Your core responsibilities:
1. GenAura AI Domain Expertise:
   - Creator Tools: Guide creators through Creator Studio, AI Profile Coach (bio rewrites, hook formulas), and Portfolio Showcase.
   - 100-Point Verification Rubric: Explain criteria (Profile Completeness 20pts, Portfolio Quality 25pts, Content Originality 20pts, Professional Readiness 15pts, Platform Authenticity 20pts). State clearly that >=85 pts qualifies for human review approval.
   - Upgraded 7-Factor AuraMatch Engine (v2.1 Multilingual):
     * Niche Match (25%): Category and thematic synergy with campaign requirements.
     * Audience Alignment (20%): Target demographic match, engagement rate, and verified follower tier.
     * Language Compatibility (15%): Matches creator languages with campaign required languages. Mandatory language criteria disqualifies non-matching creators.
     * Content Tone & Style Fit (15%): Alignment with brand tone taxonomy (15 standard tones, formality & energy constraints).
     * Budget Fit (10%): Creator rates vs. campaign budget ceiling in INR.
     * Platform Relevance (10%): Match across deliverables and platforms (Instagram, YouTube, TikTok, LinkedIn).
     * Regional & Market Expertise (5%): Creator regional knowledge and audience geographic distribution.
     * Strict Enforcement: Failing mandatory language or region criteria strictly marks a creator as disqualified ("Disqualified (Mandatory Criteria)"), caps score at 48%, and details specific violations.
   - Multilingual Campaign Briefs (BriefGen AI):
     * Supports 18 languages (English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Urdu, Spanish, French, German, Arabic, Portuguese, Japanese, Korean).
     * Generates structured 18-section briefs with regional preferences, localized CTAs, and cultural context.
     * Generates linked language variants and allows side-by-side comparison while strictly preserving the canonical campaign ID and INR budget.
   - Content Tone Taxonomy: 15 standard tones (Authentic & Relatable, Authoritative & Thought Leadership, Educational & Informative, Witty & Humorous, Inspiring & Uplifting, Conversational & Friendly, Bold & Disruptive, Elegant & Premium, Cinematic & Story-Driven, Playful & Vibrant, Analytical & Data-Driven, Empathetic & Warm, Edgy & Unconventional, Minimalist & Direct, Dramatic & Urgent).
   - Collaboration & Deal Room: Guide users on proposals, counteroffers, audit trails, and deliverable review stages.
   - Digital Wallet & Collaboration Payments: Explain how users manage Indian Rupee (₹ INR) balances (Available, Pending, Reserved in Escrow), add funds via UPI/Cards/NetBanking, lock milestone payments in escrow, and withdraw earnings.
   - Currency Standards: All budgets, rates, proposals, and wallet transactions use Indian Rupees (₹ INR) with en-IN formatting (₹500, ₹1,500, ₹25,000, ₹1,25,000, ₹10,00,000). Recommend budgets by creator tier: Nano (₹2,000–₹5,000), Micro (₹5,000–₹25,000), Mid (₹25,000–₹1,00,000), Macro (₹1,00,000+).

2. General World Knowledge & Creative Strategy:
   - Answer general knowledge, geography, history, science, and calculation questions accurately and concisely (e.g., "What is the capital of Japan?" -> Tokyo).
   - Generate creative marketing concepts, campaign ideas, and copywriting hooks for brands in any industry (fitness, beauty, gaming, tech, etc.).

Tone: Encouraging, concise, professional, and formatted in clean markdown.`;

// Known world capitals for instant, accurate general knowledge answers in demo mode
const WORLD_CAPITALS: Record<string, string> = {
  japan: 'Tokyo (東京都)',
  france: 'Paris',
  germany: 'Berlin',
  'united kingdom': 'London',
  uk: 'London',
  england: 'London',
  'united states': 'Washington, D.C.',
  usa: 'Washington, D.C.',
  america: 'Washington, D.C.',
  canada: 'Ottawa',
  australia: 'Canberra',
  india: 'New Delhi',
  italy: 'Rome',
  spain: 'Madrid',
  brazil: 'Brasília',
  china: 'Beijing',
  russia: 'Moscow',
  mexico: 'Mexico City',
  'south korea': 'Seoul',
  korea: 'Seoul',
  indonesia: 'Jakarta (Nusantara in development)',
  egypt: 'Cairo',
  argentina: 'Buenos Aires',
  turkey: 'Ankara',
  greece: 'Athens',
  portugal: 'Lisbon',
  sweden: 'Stockholm',
  norway: 'Oslo',
  denmark: 'Copenhagen',
  switzerland: 'Bern',
  netherlands: 'Amsterdam',
  ireland: 'Dublin',
  singapore: 'Singapore',
  'new zealand': 'Wellington',
  thailand: 'Bangkok',
  vietnam: 'Hanoi',
  philippines: 'Manila',
  malaysia: 'Kuala Lumpur',
  uae: 'Abu Dhabi',
  'united arab emirates': 'Abu Dhabi',
  'saudi arabia': 'Riyadh',
  south_africa: 'Pretoria (administrative), Cape Town (legislative), Bloemfontein (judicial)',
};

const isDev = Boolean(
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV) ||
  (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV !== 'production')
);

class AiAssistantService {
  private apiKey: string = '';
  private model: string = 'gemini-1.5-flash';

  constructor() {
    this.apiKey =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
      (typeof globalThis !== 'undefined' &&
        ((globalThis as any).process?.env?.VITE_GEMINI_API_KEY ||
          (globalThis as any).process?.env?.GEMINI_API_KEY)) ||
      '';
    this.model =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_MODEL) ||
      (typeof globalThis !== 'undefined' &&
        ((globalThis as any).process?.env?.VITE_AI_MODEL ||
          (globalThis as any).process?.env?.AI_MODEL)) ||
      'gemini-1.5-flash';
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
   * Generates a contextually relevant response to a user prompt.
   * Utilizes the live Google Gemini API if configured with VITE_GEMINI_API_KEY,
   * or delegates to the comprehensive, explainable Deterministic Knowledge Engine.
   */
  public async sendMessage(
    userMessage: string,
    context: AssistantContext = {}
  ): Promise<AssistantResponse> {
    return this.generateReply(userMessage, [], context);
  }

  public async generateReply(
    userMessage: string,
    history: ChatMessage[] = [],
    context: AssistantContext = {}
  ): Promise<AssistantResponse> {
    const trimmed = userMessage.trim();

    if (isDev) {
      console.log('[Aura AI Request] Received user prompt:', {
        prompt: trimmed,
        isLiveModelAvailable: this.hasLiveApiKey(),
        context,
      });
    }

    // 1. If API key exists, call Gemini REST API securely
    if (this.hasLiveApiKey()) {
      try {
        const responseText = await this.callGeminiApi(trimmed, history, context);
        const actionLink = this.detectActionLink(trimmed);

        if (isDev) {
          console.log('[Aura AI Response] Gemini API responded successfully:', {
            model: this.model,
            textLength: responseText.length,
          });
        }

        return {
          text: responseText,
          isLiveModel: true,
          modelName: this.model,
          actionLink,
        };
      } catch (err) {
        console.warn('[Aura AI] Gemini API request failed. Gracefully falling back to Knowledge Engine:', err);
      }
    }

    // 2. Deterministic Knowledge Engine Fallback
    const fallbackResponse = this.generateDeterministicResponse(trimmed, context);

    if (isDev) {
      console.log('[Aura AI Response] Deterministic Knowledge Engine generated reply:', {
        prompt: trimmed,
        actionLink: fallbackResponse.actionLink?.to,
      });
    }

    return {
      text: fallbackResponse.text,
      actionLink: fallbackResponse.actionLink,
      isLiveModel: false,
      modelName: 'GenAura Knowledge Engine (Demo Fallback)',
    };
  }

  /**
   * Calls Gemini REST API with system context
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
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextPrefix}User Prompt: ${prompt}` }],
      },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
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
   * Deterministic Knowledge Engine: Recognizes core GenAura AI topics,
   * campaign brainstorming requests, and general world knowledge questions.
   */
  private generateDeterministicResponse(
    query: string,
    context: AssistantContext
  ): { text: string; actionLink?: { label: string; to: string } } {
    const q = query.toLowerCase().trim();

    // ─────────────────────────────────────────────────────────────────────────
    // 1. GENERAL KNOWLEDGE: Capital Cities & Geography
    // Example: "What is the capital of Japan?" -> Tokyo
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('capital') || q.includes('capital city')) {
      for (const [country, capital] of Object.entries(WORLD_CAPITALS)) {
        if (q.includes(country)) {
          const capitalizedCountry = country
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          return {
            text: `The capital of **${capitalizedCountry}** is **${capital}**.`,
          };
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. GENERAL INQUIRIES: "What is GenAura AI?" / Marketplace Purpose
    // ─────────────────────────────────────────────────────────────────────────
    if (
      (q.includes('what is') && q.includes('genaura')) ||
      (q.includes('tell me about') && q.includes('genaura')) ||
      q.includes('what does genaura do') ||
      q.includes('genaura overview') ||
      q.includes('about the platform') ||
      q === 'genaura ai'
    ) {
      return {
        text: `### 🌟 Welcome to GenAura AI
**Discover Creators. Empower Creativity.**

**GenAura AI** is an AI-powered content creator marketplace that seamlessly connects forward-thinking brands with verified content creators through intelligent workflows:

1. **⚡ AuraMatch 7-Factor Matching (v2.1):** Pairs campaign requirements with creator strengths based on Niche (25%), Audience (20%), Language (15%), Content Tone (15%), Budget (10%), Platform (10%), and Regional Expertise (5%).
2. **📝 Multilingual BriefGen AI:** Guides brands through automated generation of comprehensive 18-section campaign briefs across 18 regional and global languages, with linked variants and side-by-side comparison.
3. **🎨 Creator Hub:** Features the **Creator Studio**, an interactive **AI Profile Coach** for bio rewrites and hooks, and a transparent **100-Point Verification Rubric**.
4. **🤝 Smart Deal Room:** Manages end-to-end collaboration agreements with versioned proposals, counteroffers, real-time messaging, and audit-logged milestones.`,
        actionLink: { label: 'Explore Creator Discovery', to: '/discovery' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CREATOR OPTIMIZATION: "How do I improve my creator profile?"
    // ─────────────────────────────────────────────────────────────────────────
    if (
      (q.includes('improve') && (q.includes('profile') || q.includes('creator'))) ||
      (q.includes('how do i') && q.includes('profile')) ||
      q.includes('optimize profile') ||
      q.includes('profile tips') ||
      q.includes('make my profile better')
    ) {
      return {
        text: `### 🚀 5 Actionable Steps to Improve Your Creator Profile:

To maximize brand discovery and achieve an eligible verification score on GenAura AI:

1. **Craft a High-Impact Bio:**
   - Clearly state your creative specialty, industry niche, and client results in the first 2 sentences.
   - Use our 3-part bio formula: *[Specialty] + [Client Types] + [Unique Value/Impact]*.

2. **Curate Portfolio Case Studies:**
   - Feature at least 3–5 high-quality pieces demonstrating diverse deliverables (Shorts, Reels, 3D, UGC).
   - Attribute real client names and highlight project performance metrics (impressions, conversion lifts).

3. **Set Transparent Pricing & Packages:**
   - Provide clear starting rates for common formats (e.g., ₹25,000/Reel, ₹1,25,000/Monthly Retainer).
   - Brands filter by budget; transparent pricing ensures you appear in compatible searches.

4. **Verify Your Social Handles:**
   - Connect your Instagram, YouTube, TikTok, and portfolio links to authenticate your audience engagement.

5. **Run the AI Profile Coach:**
   - Use our built-in **AI Profile Coach** in Creator Studio for real-time bio score analysis and automated rewrites!`,
        actionLink: { label: 'Open AI Profile Coach', to: '/studio?tab=coach' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CAMPAIGN BRAINSTORMING: "Suggest three campaign ideas for a fitness brand"
    // ─────────────────────────────────────────────────────────────────────────
    if (
      (q.includes('campaign ideas') || q.includes('suggest') || q.includes('three campaign')) &&
      (q.includes('fitness') || q.includes('gym') || q.includes('workout') || q.includes('wellness') || q.includes('brand'))
    ) {
      return {
        text: `### 🏋️ 3 High-Impact Campaign Ideas for a Fitness Brand:

Here are three creator campaign concepts tailored for athletic apparel, nutrition, or workout equipment:

1. **The 'Day 1 vs. Day 30' Realistic Transformation Journey (Short-Form UGC)**
   - **Format:** Weekly Instagram Reels & TikTok episodic series (4 videos per creator).
   - **Concept:** Partner with micro and mid-tier fitness creators to document genuine progress using your gear or nutrition plan. Focus on consistency, honest reflections, and daily routines rather than unrealistic quick fixes.
   - **Call-to-Action:** Creator-exclusive promo code offering a complimentary 30-day challenge starter guide.

2. **'What I Wear & Fuel My Body With' Cinematic Routine (Aesthetic Shorts/Reels)**
   - **Format:** High-energy 45–60 second cinematic vlog with seamless transitions and trending audio.
   - **Concept:** Creators demonstrate fabric breathability, squat-proof durability, or pre-workout energy during intense training sessions, followed by post-workout cooldowns.
   - **Call-to-Action:** Direct link to your seasonal capsule collection with an exclusive bundle discount.

3. **'Form Check & Fitness Myth Busting' Educational Series (Interactive Community Content)**
   - **Format:** Carousel infographics + dual-screen stitch/duet videos.
   - **Concept:** Certified trainer creators debunk common exercise mistakes while wearing or using your product, positioning your brand as a trustworthy authority in athletic science.
   - **Call-to-Action:** "Tag your gym partner who needs this tip" + link to full training gear in bio.

Would you like to turn one of these concepts into a structured campaign brief using **BriefGen AI**?`,
        actionLink: { label: 'Create Campaign Brief', to: '/briefs/new' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. VERIFICATION & RUBRIC: "What does my verification score mean?"
    // ─────────────────────────────────────────────────────────────────────────
    if (
      q.includes('verif') ||
      (q.includes('score') && (q.includes('mean') || q.includes('rubric') || q.includes('what does'))) ||
      q.includes('100-point') ||
      q.includes('badge approval')
    ) {
      return {
        text: `### 🛡️ Understanding Your GenAura AI Verification Score

Your score is calculated using our transparent **100-Point Rubric**:

- **Profile Completeness (20 pts):** Bio ($\ge 40$ chars), declared primary niche, base rates, and contact links.
- **Portfolio Quality & Proof (25 pts):** At least 3 verified case studies with high-resolution media and client attribution.
- **Content Originality (20 pts):** Authentic creative work spanning diverse formats (Reels, TikTok, 3D, UGC).
- **Professional Readiness (15 pts):** Documented client collaboration history and defined turnaround times.
- **Platform Authenticity (20 pts):** Verified portfolio link, active social profiles, and authentic audience signals.

**Score Tiers:**
- **$\ge 85$ Points:** High score! Eligible for human reviewer badge approval and priority placement in AuraMatch discovery.
- **$65 - 84$ Points:** Changes requested. Review your personalized feedback in Creator Studio to address missing client proof.
- **$< 65$ Points:** Needs enhancement. Add portfolio samples and complete missing profile details to qualify.

> **Important Marketplace Rule:** Profile submission sets your status to \`submitted\`. Verification badges are awarded **only after human reviewer approval** to guarantee marketplace authenticity.`,
        actionLink: { label: 'Open Creator Studio', to: '/studio' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CAMPAIGN BRIEFS: "How can I create a campaign brief?"
    // ─────────────────────────────────────────────────────────────────────────
    if (
      (q.includes('brief') && (q.includes('create') || q.includes('how') || q.includes('make') || q.includes('start'))) ||
      q.includes('briefgen') ||
      q.includes('campaign brief')
    ) {
      return {
        text: `### 📝 How to Create a Campaign Brief with BriefGen AI:

Creating an effective brief takes under 2 minutes:

1. **Navigate to BriefGen AI:** Click **BriefGen AI** in the sidebar navigation or visit \`/briefs/new\`.
2. **Define Objective & Campaign Goals:** Select your primary goal (*Brand Awareness*, *Product Launch*, *App Downloads*, or *Conversions*).
3. **Specify Target Audience:** Detail demographic traits, age bands, and lifestyle affinities.
4. **Select Content Deliverables:** Choose required formats (e.g., 2x Instagram Reels, 1x TikTok UGC, 3D Product Renders).
5. **Set Budget & Timeline:** Enter your total campaign budget ceiling and required delivery deadlines.
6. **Generate Brief:** Click **Generate Brief with AI** to produce structured creative guardrails, visual dos and don'ts, and required hashtags.
7. **Pair with Creators:** Once saved, **AuraMatch** automatically calculates compatibility scores across all creators in the marketplace!`,
        actionLink: { label: 'Create New Campaign Brief', to: '/briefs/new' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. SMART DEAL ROOM & NEGOTIATIONS
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('deal') || q.includes('negotiat') || q.includes('counteroffer') || q.includes('contract')) {
      return {
        text: `### 🤝 Smart Deal Room & Proposal Management

The **Smart Deal Room** streamlines creator agreements and negotiations:
- **Proposals:** Brands submit formal offers with itemized deliverables, budgets, and milestones.
- **Counteroffers:** Creators can propose revisions to rates, timelines, or deliverables with automatic version diffing.
- **Audit Log:** Every interaction, note, and counteroffer is immutably timestamped for complete accountability.
- **Deliverable Reviews:** Creators submit work for approval directly within the deal room, tracking drafts and approvals.`,
        actionLink: { label: 'Open Smart Deal Room', to: '/deals' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. DISCOVERY & AURAMATCH
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('match') || q.includes('auramatch') || q.includes('find creator') || q.includes('discover')) {
      return {
        text: `### ⚡ AuraMatch 7-Factor Matching Engine (v2.1 Multilingual)

AuraMatch calculates creator compatibility based on our mathematically balanced 7-factor engine (totaling 100%):
1. **Niche Alignment (25% base, up to 30%):** Category and thematic synergy with campaign requirements.
2. **Audience Alignment (20%):** Target demographic match, engagement rate, and verified follower tier.
3. **Language Compatibility (15%):** Spoken, content, and deliverable language alignment.
4. **Content Tone & Style Fit (15%):** Alignment with brand tone taxonomy (15 standard tones), formality, and energy.
5. **Budget Compatibility (10%):** Creator starting rates vs. campaign budget ceiling in INR.
6. **Platform & Format Fit (10%):** Capability across requested formats and platforms (Reels, Shorts, TikTok, 3D, UGC).
7. **Regional & Cultural Expertise (5%):** Local market understanding and audience geographic concentration.

> **Strict Mandatory Criteria:** If a campaign sets mandatory language or market requirements, any creator not meeting them is marked **"Disqualified (Mandatory Criteria)"** with their score capped at 48% and violations clearly itemized.

Click **"Why this match?"** on any creator card in Discovery to inspect the 3-tab breakdown (Scores, Tone Fit Evidence, Regional Context)!`,
        actionLink: { label: 'Explore Creator Discovery', to: '/discovery' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8B. MULTILINGUAL CAMPAIGNS & CONTENT TONES
    // ─────────────────────────────────────────────────────────────────────────
    if (
      q.includes('multilingual') ||
      q.includes('language') ||
      q.includes('translate') ||
      q.includes('hindi') ||
      q.includes('telugu') ||
      q.includes('tamil') ||
      q.includes('tone') ||
      q.includes('tones') ||
      q.includes('regional')
    ) {
      return {
        text: `### 🌐 Multilingual Campaigns & Content Tone Intelligence

GenAura AI supports hyper-localized global and regional campaigns:

1. **18 Supported Brief Languages:**
   - **Indian Regional:** English, Hindi (हिंदी), Telugu (తెలుగు), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), Urdu (اردو).
   - **Global:** Spanish (Español), French (Français), German (Deutsch), Arabic (العربية), Portuguese (Português), Japanese (日本語), Korean (한국어).

2. **15 Standard Content Tones:**
   - Authentic & Relatable, Authoritative & Thought Leadership, Educational & Informative, Witty & Humorous, Inspiring & Uplifting, Conversational & Friendly, Bold & Disruptive, Elegant & Premium, Cinematic & Story-Driven, Playful & Vibrant, Analytical & Data-Driven, Empathetic & Warm, Edgy & Unconventional, Minimalist & Direct, Dramatic & Urgent.

3. **Linked Language Variants & Side-by-Side Review:**
   - Generate localized brief variants without fracturing campaigns.
   - Preserves canonical Campaign ID and integer-paise INR budget integrity.
   - Side-by-side comparison displays key sections, localized CTAs, and cultural themes.`,
        actionLink: { label: 'Create Multilingual Brief', to: '/briefs/new' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 9. COLLABORATION REQUESTS & PROJECTS
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('collab') || q.includes('project') || q.includes('request') || q.includes('hire')) {
      return {
        text: `### 🤝 Collaboration Request Workflow

GenAura AI streamlines partnerships through an accountable lifecycle:
1. **Send Request:** A brand selects a creator from Discovery or Shortlist and attaches a campaign brief.
2. **Creator Review:** The creator reviews deliverables, scope, and compensation, then accepts or declines with feedback.
3. **Milestone Tracking:** The project moves to active production with structured draft submissions and revisions.
4. **Audit Trail:** Every status change is recorded with timestamps for transparent record-keeping.`,
        actionLink: { label: 'View Active Collaborations', to: '/projects' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 10. SETTINGS & THEMES
    // ─────────────────────────────────────────────────────────────────────────
    if (q.includes('theme') || q.includes('setting') || q.includes('dark') || q.includes('light') || q.includes('account')) {
      return {
        text: `### ⚙️ Account & Appearance Settings

You can customize your GenAura AI workspace anytime:
- **Theme Modes:** Toggle between **Dark Mode** (Midnight Navy), **Light Mode** (Clean Slate), or **System Preference**.
- **AI Preferences:** Configure voice assistant auto-read options and speech rate in **Settings > AI Preferences**.
- **Data Export:** Download your marketplace profile and project records in JSON format.`,
        actionLink: { label: 'Open Settings Page', to: '/settings' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 11. INR WALLET, DIGITAL ESCROW & COLLABORATION PAYMENTS
    // ─────────────────────────────────────────────────────────────────────────
    if (
      q.includes('wallet') ||
      q.includes('balance') ||
      q.includes('payment') ||
      q.includes('payout') ||
      q.includes('withdraw') ||
      q.includes('inr') ||
      q.includes('rupee') ||
      q.includes('escrow') ||
      q.includes('razorpay') ||
      q.includes('gst') ||
      q.includes('tax') ||
      q.includes('deposit')
    ) {
      return {
        text: `### 💳 GenAura AI — INR Wallet & Milestone Escrow

All financial operations on GenAura AI are conducted in **Indian Rupees (₹ INR)** with exact integer-paise accounting (1 INR = 100 paise):

1. **Balance Architecture:**
   - **Available Balance:** Funds spendable on new proposals or withdrawable via UPI / Bank IMPS.
   - **Reserved (Escrow) Balance:** Locked funds deposited for accepted milestone agreements, released only upon deliverable review approval.
   - **Pending Balance:** Settling incoming transfers or gateway clearances.

2. **Milestone Escrow Workflow:**
   - **Deposit:** Brands fund agreed milestones in advance into secure escrow.
   - **Review:** Creators submit work for approval inside the Smart Deal Room.
   - **Release:** Upon brand approval, funds release instantly into the creator's available wallet balance.

3. **Recommended Creator Pricing Benchmarks (INR):**
   - **Nano Creators (1k–10k followers):** ₹2,000 – ₹5,000 per deliverable
   - **Micro Creators (10k–50k followers):** ₹5,000 – ₹25,000 per deliverable
   - **Mid-Tier Creators (50k–250k followers):** ₹25,000 – ₹1,00,000 per campaign
   - **Macro Creators (250k+ followers):** ₹1,00,000+ per campaign

4. **Payouts & Invoices:**
   - Withdrawals support instant **UPI (VPA)** and **Direct Bank Transfer (NEFT/IMPS with IFSC)**.
   - Downloadable GST-compliant invoices and digital audit receipts are generated for every completed transaction.`,
        actionLink: { label: 'Open INR Wallet & Earnings', to: '/wallet' },
      };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 12. GENERAL CONVERSATIONAL FALLBACK (Intent-Aware, Never repetitive upload loop)
    // ─────────────────────────────────────────────────────────────────────────
    return {
      text: `Hello! I am **Aura**, your GenAura AI assistant.

I can help you with:
- **For Brands:** [Create Campaign Briefs](/briefs/new) with BriefGen AI, brainstorm campaign ideas, and [Discover Creators](/discovery) using our 6-factor AuraMatch engine.
- **For Creators:** [Open Creator Studio](/studio) to optimize your bio with the AI Profile Coach, review the [100-Point Verification Rubric](/studio), and showcase your portfolio.
- **For Payments & Wallet:** [Manage INR Wallet](/wallet) to add funds, monitor milestone escrow, or request payouts in Indian Rupees (₹).
- **For Collaborations:** Negotiate in the [Smart Deal Room](/deals) or manage [Collaboration Requests](/projects).

*(Operating in Demo AI mode. For open-ended conversation across any topic, you can configure a live Gemini API key in [Settings](/settings).)*`,
      actionLink: { label: 'Explore Creator Discovery', to: '/discovery' },
    };
  }

  private detectActionLink(prompt: string): { label: string; to: string } | undefined {
    const p = prompt.toLowerCase();
    if (p.includes('wallet') || p.includes('payout') || p.includes('balance') || p.includes('escrow') || p.includes('withdraw') || p.includes('inr')) {
      return { label: 'Open INR Wallet', to: '/wallet' };
    }
    if (p.includes('brief') || p.includes('campaign')) {
      return { label: 'Open BriefGen AI', to: '/briefs/new' };
    }
    if (p.includes('coach') || p.includes('bio')) {
      return { label: 'Open AI Profile Coach', to: '/studio?tab=coach' };
    }
    if (p.includes('profile') || p.includes('studio') || p.includes('portfolio') || p.includes('verif') || p.includes('rubric')) {
      return { label: 'Open Creator Studio', to: '/studio' };
    }
    if (p.includes('discover') || p.includes('match') || p.includes('search')) {
      return { label: 'Explore Creators', to: '/discovery' };
    }
    if (p.includes('deal') || p.includes('negotiat')) {
      return { label: 'Open Smart Deal Room', to: '/deals' };
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
