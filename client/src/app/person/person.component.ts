import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModelComponent } from '../shared/model.component';
import { Person } from '../models/person';
import { fullCityStateZip, fullStreetAddress } from '../models/address';
import { PersonService } from '../models/person.service';

@Component({
  selector: 'app-person',
  imports: [RouterLink],
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

  streetAddress = computed(() => {
    const address = this.model()?.address;
    return address ? fullStreetAddress(address) : '';
  });

  cityStateZip = computed(() => {
    const address = this.model()?.address;
    return address ? fullCityStateZip(address) : '';
  });
}
