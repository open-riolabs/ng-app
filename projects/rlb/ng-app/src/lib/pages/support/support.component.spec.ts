import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportComponent } from './support.component';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../rlb-app.module';
import { AbstractSupportService } from '../../services';

describe('SupportComponent', () => {
  let component: SupportComponent;
  let fixture: ComponentFixture<SupportComponent>;
  let abstractSupportServiceSpy: jasmine.SpyObj<AbstractSupportService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SupportComponent ],
      imports: [
        SharedModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AbstractSupportService, useValue: jasmine.createSpyObj('AbstractSupportService', ["get"])  }
      ]
    })
    .compileComponents();
    abstractSupportServiceSpy = TestBed.inject(AbstractSupportService) as jasmine.SpyObj<AbstractSupportService>;
    fixture = TestBed.createComponent(SupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
