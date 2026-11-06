import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Person } from '../../models/person';
import { fullCityStateZip, fullStreetAddress } from '../../models/address';
import { ModelListComponent } from '../../shared/model-list.component';
import { PersonService } from '../../models/person.service';
import { compareText } from '../../shared/compare-text';

@Component({
  selector: 'app-person-list',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './person-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './person-list.component.css',
})
export class PersonListComponent extends ModelListComponent<Person> {
  constructor(
    protected override itemService: PersonService,
    protected override router: Router,
  ) {
    super(itemService, router);
  }

  /** People ordered by last name, then first name. */
  sorted = computed(() =>
    [...(this.itemList() ?? [])].sort(
      (a, b) => compareText(a.lastName, b.lastName) || compareText(a.firstName, b.firstName),
    ),
  );

  /** "Martin, Alice (Ben)", or "Rivera, Carlos (Dana Smith)" when the spouse's last name differs. */
  getListName(person: Person): string {
    let name = [person.lastName, person.firstName].filter((part) => !!part).join(', ');
    if (person.suffix) {
      name += ` ${person.suffix}`;
    }

    const spouse = person.spouse;
    if (spouse) {
      const spouseName =
        spouse.lastName && spouse.lastName !== person.lastName
          ? `${spouse.firstName} ${spouse.lastName}`
          : spouse.firstName;
      if (spouseName) {
        name += ` (${spouseName})`;
      }
    }

    return name;
  }

  getStreetAddress(person: Person): string {
    return person.address ? fullStreetAddress(person.address) : '';
  }

  getCityStateZip(person: Person): string {
    return person.address ? fullCityStateZip(person.address) : '';
  }
}
