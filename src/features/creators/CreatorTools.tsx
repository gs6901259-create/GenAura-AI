import React from 'react';
import type { CreatorCategory } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui';
import { Cpu, Terminal } from 'lucide-react';

export interface CreatorToolsProps {
  category: CreatorCategory;
  skills?: string[];
}

export const CreatorTools: React.FC<CreatorToolsProps> = ({ category }) => {
  const getToolsForCategory = (cat: CreatorCategory) => {
    switch (cat) {
      case 'motion-designer':
      case 'video-editor':
        return ['Runway Gen-3', 'Pika Labs', 'ElevenLabs', 'After Effects', 'Topaz Video AI'];
      case 'copywriter':
      case 'content-strategist':
        return ['Claude 3.5 Sonnet', 'GPT-4o', 'Jasper AI', 'Notion AI', 'Grammarly'];
      case 'photographer':
      case 'graphic-designer':
      case 'illustrator':
      case 'ux-designer':
        return ['Midjourney v6', 'Adobe Firefly', 'Photoshop AI', 'Magnific AI', 'ComfyUI'];
      case 'voiceover-artist':
        return ['ElevenLabs', 'Descript', 'Adobe Audition', 'Suno AI', 'iZotope'];
      default:
        return ['Midjourney v6', 'Runway Gen-3', 'ChatGPT Plus', 'Canva Magic Studio'];
    }
  };

  const tools = getToolsForCategory(category);

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader className="mb-0">
        <CardTitle className="flex items-center gap-2">
          <Cpu size={16} className="text-cyan-400" />
          <span>Generative AI Tools & Pipeline</span>
        </CardTitle>
      </CardHeader>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
          Active Generative Models & Software
        </h4>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <span
              key={tool}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-300 flex items-center gap-1.5"
            >
              <Terminal size={12} />
              <span>{tool}</span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-2">
          Production Workflow & Methodology
        </h4>
        <div className="flex flex-col gap-2 text-xs text-navy-300">
          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-navy-800/50 border border-navy-700/40">
            <span className="h-5 w-5 rounded bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <strong className="text-navy-100 block">Brief & Prompt Engineering:</strong>
              Iterative concept prompt grids, mood boarding, and style locking.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-navy-800/50 border border-navy-700/40">
            <span className="h-5 w-5 rounded bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <strong className="text-navy-100 block">Generative Synthesis:</strong>
              High-resolution generation, seed matching, and parameter tuning.
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-navy-800/50 border border-navy-700/40">
            <span className="h-5 w-5 rounded bg-violet-600/30 text-violet-300 font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <strong className="text-navy-100 block">Post-Production & Refinement:</strong>
              Upscaling, detail repainting, color grading, and commercial delivery.
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
