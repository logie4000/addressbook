import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { fakeAsync, inject, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { PERSON_1 } from '../test/test-data';
import { Person } from './person';

import * as config from '../app.config';
import { PersonService } from './person.service';

describe('PersonService', () => {
    const MODEL_ID = 1;
    let service: PersonService;
    let httpTestingController: HttpTestingController;
  
    beforeEach(() => {
      TestBed.configureTestingModule({      
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
      ]});
      service = TestBed.inject(PersonService);
      httpTestingController = TestBed.inject(HttpTestingController);
    });
  
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  
    it('should fetch model data', fakeAsync(inject([HttpTestingController], (mockHttp: HttpTestingController) => {
      const testData: Person = PERSON_1;
  
      var modelItem = service.fetchData(testData.id);
      
      modelItem.subscribe((s) => {
        expect(s).withContext("service returned stub value").toEqual(testData);
      });
  
      mockHttp.expectOne(`${config.DB_PEOPLE_SERVICE}/${testData.id}`).flush(testData)
      tick();
      mockHttp.verify();
    })));

    it('should return the item URL', () => {
        expect(service.itemUrl(PERSON_1)).toEqual(`/${config.HOST_PEOPLE_SERVICE}/${PERSON_1.id}`)
    })
  });