import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { IconComponent } from '../../shared/icon/icon.component';
import { DataChangesService } from '../../shared/service/data-changes.service';
import { ModelListComponent } from '../../shared/model-list.component';
import { compareText } from '../../shared/compare-text';
import { AddressService } from '../../models/address.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  Address,
  fullCityStateZip,
  fullStreetAddress,
  sentYear,
  todayIso,
} from '../../models/address';

export type AddressView = 'cards' | 'list';

@Component({
  selector: 'app-address-list',
  imports: [RouterLink, RouterLinkActive, DatePipe, IconComponent],
  templateUrl: './address-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './address-list.component.css',
})
export class AddressListComponent extends ModelListComponent<Address> {
  readonly currentYear = String(new Date().getFullYear());
  readonly sentYear = sentYear;

  /** Ids of addresses with a mark-sent or delete request in flight. */
  busy = signal<ReadonlySet<string>>(new Set());
  private changes = inject(DataChangesService);

  private setBusy(id: string, on: boolean): void {
    this.busy.update((ids) => {
      const next = new Set(ids);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  /** Sets Last sent to today (in the browser's time zone), then refreshes. */
  markSent(address: Address): void {
    if (this.busy().has(address.id)) {
      return;
    }
    this.setBusy(address.id, true);
    this.itemService.update(address.id, { address: { lastSent: todayIso() } }).subscribe({
      next: () => {
        this.setBusy(address.id, false);
        this.changes.notify();
      },
      error: () => {
        this.setBusy(address.id, false);
        window.alert(`Last sent couldn't be updated for ${this.getListName(address)}. Please try again.`);
      },
    });
  }

  /** Opens the address in the details panel, straight into its edit form. */
  editAddress(address: Address): void {
    this.router.navigate(['/addresses', address.id], { queryParams: { edit: 1 } });
  }

  deleteAddress(address: Address): void {
    if (
      this.busy().has(address.id) ||
      !window.confirm(`Delete ${this.getListName(address)} at ${this.getStreetAddress(address).replace('\n', ', ')}? Everyone who lives there is deleted too.`)
    ) {
      return;
    }
    this.setBusy(address.id, true);
    this.itemService.delete(address.id).subscribe({
      next: () => {
        this.setBusy(address.id, false);
        this.changes.notify();
        // Close the panel if it was showing the deleted address.
        if (this.router.url.split('?')[0].endsWith(`/addresses/${address.id}`)) {
          this.router.navigateByUrl('/addresses');
        }
      },
      error: () => {
        this.setBusy(address.id, false);
        window.alert(`${this.getListName(address)} couldn't be deleted. Please try again.`);
      },
    });
  }

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
