import { environment } from '../environments/environment';

// Kept apart from app.config.ts so the services can use these without
// importing the routes (and, through them, the components that use the
// services), which would be a circular import.
export const APP_TITLE = 'Address Book';
export const REST_DB_PATH = environment.apiBaseUrl;

export const HOST_ADDRESS_SERVICE = 'addresses';
export const HOST_PEOPLE_SERVICE = 'people';

export const DB_ADDRESS_SERVICE = `${REST_DB_PATH}/${HOST_ADDRESS_SERVICE}`;
export const DB_PEOPLE_SERVICE = `${REST_DB_PATH}/${HOST_PEOPLE_SERVICE}`;
