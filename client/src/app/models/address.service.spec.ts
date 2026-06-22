import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AddressService } from "./address.service";
import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ADDRESS_1 } from '../test/test-data';
import { Address } from './address';

import * as config from '../app.config';

describe('AddressService', () => {
    const MODEL_ID = 1;
    let service: AddressService;
    let httpTestingController: HttpTestingController;
  
    beforeEach(() => {
      TestBed.configureTestingModule({      
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
      ]});
      service = TestBed.inject(AddressService);
      httpTestingController = TestBed.inject(HttpTestingController);
    });
  
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  
    it('should fetch model data', fakeAsync(inject([HttpTestingController], (mockHttp: HttpTestingController) => {
      const testData: Address = ADDRESS_1;
  
      var modelItem = service.fetchData(testData.id);
      
      modelItem.subscribe((s) => {
        expect(s).withContext("service returned stub value").toEqual(testData);
      });
  
      mockHttp.expectOne(`${config.DB_ADDRESS_SERVICE}/${testData.id}`).flush(testData)
      tick();
      mockHttp.verify();
    })));

    it('should return the item URL', () => {
        expect(service.itemUrl(ADDRESS_1)).toEqual(`/${config.HOST_ADDRESS_SERVICE}/${ADDRESS_1.id}`)
    })
  });