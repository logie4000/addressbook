import { Injectable } from "@angular/core";
import { ModelService } from "./model.service";
import { Address } from "./address";

import * as config from '../app.config'

@Injectable({
  providedIn: 'root'
})
export class AddressService extends ModelService<Address> {
  override endpointUrl: string = config.DB_ADDRESS_SERVICE;
  override api = config.HOST_ADDRESS_SERVICE;

  override itemUrl(address: Address): string {
    return `/${config.HOST_ADDRESS_SERVICE}/${address.id}`
  }
}