import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'edit'
  | 'delete'
  | 'close'
  | 'add'
  | 'save'
  | 'cards'
  | 'list'
  | 'sign-out'
  | 'mail';

/** Outline icons on a 24×24 grid, drawn with the current text color. */
const PATHS: Record<IconName, string[]> = {
  edit: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'],
  delete: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'],
  close: ['M18 6 6 18', 'M6 6l12 12'],
  add: ['M12 5v14', 'M5 12h14'],
  save: ['M20 6 9 17l-5-5'],
  cards: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  mail: ['M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z', 'm3 7 9 6 9-6'],
  'sign-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
};

/**
 * A decorative icon. The button or link around it carries the accessible
 * name (aria-label) and the tooltip (title).
 */
@Component({
  selector: 'app-icon',
  template: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    @for (d of paths(); track $index) {
      <path [attr.d]="d" />
    }
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      width: 1.25rem;
      height: 1.25rem;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  name = input.required<IconName>();
  paths = computed(() => PATHS[this.name()]);
}
