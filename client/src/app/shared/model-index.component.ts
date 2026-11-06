import { httpResource } from '@angular/common/http';
import { Component, computed, ChangeDetectionStrategy } from '@angular/core';
import { ModelService } from '../models/model.service';

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

  constructor(protected modelService: ModelService<Model>) {}

  isLoading = computed(() => this.loadComponentResource.isLoading());
  error = computed(() => this.loadComponentResource.error());
  values = this.loadComponentResource.value;
}
