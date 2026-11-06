import { HttpErrorResponse, httpResource } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ModelService } from '../models/model.service';
import { DataChangesService } from './service/data-changes.service';

@Component({
  selector: 'app-model',
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: [],
})
export abstract class ModelComponent<Model extends { id: string }> {
  // Record ids are DynamoDB-generated UUID strings.
  id = signal<string>('');
  endpointUrl: string = '';

  /** True while the edit form replaces the details. */
  editing = signal(false);
  saving = signal(false);
  saveError = signal('');

  protected changes = inject(DataChangesService);
  protected router = inject(Router);

  params$ = this.activatedRoute.params.subscribe((params) => {
    var id = params['id'];
    if (id) {
      this.id.set(id);
      // Picking another record leaves any unsaved edit behind.
      this.editing.set(false);
      this.saveError.set('');
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

  // Only the first load shows "Loading…"; a reload after saving keeps the
  // current details on screen.
  isLoading = computed(() => this.loadResource.isLoading() && !this.loadResource.hasValue());
  error = computed(() => this.loadResource.error());
  model = this.loadResource.value;

  startEdit(): void {
    this.saveError.set('');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.saveError.set('');
    this.editing.set(false);
  }

  /** Sends the edit form's changes and shows the saved record. */
  protected save(body: unknown): void {
    const record = this.model();
    if (record) {
      this.saveWith(this.modelService.update(record.id, body));
    }
  }

  /** Runs a save request, then shows the saved record and refreshes the lists. */
  protected saveWith(request: Observable<unknown>): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(false);
        this.loadResource.reload();
        this.changes.notify();
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(describeError(err, 'saved'));
      },
    });
  }

  /** Deletes the record after the user confirms, then closes the panel. */
  protected remove(question: string, listUrl: string): void {
    const record = this.model();
    if (!record || this.saving() || !window.confirm(question)) {
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    this.modelService.delete(record.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.changes.notify();
        this.router.navigateByUrl(listUrl);
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(describeError(err, 'deleted'));
      },
    });
  }
}

/** Turns an API error into a sentence, including Rails validation messages. */
export function describeError(err: unknown, action: string): string {
  if (err instanceof HttpErrorResponse && err.status === 422 && err.error && typeof err.error === 'object') {
    const messages = Object.entries(err.error as Record<string, string[]>).map(
      ([field, problems]) => `${field} ${([] as string[]).concat(problems).join(', ')}`,
    );
    if (messages.length) {
      return `This couldn't be ${action}: ${messages.join('; ')}.`;
    }
  }
  return `This couldn't be ${action}. Please try again.`;
}
