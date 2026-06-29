import { Component } from '@angular/core';
import { ModelIndexComponent } from '../shared/model-index.component';
import { PersonService } from '../models/person.service';
import { Person } from '../models/person';
import { PersonListComponent } from "./person-list/person-list.component";

@Component({
  selector: 'app-person-index',
  imports: [PersonListComponent],
  templateUrl: './person-index.component.html',
  styleUrl: './person-index.component.css'
})
export class PersonIndexComponent extends ModelIndexComponent<Person> {
  constructor(protected override modelService: PersonService) {
    super(modelService);
  }

  getValues(): Person[] {
    var items = this.values();

    if (items) {
      return items;
    } else {
      return [];
    }
  }
}
