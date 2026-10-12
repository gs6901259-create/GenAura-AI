/**
 * Discovery feature — owned by Member 3.
 * Replace stub content with real implementation.
 * Import useAppStore from '@/lib/store' and types from '@/types'.
 */
import { PageHeader, EmptyState } from '@/components/ui';
import { Search } from 'lucide-react';

export function DiscoveryPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Discovery"
        subtitle="Find and match creators to your briefs using AI-powered recommendations."
      />
      <EmptyState
        icon={Search}
        title="Creator discovery — coming soon"
        description="Member 3 is building this module. Use ROUTES from '@/types' for navigation links."
      />
    </div>
  );
}

export function ShortlistPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Shortlist"
        subtitle="Creators you've saved for your projects."
      />
      <EmptyState
        icon={Search}
        title="Shortlist — coming soon"
        description="Member 3 is building this module. Read ShortlistEntry[] from useAppStore."
      />
    </div>
  );
}
