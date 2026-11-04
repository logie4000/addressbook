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

  get enabled(): boolean {
    return !!this.config.auth;
  }

  // Only looked up when sign-in is configured, so the rest of the app (and
  // its tests) don't need the OAuth providers.
  private get oauth(): OAuthService {
    return this.injector.get(OAuthService);
  }

  /** Completes a sign-in redirect, or sends the user to sign in. */
  async signIn(): Promise<void> {
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

    await this.oauth.loadDiscoveryDocumentAndLogin();
  }

  get email(): string | undefined {
    return this.enabled ? this.oauth.getIdentityClaims()?.['email'] : undefined;
  }

  signOut(): void {
    this.oauth.logOut();
  }
}
