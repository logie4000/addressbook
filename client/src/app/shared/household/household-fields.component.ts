import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { HouseholdForm } from './household-form';

/** The household name, spouse and children fields, inside an edit form. */
@Component({
  selector: 'app-household-fields',
  imports: [ReactiveFormsModule, IconComponent],
  templateUrl: './household-fields.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HouseholdFieldsComponent {
  household = input.required<HouseholdForm>();
}
