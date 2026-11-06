import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { ADDRESS_1 } from './test/test-data';
import { Person } from './models/person';

describe('Editing records in the details panel', () => {
  let harness: RouterTestingHarness;
  let http: HttpTestingController;
  let seen: TestRequest[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(withXhr()), provideHttpClientTesting()],
    });
    harness = await RouterTestingHarness.create();
    http = TestBed.inject(HttpTestingController);
    seen = [];
  });

  /** Answers every request (a few rounds deep) and records what was asked. */
  async function settle(respond: (req: TestRequest) => unknown): Promise<void> {
    for (let round = 0; round < 3; round++) {
      http.match(() => true).forEach((req) => {
        seen.push(req);
        req.flush(respond(req) as never);
      });
      await harness.fixture.whenStable();
      harness.detectChanges();
    }
  }

  const panel = () => harness.routeNativeElement!.querySelector('aside.panel') as HTMLElement;
  const button = (label: string) =>
    panel().querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const input = (index: number) => panel().querySelectorAll('input')[index] as HTMLInputElement;
  const type = (el: HTMLInputElement, value: string) => {
    el.value = value;
    el.dispatchEvent(new Event('input'));
  };

  const address = { ...ADDRESS_1, street1: '12 Elm Street', city: 'Springfield', lastSent: '2024' };

  it('edits an address and refreshes the list', async () => {
    await harness.navigateByUrl('/addresses/1');
    await settle((req) => (req.request.url.endsWith('/1') ? address : [address]));

    button('Edit address').click();
    harness.detectChanges();
    expect(panel().querySelector('h2')!.textContent).toContain('Edit address');
    expect(input(0).value).toBe('12 Elm Street');

    type(input(2), 'Shelbyville ');
    type(input(5), '2025');
    button('Save').click();
    seen = [];
    await settle((req) => (req.request.method === 'PATCH' || req.request.url.endsWith('/1') ? address : [address]));

    const patch = seen.find((req) => req.request.method === 'PATCH')!;
    expect(patch.request.url).toMatch(/addresses\/1$/);
    expect(patch.request.body.address).toEqual(jasmine.objectContaining({ city: 'Shelbyville', lastSent: '2025' }));
    // The panel and the list both fetch again.
    expect(seen.filter((req) => req.request.method === 'GET').length).toBe(2);
    expect(panel().querySelector('form')).toBeNull();
  });

  it('asks before deleting an address, then closes the panel', async () => {
    await harness.navigateByUrl('/addresses/1');
    await settle((req) => (req.request.url.endsWith('/1') ? address : [address]));

    const confirm = spyOn(window, 'confirm').and.returnValue(false);
    button('Delete address').click();
    expect(confirm).toHaveBeenCalled();
    expect(http.match(() => true).length).toBe(0);

    confirm.and.returnValue(true);
    button('Delete address').click();
    seen = [];
    await settle((req) => (req.request.method === 'DELETE' ? null : []));

    expect(seen.some((req) => req.request.method === 'DELETE' && req.request.url.endsWith('/1'))).toBeTrue();
    expect(TestBed.inject(Router).url).toBe('/addresses');
  });

  it('edits a household: renames, removes a child and adds one', async () => {
    const alice: Person = {
      ...ADDRESS_1.addressee!,
      id: 'p1',
      firstName: 'Alice',
      lastName: 'Martin',
      suffix: '',
      spouse: { ...ADDRESS_1.addressee!, id: 's1', firstName: 'Ben', lastName: 'Martin' },
      children: [
        { ...ADDRESS_1.addressee!, id: 'k1', firstName: 'Chloe', lastName: 'Martin' },
        { ...ADDRESS_1.addressee!, id: 'k2', firstName: 'Danny', lastName: 'Martin' },
      ],
    };
    await harness.navigateByUrl('/people/p1');
    await settle((req) => (req.request.url.endsWith('/p1') ? alice : [alice]));

    button('Edit household').click();
    harness.detectChanges();
    type(input(0), 'Alicia');
    button('Remove Danny').click();
    button('Add child').click();
    harness.detectChanges();
    // Inputs: head (3), spouse (2), Chloe (2), new child (2).
    const newChildFirst = input(7);
    expect(input(8).value).toBe('Martin');
    type(newChildFirst, 'Eve');

    button('Save').click();
    seen = [];
    await settle((req) => (req.request.method === 'PATCH' || req.request.url.endsWith('/p1') ? alice : [alice]));

    const body = seen.find((req) => req.request.method === 'PATCH')!.request.body.person;
    expect(body.firstName).toBe('Alicia');
    expect(body.spouse_attributes).toEqual({ id: 's1', firstName: 'Ben', lastName: 'Martin' });
    expect(body.children_attributes).toEqual([
      { id: 'k1', firstName: 'Chloe', lastName: 'Martin' },
      { firstName: 'Eve', lastName: 'Martin' },
      { id: 'k2', _destroy: '1' },
    ]);
  });

  it('does not save a household member without a first name', async () => {
    const alice = { ...ADDRESS_1.addressee!, id: 'p1', firstName: 'Alice', lastName: 'Martin', children: [] };
    await harness.navigateByUrl('/people/p1');
    await settle((req) => (req.request.url.endsWith('/p1') ? alice : [alice]));

    button('Edit household').click();
    harness.detectChanges();
    button('Add child').click();
    harness.detectChanges();
    button('Save').click();
    harness.detectChanges();

    expect(http.match((req) => req.method === 'PATCH').length).toBe(0);
    expect(panel().textContent).toContain('Every person needs a first name.');
  });
});
