import { Person } from "./person";

export interface Address {
  id: string,
  street1: string,
  street2: string,
  city: string,
  state: string,
  zip: string,
  comments: string,
  /** Date a card was last sent, as YYYY-MM-DD (or null). */
  lastSent: string | null,
  addressee: Person | undefined,
}

/** The year of Last sent, e.g. "2025", or "" if never sent. */
export function sentYear(address: Address): string {
  return address?.lastSent ? address.lastSent.slice(0, 4) : '';
}

/** Today's date in the browser's time zone, as YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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