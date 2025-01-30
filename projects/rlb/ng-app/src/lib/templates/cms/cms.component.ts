import { Component, Inject, Input, Optional } from '@angular/core';
import { BreadcrumbItem } from '@rlb-core/lib-ng-bootstrap';
import { EMPTY, Subscription, switchMap } from 'rxjs';
import { LanguageService, Page, StrapiService, AbstractMdService } from '../../services';
import { CmsConfiguration, RLB_CFG_CMS } from '../../configuration';

@Component({
    selector: 'rlb-cms-template',
    templateUrl: './cms.component.html',
    styleUrl: './cms.component.scss',
    standalone: false
})
export class CmsComponent {

  constructor(
    private strapiService: StrapiService,
    private languageService: LanguageService,
    @Inject(RLB_CFG_CMS) @Optional() private cmsOptions: CmsConfiguration,
    @Optional() private mdService?: AbstractMdService
  ) { }

  @Input()
  contentId: string | undefined

  @Input()
  breadcrumb: BreadcrumbItem[] | undefined

  public page: Page | undefined

  private subscriptionLang!: Subscription
  private subscriptionPage!: Subscription

  ngOnDestroy() {
    this.subscriptionLang?.unsubscribe()
    this.subscriptionPage?.unsubscribe()
  }

  ngOnInit() {
    const lang = this.cmsOptions.useAppLanguage ? this.languageService.language : this.languageService.contentLanguage
    const page$ = this.strapiService.fetchPage(lang || this.languageService.defaultLanguage, this.contentId || '')
    this.subscriptionLang = this.languageService.languageChanged$.pipe(
      switchMap(langEvent => {
        if (langEvent.lang) {
          return page$
        }
        return EMPTY
      })).subscribe(p => this.page = p)
    this.subscriptionPage = page$.subscribe(p => this.page = p)
  }

  public md(md: string): string {
    if (this.cmsOptions.markdown === 'ignore') {
      return md;
    }
    else {
      if (!this.mdService) {
        throw new Error('No MdService provided')
      }
      else if (this.cmsOptions.markdown === 'text') {
        return this.mdService.md2text(md)
      }
      else if (this.cmsOptions.markdown === 'html') {
        return this.mdService.md2html(md)
      }
    }
    return md;
  }
}

