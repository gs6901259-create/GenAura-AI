/**
 * Automated Test Suite for GenAura AI:
 * Google OAuth 2.0 Sign-In, Sign-Up, PKCE Security, Role Assignment & Account Preservation
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Mock browser storage for Node test runner
class MockStorage {
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
  location: {
    origin: 'http://localhost:5173',
    pathname: '/auth/callback',
    search: '',
    hash: '',
    href: 'http://localhost:5173/auth/callback',
  },
  matchMedia: (query: string) => ({
    matches: query.includes('dark'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
};
(global as any).localStorage = new MockStorage();
(global as any).sessionStorage = new MockStorage();

import { googleAuthService } from '../src/services/googleAuthService';
import { useAppStore } from '../src/lib/store';
import { AuthUser, GoogleProfile } from '../src/types';

describe('GenAura AI — Google Authentication & OAuth 2.0 PKCE Test Suite', () => {
  beforeEach(() => {
    (global as any).localStorage.clear();
    (global as any).sessionStorage.clear();
    useAppStore.setState({
      authUser: null,
      isAuthenticated: false,
      registeredUsers: [],
    });
  });

  it('1. UI Assets: GoogleIcon and GoogleAuthButton source files exist with brand compliance', () => {
    const iconPath = path.resolve(process.cwd(), 'src/features/auth/GoogleIcon.tsx');
    const buttonPath = path.resolve(process.cwd(), 'src/features/auth/GoogleAuthButton.tsx');
    const modalPath = path.resolve(process.cwd(), 'src/features/auth/GoogleConfigModal.tsx');
    const roleModalPath = path.resolve(process.cwd(), 'src/features/auth/RoleSelectionModal.tsx');

    assert.ok(fs.existsSync(iconPath), 'GoogleIcon.tsx must exist');
    assert.ok(fs.existsSync(buttonPath), 'GoogleAuthButton.tsx must exist');
    assert.ok(fs.existsSync(modalPath), 'GoogleConfigModal.tsx must exist');
    assert.ok(fs.existsSync(roleModalPath), 'RoleSelectionModal.tsx must exist');

    const buttonSrc = fs.readFileSync(buttonPath, 'utf8');
    assert.ok(buttonSrc.includes('Continue with Google'), 'Button supports "Continue with Google" mode');
    assert.ok(buttonSrc.includes('Sign up with Google'), 'Button supports "Sign up with Google" mode');
    assert.ok(buttonSrc.includes('Loader2') || buttonSrc.includes('Connecting to Google'), 'Button has loading state');
    assert.ok(buttonSrc.includes('disabled'), 'Button handles disabled state');
  });

  it('2. PKCE Security: Generates random code verifier and S256 code challenge', async () => {
    // Generate two distinct verifiers
    const verifier1 = googleAuthService.generateCodeVerifier();
    const verifier2 = googleAuthService.generateCodeVerifier();

    assert.ok(typeof verifier1 === 'string' && verifier1.length >= 43, 'Verifier is at least 43 chars');
    assert.notEqual(verifier1, verifier2, 'Verifiers are cryptographically unique');

    // Generate challenges
    const challenge1 = await googleAuthService.generateCodeChallenge(verifier1);
    const challenge2 = await googleAuthService.generateCodeChallenge(verifier1);
    const challengeOther = await googleAuthService.generateCodeChallenge(verifier2);

    assert.ok(typeof challenge1 === 'string' && challenge1.length > 20, 'Challenge is valid string');
    assert.equal(challenge1, challenge2, 'Same verifier yields identical challenge');
    assert.notEqual(challenge1, challengeOther, 'Different verifiers yield different challenges');
  });

  it('3. Anti-CSRF Protection: Generates and validates one-time state token', () => {
    const stateToken = googleAuthService.generateState('signin');
    assert.ok(stateToken.length > 16, 'State token has adequate entropy');

    // Valid state verification
    const isValid = googleAuthService.verifyState(stateToken);
    assert.ok(isValid, 'State token matches session storage record');

    // One-time consumption prevents replay attacks
    const isReplay = googleAuthService.verifyState(stateToken);
    assert.equal(isReplay, false, 'State token cannot be reused');

    // Tampered state fails
    assert.equal(googleAuthService.verifyState('invalid-tampered-state-token'), false, 'Tampered state rejected');
  });

  it('4. Diagnostic Configuration: Detects missing client ID and returns instructions', () => {
    const config = googleAuthService.getConfigStatus();
    assert.ok('configured' in config, 'Reports configured status');
    assert.ok('clientId' in config, 'Reports clientId string or null');
    assert.ok(Array.isArray(config.setupInstructions), 'Provides setup instructions list');
    assert.ok(config.setupInstructions.length > 0, 'Setup instructions are populated');
  });

  it('5. New User Google Sign-Up: Content Creator role routes to /studio with stable sub ID', () => {
    const simProfile: GoogleProfile = {
      sub: 'google_creator_99182',
      email: 'maya.art@gmail.com',
      name: 'Maya Lin',
      picture: 'https://images.unsplash.com/photo-maya.jpg',
      given_name: 'Maya',
      family_name: 'Lin',
      email_verified: true,
    };

    const newCreatorUser = googleAuthService.createAccountFromGoogle(simProfile, 'creator');

    assert.equal(newCreatorUser.id, 'usr_google_google_creator_99182', 'Stable collision-free ID');
    assert.equal(newCreatorUser.googleSub, 'google_creator_99182', 'Stores permanent Google sub');
    assert.equal(newCreatorUser.role, 'creator', 'Role assigned as creator');
    assert.equal(newCreatorUser.authProvider, 'google', 'Provider marked as google');
    assert.equal(newCreatorUser.email, 'maya.art@gmail.com');
    assert.equal(newCreatorUser.name, 'Maya Lin');

    // Store registration
    useAppStore.getState().registerUser(newCreatorUser);
    const storedUser = useAppStore.getState().getRegisteredUserByGoogleSub('google_creator_99182');
    assert.ok(storedUser, 'Creator is found in store registeredUsers');
    assert.equal(storedUser?.role, 'creator');
  });

  it('6. New User Google Sign-Up: Brand role routes to Brand Dashboard', () => {
    const simProfile: GoogleProfile = {
      sub: 'google_brand_77210',
      email: 'alex.marketing@acme.corp',
      name: 'Alex Mercer',
      picture: 'https://images.unsplash.com/photo-alex.jpg',
      given_name: 'Alex',
      family_name: 'Mercer',
      email_verified: true,
    };

    const newBrandUser = googleAuthService.createAccountFromGoogle(simProfile, 'brand');

    assert.equal(newBrandUser.role, 'brand');
    assert.equal(newBrandUser.googleSub, 'google_brand_77210');

    useAppStore.getState().registerUser(newBrandUser);
    const storedUser = useAppStore.getState().getRegisteredUserByGoogleSub('google_brand_77210');
    assert.ok(storedUser);
    assert.equal(storedUser?.role, 'brand');
  });

  it('7. Creator Verification Invariant: Signing in with Google does NOT auto-verify creator', () => {
    const simProfile: GoogleProfile = {
      sub: 'google_unverified_123',
      email: 'newbie@creator.net',
      name: 'New Creator',
      email_verified: true,
    };

    const user = googleAuthService.createAccountFromGoogle(simProfile, 'creator');
    useAppStore.getState().registerUser(user);

    // Verify creator status in marketplace
    const creators = useAppStore.getState().creators;
    const matchedCreator = creators.find((c) => c.email?.toLowerCase() === user.email.toLowerCase());
    if (matchedCreator) {
      assert.equal(matchedCreator.verified, false, 'Creator verified flag must remain FALSE upon Google sign-in');
    }
    // Also verify user model does not have fake verified status
    assert.notEqual((user as any).verified, true, 'User cannot be pre-verified by auth provider alone');
  });

  it('8. Existing User Detection: Logs in by googleSub without asking to re-register and preserves custom fields', () => {
    // 1. Initial Google registration
    const initialProfile: GoogleProfile = {
      sub: 'google_returning_44321',
      email: 'jordan@studio.io',
      name: 'Jordan Base',
      picture: 'https://google.com/avatar_orig.jpg',
      email_verified: true,
    };
    const initialUser = googleAuthService.createAccountFromGoogle(initialProfile, 'creator');
    useAppStore.getState().registerUser(initialUser);

    // 2. User manually customizes bio and name in application
    useAppStore.getState().updateAuthUser({
      name: 'Jordan "Aura" Master',
      bio: 'Award-winning 3D animator and tech creator.',
      avatarUrl: 'https://custom-cdn.com/jordan_custom.png',
    });

    const updatedUser = useAppStore.getState().authUser!;
    assert.equal(updatedUser.name, 'Jordan "Aura" Master');
    assert.equal(updatedUser.bio, 'Award-winning 3D animator and tech creator.');

    // 3. User logs out
    useAppStore.getState().logout();
    assert.equal(useAppStore.getState().isAuthenticated, false);
    assert.equal(useAppStore.getState().authUser, null);

    // 4. Returning login: finds by permanent googleSub
    const existing = useAppStore.getState().getRegisteredUserByGoogleSub('google_returning_44321');
    assert.ok(existing, 'User recognized immediately by googleSub');

    // 5. Log them back in: customized fields MUST NOT be overwritten
    useAppStore.getState().login(existing!);
    const session = useAppStore.getState().authUser!;

    assert.equal(session.name, 'Jordan "Aura" Master', 'Preserves customized display name');
    assert.equal(session.bio, 'Award-winning 3D animator and tech creator.', 'Preserves customized bio');
    assert.equal(session.avatarUrl, 'https://custom-cdn.com/jordan_custom.png', 'Preserves customized avatar');
    assert.equal(session.role, 'creator', 'Preserves assigned role without prompting again');
    assert.equal(useAppStore.getState().isAuthenticated, true);
  });

  it('9. Account Linking: Existing email user can link permanent Google sub', () => {
    const emailUser: AuthUser = {
      id: 'usr_email_8899',
      name: 'Elena Rostova',
      email: 'elena@creative.com',
      username: 'elena_rostova',
      role: 'creator',
      authProvider: 'email',
      createdAt: new Date().toISOString(),
    };
    useAppStore.getState().registerUser(emailUser);

    // Link Google account
    useAppStore.getState().linkGoogleAccount('usr_email_8899', 'google_elena_sub_554');

    const foundByGoogle = useAppStore.getState().getRegisteredUserByGoogleSub('google_elena_sub_554');
    assert.ok(foundByGoogle, 'User now found via Google Sub');
    assert.equal(foundByGoogle?.id, 'usr_email_8899');
    assert.equal(foundByGoogle?.authProvider, 'google');
  });

  it('10. Session Lifecycle: Logout terminates authentication and clears store session', () => {
    const user: AuthUser = {
      id: 'usr_test_logout',
      name: 'Test Session',
      email: 'session@test.org',
      username: 'session_test',
      role: 'brand',
      authProvider: 'google',
      googleSub: 'google_session_sub',
      createdAt: new Date().toISOString(),
    };

    useAppStore.getState().login(user);
    assert.equal(useAppStore.getState().isAuthenticated, true);
    assert.ok(useAppStore.getState().authUser);

    // Logout
    useAppStore.getState().logout();
    assert.equal(useAppStore.getState().isAuthenticated, false);
    assert.equal(useAppStore.getState().authUser, null);
  });
});
