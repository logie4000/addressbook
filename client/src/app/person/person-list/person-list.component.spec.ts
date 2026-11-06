import { provideRouter } from '@angular/router';
import { Person } from '../../models/person';
import { ADDRESS_1 } from '../../test/test-data';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonListComponent } from './person-list.component';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PersonListComponent', () => {
  let component: PersonListComponent;
  let fixture: ComponentFixture<PersonListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting(), provideRouter([])],
      imports: [PersonListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows one row per person, ordered by last name, linking to their details', () => {
    const base = ADDRESS_1.addressee!;
    const address = { ...ADDRESS_1, id: 'a1', street1: '12 Elm Street', city: 'Springfield', state: 'IL', zip: '62701' };
    const people: Person[] = [
      { ...base, id: 'c', firstName: 'Carlos', lastName: 'Rivera', spouse: { ...base, firstName: 'Dana', lastName: 'Smith' } },
      { ...base, id: 'a', firstName: 'Alice', lastName: 'Martin', address, spouse: { ...base, firstName: 'Ben', lastName: 'Martin' } },
      { ...base, id: 'b', firstName: 'Ben', lastName: 'martin', address },
    ];
    fixture.componentRef.setInput('itemList', people);
    fixture.detectChanges();

    const rows = Array.from(fixture.nativeElement.querySelectorAll('a.row') as NodeListOf<HTMLElement>);
    expect(rows.map((row) => Array.from(row.querySelectorAll('span')).map((cell) => cell.textContent!.trim()))).toEqual([
      ['Martin, Alice (Ben)', '12 Elm Street', 'Springfield, IL 62701'],
      ['martin, Ben', '12 Elm Street', 'Springfield, IL 62701'],
      ['Rivera, Carlos (Dana Smith)', '', ''],
    ]);
    expect(rows[0].getAttribute('href')).toBe('/people/a');
  });
});
