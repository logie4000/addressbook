import { httpResource } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ModelService } from '../models/model.service';
import { DataChangesService } from './service/data-changes.service';

@Component({
  selector: 'app-model-index',
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: [],
})
export abstract class ModelIndexComponent<Model> {
  loadComponentResource = httpResource<Model[]>(() => {
    return `${this.modelService.endpointUrl}`;
  });

  private changes = inject(DataChangesService);
  private seenVersion = this.changes.version();

  /** Fetch the list again after a record is saved or deleted. */
  private reloadOnChange = effect(() => {
    const version = this.changes.version();
    if (version !== this.seenVersion) {
      this.seenVersion = version;
      untracked(() => this.loadComponentResource.reload());
    }
  });

  constructor(protected modelService: ModelService<Model>) {}

  isLoading = computed(() => this.loadComponentResource.isLoading());
  error = computed(() => this.loadComponentResource.error());
  values = this.loadComponentResource.value;
}
