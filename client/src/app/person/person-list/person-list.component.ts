import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Person } from '../../models/person';
import { ModelListComponent } from '../../shared/model-list.component';
import { PersonService } from '../../models/person.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-person-list',
  imports: [],
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
}
