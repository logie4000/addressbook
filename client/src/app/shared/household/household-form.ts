import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { Person } from '../../models/person';
import { compareText } from '../compare-text';

/** One spouse or child row in the household form. */
export type MemberForm = FormGroup<{
  id: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
}>;

/** Children by first name, since the API returns them in no fixed order. */
export function sortChildren(children: Person[] | undefined): Person[] {
  return [...(children ?? [])].sort((a, b) => compareText(a.firstName, b.firstName));
}

function memberForm(member?: Partial<Person>): MemberForm {
  return new FormGroup({
    id: new FormControl(member?.id ?? '', { nonNullable: true }),
    firstName: new FormControl(member?.firstName ?? '', {
      nonNullable: true,
      validators: Validators.required,
    }),
    lastName: new FormControl(member?.lastName ?? '', { nonNullable: true }),
  });
}

/**
 * The household part of an edit form: the household head's name, their
 * spouse and their children. Used by both the person and address panels,
 * and turned into the people API's nested attributes on save.
 */
export class HouseholdForm {
  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true }),
    suffix: new FormControl('', { nonNullable: true }),
    // Holds zero or one entries.
    spouse: new FormArray<MemberForm>([]),
    children: new FormArray<MemberForm>([]),
  });

  /** Existing spouse and children marked for removal; deleted on save. */
  readonly removedIds = signal<string[]>([]);
  private removedSpouseId = '';

  get spouseArray(): FormArray<MemberForm> {
    return this.form.controls.spouse;
  }

  get childArray(): FormArray<MemberForm> {
    return this.form.controls.children;
  }

  get invalid(): boolean {
    return this.form.invalid;
  }

  /** Fills the form from the household head as the API returned them. */
  load(person: Person): void {
    this.form.reset({
      firstName: person.firstName ?? '',
      lastName: person.lastName ?? '',
      suffix: person.suffix ?? '',
    });
    this.spouseArray.clear();
    if (person.spouse) {
      this.spouseArray.push(memberForm(person.spouse));
    }
    this.childArray.clear();
    for (const child of sortChildren(person.children)) {
      this.childArray.push(memberForm(child));
    }
    this.removedIds.set([]);
    this.removedSpouseId = '';
  }

  /** A new spouse can be added once any removed spouse has been saved away. */
  canAddSpouse(): boolean {
    return this.spouseArray.length === 0 && !this.removedSpouseId;
  }

  addSpouse(): void {
    this.spouseArray.push(memberForm({ lastName: this.form.controls.lastName.value }));
  }

  removeSpouse(): void {
    const id = this.spouseArray.at(0)?.controls.id.value;
    if (id) {
      this.removedSpouseId = id;
      this.removedIds.update((ids) => [...ids, id]);
    }
    this.spouseArray.clear();
  }

  addChild(): void {
    this.childArray.push(memberForm({ lastName: this.form.controls.lastName.value }));
  }

  removeChild(index: number): void {
    const id = this.childArray.at(index).controls.id.value;
    if (id) {
      this.removedIds.update((ids) => [...ids, id]);
    }
    this.childArray.removeAt(index);
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  /** The `person` body for PATCH /people/:id. */
  toPersonParams(): Record<string, unknown> {
    const values = this.form.getRawValue();
    const member = (m: { id: string; firstName: string; lastName: string }) => ({
      ...(m.id ? { id: m.id } : {}),
      firstName: m.firstName.trim(),
      lastName: m.lastName.trim(),
    });
    const removedChildren = this.removedIds()
      .filter((id) => id !== this.removedSpouseId)
      .map((id) => ({ id, _destroy: '1' }));

    const person: Record<string, unknown> = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      suffix: values.suffix.trim(),
      children_attributes: [...values.children.map(member), ...removedChildren],
    };
    if (values.spouse.length) {
      person['spouse_attributes'] = member(values.spouse[0]);
    } else if (this.removedSpouseId) {
      person['spouse_attributes'] = { id: this.removedSpouseId, _destroy: '1' };
    }
    return person;
  }
}
