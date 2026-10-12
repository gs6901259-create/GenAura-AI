import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui';
import { storageService } from '@/services/storageService';
import {
  CollaborationProject,
  CollaborationFilterOptions,
} from '@/contracts/collaborationContract';
import { CreatorProfile, Shortlist } from '@/contracts/discoveryContract';
import { MetricsCards } from '@/components/collaboration/dashboard/MetricsCards';
import { CollaborationFilters } from '@/components/collaboration/dashboard/CollaborationFilters';
import { KanbanBoard } from '@/components/collaboration/dashboard/KanbanBoard';
import { CollaborationTable } from '@/components/collaboration/dashboard/CollaborationTable';
import { ProjectDetailModal } from '@/components/collaboration/dashboard/ProjectDetailModal';
import { CreateRequestModal } from '@/components/collaboration/modals/CreateRequestModal';
import { CreatorPortalView } from '@/components/collaboration/creator/CreatorPortalView';
import { ShortlistIntegrationView } from '@/components/collaboration/shortlists/ShortlistIntegrationView';
import { Users, FolderKanban, ListChecks } from 'lucide-react';

export function ProjectsPage() {
  const [activeTab, setActiveTab] = useState<'board' | 'creator-portal' | 'shortlist-outreach'>('board');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filters, setFilters] = useState<CollaborationFilterOptions>({
    status: 'all',
    briefId: 'all',
    creatorId: 'all',
    search: '',
    platform: 'all',
  });

  const [projects, setProjects] = useState<CollaborationProject[]>([]);
  const [creators, setCreators] = useState(storageService.getCreators());
  const [briefs, setBriefs] = useState(storageService.getBriefs());
  const [shortlists, setShortlists] = useState(storageService.getShortlists());
  const [metrics, setMetrics] = useState(storageService.getMetrics());

  const [selectedProject, setSelectedProject] = useState<CollaborationProject | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialCreator, setModalInitialCreator] = useState<CreatorProfile | null>(null);
  const [modalInitialShortlist, setModalInitialShortlist] = useState<Shortlist | null>(null);
  const [viewingCreatorId, setViewingCreatorId] = useState<string>(
    storageService.getViewingCreatorId()
  );

  const refreshData = () => {
    setProjects(storageService.getCollaborations(filters));
    setCreators(storageService.getCreators());
    setBriefs(storageService.getBriefs());
    setShortlists(storageService.getShortlists());
    setMetrics(storageService.getMetrics());
  };

  useEffect(() => {
    storageService.ensureInitialized();
    refreshData();
    const unsubscribe = storageService.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, [filters]);

  const handleSimulateCreator = (creatorId: string) => {
    setViewingCreatorId(creatorId);
    storageService.setViewingCreatorId(creatorId);
    setActiveTab('creator-portal');
    setSelectedProject(null);
  };

  const handleInitiateFromShortlist = (creator: CreatorProfile, shortlist?: Shortlist) => {
    setModalInitialCreator(creator);
    setModalInitialShortlist(shortlist || null);
    setIsCreateModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Collaboration & Projects"
          subtitle="Manage creator outreach, brief-linked requests, deliverable lifecycles, and accept/decline actions."
        />

        {/* View Persona / Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900/60 border border-navy-800">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'board'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-navy-300 hover:text-navy-100'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Project Board</span>
          </button>
          <button
            onClick={() => setActiveTab('shortlist-outreach')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'shortlist-outreach'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-navy-300 hover:text-navy-100'
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" />
            <span>Shortlist Outreach</span>
          </button>
          <button
            onClick={() => setActiveTab('creator-portal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'creator-portal'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-navy-300 hover:text-navy-100'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Creator POV</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Project Board (Brand POV) */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          <MetricsCards
            metrics={metrics}
            onFilterStatus={(st) => setFilters((f) => ({ ...f, status: st as any }))}
          />

          <CollaborationFilters
            filters={filters}
            onFilterChange={setFilters}
            briefs={briefs}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onOpenCreateModal={() => {
              setModalInitialCreator(null);
              setModalInitialShortlist(null);
              setIsCreateModalOpen(true);
            }}
          />

          {viewMode === 'kanban' ? (
            <KanbanBoard
              projects={projects}
              creators={creators}
              briefs={briefs}
              onSelectProject={setSelectedProject}
            />
          ) : (
            <CollaborationTable
              projects={projects}
              creators={creators}
              briefs={briefs}
              onSelectProject={setSelectedProject}
              onSimulateCreatorView={handleSimulateCreator}
            />
          )}
        </div>
      )}

      {/* Tab 2: Shortlist Outreach */}
      {activeTab === 'shortlist-outreach' && (
        <ShortlistIntegrationView
          shortlists={shortlists}
          creators={creators}
          projects={projects}
          onInitiateCollaboration={handleInitiateFromShortlist}
          onSelectProject={setSelectedProject}
        />
      )}

      {/* Tab 3: Creator POV Portal */}
      {activeTab === 'creator-portal' && (
        <CreatorPortalView
          creators={creators}
          briefs={briefs}
          projects={projects}
          viewingCreatorId={viewingCreatorId}
          onViewingCreatorChange={(id) => {
            setViewingCreatorId(id);
            storageService.setViewingCreatorId(id);
          }}
          onRefresh={refreshData}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          creators={creators}
          briefs={briefs}
          onClose={() => setSelectedProject(null)}
          onRefresh={refreshData}
          onSimulateCreatorView={handleSimulateCreator}
        />
      )}

      {/* Create Request Modal */}
      {isCreateModalOpen && (
        <CreateRequestModal
          creators={creators}
          briefs={briefs}
          shortlists={shortlists}
          initialCreator={modalInitialCreator}
          initialShortlist={modalInitialShortlist}
          onClose={() => {
            setIsCreateModalOpen(false);
            setModalInitialCreator(null);
            setModalInitialShortlist(null);
          }}
          onSuccess={(newProj) => {
            setIsCreateModalOpen(false);
            setModalInitialCreator(null);
            setModalInitialShortlist(null);
            refreshData();
            setSelectedProject(newProj);
          }}
        />
      )}
    </div>
  );
}

export function ProjectDetailPage() {
  return <ProjectsPage />;
}
