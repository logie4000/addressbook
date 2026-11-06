import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { ModelListComponent } from '../../shared/model-list.component';
import { compareText } from '../../shared/compare-text';
import { AddressService } from '../../models/address.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  Address,
  fullCityStateZip,
  fullStreetAddress,
} from '../../models/address';

export type AddressView = 'cards' | 'list';

@Component({
  selector: 'app-address-list',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './address-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './address-list.component.css',
})
export class AddressListComponent extends ModelListComponent<Address> {
  /** Cards in a grid, or one row per address. */
  view = input<AddressView>('cards');

  /** Addresses ordered by the addressee's last name, then first name. */
  sorted = computed(() =>
    [...(this.itemList() ?? [])].sort(
      (a, b) =>
        compareText(a.addressee?.lastName, b.addressee?.lastName) ||
        compareText(a.addressee?.firstName, b.addressee?.firstName),
    ),
  );
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

  /** "Martin, Alice (Ben)", or "Rivera, Carlos (Dana Smith)" when the spouse's last name differs. */
  getListName(address: Address): string {
    const person = address.addressee;
    if (!person) {
      return '(no addressee)';
    }

    let name = [person.lastName, person.firstName].filter((part) => !!part).join(', ');
    if (person.suffix) {
      name += ` ${person.suffix}`;
    }

    const spouse = person.spouse;
    if (spouse) {
      const spouseName =
        spouse.lastName && spouse.lastName !== person.lastName
          ? `${spouse.firstName} ${spouse.lastName}`
          : spouse.firstName;
      if (spouseName) {
        name += ` (${spouseName})`;
      }
    }

    return name;
  }

  /** "Chloe, Danny": a child's last name only when it differs from the addressee's. */
  getChildNames(address: Address): string {
    const person = address.addressee;
    // Alphabetical, since the API returns children in no particular order.
    return [...(person?.children ?? [])]
      .sort((a, b) => compareText(a.firstName, b.firstName))
      .map((child) =>
        child.lastName && child.lastName !== person!.lastName
          ? `${child.firstName} ${child.lastName}`
          : child.firstName,
      )
      .filter((name) => !!name)
      .join(', ');
  }

  getStreetAddress(address: Address) {
    return `${fullStreetAddress(address)}`;
  }

  getCityStateZip(address: Address) {
    return `${fullCityStateZip(address)}`;
  }
}
