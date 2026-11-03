import { Address } from "./address";

export interface Person {
  id: string,
  lastName: string,
  firstName: string,
  parent: Person | undefined,
  spouse: Person | undefined,
  suffix: string,
  address: Address | undefined,
  children: Person[],
}