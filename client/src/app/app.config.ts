import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { APP_BASE_HREF, PlatformLocation } from '@angular/common';
import { environment } from '../environments/environment';

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
    provideHttpClient(),
    {
      provide: APP_BASE_HREF,
      useFactory: getBaseHref,
      deps: [PlatformLocation],
    }
  ]
};
