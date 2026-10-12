import { CreativeBriefContent, CreativeBriefPillar } from '@/types';

export interface BriefGeneratorInput {
  title: string;
  brandName: string;
  category: string;
  objective: string;
  contentType: string;
  demographics: string;
  painPoints: string;
  budgetTotal: number;
  currency: string;
  channels: string[];
  tone: string;
  startDate: string;
  deadline: string;
  callToAction: string;
}

/**
 * Deterministic template-based brief generator.
 * Operates 100% locally with zero external API credentials or cloud dependencies.
 * Yields identical, reproducible results for the same inputs.
 */
export function generateDeterministicBriefContent(
  input: Partial<BriefGeneratorInput>
): CreativeBriefContent {
  const brand = input.brandName?.trim() || 'Brand';
  const title = input.title?.trim() || `${brand} Campaign`;
  const category = input.category || 'Tech & SaaS';
  const objective = input.objective || 'brand_awareness';
  const tone = input.tone || 'Authentic & Relatable';
  const budgetTotal = Number(input.budgetTotal) || 15000;
  const currency = input.currency || 'INR';
  const channels = input.channels && input.channels.length > 0 ? input.channels : ['Instagram', 'TikTok'];
  const demographics = input.demographics?.trim() || 'Modern digitally savvy consumers';
  const painPoints = input.painPoints?.trim() || 'Workflow inefficiencies and friction points';
  const callToAction = input.callToAction?.trim() || 'Visit our website to get started';

  const objectiveDescriptions: Record<string, string> = {
    brand_awareness: `maximize high-affinity audience reach and brand recall for ${brand}`,
    product_launch: `orchestrate an explosive market debut for ${title}, driving early adopter adoption`,
    conversion: `generate measurable direct response transactions and customer acquisitions for ${brand}`,
    user_acquisition: `funnel high-intent trial sign-ups and app installations into ${brand}`,
    community_engagement: `foster participatory creator advocacy and organic community co-creation for ${brand}`,
  };

  const objectiveText = objectiveDescriptions[objective] || `boost organic resonance and creator-led storytelling for ${brand}`;

  const executiveSummary =
    `The "${title}" campaign is architected to ${objectiveText}. Operating within the ${category} landscape, ` +
    `this campaign mobilizes trusted creators across ${channels.join(', ')} utilizing an '${tone}' tone. ` +
    `By pairing authoritative lifestyle storytelling with tangible before-and-after proof points, ` +
    `this initiative turns attention into trust and measurable action within the ${currency} ${budgetTotal.toLocaleString()} budget envelope.`;

  const targetPersonaNarrative =
    `The target demographic centers on ${demographics}. These consumers are actively frustrated by "${painPoints}". ` +
    `They exhibit high media literacy, skip corporate infomercials, and prioritize unvarnished peer recommendations. ` +
    `Content under this brief must demonstrate real-world transformation within the opening 3 seconds.`;

  const keyMessagingPillars: CreativeBriefPillar[] = [
    {
      pillar: 'The Problem Agitation & Epiphany',
      description: `Surface the daily friction of "${painPoints}" and introduce ${brand} as the effortless unlock.`,
      hookExamples: [
        `"If you're still dealing with ${painPoints.split(',')[0] || 'this old hassle'}, watch this immediately..."`,
        `"POV: You finally stopped doing this the hard way and tried ${brand}."`,
        `"The 1 mistake 90% of people make when handling this issue:"`,
      ],
    },
    {
      pillar: 'Tangible Daily Transformation',
      description: `Showcase authentic, unhurried integration into the creator's real day-to-day workflow.`,
      hookExamples: [
        `"Here's what happened when I used ${brand} for 7 days straight:"`,
        `"3 reasons why ${brand} replaced everything else in my routine:"`,
        `"This 45-second routine literally saved me 4 hours this week:"`,
      ],
    },
    {
      pillar: 'Social Proof & Action Call',
      description: `Solidify brand safety and direct viewers toward immediate action (${callToAction}).`,
      hookExamples: [
        `"I tested 4 different options so you don't have to—here's why ${brand} won."`,
        `"Everyone in my comments was asking about this, so here is the honest truth:"`,
      ],
    },
  ];

  const contentStrategy = channels
    .map((ch) => `• [${ch.toUpperCase()}]: Native, high-cadence storytelling highlighting real utility and transparent feedback.`)
    .join('\n');

  const estimatedImpressions = Math.round((budgetTotal / 20) * 1000);
  const estimatedClicks = Math.round(estimatedImpressions * 0.022);

  const kpiBenchmarks = [
    { metric: 'Target Gross Views', target: `${estimatedImpressions.toLocaleString()} Plays` },
    { metric: 'Target Engagement Rate', target: '≥ 4.5% (Saves & Shares)' },
    { metric: 'Estimated Outbound Clicks', target: `${estimatedClicks.toLocaleString()} Clicks` },
    { metric: 'Target Blended CPM', target: `${currency} ${(budgetTotal / (estimatedImpressions / 1000)).toFixed(2)}` },
  ];

  const creatorPool = Math.round(budgetTotal * 0.70);
  const paidAmplification = Math.round(budgetTotal * 0.20);
  const contingency = budgetTotal - creatorPool - paidAmplification;

  const budgetBreakdown = [
    { category: 'Creator Talent & Production Fees', amount: creatorPool, percentage: 70 },
    { category: 'Paid Creator Amplification / Spark Ads', amount: paidAmplification, percentage: 20 },
    { category: 'Production Buffer & Shipping', amount: contingency, percentage: 10 },
  ];

  const creatorCriteria = {
    tier: budgetTotal > 30000 ? 'Mid-Tier (50k-250k followers)' : 'Micro-Tier (10k-50k followers)',
    minEngagementRate: '3.8%',
    aestheticVibe: `${tone} visual language with crisp audio and high camera confidence`,
    niche: [category, 'Content Creation', 'Lifestyle Storytelling'],
  };

  return {
    executiveSummary,
    targetPersonaNarrative,
    keyMessagingPillars,
    contentStrategy,
    kpiBenchmarks,
    budgetBreakdown,
    creatorCriteria,
    generatedAt: new Date().toISOString(),
    isDemoGenerated: true,
    modelNotice: '⚡ Demo-Mode: Deterministic Template Engine (No API Credentials Required)',
  };
}
