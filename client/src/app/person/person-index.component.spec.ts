import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonIndexComponent } from './person-index.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PersonIndexComponent', () => {
  let component: PersonIndexComponent;
  let fixture: ComponentFixture<PersonIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
      ],
      imports: [PersonIndexComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
