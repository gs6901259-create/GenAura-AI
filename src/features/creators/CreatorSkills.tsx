import React from 'react';
import type { CreatorCategory } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { Sparkles, Layers, CheckCircle } from 'lucide-react';

export interface CreatorSkillsProps {
  skills: string[];
  category: CreatorCategory;
}

export const CreatorSkills: React.FC<CreatorSkillsProps> = ({ skills, category }) => {
  return (
    <Card className="flex flex-col gap-5">
      <CardHeader className="mb-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet-400" />
          <span>Core Capabilities & Skills</span>
        </CardTitle>
      </CardHeader>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
          Primary Specialization
        </h4>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600/15 border border-violet-500/30 text-xs font-semibold text-violet-300 capitalize">
          <Layers size={13} />
          <span>{category.replace('-', ' ')}</span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
          Skills & Techniques
        </h4>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700/60 text-xs font-medium text-navy-200"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
          Quality Guarantees
        </h4>
        <ul className="text-xs text-navy-300 space-y-1.5">
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span>Commercial production licenses included</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span>High-resolution master asset delivery</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span>Iterative revision milestones supported</span>
          </li>
        </ul>
      </div>
    </Card>
  );
};
