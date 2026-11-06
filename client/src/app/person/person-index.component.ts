import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModelIndexComponent } from '../shared/model-index.component';
import { PersonService } from '../models/person.service';
import { Person } from '../models/person';
import { PersonListComponent } from './person-list/person-list.component';

@Component({
  selector: 'app-person-index',
  imports: [PersonListComponent, RouterOutlet, RouterLink],
  templateUrl: './person-index.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './person-index.component.css',
})
export class PersonIndexComponent extends ModelIndexComponent<Person> {
  /** True while a person is selected and their details are showing. */
  panelOpen = signal(false);

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
