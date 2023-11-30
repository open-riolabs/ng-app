// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { CmsContentComponent } from './cms-content.component';
// import { ActivatedRoute } from '@angular/router';
// import { TranslateModule } from '@ngx-translate/core';
// import { SharedModule } from '../../shared.module';

// describe('CmsContentComponent', () => {
//   let component: CmsContentComponent;
//   let fixture: ComponentFixture<CmsContentComponent>;
//   let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;

//   beforeEach(async () => {
//     await TestBed.configureTestingModule({
//       imports: [
//         SharedModule,
//         TranslateModule.forRoot()
//       ],
//       providers: [
//         { provide: ActivatedRoute, useValue: jasmine.createSpyObj('ActivatedRoute', ["get"]) },
//       ]
//     })
//       .compileComponents();
//     activatedRouteSpy = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
//     activatedRouteSpy.snapshot = {
//       url: ["url/test"],
//       params: {
//         'id': 'id'
//       },
//       queryParams: {},
//       data: {
//         title: "title",
//         subTitle: "subTitle",
//         components: [],
//         apis: []
//       },
//     } as any
//     fixture = TestBed.createComponent(CmsContentComponent);
//     component = fixture.componentInstance;
//     fixture.detectChanges();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });
// });
