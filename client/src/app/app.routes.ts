import { Routes } from '@angular/router';
import { AddressIndexComponent } from './address/address-index.component';
import { AddressComponent } from './address/address.component';

export const routes: Routes = [
  {
    path: 'addresses',
    component: AddressIndexComponent,
  },
  {
    path: 'addresses:id',
    component: AddressComponent,
  }
];
