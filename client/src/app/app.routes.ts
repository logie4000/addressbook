import { Routes } from '@angular/router';
import { AddressIndexComponent } from './address/address-index.component';
import { AddressComponent } from './address/address.component';
import { PersonIndexComponent } from './person/person-index.component';
import { PersonComponent } from './person/person.component';

export const routes: Routes = [
  {
    path: 'addresses',
    component: AddressIndexComponent,
  },
  {
    path: 'addresses/:id',
    component: AddressComponent,
  },
  {
    path: 'people',
    component: PersonIndexComponent,
  },
  {
    path: 'people/:id',
    component: PersonComponent,
  }
];
