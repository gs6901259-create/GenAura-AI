import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Creator } from '@/types';
import { asCreatorId, asShortlistId } from '@/types';
import { useAppStore } from '@/lib/store';
import { Button, EmptyState } from '@/components/ui';
import { ArrowLeft, UserX } from 'lucide-react';
import { CreatorProfileHeader } from './CreatorProfileHeader';
import { CreatorSkills } from './CreatorSkills';
import { CreatorTools } from './CreatorTools';
import { CreatorVerification } from './CreatorVerification';
import { CreatorProfileEditModal } from './CreatorProfileEditModal';
import { PortfolioManager } from '../portfolio/PortfolioManager';
import { ProposalFormModal } from '@/features/dealRoom';
import { dealService } from '@/services/dealService';

export function CreatorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getCreatorById,
    updateCreator,
    shortlist,
    addToShortlist,
    removeFromShortlist,
    creators,
    briefs,
    authUser,
    addNotification,
  } = useAppStore();

  const creator = id ? getCreatorById(asCreatorId(id)) : undefined;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'skills' | 'tools'>('portfolio');

  if (!creator) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          icon={UserX}
          title="Creator not found"
          description="The creator profile you are looking for does not exist or may have been removed."
          action={
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/creators')}
              className="mt-2"
            >
              Back to Creators
            </Button>
          }
        />
      </div>
    );
  }

  const isShortlisted = shortlist.some((s) => s.creatorId === creator.id);

  const handleToggleShortlist = () => {
    const existing = shortlist.find((s) => s.creatorId === creator.id);
    if (existing) {
      removeFromShortlist(existing.id);
    } else {
      addToShortlist({
        id: asShortlistId(`sl_${Date.now()}`),
        creatorId: creator.id,
        status: 'saved',
        addedAt: new Date().toISOString(),
      });
    }
  };

  const handleProfileSave = (updated: Creator) => {
    updateCreator(creator.id, updated);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb / Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/creators')}
          className="text-navy-400 hover:text-white"
        >
          Back to Creators
        </Button>
      </div>

      {/* Main Header */}
      <CreatorProfileHeader
        creator={creator}
        isOwner={false}
        onEditProfile={() => setIsEditModalOpen(true)}
        onShortlist={handleToggleShortlist}
        isShortlisted={isShortlisted}
        onContact={() => navigate('/briefs/new')}
        onInitiateDeal={() => setIsDealModalOpen(true)}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-navy-800 gap-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'portfolio'}
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'portfolio'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          Portfolio Gallery
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'skills'}
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'skills'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          Capabilities & Verification
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'tools'}
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === 'tools'
              ? 'border-violet-500 text-white'
              : 'border-transparent text-navy-400 hover:text-navy-200'
          }`}
        >
          AI Tools & Workflow
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'portfolio' && (
        <div role="tabpanel" className="space-y-4">
          <PortfolioManager creator={creator} />
        </div>
      )}

      {activeTab === 'skills' && (
        <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreatorSkills skills={creator.skills} category={creator.category} />
          <CreatorVerification
            verified={creator.verified}
            completedProjects={creator.completedProjects}
            reviewCount={creator.reviewCount}
          />
        </div>
      )}

      {activeTab === 'tools' && (
        <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreatorTools category={creator.category} skills={creator.skills} />
          <CreatorVerification
            verified={creator.verified}
            completedProjects={creator.completedProjects}
            reviewCount={creator.reviewCount}
          />
        </div>
      )}

      {/* Edit Profile Modal */}
      <CreatorProfileEditModal
        creator={creator}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleProfileSave}
      />

      {/* Smart Deal Proposal Modal */}
      {isDealModalOpen && (
        <ProposalFormModal
          creators={creators}
          briefs={briefs}
          preselectedCreator={creator}
          onClose={() => setIsDealModalOpen(false)}
          onSubmit={(params) => {
            const res = dealService.createProposal({
              title: params.title,
              campaignObjective: params.campaignObjective,
              briefId: params.brief?.id,
              briefTitle: params.brief?.title,
              brand: {
                id: 'brand-current',
                role: 'brand',
                name: authUser?.name || 'GenAura Brand Sponsor',
                handle: `@${authUser?.username || 'genaurabrand'}`,
                avatarUrl:
                  authUser?.avatarUrl ||
                  'https://api.dicebear.com/7.x/identicon/svg?seed=brand',
                email: authUser?.email,
              },
              creator: {
                id: creator.id,
                role: 'creator',
                name: creator.name,
                handle: creator.handle,
                avatarUrl: creator.avatarUrl,
                email: creator.email,
              },
              terms: params.terms,
              asDraft: params.asDraft,
              senderRole: 'brand',
              senderName: authUser?.name || 'Brand Lead',
            });

            if (res.success && res.deal) {
              addNotification({
                id: `notif_${Date.now()}`,
                title: params.asDraft ? 'Deal Draft Saved' : 'Deal Proposal Dispatched',
                message: `Proposal "${res.deal.title}" was ${
                  params.asDraft ? 'saved as draft' : 'sent to ' + creator.name
                }.`,
                type: 'collaboration',
                timestamp: new Date().toISOString(),
                read: false,
                linkTo: `/deals/${res.deal.id}`,
              });
              setIsDealModalOpen(false);
              navigate(`/deals/${res.deal.id}`);
            }
          }}
        />
      )}
    </div>
  );
}
