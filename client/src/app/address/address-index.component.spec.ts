import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressIndexComponent } from './address-index.component';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AddressService } from '../models/address.service';

describe('AddressIndexComponent', () => {
  let component: AddressIndexComponent;
  let fixture: ComponentFixture<AddressIndexComponent>;

  beforeEach(async () => {
    localStorage.removeItem('addressbook.addressView');
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
      imports: [AddressIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => localStorage.removeItem('addressbook.addressView'));

  it('switches between cards and list, and remembers the choice', () => {
    const page: HTMLElement = fixture.nativeElement;
    const button = (label: string) =>
      Array.from(page.querySelectorAll('.view-switch button')).find((b) => b.getAttribute('aria-label') === label) as HTMLButtonElement;

    expect(component.view()).toBe('cards');
    expect(page.querySelector('ul.cards')).not.toBeNull();

    button('List').click();
    fixture.detectChanges();
    expect(page.querySelector('.row-list')).not.toBeNull();
    expect(page.querySelector('ul.cards')).toBeNull();
    expect(button('List').getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('addressbook.addressView')).toBe('list');

    const again = TestBed.createComponent(AddressIndexComponent);
    expect(again.componentInstance.view()).toBe('list');
  });
});
