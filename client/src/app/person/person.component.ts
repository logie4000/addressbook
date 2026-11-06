import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModelComponent } from '../shared/model.component';
import { Person } from '../models/person';
import { fullCityStateZip, fullStreetAddress } from '../models/address';
import { PersonService } from '../models/person.service';
import { IconComponent } from '../shared/icon/icon.component';
import { HouseholdForm, sortChildren } from '../shared/household/household-form';
import { HouseholdFieldsComponent } from '../shared/household/household-fields.component';

@Component({
  selector: 'app-person',
  imports: [RouterLink, IconComponent, HouseholdFieldsComponent],
  templateUrl: './person.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './person.component.css',
})
export class PersonComponent extends ModelComponent<Person> {
  constructor(activatedRoute: ActivatedRoute, modelService: PersonService) {
    super(activatedRoute, modelService);
  }

  fullName = computed(() => {
    const person = this.model();
    if (!person) {
      return '';
    }
    return [person.firstName, person.lastName, person.suffix].filter((part) => !!part).join(' ');
  });

  children = computed(() => sortChildren(this.model()?.children));

  streetAddress = computed(() => {
    const address = this.model()?.address;
    return address ? fullStreetAddress(address) : '';
  });

  cityStateZip = computed(() => {
    const address = this.model()?.address;
    return address ? fullCityStateZip(address) : '';
  });

  // --- Editing the household ------------------------------------------------

  household = new HouseholdForm();

  override startEdit(): void {
    const person = this.model();
    if (!person) {
      return;
    }
    this.household.load(person);
    super.startEdit();
  }

  saveHousehold(): void {
    if (this.household.invalid) {
      this.household.markAllAsTouched();
      return;
    }
    this.save({ person: this.household.toPersonParams() });
  }

  deletePerson(): void {
    this.remove(
      `Delete ${this.fullName()}? Their spouse, children and address stay in the address book.`,
      '/people',
    );
  }
}
