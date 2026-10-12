import React from 'react';
import { Zap, ShieldCheck, Sparkles, Info } from 'lucide-react';
import { Badge } from '@/components/ui';

export interface DemoBadgeBannerProps {
  compact?: boolean;
}

export const DemoBadgeBanner: React.FC<DemoBadgeBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <Badge variant="violet">
        <span className="flex items-center gap-1">
          <Zap size={11} className="text-amber-400" />
          <span>Demo Mode: Template Generated</span>
        </span>
      </Badge>
    );
  }

  return (
    <div className="bg-gradient-to-r from-violet-950/40 via-navy-900/60 to-cyan-950/40 border border-violet-500/30 rounded-xl p-4 flex items-start gap-3 shadow-lg shadow-violet-950/20">
      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-violet-500/30">
        <Sparkles size={18} />
      </div>

      <div className="flex-1 text-left">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-navy-50">
            Demo-Mode Generation Engine
          </span>
          <Badge variant="info">
            Zero API Credentials Required
          </Badge>
        </div>

        <p className="text-xs text-navy-300 mt-1 leading-relaxed">
          This brief was deterministically generated via GenAura AI’s embedded rule & template synthesis engine.
          Outputs are 100% reproducible, instantaneous, private, and require zero third-party API keys or cloud tokens.
        </p>

        <div className="flex items-center gap-4 mt-2 text-[11px] text-navy-400">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-400" /> 100% Offline Capable
          </span>
          <span className="flex items-center gap-1">
            <Zap size={13} className="text-amber-400" /> Zero-Latency Synthesis
          </span>
          <span className="flex items-center gap-1">
            <Info size={13} className="text-cyan-400" /> Fully Editable Output
          </span>
        </div>
      </div>
    </div>
  );
};
