import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressListComponent } from './address-list.component';
import { AddressService } from '../../models/address.service';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DataChangesService } from '../../shared/service/data-changes.service';
import { provideRouter, Router } from '@angular/router';
import { ADDRESS_1 } from '../../test/test-data';
import { todayIso } from '../../models/address';

describe('AddressListComponent', () => {
  let component: AddressListComponent;
  let fixture: ComponentFixture<AddressListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
      imports: [AddressListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows one card per address, linking to its page', () => {
    const address = {
      ...ADDRESS_1,
      street1: '12 Elm Street',
      city: 'Springfield',
      state: 'IL',
      lastSent: '2025-12-21',
      addressee: { ...ADDRESS_1.addressee!, firstName: 'Alice', lastName: 'Martin' },
    };
    fixture.componentRef.setInput('itemList', [address]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('a.card');
    expect(cards.length).toBe(1);
    expect(cards[0].getAttribute('href')).toBe('/addresses/1');
    const text = cards[0].textContent.replace(/\s+/g, ' ');
    expect(text).toContain('Martin');
    expect(text).toContain('12 Elm Street');
    expect(text).toContain('Springfield, IL');
    expect(text).toContain('Last sent Dec 2025');
  });

  it('says so when there are no addresses', () => {
    fixture.componentRef.setInput('itemList', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No addresses yet.');
  });

  describe('list view', () => {
    const person = (firstName: string, lastName: string, spouse?: { firstName: string; lastName: string }) => ({
      ...ADDRESS_1.addressee!,
      firstName,
      lastName,
      spouse: spouse && { ...ADDRESS_1.addressee!, ...spouse },
    });

    beforeEach(() => {
      fixture.componentRef.setInput('view', 'list');
      fixture.componentRef.setInput('itemList', [
        { ...ADDRESS_1, id: 'r', street1: '400 Lakeview Drive', city: 'Madison', state: 'WI', zip: '53703',
          lastSent: '2024-12-21', addressee: { ...person('Carlos', 'Rivera', { firstName: 'Dana', lastName: 'Smith' }),
            children: [person('Elena', 'Rivera'), person('Sam', 'Smith')] } },
        { ...ADDRESS_1, id: 'm', street1: '12 Elm Street', city: 'Springfield', state: 'IL', zip: '62701',
          lastSent: '', addressee: person('Alice', 'martin', { firstName: 'Ben', lastName: 'martin' }) },
        { ...ADDRESS_1, id: 'o', street1: '7 Harbor Road', city: 'Portland', state: 'ME', zip: '04101',
          lastSent: '2025-12-21', addressee: person('Grace', 'Okafor') },
      ]);
      fixture.detectChanges();
    });

    const rows = () => Array.from(fixture.nativeElement.querySelectorAll('.row-list .row') as NodeListOf<HTMLElement>)
      .map((row) => Array.from(row.querySelectorAll(':scope > .name, :scope > .street, :scope > .city, :scope > .sent')).map((cell) => (cell.querySelector('.year') ?? cell.firstChild)!.textContent!.trim()));

    it('shows one row per address, ordered by last name', () => {
      expect(rows()).toEqual([
        ['martin, Alice (Ben)', '12 Elm Street', 'Springfield, IL 62701', '—'],
        ['Okafor, Grace', '7 Harbor Road', 'Portland, ME 04101', 'Dec 2025'],
        ['Rivera, Carlos (Dana Smith)', '400 Lakeview Drive', 'Madison, WI 53703', 'Dec 2024'],
      ]);
    });

    it('lists the children under the names, with differing last names only', () => {
      const children = Array.from(fixture.nativeElement.querySelectorAll('.row-list .row') as NodeListOf<HTMLElement>)
        .map((row) => row.querySelector('.name .children')?.textContent?.trim() ?? null);
      expect(children).toEqual([null, null, 'Elena, Sam Smith']);
    });

    it('marks an address as sent this year from its row', () => {
      const year = String(new Date().getFullYear());
      const http = TestBed.inject(HttpTestingController);
      const changes = TestBed.inject(DataChangesService);
      const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('.row button.mark') as NodeListOf<HTMLButtonElement>);

      expect(buttons().length).toBe(3);
      expect(buttons()[1].getAttribute('aria-label')).toBe(`Mark sent in ${year}`);
      buttons()[1].click();
      fixture.detectChanges();
      expect(buttons()[1].disabled).withContext('busy while saving').toBeTrue();

      const req = http.expectOne((r) => r.method === 'PATCH');
      expect(req.request.url).toMatch(/addresses\/o$/);
      expect(req.request.body).toEqual({ address: { lastSent: todayIso() } });
      req.flush({});
      expect(changes.version()).toBe(1);
    });

    it('opens the edit form from a row', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      (fixture.nativeElement.querySelector('.row button[aria-label="Edit Okafor, Grace"]') as HTMLButtonElement).click();
      expect(navigate).toHaveBeenCalledWith(['/addresses', 'o'], { queryParams: { edit: 1 } });
    });

    it('deletes from a row after confirming', () => {
      const http = TestBed.inject(HttpTestingController);
      const confirm = spyOn(window, 'confirm').and.returnValue(false);
      const del = () => (fixture.nativeElement.querySelector('.row button[aria-label="Delete Okafor, Grace"]') as HTMLButtonElement).click();

      del();
      expect(confirm.calls.mostRecent().args[0]).toContain('Okafor, Grace at 7 Harbor Road');
      http.expectNone((r) => r.method === 'DELETE');

      confirm.and.returnValue(true);
      del();
      const req = http.expectOne((r) => r.method === 'DELETE');
      expect(req.request.url).toMatch(/addresses\/o$/);
      req.flush(null);
      expect(TestBed.inject(DataChangesService).version()).toBe(1);
    });

    it('shows when an address was already sent this year', () => {
      const year = String(new Date().getFullYear());
      fixture.componentRef.setInput('itemList', [{ ...ADDRESS_1, id: 'x', lastSent: `${year}-12-21` }]);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.row button.mark') as HTMLButtonElement;
      expect(button.disabled).toBeTrue();
      expect(button.getAttribute('aria-label')).toBe(`Sent in ${year}`);
    });

    it('links each row to its address', () => {
      const first = fixture.nativeElement.querySelector('.row a.row-link') as HTMLElement;
      expect(first.getAttribute('href')).toBe('/addresses/m');
    });
  });
});
