import type { PortfolioMediaType } from '@/types';

export const MEDIA_TYPE_ICONS: Record<PortfolioMediaType, string> = {
  image: '🖼️',
  video: '🎬',
  link: '🔗',
  pdf: '📄',
};

export const MEDIA_TYPE_LABELS: Record<PortfolioMediaType, string> = {
  image: 'AI Image / Visual',
  video: 'AI Video / Motion',
  link: 'Interactive / Web Link',
  pdf: 'Creative Deck / PDF',
};

export function generateId(prefix = 'p'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
