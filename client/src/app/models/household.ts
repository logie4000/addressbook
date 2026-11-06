import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import * as config from '../app.constants';

/** One person in an exported household. */
export interface HouseholdPerson {
  id?: string;
  firstName: string | null;
  lastName: string | null;
  suffix?: string | null;
}

/** An address with the people who live there, as GET /households returns it. */
export interface Household {
  id?: string;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  /** YYYY-MM-DD */
  lastSent: string | null;
  comments: string | null;
  addressee: HouseholdPerson | null;
  spouse: HouseholdPerson | null;
  children: HouseholdPerson[];
}

/** The whole address book in the app's own export format. */
export interface HouseholdFile {
  format: 'addressbook-households';
  version: number;
  exportedAt: string;
  households: Household[];
}

@Injectable({ providedIn: 'root' })
export class HouseholdService {
  private http = inject(HttpClient);

  exportAll(): Observable<HouseholdFile> {
    return this.http.get<HouseholdFile>(config.DB_HOUSEHOLDS_SERVICE);
  }
}
