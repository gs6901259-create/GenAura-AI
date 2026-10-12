import { PageHeader } from '@/components/ui';
import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences."
      />
      <p className="text-navy-500 text-sm flex items-center gap-2">
        <Settings size={16} /> Settings page — coming soon.
      </p>
    </div>
  );
}
