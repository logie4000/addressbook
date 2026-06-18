import { Injectable } from "@angular/core";
import { ModelService } from "./model.service";
import { Address } from "./address";

@Injectable({
  providedIn: 'root'
})
export class AddressService extends ModelService<Address> {
  override endpointUrl: string = '';
  override api = '';

  override itemUrl(address: Address): string {
    return ``
  }
}