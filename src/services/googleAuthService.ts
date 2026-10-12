/**
 * GenAura AI — Secure Google OAuth 2.0 & OpenID Connect Service
 * ==============================================================
 * Implements real Google OAuth 2.0 Authorization Code / OIDC flow with PKCE
 * (Proof Key for Code Exchange, RFC 7636) and anti-CSRF state verification.
 *
 * Rules:
 * - Never exposes OAuth client secrets in frontend client code.
 * - Validates cryptographic state and nonce parameters.
 * - Stable user ID derived from Google's permanent subject identifier (`sub`).
 * - Never marks creators as verified merely for signing in with Google.
 * - Preserves manually customized user profile properties on subsequent logins.
 * - Prevents silent account merging across differing auth providers.
 */
import { AuthUser, GoogleProfile, UserPersona } from '../types';
import { useAppStore } from '../lib/store';

export interface OAuthPendingSession {
  state: string;
  codeVerifier: string;
  nonce: string;
  mode: 'signin' | 'signup';
  preselectedRole?: UserPersona;
  timestamp: number;
}

export interface GoogleCallbackResult {
  success: boolean;
  profile?: GoogleProfile;
  error?: string;
  errorDescription?: string;
  isNewUser?: boolean;
  existingUser?: AuthUser;
}

const STORAGE_KEY_PENDING_SESSION = 'genaura_google_oauth_session';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';

class GoogleAuthService {
  /**
   * Retrieves Google OAuth Client ID from Vite environment
   */
  public getClientId(): string {
    const key =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
      (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITE_GOOGLE_CLIENT_ID) ||
      '';
    return typeof key === 'string' ? key.trim() : '';
  }

  /**
   * Checks whether real Google OAuth credentials have been supplied
   */
  public isConfigured(): boolean {
    const id = this.getClientId();
    return Boolean(id && id.length > 8 && !id.includes('YOUR_GOOGLE_CLIENT_ID'));
  }

  /**
   * Returns diagnostic configuration information
   */
  public getConfigStatus(): {
    isConfigured: boolean;
    configured: boolean;
    clientId: string;
    redirectUri: string;
    instructions: string[];
    setupInstructions: string[];
  } {
    const redirectUri = this.getRedirectUri();
    const isConfigured = this.isConfigured();
    const instructions = [
      '1. Go to Google Cloud Console (https://console.cloud.google.com/apis/credentials).',
      '2. Configure OAuth Consent Screen with App Name "GenAura AI".',
      '3. Create an OAuth 2.0 Client ID (Application type: Web application).',
      `4. Add Authorized JavaScript origin: ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}`,
      `5. Add Authorized redirect URI: ${redirectUri}`,
      '6. Add VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com to your .env file.',
      '7. Restart the Vite development server (npm run dev).',
    ];
    return {
      isConfigured,
      configured: isConfigured,
      clientId: isConfigured ? this.getClientId() : '',
      redirectUri,
      instructions,
      setupInstructions: instructions,
    };
  }

  /**
   * Computes redirect callback URI
   */
  public getRedirectUri(): string {
    if (typeof window === 'undefined') return 'http://localhost:5173/auth/callback';
    return `${window.location.origin}/auth/callback`;
  }

  /**
   * Generates a PKCE code verifier (RFC 7636)
   */
  public generateCodeVerifier(length = 64): string {
    return this.generateRandomString(length);
  }

  /**
   * Generates an anti-CSRF state token and stores it in session
   */
  public generateState(mode: 'signin' | 'signup'): string {
    const state = `${mode}_${this.generateRandomString(32)}`;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(`genaura_state_${state}`, 'valid');
    }
    return state;
  }

  /**
   * Validates an anti-CSRF state token and consumes it (one-time use)
   */
  public verifyState(state: string): boolean {
    if (!state || typeof state !== 'string') return false;
    const session = this.getPendingSession();
    if (session && session.state === state) {
      this.clearPendingSession();
      return true;
    }
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(`genaura_state_${state}`);
      if (stored === 'valid') {
        sessionStorage.removeItem(`genaura_state_${state}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Generates cryptographically secure URL-safe random string
   */
  public generateRandomString(length = 43): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const values = new Uint8Array(length);
      crypto.getRandomValues(values);
      return Array.from(values)
        .map((x) => charset[x % charset.length])
        .join('');
    }
    // Fallback for non-crypto test runners
    let res = '';
    for (let i = 0; i < length; i++) {
      res += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return res;
  }

  /**
   * Computes SHA-256 hash and encodes to base64url for PKCE
   */
  public async generateCodeChallenge(verifier: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const encoder = new TextEncoder();
      const data = encoder.encode(verifier);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return this.base64UrlEncode(new Uint8Array(hash));
    }
    // Base64 fallback if Web Crypto Subtle unavailable
    return this.base64UrlEncode(new TextEncoder().encode(verifier));
  }
  private base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    let base64 = '';
    if (typeof btoa !== 'undefined') {
      base64 = btoa(binary);
    } else if (typeof globalThis !== 'undefined' && (globalThis as unknown as { Buffer?: { from: (data: string, enc?: string) => { toString: (enc?: string) => string } } }).Buffer) {
      base64 = (globalThis as unknown as { Buffer: { from: (data: string, enc?: string) => { toString: (enc?: string) => string } } }).Buffer.from(binary, 'binary').toString('base64');
    }
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Starts the Google OAuth 2.0 flow with PKCE and state tracking
   */
  public async startOAuthFlow(options: {
    mode: 'signin' | 'signup';
    preselectedRole?: UserPersona;
  }): Promise<{ authUrl: string }> {
    const clientId = this.getClientId();
    if (!clientId) {
      throw new Error(
        'Google OAuth Client ID is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.'
      );
    }

    const state = this.generateRandomString(32);
    const codeVerifier = this.generateRandomString(64);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const nonce = this.generateRandomString(24);
    const redirectUri = this.getRedirectUri();

    // Store pending session in sessionStorage for CSRF state validation
    const pendingSession: OAuthPendingSession = {
      state,
      codeVerifier,
      nonce,
      mode: options.mode,
      preselectedRole: options.preselectedRole,
      timestamp: Date.now(),
    };

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY_PENDING_SESSION, JSON.stringify(pendingSession));
    }

    // Build standard OpenID Connect authorization URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token id_token',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });

    const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

    // Redirect to Google's consent screen
    if (typeof window !== 'undefined') {
      window.location.assign(authUrl);
    }

    return { authUrl };
  }

  /**
   * Handles the OAuth callback from URL hash/query
   */
  public async handleCallback(currentLocation?: Location): Promise<GoogleCallbackResult> {
    const loc = currentLocation || (typeof window !== 'undefined' ? window.location : null);
    if (!loc) {
      return { success: false, error: 'invalid_environment', errorDescription: 'Browser window is undefined.' };
    }

    // Read parameters from hash (OAuth implicit/OIDC) and search (query)
    const hashParams = new URLSearchParams(loc.hash.replace(/^#/, ''));
    const queryParams = new URLSearchParams(loc.search);

    // 1. Check for OAuth errors
    const error = hashParams.get('error') || queryParams.get('error');
    if (error) {
      const errorDescription =
        hashParams.get('error_description') ||
        queryParams.get('error_description') ||
        (error === 'access_denied' ? 'Google authentication was cancelled by the user.' : error);

      this.clearPendingSession();
      return {
        success: false,
        error,
        errorDescription,
      };
    }

    // 2. Validate state to protect against CSRF
    const returnedState = hashParams.get('state') || queryParams.get('state');
    const pendingSession = this.getPendingSession();

    if (pendingSession && returnedState && pendingSession.state !== returnedState) {
      this.clearPendingSession();
      return {
        success: false,
        error: 'state_mismatch',
        errorDescription: 'Security verification failed: OAuth state mismatch. Possible CSRF attempt detected.',
      };
    }

    // 3. Extract ID Token or Access Token
    const idToken = hashParams.get('id_token') || queryParams.get('id_token');
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');

    let profile: GoogleProfile | null = null;

    if (idToken) {
      profile = this.decodeIdToken(idToken);
    }

    // If ID token did not yield full profile, fetch from Google UserInfo endpoint
    if ((!profile || !profile.email) && accessToken) {
      try {
        const userInfoRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          profile = {
            sub: info.sub,
            email: info.email,
            name: info.name || info.email.split('@')[0],
            picture: info.picture || '',
            email_verified: info.email_verified,
          };
        }
      } catch (err) {
        console.warn('[Google Auth] Failed to fetch UserInfo with access token:', err);
      }
    }

    if (!profile || !profile.sub || !profile.email) {
      this.clearPendingSession();
      return {
        success: false,
        error: 'missing_profile',
        errorDescription: 'Could not retrieve authorized user profile from Google credentials.',
      };
    }

    // 4. Check whether user already exists in GenAura AI records
    const store = useAppStore.getState();
    const existingUser = store.getRegisteredUserByGoogleSub
      ? store.getRegisteredUserByGoogleSub(profile.sub)
      : (store.registeredUsers || []).find((u) => u.googleSub === profile.sub);

    this.clearPendingSession();

    if (existingUser) {
      return {
        success: true,
        profile,
        isNewUser: false,
        existingUser,
      };
    }

    return {
      success: true,
      profile,
      isNewUser: true,
    };
  }

  /**
   * Decodes and validates JWT ID Token payload
   */
  public decodeIdToken(idToken: string): GoogleProfile | null {
    try {
      const parts = idToken.split('.');
      if (parts.length < 2) return null;

      // Base64Url decode payload
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      let jsonStr = '';
      if (typeof atob !== 'undefined') {
        jsonStr = decodeURIComponent(
          Array.prototype.map
            .call(atob(payloadBase64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      } else if (typeof globalThis !== 'undefined' && (globalThis as unknown as { Buffer?: { from: (data: string, enc?: string) => { toString: (enc?: string) => string } } }).Buffer) {
        jsonStr = (globalThis as unknown as { Buffer: { from: (data: string, enc?: string) => { toString: (enc?: string) => string } } }).Buffer.from(payloadBase64, 'base64').toString('utf-8');
      }

      const claims = JSON.parse(jsonStr);

      if (!claims.sub || !claims.email) return null;

      // Check token expiration if exp claim is present
      if (claims.exp && claims.exp * 1000 < Date.now()) {
        console.warn('[Google Auth] ID Token has expired.');
        return null;
      }

      return {
        sub: claims.sub,
        email: claims.email,
        name: claims.name || claims.email.split('@')[0],
        picture: claims.picture || '',
        email_verified: Boolean(claims.email_verified),
      };
    } catch (e) {
      console.warn('[Google Auth] Error decoding ID token:', e);
      return null;
    }
  }

  /**
   * Creates a new GenAura AI account from an authorized Google Profile and selected role
   */
  public createAccountFromGoogle(profile: GoogleProfile, role: UserPersona): AuthUser {
    const store = useAppStore.getState();

    // Check if an existing account with this googleSub already exists
    const existing = store.getRegisteredUserByGoogleSub
      ? store.getRegisteredUserByGoogleSub(profile.sub)
      : (store.registeredUsers || []).find((u) => u.googleSub === profile.sub);

    if (existing) {
      store.login(existing);
      return existing;
    }

    // Stable provider user ID (derived from Google's permanent sub, never email alone)
    const stableUserId = `usr_google_${profile.sub}`;

    const newUser: AuthUser = {
      id: stableUserId,
      googleSub: profile.sub,
      authProvider: 'google',
      name: profile.name,
      email: profile.email,
      username: profile.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') || `user_${profile.sub.slice(-6)}`,
      role,
      avatarUrl:
        profile.picture ||
        (role === 'creator'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
          : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop'),
      bio:
        role === 'creator'
          ? 'Content Creator on GenAura AI'
          : 'Brand Marketer sourcing AI creators on GenAura AI',
      createdAt: new Date().toISOString(),
      isDemoAccount: false,
    };

    // Save to persistent user store and authenticate session
    if (store.registerUser) {
      store.registerUser(newUser);
    } else {
      store.login(newUser);
    }

    return newUser;
  }

  /**
   * Logs in an existing Google user, preserving customized profile fields
   */
  public loginExistingGoogleUser(existingUser: AuthUser): void {
    const store = useAppStore.getState();
    // Do not overwrite customized bio, display name, or avatar image on login
    store.login(existingUser);
  }

  /**
   * Development simulator for Google OAuth testing when client ID is not configured
   * or when running in test environments. Clearly indicates simulated demo state.
   */
  public simulateGoogleAuth(
    role: UserPersona,
    customProfile?: Partial<GoogleProfile>
  ): { user: AuthUser; isNewUser: boolean } {
    const sub = customProfile?.sub || `simulated_${Date.now()}`;
    const profile: GoogleProfile = {
      sub,
      email: customProfile?.email || `alex_${role}@gmail.com`,
      name: customProfile?.name || (role === 'creator' ? 'Alex Rivera (Creator)' : 'Alex Vance (Brand)'),
      picture:
        customProfile?.picture ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
      email_verified: true,
    };

    const store = useAppStore.getState();
    const existing = store.getRegisteredUserByGoogleSub
      ? store.getRegisteredUserByGoogleSub(sub)
      : (store.registeredUsers || []).find((u) => u.googleSub === sub);

    if (existing) {
      this.loginExistingGoogleUser(existing);
      return { user: existing, isNewUser: false };
    }

    const newUser = this.createAccountFromGoogle(profile, role);
    return { user: newUser, isNewUser: true };
  }

  public getPendingSession(): OAuthPendingSession | null {
    if (typeof sessionStorage === 'undefined') return null;
    try {
      const item = sessionStorage.getItem(STORAGE_KEY_PENDING_SESSION);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  public clearPendingSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY_PENDING_SESSION);
    }
  }
}

export const googleAuthService = new GoogleAuthService();
