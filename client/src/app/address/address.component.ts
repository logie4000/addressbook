import { Component, computed } from '@angular/core';
import { ModelComponent } from '../shared/model.component';
import { Address, fullCityStateZip, fullStreetAddress } from '../models/address';
import { ActivatedRoute } from '@angular/router';
import { AddressService } from '../models/address.service';
import { Person } from '../models/person';
import { BackButtonComponent } from "../shared/back-button.component";

@Component({
  selector: 'app-address',
  imports: [BackButtonComponent],
  templateUrl: './address.component.html',
  styleUrl: './address.component.css'
})
export class AddressComponent extends ModelComponent<Address>{

  constructor(activatatedRoute: ActivatedRoute, modelService: AddressService) {
    super(activatatedRoute, modelService);
  }
  
  title = computed(() => {
    if (this.isLoading()) {
      return "Loading...";
    }

    var ret_val = "";
    var addressee = this.model()?.addressee;
    if (addressee) {
      ret_val = `${addressee.lastName}`;

      if (addressee.spouse && addressee.spouse.lastName != addressee.lastName) {
        ret_val += ` / ${addressee.spouse.lastName}`;
      }
    }

    return ret_val;
  })

  full_resident_name = computed(() => {
    if (this.isLoading()) {
      return "Loading...";
    }

    var ret_val = "";
    var addressee = this.model()?.addressee;
    if (addressee) {
      ret_val = `${addressee.firstName} ${addressee.lastName}`;

      if (addressee.spouse) {
        ret_val += ` & ${addressee.spouse.firstName} ${addressee.spouse.lastName} `
      }
    }

    return ret_val;
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

  showChildren = computed(() => {
    var children = this.child_units();
    return children.length > 0;
  })

  child_units = computed<Person[]>(() => {
    var address = this.model();
    if (address && address.addressee?.children) {
      var children = address.addressee?.children

      return children;
    }

    return [];
  })
}
