import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModelIndexComponent } from '../shared/model-index.component';
import { Address } from '../models/address';
import { AddressService } from '../models/address.service';
import { AddressListComponent, AddressView } from './address-list/address-list.component';

const VIEW_KEY = 'addressbook.addressView';

@Component({
  selector: 'app-address-index',
  imports: [AddressListComponent, RouterOutlet, RouterLink],
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
