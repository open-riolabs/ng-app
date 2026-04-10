import { ChangeDetectionStrategy, Component, computed, Inject, input, Optional } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { BreadcrumbItem } from '@open-rlb/ng-bootstrap';
import { combineLatest, EMPTY, startWith, switchMap } from 'rxjs';
import { LanguageService, Page, StrapiService, AbstractMdService } from '../../services';
import { CmsConfiguration, RLB_CFG_CMS } from '../../configuration';

@Component({
    selector: 'rlb-cms-template',
    templateUrl: './cms.component.html',
    styleUrl: './cms.component.scss',
    standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsComponent {

  readonly contentId = input<string | undefined>();
  readonly breadcrumbInput = input<BreadcrumbItem[] | undefined>(undefined, { alias: 'breadcrumb' });
  readonly breadcrumb = computed(() => this.breadcrumbInput() ?? []);

  readonly page = toSignal(
    combineLatest([
      this.languageService.languageChanged$.pipe(startWith({ lang: this.languageService.language() } as any)),
      toObservable(this.contentId)
    ]).pipe(
      switchMap(([_, id]) => {
        const lang = this.cmsOptions.useAppLanguage ? this.languageService.language() : this.languageService.contentLanguage();
        if (id === undefined) return EMPTY;
        return this.strapiService.fetchPage(lang || this.languageService.defaultLanguage, id);
      })
    )
  );

  constructor(
    private strapiService: StrapiService,
    private languageService: LanguageService,
    @Inject(RLB_CFG_CMS) @Optional() private cmsOptions: CmsConfiguration,
    @Optional() private mdService?: AbstractMdService
  ) { }

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


