import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { APP_TITLE } from './app.constants';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the correct title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual(APP_TITLE);
  });

  it('shows the title bar and the side menu', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('.titlebar')?.textContent).toContain(APP_TITLE);
    const links = Array.from(page.querySelectorAll('nav.sidebar a')).map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/addresses', '/people']);
  });
});
