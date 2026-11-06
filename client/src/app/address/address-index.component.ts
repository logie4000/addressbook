import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModelIndexComponent } from '../shared/model-index.component';
import { Address } from '../models/address';
import { AddressService } from '../models/address.service';
import { AddressListComponent } from './address-list/address-list.component';

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
