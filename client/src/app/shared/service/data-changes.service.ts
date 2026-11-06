import { Injectable, signal } from '@angular/core';

/**
 * Tells the lists that a record was saved or deleted, so they fetch again
 * and show the change without a page reload.
 */
@Injectable({ providedIn: 'root' })
export class DataChangesService {
  readonly version = signal(0);

  notify(): void {
    this.version.update((v) => v + 1);
  }
}
