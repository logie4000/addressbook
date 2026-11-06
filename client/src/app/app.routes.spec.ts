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
          ? { ...ADDRESS_1, street1: '12 Elm Street', lastSent: '2025-12-21' }
          : [ADDRESS_1]));
      await harness.fixture.whenStable();
      harness.detectChanges();
    }

    expect(panel().hidden).toBeFalse();
    expect(panel().textContent).toContain('12 Elm Street');
    expect(panel().textContent).toContain('Last sent');
    expect(panel().textContent).toContain('December 21, 2025');
    expect(harness.routeNativeElement!.querySelector('a.card.selected')).not.toBeNull();
  });

  it('opens a person in the panel beside the People list', async () => {
    await harness.navigateByUrl('/people/p1');
    for (let round = 0; round < 3; round++) {
      http.match(() => true).forEach((req) =>
        req.flush(req.request.url.endsWith('/p1')
          ? { ...ADDRESS_1.addressee!, id: 'p1', firstName: 'Alice', lastName: 'Martin',
              address: { ...ADDRESS_1, id: 'a1', street1: '12 Elm Street' },
              children: [{ ...ADDRESS_1.addressee!, id: 'k1', firstName: 'Chloe', lastName: 'Martin' }] }
          : [{ ...ADDRESS_1.addressee!, id: 'p1', firstName: 'Alice', lastName: 'Martin' }]));
      await harness.fixture.whenStable();
      harness.detectChanges();
    }

    expect(panel().hidden).toBeFalse();
    expect(panel().querySelector('h2')!.textContent).toContain('Alice Martin');
    expect(panel().textContent).toContain('12 Elm Street');
    expect(panel().querySelector('a.link')!.getAttribute('href')).toBe('/addresses/a1');
    expect(panel().textContent).toContain('Chloe Martin');
    expect(harness.routeNativeElement!.querySelector('a.row.selected')).not.toBeNull();
  });
});
