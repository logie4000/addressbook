import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { environment } from '../environments/environment';
import { AuthService } from './auth/auth.service';

export const APP_TITLE = "Address Book";
export const REST_DB_PATH = environment.apiBaseUrl;

export const HOST_ADDRESS_SERVICE = 'addresses';
export const HOST_PEOPLE_SERVICE = 'people';

export const DB_ADDRESS_SERVICE = `${REST_DB_PATH}/${HOST_ADDRESS_SERVICE}`;
export const DB_PEOPLE_SERVICE = `${REST_DB_PATH}/${HOST_PEOPLE_SERVICE}`;

export function getBaseHref(platformLocation: PlatformLocation) {
  return platformLocation.getBaseHrefFromDOM();
}

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
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
    }
  ]
};
