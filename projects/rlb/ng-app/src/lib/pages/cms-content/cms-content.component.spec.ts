import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmsContentComponent } from './cms-content.component';

describe('CmsContentComponent', () => {
  let component: CmsContentComponent;
  let fixture: ComponentFixture<CmsContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsContentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CmsContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
