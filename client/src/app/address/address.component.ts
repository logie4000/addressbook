import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModelComponent } from '../shared/model.component';
import {
  Address,
  fullCityStateZip,
  fullStreetAddress,
} from '../models/address';
import { ActivatedRoute } from '@angular/router';
import { AddressService } from '../models/address.service';
import { Person } from '../models/person';
import { IconComponent } from '../shared/icon/icon.component';
import { PersonService } from '../models/person.service';
import { HouseholdForm, sortChildren } from '../shared/household/household-form';
import { HouseholdFieldsComponent } from '../shared/household/household-fields.component';

@Component({
  selector: 'app-address',
  imports: [ReactiveFormsModule, IconComponent, HouseholdFieldsComponent],
  templateUrl: './address.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './address.component.css',
})
export class AddressComponent extends ModelComponent<Address> {
  constructor(activatatedRoute: ActivatedRoute, modelService: AddressService) {
    super(activatatedRoute, modelService);
  }

  form = new FormGroup({
    street1: new FormControl('', { nonNullable: true, validators: Validators.required }),
    street2: new FormControl('', { nonNullable: true }),
    city: new FormControl('', { nonNullable: true, validators: Validators.required }),
    state: new FormControl('', { nonNullable: true }),
    zip: new FormControl('', { nonNullable: true }),
    lastSent: new FormControl('', { nonNullable: true }),
    comments: new FormControl('', { nonNullable: true }),
  });

  override startEdit(): void {
    const address = this.model();
    if (!address) {
      return;
    }
    this.form.reset({
      street1: address.street1 ?? '',
      street2: address.street2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      zip: address.zip ?? '',
      lastSent: address.lastSent ?? '',
      comments: address.comments ?? '',
    });
    if (address.addressee) {
      this.household.load(address.addressee);
    }
    super.startEdit();
  }

  /** The people at this address; edited in the same form. */
  household = new HouseholdForm();
  private people = inject(PersonService);

  saveAddress(): void {
    const address = this.model();
    const addressee = address?.addressee;
    if (!address || this.form.invalid || (addressee && this.household.invalid)) {
      this.form.markAllAsTouched();
      this.household.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const fields = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    );

    if (addressee) {
      // One request saves the household and, nested in it, the address.
      this.saveWith(
        this.people.update(addressee.id, {
          person: {
            ...this.household.toPersonParams(),
            address_attributes: { id: address.id, ...fields },
          },
        }),
      );
    } else {
      this.save({ address: fields });
    }
  }

  deleteAddress(): void {
    this.remove(
      `Delete ${this.street_address().replace('\n', ', ')}? Everyone who lives there is deleted too.`,
      '/addresses',
    );
  }

  title = computed(() => {
    if (this.isLoading()) {
      return 'Loading...';
    }

    var ret_val = '';
    var addressee = this.model()?.addressee;
    if (addressee) {
      ret_val = `${addressee.lastName}`;

      if (addressee.spouse && addressee.spouse.lastName != addressee.lastName) {
        ret_val += ` / ${addressee.spouse.lastName}`;
      }
    }

    return ret_val;
  });

  full_resident_name = computed(() => {
    if (this.isLoading()) {
      return 'Loading...';
    }

    var ret_val = '';
    var addressee = this.model()?.addressee;
    if (addressee) {
      ret_val = `${addressee.firstName} ${addressee.lastName}`;

      if (addressee.spouse) {
        ret_val += ` & ${addressee.spouse.firstName} ${addressee.spouse.lastName}`;
      }
    }

    return ret_val;
  });

  street_address = computed(() => {
    if (this.isLoading()) {
      return 'Loading...';
    }

    var address = this.model();
    if (address) {
      return fullStreetAddress(address);
    } else {
      return 'NO STREET ADDRESS';
    }
  });

  city_state_zip = computed(() => {
    if (this.isLoading()) {
      return 'Loading...';
    }

    var address = this.model();
    if (address) {
      return fullCityStateZip(address);
    } else {
      return 'NO CITY';
    }
  });

  showChildren = computed(() => {
    var children = this.child_units();
    return children.length > 0;
  });

  child_units = computed<Person[]>(() => {
    var address = this.model();
    if (address && address.addressee?.children) {
      return sortChildren(address.addressee.children);
    }

    return [];
  });
}
