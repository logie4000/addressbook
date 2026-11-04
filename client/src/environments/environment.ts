export const environment = {
  baseHref: 'http://127.0.0.1:3000',
  appTitle: 'APP TITLE',
  // Production is served by CloudFront, which sends /api/* to the Lambda API
  // on the same domain, so a relative path is all the client needs.
  apiBaseUrl: '/api/v1',
};
