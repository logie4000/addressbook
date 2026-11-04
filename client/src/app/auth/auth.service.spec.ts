import { TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthService } from './auth.service';
import { RUNTIME_CONFIG } from './runtime-config';

describe('AuthService', () => {
  it('is disabled and does nothing without auth settings', async () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(AuthService);

    expect(service.enabled).toBeFalse();
    await expectAsync(service.signIn()).toBeResolved();
    expect(service.email).toBeUndefined();
  });

  it('configures Cognito and starts sign-in when auth settings are present', async () => {
    const oauth = jasmine.createSpyObj<OAuthService>('OAuthService',
      ['configure', 'setupAutomaticSilentRefresh', 'loadDiscoveryDocumentAndLogin', 'getIdentityClaims', 'logOut']);
    oauth.loadDiscoveryDocumentAndLogin.and.resolveTo(true);
    oauth.getIdentityClaims.and.returnValue({ email: 'ann@example.com' });

    TestBed.configureTestingModule({
      providers: [
        { provide: OAuthService, useValue: oauth },
        { provide: RUNTIME_CONFIG, useValue: { auth: {
          region: 'us-east-1', userPoolId: 'us-east-1_ABC', clientId: 'client123',
          domain: 'addressbook-production-1.auth.us-east-1.amazoncognito.com',
        } } },
      ],
    });
    const service = TestBed.inject(AuthService);

    await service.signIn('');

    const settings = oauth.configure.calls.mostRecent().args[0];
    expect(settings.issuer).toBe('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ABC');
    expect(settings.clientId).toBe('client123');
    expect(settings.responseType).toBe('code');
    expect(settings.logoutUrl).toContain('https://addressbook-production-1.auth.us-east-1.amazoncognito.com/logout?client_id=client123');
    expect(oauth.loadDiscoveryDocumentAndLogin).toHaveBeenCalled();
    expect(service.email).toBe('ann@example.com');

    service.signOut();
    expect(oauth.logOut).toHaveBeenCalled();
  });

  describe('when Cognito returns an error', () => {
    let oauth: jasmine.SpyObj<OAuthService>;
    let service: AuthService;

    beforeEach(() => {
      oauth = jasmine.createSpyObj<OAuthService>('OAuthService',
        ['configure', 'setupAutomaticSilentRefresh', 'loadDiscoveryDocumentAndLogin',
         'loadDiscoveryDocument', 'initCodeFlow']);
      oauth.loadDiscoveryDocument.and.resolveTo({} as never);
      TestBed.configureTestingModule({
        providers: [
          { provide: OAuthService, useValue: oauth },
          { provide: RUNTIME_CONFIG, useValue: { auth: {
            region: 'us-east-1', userPoolId: 'us-east-1_ABC', clientId: 'client123', domain: 'example.com',
          } } },
        ],
      });
      service = TestBed.inject(AuthService);
      spyOn<any>(service, 'clearAddressBar');
      sessionStorage.removeItem('auth.linkRetried');
    });

    afterEach(() => sessionStorage.removeItem('auth.linkRetried'));

    it('shows why sign-in was refused instead of looping back to sign in', async () => {
      await service.signIn('?error_description=PreSignUp+failed+with+error+' +
        'This+Google+account+has+not+been+invited+to+the+address+book.+&error=invalid_request');

      expect(service.error).toBe('This Google account has not been invited to the address book.');
      expect(oauth.loadDiscoveryDocumentAndLogin).not.toHaveBeenCalled();
      expect(oauth.initCodeFlow).not.toHaveBeenCalled();
    });

    it('signs in again once after a Google account is first linked', async () => {
      const linked = '?error_description=Already+found+an+entry+for+username+google_123+&error=invalid_request';

      await service.signIn(linked);
      expect(oauth.initCodeFlow).toHaveBeenCalledTimes(1);
      expect(service.error).toBeUndefined();

      await service.signIn(linked);
      expect(oauth.initCodeFlow).toHaveBeenCalledTimes(1);
      expect(service.error).toContain('Already found an entry');
    });
  });
});
