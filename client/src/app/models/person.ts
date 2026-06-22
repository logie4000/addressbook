import { Address } from "./address";

export interface Person {
  id: number,
  lastName: string,
  firstName: string,
  address_id: number,
  parent: Person | undefined,
  spouse: Person | undefined,
  suffix: string,
  address: Address | undefined,
}