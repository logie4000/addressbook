import { InjectionToken } from '@angular/core';

/** Cognito settings for signing in, written by scripts/deploy-site.sh. */
export interface AuthSettings {
  region: string;
  userPoolId: string;
  clientId: string;
  /** Host of Cognito's hosted sign-in page, e.g. addressbook-production-123.auth.us-east-1.amazoncognito.com */
  domain: string;
}

/**
 * Settings that differ between deployments. They come from config.json next
 * to index.html, so the same build works for any stack and nothing
 * account-specific is compiled into the app. Without a config.json (e.g.
 * under `ng serve`), sign-in is turned off.
 */
export interface RuntimeConfig {
  auth?: AuthSettings;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch(new URL('config.json', document.baseURI), { cache: 'no-store' });
    if (!response.ok) {
      return {};
    }
    return (await response.json()) as RuntimeConfig;
  } catch {
    // Missing, or the dev server answered with index.html instead.
    return {};
  }
}
