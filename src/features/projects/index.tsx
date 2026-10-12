/**
 * Projects feature — owned by Member 5.
 * Replace stub content with real implementation.
 * Import useAppStore from '@/lib/store' and ProjectRequest from '@/types'.
 */
import { PageHeader, EmptyState } from '@/components/ui';
import { FolderKanban } from 'lucide-react';

export function ProjectsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Projects"
        subtitle="Manage project requests and active collaborations."
      />
      <EmptyState
        icon={FolderKanban}
        title="Project management — coming soon"
        description="Member 5 is building this module. Use addProject() / updateProject() from useAppStore."
      />
    </div>
  );
}

export function ProjectDetailPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Project Details" />
      <p className="text-navy-500 text-sm">Member 5: implement project detail + collaboration messages here.</p>
    </div>
  );
}
