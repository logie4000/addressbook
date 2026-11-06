import { Component, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModelComponent } from '../shared/model.component';
import { Person } from '../models/person';
import { fullCityStateZip, fullStreetAddress } from '../models/address';
import { PersonService } from '../models/person.service';
import { IconComponent } from '../shared/icon/icon.component';

/** One spouse or child row in the household form. */
type MemberForm = FormGroup<{
  id: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
}>;

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

@Component({
  selector: 'app-person',
  imports: [RouterLink, ReactiveFormsModule, IconComponent],
  templateUrl: './person.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './person.component.css',
})
export class PersonComponent extends ModelComponent<Person> {
  constructor(activatedRoute: ActivatedRoute, modelService: PersonService) {
    super(activatedRoute, modelService);
  }

  fullName = computed(() => {
    const person = this.model();
    if (!person) {
      return '';
    }
    return [person.firstName, person.lastName, person.suffix].filter((part) => !!part).join(' ');
  });

  streetAddress = computed(() => {
    const address = this.model()?.address;
    return address ? fullStreetAddress(address) : '';
  });

  cityStateZip = computed(() => {
    const address = this.model()?.address;
    return address ? fullCityStateZip(address) : '';
  });

  // --- Editing the household ------------------------------------------------

  form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: Validators.required }),
    lastName: new FormControl('', { nonNullable: true }),
    suffix: new FormControl('', { nonNullable: true }),
    // Holds zero or one entries.
    spouse: new FormArray<MemberForm>([]),
    children: new FormArray<MemberForm>([]),
  });

  /** Existing spouse and children marked for removal; deleted on save. */
  removedIds = signal<string[]>([]);
  private removedSpouseId = '';

  get spouseArray(): FormArray<MemberForm> {
    return this.form.controls.spouse;
  }

  get childArray(): FormArray<MemberForm> {
    return this.form.controls.children;
  }

  override startEdit(): void {
    const person = this.model();
    if (!person) {
      return;
    }
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
    for (const child of person.children ?? []) {
      this.childArray.push(memberForm(child));
    }
    this.removedIds.set([]);
    this.removedSpouseId = '';
    super.startEdit();
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

  saveHousehold(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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

    this.save({ person });
  }

  deletePerson(): void {
    this.remove(
      `Delete ${this.fullName()}? Their spouse, children and address stay in the address book.`,
      '/people',
    );
  }
}
