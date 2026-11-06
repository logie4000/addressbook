import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr,
} from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { AuthService } from './auth/auth.service';

export function getBaseHref(platformLocation: PlatformLocation) {
  return platformLocation.getBaseHrefFromDOM();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    // Send the Cognito access token with API requests (same-origin /api paths).
    provideOAuthClient({
      resourceServer: {
        allowedUrls: ['/api'],
        sendAccessToken: true,
      },
    }),
    // Make sure the user is signed in before the app starts.
    provideAppInitializer(() => inject(AuthService).signIn()),
    {
      provide: APP_BASE_HREF,
      useFactory: getBaseHref,
      deps: [PlatformLocation],
    },
  ],
};
