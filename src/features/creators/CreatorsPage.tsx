import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Creator } from '@/types';
import { useAppStore } from '@/lib/store';
import { PageHeader, Input } from '@/components/ui';
import { CreatorGrid } from './CreatorGrid';
import { Search } from 'lucide-react';
import { asShortlistId } from '@/types';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Specialties', value: 'all' },
  { label: 'Copywriters', value: 'copywriter' },
  { label: 'Graphic Designers', value: 'graphic-designer' },
  { label: 'Motion & Animation', value: 'motion-designer' },
  { label: 'Video Editors', value: 'video-editor' },
  { label: 'Photographers', value: 'photographer' },
  { label: 'Illustrators', value: 'illustrator' },
  { label: 'UX Designers', value: 'ux-designer' },
  { label: 'Social Media', value: 'social-media-manager' },
];

export function CreatorsPage() {
  const navigate = useNavigate();
  const { creators, portfolios, shortlist, addToShortlist, removeFromShortlist } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const shortlistedCreatorIds = useMemo(
    () => shortlist.map((entry) => entry.creatorId),
    [shortlist]
  );

  const handleToggleShortlist = (creator: Creator) => {
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

  const filteredCreators = useMemo(() => {
    return creators.filter((c) => {
      const matchesCategory =
        selectedCategory === 'all' || c.category === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [creators, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Creator Directory"
        subtitle="Discover and collaborate with verified AI content creators, prompt directors, and motion artists."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-navy-400 hidden sm:inline">
              {shortlist.length} creator{shortlist.length === 1 ? '' : 's'} shortlisted
            </span>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-navy-900 border border-navy-700/60 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Search by creator name, specialty, or skills (e.g. Midjourney, Figma, Copy)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1" role="tablist">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-navy-800 text-navy-300 hover:text-white border border-navy-700/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-navy-400 px-1">
        <span>Showing {filteredCreators.length} of {creators.length} verified creators</span>
      </div>

      {/* Creator Grid */}
      <CreatorGrid
        creators={filteredCreators}
        portfolios={portfolios}
        onViewProfile={(creator) => navigate(`/creators/${creator.id}`)}
        onShortlist={handleToggleShortlist}
        shortlistedIds={shortlistedCreatorIds}
      />
    </div>
  );
}
