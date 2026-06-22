import { Person } from "./person";

export interface Address {
  id: number,
  street1: string,
  street2: string,
  city: string,
  state: string,
  zip: string,
  comments: string,
  lastSent: string,
  addressee: Person | undefined,
}

export function fullStreetAddress (address: Address) {
    if (address && address.street2 && address.street2 != "") {
      return `${address.street1}\n${address.street2}`
    } else if (address) {
      return `${address.street1}`
    } else {
      return "No Street Address"
    }
}

export function fullCityStateZip(address: Address) {
    if (address) {
      var ret_val = `${address.city}`

      if (address.state) {
        ret_val += `, ${address.state}`
      }

      if (address.zip) {
        ret_val += ` ${address.zip}`
      }

      return ret_val;
    } else {
      return "No City Data"
    }
}