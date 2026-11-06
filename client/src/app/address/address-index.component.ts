import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { IconComponent } from '../shared/icon/icon.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModelIndexComponent } from '../shared/model-index.component';
import { Address } from '../models/address';
import { AddressService } from '../models/address.service';
import { AddressListComponent, AddressView } from './address-list/address-list.component';
import { HouseholdService } from '../models/household';
import { householdsToVCard } from '../shared/vcard';
import { saveFile } from '../shared/save-file';
import { todayIso } from '../models/address';

const VIEW_KEY = 'addressbook.addressView';

@Component({
  selector: 'app-address-index',
  imports: [IconComponent, AddressListComponent, RouterOutlet, RouterLink],
  templateUrl: './address-index.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './address-index.component.css',
})
export class AddressIndexComponent extends ModelIndexComponent<Address> {
  /** True while an address is selected and its details are showing. */
  panelOpen = signal(false);

  /** Cards or list; remembered in this browser between visits. */
  view = signal<AddressView>(loadView());

  setView(view: AddressView): void {
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Storage unavailable (e.g. private browsing): the choice lasts until reload.
    }
  }

  /** True while an export is downloading. */
  exporting = signal(false);
  private households = inject(HouseholdService);

  /** Saves the whole address book: the app's JSON format, or vCard 3.0 for contact apps. */
  export(kind: 'json' | 'vcard'): void {
    this.exporting.set(true);
    this.households.exportAll().subscribe({
      next: (file) => {
        this.exporting.set(false);
        const name = `address-book-${todayIso()}`;
        if (kind === 'json') {
          saveFile(`${name}.json`, JSON.stringify(file, null, 2), 'application/json');
        } else {
          saveFile(`${name}.vcf`, householdsToVCard(file.households), 'text/vcard');
        }
      },
      error: () => {
        this.exporting.set(false);
        window.alert("The address book couldn't be exported. Please try again.");
      },
    });
  }

  /** Prints the compact paper layout (see the print styles). */
  print(): void {
    window.print();
  }

  constructor(protected override modelService: AddressService) {
    super(modelService);
  }

  getValues(): Address[] {
    var items = this.values();

    if (items) {
      return items;
    } else {
      return [];
    }
  }
}

function loadView(): AddressView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards';
  } catch {
    return 'cards';
  }
}
