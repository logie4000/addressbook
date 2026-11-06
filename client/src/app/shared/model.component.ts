import { httpResource } from '@angular/common/http';
import {
  Component,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModelService } from '../models/model.service';

@Component({
  selector: 'app-model',
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: [],
})
export abstract class ModelComponent<Model> {
  // Record ids are DynamoDB-generated UUID strings.
  id = signal<string>('');
  endpointUrl: string = '';

  params$ = this.activatedRoute.params.subscribe((params) => {
    var id = params['id'];
    if (id) {
      this.id.set(id);
    }
  });

  loadResource = httpResource<Model>(() => {
    if (!this.id()) {
      return undefined;
    }

    return `${this.modelService.endpointUrl}/${this.id()}`;
  });

  constructor(
    protected activatedRoute: ActivatedRoute,
    protected modelService: ModelService<Model>,
  ) {}

  isLoading = computed(() => this.loadResource.isLoading());
  error = computed(() => this.loadResource.error());
  model = this.loadResource.value;
}
