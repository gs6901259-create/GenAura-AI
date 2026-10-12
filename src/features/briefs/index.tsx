/**
 * Briefs feature — owned by Member 4.
 * Replace stub content with real implementation.
 * Import useAppStore from '@/lib/store' and CreativeBrief from '@/types'.
 */
import { PageHeader, EmptyState, Button } from '@/components/ui';
import { FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BriefsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Briefs"
        subtitle="Create and manage your creative briefs."
        actions={<Button icon={Plus} onClick={() => navigate('/briefs/new')}>New Brief</Button>}
      />
      <EmptyState
        icon={FileText}
        title="Brief builder — coming soon"
        description="Member 4 is building this module. Call addBrief() from useAppStore to persist new briefs."
      />
    </div>
  );
}

export function BriefNewPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Create Brief" subtitle="Define your creative requirements." />
      <p className="text-navy-500 text-sm">Member 4: implement the brief builder form here.</p>
    </div>
  );
}

export function BriefDetailPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Brief Details" />
      <p className="text-navy-500 text-sm">Member 4: implement brief detail and edit views here.</p>
    </div>
  );
}
