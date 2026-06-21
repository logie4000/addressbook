import { Address } from "./address";

export interface Person {
  id: number,
  lastName: string,
  firstName: string,
  address_id: number,
  parent: Person,
  spouse: Person,
  suffix: string,
  address: Address,
}