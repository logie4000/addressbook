import { Component, computed } from '@angular/core';
import { ModelComponent } from '../shared/model.component';
import { Address, fullCityStateZip, fullStreetAddress } from '../models/address';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [],
  templateUrl: './address.component.html',
  styleUrl: './address.component.css'
})
export class AddressComponent extends ModelComponent<Address>{

  full_resident_name = computed(() => {
    if (this.isLoading()) {
      return "Loading...";
    }

    var addressee = this.model()?.addressee;
    if (addressee) {
      return `${addressee.firstName} ${addressee.lastName}`;
    } else {
      return "Unknown"
    }
  })

  street_address = computed(() => {
    if (this.isLoading()) {
      return "Loading..."
    }

    var address = this.model();
    if (address) {
      return fullStreetAddress(address);
    } else {
      return "NO STREET ADDRESS"
    }
  })

  city_state_zip = computed(() => {
        if (this.isLoading()) {
      return "Loading..."
    }

    var address = this.model()
    if (address) {
      return fullCityStateZip(address);
    } else {
      return "NO CITY"
    }
  })
}
