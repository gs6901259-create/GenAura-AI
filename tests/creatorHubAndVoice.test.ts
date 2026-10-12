/**
 * Automated Test Suite for GenAura AI:
 * Creator Hub Navigation, Glassmorphism Design System & Hands-Free Aura Voice Mode
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mock browser LocalStorage & Window for Node test runner
class MockLocalStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

(global as any).window = {
  matchMedia: (query: string) => ({
    matches: query.includes('dark'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
};
(global as any).localStorage = new MockLocalStorage();

import { sanitizeMarkdownForSpeech } from '../src/utils/speechUtils.ts';
import { DEFAULT_USER_SETTINGS } from '../src/data/authAndSettingsDefaults.ts';
import { ROUTES } from '../src/types/index.ts';

describe('GenAura AI — Creator Hub, Glassmorphism & Voice Mode Tests', () => {
  it('1. Markdown Sanitization: Cleans markdown headers, bold, italics, and code blocks for spoken TTS', () => {
    const rawMarkdown = `
### Creator Verification Overview
To get **verified** on GenAura AI, your profile must score >= 85 points.
* Criterion 1: *Profile Completeness* (20 pts)
* Criterion 2: Portfolio Quality (25 pts)
\`\`\`ts
const rubricScore = 92;
\`\`\`
Check your status at [Admin Verification](/admin/verification)!
`;
    const cleaned = sanitizeMarkdownForSpeech(rawMarkdown);

    // Code blocks must be replaced or omitted
    assert.strictEqual(cleaned.includes('```'), false, 'Code fence backticks must be removed');
    assert.strictEqual(cleaned.includes('###'), false, 'Header hashes must be removed');
    assert.strictEqual(cleaned.includes('**'), false, 'Bold asterisks must be stripped');
    assert.strictEqual(cleaned.includes('*Profile Completeness*'), false, 'Italics must be plain text');
    assert.strictEqual(cleaned.includes('[Admin Verification]'), false, 'Markdown link brackets must be replaced');
    assert.strictEqual(cleaned.includes('Admin Verification'), true, 'Link label must remain in spoken text');
    assert.strictEqual(cleaned.includes('Criterion 1: Profile Completeness'), true, 'List content is preserved');
  });

  it('2. Markdown Sanitization: Handles empty or plain strings gracefully', () => {
    assert.strictEqual(sanitizeMarkdownForSpeech(''), '');
    assert.strictEqual(
      sanitizeMarkdownForSpeech('Hello! How can I help you today?'),
      'Hello! How can I help you today?'
    );
  });

  it('3. Voice Preferences: Default settings include voiceEnabled, autoSpeakReplies, autoListenNextTurn and speechRate', () => {
    const aiPrefs = DEFAULT_USER_SETTINGS.aiPreferences;
    assert.ok(aiPrefs, 'aiPreferences should exist');
    assert.strictEqual(aiPrefs.voiceEnabled, true, 'voiceEnabled should default to true');
    assert.strictEqual(aiPrefs.autoSpeakReplies, true, 'autoSpeakReplies should default to true');
    assert.strictEqual(aiPrefs.autoListenNextTurn, true, 'autoListenNextTurn should default to true');
    assert.strictEqual(aiPrefs.speechRate, 1.0, 'speechRate should default to 1.0');
  });

  it('4. Creator Hub Routes: Standard routes exist for Creator Studio, AI Coach, and Verification', () => {
    assert.strictEqual(ROUTES.studio, '/studio');
    assert.strictEqual(ROUTES.adminVerification, '/admin/verification');
    assert.strictEqual(ROUTES.dashboard, '/');
    assert.strictEqual(ROUTES.projects, '/projects');
  });

  it('5. Design System: src/index.css defines glassmorphism tokens (.glass-card, .glass-panel, .glass-input, .glass-dropdown)', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(cssContent.includes('.glass-card'), 'src/index.css must define .glass-card');
    assert.ok(cssContent.includes('.glass-panel'), 'src/index.css must define .glass-panel');
    assert.ok(cssContent.includes('.glass-input'), 'src/index.css must define .glass-input');
    assert.ok(cssContent.includes('.glass-dropdown'), 'src/index.css must define .glass-dropdown');
  });

  it('6. Light Theme System: src/index.css defines slate and accent color overrides under html.light', () => {
    const cssPath = path.resolve(process.cwd(), 'src/index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(cssContent.includes('html.light {'), 'src/index.css must contain html.light');
    assert.ok(cssContent.includes('--color-slate-900'), 'Must override slate variables in light theme');
    assert.ok(cssContent.includes('--color-purple-950'), 'Must map purple accent tokens in light theme');
    assert.ok(cssContent.includes('html.light .glass-card'), 'Must define light mode glass-card override');
  });
});
