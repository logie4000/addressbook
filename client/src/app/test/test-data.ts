import { Address } from "../models/address";
import { Person } from "../models/person";

export const ADDRESS_1: Address = {
  id: "1",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  comments: "",
  lastSent: null,
  addressee: {
    id: "",
    lastName: "",
    firstName: "",
    children: [],
    parent: undefined,
    spouse: undefined,
    suffix: "",
    address: undefined,
  }
};

export const ADDRESS_2: Address = {
  id: "2",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  comments: "",
  lastSent: null,
  addressee: {
    id: "",
    lastName: "",
    firstName: "",
    children: [],
    parent: undefined,
    spouse: undefined,
    suffix: "",
    address: undefined,
  }
};

export const PERSON_1: Person = {
  id: "1",
  lastName: "",
  firstName: "",
  children: [],
  parent: undefined,
  spouse: undefined,
  suffix: "",
  address: undefined
}