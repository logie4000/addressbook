import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { ModelComponent } from '../shared/model.component';
import { Person } from '../models/person';
import { fullCityStateZip } from '../models/address';
import { ActivatedRoute } from '@angular/router';
import { PersonService } from '../models/person.service';

@Component({
  selector: 'app-person',
  imports: [],
  templateUrl: './person.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './person.component.css',
})
export class PersonComponent extends ModelComponent<Person> {
  constructor(activatatedRoute: ActivatedRoute, modelService: PersonService) {
    super(activatatedRoute, modelService);
  }

  title = computed(() => {
    var person = this.model();

    if (person) {
      var ret_val = person.lastName;

      if (person.spouse && person.spouse.lastName != person.lastName) {
        ret_val += `/${person.spouse.lastName}`;
      }
    }
  });

  full_address = computed(() => {
    var address = this.model()?.address;

    if (address) {
      return fullCityStateZip(address);
    } else {
      return 'NO ADDRESS';
    }
  });
}
