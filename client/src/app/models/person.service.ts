import { Injectable } from "@angular/core";
import { ModelService } from "./model.service";
import { Person } from "./person";

@Injectable({
  providedIn: 'root'
})
export class PersonService extends ModelService<Person> {
  override endpointUrl: string = '';
  override api = '';

  override itemUrl(person: Person): string {
    return ``
  }
}