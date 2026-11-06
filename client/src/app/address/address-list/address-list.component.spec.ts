import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressListComponent } from './address-list.component';
import { AddressService } from '../../models/address.service';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ADDRESS_1 } from '../../test/test-data';

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
      lastSent: '2025',
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
    expect(text).toContain('Last sent 2025');
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
          lastSent: '2024', addressee: person('Carlos', 'Rivera', { firstName: 'Dana', lastName: 'Smith' }) },
        { ...ADDRESS_1, id: 'm', street1: '12 Elm Street', city: 'Springfield', state: 'IL', zip: '62701',
          lastSent: '', addressee: person('Alice', 'martin', { firstName: 'Ben', lastName: 'martin' }) },
        { ...ADDRESS_1, id: 'o', street1: '7 Harbor Road', city: 'Portland', state: 'ME', zip: '04101',
          lastSent: '2025', addressee: person('Grace', 'Okafor') },
      ]);
      fixture.detectChanges();
    });

    const rows = () => Array.from(fixture.nativeElement.querySelectorAll('a.row') as NodeListOf<HTMLElement>)
      .map((row) => Array.from(row.querySelectorAll('span')).map((cell) => cell.textContent!.trim()));

    it('shows one row per address, ordered by last name', () => {
      expect(rows()).toEqual([
        ['martin, Alice (Ben)', '12 Elm Street', 'Springfield, IL 62701', '—'],
        ['Okafor, Grace', '7 Harbor Road', 'Portland, ME 04101', '2025'],
        ['Rivera, Carlos (Dana Smith)', '400 Lakeview Drive', 'Madison, WI 53703', '2024'],
      ]);
    });

    it('links each row to its address', () => {
      const first = fixture.nativeElement.querySelector('a.row') as HTMLElement;
      expect(first.getAttribute('href')).toBe('/addresses/m');
    });
  });
});
