/**
 * Creators feature — owned by Member 2.
 * Replace stub content with real implementation.
 * Import useAppStore from '@/lib/store' and Creator types from '@/types'.
 */
import { PageHeader, EmptyState, Button } from '@/components/ui';
import { Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CreatorsPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Creators"
        subtitle="Browse and manage creator profiles and portfolios."
        actions={<Button icon={Plus} onClick={() => navigate('/creators/new')}>Add Creator</Button>}
      />
      <EmptyState
        icon={Users}
        title="Creator directory — coming soon"
        description="Member 2 is building this module. Import useAppStore from '@/lib/store' to access creator data."
      />
    </div>
  );
}

export function CreatorDetailPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Creator Profile" />
      <p className="text-navy-500 text-sm">Member 2: implement creator detail + portfolio here.</p>
    </div>
  );
}
