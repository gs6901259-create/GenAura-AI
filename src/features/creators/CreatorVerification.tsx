import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { ShieldCheck, Info, FileCheck } from 'lucide-react';

export interface CreatorVerificationProps {
  verified: boolean;
  completedProjects: number;
  reviewCount: number;
}

export const CreatorVerification: React.FC<CreatorVerificationProps> = ({
  verified,
  completedProjects,
  reviewCount,
}) => {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span>Verification & Authenticity</span>
        </CardTitle>
      </CardHeader>

      <div
        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
          verified
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-navy-800 border-navy-700/60 text-navy-300'
        }`}
      >
        <FileCheck size={20} className="shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-sm mb-1 text-navy-100">
            {verified ? 'Identity & Portfolio Verified' : 'Community Submitted Profile'}
          </p>
          <p className="text-navy-300">
            {verified
              ? 'Generative workflow seeds, prompt chains, and commercial licensing terms have been validated by GenAura AI reviewers.'
              : 'Credentials and portfolio samples are self-reported by creator and pending review.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/40">
          <span className="text-navy-400 block mb-1">Delivered Briefs</span>
          <span className="text-base font-bold text-navy-100">{completedProjects}</span>
        </div>
        <div className="p-3 rounded-lg bg-navy-800/60 border border-navy-700/40">
          <span className="text-navy-400 block mb-1">Client Reviews</span>
          <span className="text-base font-bold text-navy-100">{reviewCount}</span>
        </div>
      </div>

      <p className="text-[11px] text-navy-500 leading-normal flex items-start gap-1.5 mt-auto">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          GenAura AI verifies creator tools and commercial capabilities for marketplace trust.
        </span>
      </p>
    </Card>
  );
};
