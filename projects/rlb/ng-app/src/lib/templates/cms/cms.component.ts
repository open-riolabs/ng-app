import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  AccordionBodyComponent,
  AccordionComponent,
  AccordionHeaderComponent,
  AccordionItemComponent,
  BreadcrumbComponent,
  BreadcrumbItem,
  TabComponent,
  TabContentComponent,
  TabPaneComponent,
  TabsComponent,
} from '@open-rlb/ng-bootstrap';
import { combineLatest, EMPTY, startWith, switchMap } from 'rxjs';
import { AbstractMdService, LanguageService, StrapiService } from '../../services';
import { RLB_CFG_CMS } from '../../configuration';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CmsPipe } from '../../pipes/cms/cms.pipe';

@Component({
  selector: 'rlb-cms-template',
  templateUrl: './cms.component.html',
  styleUrl: './cms.component.scss',
  imports: [
    BreadcrumbComponent,
    TabsComponent,
    TabComponent,
    TabContentComponent,
    TabPaneComponent,
    AccordionComponent,
    AccordionHeaderComponent,
    RouterModule,
    TranslateModule,
    CmsPipe,
    AccordionBodyComponent,
    AccordionItemComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmsComponent {
  private readonly strapiService = inject(StrapiService);
  private readonly languageService = inject(LanguageService);
  private readonly cmsOptions = inject(RLB_CFG_CMS, { optional: true });
  private readonly mdService = inject(AbstractMdService, { optional: true });

  readonly contentId = input<string | undefined>();
  readonly breadcrumbInput = input<BreadcrumbItem[] | undefined>(undefined, {
    alias: 'breadcrumb',
  });
  readonly breadcrumb = computed(() => this.breadcrumbInput() ?? []);

  readonly page = toSignal(
    combineLatest([
      this.languageService.languageChanged$.pipe(
        startWith({ lang: this.languageService.language() } as any),
      ),
      toObservable(this.contentId),
    ]).pipe(
      switchMap(([_, id]) => {
        const lang = this.cmsOptions?.useAppLanguage
          ? this.languageService.language()
          : this.languageService.contentLanguage();
        if (id === undefined) return EMPTY;
        return this.strapiService.fetchPage(lang || this.languageService.defaultLanguage, id);
      }),
    ),
  );

  public md(md: string): string {
    if (this.cmsOptions?.markdown === 'ignore') {
      return md;
    } else {
      if (!this.mdService) {
        throw new Error('No MdService provided');
      } else if (this.cmsOptions?.markdown === 'text') {
        return this.mdService.md2text(md);
      } else if (this.cmsOptions?.markdown === 'html') {
        return this.mdService.md2html(md);
      }
    }
    return md;
  }
}
