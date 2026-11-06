import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NavigationHistoryService } from './service/navigation-history.service';

@Component({
  selector: 'app-back-button',
  imports: [],
  templateUrl: './back-button.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './back-button.component.css',
})
export class BackButtonComponent {
  private historyService = inject(NavigationHistoryService);

  onClick(): void {
    this.historyService.goBack('/addresses');
  }
}
