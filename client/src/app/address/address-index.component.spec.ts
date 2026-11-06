import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressIndexComponent } from './address-index.component';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AddressService } from '../models/address.service';

describe('AddressIndexComponent', () => {
  let component: AddressIndexComponent;
  let fixture: ComponentFixture<AddressIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
      imports: [AddressIndexComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
