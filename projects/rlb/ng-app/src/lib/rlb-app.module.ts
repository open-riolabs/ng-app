import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsContentComponent } from './pages/cms-content/cms-content.component';
import { CookiesComponent } from './pages/cookies/cookies.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { SupportComponent } from './pages/support/support.component';
import { TermsAndConditionsComponent } from './pages/terms-and-conditions/terms-and-conditions.component';
import { CmsPipe } from './pipes/cms/cms.pipe';
import { BaseComponent } from './templates/base/base.component';
import { CmsComponent } from './templates/cms/cms.component';
import { ContentComponent } from './templates/content/content.component';
import { HttpClientModule } from '@angular/common/http';
import { RlbBootstrapModule } from '@rlb/ng-bootstrap'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { AppTemplateComponent } from './templates/app/app.component';
import { AsMultiPipe, AsSinglePipe } from './pipes/as/as.pipe';

import { LeftComponentPipe } from './pipes/left-component/left-component.pipe';
import { RightComponentPipe } from './pipes/right-component/right-component.pipe';
import { AutolinkPipe, TruncatePipe } from './pipes';

@NgModule({
  declarations: [
    // pages
    CmsContentComponent,
    CookiesComponent,
    NotFoundComponent,
    PrivacyComponent,
    SupportComponent,
    TermsAndConditionsComponent,
    // pipes
    CmsPipe,
    AsMultiPipe,
    AsSinglePipe,
    LeftComponentPipe,
    RightComponentPipe,
    TruncatePipe,
    AutolinkPipe,
    // templates
    BaseComponent,
    CmsComponent,
    ContentComponent,
    AppTemplateComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    RlbBootstrapModule,
    RouterModule
  ],
  exports: [
    // pipes
    CmsPipe,
    AsMultiPipe,
    AsSinglePipe,
    LeftComponentPipe,
    RightComponentPipe,
    TruncatePipe,
    AutolinkPipe,
    // templates
    BaseComponent,
    CmsComponent,
    ContentComponent,
    AppTemplateComponent,
    // modules
    TranslateModule,
    HttpClientModule,
    RlbBootstrapModule,
    RouterModule,
    FormsModule
  ]
})
export class RlbAppModule { }
