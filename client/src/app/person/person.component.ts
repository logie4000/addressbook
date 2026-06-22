import { Component, computed } from '@angular/core';
import { ModelComponent } from '../shared/model.component';
import { Person } from '../models/person';
import { fullCityStateZip } from '../models/address';

@Component({
  selector: 'app-person',
  imports: [],
  templateUrl: './person.component.html',
  styleUrl: './person.component.css'
})
export class PersonComponent extends ModelComponent<Person> {

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
      return "NO ADDRESS"
    }
  });
}
