import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { ADDRESS_1 } from './test/test-data';

describe('Address routes', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
  });

  const panel = () => harness.routeNativeElement!.querySelector('aside.panel') as HTMLElement;

  it('shows the cards with the details panel closed', async () => {
    await harness.navigateByUrl('/addresses');
    http.match(() => true).forEach((req) => req.flush([]));
    harness.detectChanges();

    expect(panel().hidden).toBeTrue();
  });

  it('opens an address in the panel beside the cards', async () => {
    await harness.navigateByUrl('/addresses/1');
    // The list and the selected address load separately; answer both.
    for (let round = 0; round < 3; round++) {
      http.match(() => true).forEach((req) =>
        req.flush(req.request.url.endsWith('/1')
          ? { ...ADDRESS_1, street1: '12 Elm Street', lastSent: '2025' }
          : [ADDRESS_1]));
      await harness.fixture.whenStable();
      harness.detectChanges();
    }

    expect(panel().hidden).toBeFalse();
    expect(panel().textContent).toContain('12 Elm Street');
    expect(panel().textContent).toContain('Last sent');
    expect(harness.routeNativeElement!.querySelector('a.card.selected')).not.toBeNull();
  });
});
