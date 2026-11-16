import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressIndexComponent } from './address-index.component';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
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

  it('exports the address book as JSON or vCard', async () => {
    const http = TestBed.inject(HttpTestingController);
    const blobs: Blob[] = [];
    spyOn(URL, 'createObjectURL').and.callFake((blob: Blob | MediaSource) => {
      blobs.push(blob as Blob);
      return 'blob:x';
    });
    spyOn(URL, 'revokeObjectURL');
    const clicked: string[] = [];
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      clicked.push(this.download);
    });
    const file = {
      format: 'addressbook-households', version: 1, exportedAt: '2026-11-06T00:00:00Z',
      households: [{ id: 'h1', street1: '1 Main St', street2: null, city: 'Springfield', state: 'IL', zip: '62701',
        lastSent: null, comments: null, addressee: { id: 'p1', firstName: 'Ann', lastName: 'Zeta', suffix: null },
        spouse: null, children: [] }],
    };
    const item = (text: string) =>
      Array.from(fixture.nativeElement.querySelectorAll('.menu-items button') as NodeListOf<HTMLButtonElement>).find((b) => b.textContent!.includes(text))!;

    item('JSON').click();
    http.expectOne((r) => r.url.endsWith('/households')).flush(file);
    item('vCard').click();
    http.expectOne((r) => r.url.endsWith('/households')).flush(file);
    const saved = await Promise.all(blobs.map((blob) => blob.text()));

    expect(clicked.length).toBe(2);
    expect(clicked[0]).toMatch(/^address-book-\d{4}-\d{2}-\d{2}\.json$/);
    expect(clicked[1]).toMatch(/\.vcf$/);
    expect(JSON.parse(saved[0]).format).toBe('addressbook-households');
    expect(saved[1]).toContain('FN:Ann Zeta');
  });

  it('prints from the Print button', () => {
    const print = spyOn(window, 'print');
    (fixture.nativeElement.querySelector('button[aria-label="Print"]') as HTMLButtonElement).click();
    expect(print).toHaveBeenCalled();
  });
});
