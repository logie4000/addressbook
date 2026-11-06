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
});
