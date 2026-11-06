import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ModelListComponent } from '../../shared/model-list.component';
import { AddressService } from '../../models/address.service';
import { Router, RouterLink } from '@angular/router';
import {
  Address,
  fullCityStateZip,
  fullStreetAddress,
} from '../../models/address';

@Component({
  selector: 'app-address-list',
  imports: [RouterLink],
  templateUrl: './address-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './address-list.component.css',
})
export class AddressListComponent extends ModelListComponent<Address> {
  constructor(
    protected override itemService: AddressService,
    protected override router: Router,
  ) {
    super(itemService, router);
  }

  getResident(address: Address) {
    var ret_val = `${address.addressee?.lastName}`;

    if (address.addressee?.spouse) {
      if (address.addressee?.spouse.lastName != address.addressee.lastName) {
        ret_val += ` / ${address.addressee?.spouse?.lastName}`;
      }
    }

    return ret_val;
  }

  /** "Alice & Ben", or just "Grace" when there's no spouse. */
  getFirstNames(address: Address): string {
    const names = [address.addressee?.firstName, address.addressee?.spouse?.firstName];
    return names.filter((name) => !!name).join(' & ');
  }

  getStreetAddress(address: Address) {
    return `${fullStreetAddress(address)}`;
  }

  getCityStateZip(address: Address) {
    return `${fullCityStateZip(address)}`;
  }
}
