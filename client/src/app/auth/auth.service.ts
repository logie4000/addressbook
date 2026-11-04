import { Injectable, Injector, inject } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { RUNTIME_CONFIG } from './runtime-config';

/**
 * Signs the user in through Cognito's hosted sign-in page using the
 * authorization code flow with PKCE. Once signed in, the OAuth library
 * attaches the access token to every request under /api, and API Gateway
 * rejects requests without a valid one.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(RUNTIME_CONFIG);
  private readonly injector = inject(Injector);

  /** Why the last sign-in attempt was refused, shown instead of the app. */
  error?: string;

  get enabled(): boolean {
    return !!this.config.auth;
  }

  // Only looked up when sign-in is configured, so the rest of the app (and
  // its tests) don't need the OAuth providers.
  private get oauth(): OAuthService {
    return this.injector.get(OAuthService);
  }

  /**
   * Completes a sign-in redirect, or sends the user to sign in. `search` is
   * the page's query string, where Cognito puts the result of a sign-in.
   */
  async signIn(search = window.location.search): Promise<void> {
    const auth = this.config.auth;
    if (!auth) {
      return;
    }

    const appUrl = new URL('.', document.baseURI).href;

    this.oauth.configure({
      issuer: `https://cognito-idp.${auth.region}.amazonaws.com/${auth.userPoolId}`,
      clientId: auth.clientId,
      responseType: 'code',
      scope: 'openid email profile',
      redirectUri: appUrl,
      postLogoutRedirectUri: appUrl,
      // Cognito's discovery document has no end_session_endpoint.
      logoutUrl: `https://${auth.domain}/logout?client_id=${encodeURIComponent(auth.clientId)}&logout_uri=${encodeURIComponent(appUrl)}`,
      // Cognito serves its endpoints from a different host than the issuer.
      strictDiscoveryDocumentValidation: false,
      // Renew tokens with the refresh token rather than a hidden iframe.
      useSilentRefresh: false,
    });
    this.oauth.setupAutomaticSilentRefresh();

    const params = new URLSearchParams(search);
    const problem = params.get('error_description') || params.get('error');
    if (problem) {
      this.clearAddressBar(appUrl);
      // The first Google sign-in for an invited person links Google to their
      // account, and Cognito then asks for one more try. It goes straight
      // through, since they're already signed in to Google.
      if (/already found an entry for username/i.test(problem) && this.firstRetry()) {
        await this.startSignIn();
        return;
      }
      this.error = problem.replace(/^PreSignUp failed with error\s*/i, '').trim();
      return;
    }

    await this.oauth.loadDiscoveryDocumentAndLogin();
  }

  /** Sends the user to the sign-in page again, e.g. after an error. */
  async startSignIn(): Promise<void> {
    await this.oauth.loadDiscoveryDocument();
    this.oauth.initCodeFlow();
  }

  private clearAddressBar(appUrl: string): void {
    history.replaceState(null, '', appUrl);
  }

  // Retries the linking step only once per browser tab, so a persistent
  // error can't send the page round in circles.
  private firstRetry(): boolean {
    const key = 'auth.linkRetried';
    try {
      if (sessionStorage.getItem(key)) {
        return false;
      }
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage unavailable: retry anyway.
    }
    return true;
  }

  get email(): string | undefined {
    return this.enabled ? this.oauth.getIdentityClaims()?.['email'] : undefined;
  }

  signOut(): void {
    this.oauth.logOut();
  }
}
