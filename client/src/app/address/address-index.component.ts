import { Component } from '@angular/core';
import { ModelIndexComponent } from '../shared/model-index.component';
import { Address } from '../models/address';
import { AddressService } from '../models/address.service';

@Component({
  selector: 'app-address-index',
  imports: [],
  templateUrl: './address-index.component.html',
  styleUrl: './address-index.component.css'
})
export class AddressIndexComponent extends ModelIndexComponent<Address> {

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
