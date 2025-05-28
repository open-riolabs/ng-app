import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RlbBootstrapModule } from '@rlb-core/lib-ng-bootstrap';
import { CmsContentComponent } from './pages/cms-content/cms-content.component';
import { CookiesComponent } from './pages/cookies/cookies.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { SupportComponent } from './pages/support/support.component';
import { TermsAndConditionsComponent } from './pages/terms-and-conditions/terms-and-conditions.component';
import { AsMultiPipe, AsSinglePipe } from './pipes/as/as.pipe';
import { CmsPipe } from './pipes/cms/cms.pipe';
import { AppTemplateComponent } from './templates/app/app.component';
import { BaseComponent } from './templates/base/base.component';
import { CmsComponent } from './templates/cms/cms.component';
import { ContentComponent } from './templates/content/content.component';

import { AutolinkPipe, TruncatePipe } from './pipes';
import { LeftComponentPipe } from './pipes/left-component/left-component.pipe';
import { RightComponentPipe } from './pipes/right-component/right-component.pipe';
import { AppContainerComponent } from './templates/app-container/app-container.component';

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
    AppTemplateComponent,
    AppContainerComponent
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
    AppContainerComponent,
    // modules
    TranslateModule,
    RlbBootstrapModule,
    RouterModule,
    FormsModule
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    RlbBootstrapModule,
    RouterModule
  ]
})
export class RlbAppModule { }

