import { Routes } from '@angular/router';
import { AddressIndexComponent } from './address/address-index.component';
import { AddressComponent } from './address/address.component';
import { PersonIndexComponent } from './person/person-index.component';
import { PersonComponent } from './person/person.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'addresses' },
  {
    path: 'addresses',
    component: AddressIndexComponent,
    // An address's details open in a panel beside the cards.
    children: [{ path: ':id', component: AddressComponent }],
  },
  {
    path: 'people',
    component: PersonIndexComponent,
    // A person's details open in a panel beside the list.
    children: [{ path: ':id', component: PersonComponent }],
  },
];
