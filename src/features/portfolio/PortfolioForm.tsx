import React, { useState } from 'react';
import type { PortfolioItem, PortfolioMediaType, CreatorId } from '@/types';
import { asPortfolioId } from '@/types';
import { Button, Input } from '@/components/ui';
import { X } from 'lucide-react';
import { generateId } from './portfolioUtils';

export interface PortfolioFormProps {
  creatorId: CreatorId;
  initialItem?: PortfolioItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PortfolioItem) => void;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  creatorId,
  initialItem,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialItem?.title || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [mediaType, setMediaType] = useState<PortfolioMediaType>(initialItem?.mediaType || 'image');
  const [mediaUrl, setMediaUrl] = useState(initialItem?.mediaUrl || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initialItem?.thumbnailUrl || '');
  const [clientName, setClientName] = useState(initialItem?.clientName || '');
  const [externalUrl, setExternalUrl] = useState(initialItem?.externalUrl || '');
  const [tagsStr, setTagsStr] = useState(initialItem?.tags?.join(', ') || '');
  const [featured, setFeatured] = useState(initialItem?.featured || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Project title is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!mediaUrl.trim()) errs.mediaUrl = 'Media / Asset URL is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const item: PortfolioItem = {
      id: initialItem?.id || asPortfolioId(generateId('p')),
      creatorId,
      title: title.trim(),
      description: description.trim(),
      mediaType,
      mediaUrl: mediaUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim() || undefined,
      clientName: clientName.trim() || undefined,
      externalUrl: externalUrl.trim() || undefined,
      tags,
      publishedAt: initialItem?.publishedAt || new Date().toISOString(),
      featured,
    };

    onSave(item);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portfolio-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/60">
          <h2 id="portfolio-form-title" className="text-lg font-bold text-navy-50">
            {initialItem ? 'Edit Portfolio Project' : 'Add New Portfolio Project'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="p-1 rounded text-navy-400 hover:text-navy-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Project Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cyberpunk Cinematic Concept"
              error={errors.title}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                Media Format *
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as PortfolioMediaType)}
                className="w-full rounded-lg bg-navy-800 border border-navy-600 px-3 py-2 text-sm text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="image">AI Image / Render</option>
                <option value="video">AI Video / Animation</option>
                <option value="link">Web / Interactive Link</option>
                <option value="pdf">Pitch Deck / PDF</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                Client / Brand Name
              </label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Nike, Acme AI"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Media Asset URL *
            </label>
            <Input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://picsum.photos/seed/project/800/600"
              error={errors.mediaUrl}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Optional Thumbnail URL
            </label>
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://picsum.photos/seed/project/400/300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Live External Demo URL
            </label>
            <Input
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://artstation.com/... or https://vimeo.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Description & Workflow *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the deliverables, prompt engineering, and models utilized."
              className="w-full rounded-lg bg-navy-800 border border-navy-600 px-3 py-2 text-sm text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-vertical"
            />
            {errors.description && (
              <p className="text-xs text-rose-400 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Tags (comma separated)
            </label>
            <Input
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="Midjourney, 3D, Campaign, SciFi"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pf-featured"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-navy-600 bg-navy-800 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="pf-featured" className="text-sm font-medium text-navy-200 cursor-pointer">
              Pin as Featured Project
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialItem ? 'Save Changes' : 'Add to Portfolio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
