import React, { useState } from 'react';
import type { Creator, CreatorCategory, CreatorStatus } from '@/types';
import { Button, Input } from '@/components/ui';
import { X } from 'lucide-react';

export interface CreatorProfileEditModalProps {
  creator: Creator;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Creator) => void;
}

const CATEGORIES: { value: CreatorCategory; label: string }[] = [
  { value: 'copywriter', label: 'AI Copywriter & Strategist' },
  { value: 'graphic-designer', label: 'Graphic Designer' },
  { value: 'video-editor', label: 'AI Video Editor' },
  { value: 'motion-designer', label: 'Motion & Animation Artist' },
  { value: 'photographer', label: 'AI Photographer & Retoucher' },
  { value: 'illustrator', label: 'Digital Illustrator & Concept Artist' },
  { value: 'ux-designer', label: 'UX / Product Designer' },
  { value: 'social-media-manager', label: 'Social Media Creator' },
  { value: 'content-strategist', label: 'Content Strategist' },
  { value: 'voiceover-artist', label: 'Voiceover Artist & Sound Designer' },
];

export const CreatorProfileEditModal: React.FC<CreatorProfileEditModalProps> = ({
  creator,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(creator.name);
  const [tagline, setTagline] = useState(creator.tagline);
  const [bio, setBio] = useState(creator.bio);
  const [category, setCategory] = useState<CreatorCategory>(creator.category);
  const [status, setStatus] = useState<CreatorStatus>(creator.status);
  const [hourlyRate, setHourlyRate] = useState(creator.hourlyRate);
  const [location, setLocation] = useState(creator.location);
  const [skillsStr, setSkillsStr] = useState(creator.skills.join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!tagline.trim()) errs.tagline = 'Headline / Tagline is required';
    if (!bio.trim()) errs.bio = 'Biography is required';
    if (hourlyRate <= 0) errs.hourlyRate = 'Valid hourly rate is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const skills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updated: Creator = {
      ...creator,
      name: name.trim(),
      tagline: tagline.trim(),
      bio: bio.trim(),
      category,
      status,
      hourlyRate: Number(hourlyRate),
      location: location.trim(),
      skills,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-800 bg-navy-950/60">
          <h2 id="edit-profile-modal-title" className="text-lg font-bold text-navy-50">
            Edit Creator Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded text-navy-400 hover:text-navy-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Creator Display Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Professional Headline / Tagline *
            </label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              error={errors.tagline}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                Specialization Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CreatorCategory)}
                className="w-full rounded-lg bg-navy-800 border border-navy-600 px-3 py-2 text-sm text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                Availability Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CreatorStatus)}
                className="w-full rounded-lg bg-navy-800 border border-navy-600 px-3 py-2 text-sm text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="available">Available for Hire</option>
                <option value="busy">Busy / High Load</option>
                <option value="on-leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                Hourly Rate (USD) *
              </label>
              <Input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                error={errors.hourlyRate}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
                Location
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Biography & Experience *
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg bg-navy-800 border border-navy-600 px-3 py-2 text-sm text-navy-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-vertical"
            />
            {errors.bio && <p className="text-xs text-rose-400 mt-1">{errors.bio}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-300 uppercase tracking-wider mb-1.5">
              Skills (comma separated)
            </label>
            <Input
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. Brand Copy, Figma, AI Video, 3D"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
