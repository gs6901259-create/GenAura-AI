/**
 * GenAura AI — Help & Support Center
 * ==================================
 * Interactive FAQ accordions, keyboard shortcuts, contact support,
 * and quick links to Aura Assistant and documentation.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  MessageSquare,
  Sparkles,
  BookOpen,
  Keyboard,
  Send,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/types';

interface FaqItem {
  q: string;
  a: string;
  category: 'creators' | 'brands' | 'verification';
}

const FAQS: FaqItem[] = [
  {
    category: 'verification',
    q: 'How does the 100-Point Creator Verification Rubric work?',
    a: 'Our verification engine scores profiles across 5 categories: Profile Completeness (20 pts), Portfolio Quality (25 pts), Content Originality (20 pts), Professional Readiness (15 pts), and Platform Authenticity (20 pts). Scores of 85+ become eligible for an official badge upon human reviewer audit.',
  },
  {
    category: 'verification',
    q: 'Why was my profile not auto-verified immediately?',
    a: 'GenAura AI enforces a strict human review invariant to protect platform authenticity and prevent AI impersonation. When you submit your profile, status transitions to "submitted", and an editorial admin verifies your live portfolio proof.',
  },
  {
    category: 'brands',
    q: 'What is AuraMatch and how are match scores calculated?',
    a: 'AuraMatch calculates a weighted score combining Niche Synergy (30%), Audience & Quality (20%), Budget Compatibility (15%), Platform Fit (15%), Portfolio Relevance (10%), and Location/Language (10%).',
  },
  {
    category: 'creators',
    q: 'How does the AI Profile Coach help my creator profile?',
    a: 'AI Profile Coach analyzes your bio, experience, and uploaded case studies to suggest high-converting bio rewrites, missing portfolio client credits, and discoverability keywords.',
  },
  {
    category: 'brands',
    q: 'How does BriefGen AI generate campaign deliverables?',
    a: 'BriefGen AI takes your campaign objective, audience demographics, and budget ceiling to formulate multi-format deliverable specifications (e.g. 3D reels, UGC shorts, motion graphics).',
  },
];

export function HelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketSubject('');
      setTicketMessage('');
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left">
      {/* Page Header */}
      <div className="border-b border-navy-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-navy-50">Help & Support</h1>
        <p className="text-xs text-navy-400 mt-1">
          Guides, marketplace specifications, frequently asked questions, and platform assistance.
        </p>
      </div>

      {/* Quick Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate(ROUTES.assistant)}
          className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-violet-500/40 text-left transition-all group"
        >
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-white mb-3 shadow-glow-violet">
            <Sparkles size={20} />
          </div>
          <h3 className="font-bold text-sm text-navy-100 mb-1 group-hover:text-violet-300">
            Ask Aura Assistant
          </h3>
          <p className="text-xs text-navy-400 leading-relaxed">
            Get instant conversational answers regarding verification, briefs, and match scores.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.studio)}
          className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-cyan-500/40 text-left transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-sm text-navy-100 mb-1 group-hover:text-cyan-300">
            Creator Studio Guide
          </h3>
          <p className="text-xs text-navy-400 leading-relaxed">
            Learn how to format case studies, attach client proof, and prepare for verification.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.briefNew)}
          className="p-5 rounded-2xl bg-navy-900 border border-navy-800 hover:border-emerald-500/40 text-left transition-all group"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
            <MessageSquare size={20} />
          </div>
          <h3 className="font-bold text-sm text-navy-100 mb-1 group-hover:text-emerald-300">
            Brand Campaign Tutorial
          </h3>
          <p className="text-xs text-navy-400 leading-relaxed">
            Discover how to configure target audience demographics and deliverables.
          </p>
        </button>
      </div>

      {/* FAQ Accordion Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy-50 flex items-center gap-2">
          <HelpCircle size={18} className="text-violet-400" />
          <span>Frequently Asked Questions</span>
        </h2>

        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-navy-900 border border-navy-800 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs font-semibold text-navy-200 hover:text-white transition-colors"
              >
                <span>{faq.q}</span>
                {openIndex === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openIndex === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-navy-400 leading-relaxed border-t border-navy-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="p-5 rounded-2xl bg-navy-900 border border-navy-800 space-y-3">
        <h3 className="text-xs font-bold text-navy-200 uppercase tracking-wider flex items-center gap-2">
          <Keyboard size={15} />
          <span>Keyboard Shortcuts</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between">
            <span className="text-navy-400">Search</span>
            <kbd className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-navy-300">Ctrl + K</kbd>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between">
            <span className="text-navy-400">Aura Assistant</span>
            <kbd className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-navy-300">Alt + A</kbd>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between">
            <span className="text-navy-400">Settings</span>
            <kbd className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-navy-300">Ctrl + ,</kbd>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 flex items-center justify-between">
            <span className="text-navy-400">Send Message</span>
            <kbd className="px-2 py-0.5 rounded bg-navy-800 text-[10px] text-navy-300">Enter</kbd>
          </div>
        </div>
      </div>

      {/* Contact Support Ticket Simulation Form */}
      <div className="p-6 rounded-2xl bg-navy-900 border border-navy-800 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-navy-100">Contact Support Team</h3>
          <p className="text-xs text-navy-400 mt-0.5">
            Can't find what you need? Send a ticket directly to the platform engineering team.
          </p>
        </div>

        {ticketSubmitted ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Support ticket submitted! Ticket #GEN-{Date.now().toString().slice(-4)} logged.</span>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-3">
            <input
              type="text"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              placeholder="Issue summary or question..."
              required
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500"
            />
            <textarea
              rows={3}
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe what you were doing or what assistance you require..."
              required
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-navy-700 rounded-xl text-xs text-navy-100 focus:outline-none focus:border-violet-500 leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-glow-violet hover:opacity-95 transition-all flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>Submit Ticket</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
