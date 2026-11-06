import { Injectable } from "@angular/core";
import { ModelService } from "./model.service";
import { Person } from "./person";

import * as config from '../app.constants'

@Injectable({
  providedIn: 'root'
})
export class PersonService extends ModelService<Person> {
  override endpointUrl: string = config.DB_PEOPLE_SERVICE;
  override api = config.HOST_PEOPLE_SERVICE;

  override itemUrl(person: Person): string {
    return `/${config.HOST_PEOPLE_SERVICE}/${person.id}`
  }
}