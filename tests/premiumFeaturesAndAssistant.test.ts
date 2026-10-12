/**
 * Automated Test Suite for GenAura AI Premium Features:
 * Authentication, Theme System, Settings, Aura Assistant, and Notifications.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser LocalStorage & Document for Node environment
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

class MockElement {
  classList = {
    classes: new Set<string>(),
    add: (c: string) => this.classList.classes.add(c),
    remove: (c: string) => this.classList.classes.delete(c),
    contains: (c: string) => this.classList.classes.has(c),
  };
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
}

const mockDocElement = new MockElement();

(global as any).window = {
  matchMedia: (query: string) => ({
    matches: query.includes('dark'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
};
(global as any).document = {
  documentElement: mockDocElement,
};
(global as any).localStorage = new MockLocalStorage();

import { applyTheme, getSystemTheme, initializeTheme } from '../src/lib/theme.ts';
import { aiAssistantService } from '../src/services/aiAssistantService.ts';
import { DEFAULT_DEMO_USERS, DEFAULT_USER_SETTINGS, STARTER_PROMPTS } from '../src/data/authAndSettingsDefaults.ts';
import { AuthUser, ThemeMode } from '../src/types/index.ts';

describe('GenAura AI — Premium Features & Assistant Test Suite', () => {

  // Test 1: Theme System & Application
  it('1. Theme System: Toggles light and dark classes on document root', () => {
    const resolvedDark = applyTheme('dark');
    assert.equal(resolvedDark, 'dark');
    assert.equal(mockDocElement.classList.contains('dark'), true);
    assert.equal(mockDocElement.classList.contains('light'), false);

    const resolvedLight = applyTheme('light');
    assert.equal(resolvedLight, 'light');
    assert.equal(mockDocElement.classList.contains('light'), true);
    assert.equal(mockDocElement.classList.contains('dark'), false);

    const resolvedSystem = applyTheme('system');
    assert.ok(resolvedSystem === 'light' || resolvedSystem === 'dark');
  });

  // Test 2: System Theme Resolution
  it('2. System Theme: Resolves system preference via matchMedia', () => {
    const sysTheme = getSystemTheme();
    assert.equal(sysTheme, 'dark'); // based on our mock
  });

  // Test 3: Demo Accounts Integrity
  it('3. Authentication: Default demo accounts exist for Brand, Creator, and Admin personas', () => {
    const brand = DEFAULT_DEMO_USERS.brand;
    const creator = DEFAULT_DEMO_USERS.creator;
    const admin = DEFAULT_DEMO_USERS.admin;

    assert.equal(brand.role, 'brand');
    assert.equal(brand.email, 'sarah@aurabrand.com');

    assert.equal(creator.role, 'creator');
    assert.equal(creator.username, 'elenacreates');

    assert.equal(admin.role, 'admin');
    assert.equal(admin.email, 'admin@genaura.ai');
  });

  // Test 4: Aura Assistant — Model Info & Fallback State
  it('4. Aura Assistant: Reports fallback engine status transparently when no live key is set', () => {
    const info = aiAssistantService.getModelInfo();
    assert.equal(info.isLive, false);
    assert.ok(info.notice.includes('Demo AI mode'));
    assert.ok(info.modelName.includes('Knowledge Engine') || info.modelName.includes('Deterministic'));
  });

  // Test 5: Aura Assistant — Verification Inquiry
  it('5. Aura Assistant: Answers verification queries with 100-point rubric breakdown and action links', async () => {
    const reply = await aiAssistantService.generateReply('How can I get my profile verified?');
    assert.ok(reply.text.includes('100-Point Rubric'), 'Reply must explain 100-point rubric');
    assert.ok(reply.text.includes('Profile Completeness'), 'Reply must cite criteria');
    assert.ok(reply.text.includes('85'), 'Reply must state 85 threshold');
    assert.ok(reply.actionLink, 'Reply should provide an action shortcut');
    assert.equal(reply.isLiveModel, false);
  });

  // Test 6: Aura Assistant — Campaign Brief Guidance
  it('6. Aura Assistant: Answers campaign brief queries and links to BriefGen AI', async () => {
    const reply = await aiAssistantService.generateReply('How do I create a campaign brief?');
    assert.ok(reply.text.includes('BriefGen AI'), 'Reply should reference BriefGen AI');
    assert.ok(reply.text.includes('Objective') || reply.text.includes('Deliverables'));
    assert.ok(reply.actionLink?.to === '/briefs/new');
  });

  // Test 7: Aura Assistant — Match Score Inquiry
  it('7. Aura Assistant: Explains 6-factor AuraMatch scoring weights', async () => {
    const reply = await aiAssistantService.generateReply('Explain my creator match score');
    assert.ok(reply.text.includes('AuraMatch'), 'Reply should reference AuraMatch');
    assert.ok(reply.text.includes('30%') && reply.text.includes('20%'), 'Reply should list factor percentages');
    assert.ok(reply.actionLink?.to === '/discovery');
  });

  // Test 8: Starter Prompts Coverage
  it('8. Starter Prompts: All 7 required prompts generate meaningful responses', async () => {
    assert.equal(STARTER_PROMPTS.length, 7, 'Must have exactly 7 starter prompts');

    for (const prompt of STARTER_PROMPTS) {
      const res = await aiAssistantService.generateReply(prompt);
      assert.ok(res.text.length > 50, `Prompt "${prompt}" returned insufficient response length`);
    }
  });

  // Test 9: Default User Settings Structure
  it('9. User Settings: Default settings include all 6 categories', () => {
    const settings = DEFAULT_USER_SETTINGS;
    assert.ok(settings.profile.displayName);
    assert.ok(settings.account.email);
    assert.ok(settings.appearance.theme);
    assert.equal(typeof settings.notifications.collaborationRequests, 'boolean');
    assert.equal(typeof settings.privacy.discoverabilityEnabled, 'boolean');
    assert.equal(typeof settings.aiPreferences.autoSuggestions, 'boolean');
  });
});
